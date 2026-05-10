/**
 * Job de sincronización mensual de licencias activas B2B
 *
 * Se ejecuta el día 28 de cada mes (antes de que Stripe genere la factura del día 1).
 * Para cada empresa activa:
 *   1. Cuenta los empleados con lastActiveAt en los últimos 30 días
 *   2. Actualiza la quantity en Stripe para que la factura refleje las licencias reales
 *   3. Inserta un snapshot en companyBillingSnapshots para auditoría
 *   4. Envía email de resumen previo a la empresa
 *   5. Notifica al owner de BuddyMarket con el total estimado
 */

import { eq, and, gte, isNotNull } from "drizzle-orm";
import { getDb } from "../db";
import { companies, companyMembers, companyBillingSnapshots } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { sendBillingPreviewEmail } from "../email";
import { B2B_PLANS } from "../stripe-b2b-products";

/** Definición de "licencia activa": empleado que ha usado la app en los últimos 30 días */
const ACTIVE_DAYS_THRESHOLD = 30;

export interface BillingSyncResult {
  companiesProcessed: number;
  totalActiveLicenses: number;
  totalEstimatedRevenue: number;
  errors: string[];
}

/**
 * Sincroniza las licencias activas de todas las empresas con Stripe.
 * Llama a esta función desde el scheduler o manualmente desde el admin.
 */
