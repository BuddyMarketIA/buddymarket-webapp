import { Resend } from "resend";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Luis de BuddyOne <luis@buddyone.io>";
const TO = "luismariaccc@gmail.com";
const APP = "https://buddyone.io";

// Read logo base64
const logoB64 = readFileSync("/home/ubuntu/webdev-static-assets/buddyone-logo-b64.txt", "utf8").trim();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function emailWrapper(content) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F2F5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
${content}
<tr><td style="background:#0f172a;padding:36px 40px;text-align:center;">
<table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>
<td style="vertical-align:middle;padding-right:10px;"><img src="data:image/png;base64,${logoB64}" width="40" height="40" alt="BuddyOne" style="display:block;border-radius:10px;"></td>
<td style="vertical-align:middle;"><span style="color:#fff;font-size:20px;font-weight:800;">BuddyOne</span></td>
</tr></table>
<p style="color:#475569;font-size:13px;margin:0 0 12px;line-height:1.6;">Tu compañero de nutrición inteligente</p>
<p style="margin:0;"><a href="${APP}" style="color:#f97316;text-decoration:none;font-size:13px;font-weight:600;">buddyone.io</a> &nbsp;·&nbsp; <a href="${APP}/privacidad" style="color:#64748b;text-decoration:none;font-size:12px;">Privacidad</a> &nbsp;·&nbsp; <a href="${APP}/soporte" style="color:#64748b;text-decoration:none;font-size:12px;">Soporte</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function emailHeader(emoji, title, subtitle, bg = "linear-gradient(135deg,#f97316 0%,#ef4444 100%)") {
  return `<tr><td style="background:${bg};padding:44px 40px 36px;text-align:center;">
<table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>
<td style="vertical-align:middle;padding-right:10px;"><img src="data:image/png;base64,${logoB64}" width="44" height="44" alt="BuddyOne" style="display:block;border-radius:11px;box-shadow:0 4px 12px rgba(0,0,0,0.2);"></td>
<td style="vertical-align:middle;"><span style="color:#fff;font-size:22px;font-weight:800;">BuddyOne</span></td>
</tr></table>
<div style="font-size:52px;margin-bottom:16px;">${emoji}</div>
<h1 style="color:#fff;font-size:30px;font-weight:800;margin:0 0 10px;line-height:1.2;">${title}</h1>
<p style="color:rgba(255,255,255,0.88);font-size:16px;margin:0;line-height:1.6;max-width:440px;margin:0 auto;">${subtitle}</p>
</td></tr>
<tr><td style="padding:0;height:4px;background:linear-gradient(90deg,#fbbf24 0%,#f97316 50%,#ef4444 100%);"></td></tr>`;
}

function ctaButton(text, url) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;"><tr><td align="center">
<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#f97316 0%,#ef4444 100%);color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 44px;border-radius:50px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">${text} →</a>
</td></tr></table>`;
}

function featureCard(emoji, title, desc, bg = "#fff7ed", border = "#fed7aa", titleColor = "#c2410c") {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:16px;padding:20px 24px;margin:0 0 16px;border:1.5px solid ${border};">
<tr><td width="52" style="vertical-align:top;padding-right:16px;font-size:32px;line-height:1;">${emoji}</td>
<td style="vertical-align:top;"><p style="color:${titleColor};font-size:15px;font-weight:700;margin:0 0 6px;">${title}</p><p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">${desc}</p></td>
</tr></table>`;
}

