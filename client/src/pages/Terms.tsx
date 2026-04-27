import { useState } from "react";
import { Link } from "wouter";
const ORANGE = "#F97316";
const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-horizontal-orange_0dcbe0a8.png";

const Section = ({ id, number, title, children }: { id?: string; number: string; title: string; children: React.ReactNode }) => (
  <section id={id} style={{ marginBottom: 48 }}>
    <h2 style={{ fontSize: 21, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6", letterSpacing: "-0.01em", display: "flex", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: ORANGE, background: "#fff7ed", padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{number}</span>
      {title}
    </h2>
    <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.85 }}>{children}</div>
  </section>
);

const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ marginTop: 0, marginBottom: 14, ...style }}>{children}</p>
);

const Warning = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
    <p style={{ fontSize: 14, color: "#92400e", margin: 0, lineHeight: 1.7 }}>{children}</p>
  </div>
);

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div style={{ overflowX: "auto", marginBottom: 16 }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ background: "#f9fafb" }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ borderBottom: "1px solid #f3f4f6" }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: "10px 14px", color: "#374151", verticalAlign: "top" }} dangerouslySetInnerHTML={{ __html: cell }} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── TyC B2B ──────────────────────────────────────────────────────────────────
function TermsB2B() {
  const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <p style={{ marginTop: 0, marginBottom: 14, ...style }}>{children}</p>
  );
  const Info = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <p style={{ fontSize: 14, color: "#1e40af", margin: 0, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
  const WarnB2B = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <p style={{ fontSize: 14, color: "#92400e", margin: 0, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
  const TableB2B = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
    <div style={{ overflowX: "auto", marginBottom: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ background: "#f9fafb" }}>{headers.map((h, i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, ri) => <tr key={ri} style={{ borderBottom: "1px solid #f3f4f6" }}>{row.map((cell, ci) => <td key={ci} style={{ padding: "10px 14px", color: "#374151", verticalAlign: "top" }} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr>)}</tbody>
      </table>
    </div>
  );
  return (
    <>
      <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", borderRadius: 16, padding: "32px 40px", marginBottom: 48, border: "1px solid #bfdbfe" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#111827", marginBottom: 8, letterSpacing: "-0.02em" }}>Condiciones Generales de Contratación B2B</h1>
        <p style={{ fontSize: 16, color: "#6b7280", margin: 0 }}>Para empresas y organizaciones · Versión 1.0 — Entrada en vigor: 7 de abril de 2026</p>
      </div>
      <Section number="1" title="Partes del Contrato">
        <P>Las presentes Condiciones Generales de Contratación (CGC B2B) regulan la relación contractual entre <strong>BUDDY MARKET IA, S.L.</strong> (CIF B-56.819.576, Calle Villanueva 2, 3ºC, 28001, Madrid) como proveedor, y la empresa u organización que suscribe el Plan Empresarial de Buddy One (en adelante, «la Empresa») como cliente.</P>
        <P>La aceptación de estas CGC B2B se produce en el momento en que la Empresa completa el proceso de registro corporativo en la Plataforma o firma el correspondiente Contrato de Servicio.</P>
      </Section>
      <Section number="2" title="Objeto del Contrato">
        <P>Buddy One proporciona a la Empresa acceso a la plataforma de gestión nutricional corporativa, que incluye:</P>
        <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
          <li style={{ marginBottom: 8 }}>Licencias de usuario para los empleados de la Empresa (número según plan contratado)</li>
          <li style={{ marginBottom: 8 }}>Panel de administración corporativo para gestión de licencias, usuarios y reporting</li>
          <li style={{ marginBottom: 8 }}>Acceso a todas las funcionalidades del plan Pro Max para cada licencia activa</li>
          <li style={{ marginBottom: 8 }}>Soporte técnico prioritario con SLA garantizado</li>
          <li style={{ marginBottom: 8 }}>Informes de bienestar nutricional agregados y anonimizados</li>
          <li style={{ marginBottom: 8 }}>Integración con sistemas de RRHH mediante API (disponible en planes Enterprise)</li>
        </ul>
      </Section>
      <Section number="3" title="Planes y Precios Corporativos">
        <TableB2B headers={["Plan", "Licencias", "Precio por licencia/mes", "Facturación"]} rows={[
          ["Business Starter", "5–25", "9,99 €", "Mensual o anual (−15%)"],
          ["Business Pro", "26–100", "8,49 €", "Mensual o anual (−15%)"],
          ["Business Enterprise", "101–500", "6,99 €", "Anual obligatorio"],
          ["Enterprise Custom", "+500", "A negociar", "Anual con SLA personalizado"],
        ]} />
        <P>Los precios no incluyen IVA. La facturación se realiza por el número de licencias contratadas, independientemente de las licencias activas. Las licencias no utilizadas no generan derecho a crédito ni reembolso.</P>
        <Info>Para planes Enterprise Custom con más de 500 usuarios, contacta con nuestro equipo en <strong>empresas@buddyoneapp.com</strong> para una propuesta personalizada.</Info>
      </Section>
      <Section number="4" title="Gestión de Licencias">
        <P>La Empresa designará Administradores responsables de asignar y revocar licencias, gestionar el código de empresa y supervisar el uso. Cada licencia es personal e intransferible. La Empresa puede reasignar licencias entre empleados, pero no compartir una misma licencia entre varios usuarios simultáneamente.</P>
        <WarnB2B>La Empresa es responsable del uso que sus empleados hagan de la Plataforma. Buddy One se reserva el derecho de suspender licencias individuales o la cuenta corporativa completa en caso de uso fraudulento.</WarnB2B>
      </Section>
      <Section number="5" title="Privacidad y Protección de Datos (Entorno Corporativo)">
        <P>En el marco de la relación B2B, Buddy One actúa como <strong>Encargado del Tratamiento</strong> de los datos personales de los empleados de la Empresa, siendo la Empresa el <strong>Responsable del Tratamiento</strong>. Las partes suscribirán el correspondiente Acuerdo de Encargo de Tratamiento (DPA) conforme al artículo 28 del RGPD.</P>
        <P>Los informes de bienestar proporcionados a la Empresa son siempre <strong>agregados y anonimizados</strong>. Buddy One no proporcionará datos individuales de empleados a la Empresa sin el consentimiento expreso del empleado.</P>
        <P>Buddy One se compromete a notificar a la Empresa cualquier brecha de seguridad en un plazo máximo de 72 horas y a suprimir o devolver todos los datos al finalizar el contrato.</P>
      </Section>
      <Section number="6" title="Niveles de Servicio (SLA)">
        <TableB2B headers={["Plan", "Disponibilidad", "Respuesta soporte", "Resolución"]} rows={[
          ["Business Starter", "99,5%", "24h laborables", "72h laborables"],
          ["Business Pro", "99,7%", "8h laborables", "48h laborables"],
          ["Business Enterprise", "99,9%", "4h (24/7)", "24h"],
          ["Enterprise Custom", "99,99%", "1h (24/7)", "A negociar"],
        ]} />
        <P>En caso de incumplimiento del SLA, la Empresa tendrá derecho a un crédito de servicio del 10% de la factura mensual por cada punto porcentual de disponibilidad no alcanzado, con un máximo del 30%.</P>
      </Section>
      <Section number="7" title="Duración, Renovación y Resolución">
        <P>El contrato tiene una duración inicial de 12 meses para planes anuales o de 1 mes para planes mensuales, renovándose automáticamente salvo preaviso de 30 días. Causas de resolución inmediata: incumplimiento grave, impago de dos facturas consecutivas, concurso de acreedores o uso fraudulento.</P>
      </Section>
      <Section number="8" title="Confidencialidad">
        <P>Ambas partes se comprometen a mantener la confidencialidad de toda la información intercambiada durante la vigencia del contrato y por un período de 3 años tras su resolución.</P>
      </Section>
      <Section number="9" title="Ley Aplicable y Resolución de Disputas">
        <P>Las presentes CGC B2B se rigen por la legislación española. Las partes se someten a los Juzgados y Tribunales de Madrid. Antes de iniciar cualquier procedimiento judicial, las partes intentarán resolver la controversia mediante mediación en un plazo máximo de 60 días.</P>
        <p style={{ marginTop: 32, color: "#9ca3af", fontSize: 13 }}>Contacto B2B: empresas@buddyoneapp.com · BUDDY MARKET IA, S.L. · Calle Villanueva 2, 3ºC, 28001, Madrid</p>
      </Section>
    </>
  );
}

// ─── TyC Experts/Makers ───────────────────────────────────────────────────────
function TermsExperts() {
  const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <p style={{ marginTop: 0, marginBottom: 14, ...style }}>{children}</p>
  );
  const WarnE = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <p style={{ fontSize: 14, color: "#92400e", margin: 0, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
  const InfoE = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
      <p style={{ fontSize: 14, color: "#166534", margin: 0, lineHeight: 1.7 }}>{children}</p>
    </div>
  );
  const TableE = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
    <div style={{ overflowX: "auto", marginBottom: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ background: "#f9fafb" }}>{headers.map((h, i) => <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, ri) => <tr key={ri} style={{ borderBottom: "1px solid #f3f4f6" }}>{row.map((cell, ci) => <td key={ci} style={{ padding: "10px 14px", color: "#374151", verticalAlign: "top" }} dangerouslySetInnerHTML={{ __html: cell }} />)}</tr>)}</tbody>
      </table>
    </div>
  );
  return (
    <>
      <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: 16, padding: "32px 40px", marginBottom: 48, border: "1px solid #bbf7d0" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#111827", marginBottom: 8, letterSpacing: "-0.02em" }}>Términos para BuddyExperts y BuddyMakers</h1>
        <p style={{ fontSize: 16, color: "#6b7280", margin: 0 }}>Para expertos en nutrición y creadores de contenido · Versión 1.0 — Entrada en vigor: 7 de abril de 2026</p>
      </div>
      <Section number="1" title="Definiciones">
        <TableE headers={["Término", "Definición"]} rows={[
          ["BuddyExpert", "Profesional de la nutrición, dietética o salud verificado por Buddy One que ofrece servicios de consultoría y seguimiento personalizado a través de la Plataforma"],
          ["BuddyMaker", "Creador de contenido especializado en alimentación, recetas y nutrición que publica contenido en la Plataforma y puede monetizarlo"],
          ["Contenido", "Recetas, artículos, planes nutricionales, vídeos, imágenes y cualquier otro material publicado por el Creador en la Plataforma"],
          ["Comisión", "Porcentaje de los ingresos generados que Buddy One retiene en concepto de servicio de plataforma"],
        ]} />
      </Section>
      <Section number="2" title="Requisitos para BuddyExperts">
        <P>Para obtener la verificación como BuddyExpert, el profesional debe acreditar: titulación universitaria en Nutrición Humana y Dietética, Medicina, Farmacia o equivalente; colegiación vigente cuando sea obligatoria; seguro de responsabilidad civil profesional con cobertura mínima de 300.000 €; y aceptación del Código Deontológico de Buddy One para Profesionales de la Salud.</P>
        <WarnE>Buddy One se reserva el derecho de verificar la autenticidad de la documentación y de revocar la verificación si el profesional pierde los requisitos habilitantes.</WarnE>
      </Section>
      <Section number="3" title="Requisitos para BuddyMakers">
        <P>Para registrarse como BuddyMaker, el creador debe ser mayor de 18 años, disponer de cuenta bancaria válida, aceptar las Directrices de Contenido y comprometerse a publicar contenido original y de calidad.</P>
        <InfoE>Los BuddyMakers no están obligados a tener titulación en nutrición, pero deben indicar claramente que no son profesionales de la salud cuando publiquen contenido nutricional.</InfoE>
      </Section>
      <Section number="4" title="Modelo de Monetización y Comisiones">
        <TableE headers={["Mecanismo", "Descripción", "Comisión Buddy One"]} rows={[
          ["Consultas individuales", "Sesiones de consultoría nutricional con usuarios (solo BuddyExperts)", "20%"],
          ["Planes nutricionales", "Venta de planes personalizados o genéricos", "20%"],
          ["Recetas premium", "Recetas de pago accesibles a usuarios con suscripción", "15%"],
          ["Código de referido", "Comisión por usuarios que se suscriban usando el código del Creador", "20% del primer año"],
          ["Contenido patrocinado", "Publicaciones patrocinadas por marcas (previa aprobación de Buddy One)", "10%"],
        ]} />
        <P>Los pagos se realizan mensualmente el día 15 del mes siguiente, siempre que el saldo acumulado supere los 50 €. El Creador es responsable de declarar estos ingresos a la Agencia Tributaria.</P>
      </Section>
      <Section number="5" title="Derechos y Licencias sobre el Contenido">
        <P>El Creador conserva la titularidad de los derechos de propiedad intelectual sobre el Contenido. Al publicarlo, concede a Buddy One una licencia no exclusiva, gratuita y mundial para reproducirlo, distribuirlo y utilizarlo con fines de mejora de la Plataforma, siempre citando al Creador. Esta licencia se extingue cuando el Creador elimina el Contenido.</P>
      </Section>
      <Section number="6" title="Obligaciones del Creador">
        <P>El Creador se compromete a: publicar únicamente contenido original y veraz; no publicar información nutricional falsa o perjudicial; indicar claramente el contenido publicitario; respetar los derechos de propiedad intelectual de terceros; responder a consultas en máximo 48 horas (BuddyExperts); y no redirigir usuarios a plataformas externas para eludir comisiones.</P>
      </Section>
      <Section number="7" title="Responsabilidad Profesional (BuddyExperts)">
        <WarnE><strong>RESPONSABILIDAD PROFESIONAL:</strong> Los BuddyExperts son los únicos responsables del consejo nutricional que proporcionan. Buddy One actúa exclusivamente como plataforma de intermediación y no asume responsabilidad por el contenido de las consultas ni por los resultados obtenidos.</WarnE>
        <P>Los BuddyExperts deben mantener en vigor su seguro de responsabilidad civil durante toda su actividad y proporcionar copia actualizada anualmente.</P>
      </Section>
      <Section number="8" title="Moderación y Suspensión de Contenido">
        <P>Buddy One se reserva el derecho de revisar, modificar, suspender o eliminar cualquier Contenido que infrinja estas condiciones, contenga información nutricional falsa, sea objeto de reclamaciones de propiedad intelectual o incumpla las Directrices de Contenido.</P>
      </Section>
      <Section number="9" title="Duración y Resolución">
        <P>La relación tiene carácter indefinido y puede resolverse por cualquiera de las partes con un preaviso de 30 días. Buddy One podrá resolver de forma inmediata en caso de incumplimiento grave, especialmente si el Creador publica información que ponga en riesgo la salud de los usuarios.</P>
        <p style={{ marginTop: 32, color: "#9ca3af", fontSize: 13 }}>Contacto Creadores: creadores@buddyoneapp.com · BUDDY MARKET IA, S.L. · Calle Villanueva 2, 3ºC, 28001, Madrid</p>
      </Section>
    </>
  );
}

export default function Terms() {
  const [activeTab, setActiveTab] = useState<"usuarios" | "b2b" | "experts">("usuarios");
  const tabs = [
    { id: "usuarios" as const, label: "Usuarios", icon: "👤", color: "#F97316" },
    { id: "b2b" as const, label: "Empresas B2B", icon: "🏢", color: "#3B82F6" },
    { id: "experts" as const, label: "BuddyExperts & Makers", icon: "⭐", color: "#10B981" },
  ];
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/"><img src={LOGO_COLOR} alt="Buddy One" style={{ height: 60, objectFit: "contain", cursor: "pointer" }} /></Link>
          <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al inicio</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        {/* Selector de tipo de TyC */}
        <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12, border: "2px solid", borderColor: activeTab === tab.id ? tab.color : "#e5e7eb", background: activeTab === tab.id ? tab.color : "white", color: activeTab === tab.id ? "white" : "#374151", fontWeight: 700, fontSize: 15, cursor: "pointer", transition: "all 0.2s" }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Contenido B2B y Experts */}
        {activeTab === "b2b" && <TermsB2B />}
        {activeTab === "experts" && <TermsExperts />}
        {activeTab === "usuarios" && <div style={{ background: "white", borderRadius: 20, padding: "48px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>LEGAL</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#111827", marginTop: 8, marginBottom: 8, letterSpacing: "-0.02em" }}>Términos y Condiciones de Uso</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>Versión 2.0 — Fecha de entrada en vigor: 7 de abril de 2026</p>

          <Warning>
            <strong>⚕️ Aviso importante sobre salud:</strong> Los servicios de Buddy One tienen carácter <strong>exclusivamente informativo y orientativo</strong>. No constituyen consejo médico, diagnóstico clínico, prescripción dietética ni tratamiento terapéutico. Consulta siempre con un médico o nutricionista-dietista colegiado antes de realizar cambios significativos en tu alimentación, especialmente si padeces enfermedades crónicas, alergias graves, trastornos alimentarios, o si estás embarazada o en período de lactancia.
          </Warning>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>
              <strong>Empresa titular:</strong> BUDDY MARKET IA, S.L. · CIF B-56.819.576 · Calle Villanueva 2, 3ºC, 28001, Madrid (España) · <a href="mailto:info@buddyoneapp.com" style={{ color: "#166534" }}>info@buddyoneapp.com</a>
            </p>
          </div>
        </div>

        {/* Table of contents */}
        <div style={{ background: "white", borderRadius: 16, padding: "24px 28px", marginBottom: 40, border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Índice</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "6px 24px" }}>
            {[
              ["1", "Objeto de la plataforma"],
              ["2", "Aceptación de los Términos"],
              ["3", "Registro y cuenta de usuario"],
              ["4", "Planes de suscripción y pagos"],
              ["5", "Datos de salud y perfil nutricional"],
              ["6", "Exención de responsabilidad"],
              ["7", "Obligaciones de Buddy One"],
              ["8", "Obligaciones de los Usuarios"],
              ["9", "Confidencialidad"],
              ["10", "Protección de datos personales"],
              ["11", "Cookies"],
              ["12", "Propiedad intelectual"],
              ["13", "Modificación de los Términos"],
              ["14", "Duración y terminación"],
              ["15", "Responsabilidad"],
              ["16", "Miscelánea"],
              ["17", "Ley aplicable y jurisdicción"],
            ].map(([n, t]) => (
              <a key={n} href={`#section-${n}`} style={{ fontSize: 13, color: "#374151", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ORANGE, background: "#fff7ed", padding: "1px 7px", borderRadius: 10, flexShrink: 0 }}>{n}</span>
                {t}
              </a>
            ))}
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: "48px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

          <Section id="section-1" number="1" title="Objeto de la plataforma">
            <P>BUDDYMARKET es una plataforma de gestión nutricional inteligente que combina inteligencia artificial, datos de salud personalizados y una comunidad de expertos para ayudar a los usuarios a mejorar su alimentación, optimizar sus compras en supermercados y alcanzar sus objetivos de salud y bienestar.</P>
            <P>Los servicios ofrecidos incluyen, de forma enunciativa pero no limitativa:</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8, marginTop: 16 }}>Servicios de Nutrición e Inteligencia Artificial</p>
            <ul style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <li>Generación de planes de menú semanales personalizados mediante IA, basados en el perfil nutricional, objetivos de salud, alergias, intolerancias y preferencias del Usuario.</li>
              <li>Asistente nutricional conversacional (BuddyIA) para preguntas sobre nutrición, análisis de alimentos y recomendaciones dietéticas.</li>
              <li>Registro y seguimiento del diario alimentario (MealLog) con análisis nutricional automático.</li>
              <li>Seguimiento del progreso nutricional, evolución del peso y estadísticas de salud.</li>
              <li>Biblioteca de recetas con filtros por dieta, tiempo de preparación e ingredientes.</li>
              <li>Generación de menús para eventos especiales y dietas terapéuticas.</li>
            </ul>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>Servicios de Compra Inteligente</p>
            <ul style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <li>Generación automática de listas de la compra basadas en los menús planificados.</li>
              <li>Comparación de precios en supermercados integrados (Mercadona, Carrefour, Lidl, Consum, HiperDino y otros).</li>
              <li>Gestión del inventario doméstico con alertas de caducidad y sugerencias de uso.</li>
              <li>Escáner de códigos de barras para añadir productos al inventario.</li>
            </ul>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>Servicios de Comunidad y Expertos</p>
            <ul style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <li>Acceso a planes nutricionales elaborados por nutricionistas y expertos certificados (BuddyExperts).</li>
              <li>Plataforma para que profesionales de la nutrición y el bienestar (BuddyExperts y BuddyMakers) publiquen y comercialicen sus planes.</li>
              <li>Sistema de logros y gamificación para motivar la adherencia a los objetivos nutricionales.</li>
            </ul>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>Servicios de Salud Conectada</p>
            <ul style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Integración con dispositivos y aplicaciones de salud para enriquecer el perfil nutricional.</li>
              <li>Notificaciones personalizadas de comidas y recordatorios nutricionales.</li>
            </ul>
          </Section>

          <Section id="section-2" number="2" title="Aceptación de los Términos y Condiciones">
            <P>El acceso y uso de la Plataforma implica la aceptación plena, sin reservas, de los presentes Términos. Si el Usuario no está de acuerdo con alguna de las disposiciones aquí contenidas, deberá abstenerse de utilizar la Plataforma.</P>
            <P>El servicio se rige por: (i) los presentes Términos; (ii) la Política de Privacidad de BUDDYMARKET; (iii) la Política de Cookies; (iv) las condiciones particulares de cada servicio o suscripción; y (v) la legislación española y europea vigente.</P>
            <P>Al aceptar los presentes Términos, el Usuario declara ser mayor de 18 años o contar con la autorización expresa de sus padres o tutores legales, quienes asumen plena responsabilidad por el uso que realice el menor. BUDDYMARKET queda exonerada de toda responsabilidad derivada del incumplimiento de esta condición.</P>
            <P>La aceptación de los presentes Términos queda registrada con marca de tiempo en los sistemas de BUDDYMARKET, junto con la versión aceptada, a efectos de prueba y cumplimiento normativo.</P>
          </Section>

          <Section id="section-3" number="3" title="Registro y cuenta de usuario">
            <P>El acceso a los servicios de BUDDYMARKET requiere el registro previo mediante la creación de una cuenta personal. El Usuario podrá registrarse mediante correo electrónico y contraseña, o a través de proveedores de identidad externos (Google Sign-In, Sign in with Apple), cuyo uso queda sujeto a los términos y condiciones de dichos proveedores.</P>
            <P>El Usuario se compromete a proporcionar información veraz, actualizada y completa durante el registro, y a mantenerla actualizada. La cuenta es personal e intransferible. El Usuario es el único responsable de la confidencialidad de sus credenciales y de todas las actividades realizadas bajo su cuenta. Cualquier uso no autorizado deberá ser notificado de inmediato a BUDDYMARKET en <a href="mailto:info@buddyoneapp.com" style={{ color: ORANGE }}>info@buddyoneapp.com</a>.</P>
            <P>BUDDYMARKET se reserva el derecho de suspender o cancelar cuentas en caso de incumplimiento de los presentes Términos, uso fraudulento, suplantación de identidad o cualquier conducta contraria a la ley o a los intereses de la comunidad.</P>
            <P>La Plataforma ofrece los siguientes tipos de cuenta:</P>
            <ul style={{ paddingLeft: 22, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>Usuario estándar:</strong> Acceso a las funcionalidades según el plan de suscripción contratado.</li>
              <li><strong>BuddyMaker:</strong> Creadores de contenido nutricional. Requiere solicitud y aprobación previa por BUDDYMARKET.</li>
              <li><strong>BuddyExpert:</strong> Profesionales de la nutrición y la salud. Requiere acreditación de titulación oficial y aprobación por BUDDYMARKET.</li>
            </ul>
          </Section>

          <Section id="section-4" number="4" title="Planes de suscripción y condiciones de pago">
            <P>BUDDYMARKET ofrece los siguientes planes de suscripción mensual:</P>
            <Table
              headers={["Plan", "Precio mensual (IVA incl.)", "Descripción"]}
              rows={[
                ["<strong>Buddy One Basic</strong>", "4,99 €/mes", "Acceso a funcionalidades esenciales: recetas, listas de la compra, menús básicos y BuddyIA limitada"],
                ["<strong>Buddy One Premium</strong>", "9,99 €/mes", "Acceso completo: menús IA avanzados, comparación de supermercados, inventario, seguimiento nutricional y BuddyIA ilimitada"],
                ["<strong>Buddy One Pro Max</strong>", "19,99 €/mes", "Todo lo anterior más acceso prioritario a BuddyExperts, planes de expertos incluidos, soporte prioritario y funcionalidades avanzadas de salud conectada"],
              ]}
            />
            <P>Los precios están expresados en euros e incluyen el IVA aplicable. BUDDYMARKET se reserva el derecho de modificar los precios con un preaviso mínimo de 30 días.</P>
            <P>El pago se realiza mediante tarjeta de crédito o débito a través de <strong>Stripe</strong> (certificado PCI DSS). En dispositivos iOS, el pago puede realizarse a través de <strong>Apple In-App Purchase</strong> (App Store), sujeto a los términos de Apple. En dispositivos Android, a través de <strong>Google Play Billing</strong>, sujeto a los términos de Google.</P>
            <P>La suscripción se renueva automáticamente al final de cada período mensual salvo cancelación con al menos 24 horas de antelación al vencimiento. La cancelación puede realizarse desde la sección "Mi suscripción" del perfil, o a través de la tienda de aplicaciones correspondiente.</P>
            <P>En caso de impago, BUDDYMARKET podrá suspender el acceso a los servicios de pago de forma inmediata. Los planes adquiridos a través de BuddyExperts se facturan de forma independiente y su precio es fijado por cada experto.</P>
          </Section>

          <Section id="section-5" number="5" title="Tratamiento de datos de salud y perfil nutricional">
            <Warning>
              <strong>⚕️ Datos de salud de categoría especial:</strong> BUDDYMARKET trata datos especialmente sensibles relacionados con la salud de los Usuarios. Estos datos son tratados con la máxima confidencialidad y protección, conforme al RGPD y la LOPDGDD. El tratamiento se realiza exclusivamente sobre la base del consentimiento explícito del Usuario.
            </Warning>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>5.1 Tipos de datos de salud tratados</p>
            <P>Los datos de salud que BUDDYMARKET puede tratar incluyen, entre otros: peso corporal, altura, índice de masa corporal, porcentaje de grasa corporal, objetivos de peso, condiciones médicas, alergias e intolerancias alimentarias, medicación que afecta al metabolismo, historial quirúrgico, antecedentes familiares de enfermedades, patrón dietético, hábitos de sueño, nivel de estrés, consumo de alcohol y tabaco, y datos de actividad física.</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>5.2 Finalidad del tratamiento</p>
            <P>Los datos de salud se utilizan exclusivamente para: (i) personalizar los planes nutricionales y las recomendaciones de la IA; (ii) generar menús adaptados a las necesidades del Usuario; (iii) calcular los requerimientos calóricos y nutricionales; (iv) realizar el seguimiento del progreso; y (v) mejorar los algoritmos de personalización de forma anonimizada y agregada.</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>5.3 Base legal y revocación del consentimiento</p>
            <P>El tratamiento se realiza sobre la base del <strong>consentimiento explícito</strong> del Usuario, otorgado en el momento del registro y de la cumplimentación del perfil nutricional. El Usuario puede revocar este consentimiento en cualquier momento desde la sección "Privacidad y datos" de su perfil, lo que implicará la eliminación de su perfil nutricional y la imposibilidad de acceder a los servicios personalizados.</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>5.4 Compartición con BuddyExperts</p>
            <P>Si el Usuario contrata los servicios de un BuddyExpert, autoriza expresamente que dicho experto pueda acceder a los datos de su perfil nutricional necesarios para la prestación del servicio. Esta autorización puede revocarse en cualquier momento desde la configuración de la cuenta.</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>5.5 Derechos del Usuario sobre sus datos de salud</p>
            <P>El Usuario tiene derecho a acceder, rectificar, suprimir, limitar el tratamiento, oponerse al mismo y solicitar la portabilidad de sus datos de salud. Para ejercer estos derechos, puede enviar un correo a <a href="mailto:info@buddyoneapp.com" style={{ color: ORANGE }}>info@buddyoneapp.com</a> adjuntando copia de su documento de identidad, o dirigirse por escrito a Calle Villanueva 2, 3ºC, 28001, Madrid. También puede presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: ORANGE }}>Agencia Española de Protección de Datos</a>.</P>
          </Section>

          <Section id="section-6" number="6" title="Exención de responsabilidad">
            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>6.1 Carácter informativo y no médico de los servicios</p>
            <Warning>
              <strong>AVISO IMPORTANTE:</strong> Los servicios de BUDDYMARKET tienen carácter <strong>exclusivamente informativo y orientativo</strong>, y no constituyen en ningún caso consejo médico, diagnóstico clínico, prescripción dietética ni tratamiento terapéutico. Las recomendaciones nutricionales generadas por la inteligencia artificial se basan en los datos proporcionados por el Usuario y en principios generales de nutrición, pero <strong>no sustituyen la consulta con un médico, dietista-nutricionista colegiado u otro profesional sanitario cualificado</strong>.<br /><br />
              BUDDYMARKET recomienda expresamente consultar con un profesional de la salud antes de realizar cambios significativos en la dieta, especialmente en caso de enfermedades crónicas, trastornos alimentarios, embarazo, lactancia o cualquier situación que requiera supervisión médica.<br /><br />
              <strong>BUDDYMARKET NO ASUME NINGUNA RESPONSABILIDAD</strong> por los daños o perjuicios que puedan derivarse del seguimiento de las recomendaciones nutricionales sin supervisión profesional adecuada.
            </Warning>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>6.2 Limitación de responsabilidad de la IA</p>
            <P>Los planes nutricionales, recetas y recomendaciones generados por BuddyIA se producen de forma automatizada y pueden contener errores, imprecisiones o información desactualizada. BUDDYMARKET no garantiza la exactitud, completitud o idoneidad de los contenidos generados por IA para las circunstancias particulares de cada Usuario.</P>
            <P>BUDDYMARKET no será responsable de ningún daño derivado de: (i) errores en los contenidos generados por IA; (ii) interpretaciones incorrectas de las recomendaciones; (iii) reacciones adversas a alimentos o dietas seguidas sin supervisión médica; (iv) interacciones entre alimentos y medicamentos no detectadas por el sistema.</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>6.3 Exención de responsabilidad por proveedores externos</p>
            <P>BUDDYMARKET utiliza servicios de terceros para la prestación de sus funcionalidades, incluyendo OpenAI (modelos de lenguaje), Stripe (pagos), Apple (App Store y IAP), Google (Google Play y Sign-In), y proveedores de datos de supermercados. BUDDYMARKET no será responsable de las interrupciones, fallos, cambios de política o prohibiciones legales que afecten a dichos servicios externos, incluyendo pero no limitándose a: interrupciones del servicio de OpenAI; cambios en las políticas de App Store o Google Play; indisponibilidad de datos de precios de supermercados; o fallos en el procesamiento de pagos.</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>6.4 Exención de responsabilidad por contenidos de BuddyExperts y BuddyMakers</p>
            <P>Los planes nutricionales, contenidos y servicios ofrecidos por los BuddyExperts y BuddyMakers son responsabilidad exclusiva de dichos profesionales. BUDDYMARKET actúa como plataforma intermediaria y no valida ni certifica el contenido específico de cada plan, aunque sí verifica las credenciales básicas de los expertos. El Usuario asume el riesgo de seguir planes de expertos sin supervisión médica adicional.</P>

            <p style={{ fontWeight: 700, color: "#111827", marginBottom: 8 }}>6.5 Disponibilidad del servicio</p>
            <P>BUDDYMARKET no garantiza la disponibilidad ininterrumpida de la Plataforma. El servicio puede verse interrumpido por razones de mantenimiento, actualizaciones, fallos técnicos o causas de fuerza mayor. BUDDYMARKET informará de las interrupciones planificadas con la mayor antelación posible.</P>
          </Section>

          <Section id="section-7" number="7" title="Obligaciones de Buddy One">
            <P>BUDDYMARKET se compromete a: (i) mantener la Plataforma operativa y accesible en condiciones normales de uso; (ii) proteger la seguridad e integridad de los datos de los Usuarios mediante medidas técnicas y organizativas adecuadas (Helmet.js, HTTPS, cifrado, rate limiting); (iii) cumplir con la normativa de protección de datos aplicable; (iv) proporcionar soporte al Usuario a través de <a href="mailto:info@buddyoneapp.com" style={{ color: ORANGE }}>info@buddyoneapp.com</a>; (v) notificar con antelación razonable cualquier modificación sustancial de los Términos o de los precios; y (vi) activar la suscripción en un plazo razonable tras la confirmación del pago.</P>
          </Section>

          <Section id="section-8" number="8" title="Obligaciones de los Usuarios">
            <P>El Usuario se compromete a: (i) proporcionar información veraz y actualizada en su perfil; (ii) no utilizar la Plataforma para fines ilícitos o contrarios a los presentes Términos; (iii) no reproducir, distribuir ni comercializar los contenidos de la Plataforma sin autorización expresa; (iv) no intentar acceder a sistemas o datos de otros Usuarios; (v) no utilizar la Plataforma para difundir contenidos ofensivos, engañosos o que vulneren derechos de terceros; (vi) abonar puntualmente las tarifas de suscripción; y (vii) notificar de inmediato cualquier uso no autorizado de su cuenta.</P>
          </Section>

          <Section id="section-9" number="9" title="Confidencialidad">
            <P>Toda la información intercambiada entre BUDDYMARKET y el Usuario en el contexto de la prestación de los servicios tiene carácter confidencial. El Usuario se compromete a no divulgar a terceros las credenciales de acceso, los contenidos de los planes nutricionales adquiridos a BuddyExperts ni cualquier otra información marcada como confidencial por BUDDYMARKET.</P>
            <P>Los datos de carácter personal del Usuario y, en particular, los datos de salud, son considerados información especialmente confidencial y serán tratados con las máximas medidas de seguridad técnicas y organizativas disponibles.</P>
          </Section>

          <Section id="section-10" number="10" title="Protección de datos personales">
            <P>Los datos personales del Usuario son tratados por BUDDY MARKET IA, S.L. como responsable del tratamiento, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD). Los datos se almacenan en servidores seguros y se conservan durante el tiempo necesario para la prestación de los servicios y el cumplimiento de las obligaciones legales.</P>
            <P>La información detallada sobre el tratamiento de datos, las finalidades, las bases legales, los plazos de conservación y los derechos del Usuario se encuentra en la <Link href="/privacy" style={{ color: ORANGE, fontWeight: 600 }}>Política de Privacidad</Link> de BUDDYMARKET.</P>
            <P>Para cualquier consulta sobre protección de datos, el Usuario puede dirigirse a <a href="mailto:info@buddyoneapp.com" style={{ color: ORANGE }}>info@buddyoneapp.com</a> o por escrito a Calle Villanueva 2, 3ºC, 28001, Madrid. También puede presentar una reclamación ante la <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: ORANGE }}>Agencia Española de Protección de Datos</a>.</P>
          </Section>

          <Section id="section-11" number="11" title="Cookies">
            <P>BUDDYMARKET utiliza cookies y tecnologías similares para el funcionamiento de la Plataforma, el análisis de uso y la personalización de la experiencia. El Usuario puede gestionar sus preferencias de cookies en cualquier momento desde la sección "Preferencias de cookies" de su perfil o desde el banner de cookies que aparece en el primer acceso.</P>
            <P>La información detallada sobre el uso de cookies se encuentra en la <Link href="/cookies" style={{ color: ORANGE, fontWeight: 600 }}>Política de Cookies</Link>.</P>
          </Section>

          <Section id="section-12" number="12" title="Propiedad intelectual e industrial">
            <P>BUDDYMARKET es titular o cesionaria de todos los derechos de propiedad intelectual e industrial sobre la Plataforma, incluyendo el código fuente, diseño, logotipos, marcas, nombres de dominio, algoritmos de IA, bases de datos y contenidos propios. Ninguna disposición de los presentes Términos implica cesión de dichos derechos al Usuario.</P>
            <P>El Usuario tiene prohibida la reproducción, distribución, ingeniería inversa, descompilación o cualquier otra explotación no autorizada de los elementos de la Plataforma.</P>
            <P>Los contenidos generados por el Usuario (recetas propias, notas personales) son propiedad del Usuario, quien otorga a BUDDYMARKET una licencia no exclusiva, gratuita y mundial para utilizarlos con el fin de mejorar los servicios de la Plataforma, siempre de forma anonimizada.</P>
          </Section>

          <Section id="section-13" number="13" title="Modificación de los Términos">
            <P>BUDDYMARKET se reserva el derecho de modificar los presentes Términos en cualquier momento. Las modificaciones serán notificadas al Usuario con al menos 30 días de antelación mediante correo electrónico y/o notificación en la Plataforma. El uso continuado de la Plataforma tras la entrada en vigor de las modificaciones implica la aceptación de las mismas. Si el Usuario no acepta las modificaciones, podrá cancelar su cuenta antes de la fecha de entrada en vigor.</P>
          </Section>

          <Section id="section-14" number="14" title="Duración y terminación">
            <P>La relación contractual entre BUDDYMARKET y el Usuario se mantiene mientras el Usuario tenga una cuenta activa. El Usuario puede solicitar la eliminación de su cuenta en cualquier momento desde la sección "Cuenta" de su perfil. La eliminación conlleva la cancelación de la suscripción activa (sin derecho a reembolso por el período en curso, salvo lo dispuesto en la normativa de consumidores), la eliminación de los datos personales conforme a la Política de Privacidad, y la pérdida de acceso a todos los servicios.</P>
            <P>BUDDYMARKET puede suspender o cancelar la cuenta de un Usuario en caso de incumplimiento de los presentes Términos, con o sin previo aviso dependiendo de la gravedad del incumplimiento.</P>
          </Section>

          <Section id="section-15" number="15" title="Responsabilidad">
            <P>Los Usuarios mantendrán indemne a BUDDYMARKET frente a cualquier reclamación, sanción o daño derivado del incumplimiento de los presentes Términos, del uso indebido de la Plataforma o de la vulneración de derechos de terceros.</P>
            <P>La responsabilidad total de BUDDYMARKET frente al Usuario, por cualquier concepto, no podrá superar en ningún caso el importe abonado por el Usuario en los 12 meses anteriores al hecho generador de la responsabilidad.</P>
          </Section>

          <Section id="section-16" number="16" title="Miscelánea">
            <P>Si alguna disposición de los presentes Términos fuera declarada nula o inaplicable, el resto de los Términos mantendrá su plena vigencia. La versión en español de los presentes Términos prevalecerá sobre cualquier traducción en caso de discrepancia.</P>
            <P>En virtud del Reglamento (UE) nº 524/2013, los Usuarios residentes en la Unión Europea pueden acudir a la Plataforma Online de Resolución de Conflictos de la Comisión Europea: <a href="http://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: ORANGE }}>http://ec.europa.eu/consumers/odr/</a></P>
          </Section>

          <Section id="section-17" number="17" title="Ley aplicable y jurisdicción">
            <P>Los presentes Términos se rigen por la legislación española. Para la resolución de cualquier controversia derivada de la interpretación, ejecución o validez de los presentes Términos, las partes se someten a los Juzgados y Tribunales del domicilio del Usuario consumidor, conforme a la normativa de protección de consumidores vigente.</P>
          </Section>

          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 24, marginTop: 8 }}>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              <strong>BUDDY MARKET IA, S.L.</strong> · CIF B-56.819.576 · Calle Villanueva 2, 3ºC, 28001, Madrid ·{" "}
              <a href="mailto:info@buddyoneapp.com" style={{ color: ORANGE }}>info@buddyoneapp.com</a>
              <br />Versión 2.0 — Fecha de entrada en vigor: 7 de abril de 2026
            </p>
          </div>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Privacidad →</Link>
          <Link href="/cookies" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Cookies →</Link>
        </div>
        </div>}
      </div>
    </div>
  );
}
