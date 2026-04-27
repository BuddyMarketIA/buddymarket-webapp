import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

const MODULES = [
  {
    id: "market", name: "Buddy Market", tagline: "Compra inteligente",
    desc: "Listas automáticas desde tus menús, comparación de precios entre supermercados y gestión de despensa inteligente.",
    color: "#F97316", bg: "#FFF7ED", border: "#FED7AA", icon: "🛒",
    features: ["Lista de la compra automática", "Comparación de precios", "Integración supermercados", "Gestión de despensa"],
  },
  {
    id: "coach", name: "Buddy Coach", tagline: "Tu nutricionista IA",
    desc: "Planes nutricionales personalizados, seguimiento de objetivos y asesoramiento continuo con inteligencia artificial.",
    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "👤",
    features: ["Planes personalizados", "Seguimiento de objetivos", "Asesoramiento 24/7", "24 perfiles especiales"],
  },
  {
    id: "shop", name: "Buddy Shop", tagline: "Productos saludables",
    desc: "Accede a productos saludables, suplementos y alimentos especiales seleccionados por nutricionistas.",
    color: "#E11D48", bg: "#FFF1F2", border: "#FECDD3", icon: "🛍️",
    features: ["Productos curados", "Suplementos", "Alimentos especiales", "Envío a domicilio"],
  },
  {
    id: "care", name: "Buddy Care", tagline: "Salud y bienestar",
    desc: "Diario nutricional, métricas de salud, recordatorios y seguimiento de tu bienestar integral.",
    color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "➕",
    features: ["Diario nutricional", "Métricas de salud", "Recordatorios", "Historial completo"],
  },
  {
    id: "pets", name: "Buddy Pets", tagline: "Nutrición para mascotas",
    desc: "Planes nutricionales específicos para tus mascotas, control veterinario y productos especializados.",
    color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🐾",
    features: ["Planes para mascotas", "Control veterinario", "Productos especiales", "Seguimiento de salud"],
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

const BUDDY_LOGOS_URL = "/manus-storage/buddy-logos_5fa5b812.png";

function ModuleCard({ mod, size }: { mod: typeof MODULES[0]; size: "large" | "small" }) {
  const [hovered, setHovered] = useState(false);
  const isLarge = size === "large";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: isLarge ? "20px" : "16px",
        overflow: "hidden",
        background: hovered ? mod.bg : "#FAFAFA",
        border: `1.5px solid ${hovered ? mod.border : "#F0F0F0"}`,
        position: "relative",
        display: "flex", flexDirection: "column",
        padding: isLarge ? "28px" : "20px",
        boxShadow: hovered ? `0 12px 40px ${mod.color}18` : "0 2px 12px rgba(0,0,0,0.04)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: isLarge ? "20px" : "14px" }}>
        <div style={{
          width: isLarge ? "40px" : "32px", height: isLarge ? "40px" : "32px",
          borderRadius: isLarge ? "12px" : "9px",
          background: hovered ? mod.color : `${mod.color}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isLarge ? "20px" : "16px",
          transition: "all 0.3s",
          boxShadow: hovered ? `0 4px 14px ${mod.color}40` : "none",
        }}>
          {mod.icon}
        </div>
        <div>
          <div style={{ fontSize: isLarge ? "15px" : "13px", fontWeight: 700, color: "#111827" }}>{mod.name}</div>
          <div style={{ fontSize: isLarge ? "12px" : "11px", color: mod.color, fontWeight: 600 }}>{mod.tagline}</div>
        </div>
      </div>

      {/* Illustration area */}
      <div style={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: isLarge ? "140px" : "70px",
        background: `${mod.color}08`,
        borderRadius: "12px",
        marginBottom: isLarge ? "16px" : "0",
        transition: "background 0.3s",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: isLarge ? "56px" : "36px", lineHeight: 1 }}>{mod.icon}</div>
          {isLarge && (
            <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "10px", maxWidth: "200px", lineHeight: 1.5 }}>
              {mod.desc.split(".")[0] + "."}
            </div>
          )}
        </div>
      </div>

      {/* Features (large only) */}
      {isLarge && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "14px" }}>
          {mod.features.slice(0, 3).map((f) => (
            <span key={f} style={{
              padding: "4px 10px", borderRadius: "100px",
              background: `${mod.color}12`, color: mod.color,
              fontSize: "11px", fontWeight: 600,
            }}>{f}</span>
          ))}
        </div>
      )}

      {/* Coming soon badge for non-market modules */}
      {mod.id !== "market" && (
        <div style={{
          position: "absolute", top: "12px", right: "12px",
          padding: "3px 8px", borderRadius: "100px",
          background: `${mod.color}15`, color: mod.color,
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.03em",
        }}>
          Próximamente
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeService, setActiveService] = useState(0);
  const [activeModule, setActiveModule] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/app/dashboard");
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveModule((p) => (p + 1) % MODULES.length), 4000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 900, color: "white" }}>B</div>
      </div>
    );
  }

  const mod = MODULES[activeModule];
  const svc = SERVICES[activeService];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#FFFFFF", color: "#111827", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .btn-primary { transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(249,115,22,0.38) !important; }
        .btn-ghost:hover { background: #F3F4F6 !important; }
        .feat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.09) !important; }
        .plan-card:hover { transform: translateY(-4px); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: float 4.5s ease-in-out infinite; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .videos-grid { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto auto auto !important; }
          .videos-large { grid-column: 1 / 3 !important; grid-row: 1 !important; }
          .mod-detail { grid-template-columns: 1fr !important; }
          .svc-detail { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .feat-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .nav-links { display: none !important; }
          .hide-sm { display: none !important; }
        }
        @media (max-width: 540px) {
          .videos-grid { grid-template-columns: 1fr !important; }
          .videos-large { grid-column: 1 !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .pills-row { flex-wrap: wrap !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "white",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? "#E5E7EB" : "#F3F4F6"}`,
        padding: "0 24px",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "18px", color: "white", boxShadow: "0 4px 12px rgba(249,115,22,0.28)", flexShrink: 0 }}>B</div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Buddy</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#F97316", letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>One</span>
            </div>
          </div>
          {/* Nav links */}
          <div className="nav-links" style={{ display: "flex", gap: "28px" }}>
            {[["Módulos","#modulos"],["Funcionalidades","#funcionalidades"],["Servicios","#servicios"],["Precios","#precios"]].map(([l,h]) => (
              <a key={l} href={h} style={{ fontSize: "14px", color: "#6B7280", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
              >{l}</a>
            ))}
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a href={getLoginUrl()} className="hide-sm" style={{ fontSize: "14px", color: "#6B7280", textDecoration: "none", fontWeight: 500, padding: "9px 14px", borderRadius: "9px", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#111827"; (e.currentTarget as HTMLAnchorElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280"; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >Iniciar sesión</a>
            <a href={getLoginUrl()} className="btn-primary" style={{ padding: "10px 22px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(249,115,22,0.25)", letterSpacing: "-0.01em" }}>
              Empezar gratis
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "72px 24px 0", maxWidth: "1160px", margin: "0 auto" }}>
        {/* Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "100px", background: "#FFF7ED", border: "1px solid #FED7AA" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#F97316", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "#EA580C", fontWeight: 600 }}>El sistema operativo de tu bienestar</span>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.04em", margin: "0 0 20px", color: "#111827", textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Todo lo que necesitas<br />
          <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>para cuidarte</span>
          {" "}en un solo lugar
        </h1>

        <p style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "#6B7280", lineHeight: 1.65, margin: "0 auto 36px", maxWidth: "560px", textAlign: "center" }}>
          Buddy One combina inteligencia artificial, nutrición, compra inteligente y acceso a profesionales para ayudarte a mejorar tu salud de forma simple, personalizada y continua.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "16px" }}>
          <a href={getLoginUrl()} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 32px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "16px", fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 32px rgba(249,115,22,0.28)", letterSpacing: "-0.01em" }}>
            Empezar gratis
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="#modulos" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "15px 28px", borderRadius: "14px", background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151", fontSize: "16px", fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}>
            Ver cómo funciona
          </a>
        </div>

        {/* Trust signals */}
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginBottom: "60px" }}>
          {["Sin tarjeta de crédito","Cancela cuando quieras","Soporte en español"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: "13px", color: "#9CA3AF" }}>{t}</span>
            </div>
          ))}
        </div>

        {/* ── VIDEOS / MÓDULOS GRID ── */}
        <div style={{ marginBottom: "80px" }}>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "20px" }}>
            Descubre el ecosistema
          </p>
          <div className="videos-grid" style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr",
            gridTemplateRows: "280px 200px",
            gap: "12px",
          }}>
            {/* Large card — Buddy Market */}
            <div className="videos-large" style={{ gridColumn: "1", gridRow: "1 / 3" }}>
              <ModuleCard mod={MODULES[0]} size="large" />
            </div>
            {/* Small — Buddy Coach */}
            <div style={{ gridColumn: "2", gridRow: "1" }}>
              <ModuleCard mod={MODULES[1]} size="small" />
            </div>
            {/* Small — Buddy Care */}
            <div style={{ gridColumn: "3", gridRow: "1" }}>
              <ModuleCard mod={MODULES[3]} size="small" />
            </div>
            {/* Small — Buddy Shop */}
            <div style={{ gridColumn: "2", gridRow: "2" }}>
              <ModuleCard mod={MODULES[2]} size="small" />
            </div>
            {/* Small — Buddy Pets */}
            <div style={{ gridColumn: "3", gridRow: "2" }}>
              <ModuleCard mod={MODULES[4]} size="small" />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS OFICIALES ── */}
      <section style={{ background: "#F9FAFB", borderTop: "1px solid #F0F0F0", borderBottom: "1px solid #F0F0F0", padding: "56px 24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "12px", color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "36px" }}>
            El ecosistema Buddy One
          </p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img
              src={BUDDY_LOGOS_URL}
              alt="Módulos del ecosistema Buddy One: Buddy Market, Buddy Coach, Buddy Shop, Buddy Care, Buddy Pets"
              style={{ maxWidth: "380px", width: "100%", height: "auto", objectFit: "contain" }}
            />
          </div>
        </div>
      </section>

      {/* ── MÓDULOS INTERACTIVOS ── */}
      <section id="modulos" style={{ padding: "96px 24px", maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ fontSize: "12px", color: "#F97316", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "12px" }}>Módulos</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 14px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Un ecosistema,<br />múltiples soluciones
          </h2>
          <p style={{ fontSize: "17px", color: "#6B7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
            Cinco módulos integrados que trabajan juntos para transformar tu bienestar.
          </p>
        </div>

        {/* Pills */}
        <div className="pills-row" style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "36px", flexWrap: "wrap" }}>
          {MODULES.map((m, i) => (
            <button key={m.id} onClick={() => setActiveModule(i)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 20px", borderRadius: "100px",
              background: activeModule === i ? m.color : "white",
              border: `1.5px solid ${activeModule === i ? m.color : "#E5E7EB"}`,
              color: activeModule === i ? "white" : "#374151",
              fontSize: "14px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", boxShadow: activeModule === i ? `0 4px 14px ${m.color}35` : "none",
            }}>
              <span>{m.icon}</span><span>{m.name}</span>
            </button>
          ))}
        </div>

        {/* Active module detail */}
        <div key={mod.id} className="mod-detail fade-in" style={{
          borderRadius: "24px", padding: "clamp(24px,4vw,48px)",
          background: mod.bg, border: `1.5px solid ${mod.border}`,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: mod.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: `0 8px 24px ${mod.color}40` }}>{mod.icon}</div>
              <div>
                <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{mod.name}</h3>
                <p style={{ fontSize: "14px", color: mod.color, fontWeight: 600 }}>{mod.tagline}</p>
              </div>
            </div>
            <p style={{ fontSize: "17px", color: "#374151", lineHeight: 1.65, marginBottom: "28px" }}>{mod.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="float" style={{ width: "240px", height: "240px", borderRadius: "28px", background: "white", border: `2px solid ${mod.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", boxShadow: `0 20px 60px ${mod.color}18` }}>
              <div style={{ fontSize: "64px" }}>{mod.icon}</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{mod.name}</div>
                <div style={{ fontSize: "12px", color: mod.color, fontWeight: 600 }}>{mod.tagline}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
          {MODULES.map((m, i) => (
            <button key={m.id} onClick={() => setActiveModule(i)} style={{ width: activeModule === i ? "24px" : "8px", height: "8px", borderRadius: "100px", border: "none", cursor: "pointer", background: activeModule === i ? m.color : "#D1D5DB", transition: "all 0.3s", padding: 0 }} />
          ))}
        </div>
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
              Todo el ecosistema Buddy One está diseñado para aprender, adaptarse y mejorar contigo.
            </p>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card" style={{ background: "white", borderRadius: "16px", padding: "28px", border: "1px solid #F0F0F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "all 0.2s" }}>
                <div style={{ fontSize: "32px", marginBottom: "14px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "8px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.6 }}>{f.desc}</p>
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
            Una plataforma<br />para todos
          </h2>
          <p style={{ fontSize: "17px", color: "#6B7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
            Tanto si eres usuario, profesional o empresa, Buddy One tiene una solución diseñada para ti.
          </p>
        </div>

        {/* Service tabs */}
        <div className="pills-row" style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "36px", flexWrap: "wrap" }}>
          {SERVICES.map((s, i) => (
            <button key={s.id} onClick={() => setActiveService(i)} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 22px", borderRadius: "100px",
              background: activeService === i ? s.color : "white",
              border: `1.5px solid ${activeService === i ? s.color : "#E5E7EB"}`,
              color: activeService === i ? "white" : "#374151",
              fontSize: "14px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", boxShadow: activeService === i ? `0 4px 14px ${s.color}30` : "none",
            }}>
              <span>{s.icon}</span><span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Active service */}
        <div key={svc.id} className="svc-detail fade-in" style={{
          borderRadius: "24px", padding: "clamp(24px,4vw,48px)",
          background: "white", border: "1px solid #E5E7EB",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${svc.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>{svc.icon}</div>
              <span style={{ fontSize: "12px", color: svc.color, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{svc.label}</span>
            </div>
            <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, color: "#111827", marginBottom: "14px", letterSpacing: "-0.02em", lineHeight: 1.25, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{svc.title}</h3>
            <p style={{ fontSize: "16px", color: "#6B7280", lineHeight: 1.65, marginBottom: "28px" }}>{svc.desc}</p>
            <a href={getLoginUrl()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 24px", borderRadius: "12px", background: svc.color, color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: `0 6px 20px ${svc.color}28` }}>
              {svc.cta}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {svc.items.map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", borderRadius: "12px", background: `${svc.color}07`, border: `1px solid ${svc.color}18` }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${svc.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={svc.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" style={{ background: "#F9FAFB", padding: "96px 24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <p style={{ fontSize: "12px", color: "#F97316", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "12px" }}>Precios</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 14px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Planes para cada necesidad
            </h2>
            <p style={{ fontSize: "17px", color: "#6B7280", maxWidth: "460px", margin: "0 auto", lineHeight: 1.6 }}>
              Empieza gratis y escala cuando lo necesites. Sin permanencia, cancela cuando quieras.
            </p>
          </div>
          <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {PLANS.map(plan => (
              <div key={plan.name} className="plan-card" style={{
                borderRadius: "20px", padding: "36px",
                background: plan.highlight ? "linear-gradient(135deg, #F97316, #FB923C)" : "white",
                border: plan.highlight ? "none" : "1px solid #E5E7EB",
                boxShadow: plan.highlight ? "0 20px 60px rgba(249,115,22,0.26)" : "0 2px 12px rgba(0,0,0,0.04)",
                position: "relative", transition: "all 0.2s",
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)", padding: "5px 16px", borderRadius: "100px", background: "#111827", color: "white", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Más popular
                  </div>
                )}
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: plan.highlight ? "white" : "#111827", marginBottom: "4px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{plan.name}</h3>
                  <p style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.72)" : "#6B7280", marginBottom: "16px" }}>{plan.desc}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "40px", fontWeight: 900, color: plan.highlight ? "white" : "#111827", letterSpacing: "-0.03em" }}>{plan.price}</span>
                    <span style={{ fontSize: "14px", color: plan.highlight ? "rgba(255,255,255,0.65)" : "#9CA3AF" }}>/{plan.period}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: plan.highlight ? "rgba(255,255,255,0.18)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "white" : "#16A34A"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.85)" : "#374151", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={getLoginUrl()} style={{ display: "block", textAlign: "center", padding: "13px 24px", borderRadius: "12px", background: plan.highlight ? "white" : plan.color, color: plan.highlight ? "#F97316" : "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: plan.highlight ? "0 4px 16px rgba(0,0,0,0.12)" : `0 4px 16px ${plan.color}28` }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "28px", boxShadow: "0 12px 32px rgba(249,115,22,0.26)" }}>🚀</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Empieza hoy tu<br />
            <span style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ecosistema Buddy One</span>
          </h2>
          <p style={{ fontSize: "18px", color: "#6B7280", lineHeight: 1.6, marginBottom: "36px" }}>
            Únete a miles de personas que ya cuidan su salud de forma inteligente. Gratis para siempre, sin tarjeta de crédito.
          </p>
          <a href={getLoginUrl()} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "18px 40px", borderRadius: "16px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "17px", fontWeight: 800, textDecoration: "none", boxShadow: "0 12px 40px rgba(249,115,22,0.30)", letterSpacing: "-0.01em" }}>
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
              { title: "Producto", links: ["Funcionalidades","Precios","BuddyIA","Recetas","Menús especiales","Para empresas"] },
              { title: "Empresa", links: ["Sobre nosotros","Blog","Creadores","FAQ","Contacto"] },
              { title: "Legal", links: ["Privacidad","Términos de uso","Cookies","RGPD","Aviso legal"] },
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
