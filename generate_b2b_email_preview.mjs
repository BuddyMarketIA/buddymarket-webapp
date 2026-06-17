import { readFileSync, writeFileSync } from 'fs';

const LOGO_B64 = readFileSync('/home/ubuntu/webdev-static-assets/buddyone-logo-email.b64', 'utf8').trim();
const LOGO_SRC = `data:image/png;base64,${LOGO_B64}`;

// Lista de destinatarios con personalización
const destinatarios = [
  { nombre: 'Javier', apellido: 'Roglá', empresa: 'Banco Santander', cargo: 'Chief People, Organization & Culture Officer', email: 'javier.rogla@gruposantander.com', programa: 'BeHealthy', pilar: 'el pilar "Aliméntate" de BeHealthy', empleados: '27.000', confianza: 'medio' },
  { nombre: 'Araceli', apellido: 'Morato', empresa: 'BBVA', cargo: 'Directora de Salud y Bienestar Laboral', email: 'araceli.morato@bbva.com', programa: 'programa de bienestar', pilar: 'vuestras iniciativas de nutrición', empleados: '29.000', confianza: 'medio' },
  { nombre: 'Raquel', apellido: 'Fernández León', empresa: 'Telefónica España', cargo: 'Directora de Personas', email: 'raquel.fernandezleon@telefonica.com', programa: 'Feel Good', pilar: 'el área de nutrición de Feel Good', empleados: '25.500', confianza: 'medio' },
  { nombre: 'Begoña', apellido: 'López-Cano', empresa: 'Inditex', cargo: 'Chief People Officer', email: 'inditexinfo@inditex.com', programa: 'InHealth', pilar: 'el portal InHealth', empleados: '46.000', confianza: 'medio' },
  { nombre: 'Elena', apellido: 'Sanz Isla', empresa: 'Mapfre', cargo: 'CEO de Mapfre Iberia', email: 'mapfre@mapfre.es', programa: 'programa de bienestar', pilar: 'los programas de nutrición de Savia', empleados: '11.000', confianza: 'medio' },
  { nombre: 'Carmen', apellido: 'Muñoz', empresa: 'Repsol', cargo: 'Directora General de Personas y Organización', email: 'rgpd.crc@repsol.com', programa: 'Energía para tu bienestar', pilar: 'el pilar de nutrición', empleados: '24.000', confianza: 'medio' },
  { nombre: 'Álvaro', apellido: 'Murga', empresa: 'Iberdrola', cargo: 'Director de People', email: 'comunicacioncorporativa@iberdrola.es', programa: 'Plataforma Bienestar', pilar: 'vuestra Plataforma Bienestar', empleados: '9.750', confianza: 'medio' },
  { nombre: 'Carlos', apellido: 'Anta', empresa: 'Acciona', cargo: 'Director de Organización, Talento y Salud', email: 'carlos.anta.callersten@acciona.com', programa: 'programa de bienestar', pilar: 'vuestro servicio de nutricionista', empleados: '68.500', confianza: 'alto' },
  { nombre: 'Carmen', apellido: 'Fernández', empresa: 'Naturgy', cargo: 'Directora de Talento y Cultura', email: 'naturgyclientes@naturgy.com', programa: 'Happiness Academy', pilar: 'el pilar de salud física de Happiness Academy', empleados: '6.600', confianza: 'bajo' },
  { nombre: 'Rodrigo', apellido: 'Fuentes', empresa: 'AXA Seguros', cargo: 'Director de Personas y Organización', email: 'rodrigo.fuentes@axa.es', programa: 'We Care / Healthy Days', pilar: 'los Healthy Days con nutricionistas', empleados: '2.400', confianza: 'medio' },
  { nombre: 'Carmen', apellido: 'Campos', empresa: 'Mutua Madrileña', cargo: 'Subdirectora General de Personas, Talento y Cultura', email: 'reclamaciones@mutua.es', programa: 'Cuídate+', pilar: 'el pilar de nutrición de Cuídate+', empleados: '16.700', confianza: 'medio' },
  { nombre: 'Juan Luis', apellido: 'Díez Calleja', empresa: 'Deloitte España', cargo: 'Socio Director de Recursos Humanos', email: 'https://www.deloitte.com/es/es/contact/contact-us.html', programa: 'Well-Being', pilar: 'el asesoramiento nutricional de Well-Being', empleados: '12.000', confianza: 'medio' },
  { nombre: 'Amparo', apellido: 'González', empresa: 'Accenture España', cargo: 'Directora de RRHH España, Portugal e Israel', email: 'amparo.gonzalez@accenture.com', programa: 'Well-being Hub', pilar: 'el módulo de bienestar físico', empleados: '9.000', confianza: 'alto' },
  { nombre: 'Responsable de Partnerships', apellido: '', empresa: 'Wellhub (ex-Gympass)', cargo: 'Partnerships & Integrations', email: 'integrations@gympass.com', programa: 'plataforma de bienestar', pilar: 'vuestra categoría de nutrición', empleados: 'miles de empresas cliente', confianza: 'alto' },
  { nombre: 'Laure', apellido: 'Pourageaud', empresa: 'Cobee / Pluxee', cargo: 'Directora Global de RRHH', email: 'laure.pourageaud@pluxeegroup.com', programa: 'plataforma multibeneficios', pilar: 'la categoría de Bienestar Físico', empleados: 'miles de empresas cliente', confianza: 'medio' },
  { nombre: 'Juan Ignacio', apellido: 'Hernández', empresa: 'Edenred España', cargo: 'Director Comercial', email: 'juan.hernandez@edenred.es', programa: 'plataforma multibeneficios', pilar: 'los beneficios de bienestar', empleados: '+10.000 empresas cliente', confianza: 'alto' },
  { nombre: 'Gema', apellido: 'Jiménez', empresa: 'Willis Towers Watson', cargo: 'Senior Director Business Development Health & Benefits', email: 'gema.jimenez@willistowerswatson.com', programa: 'catálogo de beneficios', pilar: 'vuestro catálogo de salud y bienestar', empleados: 'grandes corporaciones', confianza: 'alto' },
];

