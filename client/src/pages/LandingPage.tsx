import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const MODULES = [
  {
    id: "market", name: "Buddy Market", tagline: "Compra inteligente",
    desc: "Listas automáticas desde tus menús, comparación de precios entre supermercados y gestión de despensa inteligente.",
    color: "#F97316", bg: "#FFF7ED", border: "#FED7AA", icon: "🛒",
    features: ["Lista de la compra automática", "Comparación de precios", "Integración supermercados", "Gestión de despensa"],
    mockupBg: "linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)",
  },
  {
    id: "coach", name: "Buddy Coach", tagline: "Tu nutricionista IA",
    desc: "Planes nutricionales personalizados, seguimiento de objetivos y asesoramiento continuo con inteligencia artificial.",
    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "👤",
    features: ["Planes personalizados", "Seguimiento de objetivos", "Asesoramiento 24/7", "24 perfiles especiales"],
    mockupBg: "linear-gradient(135deg, #F5F3FF 0%, #DDD6FE 100%)",
  },
  {
    id: "shop", name: "Buddy Shop", tagline: "Productos saludables",
    desc: "Accede a productos saludables, suplementos y alimentos especiales seleccionados por nutricionistas.",
    color: "#E11D48", bg: "#FFF1F2", border: "#FECDD3", icon: "🛍️",
    features: ["Productos curados", "Suplementos", "Alimentos especiales", "Envío a domicilio"],
    mockupBg: "linear-gradient(135deg, #FFF1F2 0%, #FECDD3 100%)",
  },
  {
    id: "care", name: "Buddy Care", tagline: "Salud y bienestar",
    desc: "Diario nutricional, métricas de salud, recordatorios y seguimiento de tu bienestar integral.",
    color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "➕",
    features: ["Diario nutricional", "Métricas de salud", "Recordatorios", "Historial completo"],
    mockupBg: "linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)",
  },
  {
    id: "pets", name: "Buddy Pets", tagline: "Nutrición para mascotas",
    desc: "Planes nutricionales específicos para tus mascotas, control veterinario y productos especializados.",
    color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🐾",
    features: ["Planes para mascotas", "Control veterinario", "Productos especiales", "Seguimiento de salud"],
    mockupBg: "linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 100%)",
  },
];

const FEATURES = [
  { icon: "🤖", title: "IA que aprende de ti", desc: "Cada módulo se adapta a tus hábitos y objetivos. Cuanto más usas Buddy One, más inteligente se vuelve tu experiencia." },
  { icon: "🥗", title: "Nutrición personalizada", desc: "Menús semanales únicos generados en segundos, adaptados a tus condiciones médicas, alergias y preferencias." },
  { icon: "🛒", title: "Compra automatizada", desc: "Tu lista de la compra se genera sola a partir de tus menús. Compara precios entre supermercados con un clic." },
  { icon: "🏠", title: "Gestión del hogar", desc: "Inventario, despensa, presupuesto familiar. Buddy One organiza tu vida doméstica de forma inteligente." },
  { icon: "🐾", title: "Mascotas integradas", desc: "Planes nutricionales específicos para tus mascotas con seguimiento veterinario y productos especializados." },
  { icon: "🧑‍⚕️", title: "Profesionales bajo demanda", desc: "Accede a nutricionistas certificados para consultas, seguimiento personalizado y planes médicos especiales." },
];

const SERVICES = [
  {
    id: "users", label: "Para usuarios", icon: "👤", color: "#F97316",
    title: "Control total de tu alimentación y salud",
    desc: "Toma el control de tu bienestar con herramientas de IA que antes solo tenían los profesionales. Sin complicaciones.",
    items: ["Menús semanales con IA", "Diario nutricional", "Lista de la compra automática", "24 planes especializados", "Métricas y progreso", "Acceso a expertos"],
    cta: "Empezar gratis",
  },
  {
    id: "experts", label: "Para profesionales", icon: "🧑‍⚕️", color: "#7C3AED",
    title: "Herramientas para nutricionistas dentro de la app",
    desc: "Gestiona tus pacientes, crea planes personalizados y haz seguimiento en tiempo real desde una sola plataforma.",
    items: ["Panel de gestión de pacientes", "Creación de planes nutricionales", "Seguimiento en tiempo real", "Agenda y videoconsultas", "Facturación integrada", "Visibilidad ante miles de usuarios"],
    cta: "Unirme como experto",
  },
  {
    id: "business", label: "Para empresas", icon: "🏢", color: "#16A34A",
    title: "Soluciones B2B de bienestar corporativo",
    desc: "Ofrece a tus empleados acceso completo al ecosistema Buddy One. Mejora la salud del equipo y reduce el absentismo.",
    items: ["Panel corporativo de gestión", "Acceso para todos los empleados", "Informes de bienestar del equipo", "Integración con RRHH", "SLA garantizado", "Account manager dedicado"],
    cta: "Contactar ventas",
  },
];

