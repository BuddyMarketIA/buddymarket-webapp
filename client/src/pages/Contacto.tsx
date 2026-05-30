import { useState } from "react";

const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png";

export default function Contacto() {
  const [sent, setSent] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Header */}
      <header style={{ background: "white", borderBottom: "1px solid #f3f4f6", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src={LOGO_ICON} alt="Buddy One" style={{ height: 32, width: 32 }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Buddy<span style={{ color: "#F97316" }}>One</span></span>
          </a>
          <a href="/" style={{ fontSize: 14, fontWeight: 600, color: "#F97316", textDecoration: "none" }}>← Volver al inicio</a>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#111827", margin: "0 0 12px" }}>Contacto</h1>
          <p style={{ fontSize: 17, color: "#6b7280", lineHeight: 1.7 }}>
            ¿Tienes alguna pregunta, sugerencia o necesitas ayuda? Escríbenos y te responderemos lo antes posible.
          </p>
        </div>

        {!sent ? (
          <form
            onSubmit={e => { e.preventDefault(); setSent(true); }}
            style={{ background: "white", borderRadius: 20, padding: "40px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Nombre</label>
                <input required type="text" placeholder="Tu nombre" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
                <input required type="email" placeholder="tu@email.com" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none" }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Asunto</label>
              <select required style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none", background: "white" }}>
                <option value="">Selecciona un asunto</option>
                <option value="general">Consulta general</option>
                <option value="soporte">Soporte técnico</option>
                <option value="empresas">Planes para empresas</option>
                <option value="expertos">Buddy Experts / Nutricionistas</option>
                <option value="makers">BuddyMakers / Creadores</option>
                <option value="facturacion">Facturación y pagos</option>
                <option value="sugerencia">Sugerencia o mejora</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Mensaje</label>
              <textarea required rows={5} placeholder="Escribe tu mensaje aquí..." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none", resize: "vertical" }} />
            </div>
            <button type="submit" style={{ width: "100%", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(249,115,22,0.3)" }}>
              Enviar mensaje
            </button>
          </form>
        ) : (
          <div style={{ background: "white", borderRadius: 20, padding: "60px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 12px" }}>Mensaje enviado</h2>
            <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>
              Hemos recibido tu mensaje. Te responderemos en un plazo máximo de 24-48 horas hábiles.
            </p>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#F97316", background: "#fff7ed", textDecoration: "none", border: "2px solid #fed7aa" }}>
              Volver al inicio
            </a>
          </div>
        )}

        {/* Info adicional */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 48 }}>
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📧</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Email</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>hola@buddyoneapp.com</p>
          </div>
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏰</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Horario</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Lun-Vie 9:00-18:00</p>
          </div>
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Ubicación</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>España</p>
          </div>
        </div>
      </main>

      {/* Disclaimer */}
      <footer style={{ textAlign: "center", padding: "24px", borderTop: "1px solid #f3f4f6" }}>
        <p style={{ fontSize: 12, color: "#9ca3af", maxWidth: 600, margin: "0 auto" }}>
          El contenido de Buddy One es orientativo y no sustituye el consejo de un profesional de la salud. Consulta siempre con un profesional cualificado.
        </p>
      </footer>
    </div>
  );
}
