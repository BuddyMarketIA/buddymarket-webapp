import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import LanguageSelector from "@/components/LanguageSelector";
import { getLoginUrl } from "@/const";

const MODULES = [
  {
    id: "market",
    name: "Buddy Market",
    tagline: "Compra inteligente",
    desc: "Listas automáticas, comparación de precios en supermercados y optimización de tu cesta de la compra con IA.",
    color: "#F97316",
    icon: "🛒",
    features: ["Listas automáticas", "Comparar precios", "Alcampo, Mercadona, Lidl"],
  },
  {
    id: "coach",
    name: "Buddy Coach",
    tagline: "Tu entrenador personal",
    desc: "Seguimiento de objetivos, planes de entrenamiento personalizados y coaching continuo para alcanzar tu mejor versión.",
    color: "#7C3AED",
    icon: "👤",
    features: ["Planes personalizados", "Seguimiento de objetivos", "Coaching continuo"],
  },
  {
    id: "shop",
    name: "Buddy Shop",
    tagline: "Tu tienda de bienestar",
    desc: "Acceso a productos de salud, suplementos y bienestar seleccionados y recomendados por expertos.",
    color: "#E11D48",
    icon: "🛍️",
    features: ["Productos seleccionados", "Recomendados por expertos", "Envío rápido"],
  },
  {
    id: "care",
    name: "Buddy Care",
    tagline: "Nutrición y salud",
    desc: "Menús semanales con IA, diario nutricional, recetas saludables y acceso a nutricionistas certificados.",
    color: "#16A34A",
    icon: "➕",
    features: ["Menús con IA", "Diario nutricional", "Nutricionistas online"],
  },
  {
    id: "pets",
    name: "Buddy Pets",
    tagline: "Bienestar para mascotas",
    desc: "Nutrición personalizada, seguimiento de salud y recomendaciones veterinarias para tu compañero animal.",
    color: "#2563EB",
    icon: "🐾",
    features: ["Nutrición animal", "Seguimiento de salud", "Consejos veterinarios"],
  },
];

const ECOSYSTEM_FEATURES = [
  { icon: "🤖", title: "IA que aprende de ti", desc: "Cada módulo se adapta a tus hábitos, preferencias y objetivos. Cuanto más usas Buddy One, más inteligente se vuelve." },
  { icon: "🔗", title: "Todo conectado", desc: "Tu diario nutricional alimenta tus listas de compra. Tu coach conoce tu alimentación. Todo fluye sin fricciones." },
  { icon: "👨‍⚕️", title: "Profesionales bajo demanda", desc: "Nutricionistas, entrenadores y veterinarios disponibles cuando los necesitas, integrados en tu experiencia." },
  { icon: "📊", title: "Datos que importan", desc: "Visualiza tu progreso en salud, gasto y bienestar con dashboards claros y accionables." },
  { icon: "🏠", title: "Gestión del hogar", desc: "Inventario, despensa, presupuesto familiar. Buddy One organiza tu vida doméstica de forma inteligente." },
  { icon: "🌱", title: "Crecimiento continuo", desc: "La plataforma evoluciona contigo. Nuevos módulos, nuevas funcionalidades, siempre un paso por delante." },
];

const SERVICES = [
  {
    audience: "Para ti",
    icon: "👤",
    color: "#F97316",
    title: "Control total de tu bienestar",
    items: ["Nutrición personalizada con IA", "Compra optimizada y automatizada", "Seguimiento de salud y objetivos", "Acceso a profesionales certificados", "Gestión de mascotas integrada"],
  },
  {
    audience: "Para profesionales",
    icon: "🧑‍⚕️",
    color: "#7C3AED",
    title: "Herramientas para expertos",
    items: ["Panel de gestión de pacientes", "Seguimiento nutricional en tiempo real", "Agenda y videoconsultas integradas", "Facturación y pagos automatizados", "Visibilidad ante miles de usuarios"],
  },
  {
    audience: "Para empresas",
    icon: "🏢",
    color: "#16A34A",
    title: "Bienestar corporativo",
    items: ["Programas de salud para empleados", "Dashboard de bienestar empresarial", "Integración con RRHH y beneficios", "Reportes de impacto y ROI", "Soluciones B2B personalizadas"],
  },
];

