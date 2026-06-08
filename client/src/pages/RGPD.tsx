import { Link } from "wouter";

const ORANGE = "#F97316";
const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-horizontal-orange_0dcbe0a8.png";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 48 }}>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6", letterSpacing: "-0.01em" }}>{title}</h2>
    <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.85 }}>{children}</div>
  </section>
);

const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ marginTop: 0, marginBottom: 14, ...style }}>{children}</p>
);

export default function RGPD() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/"><img src={LOGO_COLOR} alt="Buddy One" style={{ height: 60, objectFit: "contain", cursor: "pointer" }} /></Link>
          <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al inicio</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>PROTECCIÓN DE DATOS</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#111827", marginTop: 8, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Política de Protección de Datos (RGPD)
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Última actualización: 30 de mayo de 2026</p>
          <div style={{ marginTop: 20, padding: "16px 20px", background: "#fff7ed", borderRadius: 12, border: "1px solid #fed7aa" }}>
            <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
              <strong>Marco normativo:</strong> Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD).
            </p>
          </div>
        </div>

        <Section title="1. Responsable del Tratamiento">
          <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <tbody>
              {[
                ["Denominación social", "BUDDY MARKET IA, S.L."],
                ["CIF", "B-56.819.576"],
                ["Domicilio social", "Calle Villanueva 2, Esc. 3, 3ºC, 28001 Madrid (España)"],
                ["Email de contacto", "luis@buddyone.io"],
                ["Delegado de Protección de Datos (DPO)", "dpo@buddyone.io"],
                ["Registro Mercantil", "Inscrita en el Registro Mercantil de Madrid"],
              ].map(([label, value], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#111827", background: "#f9fafb", width: "40%" }}>{label}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="2. Categorías de Datos Personales Tratados">
          <P>Buddy One trata las siguientes categorías de datos personales en función de los servicios utilizados por el Usuario:</P>
          
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>2.1. Datos identificativos y de cuenta</h3>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Nombre y apellidos</li>
            <li>Dirección de correo electrónico</li>
            <li>Imagen de perfil (opcional)</li>
            <li>Datos de autenticación (OAuth, contraseña cifrada)</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>2.2. Datos de salud (categoría especial — Art. 9 RGPD)</h3>
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: "16px 20px", border: "1px solid #fecaca", marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#991b1b", margin: 0, fontWeight: 600 }}>Datos especialmente protegidos que requieren consentimiento explícito del interesado.</p>
          </div>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Alergias e intolerancias alimentarias</li>
            <li>Condiciones médicas (diabetes, hipertensión, colesterol, celiaquía, etc.)</li>
            <li>Objetivos de salud (pérdida de peso, ganancia muscular, embarazo, lactancia)</li>
            <li>Datos antropométricos (peso, altura, IMC, porcentaje de grasa)</li>
            <li>Registro de comidas y diario nutricional</li>
            <li>Métricas de salud (glucosa, tensión arterial, colesterol — si el usuario las introduce)</li>
            <li>Resultados de analíticas de sangre (si el usuario los sube voluntariamente)</li>
            <li>Datos de actividad física y entrenamiento</li>
            <li>Datos de dispositivos wearables conectados (Oura Ring, etc.)</li>
          </ul>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>2.3. Datos de menores de edad</h3>
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: "16px 20px", border: "1px solid #bfdbfe", marginBottom: 12 }}>
            <p style={{ fontSize: 13, color: "#1e40af", margin: 0, fontWeight: 600 }}>Tratamiento sujeto a consentimiento del titular de la patria potestad (Art. 8 RGPD / Art. 7 LOPDGDD — edad mínima 14 años en España).</p>
          </div>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Perfiles nutricionales de menores dentro de perfiles familiares</li>
            <li>Preferencias alimentarias y alergias de menores</li>
            <li>Datos de crecimiento y desarrollo (peso, altura por edad)</li>
            <li>Menús adaptados a necesidades pediátricas</li>
          </ul>
          <P style={{ marginTop: 12 }}>Los menores de 14 años no pueden registrarse de forma autónoma. Sus datos son gestionados exclusivamente por el titular de la cuenta (padre, madre o tutor legal), quien otorga el consentimiento en su nombre. El tratamiento se limita a la generación de menús adaptados y seguimiento nutricional dentro del perfil familiar.</P>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>2.4. Datos de mascotas (Buddy Pets)</h3>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Nombre, especie, raza y edad de la mascota</li>
            <li>Peso y condición corporal</li>
            <li>Alergias y condiciones veterinarias</li>
            <li>Historial de alimentación</li>
          </ul>
          <P style={{ marginTop: 12 }}>Los datos de mascotas no constituyen datos personales en sí mismos, pero se vinculan al perfil del Usuario y se tratan con las mismas garantías de seguridad.</P>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>2.5. Datos de transacciones y pagos</h3>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Historial de suscripciones y planes contratados</li>
            <li>Identificadores de pago (Stripe Customer ID, Payment Intent ID)</li>
            <li>Datos de facturación (nombre, dirección fiscal, NIF/CIF)</li>
          </ul>
          <P style={{ marginTop: 12 }}>Buddy One NO almacena datos de tarjetas de crédito/débito. Todos los pagos son procesados por Stripe, Inc. conforme a su propia política de privacidad y certificación PCI-DSS Nivel 1.</P>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>2.6. Datos de navegación y uso</h3>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Dirección IP (anonimizada tras 24h)</li>
            <li>Tipo de dispositivo, navegador y sistema operativo</li>
            <li>Páginas visitadas y tiempo de permanencia</li>
            <li>Interacciones con funcionalidades de la plataforma</li>
          </ul>
        </Section>

        <Section title="3. Bases Legales del Tratamiento">
          <P>Cada tratamiento de datos se fundamenta en una base legal específica conforme al Art. 6 y Art. 9 del RGPD:</P>
          <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", marginTop: 16 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Finalidad</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Base Legal</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Conservación</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Registro y gestión de cuenta", "Art. 6.1.b) Ejecución del contrato", "Duración de la relación contractual"],
                ["Generación de menús personalizados", "Art. 6.1.b) Ejecución del contrato", "Duración de la cuenta"],
                ["Tratamiento de datos de salud", "Art. 9.2.a) Consentimiento explícito", "Hasta revocación del consentimiento"],
                ["Datos de menores (perfil familiar)", "Art. 8 RGPD / Art. 7 LOPDGDD — Consentimiento del tutor", "Hasta eliminación por el tutor"],
                ["Procesamiento de pagos", "Art. 6.1.b) Ejecución del contrato", "5 años (obligación fiscal)"],
                ["Comunicaciones de servicio", "Art. 6.1.f) Interés legítimo", "Duración de la cuenta"],
                ["Marketing y newsletters", "Art. 6.1.a) Consentimiento", "Hasta revocación"],
                ["Mejora del servicio mediante IA", "Art. 6.1.f) Interés legítimo", "3 años (datos anonimizados)"],
                ["Cumplimiento de obligaciones legales", "Art. 6.1.c) Obligación legal", "Según normativa aplicable"],
                ["Buddy Experts (datos de pacientes)", "Art. 9.2.a) Consentimiento explícito + Art. 6.1.b)", "Duración de la relación profesional"],
                ["Buddy Pets (datos de mascotas)", "Art. 6.1.b) Ejecución del contrato", "Duración de la cuenta"],
                ["Analíticas y estadísticas", "Art. 6.1.f) Interés legítimo (datos anonimizados)", "26 meses máximo"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="4. Derechos del Interesado (Arts. 15-22 RGPD)">
          <P>Todo Usuario puede ejercer los siguientes derechos de forma gratuita:</P>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12, marginTop: 16 }}>
            {[
              { icon: "👁️", title: "Derecho de Acceso (Art. 15)", desc: "Obtener confirmación de si se tratan sus datos y acceder a una copia de los mismos." },
              { icon: "✏️", title: "Derecho de Rectificación (Art. 16)", desc: "Solicitar la corrección de datos inexactos o completar datos incompletos." },
              { icon: "🗑️", title: "Derecho de Supresión (Art. 17)", desc: "Solicitar la eliminación de sus datos cuando ya no sean necesarios para la finalidad." },
              { icon: "⏸️", title: "Derecho de Limitación (Art. 18)", desc: "Solicitar la restricción del tratamiento en determinadas circunstancias." },
              { icon: "📦", title: "Derecho de Portabilidad (Art. 20)", desc: "Recibir sus datos en formato estructurado, de uso común y lectura mecánica (JSON/CSV)." },
              { icon: "🚫", title: "Derecho de Oposición (Art. 21)", desc: "Oponerse al tratamiento basado en interés legítimo, incluida la elaboración de perfiles." },
              { icon: "🤖", title: "Decisiones Automatizadas (Art. 22)", desc: "No ser objeto de decisiones basadas únicamente en tratamiento automatizado con efectos jurídicos." },
              { icon: "↩️", title: "Revocación del Consentimiento", desc: "Retirar el consentimiento en cualquier momento sin que afecte a la licitud del tratamiento previo." },
            ].map(r => (
              <div key={r.title} style={{ background: "#f9fafb", borderRadius: 12, padding: "16px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: "16px 20px", background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: 14, color: "#166534", margin: 0 }}>
              <strong>Cómo ejercer sus derechos:</strong> Envíe un email a <a href="mailto:dpo@buddyone.io" style={{ color: ORANGE }}>dpo@buddyone.io</a> indicando el derecho que desea ejercer y adjuntando copia de su DNI/NIE/Pasaporte. Plazo de respuesta: máximo 30 días naturales (prorrogable 2 meses en casos complejos, Art. 12.3 RGPD).
            </p>
          </div>

          <P style={{ marginTop: 16 }}>Si considera que sus derechos no han sido debidamente atendidos, puede presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: ORANGE }}>www.aepd.es</a> — C/ Jorge Juan 6, 28001 Madrid.</P>
        </Section>

        <Section title="5. Tratamiento de Datos de Categoría Especial (Art. 9 RGPD)">
          <P>Buddy One trata datos relativos a la salud del Usuario (alergias, condiciones médicas, métricas biométricas). Este tratamiento se realiza exclusivamente bajo las siguientes condiciones:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <li><strong>Consentimiento explícito e inequívoco</strong> del interesado, otorgado mediante acción afirmativa clara durante el proceso de registro y configuración del perfil nutricional.</li>
            <li><strong>Finalidad exclusiva:</strong> generación de planes nutricionales personalizados, seguimiento de métricas de salud y recomendaciones de suplementos.</li>
            <li><strong>Minimización:</strong> solo se solicitan los datos estrictamente necesarios para la prestación del servicio.</li>
            <li><strong>Cifrado:</strong> los datos de salud se almacenan cifrados en reposo (AES-256) y en tránsito (TLS 1.3).</li>
            <li><strong>Acceso restringido:</strong> solo el Usuario y, en su caso, el profesional de Buddy Experts asignado con consentimiento expreso tienen acceso a estos datos.</li>
            <li><strong>Evaluación de Impacto (EIPD):</strong> se ha realizado una Evaluación de Impacto en la Protección de Datos conforme al Art. 35 RGPD para el tratamiento de datos de salud a gran escala.</li>
          </ul>
        </Section>

        <Section title="6. Protección de Datos de Menores">
          <P>Buddy One cumple con las disposiciones del Art. 8 RGPD y Art. 7 LOPDGDD respecto al tratamiento de datos de menores:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <li><strong>Edad mínima de registro autónomo:</strong> 14 años (conforme a la legislación española).</li>
            <li><strong>Menores de 14 años:</strong> sus datos solo pueden ser gestionados por el titular de la patria potestad o tutela legal a través de la funcionalidad de Perfiles Familiares.</li>
            <li><strong>Verificación:</strong> el tutor legal declara responsablemente su condición al crear un perfil de menor.</li>
            <li><strong>Datos limitados:</strong> para menores solo se recogen nombre, edad, peso, altura, alergias y preferencias alimentarias necesarias para la generación de menús adaptados.</li>
            <li><strong>Sin marketing:</strong> los perfiles de menores no reciben comunicaciones comerciales ni están sujetos a elaboración de perfiles con fines publicitarios.</li>
            <li><strong>Eliminación:</strong> el tutor puede eliminar el perfil del menor en cualquier momento desde la configuración de la cuenta.</li>
          </ul>
        </Section>

        <Section title="7. Decisiones Automatizadas y Elaboración de Perfiles">
          <P>Buddy One utiliza algoritmos de inteligencia artificial para:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            <li>Generar menús semanales personalizados basados en el perfil nutricional del Usuario.</li>
            <li>Recomendar suplementos nutricionales (Buddy Care) según objetivos y condiciones.</li>
            <li>Sugerir recetas basadas en preferencias e historial.</li>
            <li>Detectar patrones nutricionales y alertar sobre posibles desequilibrios.</li>
          </ul>
          <P style={{ marginTop: 12 }}>Estas decisiones automatizadas <strong>no producen efectos jurídicos</strong> ni afectan significativamente al interesado de forma similar. Son recomendaciones orientativas que el Usuario puede aceptar, modificar o rechazar libremente.</P>
          <P>No obstante, el Usuario tiene derecho a:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Obtener intervención humana por parte de nuestro equipo.</li>
            <li>Expresar su punto de vista respecto a las recomendaciones.</li>
            <li>Impugnar cualquier decisión automatizada contactando a dpo@buddyone.io.</li>
          </ul>
        </Section>

        <Section title="8. Destinatarios y Transferencias Internacionales">
          <P>Los datos personales pueden ser comunicados a los siguientes destinatarios:</P>
          <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", marginTop: 12 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Destinatario</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Finalidad</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Garantías</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Stripe, Inc. (EE.UU.)", "Procesamiento de pagos", "Cláusulas Contractuales Tipo (CCT) + DPF"],
                ["Proveedores de hosting (UE)", "Alojamiento de datos", "Servidores en la UE"],
                ["Buddy Experts (nutricionistas)", "Seguimiento de pacientes", "Contrato de encargado del tratamiento"],
                ["Proveedores de IA (EE.UU.)", "Generación de menús", "CCT + datos anonimizados"],
                ["Twilio (EE.UU.)", "Notificaciones SMS", "CCT + DPF"],
                ["Resend (EE.UU.)", "Envío de emails transaccionales", "CCT + DPF"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <P style={{ marginTop: 16 }}>Las transferencias internacionales fuera del EEE se realizan al amparo de Cláusulas Contractuales Tipo aprobadas por la Comisión Europea (Decisión 2021/914) y, cuando aplique, del Marco de Privacidad de Datos UE-EE.UU. (Data Privacy Framework).</P>
        </Section>

        <Section title="9. Medidas de Seguridad (Art. 32 RGPD)">
          <P>Buddy One implementa medidas técnicas y organizativas adecuadas al nivel de riesgo:</P>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {[
              { title: "Cifrado", desc: "TLS 1.3 en tránsito, AES-256 en reposo para datos de salud" },
              { title: "Control de acceso", desc: "RBAC (control basado en roles), autenticación multifactor" },
              { title: "Seudonimización", desc: "Datos de IA procesados con identificadores no reversibles" },
              { title: "Copias de seguridad", desc: "Backups cifrados diarios con retención de 30 días" },
              { title: "Auditorías", desc: "Revisiones de seguridad trimestrales y tests de penetración anuales" },
              { title: "Gestión de incidentes", desc: "Protocolo de notificación a AEPD en 72h (Art. 33 RGPD)" },
            ].map(item => (
              <div key={item.title} style={{ background: "#f9fafb", borderRadius: 10, padding: "14px 16px", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="10. Plazos de Conservación">
          <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Tipo de dato</th>
                <th style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#374151", textAlign: "left" }}>Plazo de conservación</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Datos de cuenta", "Duración de la relación contractual + 5 años (prescripción)"],
                ["Datos de salud", "Hasta revocación del consentimiento o eliminación de cuenta"],
                ["Datos de menores", "Hasta eliminación por el tutor o hasta que el menor cumpla 14 años y gestione su propia cuenta"],
                ["Datos de pagos/facturación", "5 años (Art. 30 Código de Comercio) + 4 años (Ley General Tributaria)"],
                ["Datos de navegación", "26 meses máximo (anonimizados tras 24h)"],
                ["Comunicaciones de soporte", "3 años desde la última interacción"],
                ["Datos de Buddy Experts (pacientes)", "Duración de la relación profesional + 5 años"],
                ["Consentimientos otorgados", "Duración del tratamiento + 5 años como prueba"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="11. Evaluación de Impacto (EIPD — Art. 35 RGPD)">
          <P>Dado que Buddy One realiza tratamiento a gran escala de datos de categoría especial (salud) y elaboración de perfiles automatizados, se ha llevado a cabo una Evaluación de Impacto en la Protección de Datos que incluye:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Descripción sistemática de las operaciones de tratamiento y sus finalidades.</li>
            <li>Evaluación de la necesidad y proporcionalidad del tratamiento.</li>
            <li>Evaluación de los riesgos para los derechos y libertades de los interesados.</li>
            <li>Medidas previstas para afrontar los riesgos identificados.</li>
          </ul>
          <P style={{ marginTop: 12 }}>La EIPD se revisa anualmente o cuando se introduzcan cambios significativos en el tratamiento.</P>
        </Section>

        <Section title="12. Registro de Actividades de Tratamiento (Art. 30 RGPD)">
          <P>BUDDY MARKET IA, S.L. mantiene un Registro de Actividades de Tratamiento actualizado que incluye todas las operaciones realizadas sobre datos personales, disponible para la autoridad de control cuando sea requerido.</P>
        </Section>

        <Section title="13. Contacto del Delegado de Protección de Datos">
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "20px 24px", border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: 15, color: "#166534", margin: "0 0 8px", fontWeight: 700 }}>Delegado de Protección de Datos (DPO)</p>
            <p style={{ fontSize: 14, color: "#374151", margin: "0 0 4px" }}>Email: <a href="mailto:dpo@buddyone.io" style={{ color: ORANGE, fontWeight: 600 }}>dpo@buddyone.io</a></p>
            <p style={{ fontSize: 14, color: "#374151", margin: "0 0 4px" }}>Dirección postal: BUDDY MARKET IA, S.L. — Att. DPO — Calle Villanueva 2, Esc. 3, 3ºC, 28001 Madrid</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "12px 0 0" }}>El DPO atenderá cualquier consulta relativa al tratamiento de datos personales en un plazo máximo de 30 días naturales.</p>
          </div>
        </Section>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Privacidad →</Link>
          <Link href="/terms" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Términos y Condiciones →</Link>
          <Link href="/cookies" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Cookies →</Link>
          <Link href="/legal" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Aviso Legal →</Link>
        </div>
      </div>
    </div>
  );
}