const PLANS = [
  {
    name: "Free", price: "0€", period: "para siempre",
    desc: "Para explorar Buddy One sin compromiso",
    features: ["Perfil nutricional básico", "Ver recetas de la comunidad", "2 menús/mes + 1 menú IA de prueba", "3 listas de la compra/mes", "Inventario (hasta 25 productos)"],
    cta: "Empezar gratis", highlight: false, color: "#6B7280",
  },
  {
    name: "Pro", price: "9,99€", period: "al mes",
    desc: "Para quienes quieren resultados reales",
    features: ["Menús semanales ilimitados con IA", "24 planes especializados", "BuddyIA: 50 consultas/día", "Diario nutricional ilimitado", "Inventario ilimitado + alertas", "Métricas de salud (6 meses)", "Integración supermercados online"],
    cta: "Empezar con Pro", highlight: true, color: "#F97316",
  },
  {
    name: "Pro Max", price: "19,99€", period: "al mes",
    desc: "Para profesionales y familias",
    features: ["Todo lo de Pro", "BuddyIA ilimitado", "Historial de métricas ilimitado", "Crear y publicar recetas propias", "Acceso a BuddyExperts", "Perfiles familiares múltiples", "Exportar informes PDF", "Soporte prioritario 24/7"],
    cta: "Empezar con Pro Max", highlight: false, color: "#7C3AED",
  },
];

const BUDDY_LOGOS_URL = "/manus-storage/buddy-logos_e0b516fd.png";
const APP_MOCKUP_URL = "/manus-storage/app-mockup-nutrition_9a99780a.png";

