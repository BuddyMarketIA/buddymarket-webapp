/**
 * Script para enviar todos los templates de email de prueba a luismariaccc@gmail.com
 * Ejecutar: node send_test_emails.mjs
 */

import { Resend } from "resend";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

// Load env
try {
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env" });
} catch (e) {}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = "luismariaccc@gmail.com";
const FROM_EMAIL = "BuddyOne <luis@buddyone.io>";
const APP_URL = process.env.PUBLIC_APP_URL || "https://buddyone.io";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY not set");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// ─── Logo BuddyOne en base64 ──────────────────────────────────────────────────
const LOGO_B64 = readFileSync("/home/ubuntu/webdev-static-assets/buddyone-logo-b64.txt", "utf8").trim();

// ─── Shared helpers ───────────────────────────────────────────────────────────
function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BuddyOne</title>
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          ${content}
          <tr>
            <td style="background:#0f172a;padding:40px 40px 32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="data:image/png;base64,${LOGO_B64}" width="36" height="36" alt="BuddyOne" style="display:block;border-radius:9px;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">Buddy<span style="color:#f97316;">One</span></span>
                  </td>
                </tr>
              </table>
              <p style="color:#475569;font-size:13px;font-style:italic;margin:0 0 20px;">El sistema operativo de tu bienestar</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#334155,transparent);"></td></tr>
              </table>
              <p style="margin:0 0 16px;">
                <a href="${APP_URL}" style="color:#f97316;text-decoration:none;font-size:13px;font-weight:700;">buddyone.io</a>
                <span style="color:#1e293b;margin:0 10px;">·</span>
                <a href="${APP_URL}/privacidad" style="color:#64748b;text-decoration:none;font-size:13px;">Privacidad</a>
                <span style="color:#1e293b;margin:0 10px;">·</span>
                <a href="${APP_URL}/soporte" style="color:#64748b;text-decoration:none;font-size:13px;">Soporte</a>
                <span style="color:#1e293b;margin:0 10px;">·</span>
                <a href="${APP_URL}/baja" style="color:#64748b;text-decoration:none;font-size:13px;">Darse de baja</a>
              </p>
              <p style="color:#334155;font-size:12px;margin:0;line-height:1.7;">
                Has recibido este correo porque eres usuario de <strong style="color:#475569;">BuddyOne</strong>.<br>
                Si tienes preguntas, escríbenos a <a href="mailto:luis@buddyone.io" style="color:#f97316;text-decoration:none;">luis@buddyone.io</a>
              </p>
              <p style="color:#1e293b;font-size:11px;margin:12px 0 0;">© 2026 BuddyOne · Hecho con 🧡 en España</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailHeader(emoji, title, subtitle, bgColor = "linear-gradient(135deg,#f97316 0%,#ef4444 100%)") {
  return `
  <tr>
    <td style="background:${bgColor};padding:52px 40px 44px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
        <tr>
          <td style="vertical-align:middle;padding-right:10px;">
            <img src="data:image/png;base64,${LOGO_B64}" width="44" height="44" alt="BuddyOne" style="display:block;border-radius:11px;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          </td>
          <td style="vertical-align:middle;">
            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Buddy<span style="color:rgba(255,255,255,0.75);">One</span></span>
          </td>
        </tr>
      </table>
      <div style="font-size:52px;margin-bottom:16px;">${emoji}</div>
      <h1 style="color:#ffffff;font-size:30px;font-weight:800;margin:0 0 10px;line-height:1.2;">${title}</h1>
      <p style="color:rgba(255,255,255,0.88);font-size:16px;margin:0;line-height:1.6;max-width:440px;margin:0 auto;">${subtitle}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0;height:4px;background:linear-gradient(90deg,#fbbf24 0%,#f97316 50%,#ef4444 100%);"></td>
  </tr>`;
}

