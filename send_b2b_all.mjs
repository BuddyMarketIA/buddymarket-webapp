import { readFileSync } from 'fs';
import { Resend } from 'resend';

const resend = new Resend('re_ATJjodqQ_7tG1eNmBVpbuWR2Hi7UfHQU1');
const LOGO_B64 = readFileSync('/home/ubuntu/webdev-static-assets/buddyone-logo-b64.txt', 'utf8').trim();

// ─── Lista completa de destinatarios B2B ─────────────────────────────────────
const destinatarios = [
  // ── LISTA ORIGINAL (17 empresas) ──────────────────────────────────────────
  { nombre: 'Javier', empresa: 'Banco Santander', cargo: 'Director de Bienestar', email: 'javier.rogla@gruposantander.com', email_respaldo: 'protecciondedatos.empleados@gruposantander.com', programa: 'BeHealthy', pilar: 'el pilar de nutrición de BeHealthy', empleados: '+20.000', confianza: 'medio' },
  { nombre: 'Araceli', empresa: 'BBVA', cargo: 'Responsable de Bienestar', email: 'araceli.morato@bbva.com', email_respaldo: 'rrhh@bbva.com', programa: 'BBVA Salud', pilar: 'el área de salud y bienestar', empleados: '+30.000', confianza: 'medio' },
  { nombre: 'Raquel', empresa: 'Telefónica España', cargo: 'Directora de Personas', email: 'raquel.fernandezleon@telefonica.com', email_respaldo: 'personas@telefonica.com', programa: 'Healthy Telefónica', pilar: 'el programa de bienestar Healthy', empleados: '+20.000', confianza: 'medio' },
  { nombre: 'Equipo de Personas', empresa: 'Inditex', cargo: 'Responsable de Bienestar', email: 'inditexinfo@inditex.com', email_respaldo: 'inditexinfo@inditex.com', programa: 'Programa de bienestar', pilar: 'el área de bienestar de empleados', empleados: '+80.000', confianza: 'medio' },
  { nombre: 'Equipo de RRHH', empresa: 'Mapfre', cargo: 'Responsable de Bienestar', email: 'mapfre@mapfre.es', email_respaldo: 'mapfre@mapfre.es', programa: 'Mapfre Saludable', pilar: 'el programa Mapfre Saludable', empleados: '+30.000', confianza: 'medio' },
  { nombre: 'Carmen', empresa: 'Repsol', cargo: 'Directora General de Personas', email: 'carmen.munozperez@repsol.com', email_respaldo: 'atracciondetalento@repsol.com', programa: 'Programa de bienestar integral', pilar: 'el programa de bienestar integral', empleados: '+24.000', confianza: 'medio' },
  { nombre: 'Equipo de Comunicación', empresa: 'Iberdrola', cargo: 'Responsable de Bienestar', email: 'comunicacioncorporativa@iberdrola.es', email_respaldo: 'comunicacioncorporativa@iberdrola.es', programa: 'Iberdrola Saludable', pilar: 'el programa Iberdrola Saludable', empleados: '+12.000', confianza: 'medio' },
  { nombre: 'Carlos', empresa: 'Acciona', cargo: 'Director de Personas', email: 'carlos.anta.callersten@acciona.com', email_respaldo: 'personas@acciona.com', programa: 'Acciona Bienestar', pilar: 'el programa de bienestar', empleados: '+10.000', confianza: 'alto' },
  { nombre: 'Equipo de Personas', empresa: 'Naturgy', cargo: 'Responsable de Bienestar', email: 'naturgyclientes@naturgy.com', email_respaldo: 'naturgyclientes@naturgy.com', programa: 'Naturgy Saludable', pilar: 'el área de bienestar', empleados: '+8.000', confianza: 'bajo' },
  { nombre: 'Rodrigo', empresa: 'AXA Seguros', cargo: 'Director de RRHH', email: 'rodrigo.fuentes@axa.es', email_respaldo: 'contacto.oficial@axa.es', programa: 'Healthy Days AXA', pilar: 'el programa Healthy Days', empleados: '+4.000', confianza: 'medio' },
  { nombre: 'Equipo de Personas', empresa: 'Mutua Madrileña', cargo: 'Directora de Personas', email: 'atencioncliente@mutua.es', email_respaldo: 'atencioncliente@mutua.es', programa: 'Cuídate+', pilar: 'el programa Cuídate+', empleados: '+16.000', confianza: 'bajo' },
  { nombre: 'Amparo', empresa: 'Accenture España', cargo: 'Directora de Personas', email: 'amparo.gonzalez@accenture.com', email_respaldo: 'spain.rrhh@accenture.com', programa: 'Programa de bienestar', pilar: 'el área de bienestar', empleados: '+15.000', confianza: 'alto' },
  { nombre: 'Equipo de Partnerships', empresa: 'Wellhub (ex-Gympass)', cargo: 'Partnerships & Integrations', email: 'integrations@gympass.com', email_respaldo: 'partnerships@wellhub.com', programa: 'Plataforma de bienestar', pilar: 'el catálogo de bienestar', empleados: '+500.000 vía plataforma', confianza: 'alto' },
  { nombre: 'Laure', empresa: 'Cobee / Pluxee', cargo: 'Directora de Partnerships', email: 'laure.pourageaud@pluxeegroup.com', email_respaldo: 'info@cobee.io', programa: 'Plataforma de beneficios', pilar: 'el catálogo de beneficios', empleados: '+10.000 empresas cliente', confianza: 'medio' },
  { nombre: 'Juan', empresa: 'Edenred España', cargo: 'Director Comercial', email: 'juan.hernandez@edenred.es', email_respaldo: 'info.es@edenred.com', programa: 'Plataforma multibeneficios', pilar: 'los beneficios de bienestar', empleados: '+10.000 empresas cliente', confianza: 'alto' },
  { nombre: 'Gema', empresa: 'Willis Towers Watson', cargo: 'Senior Director Health & Benefits', email: 'gema.jimenez@willistowerswatson.com', email_respaldo: 'es.info@wtwco.com', programa: 'Catálogo de beneficios', pilar: 'vuestro catálogo de salud y bienestar', empleados: 'grandes corporaciones', confianza: 'alto' },

  // ── NUEVAS EMPRESAS ────────────────────────────────────────────────────────
  // Salud / Farmacia
  { nombre: 'Equipo de Personas', empresa: 'Sanitas', cargo: 'Directora de Personas', email: 'atencioncliente@sanitas.es', email_respaldo: 'atencioncliente@sanitas.es', programa: 'Sanitas Wellness Corporate', pilar: 'el programa Sanitas Wellness', empleados: '+12.000', confianza: 'bajo' },
  { nombre: 'Alfonso', empresa: 'El Corte Inglés', cargo: 'Director de Personas y Talento', email: 'alfonso_gordon@elcorteingles.es', email_respaldo: 'clientes@elcorteingles.es', programa: 'Programa de bienestar', pilar: 'el área de bienestar de empleados', empleados: '+80.000', confianza: 'medio' },
  // Tecnología / Consultoría
  { nombre: 'Equipo de RRHH', empresa: 'Indra', cargo: 'CHRO', email: 'dpo@indra.es', email_respaldo: 'dpo@indra.es', programa: 'Programa de Bienestar de Indra', pilar: 'el programa de bienestar', empleados: '+28.000', confianza: 'medio' },
  { nombre: 'Equipo de Personas', empresa: 'CaixaBank', cargo: 'Responsable de Bienestar', email: 'servicio.cliente@caixabank.com', email_respaldo: 'servicio.cliente@caixabank.com', programa: 'Somos Saludables', pilar: 'el programa Somos Saludables', empleados: '+46.000', confianza: 'bajo' },
  // Energía
  { nombre: 'Paolo', empresa: 'Endesa', cargo: 'Director General de Personas', email: 'paolo.bondi@endesa.es', email_respaldo: 'sostenibilidad@endesa.es', programa: 'Programa de bienestar Endesa', pilar: 'el programa de bienestar', empleados: '+8.900', confianza: 'medio' },
  // Plataformas RRHH
  { nombre: 'Paul', empresa: 'Benifex', cargo: 'Global Benefits Consulting Director', email: 'paul.andrews@benifex.com', email_respaldo: 'hello@benifex.com', programa: 'Plataforma de beneficios', pilar: 'el catálogo de beneficios y recompensas', empleados: 'miles de empresas cliente', confianza: 'medio' },
  // Turismo / Aerolíneas
  { nombre: 'José Luis', empresa: 'Iberia', cargo: 'Director de RRHH', email: 'j.deluna@iberia.es', email_respaldo: 'info@iberia.es', programa: 'Programa de bienestar', pilar: 'el área de bienestar de empleados', empleados: '+11.000', confianza: 'medio' },
];

