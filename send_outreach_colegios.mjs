import { readFileSync } from 'fs';
import { Resend } from 'resend';

const resend = new Resend('re_ATJjodqQ_7tG1eNmBVpbuWR2Hi7UfHQU1');

const LOGO_B64 = readFileSync('/home/ubuntu/webdev-static-assets/buddyone-logo-b64.txt', 'utf8').trim();

// ─── Lista completa de destinatarios ───────────────────────────────────────────
const destinatarios = [
  // CONSEJO GENERAL
  { nombre: 'Consejo General de Colegios Oficiales de Dietistas-Nutricionistas', cargo: 'Estimado equipo del CGCODN', email: 'info@cgcodn.es', tipo: 'colegio' },

  // COLEGIOS AUTONÓMICOS
  { nombre: 'Colegio Oficial de Dietistas-Nutricionistas de Andalucía (CODINAN)', cargo: 'Estimado equipo del CODINAN', email: 'info@codinan.org', tipo: 'colegio' },
  { nombre: 'Colegio Profesional de Dietistas-Nutricionistas de Aragón', cargo: 'Estimado equipo del Colegio de Aragón', email: 'secretaria@dietistasnutricionistasaragon.es', tipo: 'colegio' },
  { nombre: 'Colegio Oficial de Dietistas-Nutricionistas de Illes Balears (CODNIB)', cargo: 'Estimado equipo del CODNIB', email: 'info@codnib.es', tipo: 'colegio' },
  { nombre: 'Colegio de Dietistas-Nutricionistas de Canarias (CODINUTRICAN)', cargo: 'Estimado equipo del CODINUTRICAN', email: 'info@dietistasnutricionistascanarias.com', tipo: 'colegio' },
  { nombre: 'Colegio Oficial de Dietistas-Nutricionistas de Castilla-La Mancha (CODINCAM)', cargo: 'Estimada Presidencia del CODINCAM', email: 'presidencia@codincam.es', tipo: 'colegio' },
  { nombre: 'Colegio Profesional de Dietistas-Nutricionistas de Castilla y León (CODINUCYL)', cargo: 'Estimada Naiara Carretero', email: 'info@codinucyl.es', tipo: 'colegio' },
  { nombre: 'Col·legi de Dietistes-Nutricionistes de Catalunya (CODINUCAT)', cargo: 'Estimado equipo del CODINUCAT', email: 'administracio@codinucat.cat', tipo: 'colegio' },
  { nombre: 'Colegio de Dietistas-Nutricionistas de la Comunitat Valenciana (CODINUCOVA)', cargo: 'Estimada Maite Navarro Amorrich', email: 'administracion@codinucova.es', tipo: 'colegio' },
  { nombre: 'Asociación Pro-Colegio de Dietistas-Nutricionistas de Extremadura (AEXDN)', cargo: 'Estimado equipo de AEXDN', email: 'info.aexdn@gmail.com', tipo: 'colegio' },
  { nombre: 'Colegio Oficial de Dietistas-Nutricionistas de Galicia (CODINUGAL)', cargo: 'Estimada Uxía Rodríguez Lavandeira', email: 'secretariacodinugal@gmail.com', tipo: 'colegio' },
  { nombre: 'Colegio Profesional de Dietistas-Nutricionistas de La Rioja (CODINULAR)', cargo: 'Estimada Raquel Fernández', email: 'codinular@gmail.com', tipo: 'colegio' },
  { nombre: 'Colegio Oficial de Dietistas-Nutricionistas de Madrid (CODINMA)', cargo: 'Estimada Isabel Campos del Portillo', email: 'info@codinma.es', tipo: 'colegio' },
  { nombre: 'Colegio de Dietistas-Nutricionistas de Murcia (CODINMUR)', cargo: 'Estimado equipo del CODINMUR', email: 'info@codinmur.es', tipo: 'colegio' },
  { nombre: 'Colegio de Dietistas-Nutricionistas de Navarra (CODINNA)', cargo: 'Estimada Izaskun Arrarás', email: 'gerencia@codinna.com', tipo: 'colegio' },
  { nombre: 'Colegio de Dietistas-Nutricionistas del País Vasco (CODINE)', cargo: 'Estimada Mª José Ibáñez Rozas', email: 'codinetemporal@gmail.com', tipo: 'colegio' },

  // UNIVERSIDADES
  { nombre: 'Universidad de Navarra — Grado en Nutrición Humana y Dietética', cargo: 'Estimado equipo de la Facultad de Farmacia y Nutrición', email: 'info@unav.es', tipo: 'universidad' },
  { nombre: 'Universidad Complutense de Madrid — Grado en Nutrición Humana y Dietética', cargo: 'Estimado equipo de la Facultad de Medicina', email: 'secre.alumnos@med.ucm.es', tipo: 'universidad' },
  { nombre: 'Universidad de Granada — Grado en Nutrición Humana y Dietética', cargo: 'Estimada María Eugenia García Rubiño', email: 'decanatofarmacia@ugr.es', tipo: 'universidad' },
  { nombre: 'Universidad de Barcelona — Grado en Nutrición Humana y Dietética', cargo: 'Estimada Dra. Elvira López Tamames', email: 'secretaria-estudiants-farmacia@ub.edu', tipo: 'universidad' },
  { nombre: 'Universidad CEU San Pablo — Grado en Nutrición Humana y Dietética', cargo: 'Estimado equipo de la Universidad CEU San Pablo', email: 'info.usp@ceu.es', tipo: 'universidad' },
  { nombre: 'Universidad Francisco de Vitoria — Grado en Nutrición Humana y Dietética', cargo: 'Estimado equipo de la Universidad Francisco de Vitoria', email: 'info@ufv.es', tipo: 'universidad' },
  { nombre: 'Universidad de Alicante — Grado en Nutrición Humana y Dietética', cargo: 'Estimada Mª Isabel Sospedra López', email: 'isospedra@ua.es', tipo: 'universidad' },
  { nombre: 'Universidad de Valladolid — Grado en Nutrición Humana y Dietética', cargo: 'Estimado equipo de la Facultad de Medicina', email: 'med@uva.es', tipo: 'universidad' },
  { nombre: 'Universidad de Zaragoza — Grado en Nutrición Humana y Dietética', cargo: 'Estimado Prof. Dr. Carlos María Plana Galindo', email: 'secrefsd@unizar.es', tipo: 'universidad' },
  { nombre: 'Universidad Autónoma de Madrid — Grado en Nutrición Humana y Dietética', cargo: 'Estimado equipo de la Facultad de Ciencias', email: 'informacion.ciencias@uam.es', tipo: 'universidad' },
];