export async function syncActiveLicenses(): Promise<BillingSyncResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const result: BillingSyncResult = {
    companiesProcessed: 0,
    totalActiveLicenses: 0,
    totalEstimatedRevenue: 0,
    errors: [],
  };

  // Obtener todas las empresas activas con suscripción Stripe
  const activeCompanies = await db
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.status, "active"),
        isNotNull(companies.stripeSubscriptionId),
      )
    );

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - ACTIVE_DAYS_THRESHOLD * 24 * 60 * 60 * 1000);

  // Período de facturación: mes actual
  const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  for (const company of activeCompanies) {
    try {
      // 1. Contar empleados activos en los últimos 30 días
      const activeMembersResult = await db
        .select({ count: companyMembers.id })
        .from(companyMembers)
        .where(
          and(
            eq(companyMembers.companyId, company.id),
            eq(companyMembers.isActive, true),
            gte(companyMembers.lastActiveAt, thirtyDaysAgo),
          )
        );

      const activeLicenses = activeMembersResult.length;

      // Precio por licencia según el plan
      const planConfig = B2B_PLANS[company.plan as keyof typeof B2B_PLANS];
      if (!planConfig) {
        result.errors.push(`Empresa ${company.id}: plan desconocido "${company.plan}"`);
        continue;
      }
      const pricePerLicense = planConfig.pricePerEmployee;
      const totalAmount = activeLicenses * pricePerLicense;

      // 2. Actualizar quantity en Stripe
      let stripeSubscriptionItemId: string | null = null;
      if (company.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            company.stripeSubscriptionId,
            { expand: ["items"] }
          );

          const subscriptionItem = subscription.items.data[0];
          if (subscriptionItem) {
            stripeSubscriptionItemId = subscriptionItem.id;

            // Solo actualizar si la quantity ha cambiado
            if (subscriptionItem.quantity !== activeLicenses) {
              await stripe.subscriptionItems.update(subscriptionItem.id, {
                quantity: Math.max(activeLicenses, 1), // mínimo 1 para no cancelar
                proration_behavior: "none", // no prorratear, aplicar en el siguiente ciclo
              });
              console.log(
                `[BillingSync] Empresa ${company.id} (${company.name}): ` +
                `${subscriptionItem.quantity} → ${activeLicenses} licencias activas`
              );
            }
          }
        } catch (stripeErr) {
          result.errors.push(
            `Empresa ${company.id}: error actualizando Stripe — ${(stripeErr as Error).message}`
          );
        }
      }

      // 3. Insertar o actualizar snapshot de facturación
      const existingSnapshot = await db
        .select({ id: companyBillingSnapshots.id })
        .from(companyBillingSnapshots)
        .where(
          and(
            eq(companyBillingSnapshots.companyId, company.id),
            eq(companyBillingSnapshots.billingPeriodStart, billingPeriodStart),
          )
        )
        .limit(1);

      if (existingSnapshot.length > 0) {
        // Actualizar snapshot existente
        await db
          .update(companyBillingSnapshots)
          .set({
            activeLicenses,
            pricePerLicense: pricePerLicense.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            stripeSubscriptionItemId,
            updatedAt: now,
          })
          .where(eq(companyBillingSnapshots.id, existingSnapshot[0].id));
      } else {
        // Crear nuevo snapshot
        await db.insert(companyBillingSnapshots).values({
          companyId: company.id,
          billingPeriodStart,
          billingPeriodEnd,
          activeLicenses,
          pricePerLicense: pricePerLicense.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          stripeSubscriptionItemId,
          status: "pending",
        });
      }

      // 4. Actualizar contador en la tabla companies
      await db
        .update(companies)
        .set({ licensesActive: activeLicenses, updatedAt: now })
        .where(eq(companies.id, company.id));

      // 5. Enviar email de resumen previo a la empresa
      if (company.contactEmail) {
        try {
          await sendBillingPreviewEmail({
            to: company.contactEmail,
            companyName: company.name,
            activeLicenses,
            pricePerLicense,
            totalAmount,
            billingDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          });
        } catch (emailErr) {
          // No bloquear el proceso si el email falla
          console.warn(`[BillingSync] Email fallido para empresa ${company.id}:`, emailErr);
        }
      }

      result.companiesProcessed++;
      result.totalActiveLicenses += activeLicenses;
      result.totalEstimatedRevenue += totalAmount;

    } catch (err) {
      result.errors.push(`Empresa ${company.id}: ${(err as Error).message}`);
      console.error(`[BillingSync] Error procesando empresa ${company.id}:`, err);
    }
  }

  // 6. Notificar al owner con el resumen
  try {
    await notifyOwner({
      title: `📊 Sincronización de licencias B2B — ${now.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`,
      content: [
        `Empresas procesadas: ${result.companiesProcessed}`,
        `Total licencias activas: ${result.totalActiveLicenses}`,
        `Ingresos estimados próximo ciclo: ${result.totalEstimatedRevenue.toFixed(2)} €`,
        result.errors.length > 0
          ? `⚠️ Errores (${result.errors.length}): ${result.errors.slice(0, 3).join(" | ")}`
          : "✅ Sin errores",
      ].join("\n"),
    });
  } catch (_) {
    // Notificación no crítica
  }

  console.log(
    `[BillingSync] Completado: ${result.companiesProcessed} empresas, ` +
    `${result.totalActiveLicenses} licencias activas, ` +
    `${result.totalEstimatedRevenue.toFixed(2)} € estimados`
  );

  return result;
}

/**
 * Marca un snapshot como pagado cuando Stripe confirma el pago de la factura.
 * Llamar desde el webhook invoice.paid.
 */
export async function markSnapshotPaid(
  stripeInvoiceId: string,
  companyId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(companyBillingSnapshots)
    .set({
      stripeInvoiceId,
      status: "paid",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(companyBillingSnapshots.companyId, companyId),
        eq(companyBillingSnapshots.status, "confirmed"),
      )
    );
}

/**
 * Marca un snapshot como confirmado cuando Stripe genera la factura.
 * Llamar desde el webhook invoice.created.
 */
export async function markSnapshotConfirmed(
  stripeInvoiceId: string,
  companyId: number,
  activeLicenses: number,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  await db
    .update(companyBillingSnapshots)
    .set({
      stripeInvoiceId,
      status: "confirmed",
      activeLicenses,
      updatedAt: now,
    })
    .where(
      and(
        eq(companyBillingSnapshots.companyId, companyId),
        eq(companyBillingSnapshots.billingPeriodStart, billingPeriodStart),
      )
    );
}
