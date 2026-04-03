import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    // Raw body needed for signature verification - must be registered before express.json()
    // This is handled by placing this route registration BEFORE express.json() in index.ts
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      try {
        if (!webhookSecret || !sig) {
          console.warn("[Stripe Webhook] Missing secret or signature");
          return res.status(400).json({ error: "Missing webhook secret or signature" });
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
            const plan = (session.metadata?.plan as "basic" | "premium" | "pro_max") || "basic";

            if (userId && session.subscription) {
              await db.upsertUserSubscription(userId, {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                status: "active",
                plan,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });
              console.log(`[Stripe] Subscription activated for user ${userId}, plan: ${plan}`);

              // ── Referral: register the subscription for recurring commissions ──
              await handleReferralOnCheckout({
                userId,
                stripeSubscriptionId: session.subscription as string,
                stripeCustomerId: session.customer as string,
                plan,
                session,
              });
            }
            break;
          }

          case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            console.log(`[Stripe] Subscription updated: ${sub.id}, status: ${sub.status}`);
            // Mark referral subscription as inactive if cancelled
            if (sub.status === "canceled" || sub.status === "unpaid") {
              await cancelReferralSubscription(sub.id);
            }
            break;
          }

          case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;
            console.log(`[Stripe] Subscription cancelled: ${sub.id}`);
            await cancelReferralSubscription(sub.id);
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`[Stripe] Invoice paid: ${invoice.id}`);
            // ── Referral: pay 20% commission on every recurring invoice ──
            const invoiceSubId = (invoice as any).subscription;
            if (invoiceSubId && invoice.billing_reason === "subscription_cycle") {
              await handleReferralCommissionOnInvoice(invoice);
            }
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
        return res.status(500).json({ error: "Internal error processing webhook" });
      }

      res.json({ received: true });
    }
  );
}

// ─── Referral helpers ──────────────────────────────────────────────────────────

async function handleReferralOnCheckout({
  userId,
  stripeSubscriptionId,
  stripeCustomerId,
  plan,
  session,
}: {
  userId: number;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  plan: string;
  session: Stripe.Checkout.Session;
}) {
  try {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return;
    const { referralCodes, referralSubscriptions } = await import("../drizzle/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    // Detect if a promotion code was applied and map it back to a referral code
    let referralCode: typeof referralCodes.$inferSelect | null = null;

    // Check if session has a discount with a promotion code
    if (session.total_details?.breakdown?.discounts?.length) {
      for (const d of session.total_details.breakdown.discounts) {
        const promoId = (d as any).discount?.promotion_code;
        if (promoId) {
          const [rc] = await drizzleDb.select().from(referralCodes)
            .where(eq(referralCodes.stripePromoCodeId, promoId))
            .limit(1);
          if (rc) { referralCode = rc; break; }
        }
      }
    }

    if (!referralCode) return;

    // Avoid duplicate entries
    const existing = await drizzleDb.select().from(referralSubscriptions)
      .where(and(eq(referralSubscriptions.stripeSubscriptionId, stripeSubscriptionId)))
      .limit(1);
    if (existing[0]) return;

    await drizzleDb.insert(referralSubscriptions).values({
      referralCodeId: referralCode.id,
      referrerId: referralCode.userId,
      referredUserId: userId,
      stripeSubscriptionId,
      stripeCustomerId,
      plan,
      isActive: true,
    });

    // Increment usage count on the referral code
    await drizzleDb.update(referralCodes)
      .set({ usageCount: sql`${referralCodes.usageCount} + 1` })
      .where(eq(referralCodes.id, referralCode.id));

    console.log(`[Referral] Registered referral subscription for user ${userId} via code ${referralCode.code}`);
  } catch (e: any) {
    console.error("[Referral] handleReferralOnCheckout error:", e?.message);
  }
}

async function handleReferralCommissionOnInvoice(invoice: Stripe.Invoice) {
  try {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return;
    const {
      referralSubscriptions,
      referralEarnings,
      referralCodes,
      buddyExperts,
      buddyMakers,
    } = await import("../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");

    const invoiceSubId = (invoice as any).subscription as string;
    const [refSub] = await drizzleDb.select().from(referralSubscriptions)
      .where(eq(referralSubscriptions.stripeSubscriptionId, invoiceSubId))
      .limit(1);
    if (!refSub || !refSub.isActive) return;

    const [refCode] = await drizzleDb.select().from(referralCodes)
      .where(eq(referralCodes.id, refSub.referralCodeId))
      .limit(1);
    if (!refCode) return;

    const grossAmount = invoice.amount_paid; // cents
    const commissionAmount = Math.round(grossAmount * (refCode.commissionPercent / 100));

    // Try to transfer via Stripe Connect if the referrer has a connected account
    let stripeTransferId: string | null = null;
    let status: "pending" | "transferred" | "failed" = "pending";
    try {
      // Look up the referrer's Stripe Connect account
      let stripeAccountId: string | null = null;
      if (refCode.ownerType === "buddyexpert") {
        const [expert] = await drizzleDb.select({ stripeAccountId: buddyExperts.stripeAccountId, onboarded: buddyExperts.stripeOnboardingCompleted })
          .from(buddyExperts).where(eq(buddyExperts.userId, refCode.userId)).limit(1);
        if (expert?.stripeAccountId && expert.onboarded) stripeAccountId = expert.stripeAccountId;
      } else {
        const [maker] = await drizzleDb.select({ stripeAccountId: buddyMakers.stripeAccountId, onboarded: buddyMakers.stripeOnboardingCompleted })
          .from(buddyMakers).where(eq(buddyMakers.userId, refCode.userId)).limit(1);
        if (maker?.stripeAccountId && maker.onboarded) stripeAccountId = maker.stripeAccountId;
      }

      if (stripeAccountId && commissionAmount >= 50) { // Stripe minimum transfer: 50 cents
        const transfer = await stripe.transfers.create({
          amount: commissionAmount,
          currency: invoice.currency,
          destination: stripeAccountId,
          description: `Comisión referido ${refCode.code} - factura ${invoice.id}`,
          metadata: {
            referral_code: refCode.code,
            invoice_id: invoice.id,
            referred_user_id: refSub.referredUserId.toString(),
          },
        });
        stripeTransferId = transfer.id;
        status = "transferred";
        console.log(`[Referral] Commission transferred: ${commissionAmount} cents to ${stripeAccountId}`);
      }
    } catch (transferErr: any) {
      console.error("[Referral] Transfer failed:", transferErr?.message);
      status = "failed";
    }

    // Record the earning
    await drizzleDb.insert(referralEarnings).values({
      referralCodeId: refCode.id,
      referrerId: refCode.userId,
      referredUserId: refSub.referredUserId,
      stripeSubscriptionId: (invoice as any).subscription as string,
      stripeInvoiceId: invoice.id,
      stripeTransferId,
      subscriptionAmount: grossAmount,
      commissionAmount,
      currency: invoice.currency,
      status,
      transferredAt: status === "transferred" ? new Date() : null,
    });

    // Update total earned on the referral code
    await drizzleDb.update(referralCodes)
      .set({ totalEarned: sql`${referralCodes.totalEarned} + ${commissionAmount}` })
      .where(eq(referralCodes.id, refCode.id));

    console.log(`[Referral] Commission recorded: ${commissionAmount} cents for code ${refCode.code}`);

    // Notify the referrer about their commission
    try {
      const { inAppNotifications } = await import("../drizzle/schema");
      const amountFormatted = new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: invoice.currency.toUpperCase(),
      }).format(commissionAmount / 100);
      await drizzleDb.insert(inAppNotifications).values({
        userId: refCode.userId,
        type: "success",
        title: status === "transferred" ? `¡Comisión transferida! 💰` : `Nueva comisión de referido 🎉`,
        body: status === "transferred"
          ? `Has recibido ${amountFormatted} de comisión por tu código ${refCode.code}. Ya está en tu cuenta de Stripe.`
          : `Tienes una comisión pendiente de ${amountFormatted} por tu código ${refCode.code}. Conecta Stripe para recibirla.`,
        isRead: false,
        createdAt: new Date(),
      });
    } catch (notifErr: any) {
      console.error("[Referral] Notification error:", notifErr?.message);
    }
  } catch (e: any) {
    console.error("[Referral] handleReferralCommissionOnInvoice error:", e?.message);
  }
}

