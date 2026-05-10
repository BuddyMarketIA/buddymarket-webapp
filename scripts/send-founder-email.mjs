/**
 * Script: send-founder-email.mjs
 * 
 * Envía el email de lanzamiento a todos los fundadores de BuddyMarket.
 * 
 * Uso:
 *   node scripts/send-founder-email.mjs --preview    → solo guarda el HTML, no envía
 *   node scripts/send-founder-email.mjs --test=email@example.com  → envía solo a ese email
 *   node scripts/send-founder-email.mjs --send       → envía a TODOS los fundadores
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
const { Resend } = require('resend');
const { writeFileSync } = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'BuddyMarket <onboarding@resend.dev>';
const APP_URL = 'https://appbuddymarket.com';
const FOUNDER_CODE = 'BUDDY-FOUNDERS24';
const DEADLINE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const DEADLINE_STR = DEADLINE.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

const args = process.argv.slice(2);
const IS_PREVIEW = args.includes('--preview');
const IS_SEND = args.includes('--send');
const TEST_EMAIL = args.find(a => a.startsWith('--test='))?.split('=')[1];

function extractNameFromEmail(email) {
  const local = email.split('@')[0];
  const clean = local.replace(/\d+$/, '').replace(/[._-]/g, ' ');
  const firstName = clean.split(' ')[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

function buildEmailHtml(name) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu acceso fundador a BuddyMarket</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0A;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HERO: fondo negro con gradiente naranja -->
          <tr>
            <td style="background:linear-gradient(160deg,#1A0800 0%,#2D1200 40%,#0A0A0A 100%);border-radius:20px 20px 0 0;padding:0;overflow:hidden;position:relative;">
              
              <!-- Glow top -->
              <div style="background:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(249,115,22,0.35) 0%,transparent 70%);height:200px;width:100%;position:absolute;top:0;left:0;"></div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <!-- Top bar -->
                <tr>
                  <td style="padding:28px 40px 0;text-align:center;">
                    <span style="display:inline-block;background:rgba(249,115,22,0.15);border:1px solid rgba(249,115,22,0.4);color:#FB923C;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;padding:7px 18px;border-radius:100px;">
                      ⭐&nbsp;&nbsp;Acceso Fundador Exclusivo
                    </span>
                  </td>
                </tr>

                <!-- Logo -->
                <tr>
                  <td style="padding:28px 40px 0;text-align:center;">
                    <div style="font-size:42px;font-weight:900;color:#ffffff;letter-spacing:-2px;line-height:1;">
                      🥦 BuddyMarket
                    </div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.45);font-weight:500;letter-spacing:3px;text-transform:uppercase;margin-top:6px;">
                      Tu asistente nutricional inteligente
                    </div>
                  </td>
                </tr>

                <!-- Headline -->
                <tr>
                  <td style="padding:36px 40px 0;text-align:center;">
                    <div style="font-size:38px;font-weight:900;color:#ffffff;line-height:1.15;letter-spacing:-1.5px;">
                      Hola, ${name}.<br>
                      <span style="background:linear-gradient(90deg,#F97316,#FBBF24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                        Esto es para ti.
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Subheadline -->
                <tr>
                  <td style="padding:20px 48px 40px;text-align:center;">
                    <p style="font-size:17px;color:rgba(255,255,255,0.65);line-height:1.7;margin:0;">
                      Fuiste de los primeros en creer en BuddyMarket.<br>
                      Hoy te devolvemos el favor.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GIFT CARD -->
          <tr>
            <td style="background:#111111;padding:0 32px;">
              <div style="background:linear-gradient(135deg,#1C0900 0%,#2A1000 50%,#1C0900 100%);border:1px solid rgba(249,115,22,0.3);border-radius:16px;padding:32px;margin-top:-1px;position:relative;overflow:hidden;">
                
                <!-- Shine effect -->
                <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:radial-gradient(circle,rgba(249,115,22,0.2) 0%,transparent 70%);border-radius:50%;"></div>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;width:60px;">
                      <div style="font-size:44px;line-height:1;">🎁</div>
                    </td>
                    <td style="vertical-align:top;padding-left:16px;">
                      <div style="font-size:13px;color:#FB923C;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Tu regalo de bienvenida</div>
                      <div style="font-size:26px;font-weight:900;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;">
                        1 año de Pro Max<br>
                        <span style="color:#F97316;">completamente gratis</span>
                      </div>
                      <div style="font-size:14px;color:rgba(255,255,255,0.55);margin-top:10px;line-height:1.6;">
                        Regístrate con este email y el acceso se activa <strong style="color:rgba(255,255,255,0.8);">automáticamente</strong>. Sin tarjeta. Sin trampas.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="background:#111111;padding:28px 32px 8px;text-align:center;">
              <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#F97316 0%,#EA580C 100%);color:#ffffff;font-size:18px;font-weight:800;text-decoration:none;padding:18px 56px;border-radius:14px;letter-spacing:-0.3px;box-shadow:0 8px 32px rgba(249,115,22,0.5),0 2px 8px rgba(0,0,0,0.4);">
                Descárgate BuddyMarket gratis →
              </a>
              <div style="font-size:12px;color:rgba(255,255,255,0.25);margin-top:10px;">
                ${APP_URL}
              </div>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="background:#111111;padding:28px 32px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(249,115,22,0.3),transparent);"></div>
            </td>
          </tr>

          <!-- REFERRAL CODE -->
          <tr>
            <td style="background:#111111;padding:28px 32px 0;">
              <div style="font-size:11px;color:#FB923C;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:12px;">
                🤝 &nbsp;Tu código de fundador
              </div>
              <p style="font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0 0 20px;">
                Comparte este código con quien quieras. Cualquier persona que lo use al registrarse 
                en los próximos 7 días recibe <strong style="color:#FB923C;">3 meses de Pro Max gratis</strong>. 
                Sin límite de usos.
              </p>

              <!-- Code display -->
              <div style="background:#000000;border:1px solid rgba(249,115,22,0.25);border-radius:12px;padding:20px 24px;text-align:center;position:relative;overflow:hidden;">
                <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(249,115,22,0.6),transparent);"></div>
                <div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Código exclusivo</div>
                <div style="font-size:32px;font-weight:900;color:#F97316;letter-spacing:5px;font-family:'Courier New',Courier,monospace;">
                  ${FOUNDER_CODE}
                </div>
              </div>

              <!-- Urgency badge -->
              <div style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:8px;padding:12px 16px;text-align:center;margin-top:12px;">
                <span style="font-size:13px;color:#F87171;font-weight:700;">
                  ⏰ &nbsp;Oferta válida hasta el ${DEADLINE_STR}
                </span>
              </div>
            </td>
          </tr>

          <!-- FEATURES GRID -->
          <tr>
            <td style="background:#111111;padding:28px 32px 0;">
              <div style="font-size:11px;color:rgba(255,255,255,0.3);font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:16px;">
                ✦ &nbsp;Todo lo que incluye Pro Max
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 8px 6px 0;width:50%;">
                    <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:10px;padding:12px 14px;">
                      <span style="font-size:18px;">🍽️</span>
                      <div style="font-size:13px;font-weight:600;color:#ffffff;margin-top:4px;">Menús IA ilimitados</div>
                    </div>
                  </td>
                  <td style="padding:6px 0 6px 8px;width:50%;">
                    <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:10px;padding:12px 14px;">
                      <span style="font-size:18px;">📊</span>
                      <div style="font-size:13px;font-weight:600;color:#ffffff;margin-top:4px;">Análisis nutricional</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;width:50%;">
                    <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:10px;padding:12px 14px;">
                      <span style="font-size:18px;">📷</span>
                      <div style="font-size:13px;font-weight:600;color:#ffffff;margin-top:4px;">Escáner ilimitado</div>
                    </div>
                  </td>
                  <td style="padding:6px 0 6px 8px;width:50%;">
                    <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:10px;padding:12px 14px;">
                      <span style="font-size:18px;">👩‍⚕️</span>
                      <div style="font-size:13px;font-weight:600;color:#ffffff;margin-top:4px;">Acceso BuddyExperts</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 8px 6px 0;width:50%;">
                    <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:10px;padding:12px 14px;">
                      <span style="font-size:18px;">👨‍👩‍👧</span>
                      <div style="font-size:13px;font-weight:600;color:#ffffff;margin-top:4px;">Modo Familia</div>
                    </div>
                  </td>
                  <td style="padding:6px 0 6px 8px;width:50%;">
                    <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:10px;padding:12px 14px;">
                      <span style="font-size:18px;">🏆</span>
                      <div style="font-size:13px;font-weight:600;color:#ffffff;margin-top:4px;">Retos de 30 días</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SIGNATURE -->
          <tr>
            <td style="background:#111111;padding:32px 32px 0;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);margin-bottom:28px;"></div>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 6px;">
                Gracias por haber estado desde el principio. Esto es solo el comienzo.
              </p>
              <p style="font-size:15px;color:rgba(255,255,255,0.55);margin:0 0 12px;">Un abrazo,</p>
              <div style="font-size:17px;font-weight:800;color:#ffffff;margin-bottom:2px;">Luis Maria Cabello de los Cobos</div>
              <div style="font-size:13px;color:#F97316;font-weight:600;">CEO & Co-founder, BuddyMarket</div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0A0A0A;border-radius:0 0 20px 20px;padding:24px 32px;margin-top:28px;border-top:1px solid #1A1A1A;">
              <div style="height:28px;"></div>
              <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0 0 6px;line-height:1.7;text-align:center;">
                Recibiste este email porque estás en nuestra lista de fundadores.<br>
                Si no quieres recibir más emails, 
                <a href="${APP_URL}/unsubscribe" style="color:rgba(249,115,22,0.5);text-decoration:none;">cancela aquí</a>.
              </p>
              <p style="font-size:11px;color:rgba(255,255,255,0.12);margin:0;text-align:center;">
                © 2025 BuddyMarket &nbsp;·&nbsp; 
                <a href="${APP_URL}/privacy" style="color:rgba(255,255,255,0.15);text-decoration:none;">Privacidad</a> &nbsp;·&nbsp; 
                <a href="${APP_URL}/terms" style="color:rgba(255,255,255,0.15);text-decoration:none;">Términos</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

async function sendToFounder(email, name, dryRun = false) {
  const html = buildEmailHtml(name);
  
  if (dryRun) {
    console.log(`  [DRY RUN] Sería enviado a: ${name} <${email}>`);
    return { success: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${name}, tu año de BuddyMarket Pro Max está esperándote 🎁`,
      html,
    });

    if (error) throw new Error(JSON.stringify(error));
    return { success: true, id: data?.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function main() {
  console.log(`\n📧 BuddyMarket — Email de Fundadores`);
  console.log(`📅 Fecha límite del código: ${DEADLINE_STR}`);
  console.log(`🔑 Código: ${FOUNDER_CODE}\n`);

  if (IS_PREVIEW) {
    const html = buildEmailHtml('Pablo');
    writeFileSync('/tmp/founder-email-preview.html', html);
    console.log('✅ Preview guardado en: /tmp/founder-email-preview.html');
    process.exit(0);
  }

  if (TEST_EMAIL) {
    console.log(`🧪 Modo test: enviando a ${TEST_EMAIL}...`);
    const name = extractNameFromEmail(TEST_EMAIL);
    const html = buildEmailHtml(name);
    try {
      const { Resend: R } = await import('resend');
      const r = new R(process.env.RESEND_API_KEY);
      const { data, error } = await r.emails.send({
        from: FROM_EMAIL,
        to: TEST_EMAIL,
        subject: `${name}, tu año de BuddyMarket Pro Max está esperándote 🎁`,
        html,
      });
      if (error) throw new Error(JSON.stringify(error));
      console.log(`✅ Enviado (ID: ${data?.id})`);
    } catch(e) {
      console.log(`❌ Error: ${e.message}`);
    }
    await pool.end();
    return;
  }

  if (!IS_SEND) {
    console.log('⚠️  Para enviar a todos los fundadores, ejecuta con --send');
    console.log('   Para preview HTML: --preview');
    console.log('   Para test: --test=tu@email.com');
    process.exit(0);
  }

  const { rows: founders } = await pool.query(
    `SELECT id, email FROM founder_emails WHERE "claimedAt" IS NULL ORDER BY id`
  );

  console.log(`📊 Fundadores a contactar: ${founders.length}`);
  console.log(`📤 Enviando desde: ${FROM_EMAIL}\n`);

  let success = 0;
  let failed = 0;
  const failedEmails = [];

  for (const founder of founders) {
    const name = extractNameFromEmail(founder.email);
    process.stdout.write(`  [${String(founder.id).padStart(3)}] ${name.padEnd(15)} <${founder.email.padEnd(40)}> → `);
    
    const result = await sendToFounder(founder.email, name);
    
    if (result.success) {
      console.log(`✅ Enviado`);
      success++;
      await pool.query(
        `UPDATE founder_emails SET notes = $1 WHERE id = $2`,
        [`email_sent_${new Date().toISOString()}`, founder.id]
      );
    } else {
      console.log(`❌ ${result.error?.substring(0, 50)}`);
      failed++;
      failedEmails.push(founder.email);
    }

    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏁 COMPLETADO`);
  console.log(`   ✅ Enviados: ${success}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  if (failedEmails.length > 0) {
    console.log(`   Fallidos: ${failedEmails.join(', ')}`);
  }
  console.log(`${'='.repeat(60)}\n`);

  await pool.end();
}

main().catch(e => {
  console.error('Error fatal:', e.message);
  process.exit(1);
});