// ─── Template HTML del email B2B ─────────────────────────────────────────────
function generarEmailB2B(dest) {
  const saludo = (dest.nombre && !dest.nombre.startsWith('Equipo')) ? dest.nombre : dest.cargo;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#f97316 0%,#ef4444 50%,#dc2626 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="text-align:left;">
        <img src="data:image/png;base64,${LOGO_B64}" width="44" height="44" alt="BuddyOne" style="border-radius:10px;vertical-align:middle;" />
        <span style="font-size:22px;font-weight:800;color:#ffffff;margin-left:10px;vertical-align:middle;letter-spacing:-0.5px;">BuddyOne</span>
      </td>
      <td style="text-align:right;">
        <span style="background:rgba(255,255,255,0.2);color:#ffffff;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">FOR BUSINESS</span>
      </td>
    </tr></table>
    <div style="margin-top:24px;">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Bienestar nutricional para los empleados de ${dest.empresa}</h1>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">Como Gympass, pero para nutrición. Desde 1,90€/empleado/mes.</p>
    </div>
  </td></tr>

  <!-- INTRO -->
  <tr><td style="background:#ffffff;padding:32px 40px;">
    <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">Hola <strong>${saludo}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#6b7280;line-height:1.7;">Me llamo Luis y soy el fundador de <strong>BuddyOne</strong>, la app de nutrición con IA más completa del mercado hispanohablante.</p>
    <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.7;">Os escribo porque creo que BuddyOne puede ser el complemento perfecto para <strong>${dest.programa}</strong> en ${dest.empresa}: una herramienta que cada empleado usa a diario para comer mejor, sin que RRHH tenga que gestionar nada.</p>
  </td></tr>

  <!-- QUÉ ES BUDDYONE -->
  <tr><td style="background:#fafafa;padding:28px 40px;">
    <h2 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;">¿Qué recibe cada empleado?</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="background:#fff7ed;border-radius:12px;padding:18px;vertical-align:top;">
          <div style="font-size:24px;margin-bottom:8px;">🤖</div>
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#ea580c;">Menús IA personalizados</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Menú semanal adaptado a sus objetivos, alergias y preferencias. Listo en 2 minutos.</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:18px;vertical-align:top;">
          <div style="font-size:24px;margin-bottom:8px;">📊</div>
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#16a34a;">Seguimiento nutricional</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Control de calorías, macros y micronutrientes con diario de comidas inteligente.</p>
        </td>
      </tr>
      <tr><td colspan="3" style="padding-top:12px;"></td></tr>
      <tr>
        <td width="48%" style="background:#eff6ff;border-radius:12px;padding:18px;vertical-align:top;">
          <div style="font-size:24px;margin-bottom:8px;">👨‍⚕️</div>
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#2563eb;">BuddyExperts</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Acceso a nutricionistas certificados para consultas y planes personalizados.</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#fdf4ff;border-radius:12px;padding:18px;vertical-align:top;">
          <div style="font-size:24px;margin-bottom:8px;">⌚</div>
          <h3 style="margin:0 0 6px;font-size:14px;font-weight:700;color:#9333ea;">Wearables</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">Integración con Oura Ring, Whoop, Apple Watch, Garmin, Fitbit y Google Fit.</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- PROPUESTA -->
  <tr><td style="background:#0f172a;padding:28px 40px;">
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">Lo que os proponemos</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;">Una propuesta sin riesgo, con valor inmediato</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="32" style="vertical-align:top;padding-top:2px;">
              <div style="width:24px;height:24px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:white;">1</div>
            </td>
            <td style="padding-left:12px;">
              <div style="font-size:15px;font-weight:600;color:#f1f5f9;">Piloto gratuito de 15 días</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">Acceso completo para hasta 100 empleados sin coste ni compromiso. En 30 segundos cada empleado activa Pro Max con un código de empresa.</div>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="32" style="vertical-align:top;padding-top:2px;">
              <div style="width:24px;height:24px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:white;">2</div>
            </td>
            <td style="padding-left:12px;">
              <div style="font-size:15px;font-weight:600;color:#f1f5f9;">Activación instantánea</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">Recibes un código único de empresa. Lo envías por email o Slack y cada empleado activa Pro Max en 30 segundos. Sin integraciones técnicas.</div>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="32" style="vertical-align:top;padding-top:2px;">
              <div style="width:24px;height:24px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:white;">3</div>
            </td>
            <td style="padding-left:12px;">
              <div style="font-size:15px;font-weight:600;color:#f1f5f9;">Privacidad total garantizada</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">RRHH nunca ve datos personales ni de salud de los empleados. Solo métricas agregadas: tasa de activación y licencias activas. Cumplimiento RGPD total.</div>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td width="32" style="vertical-align:top;padding-top:2px;">
              <div style="width:24px;height:24px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:white;">4</div>
            </td>
            <td style="padding-left:12px;">
              <div style="font-size:15px;font-weight:600;color:#f1f5f9;">Desde 1,90€/empleado/mes</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">Sin permanencia. Facturación por licencias activas. Para ${dest.empleados} empleados, el coste es <strong style="color:#fde68a;">menos que un café al día por persona</strong>. 2 meses gratis en anual.</div>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- POR QUÉ LO USAN -->
  <tr><td style="background:#ffffff;padding:28px 40px;">
    <h2 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;">¿Por qué los empleados lo usan de verdad?</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:18px;">🎯</span>
          <span style="font-size:14px;color:#374151;margin-left:10px;"><strong>Personalización real</strong> — cada empleado recibe un plan adaptado a sus objetivos, no un menú genérico</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:18px;">🔥</span>
          <span style="font-size:14px;color:#374151;margin-left:10px;"><strong>Hábito, no dieta</strong> — sistema de rachas, logros y recordatorios que mantiene la constancia</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
          <span style="font-size:18px;">👨‍⚕️</span>
          <span style="font-size:14px;color:#374151;margin-left:10px;"><strong>Respaldo profesional</strong> — red de nutricionistas certificados disponibles desde la app</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;">
          <span style="font-size:18px;">📱</span>
          <span style="font-size:14px;color:#374151;margin-left:10px;"><strong>Cero fricción</strong> — disponible en iOS y Android, activación en 30 segundos con código de empresa</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#ffffff;padding:36px 40px;text-align:center;border-top:1px solid #f3f4f6;">
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">¿Lo vemos juntos?</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">Sin compromiso. Responde a este email y coordinamos una llamada de 20 minutos para enseñarte la plataforma en directo y ver cómo encajaría en ${dest.pilar} de <strong>${dest.empresa}</strong>.</p>
    <a href="mailto:luis@buddyone.io?subject=Colaboraci%C3%B3n%20BuddyOne%20%E2%80%94%20${encodeURIComponent(dest.empresa)}&body=Hola%20Luis%2C%0A%0AHe%20visto%20vuestra%20propuesta%20y%20me%20gustar%C3%ADa%20conocer%20m%C3%A1s%20sobre%20BuddyOne%20para%20nuestra%20empresa.%0A%0A%C2%BFPodemos%20coordinar%20una%20llamada%3F%0A%0ASaludos" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;box-shadow:0 8px 24px rgba(249,115,22,0.35);">Escribir a luis@buddyone.io →</a>
    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">O visita <a href="https://buddyone.io/empresas" style="color:#f97316;text-decoration:none;">buddyone.io/empresas</a> para conocer más y ver precios</p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
    <img src="data:image/png;base64,${LOGO_B64}" width="36" height="36" alt="BuddyOne" style="border-radius:8px;margin-bottom:12px;" /><br>
    <span style="font-size:16px;font-weight:700;color:#ffffff;">BuddyOne</span><br>
    <span style="font-size:12px;color:#64748b;margin-top:4px;display:block;">La nutrición inteligente para tu empresa</span>
    <div style="margin-top:16px;">
      <a href="https://buddyone.io" style="color:#f97316;text-decoration:none;font-size:12px;margin:0 8px;">buddyone.io</a>
      <span style="color:#334155;">·</span>
      <a href="mailto:luis@buddyone.io" style="color:#64748b;text-decoration:none;font-size:12px;margin:0 8px;">luis@buddyone.io</a>
      <span style="color:#334155;">·</span>
      <a href="https://buddyone.io/privacidad" style="color:#64748b;text-decoration:none;font-size:12px;margin:0 8px;">Privacidad</a>
    </div>
    <p style="margin:16px 0 0;font-size:11px;color:#334155;">Has recibido este email porque tu empresa tiene un programa de bienestar activo.<br>Si no deseas recibir más comunicaciones, responde con "Baja" en el asunto.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Envío ────────────────────────────────────────────────────────────────────
async function enviarTodos() {
  console.log(`📧 Enviando ${destinatarios.length} emails B2B corporativos...\n`);
  let enviados = 0;
  let errores = 0;

  for (const dest of destinatarios) {
    try {
      const asunto = `BuddyOne for Business — Propuesta para los empleados de ${dest.empresa}`;
      const html = generarEmailB2B(dest);

      // Enviar al email principal
      await resend.emails.send({
        from: 'Luis de BuddyOne <luis@buddyone.io>',
        to: [dest.email],
        subject: asunto,
        html,
      });
      enviados++;
      console.log(`  ✅ ${enviados}. ${dest.empresa} → ${dest.email}`);

      // Si hay email de respaldo diferente, enviar también
      if (dest.email_respaldo && dest.email_respaldo !== dest.email && !dest.email_respaldo.startsWith('http')) {
        await new Promise(r => setTimeout(r, 500));
        await resend.emails.send({
          from: 'Luis de BuddyOne <luis@buddyone.io>',
          to: [dest.email_respaldo],
          subject: asunto,
          html,
        });
        console.log(`     📋 Respaldo → ${dest.email_respaldo}`);
      }

      // Pausa entre envíos para no saturar
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      errores++;
      console.error(`  ❌ Error con ${dest.empresa}: ${err.message}`);
    }
  }

  console.log(`\n✅ Completado: ${enviados}/${destinatarios.length} enviados, ${errores} errores`);
}

enviarTodos();