function generarEmailB2B(dest) {
  // Solo nombre de pila; si no hay nombre concreto, usar el cargo
  const saludo = (dest.nombre && dest.nombre !== 'Responsable de Partnerships') ? dest.nombre : dest.cargo;
  
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER HERO -->
  <tr><td style="background:linear-gradient(135deg,#f97316 0%,#ef4444 50%,#dc2626 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
    <img src="${LOGO_SRC}" width="72" height="72" alt="BuddyOne" style="border-radius:18px;margin-bottom:20px;display:block;margin-left:auto;margin-right:auto;">
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.8);">Propuesta de colaboración</p>
    <h1 style="margin:0 0 12px;font-size:32px;font-weight:800;color:#ffffff;line-height:1.2;">BuddyOne para<br><span style="color:#fde68a;">${dest.empresa}</span></h1>
    <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.5;">La plataforma de nutrición con IA que transforma<br>el bienestar de vuestros empleados</p>
    <!-- Barra decorativa -->
    <div style="margin-top:28px;display:flex;justify-content:center;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="width:60px;height:4px;background:#fde68a;border-radius:2px;"></td>
        <td style="width:8px;"></td>
        <td style="width:40px;height:4px;background:rgba(255,255,255,0.5);border-radius:2px;"></td>
        <td style="width:8px;"></td>
        <td style="width:20px;height:4px;background:rgba(255,255,255,0.3);border-radius:2px;"></td>
      </tr></table>
    </div>
  </td></tr>

  <!-- INTRO PERSONALIZADA -->
  <tr><td style="background:#ffffff;padding:36px 40px 28px;">
    <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">Hola <strong>${saludo}</strong>,</p>
    <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">Me llamo <strong>Luis</strong>, soy el fundador de <strong>BuddyOne</strong>, y me dirijo a ti porque conozco el compromiso de <strong>${dest.empresa}</strong> con el bienestar de sus empleados${dest.programa ? ` —especialmente a través de ${dest.pilar}—` : ''}.</p>
    <p style="margin:0;font-size:16px;color:#374151;line-height:1.7;">Quiero proponerte algo concreto: <strong>convertir BuddyOne en la herramienta oficial de nutrición de vuestro programa de bienestar</strong>, sin coste de implementación y con resultados medibles desde el primer mes.</p>
  </td></tr>

  <!-- SEPARADOR -->
  <tr><td style="background:#ffffff;padding:0 40px;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,#e5e7eb,transparent);"></div>
  </td></tr>

  <!-- QUÉ ES BUDDYONE -->
  <tr><td style="background:#ffffff;padding:28px 40px;">
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;">¿Qué es BuddyOne?</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.7;">BuddyOne es la <strong style="color:#f97316;">plataforma de nutrición inteligente</strong> que combina inteligencia artificial, nutricionistas certificados y seguimiento de hábitos en una sola app. No es otra app de dietas — es un sistema completo de cambio de hábitos con resultados clínicamente validados.</p>
    
    <!-- 4 funcionalidades en grid 2x2 -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="background:#fff7ed;border-radius:12px;padding:20px;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:10px;">🤖</div>
          <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#ea580c;">Menús con IA</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Planes nutricionales personalizados generados por IA en segundos, adaptados a los objetivos, alergias y preferencias de cada empleado.</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#f0fdf4;border-radius:12px;padding:20px;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:10px;">📊</div>
          <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#059669;">Seguimiento real</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Registro de comidas por voz, foto o búsqueda. Métricas de progreso, rachas y logros que mantienen la motivación semana a semana.</p>
        </td>
      </tr>
      <tr><td colspan="3" style="height:12px;"></td></tr>
      <tr>
        <td width="48%" style="background:#eff6ff;border-radius:12px;padding:20px;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:10px;">👨‍⚕️</div>
          <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#2563eb;">BuddyExperts</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Red de nutricionistas certificados disponibles para consultas, revisión de planes y seguimiento personalizado desde la app.</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#fdf4ff;border-radius:12px;padding:20px;vertical-align:top;">
          <div style="font-size:28px;margin-bottom:10px;">⌚</div>
          <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#9333ea;">Wearables</h3>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Integración con Oura Ring, Whoop, Apple Watch, Garmin, Fitbit y Google Fit para ajustar los planes nutricionales según el sueño, la recuperación y la actividad real de cada empleado.</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- SEPARADOR -->
  <tr><td style="background:#ffffff;padding:0 40px;">
    <div style="height:1px;background:linear-gradient(90deg,transparent,#e5e7eb,transparent);"></div>
  </td></tr>

  <!-- POR QUÉ FUNCIONA -->
  <tr><td style="background:#ffffff;padding:28px 40px;">
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">¿Por qué los empleados lo usan de verdad?</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">La mayoría de apps de bienestar corporativo se abandonan en las primeras semanas. BuddyOne está diseñado para lo contrario: crear hábitos sostenibles a través de la personalización y el acompañamiento continuo.</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:14px 16px;background:#fff7ed;border-radius:10px;border-left:3px solid #f97316;width:48%;vertical-align:top;">
          <div style="font-size:13px;font-weight:700;color:#ea580c;margin-bottom:4px;">🎯 Personalización real</div>
          <div style="font-size:12px;color:#6b7280;line-height:1.5;">Cada empleado recibe un plan adaptado a sus objetivos, alergias, horarios y preferencias. No hay dos planes iguales.</div>
        </td>
        <td style="width:4%;"></td>
        <td style="padding:14px 16px;background:#f0fdf4;border-radius:10px;border-left:3px solid #059669;width:48%;vertical-align:top;">
          <div style="font-size:13px;font-weight:700;color:#059669;margin-bottom:4px;">🔄 Hábito, no dieta</div>
          <div style="font-size:12px;color:#6b7280;line-height:1.5;">Sistema de rachas, logros y recordatorios inteligentes que mantienen la motivación sin ser intrusivos.</div>
        </td>
      </tr>
      <tr><td colspan="3" style="height:10px;"></td></tr>
      <tr>
        <td style="padding:14px 16px;background:#eff6ff;border-radius:10px;border-left:3px solid #2563eb;width:48%;vertical-align:top;">
          <div style="font-size:13px;font-weight:700;color:#2563eb;margin-bottom:4px;">👨‍⚕️ Respaldo profesional</div>
          <div style="font-size:12px;color:#6b7280;line-height:1.5;">Red de nutricionistas certificados disponibles para resolver dudas y ajustar los planes cuando el empleado lo necesita.</div>
        </td>
        <td style="width:4%;"></td>
        <td style="padding:14px 16px;background:#fdf4ff;border-radius:10px;border-left:3px solid #9333ea;width:48%;vertical-align:top;">
          <div style="font-size:13px;font-weight:700;color:#9333ea;margin-bottom:4px;">📊 Visible para RRHH</div>
          <div style="font-size:12px;color:#6b7280;line-height:1.5;">Dashboard con métricas agregadas y anonimizadas: adopción, objetivos alcanzados, engagement semanal.</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- PROPUESTA CONCRETA -->
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;">
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
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">Recibes un código único de empresa. Lo envías por email o Slack y cada empleado activa Pro Max en 30 segundos desde la app. Sin integraciones técnicas.</div>
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

  <!-- CTA -->
  <tr><td style="background:#ffffff;padding:36px 40px;text-align:center;">
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">¿Lo vemos juntos?</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">Sin compromiso. Responde a este email y coordinamos una llamada de 20 minutos para enseñarte la plataforma en directo y ver cómo encajaría en el programa de bienestar de <strong>${dest.empresa}</strong>.</p>
    <a href="mailto:luis@buddyone.io?subject=Colaboraci%C3%B3n%20BuddyOne%20%E2%80%94%20${encodeURIComponent(dest.empresa)}&body=Hola%20Luis%2C%0A%0AHe%20visto%20vuestra%20propuesta%20y%20me%20gustar%C3%ADa%20conocer%20m%C3%A1s%20sobre%20BuddyOne%20para%20nuestra%20empresa.%0A%0A%C2%BFPodemos%20coordinar%20una%20llamada%3F%0A%0ASaludos" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ef4444);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:50px;box-shadow:0 8px 24px rgba(249,115,22,0.35);">Escribir a luis@buddyone.io →</a>
    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">O visita <a href="https://buddyone.io" style="color:#f97316;text-decoration:none;">buddyone.io</a> para conocer más</p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
    <img src="${LOGO_SRC}" width="40" height="40" alt="BuddyOne" style="border-radius:10px;margin-bottom:12px;">
    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#f1f5f9;">Luis · Fundador de BuddyOne</p>
    <p style="margin:0 0 16px;font-size:13px;color:#64748b;">luis@buddyone.io · <a href="https://buddyone.io" style="color:#f97316;text-decoration:none;">buddyone.io</a></p>
    <p style="margin:0;font-size:11px;color:#475569;line-height:1.6;">Has recibido este email porque tu empresa tiene un programa de bienestar activo.<br>Si no deseas recibir más información, <a href="https://buddyone.io/unsubscribe" style="color:#64748b;">haz clic aquí</a>.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// Generar preview HTML con todos los emails