async function cancelReferralSubscription(stripeSubscriptionId: string) {
  try {
    const drizzleDb = await db.getDb();
    if (!drizzleDb) return;
    const { referralSubscriptions } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    await drizzleDb.update(referralSubscriptions)
      .set({ isActive: false, cancelledAt: new Date() })
      .where(eq(referralSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
  } catch (e: any) {
    console.error("[Referral] cancelReferralSubscription error:", e?.message);
  }
}

export async function createCheckoutSession({
  userId,
  userEmail,
  userName,
  plan,
  origin,
  stripePromoCodeId,
  referralCodeId,
}: {
  userId: number;
  userEmail: string | null;
  userName: string | null;
  plan: "basic" | "premium" | "pro_max";
  origin: string;
  stripePromoCodeId?: string;
  referralCodeId?: number;
}) {
  const prices: Record<string, number> = {
    basic: 499,
    premium: 999,
    pro_max: 1999,
  };

  const planNames: Record<string, string> = {
    basic: "BuddyMarket Basic",
    premium: "BuddyMarket Premium",
    pro_max: "BuddyMarket Pro Max",
  };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    mode: "subscription",
    allow_promotion_codes: !stripePromoCodeId, // disable manual entry if code already applied
    client_reference_id: userId.toString(),
    customer_email: userEmail || undefined,
    metadata: {
      user_id: userId.toString(),
      plan,
      customer_email: userEmail || "",
      customer_name: userName || "",
      referral_code_id: referralCodeId?.toString() ?? "",
    },
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: planNames[plan],
            description: `Suscripción mensual al plan ${planNames[plan]}`,
          },
          unit_amount: prices[plan],
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?subscription=success`,
    cancel_url: `${origin}/subscription?cancelled=true`,
  };

  // Apply the referral promotion code automatically if provided
  if (stripePromoCodeId) {
    (sessionParams as any).discounts = [{ promotion_code: stripePromoCodeId }];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}
