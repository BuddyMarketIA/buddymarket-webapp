import { Link } from "wouter";

const ORANGE = "#F97316";
const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";

export default function Cookies() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/"><img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 60, objectFit: "contain", cursor: "pointer" }} /></Link>
          <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al inicio</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>LEGAL</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#111827", marginTop: 8, marginBottom: 12, letterSpacing: "-0.02em" }}>Política de Cookies</h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Última actualización: 1 de abril de 2025</p>
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: "48px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6" }}>¿Qué son las cookies?</h2>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8 }}>
              Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6" }}>Tipos de cookies que utilizamos</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
              {[
                {
                  type: "Cookies estrictamente necesarias",
                  color: "#10b981",
                  required: true,
                  desc: "Son imprescindibles para el funcionamiento de la Plataforma. Sin ellas, servicios como la autenticación y la sesión de usuario no funcionarían correctamente.",
                  examples: ["Sesión de usuario (JWT)", "Preferencias de idioma", "Estado de autenticación"],
                },
                {
                  type: "Cookies analíticas",
                  color: "#3b82f6",
                  required: false,
                  desc: "Nos permiten contar las visitas y fuentes de tráfico para medir y mejorar el rendimiento de la Plataforma. Toda la información recopilada es anónima.",
                  examples: ["Páginas visitadas", "Tiempo de sesión", "Fuente de tráfico"],
                },
                {
                  type: "Cookies de preferencias",
                  color: ORANGE,
                  required: false,
                  desc: "Permiten que la Plataforma recuerde información que cambia la forma en que se comporta o se ve, como su idioma preferido o la región en la que se encuentra.",
                  examples: ["Tema (claro/oscuro)", "Idioma preferido", "Configuración de pantalla"],
                },
              ].map(c => (
                <div key={c.type} style={{ border: `1px solid #e5e7eb`, borderRadius: 16, padding: "24px", borderLeft: `4px solid ${c.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{c.type}</h3>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                      background: c.required ? "#d1fae5" : "#f3f4f6",
                      color: c.required ? "#065f46" : "#6b7280",
                    }}>{c.required ? "OBLIGATORIA" : "OPCIONAL"}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 12 }}>{c.desc}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {c.examples.map(ex => (
                      <span key={ex} style={{ fontSize: 12, background: "#f9fafb", border: "1px solid #e5e7eb", padding: "3px 10px", borderRadius: 6, color: "#374151" }}>{ex}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6" }}>Cómo gestionar las cookies</h2>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8 }}>
              Puede configurar su navegador para rechazar todas o algunas cookies, o para que le avise cuando los sitios web las establezcan o accedan a ellas. Si deshabilita o rechaza las cookies, tenga en cuenta que algunas partes de la Plataforma pueden volverse inaccesibles o no funcionar correctamente.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16 }}>
              {[
                { browser: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
                { browser: "Mozilla Firefox", url: "https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies" },
                { browser: "Safari", url: "https://support.apple.com/es-es/guide/safari/sfri11471/mac" },
                { browser: "Microsoft Edge", url: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
              ].map(b => (
                <a key={b.browser} href={b.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  background: "#f9fafb", borderRadius: 10, textDecoration: "none", border: "1px solid #e5e7eb",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.background = "#fff7ed"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f9fafb"; }}
                >
                  <span style={{ fontSize: 16 }}>🌐</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{b.browser}</span>
                  <span style={{ fontSize: 12, color: ORANGE, marginLeft: "auto" }}>Configurar →</span>
                </a>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6" }}>Contacto</h2>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8 }}>
              Si tiene preguntas sobre nuestra política de cookies, puede contactarnos en <a href="mailto:privacidad@buddymarket.app" style={{ color: ORANGE }}>privacidad@buddymarket.app</a>.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/terms" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Términos y Condiciones →</Link>
          <Link href="/privacy" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Privacidad →</Link>
        </div>
      </div>
    </div>
  );
}