let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BuddyOne — Preview Emails B2B Corporativo</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; }
  .nav { position: sticky; top: 0; z-index: 100; background: #1e293b; border-bottom: 1px solid #334155; padding: 12px 20px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .nav-title { color: #f97316; font-weight: 700; font-size: 14px; margin-right: 8px; white-space: nowrap; }
  .nav-btn { background: #334155; color: #94a3b8; border: none; padding: 6px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; white-space: nowrap; }
  .nav-btn:hover, .nav-btn.active { background: linear-gradient(135deg,#f97316,#ef4444); color: white; }
  .email-frame { display: none; padding: 24px; }
  .email-frame.active { display: block; }
  .meta { background: #1e293b; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; gap: 16px; flex-wrap: wrap; }
  .meta-item { font-size: 12px; color: #94a3b8; }
  .meta-item strong { color: #f1f5f9; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
  .badge-alto { background: #dcfce7; color: #166534; }
  .badge-medio { background: #fef9c3; color: #854d0e; }
  .badge-bajo { background: #fee2e2; color: #991b1b; }
</style>
</head>
<body>
<div class="nav">
  <span class="nav-title">📧 BuddyOne B2B — ${destinatarios.length} emails</span>
  ${destinatarios.map((d, i) => `<button class="nav-btn ${i===0?'active':''}" onclick="show(${i})">${d.empresa}</button>`).join('')}
</div>
${destinatarios.map((d, i) => `
<div class="email-frame ${i===0?'active':''}" id="frame-${i}">
  <div class="meta">
    <div class="meta-item"><strong>Para:</strong> ${d.email}</div>
    <div class="meta-item"><strong>Responsable:</strong> ${d.nombre} ${d.apellido} — ${d.cargo}</div>
    <div class="meta-item"><strong>Asunto:</strong> Propuesta BuddyOne para ${d.empresa} — Bienestar nutricional para vuestros ${d.empleados} empleados</div>
    <div class="meta-item"><strong>Confianza email:</strong> <span class="badge badge-${d.confianza}">${d.confianza.toUpperCase()}</span></div>
  </div>
  ${generarEmailB2B(d)}
</div>`).join('')}
<script>
function show(idx) {
  document.querySelectorAll('.email-frame').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('frame-' + idx).classList.add('active');
  document.querySelectorAll('.nav-btn')[idx].classList.add('active');
}
</script>
</body>
</html>`;

writeFileSync('/home/ubuntu/preview_b2b_corporate_emails.html', html);
console.log('✅ Preview generado: /home/ubuntu/preview_b2b_corporate_emails.html');
console.log(`📧 ${destinatarios.length} emails personalizados listos`);
destinatarios.forEach((d, i) => {
  console.log(`  ${i+1}. ${d.empresa} → ${d.email} [${d.confianza}]`);
});