// ─── Función que genera el HTML del email ──────────────────────────────────────────
function generarEmailHtml({ nombre, cargo, tipo }) {
  const esColegio = tipo === 'colegio';

  const propuestaEspecifica = esColegio
    ? `
      <p style="margin:0 0 16px 0; color:#374151; font-size:15px; line-height:1.7;">
        Queremos que los dietistas-nutricionistas de vuestro colegio sean los primeros en beneficiarse de BuddyOne como herramienta de trabajo. La propuesta es sencilla y sin coste para ellos:
      </p>
      <ul style="margin:0 0 20px 0; padding-left:24px; color:#374151; font-size:15px; line-height:2;">
        <li><strong>20% de comisión</strong> por cada usuario que traigan a la plataforma — ingresos recurrentes sin esfuerzo adicional</li>
        <li><strong>Panel de gestión de pacientes</strong> completo: seguimiento nutricional, evolución de peso, adherencia al plan y comunicación directa</li>
        <li><strong>Captación de nuevos pacientes</strong> a través del marketplace de BuddyExperts, visible para miles de usuarios activos</li>
        <li><strong>Venta de planes nutricionales personalizados</strong> directamente desde la plataforma, con cobro integrado</li>
        <li><strong>Menús con IA</strong> que el nutricionista puede revisar, ajustar y asignar a sus pacientes en segundos</li>
        <li><strong>Cero coste de alta</strong> — los colegiados se registran como expertos en BuddyOne de forma gratuita</li>
      </ul>
      <div style="background:linear-gradient(135deg, #fff7ed, #fef3c7); border-radius:12px; padding:20px 24px; margin-bottom:24px; border-left:4px solid #f97316;">
        <p style="margin:0; color:#92400e; font-size:14px; font-weight:700; margin-bottom:6px;">💡 En resumen</p>
        <p style="margin:0; color:#78350f; font-size:14px; line-height:1.6;">
          Vuestros colegiados consiguen una herramienta profesional de primer nivel, nuevos pacientes y una fuente de ingresos adicional — todo en una sola plataforma. Sin cuotas, sin compromisos.
        </p>
      </div>`
    : `
      <p style="margin:0 0 20px 0; color:#374151; font-size:15px; line-height:1.7;">
        BuddyOne no es solo una app de nutrición — es una plataforma con miles de usuarios reales generando datos sobre adherencia, comportamiento alimentario e impacto de la IA en la salud. Queremos que vuestra universidad sea parte de ello.
      </p>

      <!-- BLOQUE 1: INVESTIGACIÓN -->
      <div style="background:#f8fafc; border-radius:12px; padding:20px 24px; margin-bottom:16px; border-left:4px solid #7c3aed;">
        <p style="margin:0 0 8px 0; color:#5b21b6; font-size:15px; font-weight:700;">🔬 Investigación y publicaciones</p>
        <p style="margin:0 0 10px 0; color:#374151; font-size:14px; line-height:1.6;">
          Acceso a datos reales y anonimizados de nuestra plataforma para investigar adherencia nutricional, efectividad de menús con IA, patrones de comportamiento alimentario y mucho más. BuddyOne puede ser la fuente de datos de vuestro próximo estudio.
        </p>
        <ul style="margin:0; padding-left:20px; color:#6b7280; font-size:13px; line-height:1.8;">
          <li>Dataset real de miles de usuarios con seguimiento longitudinal</li>
          <li>Co-autoría en publicaciones derivadas de la colaboración</li>
          <li>Acceso anticipado a nuevas funcionalidades para validación científica</li>
        </ul>
      </div>

      <!-- BLOQUE 2: VISIBILIDAD -->
      <div style="background:#f8fafc; border-radius:12px; padding:20px 24px; margin-bottom:16px; border-left:4px solid #059669;">
        <p style="margin:0 0 8px 0; color:#065f46; font-size:15px; font-weight:700;">🌟 Visibilidad y posicionamiento institucional</p>
        <p style="margin:0 0 10px 0; color:#374151; font-size:14px; line-height:1.6;">
          BuddyOne es una plataforma con miles de usuarios activos en España. La colaboración con vuestra universidad le da visibilidad directa ante una audiencia que busca referentes en nutrición de calidad.
        </p>
        <ul style="margin:0; padding-left:20px; color:#6b7280; font-size:13px; line-height:1.8;">
          <li>Mención de la universidad como centro colaborador dentro de la app y la web</li>
          <li>Presencia en comunicaciones y newsletters de BuddyOne a toda la base de usuarios</li>
          <li>Posicionamiento como referente en nutrición digital ante miles de personas interesadas en salud</li>
        </ul>
      </div>

      <!-- BLOQUE 3: SPIN-OFF -->
      <div style="background:#f8fafc; border-radius:12px; padding:20px 24px; margin-bottom:24px; border-left:4px solid #f97316;">
        <p style="margin:0 0 8px 0; color:#c2410c; font-size:15px; font-weight:700;">🚀 Spin-off y casos de uso con estudiantes</p>
        <p style="margin:0 0 10px 0; color:#374151; font-size:14px; line-height:1.6;">
          Buscamos equipos universitarios que quieran desarrollar casos de uso reales dentro de BuddyOne: módulos especializados para patologías concretas, algoritmos de recomendación, interfaces adaptadas a colectivos específicos. Si hay talento en vuestro grado, queremos conocerlo.
        </p>
        <ul style="margin:0; padding-left:20px; color:#6b7280; font-size:13px; line-height:1.8;">
          <li>TFG y TFM con impacto real en una plataforma con usuarios activos</li>
          <li>Posibilidad de incorporación al equipo o lanzamiento de spin-off</li>
          <li>Mentoring directo del equipo de BuddyOne</li>
        </ul>
      </div>

      <div style="background:linear-gradient(135deg, #fdf4ff, #ede9fe); border-radius:12px; padding:20px 24px; margin-bottom:24px; border-left:4px solid #7c3aed;">
        <p style="margin:0; color:#5b21b6; font-size:14px; font-weight:700; margin-bottom:6px;">💡 En resumen</p>
        <p style="margin:0; color:#4c1d95; font-size:14px; line-height:1.6;">
          Investigación con datos reales, graduados más empleables y la posibilidad de que el talento de vuestro grado construya el futuro de la nutrición digital. Todo ello sin coste y con el respaldo de una plataforma en crecimiento.
        </p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BuddyOne — Propuesta de Colaboración</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ef4444 60%, #ec4899 100%); border-radius:16px 16px 0 0; padding:36px 40px; text-align:center;">
              <img src="data:image/png;base64,${LOGO_B64}" alt="BuddyOne" width="72" height="72" style="display:block; margin:0 auto 16px auto; border-radius:16px;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:800; letter-spacing:-0.5px;">BuddyOne</h1>
              <p style="margin:6px 0 0 0; color:rgba(255,255,255,0.9); font-size:14px; font-weight:500; letter-spacing:1px; text-transform:uppercase;">El sistema operativo de tu bienestar</p>
              <div style="margin-top:20px; background:rgba(255,255,255,0.15); border-radius:8px; padding:10px 20px; display:inline-block;">
                <p style="margin:0; color:#ffffff; font-size:13px; font-weight:600;">Propuesta de Colaboración Institucional</p>
              </div>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="background:#ffffff; padding:40px 40px 32px 40px;">

              <p style="margin:0 0 24px 0; color:#374151; font-size:16px; line-height:1.7;">
                ${cargo},
              </p>

              <p style="margin:0 0 20px 0; color:#374151; font-size:15px; line-height:1.7;">
                Me pongo en contacto con vosotros desde <strong>BuddyOne</strong>, una plataforma española de nutrición inteligente que combina inteligencia artificial, seguimiento nutricional personalizado y conexión directa con dietistas-nutricionistas certificados.
              </p>

              <p style="margin:0 0 28px 0; color:#374151; font-size:15px; line-height:1.7;">
                Nuestra misión es democratizar el acceso a la nutrición de calidad en España, y creemos que la colaboración con <strong>${nombre}</strong> puede ser el punto de partida para algo realmente significativo para vuestros ${esColegio ? 'colegiados' : 'docentes y estudiantes'}.
              </p>

              <!-- SEPARADOR -->
              <div style="height:3px; background:linear-gradient(90deg, #f97316, #ef4444, #ec4899); border-radius:2px; margin:0 0 28px 0;"></div>

              <!-- QUÉ ES BUDDYONE -->
              <h2 style="margin:0 0 16px 0; color:#111827; font-size:18px; font-weight:700;">¿Qué es BuddyOne?</h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="padding:0 8px 12px 0; vertical-align:top;">
                    <div style="background:#fff7ed; border-radius:10px; padding:16px;">
                      <p style="margin:0 0 6px 0; font-size:22px;">🤖</p>
                      <p style="margin:0 0 4px 0; color:#111827; font-size:14px; font-weight:700;">Menús con IA</p>
                      <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.5;">Generación automática de menús semanales adaptados a objetivos, patologías y preferencias</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 12px 8px; vertical-align:top;">
                    <div style="background:#f0fdf4; border-radius:10px; padding:16px;">
                      <p style="margin:0 0 6px 0; font-size:22px;">📊</p>
                      <p style="margin:0 0 4px 0; color:#111827; font-size:14px; font-weight:700;">Seguimiento nutricional</p>
                      <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.5;">Registro de comidas, macros, peso corporal y evolución con gráficas detalladas</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding:0 8px 0 0; vertical-align:top;">
                    <div style="background:#eff6ff; border-radius:10px; padding:16px;">
                      <p style="margin:0 0 6px 0; font-size:22px;">👨‍⚕️</p>
                      <p style="margin:0 0 4px 0; color:#111827; font-size:14px; font-weight:700;">BuddyExperts</p>
                      <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.5;">Marketplace de nutricionistas certificados donde captar nuevos pacientes y gestionar consultas</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 0 8px; vertical-align:top;">
                    <div style="background:#fdf4ff; border-radius:10px; padding:16px;">
                      <p style="margin:0 0 6px 0; font-size:22px;">⌚</p>
                      <p style="margin:0 0 4px 0; color:#111827; font-size:14px; font-weight:700;">Wearables</p>
                      <p style="margin:0; color:#6b7280; font-size:13px; line-height:1.5;">Integración con Oura Ring y Whoop para ajustar la nutrición según datos de sueño y actividad</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- SEPARADOR -->
              <div style="height:3px; background:linear-gradient(90deg, #f97316, #ef4444, #ec4899); border-radius:2px; margin:0 0 28px 0;"></div>

              <!-- PROPUESTA -->
              <h2 style="margin:0 0 16px 0; color:#111827; font-size:18px; font-weight:700;">
                Nuestra propuesta para ${esColegio ? 'vuestros colegiados' : 'vuestra universidad'}
              </h2>

              ${propuestaEspecifica}

              <!-- CTA -->
              <div style="text-align:center; margin:32px 0 24px 0;">
                <a href="https://buddyone.io" style="display:inline-block; background:linear-gradient(135deg, #f97316, #ef4444); color:#ffffff; text-decoration:none; font-size:16px; font-weight:700; padding:16px 36px; border-radius:50px; box-shadow:0 4px 15px rgba(249,115,22,0.4);">
                  Descubrir BuddyOne →
                </a>
              </div>

              <p style="margin:0 0 20px 0; color:#374151; font-size:15px; line-height:1.7;">
                Estaré encantado de organizar una llamada o videollamada para presentaros la plataforma en detalle y explorar juntos cómo podemos colaborar. ¿Tendríais disponibilidad en las próximas semanas?
              </p>

              <p style="margin:0 0 8px 0; color:#374151; font-size:15px; line-height:1.7;">
                Quedo a vuestra disposición para cualquier consulta.
              </p>

              <p style="margin:0 0 4px 0; color:#374151; font-size:15px; line-height:1.7;">
                Un cordial saludo,
              </p>

              <!-- FIRMA -->
              <div style="margin-top:24px; padding:20px; background:#f8fafc; border-radius:12px; border-left:4px solid #f97316;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:16px; vertical-align:middle;">
                      <img src="data:image/png;base64,${LOGO_B64}" alt="BuddyOne" width="48" height="48" style="border-radius:10px; display:block;">
                    </td>
                    <td style="vertical-align:middle;">
                      <p style="margin:0; color:#111827; font-size:15px; font-weight:700;">Luis María Cabello de los Cobos</p>
                      <p style="margin:2px 0; color:#f97316; font-size:13px; font-weight:600;">Fundador & CEO — BuddyOne</p>
                      <p style="margin:2px 0; color:#6b7280; font-size:13px;">luis@buddyone.io</p>
                      <p style="margin:2px 0; color:#6b7280; font-size:13px;"><a href="https://buddyone.io" style="color:#f97316; text-decoration:none;">buddyone.io</a></p>
                    </td>
                  </tr>
                </table>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0f172a; border-radius:0 0 16px 16px; padding:28px 40px; text-align:center;">
              <img src="data:image/png;base64,${LOGO_B64}" alt="BuddyOne" width="36" height="36" style="display:block; margin:0 auto 12px auto; border-radius:8px; opacity:0.9;">
              <p style="margin:0 0 8px 0; color:#94a3b8; font-size:12px;">
                BuddyOne — El sistema operativo de tu bienestar
              </p>
              <p style="margin:0 0 12px 0; color:#64748b; font-size:11px;">
                <a href="https://buddyone.io" style="color:#f97316; text-decoration:none;">buddyone.io</a>
                &nbsp;·&nbsp;
                <a href="https://buddyone.io/privacidad" style="color:#64748b; text-decoration:none;">Privacidad</a>
                &nbsp;·&nbsp;
                <a href="mailto:luis@buddyone.io" style="color:#64748b; text-decoration:none;">Contacto</a>
              </p>
              <p style="margin:0; color:#475569; font-size:10px; line-height:1.5;">
                Has recibido este correo porque tu entidad figura en el directorio oficial de colegios profesionales<br>y universidades de nutrición de España. Si no deseas recibir más comunicaciones,<br>escríbenos a <a href="mailto:luis@buddyone.io" style="color:#64748b;">luis@buddyone.io</a>
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


// ─── Función principal de envío ────────────────────────────────────────────────
async function enviarEmails(modoTest = true) {
  console.log(`\n🚀 BuddyOne — Campaña de outreach a colegios y universidades`);
  console.log(`📧 Total de destinatarios: ${destinatarios.length}`);
  console.log(`🔧 Modo: ${modoTest ? 'PREVIEW (sin envío real)' : 'ENVÍO REAL'}\n`);

  if (modoTest) {
    console.log('─'.repeat(60));
    console.log('PREVIEW DE DESTINATARIOS:');
    console.log('─'.repeat(60));
    destinatarios.forEach((d, i) => {
      console.log(`${String(i+1).padStart(2,'0')}. [${d.tipo.toUpperCase()}] ${d.email}`);
      console.log(`    → ${d.nombre}`);
    });
    console.log('─'.repeat(60));
    console.log(`\n✅ Preview completado. Para enviar de verdad, ejecuta:`);
    console.log(`   node send_outreach_colegios.mjs --send\n`);
    return;
  }

  // ENVÍO REAL
  let enviados = 0;
  let errores = 0;

  for (const dest of destinatarios) {
    try {
      const asunto = dest.tipo === 'colegio'
        ? `Propuesta de colaboración para vuestros colegiados — BuddyOne`
        : `Propuesta de colaboración para estudiantes y docentes — BuddyOne`;

      const html = generarEmailHtml(dest);

      const { data, error } = await resend.emails.send({
        from: 'Luis de BuddyOne <luis@buddyone.io>',
        to: dest.email,
        subject: asunto,
        html,
        headers: {
          'X-Entity-Ref-ID': `outreach-${dest.tipo}-${Date.now()}`,
        },
      });

      if (error) {
        console.error(`❌ Error enviando a ${dest.email}: ${error.message}`);
        errores++;
      } else {
        console.log(`✅ Enviado a ${dest.email} (ID: ${data.id})`);
        enviados++;
      }

      // Pausa de 500ms entre envíos para respetar rate limits de Resend
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      console.error(`❌ Excepción enviando a ${dest.email}: ${err.message}`);
      errores++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📊 RESUMEN FINAL:`);
  console.log(`   ✅ Enviados correctamente: ${enviados}`);
  console.log(`   ❌ Errores: ${errores}`);
  console.log(`   📧 Total: ${destinatarios.length}`);
  console.log('─'.repeat(60));
}

// ─── Ejecución ─────────────────────────────────────────────────────────────────
const modoEnvio = process.argv.includes('--send');
enviarEmails(!modoEnvio);