// ── Mockup visual de la app (hero) ──────────────────────────────────────────
function AppMockup() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "520px", margin: "0 auto" }}>
      {/* Fondo decorativo */}
      <div style={{
        position: "absolute", inset: "-20px", borderRadius: "40px",
        background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 50%, #F0FDF4 100%)",
        zIndex: 0,
      }} />
      {/* Imagen principal de mockup */}
      <div style={{ position: "relative", zIndex: 1, borderRadius: "28px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(249,115,22,0.12)" }}>
        <img
          src={APP_MOCKUP_URL}
          alt="Buddy One App — Nutrición inteligente"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>
      {/* Badge flotante — módulos */}
      <div style={{
        position: "absolute", bottom: "24px", left: "-20px", zIndex: 2,
        background: "white", borderRadius: "16px", padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛒</div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>Lista generada</div>
          <div style={{ fontSize: "11px", color: "#16A34A", fontWeight: 600 }}>✓ 18 productos · 42,30€</div>
        </div>
      </div>
      {/* Badge flotante — IA */}
      <div style={{
        position: "absolute", top: "20px", right: "-16px", zIndex: 2,
        background: "white", borderRadius: "16px", padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: "10px",
        maxWidth: "180px",
      }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>🤖</div>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827" }}>BuddyIA</div>
          <div style={{ fontSize: "10px", color: "#7C3AED", fontWeight: 600 }}>Plan semanal listo</div>
        </div>
      </div>
      {/* Módulos pills */}
      <div style={{
        position: "absolute", top: "50%", right: "-24px", zIndex: 2,
        display: "flex", flexDirection: "column", gap: "6px", transform: "translateY(-50%)",
      }}>
        {MODULES.map(m => (
          <div key={m.id} style={{
            background: "white", borderRadius: "100px", padding: "5px 10px 5px 6px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", gap: "5px",
            fontSize: "11px", fontWeight: 600, color: m.color, whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: "13px" }}>{m.icon}</span>
            <span>{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Carrusel de módulos MANUAL ──────────────────────────────────────────────
function ModulesCarousel() {
  const [active, setActive] = useState(0);
  const mod = MODULES[active];

  const prev = () => setActive(i => (i - 1 + MODULES.length) % MODULES.length);
  const next = () => setActive(i => (i + 1) % MODULES.length);

  return (
    <div>
      {/* Pills de navegación */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "32px" }}>
        {MODULES.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActive(i)}
            style={{
              padding: "10px 20px", borderRadius: "100px",
              background: active === i ? m.color : "white",
              border: `1.5px solid ${active === i ? m.color : "#E5E7EB"}`,
              color: active === i ? "white" : "#374151",
              fontSize: "14px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", boxShadow: active === i ? `0 4px 14px ${m.color}35` : "none",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            <span>{m.icon}</span><span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Detalle del módulo activo */}
      <div key={mod.id} style={{
        borderRadius: "24px", padding: "clamp(24px,4vw,48px)",
        background: mod.bg, border: `1.5px solid ${mod.border}`,
        display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "16px", alignItems: "center",
      }}>
        {/* Flecha izquierda */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button
            onClick={prev}
            aria-label="Módulo anterior"
            style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "white", border: `1.5px solid ${mod.border}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "all 0.2s", flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = mod.color; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </div>

        {/* Contenido central */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center", flex: 1 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: mod.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: `0 8px 24px ${mod.color}40` }}>{mod.icon}</div>
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{mod.name}</h3>
                <p style={{ fontSize: "14px", color: mod.color, fontWeight: 600, margin: 0 }}>{mod.tagline}</p>
              </div>
            </div>
            <p style={{ fontSize: "16px", color: "#374151", lineHeight: 1.65, marginBottom: "24px" }}>{mod.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {mod.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${mod.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={mod.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
            <a href={getLoginUrl()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 24px", borderRadius: "12px", background: mod.color, color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: `0 6px 20px ${mod.color}35` }}>
              Explorar {mod.name}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          {/* Mockup visual del módulo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{
              width: "220px", height: "280px", borderRadius: "28px",
              background: mod.mockupBg,
              border: `2px solid ${mod.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "16px", boxShadow: `0 20px 60px ${mod.color}18`,
              position: "relative", overflow: "hidden",
            }}>
              {/* Decoración de fondo */}
              <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: `${mod.color}12` }} />
              <div style={{ position: "absolute", bottom: "-20px", left: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `${mod.color}10` }} />
              {/* Icono grande */}
              <div style={{ fontSize: "72px", lineHeight: 1, position: "relative", zIndex: 1 }}>{mod.icon}</div>
              {/* Nombre */}
              <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{mod.name}</div>
                <div style={{ fontSize: "12px", color: mod.color, fontWeight: 600, marginTop: "4px" }}>{mod.tagline}</div>
              </div>
              {/* Mini stats */}
              <div style={{ display: "flex", gap: "8px", position: "relative", zIndex: 1 }}>
                <div style={{ background: "white", borderRadius: "8px", padding: "6px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: mod.color }}>✓</div>
                  <div style={{ fontSize: "9px", color: "#6B7280", fontWeight: 600 }}>Activo</div>
                </div>
                <div style={{ background: "white", borderRadius: "8px", padding: "6px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#111827" }}>IA</div>
                  <div style={{ fontSize: "9px", color: "#6B7280", fontWeight: 600 }}>Smart</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flecha derecha */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={next}
            aria-label="Módulo siguiente"
            style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "white", border: `1.5px solid ${mod.border}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "all 0.2s", flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = mod.color; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "white"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Dots indicadores */}
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
        {MODULES.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setActive(i)}
            style={{ width: active === i ? "24px" : "8px", height: "8px", borderRadius: "100px", border: "none", cursor: "pointer", background: active === i ? m.color : "#D1D5DB", transition: "all 0.3s", padding: 0 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeService, setActiveService] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/app/dashboard");
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 900, color: "white" }}>B</div>
      </div>
    );
  }

  const svc = SERVICES[activeService];

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100dvh", fontFamily: "'Inter', sans-serif", color: "#111827", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .float { animation: float 4s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .modules-grid { display: grid; grid-template-columns: 1.6fr 1fr 1fr; grid-template-rows: 280px 200px; gap: 12px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .modules-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto auto auto !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .mod-detail-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .modules-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 40px rgba(249,115,22,0.38) !important; }
        .btn-ghost:hover { background: #F3F4F6 !important; }
        .nav-link { font-size: 14px; font-weight: 500; color: #374151; text-decoration: none; transition: color 0.2s; }
        .nav-link:hover { color: #F97316; }
        .service-tab:hover { background: #F9FAFB !important; }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important; }
        .plan-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "white",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #F0F0F0" : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", color: "white", boxShadow: "0 4px 14px rgba(249,115,22,0.30)" }}>B</div>
            <div>
              <span style={{ fontSize: "17px", fontWeight: 900, color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.03em" }}>Buddy</span>
              <span style={{ fontSize: "17px", fontWeight: 900, color: "#F97316", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.03em" }}>One</span>
            </div>
          </div>
          {/* Nav links */}
          <nav style={{ display: "flex", gap: "28px", alignItems: "center" }} className="desktop-nav">
            <a href="#modulos" className="nav-link">Módulos</a>
            <a href="#funcionalidades" className="nav-link">Funcionalidades</a>
            <a href="#servicios" className="nav-link">Servicios</a>
            <a href="#precios" className="nav-link">Precios</a>
          </nav>
          {/* CTA */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a href={getLoginUrl()} style={{ fontSize: "14px", fontWeight: 600, color: "#374151", textDecoration: "none", padding: "8px 16px" }}>Iniciar sesión</a>
            <a href={getLoginUrl()} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 20px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(249,115,22,0.25)", transition: "all 0.2s" }}>
              Empezar gratis
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 24px 60px", maxWidth: "1160px", margin: "0 auto" }}>
        <div className="hero-grid">
          {/* Texto izquierda */}
          <div>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "100px", background: "#FFF7ED", border: "1px solid #FED7AA", marginBottom: "28px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#F97316", flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: "#EA580C", fontWeight: 600 }}>El sistema operativo de tu bienestar</span>
            </div>
            {/* Headline */}
            <h1 style={{ fontSize: "clamp(36px, 5vw, 62px)", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.04em", margin: "0 0 20px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Todo lo que necesitas<br />
              <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>para cuidarte</span>
              {" "}en un solo lugar
            </h1>
            <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "#6B7280", lineHeight: 1.7, margin: "0 0 36px", maxWidth: "480px" }}>
              Buddy One combina inteligencia artificial, nutrición, compra inteligente y acceso a profesionales para ayudarte a mejorar tu salud de forma simple, personalizada y continua.
            </p>
            {/* CTAs */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "40px" }}>
              <a href={getLoginUrl()} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 32px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "16px", fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 32px rgba(249,115,22,0.28)", letterSpacing: "-0.01em", transition: "all 0.2s" }}>
                Empezar gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="#modulos" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 28px", borderRadius: "14px", background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151", fontSize: "16px", fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}>
                Ver cómo funciona
              </a>
            </div>
            {/* Trust signals */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {["Sin tarjeta de crédito", "Cancela cuando quieras", "Soporte en español"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup visual derecha */}
          <div className="float">
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── GRID DE MÓDULOS (hero visual) ── */}
      <section style={{ padding: "0 24px 80px", maxWidth: "1160px", margin: "0 auto" }}>
        <p style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "20px" }}>
          Descubre el ecosistema
        </p>
        <div className="modules-grid" style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr",
          gridTemplateRows: "280px 200px",
          gap: "12px",
        }}>
          {/* Grande — Buddy Market */}
          <div style={{ gridColumn: "1", gridRow: "1 / 3", borderRadius: "20px", overflow: "hidden", background: MODULES[0].bg, border: `1.5px solid ${MODULES[0].border}`, padding: "28px", display: "flex", flexDirection: "column", cursor: "pointer", transition: "all 0.3s", boxShadow: "0 4px 20px rgba(249,115,22,0.08)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${MODULES[0].color}20`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(249,115,22,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: MODULES[0].color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{MODULES[0].icon}</div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{MODULES[0].name}</div>
                <div style={{ fontSize: "12px", color: MODULES[0].color, fontWeight: 600 }}>{MODULES[0].tagline}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: `${MODULES[0].color}08`, borderRadius: "12px", marginBottom: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "64px", lineHeight: 1 }}>{MODULES[0].icon}</div>
                <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "10px", maxWidth: "200px", lineHeight: 1.5 }}>{MODULES[0].desc.split(".")[0] + "."}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {MODULES[0].features.slice(0, 3).map(f => (
                <span key={f} style={{ padding: "4px 10px", borderRadius: "100px", background: `${MODULES[0].color}12`, color: MODULES[0].color, fontSize: "11px", fontWeight: 600 }}>{f}</span>
              ))}
            </div>
          </div>
          {/* Pequeños */}
          {[MODULES[1], MODULES[3], MODULES[2], MODULES[4]].map((m, idx) => {
            const positions = [
              { gridColumn: "2", gridRow: "1" },
              { gridColumn: "3", gridRow: "1" },
              { gridColumn: "2", gridRow: "2" },
              { gridColumn: "3", gridRow: "2" },
            ];
            return (
              <div key={m.id} style={{ ...positions[idx], borderRadius: "16px", overflow: "hidden", background: m.bg, border: `1.5px solid ${m.border}`, padding: "20px", display: "flex", flexDirection: "column", cursor: "pointer", transition: "all 0.3s", position: "relative" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${m.color}20`; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `${m.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{m.icon}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{m.name}</div>
                    <div style={{ fontSize: "11px", color: m.color, fontWeight: 600 }}>{m.tagline}</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: `${m.color}08`, borderRadius: "10px" }}>
                  <div style={{ fontSize: "36px" }}>{m.icon}</div>
                </div>
                <div style={{ position: "absolute", top: "10px", right: "10px", padding: "3px 8px", borderRadius: "100px", background: `${m.color}15`, color: m.color, fontSize: "10px", fontWeight: 700 }}>Próximamente</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LOGOS OFICIALES ── */}
      <section style={{ background: "#F9FAFB", borderTop: "1px solid #F0F0F0", borderBottom: "1px solid #F0F0F0", padding: "56px 24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "32px" }}>El ecosistema Buddy One</p>
          <img
            src={BUDDY_LOGOS_URL}
            alt="Módulos del ecosistema Buddy One: Buddy Market, Buddy Coach, Buddy Shop, Buddy Care, Buddy Pets"
            style={{ maxWidth: "380px", width: "100%", height: "auto", objectFit: "contain" }}
          />
        </div>
      </section>

      {/* ── MÓDULOS (carrusel manual) ── */}
      <section id="modulos" style={{ padding: "96px 24px", maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ fontSize: "12px", color: "#F97316", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "12px" }}>Módulos</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 14px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Un ecosistema,<br />múltiples soluciones
          </h2>
          <p style={{ fontSize: "17px", color: "#6B7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
            Cinco módulos integrados que trabajan juntos para transformar tu bienestar.
          </p>
        </div>
        <ModulesCarousel />
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" style={{ background: "#F9FAFB", padding: "96px 24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", color: "#F97316", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "12px" }}>Funcionalidades</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 14px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Tecnología al servicio<br />de tu bienestar
            </h2>
            <p style={{ fontSize: "17px", color: "#6B7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
              Herramientas de última generación que antes solo tenían los profesionales.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{ background: "white", borderRadius: "18px", padding: "28px", border: "1px solid #F0F0F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "all 0.3s" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 10px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" style={{ padding: "96px 24px", maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ fontSize: "12px", color: "#F97316", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "12px" }}>Servicios</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 14px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Para cada tipo<br />de usuario
          </h2>
          <p style={{ fontSize: "17px", color: "#6B7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
            Buddy One se adapta a ti, seas usuario final, profesional de la salud o empresa.
          </p>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "32px", flexWrap: "wrap" }}>
          {SERVICES.map((s, i) => (
            <button key={s.id} className="service-tab" onClick={() => setActiveService(i)} style={{
              padding: "12px 24px", borderRadius: "100px",
              background: activeService === i ? s.color : "white",
              border: `1.5px solid ${activeService === i ? s.color : "#E5E7EB"}`,
              color: activeService === i ? "white" : "#374151",
              fontSize: "14px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", boxShadow: activeService === i ? `0 4px 14px ${s.color}35` : "none",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span>{s.icon}</span><span>{s.label}</span>
            </button>
          ))}
        </div>
        {/* Detalle */}
        <div key={svc.id} className="fade-in" style={{
          borderRadius: "24px", padding: "clamp(24px,4vw,48px)",
          background: "#F9FAFB", border: "1.5px solid #F0F0F0",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: svc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: `0 8px 24px ${svc.color}40` }}>{svc.icon}</div>
              <div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{svc.title}</h3>
              </div>
            </div>
            <p style={{ fontSize: "16px", color: "#374151", lineHeight: 1.65, marginBottom: "24px" }}>{svc.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
              {svc.items.map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${svc.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={svc.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
            <a href={getLoginUrl()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 24px", borderRadius: "12px", background: svc.color, color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: `0 6px 20px ${svc.color}35` }}>
              {svc.cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="float" style={{ width: "240px", height: "240px", borderRadius: "28px", background: "white", border: `2px solid #F0F0F0`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: "64px" }}>{svc.icon}</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{svc.label}</div>
                <div style={{ fontSize: "12px", color: svc.color, fontWeight: 600 }}>{svc.title.split(" ").slice(0, 3).join(" ")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" style={{ background: "#F9FAFB", padding: "96px 24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", color: "#F97316", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "12px" }}>Precios</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 14px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Elige tu plan
            </h2>
            <p style={{ fontSize: "17px", color: "#6B7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
              Sin compromisos. Empieza gratis y escala cuando lo necesites.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {PLANS.map(plan => (
              <div key={plan.name} className="plan-card" style={{
                background: plan.highlight ? "linear-gradient(135deg, #F97316, #FB923C)" : "white",
                borderRadius: "24px", padding: "32px",
                border: plan.highlight ? "none" : "1.5px solid #F0F0F0",
                boxShadow: plan.highlight ? "0 20px 60px rgba(249,115,22,0.28)" : "0 4px 20px rgba(0,0,0,0.06)",
                transition: "all 0.3s", position: "relative",
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#111827", color: "white", fontSize: "11px", fontWeight: 700, padding: "4px 14px", borderRadius: "100px", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>MÁS POPULAR</div>
                )}
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: plan.highlight ? "white" : "#111827", margin: "0 0 6px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{plan.name}</h3>
                <p style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.75)" : "#9CA3AF", margin: "0 0 20px" }}>{plan.desc}</p>
                <div style={{ marginBottom: "24px" }}>
                  <span style={{ fontSize: "40px", fontWeight: 900, color: plan.highlight ? "white" : "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{plan.price}</span>
                  <span style={{ fontSize: "14px", color: plan.highlight ? "rgba(255,255,255,0.65)" : "#9CA3AF", marginLeft: "6px" }}>{plan.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: plan.highlight ? "rgba(255,255,255,0.25)" : `${plan.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "white" : plan.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.85)" : "#374151", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={getLoginUrl()} style={{
                  display: "block", textAlign: "center", padding: "13px", borderRadius: "12px",
                  background: plan.highlight ? "white" : `${plan.color}15`,
                  color: plan.highlight ? "#F97316" : plan.color,
                  fontSize: "14px", fontWeight: 700, textDecoration: "none",
                  transition: "all 0.2s",
                }}>{plan.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "28px", boxShadow: "0 12px 32px rgba(249,115,22,0.26)" }}>🚀</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Empieza hoy tu<br />
            <span style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ecosistema Buddy One</span>
          </h2>
          <p style={{ fontSize: "18px", color: "#6B7280", lineHeight: 1.6, marginBottom: "36px" }}>
            Únete a miles de personas que ya cuidan su salud de forma inteligente. Gratis para siempre, sin tarjeta de crédito.
          </p>
          <a href={getLoginUrl()} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "18px 40px", borderRadius: "16px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "17px", fontWeight: 800, textDecoration: "none", boxShadow: "0 12px 40px rgba(249,115,22,0.30)", letterSpacing: "-0.01em", transition: "all 0.2s" }}>
            Empezar gratis ahora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "16px" }}>Sin tarjeta de crédito · Cancela cuando quieras · Soporte en español</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#111827", padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px", marginBottom: "48px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "17px", color: "white" }}>B</div>
                <div>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Buddy</span>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#F97316", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>One</span>
                </div>
              </div>
              <p style={{ fontSize: "14px", lineHeight: 1.65, maxWidth: "260px", marginBottom: "20px", color: "rgba(255,255,255,0.45)" }}>
                Tu ecosistema de bienestar inteligente. Nutrición, compra, salud y mascotas en un solo lugar.
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {MODULES.map(m => (
                  <span key={m.id} style={{ padding: "3px 10px", borderRadius: "100px", background: `${m.color}18`, color: m.color, fontSize: "11px", fontWeight: 600 }}>{m.name}</span>
                ))}
              </div>
            </div>
            {[
              { title: "Producto", links: ["Funcionalidades", "Precios", "BuddyIA", "Recetas", "Menús especiales", "Para empresas"] },
              { title: "Empresa", links: ["Sobre nosotros", "Blog", "Creadores", "FAQ", "Contacto"] },
              { title: "Legal", links: ["Privacidad", "Términos de uso", "Cookies", "RGPD", "Aviso legal"] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "16px" }}>{col.title}</h4>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ display: "block", fontSize: "14px", color: "rgba(255,255,255,0.40)", textDecoration: "none", marginBottom: "10px", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}
                  >{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>© 2025 Buddy One. Todos los derechos reservados.</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.22)" }}>El contenido de Buddy One es orientativo y no sustituye el consejo de un profesional de la salud.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
