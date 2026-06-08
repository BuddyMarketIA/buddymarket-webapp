/**
 * BuddyOne — Nuevos templates de email
 * Secuencia onboarding mejorada + emails de engagement y novedades
 */

import { Resend } from "resend";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

try { dotenv.config({ path: ".env.local" }); dotenv.config({ path: ".env" }); } catch (e) {}

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "luismariaccc@gmail.com";
const FROM = "BuddyOne <luis@buddyone.io>";
const APP = "https://buddyone.io";
const LOGO = readFileSync("/home/ubuntu/webdev-static-assets/buddyone-logo-b64.txt", "utf8").trim();

// ─── SISTEMA DE COLORES POR CATEGORÍA ────────────────────────────────────────
const COLORS = {
  auth:        "linear-gradient(135deg,#1e293b 0%,#334155 100%)",
  onboarding:  "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
  nutrition:   "linear-gradient(135deg,#f97316 0%,#ef4444 100%)",
  progress:    "linear-gradient(135deg,#059669 0%,#047857 100%)",
  daily:       "linear-gradient(135deg,#1e293b 0%,#0f172a 100%)",
  appointment: "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)",
  payment:     "linear-gradient(135deg,#f97316 0%,#ea580c 100%)",
  expert:      "linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%)",
  b2b:         "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)",
  news:        "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)",
  tips:        "linear-gradient(135deg,#059669 0%,#0d9488 100%)",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const wrap = (content) => `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F2F5;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      ${content}
      <tr><td style="background:#0f172a;padding:40px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
          <tr>
            <td style="vertical-align:middle;padding-right:10px;"><img src="data:image/png;base64,${LOGO}" width="36" height="36" alt="BuddyOne" style="display:block;border-radius:9px;"></td>
            <td style="vertical-align:middle;"><span style="color:#fff;font-size:18px;font-weight:800;">Buddy<span style="color:#f97316;">One</span></span></td>
          </tr>
        </table>
        <p style="color:#475569;font-size:13px;font-style:italic;margin:0 0 16px;">El sistema operativo de tu bienestar</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="height:1px;background:linear-gradient(90deg,transparent,#334155,transparent);"></td></tr></table>
        <p style="margin:0 0 12px;">
          <a href="${APP}" style="color:#f97316;text-decoration:none;font-size:13px;font-weight:700;">buddyone.io</a>
          <span style="color:#334155;margin:0 8px;">·</span>
          <a href="${APP}/privacidad" style="color:#64748b;text-decoration:none;font-size:13px;">Privacidad</a>
          <span style="color:#334155;margin:0 8px;">·</span>
          <a href="${APP}/soporte" style="color:#64748b;text-decoration:none;font-size:13px;">Soporte</a>
          <span style="color:#334155;margin:0 8px;">·</span>
          <a href="${APP}/baja" style="color:#64748b;text-decoration:none;font-size:13px;">Darse de baja</a>
        </p>
        <p style="color:#334155;font-size:12px;margin:0 0 4px;">Has recibido este correo porque eres usuario de <strong style="color:#475569;">BuddyOne</strong>.</p>
        <p style="color:#1e293b;font-size:11px;margin:0;">© 2026 BuddyOne · Hecho con 🧡 en España</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

const header = (emoji, title, subtitle, bg) => `
<tr><td style="background:${bg};padding:52px 40px 44px;text-align:center;">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
    <tr>
      <td style="vertical-align:middle;padding-right:10px;"><img src="data:image/png;base64,${LOGO}" width="44" height="44" alt="BuddyOne" style="display:block;border-radius:11px;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></td>
      <td style="vertical-align:middle;"><span style="color:#fff;font-size:22px;font-weight:800;">Buddy<span style="color:rgba(255,255,255,0.7);">One</span></span></td>
    </tr>
  </table>
  <div style="font-size:52px;margin-bottom:16px;">${emoji}</div>
  <h1 style="color:#fff;font-size:28px;font-weight:800;margin:0 0 10px;line-height:1.2;">${title}</h1>
  <p style="color:rgba(255,255,255,0.88);font-size:15px;margin:0;line-height:1.6;max-width:440px;margin:0 auto;">${subtitle}</p>
</td></tr>
<tr><td style="height:4px;background:linear-gradient(90deg,#fbbf24,#f97316,#ef4444);"></td></tr>`;

const cta = (text, url, bg = "linear-gradient(135deg,#f97316,#ef4444)") => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
  <tr><td align="center">
    <a href="${url}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 44px;border-radius:50px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">${text} →</a>
  </td></tr>
</table>`;

const featureCard = (emoji, title, desc, bg = "#fff7ed", border = "#fed7aa", titleColor = "#c2410c") => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:16px;padding:20px 24px;margin:0 0 16px;border:1.5px solid ${border};">
  <tr>
    <td width="52" style="vertical-align:top;padding-right:16px;font-size:32px;line-height:1;">${emoji}</td>
    <td style="vertical-align:top;">
      <p style="color:${titleColor};font-size:15px;font-weight:700;margin:0 0 6px;">${title}</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">${desc}</p>
    </td>
  </tr>
</table>`;

const stepBadge = (num, total) => `<p style="color:#94a3b8;font-size:12px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">Paso ${num} de ${total}</p>`;

const progressBar = (step, total, color = "#f97316") => {
  const pct = Math.round((step / total) * 100);
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
    <tr><td style="background:#f1f5f9;border-radius:50px;height:8px;overflow:hidden;">
      <div style="background:${color};width:${pct}%;height:8px;border-radius:50px;"></div>
    </td></tr>
  </table>`;
};