function stepProgress(step, total, color = "#7c3aed") {
  const pct = Math.round((step / total) * 100);
  return `<p style="color:#94a3b8;font-size:12px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Paso ${step} de ${total}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;"><tr><td style="background:#f1f5f9;border-radius:50px;height:8px;overflow:hidden;">
<div style="background:${color};width:${pct}%;height:8px;border-radius:50px;"></div></td></tr></table>`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

const emails = [
  {
    subject: "[PRUEBA] 🎉 ¡Bienvenido a BuddyOne! Tu guía de inicio",
    html: emailWrapper(
      emailHeader("🎉", "¡Bienvenido a BuddyOne!", "Todo lo que necesitas para cuidarte, en un solo lugar", "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      ${stepProgress(1, 4, "#7c3aed")}
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 👋 Acabas de unirte a BuddyOne. En los próximos días te presentaremos todo lo que puedes hacer.</p>
      ${featureCard("🥗", "BuddyMarket — Tu despensa inteligente", "Gestiona tu inventario, genera la lista de la compra automáticamente y descubre qué recetas puedes cocinar con lo que tienes en casa.")}
      ${featureCard("🤖", "Menús con IA — Personalizados para ti", "La IA genera tu menú semanal completo basándose en tus objetivos, preferencias y alergias. Listo en 30 segundos.", "#faf5ff", "#c4b5fd", "#6d28d9")}
      ${featureCard("👨‍⚕️", "BuddyExperts — Tu nutricionista online", "Conecta con nutricionistas certificados que diseñan tu plan personalizado y hacen seguimiento semanal.", "#f0f9ff", "#7dd3fc", "#0369a1")}
      ${featureCard("📊", "Diario nutricional — Registra lo que comes", "Escanea el código de barras, busca alimentos o dicta por voz. BuddyOne calcula tus macros automáticamente.", "#f0fdf4", "#86efac", "#166534")}
      ${featureCard("🏆", "Retos y logros — Mantente motivado", "Completa retos diarios, desbloquea logros y mantén tu racha activa.", "#fffbeb", "#fde68a", "#92400e")}
      ${ctaButton("Empezar mi aventura en BuddyOne", APP + "/app")}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">Mañana te contamos cómo registrar tus comidas de forma rápida 📱</p>
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 📱 Día 2 — Registra tus comidas en 10 segundos",
    html: emailWrapper(
      emailHeader("📱", "Registra lo que comes", "El diario nutricional más rápido que has visto", "linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      ${stepProgress(2, 4, "#7c3aed")}
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 👋 El mayor secreto del éxito nutricional es <strong>saber qué estás comiendo</strong>. BuddyOne lo hace tan fácil que no tendrás excusa.</p>
      ${featureCard("📷", "Escanea el código de barras", "Apunta la cámara al producto y BuddyOne rellena todos los datos nutricionales automáticamente.")}
      ${featureCard("🔍", "Busca en nuestra base de datos", "Más de 2 millones de alimentos españoles y europeos. Busca por nombre y añade en un tap.", "#f0f9ff", "#7dd3fc", "#0369a1")}
      ${featureCard("🎤", "Dicta por voz", "Di 'pollo a la plancha 150 gramos' y BuddyOne lo registra automáticamente.", "#f0fdf4", "#86efac", "#166534")}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:16px;padding:20px 24px;margin:24px 0;border:1.5px solid #c4b5fd;">
        <tr><td><p style="color:#6d28d9;font-size:14px;font-weight:700;margin:0 0 8px;">💡 Tip de hoy</p>
        <p style="color:#4c1d95;font-size:14px;line-height:1.6;margin:0;">Registrar las comidas durante <strong>21 días seguidos</strong> aumenta un 73% las probabilidades de alcanzar tu objetivo de peso.</p></td></tr>
      </table>
      ${ctaButton("Registrar mi primera comida", APP + "/app/diary")}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">En 2 días: cómo generar tu menú semanal con IA 🤖</p>
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 🤖 Día 4 — Tu menú semanal generado por IA en 30 segundos",
    html: emailWrapper(
      emailHeader("🤖", "Menús con IA para toda la semana", "Personalizados. Automáticos. Deliciosos.", "linear-gradient(135deg,#f97316 0%,#ef4444 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      ${stepProgress(3, 4, "#f97316")}
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 🤖 ¿Y si no tuvieras que pensar nunca más qué comer? BuddyOne genera tu menú semanal completo en 30 segundos.</p>
      ${featureCard("🎯", "Tus objetivos personales", "Pérdida de peso, ganancia muscular, mantenimiento o rendimiento deportivo.")}
      ${featureCard("🚫", "Tus alergias e intolerancias", "Sin gluten, sin lactosa, vegetariano, vegano... BuddyOne lo respeta siempre.", "#fef2f2", "#fecaca", "#b91c1c")}
      ${featureCard("🛒", "Lo que tienes en casa", "Conectado con tu inventario, la IA prioriza los ingredientes que ya tienes.", "#f0fdf4", "#86efac", "#166534")}
      ${featureCard("💰", "Tu presupuesto semanal", "Indica cuánto quieres gastar y la IA optimiza el menú para ajustarse.", "#fffbeb", "#fde68a", "#92400e")}
      ${ctaButton("Generar mi primer menú con IA", APP + "/app/menus/generate")}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">En 3 días: cómo conectar con un nutricionista experto 👨‍⚕️</p>
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 👨‍⚕️ ¡Una semana con BuddyOne! Conoce a tus nutricionistas",
    html: emailWrapper(
      emailHeader("👨‍⚕️", "¡Una semana con BuddyOne!", "Ahora conoce a tus nutricionistas online", "linear-gradient(135deg,#059669 0%,#047857 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      ${stepProgress(4, 4, "#059669")}
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 🎉 Llevas una semana completa con BuddyOne. Eso ya es un logro. Ahora te presentamos el nivel siguiente: <strong>BuddyExperts</strong>.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:20px;padding:28px;margin:0 0 28px;border:2px solid #86efac;text-align:center;">
        <tr><td><p style="color:#166534;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Tu logro de la semana</p>
        <p style="color:#0f172a;font-size:48px;font-weight:900;margin:0;line-height:1;">🔥 7 días</p>
        <p style="color:#059669;font-size:14px;margin:8px 0 0;">de racha activa · ¡Sigue así!</p></td></tr>
      </table>
      ${featureCard("📋", "Plan nutricional personalizado", "Un nutricionista certificado analiza tu perfil y crea un plan 100% adaptado a ti.", "#f0fdf4", "#86efac", "#166534")}
      ${featureCard("📊", "Seguimiento semanal", "Cada semana revisa tus métricas, ajusta el plan y te da feedback personalizado.", "#f0f9ff", "#7dd3fc", "#0369a1")}
      ${featureCard("💬", "Chat directo con tu nutricionista", "Resuelve dudas, comparte fotos de tus platos y recibe orientación en tiempo real.", "#faf5ff", "#c4b5fd", "#6d28d9")}
      ${ctaButton("Conocer a los BuddyExperts", APP + "/app/experts")}
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 📈 Día 14 — ¿Estás viendo resultados? Mide tu progreso",
    html: emailWrapper(
      emailHeader("📈", "2 semanas con BuddyOne", "Es hora de ver tus primeros resultados", "linear-gradient(135deg,#059669 0%,#047857 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 💪 Llevas 2 semanas con BuddyOne. Es el momento perfecto para revisar tus métricas.</p>
      ${featureCard("⚖️", "Peso corporal", "Registra tu peso semanalmente y visualiza la tendencia real de tu progreso.", "#f0fdf4", "#86efac", "#166534")}
      ${featureCard("📏", "Medidas corporales", "Cintura, cadera, pecho, brazos... Fotos de progreso con comparativa lado a lado.", "#f0f9ff", "#7dd3fc", "#0369a1")}
      ${featureCard("⚡", "Energía y bienestar", "Registra cómo te sientes cada día. BuddyOne correlaciona tu energía con tu alimentación.", "#faf5ff", "#c4b5fd", "#6d28d9")}
      ${featureCard("🏃", "Actividad física", "Conecta con Apple Health, Google Fit o Garmin para sincronizar tus entrenamientos.", "#fff7ed", "#fed7aa", "#c2410c")}
      ${ctaButton("Ver mis métricas de progreso", APP + "/app/metrics")}
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 🍽️ Luis, ¿has registrado lo que has comido hoy?",
    html: emailWrapper(
      emailHeader("🍽️", "¿Has registrado tus comidas hoy?", "Son las 20:00 y aún no has anotado nada", "linear-gradient(135deg,#f97316 0%,#ef4444 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 👋 Son las 20:00 y tu diario de hoy está vacío. Registrar ahora lo que has comido tarda menos de 2 minutos.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 24px;border:2px solid #fed7aa;text-align:center;">
        <tr><td><p style="color:#c2410c;font-size:13px;font-weight:700;margin:0 0 8px;">Tu racha actual</p>
        <p style="color:#0f172a;font-size:48px;font-weight:900;margin:0;line-height:1;">🔥 12</p>
        <p style="color:#f97316;font-size:14px;font-weight:700;margin:8px 0 0;">días consecutivos · ¡No la pierdas esta noche!</p></td></tr>
      </table>
      ${featureCard("📷", "Escanea el código de barras", "El método más rápido. Apunta la cámara y listo.")}
      ${featureCard("🎤", "Usa la voz", "Di lo que has comido y BuddyOne lo registra automáticamente.", "#f0fdf4", "#86efac", "#166534")}
      ${featureCard("📋", "Copia de ayer", "Si hoy has comido parecido a ayer, copia el registro con un tap.", "#f0f9ff", "#7dd3fc", "#0369a1")}
      ${ctaButton("Registrar mis comidas ahora", APP + "/app/diary")}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Puedes desactivar estos recordatorios en tu perfil → Notificaciones</p>
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] ⚖️ Es lunes — Momento de pesarte y registrar tu progreso",
    html: emailWrapper(
      emailHeader("⚖️", "¡Es lunes, hora de pesarte!", "Registra tu peso semanal para ver tu progreso real", "linear-gradient(135deg,#059669 0%,#047857 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> ⚖️ El lunes por la mañana, en ayunas, es el mejor momento para pesarte. Es la medición más consistente.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#faf5ff,#ede9fe);border-radius:16px;padding:20px 24px;margin:0 0 24px;border:1.5px solid #c4b5fd;">
        <tr><td><p style="color:#6d28d9;font-size:14px;font-weight:700;margin:0 0 8px;">💡 ¿Por qué pesarse el lunes en ayunas?</p>
        <p style="color:#4c1d95;font-size:14px;line-height:1.6;margin:0;">El peso fluctúa hasta ±2kg al día según la hidratación y digestión. Pesarte siempre en las mismas condiciones elimina el ruido y muestra la tendencia real de tu progreso.</p></td></tr>
      </table>
      ${ctaButton("Registrar mi peso de hoy", APP + "/app/metrics/weight")}
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 🚀 Novedades BuddyOne — Junio 2026",
    html: emailWrapper(
      emailHeader("🚀", "Novedades de BuddyOne", "Junio 2026 — Lo nuevo que hemos lanzado para ti", "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">Hola <strong>Luis</strong> 👋 Este mes hemos lanzado nuevas funcionalidades. Aquí tienes el resumen.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;padding:28px;margin:0 0 16px;">
        <tr><td><p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🆕 NUEVO</p>
        <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px;">Análisis de platos con foto</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">Fotografía tu plato y la IA estima automáticamente las calorías y macros. Sin escanear, sin buscar — solo una foto.</p>
        <a href="${APP}/app/diary" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:50px;">Probar ahora →</a></td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;padding:28px;margin:0 0 16px;">
        <tr><td><p style="color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🆕 NUEVO</p>
        <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px;">Retos sociales</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">Crea retos con amigos, compite en rankings y celebra los logros juntos. La constancia es más fácil en compañía.</p>
        <a href="${APP}/app/challenges" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:50px;">Ver retos →</a></td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;padding:28px;margin:0 0 24px;">
        <tr><td><p style="color:#0ea5e9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 12px;">🆕 NUEVO</p>
        <p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 8px;">Integración con Oura Ring y Garmin</p>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 16px;">Sincroniza tus datos de sueño, frecuencia cardíaca y actividad. BuddyOne ajusta tus recomendaciones según tu recuperación.</p>
        <a href="${APP}/app/integrations" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 24px;border-radius:50px;">Conectar dispositivo →</a></td></tr>
      </table>
      ${ctaButton("Ver todas las novedades", APP + "/novedades")}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Recibes este email porque te suscribiste a las novedades · <a href="${APP}/baja" style="color:#64748b;">Darse de baja</a></p>
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 💡 Tip de la semana — La proteína en el desayuno",
    html: emailWrapper(
      emailHeader("💡", "Tip nutricional de la semana", "La proteína en el desayuno", "linear-gradient(135deg,#059669 0%,#0d9488 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 🌱 Cada semana te traemos un consejo nutricional basado en evidencia científica.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:20px;padding:32px;margin:0 0 24px;border:2px solid #86efac;text-align:center;">
        <tr><td><p style="font-size:56px;margin:0 0 16px;">🥚</p>
        <p style="color:#166534;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Tip de la semana</p>
        <p style="color:#0f172a;font-size:22px;font-weight:800;margin:0 0 12px;">La proteína en el desayuno reduce el hambre todo el día</p>
        <p style="color:#166534;font-size:14px;line-height:1.7;margin:0;">Incluir al menos <strong>25-30g de proteína en el desayuno</strong> reduce los niveles de grelina (hormona del hambre) durante las siguientes 6 horas. Huevos, yogur griego, queso cottage o proteína en polvo son opciones perfectas. Resultado: menos picoteo y más saciedad.</p></td></tr>
      </table>
      ${ctaButton("Aplicar este tip en mi plan", APP + "/app")}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Recibes este email porque activaste los tips nutricionales · <a href="${APP}/baja" style="color:#64748b;">Darse de baja</a></p>
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 😔 Luis, llevas 7 días sin registrar — ¿Estás bien?",
    html: emailWrapper(
      emailHeader("😔", "Te echamos de menos, Luis", "Llevas 7 días sin registrar tus comidas", "linear-gradient(135deg,#f97316 0%,#ef4444 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 👋 Llevas 7 días sin abrir BuddyOne. Sin juicios — solo queremos ayudarte a retomar el camino.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 24px;border:2px solid #fed7aa;text-align:center;">
        <tr><td><p style="color:#c2410c;font-size:13px;font-weight:700;margin:0 0 8px;">Tu última racha</p>
        <p style="color:#0f172a;font-size:48px;font-weight:900;margin:0;line-height:1;">🔥 12</p>
        <p style="color:#f97316;font-size:14px;font-weight:700;margin:8px 0 0;">días consecutivos · Puedes volver a construirla</p></td></tr>
      </table>
      ${featureCard("😓", "¿Demasiado complicado?", "Prueba el modo simplificado: solo registra proteína y calorías. 30 segundos al día.", "#fef2f2", "#fecaca", "#b91c1c")}
      ${featureCard("🤷", "¿No sabes qué comer?", "Genera un menú semanal con IA ahora mismo. En 30 segundos tienes todo planificado.")}
      ${featureCard("💪", "¿Necesitas más motivación?", "Únete a un reto con amigos o conecta con un BuddyExpert que te acompañe.", "#f0fdf4", "#86efac", "#166534")}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
        <tr><td><p style="color:#f97316;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">🎁 Para que vuelvas</p>
        <p style="color:#fff;font-size:18px;font-weight:800;margin:0 0 4px;">7 días de Premium gratis</p>
        <p style="color:#94a3b8;font-size:13px;margin:0 0 16px;">Actívalo ahora — caduca en 48 horas</p>
        <a href="${APP}/app?promo=vuelta7" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 32px;border-radius:50px;">Volver a BuddyOne →</a></td></tr>
      </table>
      </td></tr>`
    )
  },
  {
    subject: "[PRUEBA] 👨‍🍳 Receta de la semana — Pollo al limón con quinoa (25 min)",
    html: emailWrapper(
      emailHeader("👨‍🍳", "Receta de la semana", "Pollo al limón con quinoa · 25 min · 420 kcal", "linear-gradient(135deg,#f97316 0%,#ef4444 100%)") +
      `<tr><td style="padding:44px 40px 36px;">
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">Hola <strong>Luis</strong> 🍳 Esta semana te traemos una receta alta en proteína, fácil de preparar y deliciosa. Perfecta para tu objetivo.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border-radius:20px;padding:28px;margin:0 0 24px;border:2px solid #fed7aa;">
        <tr><td><p style="color:#c2410c;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">📊 Información nutricional (por ración)</p>
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;"><p style="color:#c2410c;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">KCAL</p><p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">420</p></td>
          <td width="8px"></td>
          <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;"><p style="color:#7c3aed;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">PROTEÍNA</p><p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">42g</p></td>
          <td width="8px"></td>
          <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;"><p style="color:#0ea5e9;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">CARBS</p><p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">35g</p></td>
          <td width="8px"></td>
          <td style="text-align:center;padding:12px;background:rgba(255,255,255,0.5);border-radius:10px;"><p style="color:#059669;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">GRASA</p><p style="color:#0f172a;font-size:28px;font-weight:900;margin:0;">8g</p></td>
        </tr></table></td></tr>
      </table>
      <p style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 16px;">🛒 Ingredientes (2 raciones):</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:14px;padding:20px;margin:0 0 24px;border:1px solid #e2e8f0;"><tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🍗 Pechuga de pollo</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">400g</td></tr>
          <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🌾 Quinoa</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">160g (seca)</td></tr>
          <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🍋 Limón</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">2 unidades</td></tr>
          <tr><td style="color:#475569;font-size:14px;padding:5px 0;border-bottom:1px solid #e2e8f0;">🧄 Ajo</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;border-bottom:1px solid #e2e8f0;">3 dientes</td></tr>
          <tr><td style="color:#475569;font-size:14px;padding:5px 0;">🫒 Aceite de oliva</td><td style="color:#0f172a;font-size:14px;font-weight:700;text-align:right;padding:5px 0;">2 cucharadas</td></tr>
        </table>
      </td></tr></table>
      ${ctaButton("Ver receta completa + vídeo", APP + "/app/recipes")}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">¿Quieres añadir esta receta a tu menú? <a href="${APP}/app/menus" style="color:#f97316;font-weight:700;">Añadir al menú →</a></p>
      </td></tr>`
    )
  }
];

async function sendAll() {
  let sent = 0;
  for (const email of emails) {
    try {
      const res = await resend.emails.send({ from: FROM, to: TO, subject: email.subject, html: email.html });
      if (res.error) {
        console.log(`❌ ${email.subject.substring(0,50)} — ${res.error.message}`);
      } else {
        sent++;
        console.log(`✅ ${sent}/${emails.length} — ${email.subject.substring(0,60)}`);
      }
    } catch (e) {
      console.log(`❌ Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n🎉 Completado: ${sent}/${emails.length} emails enviados a ${TO}`);
}

sendAll();
