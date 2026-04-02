import { Link } from "wouter";

const ORANGE = "#F97316";
const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6", letterSpacing: "-0.01em" }}>{title}</h2>
    <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function Privacy() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/"><img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 40, objectFit: "contain", cursor: "pointer" }} /></Link>
          <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al inicio</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>LEGAL</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#111827", marginTop: 8, marginBottom: 12, letterSpacing: "-0.02em" }}>Política de Privacidad</h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Última actualización: 1 de abril de 2025</p>
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: "48px 48px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

          <Section title="1. Responsable del Tratamiento">
            <p>De conformidad con el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos que el responsable del tratamiento de sus datos personales es:</p>
            <div style={{ background: "#f9fafb", borderRadius: 12, padding: "20px 24px", marginTop: 16 }}>
              <p><strong>Razón social:</strong> BuddyMarket S.L.</p>
              <p><strong>Email de contacto:</strong> privacidad@buddymarket.app</p>
              <p><strong>Delegado de Protección de Datos:</strong> dpo@buddymarket.app</p>
            </div>
          </Section>

          <Section title="2. Datos que Recopilamos">
            <p>BuddyMarket recopila los siguientes tipos de datos personales:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              {[
                { title: "Datos de identificación", items: ["Nombre y apellidos", "Dirección de correo electrónico", "Foto de perfil (opcional)"] },
                { title: "Datos de salud", items: ["Alergias e intolerancias", "Condiciones médicas declaradas", "Objetivos nutricionales", "Peso, altura, edad (opcional)"] },
                { title: "Datos de uso", items: ["Menús generados", "Recetas consultadas", "Diario nutricional", "Inventario del hogar"] },
                { title: "Datos técnicos", items: ["Dirección IP", "Tipo de navegador", "Datos de cookies", "Registros de acceso"] },
              ].map(cat => (
                <div key={cat.title} style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 20px" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 10 }}>{cat.title}</h4>
                  <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                    {cat.items.map(item => <li key={item} style={{ fontSize: 13, color: "#6b7280" }}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 16, fontWeight: 600, color: "#92400e", background: "#fff7ed", padding: "12px 16px", borderRadius: 8, border: "1px solid #fed7aa" }}>
              Los datos de salud (alergias, condiciones médicas) son considerados datos especialmente sensibles según el RGPD. Su tratamiento se basa en el consentimiento explícito del Usuario y es necesario para la prestación del servicio.
            </p>
          </Section>

          <Section title="3. Finalidad y Base Legal del Tratamiento">
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#374151", borderRadius: "8px 0 0 0" }}>Finalidad</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#374151" }}>Base legal</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#374151", borderRadius: "0 8px 0 0" }}>Plazo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Prestación del servicio", "Ejecución del contrato", "Duración de la cuenta"],
                  ["Personalización nutricional", "Consentimiento explícito", "Duración de la cuenta"],
                  ["Comunicaciones de servicio", "Interés legítimo", "Duración de la cuenta"],
                  ["Marketing y novedades", "Consentimiento", "Hasta revocación"],
                  ["Cumplimiento legal", "Obligación legal", "Según normativa"],
                  ["Mejora del servicio (IA)", "Interés legítimo", "3 años anonimizado"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="4. Derechos del Usuario">
            <p>El Usuario tiene derecho a ejercer los siguientes derechos en relación con sus datos personales:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
              {[
                { icon: "👁️", title: "Acceso", desc: "Conocer qué datos tenemos sobre ti" },
                { icon: "✏️", title: "Rectificación", desc: "Corregir datos inexactos o incompletos" },
                { icon: "🗑️", title: "Supresión", desc: "Solicitar la eliminación de tus datos" },
                { icon: "⏸️", title: "Limitación", desc: "Restringir el tratamiento de tus datos" },
                { icon: "📦", title: "Portabilidad", desc: "Recibir tus datos en formato estructurado" },
                { icon: "🚫", title: "Oposición", desc: "Oponerte a determinados tratamientos" },
              ].map(r => (
                <div key={r.title} style={{ background: "#f9fafb", borderRadius: 12, padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{r.desc}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 16 }}>Para ejercer cualquiera de estos derechos, puede enviar una solicitud a <a href="mailto:privacidad@buddymarket.app" style={{ color: ORANGE }}>privacidad@buddymarket.app</a> adjuntando copia de su documento de identidad. Responderemos en el plazo máximo de 30 días.</p>
            <p style={{ marginTop: 12 }}>También tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) en <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: ORANGE }}>www.aepd.es</a>.</p>
          </Section>

          <Section title="5. Transferencias Internacionales">
            <p>BuddyMarket puede transferir datos a proveedores de servicios ubicados fuera del Espacio Económico Europeo (EEE). En tales casos, nos aseguramos de que dichas transferencias se realicen con las garantías adecuadas, como cláusulas contractuales tipo aprobadas por la Comisión Europea.</p>
          </Section>

          <Section title="6. Seguridad de los Datos">
            <p>BuddyMarket implementa medidas técnicas y organizativas apropiadas para proteger sus datos personales contra el acceso no autorizado, la pérdida, la destrucción o la alteración. Entre estas medidas se incluyen:</p>
            <ul style={{ marginTop: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Cifrado de datos en tránsito mediante TLS/HTTPS.</li>
              <li>Cifrado de datos sensibles en reposo.</li>
              <li>Control de acceso basado en roles.</li>
              <li>Auditorías de seguridad periódicas.</li>
              <li>Política de contraseñas y autenticación segura.</li>
            </ul>
          </Section>

          <Section title="7. Contacto">
            <p>Para cualquier consulta sobre esta Política de Privacidad o el tratamiento de sus datos personales, puede contactar con nosotros en:</p>
            <ul style={{ marginTop: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>Email:</strong> privacidad@buddymarket.app</li>
              <li><strong>DPO:</strong> dpo@buddymarket.app</li>
            </ul>
          </Section>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/terms" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Términos y Condiciones →</Link>
          <Link href="/cookies" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Cookies →</Link>
        </div>
      </div>
    </div>
  );
}
