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

export default function AvisoLegal() {
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
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>LEGAL</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#111827", marginTop: 8, marginBottom: 12, letterSpacing: "-0.02em" }}>
            Aviso Legal
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Última actualización: 30 de mayo de 2026</p>
          <div style={{ marginTop: 20, padding: "16px 20px", background: "#fff7ed", borderRadius: 12, border: "1px solid #fed7aa" }}>
            <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
              <strong>En cumplimiento de:</strong> Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), Art. 10.
            </p>
          </div>
        </div>

        <Section title="1. Datos Identificativos del Titular">
          <P>En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se facilitan los siguientes datos:</P>
          <table style={{ width: "100%", borderCollapse: "collapse", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", marginTop: 16 }}>
            <tbody>
              {[
                ["Denominación social", "BUDDY MARKET IA, S.L."],
                ["Nombre comercial", "Buddy One"],
                ["CIF", "B-56.819.576"],
                ["Domicilio social", "Calle Villanueva 2, Esc. 3, 3ºC, 28001 Madrid (España)"],
                ["Email de contacto", "info@buddyoneapp.com"],
                ["Sitio web", "www.buddyoneapp.com"],
                ["Registro Mercantil", "Inscrita en el Registro Mercantil de Madrid"],
                ["Actividad (CNAE 6210)", "Diseño, desarrollo, implementación y mantenimiento de software y tecnologías de la información, en especial sistemas de asistencia de compras basados en inteligencia artificial"],
              ].map(([label, value], i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#111827", background: "#f9fafb", width: "35%" }}>{label}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="2. Objeto del Sitio Web">
          <P>El presente sitio web (www.buddyoneapp.com y sus subdominios) tiene por objeto poner a disposición de los usuarios información sobre los servicios ofrecidos por BUDDY MARKET IA, S.L., así como facilitar el acceso a la plataforma Buddy One y sus módulos asociados:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            <li><strong>BuddyIA:</strong> Generación de menús nutricionales personalizados mediante inteligencia artificial.</li>
            <li><strong>Buddy Market:</strong> Generación automática de listas de la compra.</li>
            <li><strong>Buddy Care:</strong> Tienda de suplementos nutricionales con recomendaciones personalizadas.</li>
            <li><strong>Buddy Shop:</strong> Marketplace de utensilios de cocina.</li>
            <li><strong>Buddy Coach:</strong> Acceso a entrenadores personales certificados.</li>
            <li><strong>Buddy Experts:</strong> Consultas con nutricionistas certificados.</li>
            <li><strong>Buddy Pets:</strong> Nutrición personalizada para mascotas.</li>
          </ul>
        </Section>

        <Section title="3. Condiciones de Uso">
          <P>El acceso y uso del sitio web atribuye la condición de Usuario e implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal, así como en la <Link href="/privacy" style={{ color: ORANGE }}>Política de Privacidad</Link>, la <Link href="/cookies" style={{ color: ORANGE }}>Política de Cookies</Link> y los <Link href="/terms" style={{ color: ORANGE }}>Términos y Condiciones</Link>.</P>
          <P>El Usuario se compromete a:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Hacer un uso adecuado y lícito del sitio web y sus contenidos, conforme a la legislación vigente.</li>
            <li>No realizar actividades que puedan dañar, inutilizar, sobrecargar o deteriorar el sitio web o impedir su normal utilización.</li>
            <li>No introducir o difundir virus informáticos o cualesquiera otros sistemas que puedan causar daños.</li>
            <li>No intentar acceder a áreas restringidas del sitio web sin autorización.</li>
            <li>No suplantar la identidad de otros usuarios.</li>
          </ul>
        </Section>

        <Section title="4. Propiedad Intelectual e Industrial">
          <P>Todos los contenidos del sitio web, incluyendo a título enunciativo pero no limitativo: textos, fotografías, gráficos, imágenes, iconos, tecnología, software, código fuente, algoritmos de inteligencia artificial, bases de datos, diseño gráfico, logotipos, marcas y nombres comerciales, son propiedad de BUDDY MARKET IA, S.L. o de sus legítimos titulares, y están protegidos por las leyes de propiedad intelectual e industrial.</P>
          <P>Quedan expresamente prohibidas:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>La reproducción, distribución o transformación de los contenidos sin autorización expresa y por escrito.</li>
            <li>La utilización de técnicas de ingeniería inversa sobre el software o algoritmos de la plataforma.</li>
            <li>La extracción y/o reutilización de la base de datos de recetas, menús o perfiles nutricionales.</li>
            <li>El uso de marcas, logotipos o signos distintivos sin autorización previa.</li>
          </ul>
          <P style={{ marginTop: 12 }}>Las marcas registradas incluyen: "Buddy One", "BuddyIA", "Buddy Market", "Buddy Care", "Buddy Shop", "Buddy Coach", "Buddy Experts", "Buddy Pets" y "BuddyMakers".</P>
        </Section>

        <Section title="5. Exclusión de Responsabilidad">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 16, marginBottom: 12 }}>5.1. Contenido nutricional</h3>
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: "16px 20px", border: "1px solid #fecaca", marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: "#991b1b", margin: 0, fontWeight: 600 }}>
              La información y recomendaciones proporcionadas por Buddy One tienen carácter meramente orientativo y NO constituyen asesoramiento médico, nutricional ni profesional. Consulte siempre con un profesional de la salud cualificado antes de realizar cambios significativos en su dieta o estilo de vida.
            </p>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>5.2. Disponibilidad del servicio</h3>
          <P>BUDDY MARKET IA, S.L. no garantiza la disponibilidad ininterrumpida del servicio y no será responsable de los daños derivados de interrupciones, fallos técnicos, virus informáticos o desconexiones en las redes de telecomunicaciones.</P>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>5.3. Enlaces a terceros</h3>
          <P>El sitio web puede contener enlaces a sitios web de terceros (supermercados, tiendas de suplementos, proveedores de utensilios). BUDDY MARKET IA, S.L. no se responsabiliza del contenido, políticas de privacidad ni prácticas de dichos sitios externos.</P>

          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginTop: 24, marginBottom: 12 }}>5.4. Inteligencia artificial</h3>
          <P>Los menús, recomendaciones y sugerencias generados por los algoritmos de IA son orientativos. La plataforma no sustituye el criterio de un profesional sanitario. El Usuario es responsable de verificar la adecuación de las recomendaciones a su situación particular, especialmente en casos de condiciones médicas, embarazo, lactancia o tratamiento de menores.</P>
        </Section>

        <Section title="6. Legislación Aplicable y Jurisdicción">
          <P>El presente Aviso Legal se rige por la legislación española. En particular:</P>
          <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            <li>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).</li>
            <li>Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD).</li>
            <li>Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales (LOPDGDD).</li>
            <li>Real Decreto Legislativo 1/2007, de 16 de noviembre, por el que se aprueba el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios.</li>
            <li>Reglamento (UE) 2024/1689 del Parlamento Europeo y del Consejo (Reglamento de Inteligencia Artificial).</li>
          </ul>
          <P style={{ marginTop: 16 }}>Para la resolución de cualquier controversia que pudiera derivarse del acceso o uso del sitio web, las partes se someten a los Juzgados y Tribunales de la ciudad de <strong>Madrid</strong>, con renuncia expresa a cualquier otro fuero que pudiera corresponderles, salvo que la legislación aplicable imponga otro fuero de forma imperativa (consumidores y usuarios).</P>
        </Section>

        <Section title="7. Resolución Alternativa de Conflictos">
          <P>De conformidad con el Reglamento (UE) 524/2013, informamos que la Comisión Europea facilita una plataforma de resolución de litigios en línea (ODR) disponible en:</P>
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, color: ORANGE, background: "#fff7ed", textDecoration: "none", border: "1px solid #fed7aa", marginTop: 8 }}>
            Plataforma ODR de la Comisión Europea →
          </a>
        </Section>

        <Section title="8. Modificaciones del Aviso Legal">
          <P>BUDDY MARKET IA, S.L. se reserva el derecho de modificar el presente Aviso Legal en cualquier momento, siendo efectivas dichas modificaciones desde su publicación en el sitio web. El uso continuado del servicio tras la publicación de cambios constituye la aceptación de los mismos.</P>
          <P>Se recomienda al Usuario revisar periódicamente este Aviso Legal para estar informado de posibles actualizaciones.</P>
        </Section>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Privacidad →</Link>
          <Link href="/terms" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Términos y Condiciones →</Link>
          <Link href="/cookies" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Cookies →</Link>
          <Link href="/gdpr" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>RGPD →</Link>
        </div>
      </div>
    </div>
  );
}