const PLANS = [
  {
    name: "Básico",
    price: "Gratis",
    period: "",
    desc: "Empieza a cuidarte sin coste",
    features: ["BuddyCare básico", "Menús semanales", "Lista de la compra", "Recetas ilimitadas"],
    cta: "Empezar gratis",
    highlight: false,
    badge: null,
  },
  {
    name: "Buddy One",
    price: "9,99€",
    period: "/mes",
    desc: "El ecosistema completo",
    features: ["Todos los módulos", "IA personalizada avanzada", "Acceso a profesionales", "Buddy Pets incluido", "Soporte prioritario"],
    cta: "Activar Buddy One",
    highlight: true,
    badge: "Más popular",
  },
  {
    name: "Empresas",
    price: "A medida",
    period: "",
    desc: "Soluciones B2B y corporativas",
    features: ["Todo en Buddy One", "Panel corporativo", "Integración RRHH", "SLA garantizado", "Account manager dedicado"],
    cta: "Contactar ventas",
    highlight: false,
    badge: null,
  },
];

function getColorRgb(color: string): string {
  const map: Record<string, string> = {
    "#F97316": "249,115,22",
    "#7C3AED": "124,58,237",
    "#E11D48": "225,29,72",
    "#16A34A": "22,163,74",
    "#2563EB": "37,99,235",
  };
  return map[color] || "249,115,22";
}

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/app/dashboard");
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveModule((prev) => (prev + 1) % MODULES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const mod = MODULES[activeModule];

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "#0A0A0A" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>B</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 150, 300].map((d) => <div key={d} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F97316", animation: "bounce 1s infinite", animationDelay: `${d}ms` }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", background: "#0A0A0A", color: "white", minHeight: "100vh", overflowX: "hidden" }}>

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,10,10,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 20px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "17px", color: "white" }}>B</div>
            <div>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Buddy</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#F97316", letterSpacing: "-0.02em" }}>One</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", gap: "20px" }}>
              {[["Módulos", "#modulos"], ["Funcionalidades", "#funcionalidades"], ["Servicios", "#servicios"], ["Precios", "#precios"]].map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: "14px", color: "rgba(255,255,255,0.50)", textDecoration: "none", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.50)")}
                >{label}</a>
              ))}
            </div>
            <LanguageSelector variant="nav" className="text-white/50 hover:text-white/80" />
            <a href={isAuthenticated ? "/app/dashboard" : getLoginUrl()} style={{ padding: "9px 20px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(249,115,22,0.30)" }}>
              {isAuthenticated ? "Ir a la app" : "Empezar gratis"}
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: "700px", height: "400px", background: "radial-gradient(ellipse at center, rgba(249,115,22,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", left: "15%", width: "300px", height: "300px", background: "radial-gradient(ellipse at center, rgba(124,58,237,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: "250px", height: "250px", background: "radial-gradient(ellipse at center, rgba(22,163,74,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: "760px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "100px", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", marginBottom: "32px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#F97316" }} />
            <span style={{ fontSize: "13px", color: "#FB923C", fontWeight: 600 }}>Sistema operativo de tu bienestar</span>
          </div>

          <h1 style={{ fontSize: "clamp(38px, 7vw, 72px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.04em", margin: "0 0 24px", color: "white" }}>
            Todo lo que necesitas<br />
            <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 40%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>para cuidarte</span>
            <br />en un solo lugar
          </h1>

          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "rgba(255,255,255,0.50)", lineHeight: 1.65, margin: "0 auto 44px", maxWidth: "580px" }}>
            Buddy One combina inteligencia artificial, nutrición, compra inteligente y acceso a profesionales para ayudarte a mejorar tu salud de forma simple, personalizada y continua.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href={isAuthenticated ? "/app/dashboard" : getLoginUrl()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 32px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "16px", fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 32px rgba(249,115,22,0.35)", letterSpacing: "-0.01em" }}>
              Empezar gratis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#modulos" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 28px", borderRadius: "14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.80)", fontSize: "16px", fontWeight: 700, textDecoration: "none" }}>
              Ver cómo funciona
            </a>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "52px" }}>
            {MODULES.map((m) => (
              <div key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "100px", background: `rgba(${getColorRgb(m.color)},0.12)`, border: `1px solid rgba(${getColorRgb(m.color)},0.25)` }}>
                <span style={{ fontSize: "13px" }}>{m.icon}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: m.color }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÓDULOS */}
      <section id="modulos" style={{ padding: "100px 20px", background: "#0F0F0F" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>El ecosistema</p>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>Un ecosistema,<br /><span style={{ color: "#F97316" }}>múltiples soluciones</span></h2>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.40)", maxWidth: "500px", margin: "0 auto", lineHeight: 1.6 }}>Cinco módulos integrados que trabajan juntos para transformar tu bienestar.</p>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "48px" }}>
            {MODULES.map((m, i) => (
              <button key={m.id} onClick={() => setActiveModule(i)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "100px", border: `1.5px solid ${activeModule === i ? m.color : "rgba(255,255,255,0.08)"}`, background: activeModule === i ? `rgba(${getColorRgb(m.color)},0.12)` : "transparent", color: activeModule === i ? m.color : "rgba(255,255,255,0.45)", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                <span>{m.icon}</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          <div style={{ background: `rgba(${getColorRgb(mod.color)},0.04)`, border: `1px solid rgba(${getColorRgb(mod.color)},0.18)`, borderRadius: "24px", padding: "clamp(24px, 4vw, 48px)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px", borderRadius: "12px", background: `rgba(${getColorRgb(mod.color)},0.12)`, border: `1px solid rgba(${getColorRgb(mod.color)},0.25)`, marginBottom: "24px" }}>
                <span style={{ fontSize: "20px" }}>{mod.icon}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: mod.color }}>{mod.tagline}</span>
              </div>
              <h3 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px", color: "white" }}>{mod.name}</h3>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.50)", lineHeight: 1.7, margin: "0 0 32px" }}>{mod.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {mod.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "6px", background: `rgba(${getColorRgb(mod.color)},0.18)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={mod.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.70)", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: `linear-gradient(135deg, rgba(${getColorRgb(mod.color)},0.18) 0%, rgba(${getColorRgb(mod.color)},0.04) 100%)`, border: `1px solid rgba(${getColorRgb(mod.color)},0.25)`, borderRadius: "20px", padding: "40px", textAlign: "center" }}>
                <div style={{ fontSize: "72px", marginBottom: "16px" }}>{mod.icon}</div>
                <div style={{ fontSize: "24px", fontWeight: 900, color: "white", marginBottom: "8px" }}>{mod.name}</div>
                <div style={{ fontSize: "14px", color: mod.color, fontWeight: 600 }}>{mod.tagline}</div>
              </div>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                {MODULES.map((_, i) => (
                  <div key={i} onClick={() => setActiveModule(i)} style={{ width: i === activeModule ? "24px" : "8px", height: "8px", borderRadius: "4px", background: i === activeModule ? mod.color : "rgba(255,255,255,0.15)", cursor: "pointer", transition: "all 0.3s" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" style={{ padding: "100px 20px", background: "#0A0A0A" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Funcionalidades</p>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>Inteligencia que<br /><span style={{ color: "#F97316" }}>trabaja para ti</span></h2>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.40)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>Todo el ecosistema Buddy One está diseñado para aprender, adaptarse y mejorar contigo.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {ECOSYSTEM_FEATURES.map((f, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "28px", transition: "all 0.2s", cursor: "default" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(249,115,22,0.20)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
              >
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "white", margin: "0 0 10px", letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.40)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" style={{ padding: "100px 20px", background: "#0F0F0F" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Servicios</p>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>Una plataforma,<br /><span style={{ color: "#F97316" }}>para todos</span></h2>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.40)", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>Buddy One sirve a usuarios, profesionales y empresas con soluciones adaptadas a cada necesidad.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {SERVICES.map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(${getColorRgb(s.color)},0.18)`, borderRadius: "24px", padding: "36px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: `radial-gradient(circle at top right, rgba(${getColorRgb(s.color)},0.12), transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "100px", background: `rgba(${getColorRgb(s.color)},0.12)`, border: `1px solid rgba(${getColorRgb(s.color)},0.25)`, marginBottom: "24px" }}>
                  <span style={{ fontSize: "16px" }}>{s.icon}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.audience}</span>
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, color: "white", margin: "0 0 20px", letterSpacing: "-0.02em" }}>{s.title}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {s.items.map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "5px", background: `rgba(${getColorRgb(s.color)},0.18)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.60)", fontWeight: 500 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ padding: "100px 20px", background: "#0A0A0A" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>Precios</p>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 16px" }}>Empieza gratis,<br /><span style={{ color: "#F97316" }}>crece sin límites</span></h2>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.40)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.6 }}>Sin compromisos. Cancela cuando quieras.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", alignItems: "start" }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{ background: plan.highlight ? "linear-gradient(135deg, #F97316, #FB923C)" : "rgba(255,255,255,0.03)", border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "36px", position: "relative", overflow: "hidden" }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: "16px", right: "16px", padding: "4px 12px", borderRadius: "100px", background: "rgba(255,255,255,0.20)", fontSize: "11px", fontWeight: 700, color: "white", letterSpacing: "0.04em" }}>{plan.badge}</div>
                )}
                <div style={{ marginBottom: "24px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: plan.highlight ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{plan.name}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "40px", fontWeight: 900, color: plan.highlight ? "white" : "#F97316", letterSpacing: "-0.04em" }}>{plan.price}</span>
                    {plan.period && <span style={{ fontSize: "14px", color: plan.highlight ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)" }}>{plan.period}</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>{plan.desc}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "5px", background: plan.highlight ? "rgba(255,255,255,0.20)" : "rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={plan.highlight ? "white" : "#F97316"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: "14px", color: plan.highlight ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.55)", fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={isAuthenticated ? "/app/dashboard" : getLoginUrl()} style={{ display: "block", textAlign: "center", padding: "14px", borderRadius: "12px", background: plan.highlight ? "white" : "rgba(249,115,22,0.12)", border: plan.highlight ? "none" : "1px solid rgba(249,115,22,0.25)", color: "#F97316", fontSize: "15px", fontWeight: 800, textDecoration: "none", letterSpacing: "-0.01em" }}>
                  {isAuthenticated ? "Ir al dashboard" : plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "100px 20px", background: "#0F0F0F", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "300px", background: "radial-gradient(ellipse at center, rgba(249,115,22,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px", flexWrap: "wrap" }}>
            {MODULES.map((m) => (
              <div key={m.id} style={{ width: "44px", height: "44px", borderRadius: "12px", background: `rgba(${getColorRgb(m.color)},0.15)`, border: `1px solid rgba(${getColorRgb(m.color)},0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{m.icon}</div>
            ))}
          </div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 16px", color: "white" }}>
            Entra en el<br />
            <span style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ecosistema Buddy One</span>
          </h2>
          <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.45)", margin: "0 0 40px", lineHeight: 1.65 }}>
            No estás descargando una app.<br />Estás entrando en una plataforma que crece contigo.
          </p>
          <a href={isAuthenticated ? "/app/dashboard" : getLoginUrl()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "18px 36px", borderRadius: "16px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "17px", fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 40px rgba(249,115,22,0.38)", letterSpacing: "-0.01em" }}>
            Empezar gratis ahora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.22)", marginTop: "20px" }}>Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      {/* FINANCIACIÓN ENISA - SECTION */}
      <section style={{ padding: "60px 20px", background: "linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(249, 115, 22, 0.02))", borderTop: "1px solid rgba(249, 115, 22, 0.1)", borderBottom: "1px solid rgba(249, 115, 22, 0.1)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px" }}>
            {/* Texto */}
            <div style={{ textAlign: "center", maxWidth: "700px" }}>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(249, 115, 22, 0.8)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px 0" }}>Respaldado por</p>
              <h2 style={{ fontSize: "32px", fontWeight: 900, color: "white", margin: "0 0 16px 0", lineHeight: 1.2 }}>Financiado por ENISA y NextGenerationEU</h2>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>BuddyOne ha recibido financiación de ENISA (Empresa Nacional de Innovación) a través del programa NextGenerationEU del Gobierno de España. Este apoyo nos permite desarrollar soluciones innovadoras para mejorar tu bienestar y salud.</p>
            </div>
            
            {/* Imagen */}
            <a href="https://www.enisa.es" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "opacity 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
              <img src="/enisa-financiacion.webp" alt="Financiado por ENISA - NextGenerationEU" style={{ maxHeight: "clamp(80px, 16vw, 110px)", width: "auto", objectFit: "contain", display: "block" }} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px 20px 32px", background: "#060606", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Financiación - Top of Footer */}
          <div style={{ background: "linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.04))", borderRadius: "12px", border: "1px solid rgba(249, 115, 22, 0.15)", padding: "32px 24px", marginBottom: "40px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(249, 115, 22, 0.8)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Financiado por</p>
            <a href="https://www.nextgenerationeu.europa.eu" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "opacity 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
              <img src="/financiacion-eu.webp" alt="Financiado por la Unión Europea - NextGenerationEU" style={{ maxHeight: "clamp(70px, 14vw, 90px)", width: "auto", objectFit: "contain", display: "block" }} />
            </a>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textAlign: "center", margin: 0, maxWidth: "500px", lineHeight: 1.4 }}>Este proyecto ha sido financiado con el apoyo de la Unión Europea a través del programa NextGenerationEU.</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "32px", marginBottom: "40px" }}>
            <div style={{ maxWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "16px", color: "white" }}>B</div>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>Buddy<span style={{ color: "#F97316" }}>One</span></span>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.28)", lineHeight: 1.6, margin: 0 }}>El sistema operativo de tu bienestar. Nutrición, compra, salud y más, en un solo lugar.</p>
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Módulos</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {MODULES.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px" }}>{m.icon}</span>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.40)", fontWeight: 500 }}>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Legal</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[{ label: "Términos de uso", href: "/terms" }, { label: "Privacidad", href: "/privacy" }, { label: "Contacto", href: "mailto:iabuddymarket@gmail.com" }].map((l) => (
                  <a key={l.label} href={l.href} style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", textDecoration: "none", fontWeight: 500 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
                  >{l.label}</a>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Idioma</p>
              <LanguageSelector variant="footer" className="text-white/50 hover:text-white/80" />
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "32px", paddingBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "rgba(255,255,255,0.18)" }}>© 2025 Buddy One. Todos los derechos reservados.</p>
              <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.14)", lineHeight: 1.5 }}>
                El contenido de esta plataforma no constituye asesoramiento médico ni nutricional profesional. Consulta siempre con un profesional de la salud.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          nav > div > div:nth-child(2) > div:first-child { display: none !important; }
        }
        @media (max-width: 640px) {
          section[id="modulos"] > div > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
