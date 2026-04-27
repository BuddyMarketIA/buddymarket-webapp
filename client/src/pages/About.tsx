import { Link } from "wouter";

const TEAM = [
  {
    name: "Guillermo V. Rodríguez",
    role: "CEO & Co-fundador",
    bio: "Apasionado de la tecnología y la nutrición. Lleva más de 10 años en el sector healthtech construyendo productos que mejoran la vida de las personas.",
    emoji: "👨‍💼",
    linkedin: "#",
  },
  {
    name: "Luis María Cabello",
    role: "CTO & Co-fundador",
    bio: "Ingeniero de software con experiencia en plataformas de salud digital. Arquitecto del motor de IA nutricional de Buddy One.",
    emoji: "👨‍💻",
    linkedin: "#",
  },
  {
    name: "Dra. Laura Sánchez",
    role: "Directora de Nutrición",
    bio: "Dietista-nutricionista colegiada con más de 12 años de experiencia clínica. Responsable de validar todos los contenidos nutricionales de la plataforma.",
    emoji: "👩‍⚕️",
    linkedin: "#",
  },
];

const VALUES = [
  { emoji: "🥗", title: "Nutrición real", desc: "Creemos en la alimentación basada en evidencia científica, sin modas ni dietas milagro." },
  { emoji: "🤝", title: "Accesibilidad", desc: "La nutrición de calidad no debería ser un privilegio. Por eso ofrecemos un plan gratuito sin límite de tiempo." },
  { emoji: "🔒", title: "Privacidad primero", desc: "Tus datos de salud son tuyos. Nunca los vendemos ni los usamos para publicidad." },
  { emoji: "🧠", title: "IA responsable", desc: "Nuestra IA es una herramienta de apoyo, no un sustituto del profesional de la salud." },
  { emoji: "🌱", title: "Sostenibilidad", desc: "Promovemos una alimentación sostenible que cuida tanto de tu salud como del planeta." },
  { emoji: "📊", title: "Transparencia", desc: "Somos transparentes sobre cómo funciona nuestro producto, nuestros precios y nuestros límites." },
];

export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "100px", padding: "6px 16px", marginBottom: "24px" }}>
            <span style={{ fontSize: "14px", color: "#F97316", fontWeight: 600 }}>🥦 Nuestra historia</span>
          </div>
          <h1 style={{ color: "white", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, margin: "0 0 20px", lineHeight: 1.1 }}>
            Hacemos que comer bien<br />
            <span style={{ color: "#F97316" }}>sea fácil para todos</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", lineHeight: 1.7, margin: 0 }}>
            Buddy One nació de una pregunta sencilla: ¿por qué es tan difícil comer bien en el día a día? 
            Combinamos tecnología, nutrición clínica e inteligencia artificial para que cualquier persona 
            pueda llevar una alimentación saludable, sin complicaciones.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: "white", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "32px", textAlign: "center" }}>
          {[
            { value: "207+", label: "Recetas saludables", emoji: "🍽️" },
            { value: "24", label: "Nutricionistas especializados", emoji: "👩‍⚕️" },
            { value: "6", label: "Supermercados integrados", emoji: "🛒" },
            { value: "100%", label: "Gratis para empezar", emoji: "🎁" },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: "28px", marginBottom: "4px" }}>{stat.emoji}</div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#F97316", lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nuestra misión</span>
            <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#1a1a1a", margin: "12px 0 20px", lineHeight: 1.2 }}>
              Democratizar el acceso a la nutrición de calidad
            </h2>
            <p style={{ fontSize: "16px", color: "#555", lineHeight: 1.8, margin: "0 0 16px" }}>
              En España, solo el 12% de la población sigue las recomendaciones nutricionales de la OMS. 
              No es por falta de voluntad, sino por falta de herramientas accesibles y personalizadas.
            </p>
            <p style={{ fontSize: "16px", color: "#555", lineHeight: 1.8, margin: 0 }}>
              Buddy One conecta a las personas con nutricionistas certificados y con la tecnología 
              necesaria para que comer bien sea una decisión fácil, no un esfuerzo diario.
            </p>
          </div>
          <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", borderRadius: "24px", padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎯</div>
            <blockquote style={{ margin: 0, fontSize: "18px", fontStyle: "italic", color: "#92400E", lineHeight: 1.7, fontWeight: 500 }}>
              "Queremos que en 2030, comer bien sea tan fácil como pedir una pizza."
            </blockquote>
            <p style={{ margin: "16px 0 0", fontSize: "14px", color: "#B45309", fontWeight: 700 }}>— Equipo Buddy One</p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={{ background: "#F9FAFB", padding: "64px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nuestros valores</span>
            <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#1a1a1a", margin: "12px 0 0" }}>Lo que nos guía cada día</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {VALUES.map((v) => (
              <div key={v.title} style={{ background: "white", borderRadius: "20px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{v.emoji}</div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 8px" }}>{v.title}</h3>
                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.08em" }}>El equipo</span>
          <h2 style={{ fontSize: "32px", fontWeight: 900, color: "#1a1a1a", margin: "12px 0 0" }}>Las personas detrás de Buddy One</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "28px" }}>
          {TEAM.map((member) => (
            <div key={member.name} style={{ background: "white", borderRadius: "24px", padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "40px" }}>
                {member.emoji}
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px" }}>{member.name}</h3>
              <p style={{ fontSize: "13px", color: "#F97316", fontWeight: 700, margin: "0 0 12px" }}>{member.role}</p>
              <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.7, margin: 0 }}>{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "linear-gradient(135deg, #F97316 0%, #EF4444 100%)", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ color: "white", fontSize: "32px", fontWeight: 900, margin: "0 0 16px" }}>¿Listo para empezar?</h2>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "17px", margin: "0 0 32px", lineHeight: 1.7 }}>
            Únete a la comunidad Buddy One y empieza a comer mejor hoy mismo. Es gratis.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/app/dashboard">
              <button style={{ background: "white", color: "#F97316", border: "none", borderRadius: "14px", padding: "14px 28px", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                Empezar gratis →
              </button>
            </Link>
            <a href="mailto:info@buddymarket.io" style={{ textDecoration: "none" }}>
              <button style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "14px", padding: "14px 28px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
                Contactar
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ background: "#1a1a2e", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { label: "Inicio", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: "FAQ", href: "/faq" },
            { label: "Privacidad", href: "/privacy" },
            { label: "Términos", href: "/terms" },
          ].map((link) => (
            <Link key={link.label} href={link.href}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.color = "white"}
                onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.color = "rgba(255,255,255,0.5)"}
              >{link.label}</span>
            </Link>
          ))}
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "16px 0 0" }}>
          © 2026 Buddy One. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
