import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified Resend domain as sender. To use a custom domain (info@buddyone.io),
// verify buddyone.io at https://resend.com/domains and update this value.
const CUSTOM_FROM_EMAIL = process.env.EMAIL_FROM || "Luis de BuddyOne <luis@buddyone.io>";
const FROM_EMAIL = CUSTOM_FROM_EMAIL;
const APP_URL = process.env.PUBLIC_APP_URL || "https://buddyone.io";

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background-color:#F0F2F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
          ${content}
          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:36px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <img src="data:image/png;base64,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" width="40" height="40" alt="BuddyOne" style="display:block;border-radius:10px;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Buddy<span style="background:linear-gradient(135deg,#f97316,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">One</span></span>
                  </td>
                </tr>
              </table>
              <p style="color:#64748b;font-size:13px;margin:0 0 16px;line-height:1.7;">
                Has recibido este correo porque eres usuario de <strong style="color:#94a3b8;">BuddyOne</strong>.<br>
                Si tienes alguna pregunta, responde a este email o visita nuestro soporte en <a href="${APP_URL}/soporte" style="color:#f97316;text-decoration:none;">buddyone.io/soporte</a>.
              </p>
              <p style="margin:0 0 16px;">
                <a href="${APP_URL}" style="color:#f97316;text-decoration:none;font-size:13px;font-weight:700;">buddyone.io</a>
                <span style="color:#1e293b;margin:0 10px;">·</span>
                <a href="${APP_URL}/privacidad" style="color:#64748b;text-decoration:none;font-size:13px;">Privacidad</a>
                <span style="color:#1e293b;margin:0 10px;">·</span>
                <a href="${APP_URL}/baja" style="color:#64748b;text-decoration:none;font-size:13px;">Darse de baja</a>
              </p>
              <p style="color:#334155;font-size:12px;margin:0;line-height:1.6;">© 2026 BuddyOne · El sistema operativo de tu bienestar · Hecho con 🧡 en España</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailHeader(emoji: string, title: string, subtitle: string, bgColor = "linear-gradient(135deg,#f97316 0%,#ef4444 100%)"): string {
  return `
  <tr>
    <td style="background:${bgColor};padding:48px 40px 40px;text-align:center;position:relative;">
      <!-- Logo -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="vertical-align:middle;padding-right:10px;">
            <img src="data:image/png;base64,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" width="44" height="44" alt="BuddyOne" style="display:block;border-radius:11px;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          </td>
          <td style="vertical-align:middle;">
            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 1px 3px rgba(0,0,0,0.2);">Buddy<span style="color:rgba(255,255,255,0.75);">One</span></span>
          </td>
        </tr>
      </table>
      <!-- Emoji & Title -->
      <div style="font-size:52px;margin-bottom:16px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.15));">${emoji}</div>
      <h1 style="color:#ffffff;font-size:30px;font-weight:800;margin:0 0 10px;line-height:1.2;text-shadow:0 1px 3px rgba(0,0,0,0.15);">${title}</h1>
      <p style="color:rgba(255,255,255,0.88);font-size:16px;margin:0;line-height:1.6;max-width:440px;margin:0 auto;">${subtitle}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0;height:4px;background:linear-gradient(90deg,#fbbf24 0%,#f97316 50%,#ef4444 100%);"></td>
  </tr>`;
}

function ctaButton(text: string, url: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#f97316 0%,#ef4444 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 44px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(249,115,22,0.4);">${text} →</a>
      </td>
    </tr>
  </table>`;
}

// ─── Welcome Email (Day 0) ────────────────────────────────────────────────────

function welcomeEmailHtml(name: string, accountType: string): string {
  const firstName = name?.split(" ")[0] || "amigo";
  const isCreator = accountType === "buddymaker" || accountType === "buddyexpert";

  const roleMessage = isCreator
    ? `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Tu solicitud como <strong>${accountType === "buddymaker" ? "BuddyMaker" : "BuddyExpert"}</strong> está siendo revisada por nuestro equipo. 
        Te avisaremos en cuanto sea aprobada. Mientras tanto, ya puedes explorar todas las funcionalidades de BuddyOne.
      </p>`
    : `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Tu cuenta está lista. Empieza a explorar recetas personalizadas, planifica tus menús semanales 
        y lleva el control de tu nutrición de forma inteligente.
      </p>`;

  const body = `
  ${emailHeader("🎉", `¡Bienvenido, ${firstName}!`, "Tu viaje hacia una nutrición inteligente empieza aquí")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#1a1a1a;font-size:17px;font-weight:600;margin:0 0 8px;">Tu cuenta está activa ✅</p>
      ${roleMessage}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">🍽️</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Recetas personalizadas</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Miles de recetas adaptadas a tus objetivos</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">📅</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Menús semanales</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Planifica toda la semana con un solo clic</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">🛒</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Lista de la compra</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Generada automáticamente desde tu menú</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">📊</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Diario nutricional</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Registra lo que comes y sigue tus macros</div>
          </td>
        </tr>
      </table>
      ${ctaButton("Empezar a explorar →", `${APP_URL}/app/dashboard`)}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:20px;">
        <tr>
          <td>
            <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 10px;">💡 Primeros pasos recomendados:</p>
            <p style="color:#166534;font-size:13px;margin:0 0 6px;">1. Completa tu perfil nutricional para recibir recomendaciones personalizadas</p>
            <p style="color:#166534;font-size:13px;margin:0 0 6px;">2. Explora el catálogo de recetas y guarda tus favoritas</p>
            <p style="color:#166534;font-size:13px;margin:0;">3. Genera tu primer menú semanal con IA</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return emailWrapper(body);
}

// ─── Day 2 Email: Descubre tus primeras recetas ───────────────────────────────

function day2EmailHtml(name: string): string {
  const firstName = name?.split(" ")[0] || "amigo";

  const body = `
  ${emailHeader("🍳", `${firstName}, ¿ya has explorado las recetas?`, "Tenemos miles de recetas esperándote")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Llevas 2 días con nosotros y queremos asegurarnos de que estás sacando el máximo partido a BuddyOne. 
        El catálogo de recetas es el corazón de la app — ¡y hay mucho que descubrir!
      </p>

      <!-- Recipe highlights -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border-radius:16px;padding:24px;border-left:4px solid #F97316;">
            <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:0 0 16px;">🔥 Lo que puedes hacer hoy:</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #FED7AA;">
                  <span style="color:#F97316;font-weight:700;font-size:18px;margin-right:12px;">🔍</span>
                  <span style="color:#333;font-size:14px;font-weight:600;">Busca recetas por ingredientes que ya tienes en casa</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #FED7AA;">
                  <span style="color:#F97316;font-weight:700;font-size:18px;margin-right:12px;">❤️</span>
                  <span style="color:#333;font-size:14px;font-weight:600;">Guarda tus favoritas para tenerlas siempre a mano</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #FED7AA;">
                  <span style="color:#F97316;font-weight:700;font-size:18px;margin-right:12px;">📊</span>
                  <span style="color:#333;font-size:14px;font-weight:600;">Consulta los valores nutricionales de cada plato</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="color:#F97316;font-weight:700;font-size:18px;margin-right:12px;">📝</span>
                  <span style="color:#333;font-size:14px;font-weight:600;">Registra lo que has comido en tu diario nutricional</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Tip box -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border-radius:12px;padding:20px;margin-bottom:24px;">
        <tr>
          <td>
            <p style="color:#1e40af;font-size:14px;font-weight:700;margin:0 0 8px;">💡 Consejo del día</p>
            <p style="color:#1e40af;font-size:13px;line-height:1.6;margin:0;">
              Añade los ingredientes que tienes en casa a tu <strong>inventario</strong>. 
              BuddyOne te mostrará qué recetas puedes cocinar ahora mismo con lo que tienes, 
              sin necesidad de ir al supermercado.
            </p>
          </td>
        </tr>
      </table>

      ${ctaButton("Explorar recetas ahora 🍽️", `${APP_URL}/app/recipes`)}

      <p style="color:#888;font-size:13px;text-align:center;margin:16px 0 0;line-height:1.6;">
        ¿Tienes dudas o sugerencias? Responde a este email y te ayudamos encantados.
      </p>
    </td>
  </tr>`;

  return emailWrapper(body);
}

// ─── Day 4 Email: Planifica tu menú semanal ───────────────────────────────────

function day4EmailHtml(name: string): string {
  const firstName = name?.split(" ")[0] || "amigo";

  const body = `
  ${emailHeader("📅", "Planifica tu semana con IA", "Ahorra tiempo y come mejor con los menús automáticos", "linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hola ${firstName}, ¿sabías que la planificación semanal es el hábito número 1 de las personas que 
        consiguen sus objetivos nutricionales? Con BuddyOne es más fácil que nunca.
      </p>

      <!-- How it works -->
      <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:0 0 16px;">¿Cómo funciona el planificador de menús?</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:0 0 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5FF;border-radius:12px;padding:16px;">
              <tr>
                <td width="48" style="vertical-align:top;">
                  <div style="background:#7C3AED;color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:800;font-size:14px;">1</div>
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <p style="color:#1a1a1a;font-size:14px;font-weight:600;margin:0 0 4px;">Dile a la IA tus preferencias</p>
                  <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">Número de comidas, calorías objetivo, alergias y tipo de cocina que prefieres</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5FF;border-radius:12px;padding:16px;">
              <tr>
                <td width="48" style="vertical-align:top;">
                  <div style="background:#7C3AED;color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:800;font-size:14px;">2</div>
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <p style="color:#1a1a1a;font-size:14px;font-weight:600;margin:0 0 4px;">Genera el menú en segundos</p>
                  <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">La IA crea un menú equilibrado para los 7 días, con desayuno, comida y cena</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5FF;border-radius:12px;padding:16px;">
              <tr>
                <td width="48" style="vertical-align:top;">
                  <div style="background:#7C3AED;color:#fff;width:32px;height:32px;border-radius:50%;text-align:center;line-height:32px;font-weight:800;font-size:14px;">3</div>
                </td>
                <td style="vertical-align:top;padding-left:12px;">
                  <p style="color:#1a1a1a;font-size:14px;font-weight:600;margin:0 0 4px;">Lista de la compra automática</p>
                  <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">Con un clic, genera la lista de todos los ingredientes que necesitas para la semana</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Stat highlight -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#7C3AED,#5B21B6);border-radius:16px;padding:24px;margin-bottom:24px;">
        <tr>
          <td align="center">
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 4px;">Los usuarios que planifican su semana ahorran de media</p>
            <p style="color:#ffffff;font-size:36px;font-weight:800;margin:0 0 4px;">2h 30min</p>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">de tiempo en cocina y supermercado cada semana</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
        <tr>
          <td align="center">
            <a href="${APP_URL}/app/menus" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;letter-spacing:0.3px;">Crear mi menú semanal 📅</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

  return emailWrapper(body);
}

// ─── Day 7 Email: ¡Una semana con BuddyOne! ───────────────────────────────

function day7EmailHtml(name: string): string {
  const firstName = name?.split(" ")[0] || "amigo";

  const body = `
  ${emailHeader("🏆", `¡Una semana contigo, ${firstName}!`, "Gracias por confiar en BuddyOne para tu nutrición", "linear-gradient(135deg,#059669 0%,#047857 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        ¡Llevas una semana con nosotros! 🎉 Es el momento perfecto para reflexionar sobre tus hábitos 
        y dar el siguiente paso en tu viaje nutricional.
      </p>

      <!-- Weekly challenge -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-radius:16px;padding:24px;margin-bottom:24px;border:2px solid #6EE7B7;">
        <tr>
          <td>
            <p style="color:#065F46;font-size:16px;font-weight:800;margin:0 0 8px;">🎯 Reto de la semana</p>
            <p style="color:#065F46;font-size:14px;line-height:1.6;margin:0 0 16px;">
              Esta semana, intenta registrar <strong>todas tus comidas en el diario nutricional</strong>. 
              Los estudios demuestran que llevar un registro aumenta un 40% las probabilidades de alcanzar tus objetivos.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#059669;border-radius:8px;padding:10px 20px;">
                  <a href="${APP_URL}/app/diary" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Ir al diario nutricional →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Features reminder -->
      <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:0 0 16px;">¿Ya has probado estas funciones?</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:16px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">☕</div>
            <div style="color:#1a1a1a;font-size:13px;font-weight:700;margin-bottom:4px;">Complementos</div>
            <div style="color:#777;font-size:12px;line-height:1.5;">Registra café, batidos, snacks y más sin necesidad de receta</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:16px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">🤖</div>
            <div style="color:#1a1a1a;font-size:13px;font-weight:700;margin-bottom:4px;">BuddyCoach IA</div>
            <div style="color:#777;font-size:12px;line-height:1.5;">Tu asistente nutricional personal disponible 24/7</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:16px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">🛒</div>
            <div style="color:#1a1a1a;font-size:13px;font-weight:700;margin-bottom:4px;">Inventario</div>
            <div style="color:#777;font-size:12px;line-height:1.5;">Controla lo que tienes en casa y evita el desperdicio</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:16px;vertical-align:top;">
            <div style="font-size:24px;margin-bottom:8px;">❤️</div>
            <div style="color:#1a1a1a;font-size:13px;font-weight:700;margin-bottom:4px;">Favoritos</div>
            <div style="color:#777;font-size:12px;line-height:1.5;">Guarda las recetas que más te gustan para acceder rápido</div>
          </td>
        </tr>
      </table>

      <!-- Social proof -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #F97316;">
        <tr>
          <td>
            <p style="color:#F97316;font-size:20px;margin:0 0 8px;">⭐⭐⭐⭐⭐</p>
            <p style="color:#333;font-size:14px;font-style:italic;line-height:1.6;margin:0 0 8px;">
              "BuddyOne ha cambiado completamente mi relación con la comida. En solo 3 semanas perdí 2kg 
              sin pasar hambre, simplemente siguiendo los menús que me genera la IA."
            </p>
            <p style="color:#888;font-size:13px;margin:0;font-weight:600;">— María G., usuaria de BuddyOne</p>
          </td>
        </tr>
      </table>

      ${ctaButton("Continuar mi viaje nutricional 🚀", `${APP_URL}/app/dashboard`)}

      <p style="color:#888;font-size:13px;text-align:center;margin:16px 0 0;line-height:1.6;">
        ¿Tienes feedback sobre tu primera semana? Nos encantaría escucharte. 
        <a href="mailto:info@buddyone.io" style="color:#F97316;text-decoration:none;">Escríbenos aquí</a>
      </p>
    </td>
  </tr>`;

  return emailWrapper(body);
}

// ─── Send Welcome Email ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  accountType: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping welcome email");
    return false;
  }

  try {
    const firstName = params.name?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `¡Bienvenido a BuddyOne, ${firstName}! 🥗`,
      html: welcomeEmailHtml(params.name, params.accountType),
    });

    if (error) {
      console.error("[Email] Failed to send welcome email:", error);
      return false;
    }

    console.log("[Email] Welcome email sent:", data?.id, "→", params.to);
    return true;
  } catch (err) {
    console.error("[Email] Error sending welcome email:", err);
    return false;
  }
}

// ─── Send Sequence Email ──────────────────────────────────────────────────────

export async function sendSequenceEmail(params: {
  to: string;
  name: string;
  step: 1 | 2 | 3;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping sequence email");
    return false;
  }

  const firstName = params.name?.split(" ")[0] || "amigo";

  const configs: Record<number, { subject: string; html: string }> = {
    1: {
      subject: `${firstName}, ¿ya has explorado las recetas? 🍳`,
      html: day2EmailHtml(params.name),
    },
    2: {
      subject: `Planifica tu semana con IA y ahorra tiempo 📅`,
      html: day4EmailHtml(params.name),
    },
    3: {
      subject: `¡Una semana con BuddyOne! Tu resumen 🏆`,
      html: day7EmailHtml(params.name),
    },
  };

  const config = configs[params.step];
  if (!config) return false;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: config.subject,
      html: config.html,
    });

    if (error) {
      console.error(`[Email] Failed to send sequence step ${params.step}:`, error);
      return false;
    }

    console.log(`[Email] Sequence step ${params.step} sent:`, data?.id, "→", params.to);
    return true;
  } catch (err) {
    console.error(`[Email] Error sending sequence step ${params.step}:`, err);
    return false;
  }
}

// ─── Schedule onboarding sequence for a new user ─────────────────────────────

export async function scheduleOnboardingSequence(params: {
  userId: number;
  email: string;
  name: string;
}): Promise<void> {
  try {
    const { emailSequenceQueue } = await import("../drizzle/schema");
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return;

    const now = new Date();
    const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const day4 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await drizzleDb.insert(emailSequenceQueue).values([
      { userId: params.userId, email: params.email, name: params.name, sequenceStep: 1, scheduledAt: day2, status: "pending" },
      { userId: params.userId, email: params.email, name: params.name, sequenceStep: 2, scheduledAt: day4, status: "pending" },
      { userId: params.userId, email: params.email, name: params.name, sequenceStep: 3, scheduledAt: day7, status: "pending" },
    ]);

    console.log(`[Email] Onboarding sequence scheduled for user ${params.userId} (${params.email})`);
  } catch (err) {
    console.error("[Email] Error scheduling onboarding sequence:", err);
  }
}

// ─── Process pending emails (called by the scheduler) ────────────────────────

export async function processPendingEmails(): Promise<void> {
  try {
    const { emailSequenceQueue } = await import("../drizzle/schema");
    const { lte, eq, and } = await import("drizzle-orm");
    const { getDb } = await import("./db");
    const drizzleDb = await getDb();
    if (!drizzleDb) return;

    const now = new Date();
    const pending = await drizzleDb
      .select()
      .from(emailSequenceQueue)
      .where(and(eq(emailSequenceQueue.status, "pending"), lte(emailSequenceQueue.scheduledAt, now)))
      .limit(20);

    if (pending.length === 0) return;
    console.log(`[Email] Processing ${pending.length} pending sequence emails`);

    for (const item of pending) {
      const success = await sendSequenceEmail({
        to: item.email,
        name: item.name ?? item.email,
        step: item.sequenceStep as 1 | 2 | 3,
      });

      await drizzleDb
        .update(emailSequenceQueue)
        .set({
          status: success ? "active" : "failed",
          sentAt: success ? now : undefined,
          errorMessage: success ? null : "Send failed",
        })
        .where(eq(emailSequenceQueue.id, item.id));
    }
  } catch (err) {
    console.error("[Email] Error processing pending emails:", err);
  }
}

// ─── OTP Login Email ──────────────────────────────────────────────────────────

function otpEmailHtml(otpCode: string): string {
  const body = `
  ${emailHeader("🔐", "Tu código de acceso", "Usa este código para iniciar sesión en BuddyOne")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Hemos recibido una solicitud para iniciar sesión en tu cuenta de BuddyOne. 
        Introduce el siguiente código en la app para acceder:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border:2px solid #F97316;border-radius:16px;padding:28px 40px;">
              <tr>
                <td align="center">
                  <p style="color:#9A3412;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Código de verificación</p>
                  <p style="color:#F97316;font-size:48px;font-weight:900;letter-spacing:12px;margin:0;font-family:'Courier New',Courier,monospace;">${otpCode}</p>
                  <p style="color:#9A3412;font-size:12px;margin:12px 0 0;">Válido durante <strong>10 minutos</strong></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-radius:12px;padding:20px;margin-bottom:24px;">
        <tr>
          <td>
            <p style="color:#991B1B;font-size:14px;font-weight:700;margin:0 0 8px;">⚠️ Aviso de seguridad</p>
            <p style="color:#7F1D1D;font-size:13px;margin:0 0 6px;">• Este código expira en 10 minutos.</p>
            <p style="color:#7F1D1D;font-size:13px;margin:0 0 6px;">• Si no has solicitado este código, ignora este email.</p>
            <p style="color:#7F1D1D;font-size:13px;margin:0;">• Nunca compartas este código con nadie.</p>
          </td>
        </tr>
      </table>
      <p style="color:#999;font-size:13px;line-height:1.6;margin:0;text-align:center;">
        Si no reconoces esta solicitud, tu cuenta está segura. No es necesario tomar ninguna acción.
      </p>
    </td>
  </tr>`;

  return emailWrapper(body);
}

export async function sendOTPEmail(email: string, otpCode: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `${otpCode} es tu código de acceso a BuddyOne`,
    html: otpEmailHtml(otpCode),
  });
  if (error) {
    console.error("[Email] Error sending OTP email:", error);
    throw new Error(`Failed to send OTP email: ${(error as any).message ?? String(error)}`);
  }
}

// ─── Plan PDF Assigned Email ──────────────────────────────────────────────────
function planAssignedEmailHtml(params: {
  clientName: string;
  expertName: string;
  expertSpecialty: string | null;
  planTitle: string;
  planDescription: string | null;
  planWeekNumber: number | null;
  planYear: number | null;
  planNotes: string | null;
  pdfUrl: string | null;
  appUrl: string;
}): string {
  const firstName = params.clientName?.split(" ")[0] || "amigo";

  const weekBadge = params.planWeekNumber
    ? `<span style="background:#FFF7ED;border:1px solid #FED7AA;color:#C2410C;font-size:12px;font-weight:700;padding:4px 12px;border-radius:50px;">Semana ${params.planWeekNumber}${params.planYear ? ` · ${params.planYear}` : ""}</span>`
    : "";

  const pdfButton = params.pdfUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0;">
        <tr><td align="center">
          <a href="${params.pdfUrl}" style="display:inline-block;background:#ffffff;color:#F97316;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:50px;border:2px solid #F97316;">📄 Descargar PDF del plan</a>
        </td></tr>
      </table>`
    : "";

  const notesBlock = params.planNotes
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 12px 12px 0;padding:16px 20px;margin:20px 0;">
        <tr><td>
          <p style="color:#92400E;font-size:13px;font-weight:700;margin:0 0 6px;">📝 Notas de tu experto</p>
          <p style="color:#78350F;font-size:14px;line-height:1.6;margin:0;">${params.planNotes}</p>
        </td></tr>
      </table>`
    : "";

  const body = `
  ${emailHeader("📄", "¡Tienes un nuevo plan nutricional!", "Tu BuddyExpert te ha asignado un plan personalizado")}
  <tr>
    <td style="padding:40px 40px 0;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Tu BuddyExpert <strong style="color:#F97316;">${params.expertName}</strong>${params.expertSpecialty ? ` (${params.expertSpecialty})` : ""} te ha asignado un nuevo plan nutricional personalizado. Ya puedes acceder a él desde tu panel de BuddyOne.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border:1px solid #FED7AA;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          ${weekBadge ? `<p style="margin:0 0 10px;">${weekBadge}</p>` : ""}
          <h2 style="color:#C2410C;font-size:20px;font-weight:800;margin:0 0 8px;line-height:1.3;">${params.planTitle}</h2>
          ${params.planDescription ? `<p style="color:#92400E;font-size:14px;line-height:1.6;margin:0 0 12px;">${params.planDescription}</p>` : ""}
          ${pdfButton}
        </td></tr>
      </table>
      ${notesBlock}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;padding:20px 24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 12px;">✨ ¿Qué puedes hacer con tu plan?</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 8px;">🤖 <strong>Generar tu menú semanal con IA</strong> — La IA leerá el PDF y creará un menú personalizado según tus preferencias.</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 8px;">🛒 <strong>Obtener tu lista de la compra</strong> — Organizada por categorías y lista para llevar al supermercado.</p>
          <p style="color:#15803D;font-size:13px;margin:0;">📄 <strong>Descargar el PDF</strong> — Accede al plan completo elaborado por tu experto.</p>
        </td></tr>
      </table>
      ${ctaButton("Ver mi plan en BuddyOne →", `${params.appUrl}/app/my-plans`)}
      <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center;">
        Si tienes dudas sobre tu plan, contacta directamente con tu BuddyExpert a través de la app.
      </p>
    </td>
  </tr>
  <tr><td style="padding:0 40px 40px;"></td></tr>`;

  return emailWrapper(body);
}

export async function sendPlanAssignedEmail(params: {
  clientEmail: string;
  clientName: string;
  expertName: string;
  expertSpecialty?: string | null;
  planTitle: string;
  planDescription?: string | null;
  planWeekNumber?: number | null;
  planYear?: number | null;
  planNotes?: string | null;
  pdfUrl?: string | null;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping plan assigned email");
    return false;
  }
  try {
    const firstName = params.clientName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.clientEmail,
      subject: `📄 ${params.expertName} te ha asignado un nuevo plan nutricional, ${firstName}`,
      html: planAssignedEmailHtml({
        clientName: params.clientName,
        expertName: params.expertName,
        expertSpecialty: params.expertSpecialty ?? null,
        planTitle: params.planTitle,
        planDescription: params.planDescription ?? null,
        planWeekNumber: params.planWeekNumber ?? null,
        planYear: params.planYear ?? null,
        planNotes: params.planNotes ?? null,
        pdfUrl: params.pdfUrl ?? null,
        appUrl: APP_URL,
      }),
    });
    if (error) {
      console.error("[Email] Failed to send plan assigned email:", error);
      return false;
    }
    console.log("[Email] Plan assigned email sent:", data?.id, "→", params.clientEmail);
    return true;
  } catch (err) {
    console.error("[Email] Error sending plan assigned email:", err);
    return false;
  }
}

// ─── Payment Confirmation Emails ──────────────────────────────────────────────

const PLAN_LABELS: Record<string, { name: string; emoji: string; color: string }> = {
  basic:   { name: "BuddyOne Basic",   emoji: "🌱", color: "#22C55E" },
  premium: { name: "BuddyOne Premium", emoji: "⭐", color: "#F97316" },
  pro_max: { name: "BuddyOne Pro Max", emoji: "🚀", color: "#8B5CF6" },
};

function paymentConfirmationHtml(params: {
  userName: string; userEmail: string; plan: string;
  amount: number; currency: string; invoiceId: string; periodEnd: Date;
}): string {
  const planInfo = PLAN_LABELS[params.plan] ?? { name: params.plan, emoji: "💳", color: "#F97316" };
  const formattedAmount = new Intl.NumberFormat("es-ES", { style: "currency", currency: params.currency.toUpperCase() }).format(params.amount / 100);
  const formattedDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(params.periodEnd);
  const firstName = params.userName?.split(" ")[0] || "amigo";
  return emailWrapper(`
    ${emailHeader(planInfo.emoji, "¡Pago confirmado!", "Tu suscripción " + planInfo.name + " está activa")}
    <tr><td style="padding:40px 40px 0;">
      <p style="color:#1a1a1a;font-size:16px;margin:0 0 8px;font-weight:700;">Hola, ${firstName} 👋</p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px;">Hemos recibido tu pago correctamente. Tu suscripción <strong>${planInfo.name}</strong> ya está activa.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:16px;border:1px solid #FFE4CC;margin-bottom:32px;">
        <tr><td style="padding:24px 28px;">
          <p style="color:#F97316;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin:0 0 16px;">Resumen del pago</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#888;font-size:14px;padding:6px 0;">Plan</td><td style="text-align:right;padding:6px 0;"><span style="background:${planInfo.color};color:#fff;padding:2px 10px;border-radius:20px;font-size:12px;">${planInfo.emoji} ${planInfo.name}</span></td></tr>
            <tr><td style="color:#888;font-size:14px;padding:6px 0;">Importe</td><td style="color:#1a1a1a;font-size:16px;font-weight:800;text-align:right;padding:6px 0;">${formattedAmount}</td></tr>
            <tr><td style="color:#888;font-size:14px;padding:6px 0;">Próxima renovación</td><td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;padding:6px 0;">${formattedDate}</td></tr>
            <tr><td style="color:#888;font-size:14px;padding:6px 0;">Referencia</td><td style="color:#aaa;font-size:12px;font-family:monospace;text-align:right;padding:6px 0;">${params.invoiceId}</td></tr>
          </table>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;"><tr><td style="background:linear-gradient(135deg,#F97316,#EA580C);border-radius:14px;padding:14px 32px;text-align:center;"><a href="${APP_URL}/app/dashboard" style="color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;">Ir a mi panel →</a></td></tr></table>
      <p style="color:#888;font-size:13px;line-height:1.7;margin:0 0 40px;">Si tienes alguna pregunta sobre tu suscripción, responde a este email.</p>
    </td></tr>
  `);
}

function paymentAdminNotificationHtml(params: {
  userName: string; userEmail: string; plan: string;
  amount: number; currency: string; invoiceId: string;
  userId: number; stripeCustomerId: string;
}): string {
  const planInfo = PLAN_LABELS[params.plan] ?? { name: params.plan, emoji: "💳", color: "#F97316" };
  const formattedAmount = new Intl.NumberFormat("es-ES", { style: "currency", currency: params.currency.toUpperCase() }).format(params.amount / 100);
  const now = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
  return emailWrapper(`
    ${emailHeader("💰", "Nuevo pago recibido", formattedAmount + " · " + planInfo.name, "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)")}
    <tr><td style="padding:40px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:12px;border:1px solid #e9ecef;margin-bottom:24px;">
        <tr><td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#666;font-size:13px;padding:5px 0;width:140px;">Usuario</td><td style="color:#1a1a1a;font-size:13px;font-weight:700;padding:5px 0;">${params.userName} (ID: ${params.userId})</td></tr>
            <tr><td style="color:#666;font-size:13px;padding:5px 0;">Email</td><td style="color:#1a1a1a;font-size:13px;padding:5px 0;">${params.userEmail}</td></tr>
            <tr><td style="color:#666;font-size:13px;padding:5px 0;">Plan</td><td style="padding:5px 0;"><span style="background:${planInfo.color};color:#fff;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;">${planInfo.emoji} ${planInfo.name}</span></td></tr>
            <tr><td style="color:#666;font-size:13px;padding:5px 0;">Importe</td><td style="color:#22C55E;font-size:16px;font-weight:800;padding:5px 0;">${formattedAmount}</td></tr>
            <tr><td style="color:#666;font-size:13px;padding:5px 0;">Fecha</td><td style="color:#1a1a1a;font-size:13px;padding:5px 0;">${now}</td></tr>
            <tr><td style="color:#666;font-size:13px;padding:5px 0;">Stripe Customer</td><td style="color:#888;font-size:12px;font-family:monospace;padding:5px 0;">${params.stripeCustomerId}</td></tr>
            <tr><td style="color:#666;font-size:13px;padding:5px 0;">Invoice ID</td><td style="color:#888;font-size:12px;font-family:monospace;padding:5px 0;">${params.invoiceId}</td></tr>
          </table>
        </td></tr>
      </table>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;"><tr><td style="background:#1a1a2e;border-radius:12px;padding:12px 24px;text-align:center;"><a href="https://dashboard.stripe.com/payments" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Ver en Stripe Dashboard →</a></td></tr></table>
    </td></tr>
  `);
}

export async function sendPaymentConfirmationEmail(params: {
  userName: string; userEmail: string; plan: string;
  amount: number; currency: string; invoiceId: string; periodEnd: Date;
}): Promise<boolean> {
  try {
    const planInfo = PLAN_LABELS[params.plan] ?? { name: params.plan, emoji: "💳", color: "#F97316" };
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `${planInfo.emoji} Pago confirmado — ${planInfo.name} activado`,
      html: paymentConfirmationHtml(params),
    });
    if (error) { console.error("[Email] Failed to send payment confirmation:", error); return false; }
    console.log("[Email] Payment confirmation sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending payment confirmation:", err); return false; }
}

export async function sendPaymentAdminNotification(params: {
  userName: string; userEmail: string; plan: string;
  amount: number; currency: string; invoiceId: string;
  userId: number; stripeCustomerId: string; adminEmail: string;
}): Promise<boolean> {
  try {
    const planInfo = PLAN_LABELS[params.plan] ?? { name: params.plan, emoji: "💳", color: "#F97316" };
    const formattedAmount = new Intl.NumberFormat("es-ES", { style: "currency", currency: params.currency.toUpperCase() }).format(params.amount / 100);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.adminEmail,
      subject: `💰 Nuevo pago: ${formattedAmount} · ${planInfo.name} · ${params.userName}`,
      html: paymentAdminNotificationHtml(params),
    });
    if (error) { console.error("[Email] Failed to send admin payment notification:", error); return false; }
    console.log("[Email] Admin payment notification sent:", data?.id, "→", params.adminEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending admin payment notification:", err); return false; }
}

// =============================================================================
// FOUNDER WELCOME EMAIL — Bienvenida especial para usuarios fundadores
// =============================================================================
function founderWelcomeHtml(params: { userName: string; userEmail: string }): string {
  const name = params.userName || "amigo/a";
  const proUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric",
  });
  const features: [string, string, string][] = [
    ["🤖", "IA Nutricional", "Menús semanales personalizados en segundos"],
    ["📸", "Diario con fotos", "La IA detecta calorías y macros de tus platos"],
    ["📖", "500+ recetas", "Filtradas por tus objetivos y alergias"],
    ["🛒", "Lista de la compra inteligente", "Generada automáticamente desde tu menú"],
    ["🧑‍⚕️", "BuddyExperts", "Acceso a nutricionistas y expertos reales"],
  ];
  const featureRows = features.map(([emoji, title, desc]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;width:36px;">
        <span style="font-size:20px;">${emoji}</span>
      </td>
      <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f3f4f6;">
        <strong style="display:block;font-size:14px;color:#1a1a1a;">${title}</strong>
        <span style="font-size:13px;color:#6b7280;">${desc}</span>
      </td>
    </tr>
  `).join("");
  return emailWrapper(`
    ${emailHeader("🎁", "¡Tu año PRO está activado!", "Bienvenido/a de vuelta a BuddyOne", "linear-gradient(135deg, #F97316, #FB923C)")}
    <tr><td style="padding:40px 40px 0;">
      <p style="font-size:17px;color:#374151;line-height:1.7;margin:0 0 20px;">
        Hola <strong style="color:#1a1a1a;">${name}</strong>,
      </p>
      <p style="font-size:17px;color:#374151;line-height:1.7;margin:0 0 20px;">
        Eres uno de los usuarios originales de BuddyOne y eso tiene un valor enorme para nosotros.
        <strong style="color:#1a1a1a;">Confiaste en nosotros desde el principio, y hoy te devolvemos ese favor.</strong>
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8f0,#fef3e8);border-radius:16px;border:2px solid #fde8d0;margin:24px 0;">
        <tr><td style="padding:24px;text-align:center;">
          <p style="font-size:40px;margin:0 0 8px;">🎁</p>
          <p style="font-size:20px;font-weight:900;color:#1a1a1a;margin:0 0 6px;letter-spacing:-0.02em;">1 año de BuddyOne PRO activado</p>
          <p style="font-size:14px;color:#6b7280;margin:0;">Tu cuenta PRO está activa hasta el ${proUntil}</p>
        </td></tr>
      </table>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">Con tu plan PRO tienes acceso completo a:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        ${featureRows}
      </table>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
        <tr><td style="background:linear-gradient(135deg,#F97316,#FB923C);border-radius:14px;padding:16px 40px;text-align:center;box-shadow:0 8px 24px rgba(249,115,22,0.35);">
          <a href="${APP_URL}/app/dashboard" style="color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;letter-spacing:-0.01em;">→ Ir a mi dashboard PRO</a>
        </td></tr>
      </table>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 8px;">
        Gracias por haber esperado. Gracias por haber confiado.
      </p>
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0;">
        <strong style="color:#1a1a1a;">El equipo de BuddyOne</strong>
      </p>
    </td></tr>
  `);
}

export async function sendFounderWelcomeEmail(params: { userName: string; userEmail: string }): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: "🎁 ¡Tu año PRO está activado! Bienvenido/a de vuelta a BuddyOne",
      html: founderWelcomeHtml(params),
    });
    if (error) { console.error("[Email] Failed to send founder welcome:", error); return false; }
    console.log("[Email] Founder welcome sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending founder welcome:", err); return false; }
}


// ─── B2B Reminder Emails ──────────────────────────────────────────────────────

function reminderActivationHtml(params: {
  recipientName: string; companyName: string; activationCode: string;
  customMessage?: string; expiresAt?: string;
}): string {
  const { recipientName, companyName, activationCode, customMessage, expiresAt } = params;
  return emailWrapper(`
    <tr><td style="padding:40px 40px 0;text-align:center;">
      <div style="width:72px;height:72px;background:linear-gradient(135deg,#F97316,#FB923C);border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:36px;">🎁</div>
      <h1 style="font-size:26px;font-weight:900;color:#1a1a1a;margin:0 0 12px;">Tu empresa te regala BuddyOne Pro</h1>
      <p style="font-size:16px;color:#6b7280;margin:0 0 32px;line-height:1.6;">Hola <strong style="color:#1a1a1a;">${recipientName}</strong>, <strong style="color:#F97316;">${companyName}</strong> ha activado BuddyOne para sus empleados.</p>
    </td></tr>
    <tr><td style="padding:0 40px 40px;">
      ${customMessage ? `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;padding:20px;background:#FFF8F0;border-radius:12px;border-left:4px solid #F97316;">${customMessage}</p>` : ""}
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">Para activar tu cuenta Pro Max, introduce el siguiente código en la aplicación:</p>
      <div style="background:#f9fafb;border:2px dashed #F97316;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
        <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Tu código de activación</p>
        <p style="font-size:32px;font-weight:900;color:#F97316;letter-spacing:0.15em;margin:0;font-family:monospace;">${activationCode}</p>
        ${expiresAt ? `<p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">Válido hasta el ${expiresAt}</p>` : ""}
      </div>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr><td style="background:linear-gradient(135deg,#F97316,#ea580c);border-radius:14px;padding:16px 40px;text-align:center;">
          <a href="${APP_URL}/app/subscription?code=${activationCode}" style="color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;">Activar mi cuenta Pro Max</a>
        </td></tr>
      </table>
    </td></tr>
  `);
}

function reminderEngagementHtml(params: {
  recipientName: string; companyName: string; customMessage?: string;
}): string {
  const { recipientName, companyName, customMessage } = params;
  return emailWrapper(`
    <tr><td style="padding:40px 40px 0;text-align:center;">
      <div style="width:72px;height:72px;background:linear-gradient(135deg,#10b981,#059669);border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:36px;">🥗</div>
      <h1 style="font-size:26px;font-weight:900;color:#1a1a1a;margin:0 0 12px;">Como va tu nutricion esta semana?</h1>
      <p style="font-size:16px;color:#6b7280;margin:0 0 32px;line-height:1.6;">Hola <strong style="color:#1a1a1a;">${recipientName}</strong>, desde <strong style="color:#F97316;">${companyName}</strong> queremos recordarte que tienes BuddyOne disponible.</p>
    </td></tr>
    <tr><td style="padding:0 40px 40px;">
      ${customMessage ? `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;padding:20px;background:#f0fdf4;border-radius:12px;border-left:4px solid #10b981;">${customMessage}</p>` : ""}
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 32px;">Genera tu menu semanal en segundos y lleva un seguimiento de tu nutricion. Todo desde el movil, en menos de 2 minutos al dia.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr><td style="background:linear-gradient(135deg,#F97316,#ea580c);border-radius:14px;padding:16px 40px;text-align:center;">
          <a href="${APP_URL}/app/dashboard" style="color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;">Abrir BuddyOne</a>
        </td></tr>
      </table>
    </td></tr>
  `);
}

function reminderExpiryHtml(params: {
  recipientName: string; companyName: string; activationCode: string;
  expiresAt: string; customMessage?: string;
}): string {
  const { recipientName, companyName, activationCode, expiresAt, customMessage } = params;
  return emailWrapper(`
    <tr><td style="padding:40px 40px 0;text-align:center;">
      <div style="width:72px;height:72px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:20px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:36px;">⏰</div>
      <h1 style="font-size:26px;font-weight:900;color:#1a1a1a;margin:0 0 12px;">Tu codigo expira pronto</h1>
      <p style="font-size:16px;color:#6b7280;margin:0 0 32px;line-height:1.6;">Hola <strong style="color:#1a1a1a;">${recipientName}</strong>, tu codigo de <strong style="color:#F97316;">${companyName}</strong> expira el <strong style="color:#f59e0b;">${expiresAt}</strong>.</p>
    </td></tr>
    <tr><td style="padding:0 40px 40px;">
      ${customMessage ? `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;padding:20px;background:#fffbeb;border-radius:12px;border-left:4px solid #f59e0b;">${customMessage}</p>` : ""}
      <div style="background:#f9fafb;border:2px dashed #f59e0b;border-radius:16px;padding:28px;text-align:center;margin:0 0 24px;">
        <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Tu codigo de activacion</p>
        <p style="font-size:32px;font-weight:900;color:#f59e0b;letter-spacing:0.15em;margin:0;font-family:monospace;">${activationCode}</p>
        <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">Valido hasta el ${expiresAt}</p>
      </div>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:14px;padding:16px 40px;text-align:center;">
          <a href="${APP_URL}/app/subscription?code=${activationCode}" style="color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;">Activar antes de que expire</a>
        </td></tr>
      </table>
    </td></tr>
  `);
}

export async function sendCompanyReminderEmail(params: {
  recipientEmail: string; recipientName: string; companyName: string;
  type: "activation" | "engagement" | "expiry_warning" | "custom";
  subject: string; activationCode?: string; expiresAt?: string;
  customMessage?: string; customBodyHtml?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let html: string;
    if (params.type === "custom" && params.customBodyHtml) {
      html = params.customBodyHtml;
    } else if (params.type === "activation" && params.activationCode) {
      html = reminderActivationHtml({ recipientName: params.recipientName, companyName: params.companyName, activationCode: params.activationCode, customMessage: params.customMessage, expiresAt: params.expiresAt });
    } else if (params.type === "expiry_warning" && params.activationCode && params.expiresAt) {
      html = reminderExpiryHtml({ recipientName: params.recipientName, companyName: params.companyName, activationCode: params.activationCode, expiresAt: params.expiresAt, customMessage: params.customMessage });
    } else {
      html = reminderEngagementHtml({ recipientName: params.recipientName, companyName: params.companyName, customMessage: params.customMessage });
    }
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to: params.recipientEmail, subject: params.subject, html });
    if (error) { console.error("[Email] Reminder failed:", error); return { success: false, error: error.message }; }
    console.log("[Email] Reminder sent:", data?.id, "->", params.recipientEmail);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error("[Email] Error sending reminder:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

export async function sendBillingPreviewEmail(params: {
  to: string;
  companyName: string;
  activeLicenses: number;
  pricePerLicense: number;
  totalAmount: number;
  billingDate: Date;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, companyName, activeLicenses, pricePerLicense, totalAmount, billingDate } = params;
  const billingDateStr = billingDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const subject = "Resumen de facturacion BuddyOne - " + billingDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const html = emailWrapper(emailHeader("Resumen de facturacion", companyName + " - " + billingDateStr, "linear-gradient(135deg,#1e40af 0%,#1d4ed8 100%)") + "<tr><td style='padding:40px;'><p style='color:#374151;font-size:15px;'>Hola, equipo de " + companyName + ". El cargo de " + totalAmount.toFixed(2) + " EUR (" + activeLicenses + " licencias x " + pricePerLicense.toFixed(2) + " EUR/mes) se realizara el " + billingDateStr + ".</p>" + ctaButton("Ver panel de empresa", `${APP_URL}/empresa/dashboard`) + "</td></tr>");
  try {
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) { console.error("[Email] Billing preview failed:", error); return { success: false, error: error.message }; }
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown error" };
  }
}

// ─── Generic sendEmail helper ──────────────────────────────────────────────
// Use this for one-off transactional emails that don't need a full template.
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: emailWrapper(params.html),
    });
    if (error) {
      console.error("[Email] sendEmail failed:", error);
      return { success: false, error: error.message };
    }
    console.log("[Email] sendEmail sent:", data?.id, "→", params.to);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error("[Email] sendEmail exception:", err?.message);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

// ─── Password Reset Email ──────────────────────────────────────────────────
function passwordResetHtml(name: string, resetUrl: string): string {
  return emailHeader("🔐", "Restablecer contraseña", "Solicitud de cambio de contraseña") +
    `<tr><td style="padding:40px;">
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hola <strong>${name}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta BuddyOne. Haz clic en el botón de abajo para crear una nueva contraseña.</p>
      ${ctaButton("Restablecer contraseña", resetUrl)}
      <p style="color:#6b7280;font-size:13px;margin:24px 0 0;">Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
    </td></tr>`;
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<void> {
  try {
    const html = passwordResetHtml(name, resetUrl);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Restablecer tu contraseña de BuddyOne",
      html: emailWrapper(html),
    });
    if (error) console.error("[Email] Password reset email failed:", error);
    else console.log("[Email] Password reset email sent →", email);
  } catch (err) {
    console.error("[Email] Password reset exception:", err);
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// NUEVOS FLUJOS DE EMAIL — BuddyOne Lifecycle Emails
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Check-in Semanal Recordatorio ────────────────────────────────────────────

function weeklyCheckinReminderHtml(name: string, expertName: string): string {
  const firstName = name?.split(" ")[0] || "amigo";
  const body = `
  ${emailHeader("📊", "¡Es hora de tu check-in semanal!", "Tu nutricionista espera tus datos de esta semana", "linear-gradient(135deg,#10B981 0%,#059669 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        <strong style="color:#059669;">${expertName}</strong> está esperando tu check-in semanal para hacer un seguimiento de tu progreso. Solo te llevará 2 minutos.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 12px;">📝 ¿Qué registrar esta semana?</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 8px;">⚖️ Tu peso actual</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 8px;">💪 Nivel de energía (1-10)</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 8px;">🍽️ Adherencia al menú (%)</p>
          <p style="color:#15803D;font-size:13px;margin:0;">💬 Notas o dificultades de la semana</p>
        </td></tr>
      </table>
      ${ctaButton("Hacer mi check-in ahora →", `${APP_URL}/app/my-expert`)}
      <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:24px 0 0;text-align:center;">
        Tu nutricionista revisa estos datos para ajustar tu plan. ¡Cada check-in cuenta!
      </p>
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendWeeklyCheckinReminder(params: {
  userEmail: string;
  userName: string;
  expertName: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `📊 ${firstName}, ¡no olvides tu check-in semanal con ${params.expertName}!`,
      html: weeklyCheckinReminderHtml(params.userName, params.expertName),
    });
    if (error) { console.error("[Email] Weekly checkin reminder failed:", error); return false; }
    console.log("[Email] Weekly checkin reminder sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending weekly checkin reminder:", err); return false; }
}

// ─── Resumen Semanal del Paciente ─────────────────────────────────────────────

function weeklyProgressSummaryHtml(params: {
  name: string;
  expertName: string;
  currentWeight?: number | null;
  startWeight?: number | null;
  adherenceAvg?: number | null;
  energyAvg?: number | null;
  weekNumber?: number;
}): string {
  const firstName = params.name?.split(" ")[0] || "amigo";
  const weightDiff = params.currentWeight && params.startWeight
    ? (params.currentWeight - params.startWeight).toFixed(1)
    : null;
  const weightDiffStr = weightDiff
    ? parseFloat(weightDiff) < 0
      ? `<span style="color:#10B981;font-weight:700;">${weightDiff} kg</span> desde el inicio`
      : `<span style="color:#F97316;font-weight:700;">+${weightDiff} kg</span> desde el inicio`
    : null;

  const body = `
  ${emailHeader("📈", `Tu resumen de la semana`, `Semana ${params.weekNumber || ""} con ${params.expertName}`, "linear-gradient(135deg,#6366F1 0%,#4F46E5 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${firstName}</strong>, aquí tienes tu resumen de progreso de esta semana:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          ${params.currentWeight ? `
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">⚖️</div>
            <div style="color:#F97316;font-size:24px;font-weight:800;">${params.currentWeight} kg</div>
            <div style="color:#777;font-size:12px;margin-top:4px;">Peso actual</div>
            ${weightDiffStr ? `<div style="font-size:12px;margin-top:6px;">${weightDiffStr}</div>` : ""}
          </td>
          <td width="4%"></td>` : ""}
          ${params.adherenceAvg !== null && params.adherenceAvg !== undefined ? `
          <td width="48%" style="background:#F0FDF4;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">🍽️</div>
            <div style="color:#10B981;font-size:24px;font-weight:800;">${params.adherenceAvg}%</div>
            <div style="color:#777;font-size:12px;margin-top:4px;">Adherencia al menú</div>
          </td>` : ""}
        </tr>
      </table>
      ${params.energyAvg ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#1D4ED8;font-size:14px;font-weight:700;margin:0 0 4px;">⚡ Nivel de energía medio: ${params.energyAvg}/10</p>
          <p style="color:#3B82F6;font-size:13px;margin:0;">
            ${params.energyAvg >= 7 ? "¡Excelente! Tu energía está en un gran nivel esta semana." : params.energyAvg >= 5 ? "Nivel moderado. Asegúrate de descansar bien y mantener la hidratación." : "Energía baja. Comenta esto con tu nutricionista en el próximo check-in."}
          </p>
        </td></tr>
      </table>` : ""}
      ${ctaButton("Ver mi progreso completo →", `${APP_URL}/app/my-expert`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendWeeklyProgressSummary(params: {
  userEmail: string;
  userName: string;
  expertName: string;
  currentWeight?: number | null;
  startWeight?: number | null;
  adherenceAvg?: number | null;
  energyAvg?: number | null;
  weekNumber?: number;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `📈 Tu resumen semanal de progreso, ${firstName}`,
      html: weeklyProgressSummaryHtml(params),
    });
    if (error) { console.error("[Email] Weekly progress summary failed:", error); return false; }
    console.log("[Email] Weekly progress summary sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending weekly progress summary:", err); return false; }
}

// ─── Reactivación por Inactividad ─────────────────────────────────────────────

function reactivationEmailHtml(name: string, daysInactive: number): string {
  const firstName = name?.split(" ")[0] || "amigo";
  const isLongInactive = daysInactive >= 7;
  const emoji = daysInactive >= 30 ? "🎁" : daysInactive >= 7 ? "💭" : "👋";
  const title = daysInactive >= 30
    ? "¡Te echamos de menos!"
    : daysInactive >= 7
    ? `${firstName}, ¿todo bien?`
    : `${firstName}, tu menú te espera`;
  const subtitle = daysInactive >= 30
    ? "Han pasado 30 días. Vuelve con una sorpresa especial."
    : daysInactive >= 7
    ? "Llevas una semana sin registrar. ¡No pierdas tu racha!"
    : "Llevas 3 días sin abrir la app. ¡Sigue con tu plan!";

  const body = `
  ${emailHeader(emoji, title, subtitle, isLongInactive ? "linear-gradient(135deg,#8B5CF6 0%,#7C3AED 100%)" : "linear-gradient(135deg,#F97316 0%,#EA580C 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        ${daysInactive >= 30
          ? "Han pasado 30 días desde tu última visita a BuddyOne. Sabemos que la vida se complica, pero tu salud siempre merece un momento. Para ayudarte a retomar el camino, hemos preparado algo especial para ti."
          : daysInactive >= 7
          ? "Llevas una semana sin registrar tu progreso. Tu nutricionista sigue ahí, con tu plan actualizado y esperando tus datos. ¿Qué tal ha ido la semana?"
          : "Llevas 3 días sin abrir BuddyOne. Tu menú semanal está listo y tu diario nutricional espera tus registros. ¡Solo 2 minutos al día marcan la diferencia!"}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#C2410C;font-size:14px;font-weight:700;margin:0 0 12px;">🎯 Retoma donde lo dejaste:</p>
          <p style="color:#92400E;font-size:13px;margin:0 0 8px;">📅 Tu menú semanal está esperándote</p>
          <p style="color:#92400E;font-size:13px;margin:0 0 8px;">📊 Registra tu peso y progreso</p>
          <p style="color:#92400E;font-size:13px;margin:0;">💬 Habla con tu nutricionista</p>
        </td></tr>
      </table>
      ${daysInactive >= 30 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border:2px solid #FED7AA;border-radius:16px;padding:24px;margin:0 0 24px;text-align:center;">
        <tr><td>
          <p style="color:#C2410C;font-size:16px;font-weight:800;margin:0 0 8px;">🎁 Oferta especial de reactivación</p>
          <p style="color:#92400E;font-size:14px;margin:0;">Escríbenos a <a href="mailto:hola@buddyone.io" style="color:#F97316;">hola@buddyone.io</a> con el asunto "VUELVO" y te regalamos 1 mes de seguimiento extra con tu nutricionista.</p>
        </td></tr>
      </table>` : ""}
      ${ctaButton("Volver a BuddyOne →", `${APP_URL}/app/dashboard`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendReactivationEmail(params: {
  userEmail: string;
  userName: string;
  daysInactive: number;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const subject = params.daysInactive >= 30
      ? `🎁 ${firstName}, ¡te echamos de menos! Vuelve con una sorpresa`
      : params.daysInactive >= 7
      ? `💭 ${firstName}, ¿todo bien? Tu nutricionista te espera`
      : `👋 ${firstName}, tu menú semanal te espera en BuddyOne`;
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject,
      html: reactivationEmailHtml(params.userName, params.daysInactive),
    });
    if (error) { console.error("[Email] Reactivation email failed:", error); return false; }
    console.log("[Email] Reactivation email sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending reactivation email:", err); return false; }
}

// ─── Menú Asignado por Nutricionista ─────────────────────────────────────────

function menuAssignedEmailHtml(params: {
  patientName: string;
  expertName: string;
  menuTitle: string;
  menuDescription?: string | null;
  menuCalories?: number | null;
  menuNotes?: string | null;
}): string {
  const firstName = params.patientName?.split(" ")[0] || "amigo";
  const body = `
  ${emailHeader("🥗", "¡Tienes un nuevo menú semanal!", `${params.expertName} te ha asignado un menú personalizado`)}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Tu nutricionista <strong style="color:#F97316;">${params.expertName}</strong> te ha preparado un nuevo menú semanal personalizado para ti.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border:1px solid #FED7AA;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          <h2 style="color:#C2410C;font-size:20px;font-weight:800;margin:0 0 8px;">${params.menuTitle}</h2>
          ${params.menuDescription ? `<p style="color:#92400E;font-size:14px;line-height:1.6;margin:0 0 12px;">${params.menuDescription}</p>` : ""}
          ${params.menuCalories ? `<p style="color:#F97316;font-size:14px;font-weight:700;margin:0;">🔥 ~${params.menuCalories} kcal/día</p>` : ""}
        </td></tr>
      </table>
      ${params.menuNotes ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#92400E;font-size:13px;font-weight:700;margin:0 0 6px;">📝 Nota de tu nutricionista</p>
          <p style="color:#78350F;font-size:14px;line-height:1.6;margin:0;">${params.menuNotes}</p>
        </td></tr>
      </table>` : ""}
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 10px;">✨ ¿Qué puedes hacer con tu menú?</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 6px;">🛒 <strong>Generar tu lista de la compra</strong> automáticamente</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 6px;">📊 <strong>Ver si es compatible</strong> con tus restricciones alimentarias</p>
          <p style="color:#15803D;font-size:13px;margin:0;">⭐ <strong>Valorarlo</strong> para que tu nutricionista pueda mejorarlo</p>
        </td></tr>
      </table>
      ${ctaButton("Ver mi menú →", `${APP_URL}/app/my-expert`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendMenuAssignedEmail(params: {
  patientEmail: string;
  patientName: string;
  expertName: string;
  menuTitle: string;
  menuDescription?: string | null;
  menuCalories?: number | null;
  menuNotes?: string | null;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.patientName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.patientEmail,
      subject: `🥗 ${params.expertName} te ha asignado un nuevo menú, ${firstName}`,
      html: menuAssignedEmailHtml(params),
    });
    if (error) { console.error("[Email] Menu assigned email failed:", error); return false; }
    console.log("[Email] Menu assigned email sent:", data?.id, "→", params.patientEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending menu assigned email:", err); return false; }
}

// ─── Cita Confirmada ──────────────────────────────────────────────────────────

function appointmentConfirmedEmailHtml(params: {
  patientName: string;
  expertName: string;
  appointmentDate: string;
  appointmentTime: string;
  modality: string;
  notes?: string | null;
}): string {
  const firstName = params.patientName?.split(" ")[0] || "amigo";
  const modalityLabel = params.modality === "online" ? "🖥️ Videollamada online" : params.modality === "presencial" ? "🏥 Consulta presencial" : params.modality;
  const body = `
  ${emailHeader("📅", "¡Cita confirmada!", `Tu cita con ${params.expertName} está programada`, "linear-gradient(135deg,#0EA5E9 0%,#0284C7 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Tu cita con <strong style="color:#0284C7;">${params.expertName}</strong> ha sido confirmada. Aquí tienes los detalles:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #E0F2FE;">
                <span style="color:#0369A1;font-size:13px;font-weight:700;">📅 Fecha</span>
                <span style="color:#0C4A6E;font-size:15px;font-weight:600;float:right;">${params.appointmentDate}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #E0F2FE;">
                <span style="color:#0369A1;font-size:13px;font-weight:700;">🕐 Hora</span>
                <span style="color:#0C4A6E;font-size:15px;font-weight:600;float:right;">${params.appointmentTime}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;">
                <span style="color:#0369A1;font-size:13px;font-weight:700;">📍 Modalidad</span>
                <span style="color:#0C4A6E;font-size:14px;font-weight:600;float:right;">${modalityLabel}</span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
      ${params.notes ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#92400E;font-size:13px;font-weight:700;margin:0 0 6px;">📝 Notas</p>
          <p style="color:#78350F;font-size:14px;line-height:1.6;margin:0;">${params.notes}</p>
        </td></tr>
      </table>` : ""}
      ${ctaButton("Ver mis citas →", `${APP_URL}/app/my-expert`)}
      <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:16px 0 0;text-align:center;">
        Recibirás un recordatorio 24 horas antes de tu cita.
      </p>
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendAppointmentConfirmedEmail(params: {
  patientEmail: string;
  patientName: string;
  expertName: string;
  appointmentDate: string;
  appointmentTime: string;
  modality: string;
  notes?: string | null;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.patientEmail,
      subject: `📅 Cita confirmada con ${params.expertName} — ${params.appointmentDate} a las ${params.appointmentTime}`,
      html: appointmentConfirmedEmailHtml(params),
    });
    if (error) { console.error("[Email] Appointment confirmed email failed:", error); return false; }
    console.log("[Email] Appointment confirmed email sent:", data?.id, "→", params.patientEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending appointment confirmed email:", err); return false; }
}

// ─── Recordatorio de Cita (24h antes) ────────────────────────────────────────

function appointmentReminderEmailHtml(params: {
  patientName: string;
  expertName: string;
  appointmentDate: string;
  appointmentTime: string;
  modality: string;
}): string {
  const firstName = params.patientName?.split(" ")[0] || "amigo";
  const modalityLabel = params.modality === "online" ? "🖥️ Videollamada online" : "🏥 Consulta presencial";
  const body = `
  ${emailHeader("⏰", "Recordatorio de cita", `Mañana tienes cita con ${params.expertName}`, "linear-gradient(135deg,#F59E0B 0%,#D97706 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Te recordamos que mañana tienes una cita con <strong style="color:#D97706;">${params.expertName}</strong>:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:16px;padding:24px;margin:0 0 24px;text-align:center;">
        <tr><td>
          <p style="color:#92400E;font-size:28px;font-weight:900;margin:0 0 4px;">${params.appointmentTime}</p>
          <p style="color:#78350F;font-size:16px;margin:0 0 8px;">${params.appointmentDate}</p>
          <p style="color:#92400E;font-size:14px;margin:0;">${modalityLabel}</p>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 10px;">✅ Prepárate para tu cita:</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 6px;">📊 Revisa tu progreso de la semana</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 6px;">📝 Anota las dudas que quieras comentar</p>
          <p style="color:#15803D;font-size:13px;margin:0;">⚖️ Pésate esta mañana para tener el dato actualizado</p>
        </td></tr>
      </table>
      ${ctaButton("Ver mis citas →", `${APP_URL}/app/my-expert`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendAppointmentReminderEmail(params: {
  patientEmail: string;
  patientName: string;
  expertName: string;
  appointmentDate: string;
  appointmentTime: string;
  modality: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.patientEmail,
      subject: `⏰ Recordatorio: Mañana tienes cita con ${params.expertName} a las ${params.appointmentTime}`,
      html: appointmentReminderEmailHtml(params),
    });
    if (error) { console.error("[Email] Appointment reminder email failed:", error); return false; }
    console.log("[Email] Appointment reminder email sent:", data?.id, "→", params.patientEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending appointment reminder email:", err); return false; }
}

// ─── Solicitud de Contratación (al Nutricionista) ─────────────────────────────

function newHireRequestEmailHtml(params: {
  expertName: string;
  patientName: string;
  patientEmail: string;
  planName: string;
  planPrice: string;
  message?: string | null;
}): string {
  const firstName = params.expertName?.split(" ")[0] || "experto";
  const body = `
  ${emailHeader("🤝", "¡Nueva solicitud de paciente!", `${params.patientName} quiere contratarte`, "linear-gradient(135deg,#8B5CF6 0%,#7C3AED 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        <strong style="color:#7C3AED;">${params.patientName}</strong> ha enviado una solicitud para contratar tus servicios en BuddyOne.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #EDE9FE;">
                <span style="color:#6D28D9;font-size:13px;font-weight:700;">👤 Paciente</span>
                <span style="color:#4C1D95;font-size:14px;font-weight:600;float:right;">${params.patientName}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #EDE9FE;">
                <span style="color:#6D28D9;font-size:13px;font-weight:700;">📧 Email</span>
                <span style="color:#4C1D95;font-size:14px;float:right;">${params.patientEmail}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;">
                <span style="color:#6D28D9;font-size:13px;font-weight:700;">💼 Plan solicitado</span>
                <span style="color:#4C1D95;font-size:14px;font-weight:600;float:right;">${params.planName} — ${params.planPrice}</span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
      ${params.message ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#92400E;font-size:13px;font-weight:700;margin:0 0 6px;">💬 Mensaje del paciente</p>
          <p style="color:#78350F;font-size:14px;line-height:1.6;margin:0;">${params.message}</p>
        </td></tr>
      </table>` : ""}
      ${ctaButton("Ver solicitud y responder →", `${APP_URL}/app/expert/hire-requests`)}
      <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:16px 0 0;text-align:center;">
        Acepta o rechaza la solicitud desde tu panel de BuddyOne.
      </p>
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendNewHireRequestEmail(params: {
  expertEmail: string;
  expertName: string;
  patientName: string;
  patientEmail: string;
  planName: string;
  planPrice: string;
  message?: string | null;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.expertEmail,
      subject: `🤝 Nueva solicitud de ${params.patientName} — Plan ${params.planName}`,
      html: newHireRequestEmailHtml(params),
    });
    if (error) { console.error("[Email] New hire request email failed:", error); return false; }
    console.log("[Email] New hire request email sent:", data?.id, "→", params.expertEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending new hire request email:", err); return false; }
}

// ─── Respuesta a Solicitud de Contratación (al Paciente) ─────────────────────

function hireRequestResponseEmailHtml(params: {
  patientName: string;
  expertName: string;
  planName: string;
  accepted: boolean;
  message?: string | null;
}): string {
  const firstName = params.patientName?.split(" ")[0] || "amigo";
  const body = `
  ${emailHeader(
    params.accepted ? "🎉" : "📩",
    params.accepted ? "¡Solicitud aceptada!" : "Solicitud no aceptada",
    params.accepted ? `${params.expertName} acepta trabajar contigo` : `${params.expertName} ha respondido a tu solicitud`,
    params.accepted ? "linear-gradient(135deg,#10B981 0%,#059669 100%)" : "linear-gradient(135deg,#6B7280 0%,#4B5563 100%)"
  )}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      ${params.accepted ? `
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        ¡Excelente noticia! <strong style="color:#059669;">${params.expertName}</strong> ha aceptado tu solicitud del plan <strong>${params.planName}</strong>. Ya estás vinculado a tu nutricionista en BuddyOne.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 12px;">🚀 ¿Qué sigue ahora?</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 8px;">💬 Escríbele un mensaje a tu nutricionista para presentarte</p>
          <p style="color:#15803D;font-size:13px;margin:0 0 8px;">📋 Completa tu perfil nutricional si aún no lo has hecho</p>
          <p style="color:#15803D;font-size:13px;margin:0;">📅 Solicita tu primera cita de valoración</p>
        </td></tr>
      </table>
      ${ctaButton("Ir a Mi Nutricionista →", `${APP_URL}/app/my-expert`)}` : `
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        <strong style="color:#4B5563;">${params.expertName}</strong> no puede aceptar tu solicitud en este momento para el plan <strong>${params.planName}</strong>.
      </p>
      ${params.message ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-left:4px solid #9CA3AF;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#374151;font-size:13px;font-weight:700;margin:0 0 6px;">💬 Mensaje del nutricionista</p>
          <p style="color:#4B5563;font-size:14px;line-height:1.6;margin:0;">${params.message}</p>
        </td></tr>
      </table>` : ""}
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Puedes buscar otros nutricionistas disponibles en el directorio de BuddyExperts.
      </p>
      ${ctaButton("Buscar nutricionistas →", `${APP_URL}/app/buddyexperts`)}`}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendHireRequestResponseEmail(params: {
  patientEmail: string;
  patientName: string;
  expertName: string;
  planName: string;
  accepted: boolean;
  message?: string | null;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.patientName?.split(" ")[0] || "amigo";
    const subject = params.accepted
      ? `🎉 ${params.expertName} ha aceptado tu solicitud, ${firstName}!`
      : `📩 Respuesta de ${params.expertName} a tu solicitud`;
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.patientEmail,
      subject,
      html: hireRequestResponseEmailHtml(params),
    });
    if (error) { console.error("[Email] Hire request response email failed:", error); return false; }
    console.log("[Email] Hire request response email sent:", data?.id, "→", params.patientEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending hire request response email:", err); return false; }
}

// ─── Resumen Semanal del Experto ──────────────────────────────────────────────

function expertWeeklySummaryHtml(params: {
  expertName: string;
  activePatients: number;
  pendingCheckins: number;
  appointmentsThisWeek: number;
  avgAdherence?: number | null;
  newMessages?: number;
}): string {
  const firstName = params.expertName?.split(" ")[0] || "experto";
  const now = new Date();
  const weekStr = now.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const body = `
  ${emailHeader("📊", "Tu resumen semanal", `Semana del ${weekStr}`, "linear-gradient(135deg,#1D4ED8 0%,#1E40AF 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${firstName}</strong>, aquí tienes el resumen de tu actividad esta semana en BuddyOne:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td width="48%" style="background:#EFF6FF;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">👥</div>
            <div style="color:#1D4ED8;font-size:28px;font-weight:800;">${params.activePatients}</div>
            <div style="color:#3B82F6;font-size:12px;margin-top:4px;">Pacientes activos</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:${params.pendingCheckins > 0 ? "#FEF2F2" : "#F0FDF4"};border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">📋</div>
            <div style="color:${params.pendingCheckins > 0 ? "#DC2626" : "#10B981"};font-size:28px;font-weight:800;">${params.pendingCheckins}</div>
            <div style="color:${params.pendingCheckins > 0 ? "#EF4444" : "#22C55E"};font-size:12px;margin-top:4px;">Check-ins pendientes</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">📅</div>
            <div style="color:#F97316;font-size:28px;font-weight:800;">${params.appointmentsThisWeek}</div>
            <div style="color:#FB923C;font-size:12px;margin-top:4px;">Citas esta semana</div>
          </td>
          <td width="4%"></td>
          ${params.avgAdherence !== null && params.avgAdherence !== undefined ? `
          <td width="48%" style="background:#F5F3FF;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">🎯</div>
            <div style="color:#7C3AED;font-size:28px;font-weight:800;">${params.avgAdherence}%</div>
            <div style="color:#8B5CF6;font-size:12px;margin-top:4px;">Adherencia media</div>
          </td>` : "<td width='48%'></td>"}
        </tr>
      </table>
      ${params.pendingCheckins > 0 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-radius:12px;padding:20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#991B1B;font-size:14px;font-weight:700;margin:0 0 8px;">⚠️ ${params.pendingCheckins} paciente${params.pendingCheckins > 1 ? "s" : ""} sin check-in esta semana</p>
          <p style="color:#7F1D1D;font-size:13px;margin:0;">Recuérdales que registren su progreso semanal para poder hacer un seguimiento adecuado.</p>
        </td></tr>
      </table>` : ""}
      ${ctaButton("Ver mi panel →", `${APP_URL}/app/expert/dashboard`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendExpertWeeklySummary(params: {
  expertEmail: string;
  expertName: string;
  activePatients: number;
  pendingCheckins: number;
  appointmentsThisWeek: number;
  avgAdherence?: number | null;
  newMessages?: number;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.expertEmail,
      subject: `📊 Tu resumen semanal BuddyOne — ${params.activePatients} pacientes activos`,
      html: expertWeeklySummaryHtml(params),
    });
    if (error) { console.error("[Email] Expert weekly summary failed:", error); return false; }
    console.log("[Email] Expert weekly summary sent:", data?.id, "→", params.expertEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending expert weekly summary:", err); return false; }
}

// ─── Hito Alcanzado (Paciente) ────────────────────────────────────────────────

function milestoneEmailHtml(params: {
  patientName: string;
  expertName: string;
  milestoneTitle: string;
  milestoneDescription: string;
  emoji: string;
}): string {
  const firstName = params.patientName?.split(" ")[0] || "amigo";
  const body = `
  ${emailHeader(params.emoji, `¡${params.milestoneTitle}!`, "Has alcanzado un nuevo hito en tu progreso", "linear-gradient(135deg,#F59E0B 0%,#D97706 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        ${params.milestoneDescription}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:2px solid #FDE68A;border-radius:16px;padding:32px;margin:0 0 24px;text-align:center;">
        <tr><td>
          <div style="font-size:64px;margin-bottom:16px;">${params.emoji}</div>
          <h2 style="color:#92400E;font-size:22px;font-weight:900;margin:0 0 8px;">${params.milestoneTitle}</h2>
          <p style="color:#78350F;font-size:14px;margin:0;">Con el apoyo de <strong>${params.expertName}</strong></p>
        </td></tr>
      </table>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
        Cada pequeño logro suma. ¡Sigue así!
      </p>
      ${ctaButton("Ver mi progreso →", `${APP_URL}/app/my-expert`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendMilestoneEmail(params: {
  patientEmail: string;
  patientName: string;
  expertName: string;
  milestoneTitle: string;
  milestoneDescription: string;
  emoji?: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.patientName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.patientEmail,
      subject: `${params.emoji || "🏆"} ¡${params.milestoneTitle}! Nuevo hito alcanzado, ${firstName}`,
      html: milestoneEmailHtml({ ...params, emoji: params.emoji || "🏆" }),
    });
    if (error) { console.error("[Email] Milestone email failed:", error); return false; }
    console.log("[Email] Milestone email sent:", data?.id, "→", params.patientEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending milestone email:", err); return false; }
}

// ─── Bienvenida BuddyExpert ───────────────────────────────────────────────────

function expertWelcomeEmailHtml(expertName: string): string {
  const firstName = expertName?.split(" ")[0] || "experto";
  const body = `
  ${emailHeader("🧑‍⚕️", `¡Bienvenido, ${firstName}!`, "Tu perfil como BuddyExpert ya está activo", "linear-gradient(135deg,#7C3AED 0%,#6D28D9 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Tu perfil como <strong style="color:#7C3AED;">BuddyExpert</strong> ha sido aprobado y ya está activo en BuddyOne. Ahora puedes empezar a conectar con pacientes y gestionar tu consulta de forma digital.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td width="48%" style="background:#F5F3FF;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">👤</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Completa tu perfil</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Añade foto, bio, especialidades y planes de servicio</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#F5F3FF;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">👥</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Invita pacientes</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Envía invitaciones por email a tus pacientes actuales</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td width="48%" style="background:#F5F3FF;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">🥗</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Crea menús</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Diseña menús semanales y asígnalos a tus pacientes</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#F5F3FF;border-radius:12px;padding:20px;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">💰</div>
            <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Define tus servicios</div>
            <div style="color:#777;font-size:13px;line-height:1.5;">Crea planes de pago para que los pacientes te contraten</div>
          </td>
        </tr>
      </table>
      ${ctaButton("Ir a mi panel de experto →", `${APP_URL}/app/buddyexpert/dashboard`)}
      <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:16px 0 0;text-align:center;">
        Si tienes alguna duda, escríbenos a <a href="mailto:hola@buddyone.io" style="color:#F97316;">hola@buddyone.io</a>
      </p>
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendExpertWelcomeEmail(params: {
  expertEmail: string;
  expertName: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.expertEmail,
      subject: `🧑‍⚕️ ¡Bienvenido a BuddyExperts! Tu perfil ya está activo`,
      html: expertWelcomeEmailHtml(params.expertName),
    });
    if (error) { console.error("[Email] Expert welcome email failed:", error); return false; }
    console.log("[Email] Expert welcome email sent:", data?.id, "→", params.expertEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending expert welcome email:", err); return false; }
}

// ─── Paciente sin Check-in (aviso al Experto) ─────────────────────────────────

function patientMissingCheckinEmailHtml(params: {
  expertName: string;
  patients: Array<{ name: string; weeksMissing: number }>;
}): string {
  const firstName = params.expertName?.split(" ")[0] || "experto";
  const patientRows = params.patients.map(p => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #FEE2E2;">
        <span style="color:#1a1a1a;font-size:14px;font-weight:600;">${p.name}</span>
        <span style="color:#DC2626;font-size:13px;float:right;">${p.weeksMissing} semana${p.weeksMissing > 1 ? "s" : ""} sin check-in</span>
      </td>
    </tr>`).join("");

  const body = `
  ${emailHeader("⚠️", "Pacientes sin check-in", "Algunos pacientes no han registrado su progreso", "linear-gradient(135deg,#DC2626 0%,#B91C1C 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Los siguientes pacientes no han completado su check-in semanal. Puede ser un buen momento para contactarles:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FEF2F2;border-radius:12px;padding:20px;margin:0 0 24px;">
        <tr><td>
          ${patientRows}
        </td></tr>
      </table>
      ${ctaButton("Ver mis pacientes →", `${APP_URL}/app/expert/patients`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendPatientMissingCheckinEmail(params: {
  expertEmail: string;
  expertName: string;
  patients: Array<{ name: string; weeksMissing: number }>;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.expertEmail,
      subject: `⚠️ ${params.patients.length} paciente${params.patients.length > 1 ? "s" : ""} sin check-in esta semana`,
      html: patientMissingCheckinEmailHtml(params),
    });
    if (error) { console.error("[Email] Patient missing checkin email failed:", error); return false; }
    console.log("[Email] Patient missing checkin email sent:", data?.id, "→", params.expertEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending patient missing checkin email:", err); return false; }
}

// ─── Email de Racha de 7 Días ─────────────────────────────────────────────────

function streakEmailHtml(name: string, streakDays: number): string {
  const firstName = name?.split(" ")[0] || "amigo";
  const milestone = streakDays >= 30 ? "🏆" : streakDays >= 14 ? "🥇" : "🔥";
  const title = streakDays >= 30
    ? `¡30 días de racha, ${firstName}!`
    : streakDays >= 14
    ? `¡2 semanas seguidas, ${firstName}!`
    : `¡7 días de racha, ${firstName}!`;
  const subtitle = streakDays >= 30
    ? "Un mes entero registrando tus comidas. ¡Eres increíble!"
    : streakDays >= 14
    ? "Dos semanas sin fallar ni un día. ¡Eso es disciplina!"
    : "Una semana completa registrando tus comidas. ¡Sigue así!";

  const body = `
  ${emailHeader(milestone, title, subtitle, "linear-gradient(135deg,#F97316 0%,#EF4444 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${firstName}</strong>,
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border:2px solid #FED7AA;border-radius:20px;padding:28px;margin:0 0 24px;text-align:center;">
        <tr><td>
          <div style="font-size:64px;margin-bottom:8px;">${milestone}</div>
          <p style="color:#C2410C;font-size:48px;font-weight:900;margin:0 0 4px;letter-spacing:-0.04em;">${streakDays}</p>
          <p style="color:#92400E;font-size:18px;font-weight:700;margin:0;">días consecutivos</p>
          <p style="color:#B45309;font-size:14px;margin:12px 0 0;">registrando tus comidas en BuddyOne</p>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:16px;padding:20px 24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 8px;">💡 ¿Sabías que...</p>
          <p style="color:#15803D;font-size:14px;line-height:1.6;margin:0;">
            Las personas que registran sus comidas durante <strong>7 días seguidos</strong> tienen un 
            <strong>80% más de probabilidades</strong> de alcanzar sus objetivos nutricionales. 
            ¡Tú ya llevas ${streakDays} días!
          </p>
        </td></tr>
      </table>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        ${streakDays >= 14
          ? "Tu constancia es admirable. Sigue así y verás resultados increíbles. ¡No rompas la racha!"
          : "Llevas una semana entera siendo fiel a tu plan nutricional. Cada día que registras es un paso más hacia tus objetivos."}
      </p>
      ${ctaButton(`Mantener mi racha de ${streakDays} días 🔥`, `${APP_URL}/app/meal-log`)}
      <p style="color:#9CA3AF;font-size:13px;text-align:center;margin:16px 0 0;">
        Sigue registrando hoy para no perder tu racha. ¡Tú puedes!
      </p>
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendStreakEmail(params: {
  userEmail: string;
  userName: string;
  streakDays: number;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const milestone = params.streakDays >= 30 ? "🏆" : params.streakDays >= 14 ? "🥇" : "🔥";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `${milestone} ¡${firstName}, llevas ${params.streakDays} días de racha en BuddyOne!`,
      html: streakEmailHtml(params.userName, params.streakDays),
    });
    if (error) { console.error("[Email] Streak email failed:", error); return false; }
    console.log("[Email] Streak email sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending streak email:", err); return false; }
}

// ─── Email de Logro Desbloqueado ──────────────────────────────────────────────

function achievementEmailHtml(name: string, achievementTitle: string, achievementDescription: string, achievementEmoji: string): string {
  const firstName = name?.split(" ")[0] || "amigo";
  const body = `
  ${emailHeader("🏅", `¡Nuevo logro desbloqueado!`, `${achievementEmoji} ${achievementTitle}`, "linear-gradient(135deg,#8B5CF6 0%,#7C3AED 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        ¡Enhorabuena, <strong>${firstName}</strong>! 🎉
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border:2px solid #DDD6FE;border-radius:20px;padding:28px;margin:0 0 24px;text-align:center;">
        <tr><td>
          <div style="font-size:64px;margin-bottom:16px;">${achievementEmoji}</div>
          <h2 style="color:#4C1D95;font-size:22px;font-weight:800;margin:0 0 8px;">${achievementTitle}</h2>
          <p style="color:#6D28D9;font-size:15px;line-height:1.6;margin:0;">${achievementDescription}</p>
        </td></tr>
      </table>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Acabas de desbloquear este logro en BuddyOne. Cada logro es un recordatorio de tu progreso y tu dedicación. ¡Sigue así!
      </p>
      ${ctaButton("Ver todos mis logros 🏆", `${APP_URL}/app/achievements`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendAchievementEmail(params: {
  userEmail: string;
  userName: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementEmoji: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `🏅 ¡${firstName}, has desbloqueado un nuevo logro en BuddyOne!`,
      html: achievementEmailHtml(params.userName, params.achievementTitle, params.achievementDescription, params.achievementEmoji),
    });
    if (error) { console.error("[Email] Achievement email failed:", error); return false; }
    console.log("[Email] Achievement email sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending achievement email:", err); return false; }
}

// ─── Email Primer Menú IA ─────────────────────────────────────────────────────
function firstAIMenuEmailHtml(name: string, menuName: string): string {
  const firstName = name?.split(" ")[0] || "amigo";
  const body = `
  ${emailHeader("🥗", `¡Tu primer menú IA está listo!`, `${menuName} — generado especialmente para ti`, "linear-gradient(135deg,#22C55E 0%,#16A34A 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        ¡Enhorabuena, <strong>${firstName}</strong>! 🎉
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Tu primer menú generado con Inteligencia Artificial ya está disponible en BuddyOne.
        Ha sido creado teniendo en cuenta tus objetivos nutricionales, preferencias y restricciones alimentarias.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:2px solid #BBF7D0;border-radius:20px;padding:28px;margin:0 0 24px;">
        <tr><td>
          <div style="font-size:48px;text-align:center;margin-bottom:16px;">🥗</div>
          <h2 style="color:#14532D;font-size:20px;font-weight:800;margin:0 0 8px;text-align:center;">${menuName}</h2>
          <p style="color:#166534;font-size:14px;line-height:1.6;margin:0;text-align:center;">
            Menú semanal personalizado · Generado por IA · Adaptado a tus objetivos
          </p>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td width="30%" style="background:#F0FDF4;border-radius:12px;padding:16px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">📅</div>
            <div style="color:#166534;font-size:13px;font-weight:700;">7 días</div>
            <div style="color:#4ADE80;font-size:12px;">de menú completo</div>
          </td>
          <td width="5%"></td>
          <td width="30%" style="background:#F0FDF4;border-radius:12px;padding:16px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">🎯</div>
            <div style="color:#166534;font-size:13px;font-weight:700;">Personalizado</div>
            <div style="color:#4ADE80;font-size:12px;">a tus objetivos</div>
          </td>
          <td width="5%"></td>
          <td width="30%" style="background:#F0FDF4;border-radius:12px;padding:16px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;margin-bottom:8px;">🛒</div>
            <div style="color:#166534;font-size:13px;font-weight:700;">Lista de compra</div>
            <div style="color:#4ADE80;font-size:12px;">incluida</div>
          </td>
        </tr>
      </table>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Puedes aplicar este menú a tu diario nutricional, generar la lista de la compra automáticamente
        y ajustarlo a tus preferencias. ¡La IA de BuddyOne aprende de ti con cada menú que generas!
      </p>
      ${ctaButton("Ver mi menú en BuddyOne →", `${APP_URL}/app/menus`)}
      <p style="color:#9CA3AF;font-size:13px;text-align:center;margin:16px 0 0;">
        ¿Quieres otro menú diferente? Puedes generar tantos como quieras desde la sección de IA.
      </p>
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendFirstAIMenuEmail(params: {
  userEmail: string;
  userName: string;
  menuName: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `🥗 ¡${firstName}, tu primer menú IA está listo en BuddyOne!`,
      html: firstAIMenuEmailHtml(params.userName, params.menuName),
    });
    if (error) { console.error("[Email] First AI menu email failed:", error); return false; }
    console.log("[Email] First AI menu email sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending first AI menu email:", err); return false; }
}

// ─── Email Resumen Semanal de Progreso (Usuario) ──────────────────────────────
function userWeeklyProgressHtml(params: {
  userName: string;
  daysLogged: number;
  avgCalories: number | null;
  avgProtein: number | null;
  weightChange: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  streakDays: number;
}): string {
  const firstName = params.userName?.split(" ")[0] || "amigo";
  const weightChangeText = params.weightChange !== null
    ? params.weightChange < 0
      ? `<span style="color:#16A34A;font-weight:700;">↓ ${Math.abs(params.weightChange).toFixed(1)} kg</span>`
      : params.weightChange > 0
      ? `<span style="color:#DC2626;font-weight:700;">↑ ${params.weightChange.toFixed(1)} kg</span>`
      : `<span style="color:#6B7280;font-weight:700;">= Sin cambio</span>`
    : `<span style="color:#9CA3AF;">Sin datos</span>`;
  const progressToGoal = params.currentWeight && params.targetWeight
    ? Math.round(((params.currentWeight - params.targetWeight) / params.currentWeight) * 100)
    : null;
  const body = `
  ${emailHeader("📊", `Tu resumen semanal`, `${params.daysLogged}/7 días registrados esta semana`, "linear-gradient(135deg,#3B82F6 0%,#2563EB 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${firstName}</strong>, aquí tienes tu resumen de la semana:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td width="48%" style="background:#EFF6FF;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:32px;font-weight:900;color:#1D4ED8;">${params.daysLogged}/7</div>
            <div style="color:#3B82F6;font-size:13px;font-weight:700;">Días registrados</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#EFF6FF;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:32px;font-weight:900;color:#1D4ED8;">${params.streakDays}</div>
            <div style="color:#3B82F6;font-size:13px;font-weight:700;">Días de racha 🔥</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height:12px;"></td></tr>
        <tr>
          <td width="48%" style="background:#EFF6FF;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;font-weight:900;color:#1D4ED8;">${params.avgCalories ? Math.round(params.avgCalories) : "—"}</div>
            <div style="color:#3B82F6;font-size:13px;font-weight:700;">kcal/día promedio</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#EFF6FF;border-radius:12px;padding:20px;text-align:center;vertical-align:top;">
            <div style="font-size:28px;font-weight:900;color:#1D4ED8;">${params.avgProtein ? Math.round(params.avgProtein) : "—"}g</div>
            <div style="color:#3B82F6;font-size:13px;font-weight:700;">proteína/día promedio</div>
          </td>
        </tr>
      </table>
      ${params.currentWeight || params.weightChange !== null ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:16px;padding:24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 12px;">⚖️ Evolución del peso</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${params.currentWeight ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;">Peso actual:</td><td style="color:#1a1a1a;font-size:14px;font-weight:700;text-align:right;">${params.currentWeight.toFixed(1)} kg</td></tr>` : ""}
            ${params.targetWeight ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;">Objetivo:</td><td style="color:#1a1a1a;font-size:14px;font-weight:700;text-align:right;">${params.targetWeight.toFixed(1)} kg</td></tr>` : ""}
            ${params.weightChange !== null ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;">Cambio esta semana:</td><td style="font-size:14px;text-align:right;">${weightChangeText}</td></tr>` : ""}
            ${progressToGoal !== null ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;">Progreso hacia objetivo:</td><td style="color:#1a1a1a;font-size:14px;font-weight:700;text-align:right;">${progressToGoal}% restante</td></tr>` : ""}
          </table>
        </td></tr>
      </table>` : ""}
      ${params.daysLogged < 5 ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border-radius:16px;padding:20px 24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#C2410C;font-size:14px;font-weight:700;margin:0 0 8px;">💡 Consejo para la próxima semana</p>
          <p style="color:#92400E;font-size:14px;line-height:1.6;margin:0;">
            Registraste ${params.daysLogged} de 7 días. Los usuarios que registran 5+ días por semana
            alcanzan sus objetivos un <strong>3x más rápido</strong>. ¡Intenta llegar a 5 días la próxima semana!
          </p>
        </td></tr>
      </table>` : `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:16px;padding:20px 24px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#166534;font-size:14px;font-weight:700;margin:0 0 8px;">🌟 ¡Excelente semana!</p>
          <p style="color:#15803D;font-size:14px;line-height:1.6;margin:0;">
            Registraste ${params.daysLogged} de 7 días. ¡Eso es una semana casi perfecta!
            Tu constancia está marcando la diferencia. ¡Sigue así!
          </p>
        </td></tr>
      </table>`}
      ${ctaButton("Ver mi progreso completo →", `${APP_URL}/app/dashboard`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendUserWeeklyProgress(params: {
  userEmail: string;
  userName: string;
  daysLogged: number;
  avgCalories: number | null;
  avgProtein: number | null;
  weightChange: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  streakDays: number;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `📊 ${firstName}, tu resumen semanal de BuddyOne está listo`,
      html: userWeeklyProgressHtml(params),
    });
    if (error) { console.error("[Email] User weekly progress failed:", error); return false; }
    console.log("[Email] User weekly progress sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending user weekly progress:", err); return false; }
}

// ─── Email de Recordatorio de Racha en Peligro (20:00) ───────────────────────

function streakReminderHtml(name: string, streakDays: number, caloriesLogged: number, dailyGoal: number): string {
  const firstName = name?.split(" ")[0] || "amigo";
  const pct = Math.min(100, Math.round((caloriesLogged / (dailyGoal || 2000)) * 100));
  const body = `
  ${emailHeader("⚠️", `¡Tu racha de ${streakDays} días está en peligro!`, "Aún estás a tiempo de registrar hoy", "linear-gradient(135deg,#F97316 0%,#EA580C 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px;">
        Hola, <strong>${firstName}</strong> 👋
      </p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Llevas <strong>${streakDays} días</strong> registrando tus comidas en BuddyOne. ¡Es un logro increíble! Pero hoy aún no has registrado nada y son las 20:00. Tienes tiempo para hacerlo.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:2px solid #FED7AA;border-radius:16px;padding:24px;margin:0 0 24px;text-align:center;">
        <tr><td>
          <div style="font-size:40px;margin-bottom:8px;">🔥</div>
          <p style="color:#92400E;font-size:24px;font-weight:800;margin:0 0 4px;">${streakDays} días de racha</p>
          <p style="color:#B45309;font-size:14px;margin:0;">No la pierdas ahora</p>
        </td></tr>
      </table>
      ${caloriesLogged > 0 ? `
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hoy llevas <strong>${caloriesLogged} kcal</strong> registradas (${pct}% de tu objetivo diario de ${dailyGoal} kcal). ¡Solo falta completar el día!
      </p>
      ` : `
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hoy aún no has registrado ninguna comida. Solo necesitas añadir lo que has comido para mantener tu racha. ¡Son 2 minutos!
      </p>
      `}
      ${ctaButton("Registrar mis comidas ahora 🍽️", `${APP_URL}/app/diary`)}
      <p style="color:#9CA3AF;font-size:13px;text-align:center;margin:16px 0 0;">
        Si usas el escudo de racha, puedes proteger tu racha aunque no registres hoy.
      </p>
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendStreakReminderEmail(params: {
  userEmail: string;
  userName: string;
  streakDays: number;
  caloriesLogged: number;
  dailyGoal: number;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `⚠️ ${firstName}, tu racha de ${params.streakDays} días está en peligro`,
      html: streakReminderHtml(params.userName, params.streakDays, params.caloriesLogged, params.dailyGoal),
    });
    if (error) { console.error("[Email] Streak reminder failed:", error); return false; }
    console.log("[Email] Streak reminder sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending streak reminder:", err); return false; }
}

// ─── Email de Resumen Diario Nocturno (21:00) ────────────────────────────────

function dailySummaryHtml(params: {
  userName: string;
  caloriesLogged: number;
  dailyGoal: number;
  proteinsLogged: number;
  carbsLogged: number;
  fatsLogged: number;
  mealsLogged: number;
  streakDays: number;
  tomorrowRecipeName: string | null;
  tomorrowRecipeUrl: string | null;
  microTip: string;
}): string {
  const firstName = params.userName?.split(" ")[0] || "amigo";
  const pct = Math.min(100, Math.round((params.caloriesLogged / (params.dailyGoal || 2000)) * 100));
  const remaining = Math.max(0, params.dailyGoal - params.caloriesLogged);
  const statusEmoji = pct >= 90 ? "🎯" : pct >= 60 ? "👍" : "💪";
  const statusMsg = pct >= 90 ? "¡Objetivo casi alcanzado!" : pct >= 60 ? "Buen progreso hoy" : "Puedes mejorar mañana";

  const body = `
  ${emailHeader("🌙", `Tu resumen de hoy, ${firstName}`, "Así ha ido tu día nutricional", "linear-gradient(135deg,#1E40AF 0%,#1D4ED8 100%)")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <!-- Resumen de calorías -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border:2px solid #BFDBFE;border-radius:16px;padding:24px;margin:0 0 24px;text-align:center;">
        <tr><td>
          <div style="font-size:36px;margin-bottom:8px;">${statusEmoji}</div>
          <p style="color:#1E3A8A;font-size:28px;font-weight:800;margin:0 0 4px;">${params.caloriesLogged} kcal</p>
          <p style="color:#3B82F6;font-size:14px;margin:0 0 12px;">de ${params.dailyGoal} kcal objetivo · ${statusMsg}</p>
          <!-- Barra de progreso -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#DBEAFE;border-radius:8px;height:12px;overflow:hidden;">
            <tr>
              <td width="${pct}%" style="background:linear-gradient(90deg,#3B82F6,#1D4ED8);height:12px;border-radius:8px;"></td>
              <td width="${100 - pct}%" style="height:12px;"></td>
            </tr>
          </table>
          ${remaining > 0 ? `<p style="color:#6B7280;font-size:13px;margin:8px 0 0;">Te quedan ${remaining} kcal para completar el objetivo</p>` : `<p style="color:#16A34A;font-size:13px;margin:8px 0 0;">✅ ¡Objetivo alcanzado!</p>`}
        </td></tr>
      </table>
      <!-- Macros -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td width="33%" style="padding:0 4px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;text-align:center;">
              <tr><td>
                <p style="color:#166534;font-size:20px;font-weight:800;margin:0 0 2px;">${Math.round(params.proteinsLogged)}g</p>
                <p style="color:#16A34A;font-size:12px;margin:0;">Proteínas</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 2px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:16px;text-align:center;">
              <tr><td>
                <p style="color:#92400E;font-size:20px;font-weight:800;margin:0 0 2px;">${Math.round(params.carbsLogged)}g</p>
                <p style="color:#B45309;font-size:12px;margin:0;">Carbos</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 0 0 4px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF4FF;border:1px solid #E9D5FF;border-radius:12px;padding:16px;text-align:center;">
              <tr><td>
                <p style="color:#581C87;font-size:20px;font-weight:800;margin:0 0 2px;">${Math.round(params.fatsLogged)}g</p>
                <p style="color:#7C3AED;font-size:12px;margin:0;">Grasas</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
      <!-- Racha y comidas -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td width="50%" style="padding:0 4px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:12px;padding:16px;text-align:center;">
              <tr><td>
                <p style="font-size:24px;margin:0 0 4px;">🔥</p>
                <p style="color:#92400E;font-size:18px;font-weight:800;margin:0 0 2px;">${params.streakDays} días</p>
                <p style="color:#B45309;font-size:12px;margin:0;">Racha actual</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 0 0 4px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;text-align:center;">
              <tr><td>
                <p style="font-size:24px;margin:0 0 4px;">🍽️</p>
                <p style="color:#166534;font-size:18px;font-weight:800;margin:0 0 2px;">${params.mealsLogged} comidas</p>
                <p style="color:#16A34A;font-size:12px;margin:0;">Registradas hoy</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
      <!-- Receta de mañana -->
      ${params.tomorrowRecipeName ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#374151;font-size:14px;font-weight:700;margin:0 0 8px;">🍳 Receta sugerida para mañana</p>
          <p style="color:#F97316;font-size:16px;font-weight:800;margin:0 0 12px;">${params.tomorrowRecipeName}</p>
          ${params.tomorrowRecipeUrl ? `<a href="${params.tomorrowRecipeUrl}" style="color:#F97316;font-size:13px;text-decoration:none;font-weight:600;">Ver receta completa →</a>` : ''}
        </td></tr>
      </table>
      ` : ''}
      <!-- Micro-tip -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 12px 12px 0;padding:16px 20px;margin:0 0 24px;">
        <tr><td>
          <p style="color:#92400E;font-size:13px;font-weight:700;margin:0 0 4px;">💡 Tip nutricional del día</p>
          <p style="color:#78350F;font-size:14px;line-height:1.6;margin:0;">${params.microTip}</p>
        </td></tr>
      </table>
      ${ctaButton("Ver mi diario completo 📊", `${APP_URL}/app/diary`)}
    </td>
  </tr>`;
  return emailWrapper(body);
}

export async function sendDailySummaryEmail(params: {
  userEmail: string;
  userName: string;
  caloriesLogged: number;
  dailyGoal: number;
  proteinsLogged: number;
  carbsLogged: number;
  fatsLogged: number;
  mealsLogged: number;
  streakDays: number;
  tomorrowRecipeName: string | null;
  tomorrowRecipeUrl: string | null;
  microTip: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const firstName = params.userName?.split(" ")[0] || "amigo";
    const pct = Math.min(100, Math.round((params.caloriesLogged / (params.dailyGoal || 2000)) * 100));
    const subjectEmoji = pct >= 90 ? "🎯" : pct >= 60 ? "📊" : "💪";
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: `${subjectEmoji} ${firstName}, tu resumen nutricional de hoy`,
      html: dailySummaryHtml(params),
    });
    if (error) { console.error("[Email] Daily summary failed:", error); return false; }
    console.log("[Email] Daily summary sent:", data?.id, "→", params.userEmail);
    return true;
  } catch (err) { console.error("[Email] Error sending daily summary:", err); return false; }
}

// ─── B2B Perk Campaign Email ─────────────────────────────────────────────────

function b2bPerkCampaignHtml(params: {
  contactName: string;
  companyName: string;
  employeeCount?: number;
}): string {
  const { contactName, companyName, employeeCount } = params;
  const pricePerEmployee = !employeeCount ? "3,90" :
    employeeCount >= 1000 ? "1,90" :
    employeeCount >= 500 ? "2,20" :
    employeeCount >= 250 ? "2,50" :
    employeeCount >= 100 ? "3,40" :
    employeeCount >= 50 ? "3,50" : "3,90";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">
          <!-- HERO -->
          <tr><td style="padding:0;">
            <div style="background:linear-gradient(160deg,#1a0533 0%,#2d1052 25%,#4c1d95 50%,#7c3aed 75%,#f97316 100%);border-radius:24px 24px 0 0;padding:60px 48px 48px;text-align:center;">
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:16px;display:inline-block;text-align:center;line-height:56px;font-size:28px;margin-bottom:28px;border:1px solid rgba(255,255,255,0.2);">🍊</div>
              <h1 style="font-size:36px;font-weight:900;color:#ffffff;margin:0 0 12px;letter-spacing:-0.5px;line-height:1.1;">Nutrición inteligente<br>para tu equipo</h1>
              <p style="font-size:16px;color:rgba(255,255,255,0.75);margin:0 0 36px;line-height:1.6;">Ofrece a tus empleados el mejor perk de bienestar del mercado. Sin complicaciones.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:16px 8px;background:rgba(255,255,255,0.08);border-radius:12px;"><p style="font-size:28px;font-weight:900;color:#ffffff;margin:0;">+10K</p><p style="font-size:11px;color:rgba(255,255,255,0.6);margin:4px 0 0;text-transform:uppercase;letter-spacing:0.08em;">Recetas</p></td>
                  <td width="8"></td>
                  <td width="33%" style="text-align:center;padding:16px 8px;background:rgba(255,255,255,0.08);border-radius:12px;"><p style="font-size:28px;font-weight:900;color:#ffffff;margin:0;">2 min</p><p style="font-size:11px;color:rgba(255,255,255,0.6);margin:4px 0 0;text-transform:uppercase;letter-spacing:0.08em;">Al día</p></td>
                  <td width="8"></td>
                  <td width="33%" style="text-align:center;padding:16px 8px;background:rgba(255,255,255,0.08);border-radius:12px;"><p style="font-size:28px;font-weight:900;color:#ffffff;margin:0;">100%</p><p style="font-size:11px;color:rgba(255,255,255,0.6);margin:4px 0 0;text-transform:uppercase;letter-spacing:0.08em;">Privado</p></td>
                </tr>
              </table>
            </div>
          </td></tr>
          <!-- BODY -->
          <tr><td style="background:#111111;padding:48px;border-left:1px solid #1f1f1f;border-right:1px solid #1f1f1f;">
            <p style="font-size:17px;color:#e5e5e5;line-height:1.8;margin:0 0 24px;">Hola <strong style="color:#ffffff;">${contactName}</strong>,</p>
            <p style="font-size:15px;color:#a3a3a3;line-height:1.8;margin:0 0 28px;">Sé que en <strong style="color:#ffffff;">${companyName}</strong> el bienestar del equipo es prioridad. Por eso quiero presentarte <strong style="color:#a78bfa;">BuddyOne</strong> — la plataforma que convierte la nutrición saludable en algo fácil, rápido y personalizado para cada empleado.</p>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#333,transparent);margin:32px 0;"></div>
            <!-- FEATURES -->
            <p style="font-size:12px;font-weight:700;color:#7c3aed;margin:0 0 20px;text-transform:uppercase;letter-spacing:0.12em;">Cada empleado recibe</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="background:#1a1a1a;border-radius:16px;padding:20px;vertical-align:top;border:1px solid #262626;"><div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin-bottom:12px;">🧠</div><p style="font-size:14px;font-weight:700;color:#ffffff;margin:0 0 4px;">Menús con IA</p><p style="font-size:12px;color:#737373;margin:0;line-height:1.5;">Planes semanales personalizados generados en segundos</p></td>
                <td width="4%"></td>
                <td width="48%" style="background:#1a1a1a;border-radius:16px;padding:20px;vertical-align:top;border:1px solid #262626;"><div style="width:36px;height:36px;background:linear-gradient(135deg,#f97316,#fb923c);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin-bottom:12px;">📊</div><p style="font-size:14px;font-weight:700;color:#ffffff;margin:0 0 4px;">Seguimiento total</p><p style="font-size:12px;color:#737373;margin:0;line-height:1.5;">Calorías, macros, micros y progreso visual</p></td>
              </tr>
              <tr><td colspan="3" height="12"></td></tr>
              <tr>
                <td width="48%" style="background:#1a1a1a;border-radius:16px;padding:20px;vertical-align:top;border:1px solid #262626;"><div style="width:36px;height:36px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin-bottom:12px;">🛒</div><p style="font-size:14px;font-weight:700;color:#ffffff;margin:0 0 4px;">Lista de la compra</p><p style="font-size:12px;color:#737373;margin:0;line-height:1.5;">Generada automáticamente desde el menú semanal</p></td>
                <td width="4%"></td>
                <td width="48%" style="background:#1a1a1a;border-radius:16px;padding:20px;vertical-align:top;border:1px solid #262626;"><div style="width:36px;height:36px;background:linear-gradient(135deg,#ec4899,#f472b6);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin-bottom:12px;">⌚</div><p style="font-size:14px;font-weight:700;color:#ffffff;margin:0 0 4px;">Wearables</p><p style="font-size:12px;color:#737373;margin:0;line-height:1.5;">Oura, Apple Health, Google Fit sincronizados</p></td>
              </tr>
              <tr><td colspan="3" height="12"></td></tr>
              <tr>
                <td width="48%" style="background:#1a1a1a;border-radius:16px;padding:20px;vertical-align:top;border:1px solid #262626;"><div style="width:36px;height:36px;background:linear-gradient(135deg,#06b6d4,#67e8f9);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin-bottom:12px;">👨‍⚕️</div><p style="font-size:14px;font-weight:700;color:#ffffff;margin:0 0 4px;">BuddyExperts</p><p style="font-size:12px;color:#737373;margin:0;line-height:1.5;">Nutricionistas certificados disponibles on-demand</p></td>
                <td width="4%"></td>
                <td width="48%" style="background:#1a1a1a;border-radius:16px;padding:20px;vertical-align:top;border:1px solid #262626;"><div style="width:36px;height:36px;background:linear-gradient(135deg,#eab308,#fde047);border-radius:10px;text-align:center;line-height:36px;font-size:18px;margin-bottom:12px;">🍳</div><p style="font-size:14px;font-weight:700;color:#ffffff;margin:0 0 4px;">+10.000 recetas</p><p style="font-size:12px;color:#737373;margin:0;line-height:1.5;">Adaptadas a alergias, preferencias y objetivos</p></td>
              </tr>
            </table>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#333,transparent);margin:36px 0;"></div>
            <!-- PRICING -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a0533,#2d1052);border-radius:20px;overflow:hidden;border:1px solid #4c1d95;"><tr><td style="padding:36px;text-align:center;"><p style="font-size:11px;font-weight:700;color:#a78bfa;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.15em;">Tu precio exclusivo</p><p style="font-size:56px;font-weight:900;color:#ffffff;margin:0;line-height:1;">${pricePerEmployee}€</p><p style="font-size:14px;color:#a78bfa;margin:8px 0 0;">por empleado/mes</p><div style="height:1px;background:linear-gradient(90deg,transparent,#7c3aed,transparent);margin:20px 0;"></div><p style="font-size:13px;color:#737373;margin:0;">Sin permanencia · Facturación mensual · Cancelación inmediata</p></td></tr></table>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#333,transparent);margin:36px 0;"></div>
            <!-- STEPS -->
            <p style="font-size:12px;font-weight:700;color:#f97316;margin:0 0 24px;text-transform:uppercase;letter-spacing:0.12em;">Activación en 4 pasos</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:12px 0;vertical-align:top;width:44px;"><div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:800;color:#ffffff;">1</div></td><td style="padding:12px 0;vertical-align:middle;"><p style="font-size:14px;color:#e5e5e5;margin:0;font-weight:600;">Elegís el volumen de empleados</p><p style="font-size:12px;color:#737373;margin:2px 0 0;">El precio baja automáticamente con más licencias</p></td></tr>
              <tr><td style="padding:12px 0;vertical-align:top;"><div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:800;color:#ffffff;">2</div></td><td style="padding:12px 0;vertical-align:middle;"><p style="font-size:14px;color:#e5e5e5;margin:0;font-weight:600;">Cada empleado recibe un código único</p><p style="font-size:12px;color:#737373;margin:2px 0 0;">Lo envías por email interno o Slack</p></td></tr>
              <tr><td style="padding:12px 0;vertical-align:top;"><div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:800;color:#ffffff;">3</div></td><td style="padding:12px 0;vertical-align:middle;"><p style="font-size:14px;color:#e5e5e5;margin:0;font-weight:600;">Activan Pro Max en 30 segundos</p><p style="font-size:12px;color:#737373;margin:2px 0 0;">Sin tarjeta de crédito, sin fricción</p></td></tr>
              <tr><td style="padding:12px 0;vertical-align:top;"><div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:800;color:#ffffff;">4</div></td><td style="padding:12px 0;vertical-align:middle;"><p style="font-size:14px;color:#e5e5e5;margin:0;font-weight:600;">Tú solo ves datos agregados</p><p style="font-size:12px;color:#737373;margin:2px 0 0;">Privacidad total — cero datos individuales</p></td></tr>
            </table>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#333,transparent);margin:36px 0;"></div>
            <!-- PRIVACY -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1f0a;border-radius:14px;border:1px solid #166534;"><tr><td style="padding:20px 24px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="44" style="vertical-align:top;"><div style="width:36px;height:36px;background:#166534;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">🔒</div></td><td style="vertical-align:middle;padding-left:12px;"><p style="font-size:14px;font-weight:700;color:#4ade80;margin:0 0 4px;">Privacidad garantizada</p><p style="font-size:12px;color:#86efac;margin:0;line-height:1.5;">RRHH solo ve licencias activas y facturación. Nunca datos de nutrición o salud individuales. Cumplimiento RGPD total.</p></td></tr></table></td></tr></table>
            <div style="height:1px;background:linear-gradient(90deg,transparent,#333,transparent);margin:36px 0;"></div>
            <!-- CTA -->
            <div style="text-align:center;padding:8px 0 16px;">
              <p style="font-size:18px;font-weight:700;color:#ffffff;margin:0 0 8px;">¿Hacemos un piloto gratuito?</p>
              <p style="font-size:14px;color:#737373;margin:0 0 28px;">30 días gratis con un grupo reducido. Sin compromiso.</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;"><tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:14px;padding:18px 48px;text-align:center;"><a href="${APP_URL}/empresas" style="color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;letter-spacing:0.02em;">Solicitar piloto gratuito</a></td></tr></table>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background:transparent;border:1px solid #404040;border-radius:14px;padding:14px 36px;text-align:center;"><a href="${APP_URL}/empresas" style="color:#a3a3a3;font-size:14px;font-weight:600;text-decoration:none;">Ver más información →</a></td></tr></table>
            </div>
          </td></tr>
          <!-- SIGNATURE -->
          <tr><td style="background:#0d0d0d;padding:36px 48px;border-left:1px solid #1f1f1f;border-right:1px solid #1f1f1f;border-top:1px solid #1f1f1f;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="48" style="vertical-align:top;"><div style="width:44px;height:44px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;text-align:center;line-height:44px;font-size:20px;font-weight:900;color:#ffffff;">JP</div></td><td style="vertical-align:top;padding-left:14px;"><p style="font-size:15px;font-weight:700;color:#ffffff;margin:0 0 2px;">Javier Pérez</p><p style="font-size:13px;color:#737373;margin:0 0 2px;">CEO & Co-founder, BuddyOne</p><p style="font-size:13px;color:#525252;margin:0;">javier@buddyone.io · +34 600 000 000</p></td></tr></table></td></tr>
          <!-- FOOTER -->
          <tr><td style="background:#080808;padding:28px 48px;text-align:center;border-radius:0 0 24px 24px;border:1px solid #1f1f1f;border-top:none;"><p style="font-size:12px;color:#525252;margin:0 0 12px;line-height:1.6;">Este email es una comunicación comercial de BuddyOne Technologies S.L.<br>Si no deseas recibir más emails, <a href="${APP_URL}/baja" style="color:#737373;text-decoration:underline;">date de baja aquí</a>.</p><p style="margin:0;"><a href="${APP_URL}" style="color:#7c3aed;text-decoration:none;font-size:12px;font-weight:600;">buddyone.io</a><span style="color:#333;margin:0 8px;">·</span><a href="${APP_URL}/privacidad" style="color:#525252;text-decoration:none;font-size:12px;">Privacidad</a><span style="color:#333;margin:0 8px;">·</span><a href="${APP_URL}/empresas" style="color:#525252;text-decoration:none;font-size:12px;">Empresas</a></p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface B2BPerkCampaignRecipient {
  contactName: string;
  contactEmail: string;
  companyName: string;
  employeeCount?: number;
}

export async function sendB2BPerkCampaignEmail(recipient: B2BPerkCampaignRecipient): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping B2B perk campaign email");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient.contactEmail,
      subject: `${recipient.contactName}, nutrición inteligente como perk para ${recipient.companyName}`,
      html: b2bPerkCampaignHtml({
        contactName: recipient.contactName,
        companyName: recipient.companyName,
        employeeCount: recipient.employeeCount,
      }),
      replyTo: "javier@buddyone.io",
    });
    if (error) {
      console.error("[Email] B2B perk campaign failed:", error, "→", recipient.contactEmail);
      return { success: false, error: error.message };
    }
    console.log("[Email] B2B perk campaign sent:", data?.id, "→", recipient.contactEmail);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error("[Email] Error sending B2B perk campaign:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function sendB2BPerkCampaignBatch(recipients: B2BPerkCampaignRecipient[]): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{ email: string; company: string; success: boolean; messageId?: string; error?: string }>;
}> {
  const results: Array<{ email: string; company: string; success: boolean; messageId?: string; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendB2BPerkCampaignEmail(recipient);
    results.push({
      email: recipient.contactEmail,
      company: recipient.companyName,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
    if (result.success) sent++;
    else failed++;
    // Rate limit: wait 200ms between emails to avoid Resend limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { total: recipients.length, sent, failed, results };
}