function ctaButton(text, url, color = "linear-gradient(135deg,#f97316 0%,#ef4444 100%)") {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 44px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">${text} →</a>
      </td>
    </tr>
  </table>`;
}

function infoBox(title, items, bg = "#FFF7ED", border = "#f97316", text = "#92400E", titleColor = "#C2410C") {
  const rows = items.map(i => `<p style="color:${text};font-size:14px;margin:0 0 8px;line-height:1.6;">✓ ${i}</p>`).join("");
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-left:4px solid ${border};border-radius:0 12px 12px 0;padding:20px 24px;margin:0 0 24px;">
    <tr><td>
      <p style="color:${titleColor};font-size:14px;font-weight:700;margin:0 0 12px;">${title}</p>
      ${rows}
    </td></tr>
  </table>`;
}

// ─── Definición de todos los emails de prueba ─────────────────────────────────
const TEST_EMAILS = [
  {
    subject: "🎉 ¡Bienvenido a BuddyOne, Luis! — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🎉", "¡Bienvenido a BuddyOne, Luis!", "Tu sistema operativo de bienestar ya está listo")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 👋</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Tu cuenta BuddyOne está activa. Estamos revisando tu perfil para ofrecerte la mejor experiencia personalizada.
        </p>
        ${infoBox("🚀 Primeros pasos:", [
          "Completa tu perfil nutricional",
          "Configura tus objetivos de salud",
          "Explora las recetas personalizadas",
          "Genera tu primer menú semanal con IA"
        ])}
        ${ctaButton("Empezar ahora", `${APP_URL}/app`)}
      </td></tr>
    `)
  },
  {
    subject: "🔐 Tu código de acceso BuddyOne — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🔐", "Tu código de acceso", "Válido durante 10 minutos", "linear-gradient(135deg,#1e293b 0%,#334155 100%)")}
      <tr><td style="padding:44px 40px 36px;text-align:center;">
        <p style="color:#475569;font-size:15px;margin:0 0 32px;">Usa este código para iniciar sesión en BuddyOne:</p>
        <div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border:2px solid #e2e8f0;border-radius:20px;padding:32px;display:inline-block;margin:0 auto 32px;">
          <p style="color:#0f172a;font-size:48px;font-weight:900;letter-spacing:12px;margin:0;font-family:monospace;">847291</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin:0;">Si no solicitaste este código, ignora este mensaje.</p>
      </td></tr>
    `)
  },
  {
    subject: "🔑 Restablece tu contraseña de BuddyOne — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🔑", "Restablecer contraseña", "Haz clic en el botón para crear una nueva contraseña", "linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 16px;">Hola <strong>Luis</strong>,</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta BuddyOne. Si no fuiste tú, ignora este correo.
        </p>
        ${ctaButton("Restablecer mi contraseña", `${APP_URL}/reset-password?token=abc123`, "linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)")}
        <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">Este enlace expira en 24 horas.</p>
      </td></tr>
    `)
  },
  {
    subject: "💡 Día 2 — Descubre todo lo que puedes hacer — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("💡", "¿Ya exploraste todo?", "Llevas 2 días con BuddyOne — aquí tienes lo mejor", "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 🌟</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Llevas 2 días con nosotros y queremos asegurarnos de que estás sacando el máximo partido a BuddyOne.
        </p>
        ${infoBox("🎯 Funciones que no te puedes perder:", [
          "Generador de menús semanales con IA",
          "Diario nutricional con escaneo de alimentos",
          "Lista de la compra automática",
          "Recetas personalizadas a tus macros"
        ], "#faf5ff", "#7c3aed", "#4c1d95", "#6d28d9")}
        ${ctaButton("Explorar BuddyOne", `${APP_URL}/app`, "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🛒 Día 4 — Tu inventario inteligente te espera — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🛒", "Gestiona tu despensa", "El inventario inteligente de BuddyOne", "linear-gradient(135deg,#059669 0%,#047857 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 🥦</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          ¿Sabías que BuddyOne puede decirte qué recetas puedes cocinar ahora mismo con lo que tienes en casa?
        </p>
        ${infoBox("📦 Con el inventario puedes:", [
          "Registrar lo que tienes en casa",
          "Ver recetas que puedes cocinar ahora",
          "Generar la lista de la compra exacta",
          "Evitar desperdiciar comida"
        ], "#f0fdf4", "#059669", "#166534", "#047857")}
        ${ctaButton("Ir a mi inventario", `${APP_URL}/app/inventory`, "linear-gradient(135deg,#059669 0%,#047857 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🏆 ¡Una semana con BuddyOne! — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🏆", "¡Una semana contigo, Luis!", "Gracias por confiar en BuddyOne para tu nutrición", "linear-gradient(135deg,#059669 0%,#047857 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">¡Enhorabuena, <strong>Luis</strong>! 🎉</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Llevas una semana completa con BuddyOne. Eso ya es un logro en sí mismo.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #86efac;text-align:center;">
          <tr><td>
            <p style="color:#166534;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Tu logro de la semana</p>
            <p style="color:#0f172a;font-size:36px;font-weight:900;margin:0;">🔥 7 días</p>
            <p style="color:#059669;font-size:14px;margin:8px 0 0;">de racha activa</p>
          </td></tr>
        </table>
        ${ctaButton("Ver mi progreso", `${APP_URL}/app/progress`, "linear-gradient(135deg,#059669 0%,#047857 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "📋 Tu plan nutricional está listo — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("📋", "¡Tu plan nutricional está listo!", "Tu nutricionista ha preparado tu plan personalizado", "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 🌟</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #c4b5fd;">
          <tr><td>
            <p style="color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Plan nutricional asignado</p>
            <p style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;">📋 Plan Pérdida de Peso — Semana 1</p>
            <p style="color:#4c1d95;font-size:14px;line-height:1.6;margin:0 0 16px;">Plan personalizado de 1.800 kcal con énfasis en proteína para preservar músculo.</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="background:rgba(255,255,255,0.6);border-radius:10px;padding:12px;text-align:center;">
                  <p style="color:#6d28d9;font-size:12px;font-weight:600;margin:0 0 4px;">INICIO</p>
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0;">📅 09/06/2026</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:rgba(255,255,255,0.6);border-radius:10px;padding:12px;text-align:center;">
                  <p style="color:#6d28d9;font-size:12px;font-weight:600;margin:0 0 4px;">DURACIÓN</p>
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0;">⏱️ 12 semanas</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
        ${ctaButton("Ver mi plan nutricional", `${APP_URL}/app/my-plans`, "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🥗 ¡Tienes un nuevo menú semanal! — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🥗", "¡Tienes un nuevo menú semanal!", "Tu nutricionista te ha asignado un menú personalizado")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 🍽️</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #fed7aa;">
          <tr><td>
            <p style="color:#c2410c;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Menú de la semana</p>
            <p style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;">🥗 Menú Mediterráneo — Semana 24</p>
            <p style="color:#92400e;font-size:14px;line-height:1.6;margin:0;">7 días · 5 comidas/día · ~1.850 kcal · 140g proteína</p>
          </td></tr>
        </table>
        ${ctaButton("Ver mi menú semanal", `${APP_URL}/app/menus`)}
      </td></tr>
    `)
  },
  {
    subject: "💳 Confirmación de pago — BuddyOne Premium — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("💳", "¡Pago confirmado!", "Tu suscripción BuddyOne Premium está activa", "linear-gradient(135deg,#f97316 0%,#ea580c 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 🎉</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #fed7aa;text-align:center;">
          <tr><td>
            <p style="color:#c2410c;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Plan activado</p>
            <p style="color:#0f172a;font-size:28px;font-weight:900;margin:0 0 4px;">⭐ BuddyOne Premium</p>
            <p style="color:#f97316;font-size:32px;font-weight:900;margin:0 0 8px;">9,99€/mes</p>
            <p style="color:#92400e;font-size:13px;margin:0;">Próxima renovación: 09/07/2026</p>
          </td></tr>
        </table>
        ${infoBox("✅ Incluido en Premium:", [
          "Menús semanales ilimitados con IA",
          "Acceso a BuddyExperts (nutricionistas)",
          "Análisis nutricional avanzado",
          "Soporte prioritario 24/7"
        ])}
        ${ctaButton("Ir a mi cuenta Premium", `${APP_URL}/app`)}
      </td></tr>
    `)
  },
  {
    subject: "👋 Luis, tu menú semanal te espera en BuddyOne — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("👋", "Luis, tu menú te espera", "Llevas 3 días sin abrir la app. ¡Sigue con tu plan!")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 16px;">Hola <strong>Luis</strong>,</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Llevas 3 días sin abrir BuddyOne. Tu menú semanal está listo y tu diario nutricional te espera.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #fed7aa;text-align:center;">
          <tr><td>
            <p style="color:#c2410c;font-size:14px;font-weight:700;margin:0 0 8px;">Tu racha anterior</p>
            <p style="color:#0f172a;font-size:40px;font-weight:900;margin:0;">🔥 12 días</p>
            <p style="color:#92400e;font-size:13px;margin:8px 0 0;">¡No la pierdas ahora!</p>
          </td></tr>
        </table>
        ${ctaButton("Retomar mi plan ahora", `${APP_URL}/app`)}
      </td></tr>
    `)
  },
  {
    subject: "📊 Tu resumen semanal de progreso — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("📊", "Tu resumen semanal", "7/7 días registrados esta semana", "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 24px;">Hola <strong>Luis</strong>, aquí tienes tu resumen de la semana 📈</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td width="48%" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:14px;padding:20px;text-align:center;border:1px solid #c4b5fd;">
              <p style="color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Días registrados</p>
              <p style="color:#0f172a;font-size:36px;font-weight:900;margin:0;line-height:1;">7/7</p>
            </td>
            <td width="4%"></td>
            <td width="48%" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:14px;padding:20px;text-align:center;border:1px solid #fed7aa;">
              <p style="color:#c2410c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Racha actual</p>
              <p style="color:#0f172a;font-size:36px;font-weight:900;margin:0;line-height:1;">🔥 21</p>
            </td>
          </tr>
          <tr><td colspan="3" style="height:12px;"></td></tr>
          <tr>
            <td width="48%" style="background:#f8fafc;border-radius:14px;padding:20px;text-align:center;border:1px solid #e2e8f0;">
              <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">kcal/día promedio</p>
              <p style="color:#0f172a;font-size:32px;font-weight:900;margin:0;line-height:1;">1.847</p>
            </td>
            <td width="4%"></td>
            <td width="48%" style="background:#f8fafc;border-radius:14px;padding:20px;text-align:center;border:1px solid #e2e8f0;">
              <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Proteína/día promedio</p>
              <p style="color:#0f172a;font-size:32px;font-weight:900;margin:0;line-height:1;">142g</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:16px;padding:24px;margin:0 0 24px;border:1px solid #86efac;">
          <tr><td>
            <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 14px;">⚖️ Evolución del peso</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#374151;font-size:14px;padding:5px 0;">Peso actual:</td><td style="color:#0f172a;font-size:15px;font-weight:700;text-align:right;">82.3 kg</td></tr>
              <tr><td style="color:#374151;font-size:14px;padding:5px 0;">Objetivo:</td><td style="color:#0f172a;font-size:15px;font-weight:700;text-align:right;">75.0 kg</td></tr>
              <tr><td style="color:#374151;font-size:14px;padding:5px 0;">Cambio semanal:</td><td style="color:#059669;font-size:16px;font-weight:800;text-align:right;">↓ 0.4 kg</td></tr>
            </table>
          </td></tr>
        </table>
        ${ctaButton("Ver mi progreso completo", `${APP_URL}/app/progress`, "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🌙 Tu resumen del día — 8 junio 2026 — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🌙", "Tu resumen del día", "8 de junio de 2026", "linear-gradient(135deg,#1e293b 0%,#334155 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 24px;">Hola <strong>Luis</strong>, así ha ido tu día 📊</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:20px;padding:28px;margin:0 0 24px;border:1px solid #e2e8f0;text-align:center;">
          <tr><td>
            <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Calorías totales</p>
            <p style="color:#0f172a;font-size:48px;font-weight:900;margin:0;line-height:1;">1.847</p>
            <p style="color:#64748b;font-size:14px;margin:4px 0 16px;">de 1.900 kcal objetivo ✅</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:300px;margin:0 auto;">
              <tr><td style="background:#e2e8f0;border-radius:50px;height:12px;overflow:hidden;">
                <div style="background:linear-gradient(90deg,#f97316,#ef4444);width:97%;height:12px;border-radius:50px;"></div>
              </td></tr>
            </table>
            <p style="color:#f97316;font-size:14px;font-weight:700;margin:8px 0 0;">97% del objetivo</p>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td width="30%" style="background:#fff7ed;border-radius:14px;padding:16px;text-align:center;border:1px solid #fed7aa;">
              <p style="color:#c2410c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Proteína ✅</p>
              <p style="color:#0f172a;font-size:24px;font-weight:900;margin:0;line-height:1;">142g</p>
              <p style="color:#64748b;font-size:11px;margin:4px 0 0;">de 140g</p>
            </td>
            <td width="5%"></td>
            <td width="30%" style="background:#eff6ff;border-radius:14px;padding:16px;text-align:center;border:1px solid #bfdbfe;">
              <p style="color:#1e40af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Carbohidratos</p>
              <p style="color:#0f172a;font-size:24px;font-weight:900;margin:0;line-height:1;">198g</p>
            </td>
            <td width="5%"></td>
            <td width="30%" style="background:#faf5ff;border-radius:14px;padding:16px;text-align:center;border:1px solid #e9d5ff;">
              <p style="color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Grasas</p>
              <p style="color:#0f172a;font-size:24px;font-weight:900;margin:0;line-height:1;">62g</p>
            </td>
          </tr>
        </table>
        ${ctaButton("Ver mi diario completo", `${APP_URL}/app/diary`, "linear-gradient(135deg,#1e293b 0%,#334155 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🔥 ¡21 días de racha! Increíble, Luis — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🔥", "¡21 días de racha!", "Estás en el top 5% de usuarios más constantes", "linear-gradient(135deg,#f97316 0%,#dc2626 100%)")}
      <tr><td style="padding:44px 40px 36px;text-align:center;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 24px;">¡Increíble, <strong>Luis</strong>! 🏆</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:32px;margin:0 0 28px;border:2px solid #fed7aa;">
          <tr><td style="text-align:center;">
            <p style="color:#0f172a;font-size:72px;font-weight:900;margin:0;line-height:1;">🔥</p>
            <p style="color:#0f172a;font-size:48px;font-weight:900;margin:8px 0 4px;">21 días</p>
            <p style="color:#c2410c;font-size:16px;font-weight:700;margin:0;">de racha activa consecutiva</p>
          </td></tr>
        </table>
        ${ctaButton("Ver mi racha completa", `${APP_URL}/app/progress`)}
      </td></tr>
    `)
  },
  {
    subject: "🏅 ¡Nuevo logro desbloqueado! — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🏅", "¡Nuevo logro desbloqueado!", "Has alcanzado un hito importante en tu progreso", "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)")}
      <tr><td style="padding:44px 40px 36px;text-align:center;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 24px;">¡Enhorabuena, <strong>Luis</strong>! 🎉</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:20px;padding:32px;margin:0 0 28px;border:2px solid #fde68a;text-align:center;">
          <tr><td>
            <p style="font-size:64px;margin:0 0 16px;">🥇</p>
            <p style="color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Logro desbloqueado</p>
            <p style="color:#0f172a;font-size:24px;font-weight:800;margin:0 0 8px;">Maestro de la Proteína</p>
            <p style="color:#78350f;font-size:14px;line-height:1.6;margin:0;">Has alcanzado tu objetivo de proteína durante 7 días consecutivos. ¡Eso es disciplina!</p>
          </td></tr>
        </table>
        ${ctaButton("Ver todos mis logros", `${APP_URL}/app/achievements`, "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🤖 ¡Tu primer menú generado con IA! — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🤖", "¡Tu primer menú con IA!", "BuddyOne ha creado tu menú personalizado", "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">¡Hola <strong>Luis</strong>! 🎉</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Tu primer menú generado con inteligencia artificial ya está listo. Hemos analizado tus objetivos, preferencias y restricciones para crear el menú perfecto para ti.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #7dd3fc;text-align:center;">
          <tr><td>
            <p style="color:#0369a1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Menú generado</p>
            <p style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 4px;">🥗 Menú Mediterráneo Semana 1</p>
            <p style="color:#0284c7;font-size:14px;margin:0;">7 días · 5 comidas · ~1.850 kcal · 142g proteína</p>
          </td></tr>
        </table>
        ${ctaButton("Ver mi menú IA", `${APP_URL}/app/menus`, "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "📅 ¡Cita confirmada con tu nutricionista! — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("📅", "¡Cita confirmada!", "Tu cita con Dra. Ana García está programada", "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 📅</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #7dd3fc;">
          <tr><td>
            <p style="color:#0369a1;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Detalles de la cita</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#64748b;font-size:14px;padding:6px 0;border-bottom:1px solid #e0f2fe;">Nutricionista</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #e0f2fe;">Dra. Ana García</td></tr>
              <tr><td style="color:#64748b;font-size:14px;padding:6px 0;border-bottom:1px solid #e0f2fe;">Fecha</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #e0f2fe;">Martes, 10 junio 2026</td></tr>
              <tr><td style="color:#64748b;font-size:14px;padding:6px 0;border-bottom:1px solid #e0f2fe;">Hora</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #e0f2fe;">17:00 (España)</td></tr>
              <tr><td style="color:#64748b;font-size:14px;padding:6px 0;">Modalidad</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;">🖥️ Videollamada online</td></tr>
            </table>
          </td></tr>
        </table>
        ${ctaButton("Unirme a la videollamada", `${APP_URL}/app/appointments`, "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "⏰ Recordatorio: Cita mañana con tu nutricionista — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("⏰", "Recordatorio de cita", "Mañana tienes cita con Dra. Ana García", "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 👋</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Te recordamos que mañana tienes una cita con tu nutricionista. ¡Prepárate!
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #fde68a;">
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#92400e;font-size:14px;padding:6px 0;border-bottom:1px solid #fde68a;">Nutricionista</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #fde68a;">Dra. Ana García</td></tr>
              <tr><td style="color:#92400e;font-size:14px;padding:6px 0;border-bottom:1px solid #fde68a;">Mañana</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #fde68a;">Martes, 10 junio · 17:00</td></tr>
              <tr><td style="color:#92400e;font-size:14px;padding:6px 0;">Modalidad</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;">🖥️ Videollamada online</td></tr>
            </table>
          </td></tr>
        </table>
        ${ctaButton("Ver detalles de la cita", `${APP_URL}/app/appointments`, "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🤝 ¡Nueva solicitud de paciente! — [PRUEBA NUTRICIONISTA]",
    html: emailWrapper(`
      ${emailHeader("🤝", "¡Nueva solicitud de paciente!", "Luis García quiere contratarte", "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Ana</strong> 👩‍⚕️</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #c4b5fd;">
          <tr><td>
            <p style="color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Datos del paciente</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#64748b;font-size:14px;padding:6px 0;border-bottom:1px solid #ede9fe;">Nombre</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #ede9fe;">Luis García</td></tr>
              <tr><td style="color:#64748b;font-size:14px;padding:6px 0;border-bottom:1px solid #ede9fe;">Objetivo</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:6px 0;border-bottom:1px solid #ede9fe;">Pérdida de peso</td></tr>
              <tr><td style="color:#64748b;font-size:14px;padding:6px 0;">Pack solicitado</td><td style="color:#7c3aed;font-size:14px;font-weight:700;text-align:right;padding:6px 0;">Premium · 3 meses</td></tr>
            </table>
          </td></tr>
        </table>
        ${ctaButton("Ver solicitud completa", `${APP_URL}/app/expert/requests`, "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "📊 Tu resumen semanal de pacientes — [PRUEBA NUTRICIONISTA]",
    html: emailWrapper(`
      ${emailHeader("📊", "Tu resumen semanal", "Semana del 2 al 8 de junio 2026", "linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 24px;">Hola <strong>Ana</strong> 👩‍⚕️</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td width="30%" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:14px;padding:16px;text-align:center;border:1px solid #bfdbfe;">
              <p style="color:#1e40af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Pacientes activos</p>
              <p style="color:#0f172a;font-size:32px;font-weight:900;margin:0;line-height:1;">24</p>
            </td>
            <td width="5%"></td>
            <td width="30%" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;padding:16px;text-align:center;border:1px solid #86efac;">
              <p style="color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Check-ins recibidos</p>
              <p style="color:#0f172a;font-size:32px;font-weight:900;margin:0;line-height:1;">18</p>
            </td>
            <td width="5%"></td>
            <td width="30%" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:14px;padding:16px;text-align:center;border:1px solid #fed7aa;">
              <p style="color:#c2410c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Nuevos pacientes</p>
              <p style="color:#0f172a;font-size:32px;font-weight:900;margin:0;line-height:1;">3</p>
            </td>
          </tr>
        </table>
        ${ctaButton("Ver panel de pacientes", `${APP_URL}/app/expert/patients`, "linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🌟 ¡Bienvenido al equipo de BuddyExperts! — [PRUEBA]",
    html: emailWrapper(`
      ${emailHeader("🌟", "¡Bienvenido a BuddyExperts!", "Tu perfil de nutricionista está activo", "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Ana</strong> 👩‍⚕️</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Tu perfil de BuddyExpert ha sido aprobado. Ya puedes empezar a recibir pacientes y gestionar sus planes nutricionales desde BuddyOne.
        </p>
        ${infoBox("🚀 Primeros pasos como BuddyExpert:", [
          "Completa tu perfil profesional",
          "Configura tus packs y precios",
          "Activa tu disponibilidad de citas",
          "Crea tus primeras plantillas de plan"
        ], "#faf5ff", "#7c3aed", "#4c1d95", "#6d28d9")}
        ${ctaButton("Ir a mi panel de experto", `${APP_URL}/app/expert`, "linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)")}
      </td></tr>
    `)
  },
  {
    subject: "🎁 Tu empresa te regala BuddyOne Pro — [PRUEBA B2B]",
    html: emailWrapper(`
      ${emailHeader("🎁", "¡Tu empresa te regala BuddyOne Pro!", "Beneficio exclusivo de Empresa Demo S.L.", "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 20px;">Hola <strong>Luis</strong> 🎉</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:20px;padding:32px;margin:0 0 28px;border:2px solid #c4b5fd;text-align:center;">
          <tr><td>
            <p style="font-size:56px;margin-bottom:16px;">🎁</p>
            <p style="color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">Beneficio exclusivo de Empresa Demo S.L.</p>
            <p style="color:#0f172a;font-size:24px;font-weight:800;margin:0 0 8px;">BuddyOne Pro — 3 meses gratis</p>
            <p style="color:#7c3aed;font-size:20px;font-weight:900;margin:0 0 16px;">Valor: 29,97€</p>
            <p style="color:#4c1d95;font-size:14px;line-height:1.7;margin:0;">Accede a menús IA ilimitados, análisis nutricional avanzado y soporte prioritario.</p>
            <p style="color:#dc2626;font-size:13px;font-weight:700;margin:16px 0 0;">⏰ Válido hasta: 30/06/2026</p>
          </td></tr>
        </table>
        ${ctaButton("Activar mi beneficio", `${APP_URL}/activate?code=EMPRESA2026`, "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)")}
      </td></tr>
    `)
  }
];

// ─── Enviar todos los emails ──────────────────────────────────────────────────
async function sendAll() {
  console.log(`\n📧 Enviando ${TEST_EMAILS.length} emails de prueba a ${TO_EMAIL}\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < TEST_EMAILS.length; i++) {
    const email = TEST_EMAILS[i];
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: email.subject,
        html: email.html,
      });
      
      if (error) {
        console.error(`  ❌ [${i+1}/${TEST_EMAILS.length}] ${email.subject.substring(0, 50)}...`);
        console.error(`     Error: ${JSON.stringify(error)}`);
        failed++;
      } else {
        console.log(`  ✅ [${i+1}/${TEST_EMAILS.length}] ${email.subject.substring(0, 60)}`);
        success++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ❌ [${i+1}/${TEST_EMAILS.length}] Error: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n✅ Enviados: ${success}/${TEST_EMAILS.length}`);
  if (failed > 0) console.log(`❌ Fallidos: ${failed}`);
  console.log(`\n📬 Revisa tu bandeja de entrada en ${TO_EMAIL}\n`);
}

sendAll().catch(console.error);
