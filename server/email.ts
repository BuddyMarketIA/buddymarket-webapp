import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified Resend domain as sender. To use a custom domain (info@buddymarket.io),
// verify buddymarket.io at https://resend.com/domains and update this value.
const CUSTOM_FROM_EMAIL = process.env.EMAIL_FROM || "BuddyMarket <onboarding@resend.dev>";
const FROM_EMAIL = CUSTOM_FROM_EMAIL;
const APP_URL = process.env.PUBLIC_APP_URL || "https://buddymarketapp.com";

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          ${content}
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0e8e0;margin:0;"></td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="color:#999;font-size:13px;margin:0 0 8px;line-height:1.6;">
                Has recibido este correo porque eres usuario de BuddyMarket.<br>
                Si tienes alguna pregunta, responde a este email.
              </p>
              <p style="margin:0;">
                <a href="${APP_URL}" style="color:#F97316;text-decoration:none;font-size:13px;font-weight:600;">buddymarketapp.com</a>
                <span style="color:#ccc;margin:0 8px;">·</span>
                <a href="${APP_URL}/privacidad" style="color:#999;text-decoration:none;font-size:13px;">Privacidad</a>
                <span style="color:#ccc;margin:0 8px;">·</span>
                <a href="${APP_URL}/baja" style="color:#999;text-decoration:none;font-size:13px;">Darse de baja</a>
              </p>
              <p style="color:#bbb;font-size:12px;margin:12px 0 0;">© 2026 BuddyMarket · Hecho con 🧡 en España</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailHeader(emoji: string, title: string, subtitle: string, bgColor = "linear-gradient(135deg,#F97316 0%,#EA580C 100%)"): string {
  return `
  <tr>
    <td style="background:${bgColor};padding:44px 40px 36px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
        <tr>
          <td style="background:rgba(255,255,255,0.15);border-radius:16px;padding:10px 18px;">
            <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">🥗 BUDDY<span style="color:#FED7AA;">MARKET</span></span>
          </td>
        </tr>
      </table>
      <div style="font-size:48px;margin-bottom:12px;">${emoji}</div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;line-height:1.2;">${title}</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;line-height:1.5;">${subtitle}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="background:#FED7AA;height:5px;"></td>
          <td width="34%" style="background:#F97316;height:5px;"></td>
          <td width="33%" style="background:#EA580C;height:5px;"></td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function ctaButton(text: string, url: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 20px;">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#F97316,#EA580C);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;letter-spacing:0.3px;">${text}</a>
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
        Te avisaremos en cuanto sea aprobada. Mientras tanto, ya puedes explorar todas las funcionalidades de BuddyMarket.
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
        Llevas 2 días con nosotros y queremos asegurarnos de que estás sacando el máximo partido a BuddyMarket. 
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
              BuddyMarket te mostrará qué recetas puedes cocinar ahora mismo con lo que tienes, 
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
        consiguen sus objetivos nutricionales? Con BuddyMarket es más fácil que nunca.
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

// ─── Day 7 Email: ¡Una semana con BuddyMarket! ───────────────────────────────

function day7EmailHtml(name: string): string {
  const firstName = name?.split(" ")[0] || "amigo";

  const body = `
  ${emailHeader("🏆", `¡Una semana contigo, ${firstName}!`, "Gracias por confiar en BuddyMarket para tu nutrición", "linear-gradient(135deg,#059669 0%,#047857 100%)")}
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
              "BuddyMarket ha cambiado completamente mi relación con la comida. En solo 3 semanas perdí 2kg 
              sin pasar hambre, simplemente siguiendo los menús que me genera la IA."
            </p>
            <p style="color:#888;font-size:13px;margin:0;font-weight:600;">— María G., usuaria de BuddyMarket</p>
          </td>
        </tr>
      </table>

      ${ctaButton("Continuar mi viaje nutricional 🚀", `${APP_URL}/app/dashboard`)}

      <p style="color:#888;font-size:13px;text-align:center;margin:16px 0 0;line-height:1.6;">
        ¿Tienes feedback sobre tu primera semana? Nos encantaría escucharte. 
        <a href="mailto:info@buddymarket.io" style="color:#F97316;text-decoration:none;">Escríbenos aquí</a>
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
      subject: `¡Bienvenido a BuddyMarket, ${firstName}! 🥗`,
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
      subject: `¡Una semana con BuddyMarket! Tu resumen 🏆`,
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
  ${emailHeader("🔐", "Tu código de acceso", "Usa este código para iniciar sesión en BuddyMarket")}
  <tr>
    <td style="padding:40px 40px 32px;">
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Hemos recibido una solicitud para iniciar sesión en tu cuenta de BuddyMarket. 
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
    subject: `${otpCode} es tu código de acceso a BuddyMarket`,
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
        Tu BuddyExpert <strong style="color:#F97316;">${params.expertName}</strong>${params.expertSpecialty ? ` (${params.expertSpecialty})` : ""} te ha asignado un nuevo plan nutricional personalizado. Ya puedes acceder a él desde tu panel de BuddyMarket.
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
      ${ctaButton("Ver mi plan en BuddyMarket →", `${params.appUrl}/app/my-plans`)}
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
  basic:   { name: "BuddyMarket Basic",   emoji: "🌱", color: "#22C55E" },
  premium: { name: "BuddyMarket Premium", emoji: "⭐", color: "#F97316" },
  pro_max: { name: "BuddyMarket Pro Max", emoji: "🚀", color: "#8B5CF6" },
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
    ${emailHeader("🎁", "¡Tu año PRO está activado!", "Bienvenido/a de vuelta a BuddyMarket", "linear-gradient(135deg, #F97316, #FB923C)")}
    <tr><td style="padding:40px 40px 0;">
      <p style="font-size:17px;color:#374151;line-height:1.7;margin:0 0 20px;">
        Hola <strong style="color:#1a1a1a;">${name}</strong>,
      </p>
      <p style="font-size:17px;color:#374151;line-height:1.7;margin:0 0 20px;">
        Eres uno de los usuarios originales de BuddyMarket y eso tiene un valor enorme para nosotros.
        <strong style="color:#1a1a1a;">Confiaste en nosotros desde el principio, y hoy te devolvemos ese favor.</strong>
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fff8f0,#fef3e8);border-radius:16px;border:2px solid #fde8d0;margin:24px 0;">
        <tr><td style="padding:24px;text-align:center;">
          <p style="font-size:40px;margin:0 0 8px;">🎁</p>
          <p style="font-size:20px;font-weight:900;color:#1a1a1a;margin:0 0 6px;letter-spacing:-0.02em;">1 año de BuddyMarket PRO activado</p>
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
        <strong style="color:#1a1a1a;">El equipo de BuddyMarket</strong>
      </p>
    </td></tr>
  `);
}

export async function sendFounderWelcomeEmail(params: { userName: string; userEmail: string }): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: "🎁 ¡Tu año PRO está activado! Bienvenido/a de vuelta a BuddyMarket",
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
      <h1 style="font-size:26px;font-weight:900;color:#1a1a1a;margin:0 0 12px;">Tu empresa te regala BuddyMarket Pro</h1>
      <p style="font-size:16px;color:#6b7280;margin:0 0 32px;line-height:1.6;">Hola <strong style="color:#1a1a1a;">${recipientName}</strong>, <strong style="color:#F97316;">${companyName}</strong> ha activado BuddyMarket para sus empleados.</p>
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
      <p style="font-size:16px;color:#6b7280;margin:0 0 32px;line-height:1.6;">Hola <strong style="color:#1a1a1a;">${recipientName}</strong>, desde <strong style="color:#F97316;">${companyName}</strong> queremos recordarte que tienes BuddyMarket disponible.</p>
    </td></tr>
    <tr><td style="padding:0 40px 40px;">
      ${customMessage ? `<p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;padding:20px;background:#f0fdf4;border-radius:12px;border-left:4px solid #10b981;">${customMessage}</p>` : ""}
      <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 32px;">Genera tu menu semanal en segundos y lleva un seguimiento de tu nutricion. Todo desde el movil, en menos de 2 minutos al dia.</p>
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr><td style="background:linear-gradient(135deg,#F97316,#ea580c);border-radius:14px;padding:16px 40px;text-align:center;">
          <a href="${APP_URL}/app/dashboard" style="color:#ffffff;font-size:16px;font-weight:900;text-decoration:none;">Abrir BuddyMarket</a>
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
  const subject = "Resumen de facturacion BuddyMarket - " + billingDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const html = emailWrapper(emailHeader("Resumen de facturacion", companyName + " - " + billingDateStr, "linear-gradient(135deg,#1e40af 0%,#1d4ed8 100%)") + "<tr><td style='padding:40px;'><p style='color:#374151;font-size:15px;'>Hola, equipo de " + companyName + ". El cargo de " + totalAmount.toFixed(2) + " EUR (" + activeLicenses + " licencias x " + pricePerLicense.toFixed(2) + " EUR/mes) se realizara el " + billingDateStr + ".</p>" + ctaButton("Ver panel de empresa", `${APP_URL}/empresa/dashboard`) + "</td></tr>");
  try {
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) { console.error("[Email] Billing preview failed:", error); return { success: false, error: error.message }; }
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unknown error" };
  }
}