const mockScreen = (content, bg = "#0f172a") => `
<table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:20px;padding:24px;margin:0 0 24px;border:2px solid #1e293b;">
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
      <tr>
        <td><div style="width:8px;height:8px;background:#ef4444;border-radius:50%;display:inline-block;margin-right:4px;"></div><div style="width:8px;height:8px;background:#f59e0b;border-radius:50%;display:inline-block;margin-right:4px;"></div><div style="width:8px;height:8px;background:#10b981;border-radius:50%;display:inline-block;"></div></td>
      </tr>
    </table>
    ${content}
  </td></tr>
</table>`;

const statRow = (label, value, color = "#f97316") => `
<tr>
  <td style="color:#94a3b8;font-size:13px;padding:8px 0;border-bottom:1px solid #1e293b;">${label}</td>
  <td style="color:${color};font-size:14px;font-weight:700;text-align:right;padding:8px 0;border-bottom:1px solid #1e293b;">${value}</td>
</tr>`;

// ═══════════════════════════════════════════════════════════════════════════════
// NUEVOS TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const EMAILS = [

  // ── ONBOARDING DÍA 0: BIENVENIDA CON TOUR COMPLETO ──────────────────────────
  {
    subject: "🎉 ¡Bienvenido a BuddyOne, Luis! Tu guía de inicio — [PRUEBA v2]",
    html: wrap(`
      ${header("🎉", "¡Bienvenido a BuddyOne!", "Todo lo que necesitas para cuidarte, en un solo lugar", COLORS.onboarding)}
      <tr><td style="padding:44px 40px 36px;">
        ${stepBadge(1, 4)}
        <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;text-align:center;">Tu ecosistema de bienestar está listo</h2>
        ${progressBar(1, 4, "#7c3aed")}

        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 👋 Acabas de unirte a BuddyOne. En los próximos días te vamos a presentar todo lo que puedes hacer. Hoy, lo más importante: <strong>¿qué es BuddyOne?</strong></p>

        ${featureCard("🥗", "BuddyMarket — Tu despensa inteligente", "Gestiona tu inventario, genera la lista de la compra automáticamente y descubre qué recetas puedes cocinar con lo que tienes en casa.", "#fff7ed", "#fed7aa", "#c2410c")}
        ${featureCard("🤖", "Menús con IA — Personalizados para ti", "La IA genera tu menú semanal completo basándose en tus objetivos, preferencias, alergias y lo que tienes en casa. Listo en 30 segundos.", "#faf5ff", "#c4b5fd", "#6d28d9")}
        ${featureCard("👨‍⚕️", "BuddyExperts — Tu nutricionista online", "Conecta con nutricionistas certificados que diseñan tu plan personalizado, hacen seguimiento semanal y responden tus dudas.", "#f0f9ff", "#7dd3fc", "#0369a1")}
        ${featureCard("📊", "Diario nutricional — Registra lo que comes", "Escanea el código de barras, busca alimentos o dicta por voz. BuddyOne calcula automáticamente tus macros y calorías.", "#f0fdf4", "#86efac", "#166534")}
        ${featureCard("🏆", "Retos y logros — Mantente motivado", "Completa retos diarios, desbloquea logros y mantén tu racha activa. Comparte tus victorias con amigos.", "#fffbeb", "#fde68a", "#92400e")}

        ${cta("Empezar mi aventura en BuddyOne", `${APP}/app`, COLORS.onboarding)}
        <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">Mañana te contamos cómo registrar tus comidas de forma rápida 📱</p>
      </td></tr>
    `)
  },

  // ── ONBOARDING DÍA 2: DIARIO NUTRICIONAL ────────────────────────────────────
  {
    subject: "📱 Día 2 — Registra tus comidas en 10 segundos — [PRUEBA v2]",
    html: wrap(`
      ${header("📱", "Registra lo que comes", "El diario nutricional más rápido que has visto", COLORS.onboarding)}
      <tr><td style="padding:44px 40px 36px;">
        ${stepBadge(2, 4)}
        <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;text-align:center;">Tu diario nutricional</h2>
        ${progressBar(2, 4, "#7c3aed")}

        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 👋 El mayor secreto del éxito nutricional es <strong>saber qué estás comiendo</strong>. BuddyOne lo hace tan fácil que no tendrás excusa.</p>

        ${mockScreen(`
          <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">📊 Tu día de hoy</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${statRow("🍳 Desayuno", "487 kcal · 32g prot")}
            ${statRow("🥗 Almuerzo", "623 kcal · 48g prot")}
            ${statRow("🍎 Merienda", "156 kcal · 8g prot")}
            ${statRow("🍽️ Cena", "— sin registrar", "#64748b")}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">
            <tr>
              <td style="text-align:center;padding:8px;">
                <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">KCAL</p>
                <p style="color:#f97316;font-size:22px;font-weight:900;margin:0;">1.266</p>
                <p style="color:#475569;font-size:10px;margin:2px 0 0;">de 1.900</p>
              </td>
              <td style="text-align:center;padding:8px;">
                <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">PROTEÍNA</p>
                <p style="color:#7c3aed;font-size:22px;font-weight:900;margin:0;">88g</p>
                <p style="color:#475569;font-size:10px;margin:2px 0 0;">de 140g</p>
              </td>
              <td style="text-align:center;padding:8px;">
                <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">AGUA</p>
                <p style="color:#0ea5e9;font-size:22px;font-weight:900;margin:0;">1.2L</p>
                <p style="color:#475569;font-size:10px;margin:2px 0 0;">de 2.5L</p>
              </td>
            </tr>
          </table>
        `)}

        <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">3 formas de registrar en segundos:</p>
        ${featureCard("📷", "Escanea el código de barras", "Apunta la cámara al producto y BuddyOne rellena todos los datos nutricionales automáticamente.", "#fff7ed", "#fed7aa", "#c2410c")}
        ${featureCard("🔍", "Busca en nuestra base de datos", "Más de 2 millones de alimentos españoles y europeos. Busca por nombre y añade en un tap.", "#f0f9ff", "#7dd3fc", "#0369a1")}
        ${featureCard("🎤", "Dicta por voz", "Di 'pollo a la plancha 150 gramos' y BuddyOne lo registra automáticamente.", "#f0fdf4", "#86efac", "#166534")}

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:16px;padding:20px 24px;margin:24px 0;border:1.5px solid #c4b5fd;">
          <tr><td>
            <p style="color:#6d28d9;font-size:14px;font-weight:700;margin:0 0 8px;">💡 Tip de hoy</p>
            <p style="color:#4c1d95;font-size:14px;line-height:1.6;margin:0;">Registrar las comidas durante <strong>21 días seguidos</strong> aumenta un 73% las probabilidades de alcanzar tu objetivo de peso. ¡Empieza hoy!</p>
          </td></tr>
        </table>

        ${cta("Registrar mi primera comida", `${APP}/app/diary`, COLORS.onboarding)}
        <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">En 2 días: cómo generar tu menú semanal con IA 🤖</p>
      </td></tr>
    `)
  },

  // ── ONBOARDING DÍA 4: MENÚ IA + INVENTARIO ──────────────────────────────────
  {
    subject: "🤖 Día 4 — Tu menú semanal generado por IA en 30 segundos — [PRUEBA v2]",
    html: wrap(`
      ${header("🤖", "Menús con IA para toda la semana", "Personalizados. Automáticos. Deliciosos.", COLORS.nutrition)}
      <tr><td style="padding:44px 40px 36px;">
        ${stepBadge(3, 4)}
        <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;text-align:center;">La IA trabaja para ti</h2>
        ${progressBar(3, 4, "#f97316")}

        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 🤖 ¿Y si no tuvieras que pensar nunca más qué comer? BuddyOne genera tu menú semanal completo en 30 segundos.</p>

        ${mockScreen(`
          <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">🥗 Menú Semana 24 — Generado con IA</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${statRow("Lunes", "Avena · Ensalada César · Salmón")}
            ${statRow("Martes", "Tostadas · Pasta · Pollo al horno")}
            ${statRow("Miércoles", "Yogur · Lentejas · Merluza")}
            ${statRow("Jueves", "Fruta · Arroz · Ternera")}
            ${statRow("Viernes", "Huevos · Gazpacho · Bacalao")}
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;background:#1e293b;border-radius:10px;padding:12px;">
            <tr>
              <td style="text-align:center;"><p style="color:#f97316;font-size:18px;font-weight:900;margin:0;">1.847</p><p style="color:#64748b;font-size:10px;margin:2px 0 0;">kcal/día</p></td>
              <td style="text-align:center;"><p style="color:#7c3aed;font-size:18px;font-weight:900;margin:0;">142g</p><p style="color:#64748b;font-size:10px;margin:2px 0 0;">proteína</p></td>
              <td style="text-align:center;"><p style="color:#10b981;font-size:18px;font-weight:900;margin:0;">5</p><p style="color:#64748b;font-size:10px;margin:2px 0 0;">comidas/día</p></td>
            </tr>
          </table>
        `)}

        <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">La IA tiene en cuenta:</p>
        ${featureCard("🎯", "Tus objetivos personales", "Pérdida de peso, ganancia muscular, mantenimiento o rendimiento deportivo.", "#fff7ed", "#fed7aa", "#c2410c")}
        ${featureCard("🚫", "Tus alergias e intolerancias", "Sin gluten, sin lactosa, vegetariano, vegano... BuddyOne lo respeta siempre.", "#fef2f2", "#fecaca", "#b91c1c")}
        ${featureCard("🛒", "Lo que tienes en casa", "Conectado con tu inventario, la IA prioriza los ingredientes que ya tienes para reducir el desperdicio.", "#f0fdf4", "#86efac", "#166534")}
        ${featureCard("💰", "Tu presupuesto semanal", "Indica cuánto quieres gastar y la IA optimiza el menú para ajustarse.", "#fffbeb", "#fde68a", "#92400e")}

        ${cta("Generar mi primer menú con IA", `${APP}/app/menus/generate`, COLORS.nutrition)}
        <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">En 3 días: cómo conectar con un nutricionista experto 👨‍⚕️</p>
      </td></tr>
    `)
  },

  // ── ONBOARDING DÍA 7: BUDDYEXPERTS ──────────────────────────────────────────
  {
    subject: "👨‍⚕️ Día 7 — ¡Una semana! Conoce a tus BuddyExperts — [PRUEBA v2]",
    html: wrap(`
      ${header("👨‍⚕️", "¡Una semana con BuddyOne!", "Ahora conoce a tus nutricionistas online", COLORS.progress)}
      <tr><td style="padding:44px 40px 36px;">
        ${stepBadge(4, 4)}
        <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 8px;text-align:center;">¡Lo has conseguido! 🏆</h2>
        ${progressBar(4, 4, "#059669")}

        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 🎉 Llevas una semana completa con BuddyOne. Eso ya es un logro. Ahora te presentamos el nivel siguiente: <strong>BuddyExperts</strong>.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #86efac;text-align:center;">
          <tr><td>
            <p style="color:#166534;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Tu logro de la semana</p>
            <p style="color:#0f172a;font-size:48px;font-weight:900;margin:0;line-height:1;">🔥 7 días</p>
            <p style="color:#059669;font-size:14px;margin:8px 0 0;">de racha activa · ¡Sigue así!</p>
          </td></tr>
        </table>

        <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">¿Qué hace un BuddyExpert por ti?</p>
        ${featureCard("📋", "Diseña tu plan nutricional personalizado", "Un nutricionista certificado analiza tu perfil y crea un plan 100% adaptado a ti, tus objetivos y tu estilo de vida.", "#f0fdf4", "#86efac", "#166534")}
        ${featureCard("📊", "Seguimiento semanal de tu progreso", "Cada semana revisa tus métricas, ajusta el plan y te da feedback personalizado.", "#f0f9ff", "#7dd3fc", "#0369a1")}
        ${featureCard("💬", "Chat directo con tu nutricionista", "Resuelve dudas, comparte fotos de tus platos y recibe orientación en tiempo real.", "#faf5ff", "#c4b5fd", "#6d28d9")}
        ${featureCard("📅", "Videoconsultas online", "Citas por videollamada desde casa, sin desplazamientos, a tu horario.", "#fff7ed", "#fed7aa", "#c2410c")}

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
          <tr><td>
            <p style="color:#f97316;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">🎁 Oferta especial para nuevos usuarios</p>
            <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 4px;">Primera consulta GRATIS</p>
            <p style="color:#94a3b8;font-size:13px;margin:0;">Solo para usuarios de la primera semana · Válido 48h</p>
          </td></tr>
        </table>

        ${cta("Conocer a los BuddyExperts", `${APP}/app/experts`, COLORS.progress)}
      </td></tr>
    `)
  },

  // ── ONBOARDING DÍA 14: MÉTRICAS Y PROGRESO ──────────────────────────────────
  {
    subject: "📈 Día 14 — ¿Estás viendo resultados? Mide tu progreso — [PRUEBA v2]",
    html: wrap(`
      ${header("📈", "2 semanas con BuddyOne", "Es hora de ver tus primeros resultados", COLORS.progress)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 💪 Llevas 2 semanas con BuddyOne. Es el momento perfecto para revisar tus métricas y ver cuánto has avanzado.</p>

        ${mockScreen(`
          <p style="color:#10b981;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">📊 Tus métricas — Semanas 1 y 2</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${statRow("⚖️ Peso inicial", "85.2 kg")}
            ${statRow("⚖️ Peso actual", "84.1 kg", "#10b981")}
            ${statRow("📉 Cambio total", "↓ 1.1 kg", "#10b981")}
            ${statRow("🔥 Días registrados", "11 de 14", "#f97316")}
            ${statRow("💪 Proteína media", "138g / día", "#7c3aed")}
          </table>
        `)}

        <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">Qué puedes medir en BuddyOne:</p>
        ${featureCard("⚖️", "Peso corporal", "Registra tu peso semanalmente y visualiza la tendencia. BuddyOne filtra las fluctuaciones diarias para mostrarte el progreso real.", "#f0fdf4", "#86efac", "#166534")}
        ${featureCard("📏", "Medidas corporales", "Cintura, cadera, pecho, brazos... Fotos de progreso con comparativa lado a lado.", "#f0f9ff", "#7dd3fc", "#0369a1")}
        ${featureCard("⚡", "Energía y bienestar", "Registra cómo te sientes cada día. BuddyOne correlaciona tu energía con tu alimentación.", "#faf5ff", "#c4b5fd", "#6d28d9")}
        ${featureCard("🏃", "Actividad física", "Conecta con Apple Health, Google Fit o Garmin para sincronizar tus entrenamientos.", "#fff7ed", "#fed7aa", "#c2410c")}

        ${cta("Ver mis métricas de progreso", `${APP}/app/metrics`, COLORS.progress)}
      </td></tr>
    `)
  },

  // ── ONBOARDING DÍA 30: RESUMEN DEL MES ──────────────────────────────────────
  {
    subject: "🏆 ¡Un mes con BuddyOne! Tu resumen completo — [PRUEBA v2]",
    html: wrap(`
      ${header("🏆", "¡Un mes completo!", "Esto es lo que has conseguido en 30 días", COLORS.progress)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 🎉 Un mes completo con BuddyOne. Eres parte del <strong>top 15%</strong> de usuarios más constantes. Aquí tienes tu resumen.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td width="48%" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;padding:20px;text-align:center;border:1.5px solid #86efac;">
              <p style="color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Días registrados</p>
              <p style="color:#0f172a;font-size:40px;font-weight:900;margin:0;line-height:1;">24/30</p>
              <p style="color:#059669;font-size:12px;margin:4px 0 0;">80% de constancia 🔥</p>
            </td>
            <td width="4%"></td>
            <td width="48%" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:14px;padding:20px;text-align:center;border:1.5px solid #fed7aa;">
              <p style="color:#c2410c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Peso perdido</p>
              <p style="color:#0f172a;font-size:40px;font-weight:900;margin:0;line-height:1;">↓2.3kg</p>
              <p style="color:#f97316;font-size:12px;margin:4px 0 0;">¡Vas por buen camino!</p>
            </td>
          </tr>
          <tr><td colspan="3" style="height:12px;"></td></tr>
          <tr>
            <td width="48%" style="background:#f8fafc;border-radius:14px;padding:20px;text-align:center;border:1.5px solid #e2e8f0;">
              <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Menús generados</p>
              <p style="color:#0f172a;font-size:40px;font-weight:900;margin:0;line-height:1;">4</p>
              <p style="color:#7c3aed;font-size:12px;margin:4px 0 0;">con IA 🤖</p>
            </td>
            <td width="4%"></td>
            <td width="48%" style="background:#f8fafc;border-radius:14px;padding:20px;text-align:center;border:1.5px solid #e2e8f0;">
              <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Racha máxima</p>
              <p style="color:#0f172a;font-size:40px;font-weight:900;margin:0;line-height:1;">🔥21</p>
              <p style="color:#f97316;font-size:12px;margin:4px 0 0;">días consecutivos</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:24px;margin:0 0 24px;text-align:center;">
          <tr><td>
            <p style="color:#f97316;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">🎁 Regalo por tu primer mes</p>
            <p style="color:#fff;font-size:18px;font-weight:800;margin:0 0 4px;">1 mes de BuddyOne Premium gratis</p>
            <p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">Usa el código: <strong style="color:#f97316;">MES1-LUIS</strong></p>
            <a href="${APP}/upgrade?code=MES1-LUIS" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 32px;border-radius:50px;">Activar mi regalo →</a>
          </td></tr>
        </table>

        ${cta("Ver mi resumen completo del mes", `${APP}/app/progress`, COLORS.progress)}
      </td></tr>
    `)
  },

  // ── RECORDATORIO: ¿ESTÁS REGISTRANDO TUS COMIDAS? ───────────────────────────
  {
    subject: "🍽️ Luis, ¿has registrado lo que has comido hoy? — [PRUEBA v2]",
    html: wrap(`
      ${header("🍽️", "¿Has registrado tus comidas hoy?", "Son las 20:00 y aún no has anotado nada", COLORS.nutrition)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 👋 Son las 20:00 y tu diario de hoy está vacío. No pasa nada — registrar ahora lo que has comido tarda menos de 2 minutos.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 24px;border:2px solid #fed7aa;text-align:center;">
          <tr><td>
            <p style="color:#c2410c;font-size:13px;font-weight:700;margin:0 0 8px;">Tu racha actual</p>
            <p style="color:#0f172a;font-size:48px;font-weight:900;margin:0;line-height:1;">🔥 12</p>
            <p style="color:#f97316;font-size:14px;font-weight:700;margin:8px 0 0;">días consecutivos</p>
            <p style="color:#92400e;font-size:13px;margin:8px 0 0;">¡No la pierdas esta noche!</p>
          </td></tr>
        </table>

        <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 16px;">Registra en segundos:</p>
        ${featureCard("📷", "Escanea el código de barras", "El método más rápido. Apunta la cámara y listo.", "#fff7ed", "#fed7aa", "#c2410c")}
        ${featureCard("🎤", "Usa la voz", "Di lo que has comido y BuddyOne lo registra automáticamente.", "#f0fdf4", "#86efac", "#166534")}
        ${featureCard("📋", "Copia de ayer", "Si hoy has comido parecido a ayer, copia el registro con un tap.", "#f0f9ff", "#7dd3fc", "#0369a1")}

        ${cta("Registrar mis comidas ahora", `${APP}/app/diary`, COLORS.nutrition)}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Puedes desactivar estos recordatorios en tu perfil → Notificaciones</p>
      </td></tr>
    `)
  },

  // ── RECORDATORIO: PESA TU PROGRESO SEMANAL ──────────────────────────────────
  {
    subject: "⚖️ Es lunes — Momento de pesarte y registrar tu progreso — [PRUEBA v2]",
    html: wrap(`
      ${header("⚖️", "¡Es lunes, hora de pesarte!", "Registra tu peso semanal para ver tu progreso real", COLORS.progress)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> ⚖️ El lunes por la mañana, en ayunas, es el mejor momento para pesarte. Es la medición más consistente y te da la tendencia real.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:20px;padding:28px;margin:0 0 24px;border:2px solid #86efac;">
          <tr><td>
            <p style="color:#166534;font-size:13px;font-weight:700;margin:0 0 16px;">📊 Tu evolución de peso</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${statRow("Semana 1", "85.2 kg")}
              ${statRow("Semana 2", "84.8 kg", "#059669")}
              ${statRow("Semana 3", "84.1 kg", "#059669")}
              ${statRow("Semana 4 (hoy)", "¿?", "#94a3b8")}
            </table>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:16px;padding:20px 24px;margin:0 0 24px;border:1.5px solid #c4b5fd;">
          <tr><td>
            <p style="color:#6d28d9;font-size:14px;font-weight:700;margin:0 0 8px;">💡 ¿Por qué pesarse el lunes en ayunas?</p>
            <p style="color:#4c1d95;font-size:14px;line-height:1.6;margin:0;">El peso fluctúa hasta ±2kg al día según la hidratación, digestión y ciclo hormonal. Pesarte siempre en las mismas condiciones elimina el ruido y muestra la tendencia real de tu progreso.</p>
          </td></tr>
        </table>

        ${cta("Registrar mi peso de hoy", `${APP}/app/metrics/weight`, COLORS.progress)}
      </td></tr>
    `)
  },

  // ── NOVEDADES DE BUDDYONE ────────────────────────────────────────────────────
  {
    subject: "🚀 Novedades BuddyOne — Junio 2026 — [PRUEBA v2]",
    html: wrap(`
      ${header("🚀", "Novedades de BuddyOne", "Junio 2026 — Lo nuevo que hemos lanzado para ti", COLORS.news)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 👋 Este mes hemos lanzado nuevas funcionalidades que van a cambiar tu experiencia. Aquí tienes el resumen.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;padding:28px;margin:0 0 20px;">
          <tr><td>
            <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🆕 NUEVO</p>
            <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px;">Análisis de platos con foto</p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">Fotografía tu plato y la IA estima automáticamente las calorías y macros. Sin escanear, sin buscar — solo una foto.</p>
            <a href="${APP}/app/diary" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:50px;">Probar ahora →</a>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;padding:28px;margin:0 0 20px;">
          <tr><td>
            <p style="color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🆕 NUEVO</p>
            <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px;">Retos sociales</p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">Crea retos con amigos, compite en rankings y celebra los logros juntos. La constancia es más fácil en compañía.</p>
            <a href="${APP}/app/challenges" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:50px;">Ver retos →</a>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;padding:28px;margin:0 0 20px;">
          <tr><td>
            <p style="color:#0ea5e9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🆕 NUEVO</p>
            <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px;">Integración con Oura Ring y Garmin</p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">Sincroniza tus datos de sueño, frecuencia cardíaca y actividad. BuddyOne ajusta tus recomendaciones nutricionales según tu recuperación.</p>
            <a href="${APP}/app/integrations" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:50px;">Conectar dispositivo →</a>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;padding:28px;margin:0 0 24px;">
          <tr><td>
            <p style="color:#10b981;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🆕 NUEVO</p>
            <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px;">Modo offline completo</p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">Registra comidas, consulta tu menú y accede a tus recetas sin conexión. Todo se sincroniza automáticamente cuando vuelves a conectarte.</p>
            <a href="${APP}/app" style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:50px;">Explorar →</a>
          </td></tr>
        </table>

        ${cta("Ver todas las novedades", `${APP}/novedades`, COLORS.news)}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Recibes este email porque te suscribiste a las novedades de BuddyOne · <a href="${APP}/baja" style="color:#64748b;">Darse de baja</a></p>
      </td></tr>
    `)
  },

  // ── TIP NUTRICIONAL SEMANAL ──────────────────────────────────────────────────
  {
    subject: "💡 Tip de la semana — El error que comete el 80% de la gente — [PRUEBA v2]",
    html: wrap(`
      ${header("💡", "Tip nutricional de la semana", "El error que comete el 80% de la gente al hacer dieta", COLORS.tips)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 🌱 Cada semana te traemos un consejo nutricional basado en evidencia científica. Esta semana:</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:20px;padding:32px;margin:0 0 24px;border:2px solid #86efac;text-align:center;">
          <tr><td>
            <p style="font-size:56px;margin:0 0 16px;">🥩</p>
            <p style="color:#166534;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">El error #1</p>
            <p style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 12px;">No comer suficiente proteína</p>
            <p style="color:#166534;font-size:14px;line-height:1.7;margin:0;">El 80% de las personas que hacen dieta no llegan a su objetivo de proteína diario. Resultado: pierden músculo en lugar de grasa, se sienten con hambre y abandonan.</p>
          </td></tr>
        </table>

        <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">¿Cuánta proteína necesitas?</p>
        ${featureCard("🎯", "Objetivo general: 1.6–2.2g por kg de peso", "Si pesas 80kg, necesitas entre 128g y 176g de proteína al día. La mayoría come menos de 80g.", "#f0fdf4", "#86efac", "#166534")}
        ${featureCard("🍗", "Fuentes de proteína de calidad", "Pollo, pavo, huevos, atún, salmón, tofu, legumbres, yogur griego. BuddyOne te ayuda a llegar al objetivo.", "#fff7ed", "#fed7aa", "#c2410c")}
        ${featureCard("⏰", "Distribuye la proteína en 4-5 comidas", "El cuerpo absorbe mejor la proteína en dosis de 30-40g. No la concentres toda en la cena.", "#faf5ff", "#c4b5fd", "#6d28d9")}

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:16px;padding:20px 24px;margin:24px 0;border:1.5px solid #c4b5fd;">
          <tr><td>
            <p style="color:#6d28d9;font-size:14px;font-weight:700;margin:0 0 8px;">🤖 BuddyOne te ayuda</p>
            <p style="color:#4c1d95;font-size:14px;line-height:1.6;margin:0;">Activa el objetivo de proteína en tu perfil y BuddyOne te avisará cuando estés por debajo. Tu menú semanal con IA ya está optimizado para que llegues a tu objetivo sin esfuerzo.</p>
          </td></tr>
        </table>

        ${cta("Ver mi objetivo de proteína", `${APP}/app/profile/goals`, COLORS.tips)}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Recibes este email porque activaste los tips nutricionales · <a href="${APP}/baja" style="color:#64748b;">Darse de baja</a></p>
      </td></tr>
    `)
  },

  // ── REENGAGEMENT AVANZADO: 7 DÍAS SIN REGISTRAR ─────────────────────────────
  {
    subject: "😔 Luis, llevas 7 días sin registrar — ¿Estás bien? — [PRUEBA v2]",
    html: wrap(`
      ${header("😔", "Te echamos de menos, Luis", "Llevas 7 días sin registrar tus comidas", COLORS.nutrition)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 👋 Llevas una semana sin abrir BuddyOne. Sabemos que la vida se complica. Sin juicios — solo queremos ayudarte a retomar el camino.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 24px;border:2px solid #fed7aa;text-align:center;">
          <tr><td>
            <p style="color:#c2410c;font-size:13px;font-weight:700;margin:0 0 8px;">Tu última racha</p>
            <p style="color:#0f172a;font-size:48px;font-weight:900;margin:0;line-height:1;">🔥 12</p>
            <p style="color:#f97316;font-size:14px;font-weight:700;margin:8px 0 0;">días consecutivos</p>
            <p style="color:#92400e;font-size:13px;margin:8px 0 0;">Puedes volver a construirla. Empieza hoy.</p>
          </td></tr>
        </table>

        <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">¿Qué puede estar pasando?</p>
        ${featureCard("😓", "¿Demasiado complicado?", "Prueba el modo simplificado: solo registra proteína y calorías. 30 segundos al día.", "#fef2f2", "#fecaca", "#b91c1c")}
        ${featureCard("🤷", "¿No sabes qué comer?", "Genera un menú semanal con IA ahora mismo. En 30 segundos tienes todo planificado.", "#fff7ed", "#fed7aa", "#c2410c")}
        ${featureCard("💪", "¿Necesitas más motivación?", "Únete a un reto con amigos o conecta con un BuddyExpert que te acompañe.", "#f0fdf4", "#86efac", "#166534")}

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
          <tr><td>
            <p style="color:#f97316;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">🎁 Para que vuelvas</p>
            <p style="color:#fff;font-size:18px;font-weight:800;margin:0 0 4px;">7 días de Premium gratis</p>
            <p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">Actívalo ahora — caduca en 48 horas</p>
            <a href="${APP}/app?promo=vuelta7" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 32px;border-radius:50px;">Volver a BuddyOne →</a>
          </td></tr>
        </table>

        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Si quieres pausar los recordatorios, puedes hacerlo en <a href="${APP}/app/settings/notifications" style="color:#64748b;">Ajustes → Notificaciones</a></p>
      </td></tr>
    `)
  },

  // ── RECETA DE LA SEMANA ──────────────────────────────────────────────────────
  {
    subject: "👨‍🍳 Receta de la semana — Pollo al limón con quinoa (35 min) — [PRUEBA v2]",
    html: wrap(`
      ${header("👨‍🍳", "Receta de la semana", "Pollo al limón con quinoa · 35 min · 487 kcal", COLORS.nutrition)}
      <tr><td style="padding:44px 40px 36px;">
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 🍋 Esta semana te traemos una receta alta en proteína, fácil de preparar y deliciosa. Perfecta para tu objetivo.</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 24px;border:2px solid #fed7aa;">
          <tr><td>
            <p style="color:#c2410c;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">📊 Información nutricional (por ración)</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;margin:4px;">
                  <p style="color:#c2410c;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">KCAL</p>
                  <p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">487</p>
                </td>
                <td width="8px"></td>
                <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;">
                  <p style="color:#7c3aed;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">PROTEÍNA</p>
                  <p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">48g</p>
                </td>
                <td width="8px"></td>
                <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;">
                  <p style="color:#0ea5e9;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">CARBS</p>
                  <p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">38g</p>
                </td>
                <td width="8px"></td>
                <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;">
                  <p style="color:#059669;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">GRASA</p>
                  <p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">14g</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">🛒 Ingredientes (2 raciones):</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:14px;padding:20px;margin:0 0 24px;border:1px solid #e2e8f0;">
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🍗 Pechuga de pollo</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">300g</td></tr>
              <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🌾 Quinoa</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">160g (seco)</td></tr>
              <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🍋 Limón</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">2 unidades</td></tr>
              <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🧄 Ajo</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">3 dientes</td></tr>
              <tr><td style="color:#475569;font-size:14px;padding:5px 0;">🫒 Aceite de oliva</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;">20ml</td></tr>
            </table>
          </td></tr>
        </table>

        ${cta("Ver receta completa + vídeo", `${APP}/app/recipes`, COLORS.nutrition)}
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">¿Quieres añadir esta receta a tu menú de esta semana? <a href="${APP}/app/menus" style="color:#f97316;font-weight:700;">Añadir al menú →</a></p>
      </td></tr>
    `)
  },

];

// ─── ENVIAR ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📧 Enviando ${EMAILS.length} nuevos templates a ${TO}\n`);
  let ok = 0, fail = 0;
  for (let i = 0; i < EMAILS.length; i++) {
    const e = EMAILS[i];
    const { data, error } = await resend.emails.send({ from: FROM, to: TO, subject: e.subject, html: e.html });
    if (error) { console.error(`  ❌ [${i+1}/${EMAILS.length}] ${e.subject.substring(0,55)}...`); console.error(`     ${JSON.stringify(error)}`); fail++; }
    else { console.log(`  ✅ [${i+1}/${EMAILS.length}] ${e.subject.substring(0,60)}`); ok++; }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n✅ Enviados: ${ok}/${EMAILS.length}${fail ? ` · ❌ Fallidos: ${fail}` : ""}`);
  console.log(`📬 Revisa tu bandeja en ${TO}\n`);
}
main().catch(console.error);
