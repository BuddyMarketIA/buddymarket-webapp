import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "BuddyMarket <hola@buddymarketapp.com>";

// ─── Welcome Email Template ───────────────────────────────────────────────────

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

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a BuddyMarket</title>
</head>
<body style="margin:0;padding:0;background-color:#FFF8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#F97316 0%,#EA580C 100%);padding:48px 40px 40px;text-align:center;">
              <!-- Logo -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 20px;">
                    <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">🥗 BUDDY<span style="color:#FED7AA;">MARKET</span></span>
                  </td>
                </tr>
              </table>
              <!-- Hero text -->
              <h1 style="color:#ffffff;font-size:32px;font-weight:800;margin:0 0 8px;line-height:1.2;">
                ¡Bienvenido, ${firstName}! 🎉
              </h1>
              <p style="color:rgba(255,255,255,0.85);font-size:16px;margin:0;line-height:1.5;">
                Tu viaje hacia una nutrición inteligente empieza aquí
              </p>
            </td>
          </tr>

          <!-- Hero image strip -->
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="background:#FED7AA;height:6px;"></td>
                  <td width="34%" style="background:#F97316;height:6px;"></td>
                  <td width="33%" style="background:#EA580C;height:6px;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              
              <p style="color:#1a1a1a;font-size:17px;font-weight:600;margin:0 0 8px;">
                Tu cuenta está activa ✅
              </p>
              ${roleMessage}

              <!-- Features grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
                    <div style="font-size:28px;margin-bottom:8px;">🍽️</div>
                    <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Recetas personalizadas</div>
                    <div style="color:#777;font-size:13px;line-height:1.5;">Miles de recetas adaptadas a tus objetivos y preferencias</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
                    <div style="font-size:28px;margin-bottom:8px;">📅</div>
                    <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Menús semanales</div>
                    <div style="color:#777;font-size:13px;line-height:1.5;">Planifica toda la semana con un solo clic, con IA</div>
                  </td>
                </tr>
                <tr><td colspan="3" style="height:12px;"></td></tr>
                <tr>
                  <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
                    <div style="font-size:28px;margin-bottom:8px;">🛒</div>
                    <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Lista de la compra</div>
                    <div style="color:#777;font-size:13px;line-height:1.5;">Generada automáticamente desde tu menú semanal</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#FFF7ED;border-radius:12px;padding:20px;vertical-align:top;">
                    <div style="font-size:28px;margin-bottom:8px;">📊</div>
                    <div style="color:#1a1a1a;font-size:14px;font-weight:700;margin-bottom:4px;">Diario nutricional</div>
                    <div style="color:#777;font-size:13px;line-height:1.5;">Registra lo que comes y sigue tus macros en tiempo real</div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 24px;">
                <tr>
                  <td align="center">
                    <a href="https://buddymarketapp.com/app/dashboard" 
                       style="display:inline-block;background:linear-gradient(135deg,#F97316,#EA580C);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;letter-spacing:0.3px;">
                      Empezar a explorar →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tips section -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border-radius:12px;padding:20px;margin-bottom:8px;">
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
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #f0e8e0;margin:0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <p style="color:#999;font-size:13px;margin:0 0 8px;line-height:1.6;">
                Has recibido este correo porque te registraste en BuddyMarket.<br>
                Si tienes alguna pregunta, responde a este email y te ayudaremos.
              </p>
              <p style="margin:0;">
                <a href="https://buddymarketapp.com" style="color:#F97316;text-decoration:none;font-size:13px;font-weight:600;">buddymarketapp.com</a>
                <span style="color:#ccc;margin:0 8px;">·</span>
                <a href="https://buddymarketapp.com/privacidad" style="color:#999;text-decoration:none;font-size:13px;">Privacidad</a>
                <span style="color:#ccc;margin:0 8px;">·</span>
                <a href="https://buddymarketapp.com/baja" style="color:#999;text-decoration:none;font-size:13px;">Darse de baja</a>
              </p>
              <p style="color:#bbb;font-size:12px;margin:12px 0 0;">
                © 2026 BuddyMarket · Hecho con 🧡 en España
              </p>
            </td>
          </tr>

        </table>
        <!-- End Email Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
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
