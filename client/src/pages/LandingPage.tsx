import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";
const LOGO_BLACK = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-black_e1daaa35.jpg";

const FOOD_IMAGES = {
  ensalada: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  pollo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp",
  pasta: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pasta_pesto_tomates-ShvKafyUPxQbbjm5oqKBmm.webp",
  salmon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  bowl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp",
  buddha: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
  teriyaki: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_teriyaki_arroz-BxhouEXinEgLMtuwwTB4gh.webp",
  brownie: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp",
  tortilla: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/tortilla_espinacas-cEYtBTb5hV7xgFpTkVy3TG.webp",
  pan: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp",
  acai: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/acai_bowl_granola-mcBZCMgPadkRDbMhMseJwZ.webp",
  menu: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu_semanal_banner-bJvcZL6L7JygtVy2QeuafW.webp",
  recipes: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",
  shopping: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",
  pantry: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",
  mealprep: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
  vegetables: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg",
};

const ORANGE = "#F97316";
const ORANGE_DARK = "#EA580C";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const loginUrl = getLoginUrl();

  const features = [
    {
      icon: "🤖",
      title: "IA Nutricional Personalizada",
      desc: "Nuestra inteligencia artificial analiza tu perfil, alergias, condiciones médicas y objetivos para generar planes de alimentación únicos para ti. Menús para embarazadas, diabéticos, celíacos, deportistas y más de 24 perfiles especiales.",
      img: FOOD_IMAGES.salmon,
      tag: "Inteligencia Artificial",
    },
    {
      icon: "📋",
      title: "Menús Semanales Automáticos",
      desc: "Genera tu menú semanal completo en segundos. Con 5 comidas diarias, macros detallados y lista de la compra integrada. Adaptado a tus restricciones dietéticas y preferencias personales.",
      img: FOOD_IMAGES.menu,
      tag: "Planificación",
    },
    {
      icon: "🍳",
      title: "Biblioteca de Recetas",
      desc: "Miles de recetas saludables con información nutricional completa, instrucciones paso a paso, tiempos de preparación y filtros por alérgenos. Crea y comparte tus propias recetas con la comunidad.",
      img: FOOD_IMAGES.recipes,
      tag: "Recetas",
    },
    {
      icon: "🛒",
      title: "Lista de la Compra Inteligente",
      desc: "Genera automáticamente tu lista de la compra a partir de tus menús semanales. Organizada por categorías, con control de inventario y detección de lo que ya tienes en casa.",
      img: FOOD_IMAGES.shopping,
      tag: "Compras",
    },
    {
      icon: "📊",
      title: "Seguimiento Nutricional",
      desc: "Registra tus comidas y monitoriza en tiempo real tus calorías, proteínas, carbohidratos y grasas. Estadísticas detalladas, racha de días y sistema de logros para mantenerte motivado.",
      img: FOOD_IMAGES.mealprep,
      tag: "Seguimiento",
    },
    {
      icon: "🏪",
      title: "Inventario del Hogar",
      desc: "Controla lo que tienes en tu despensa, nevera y congelador. BuddyMarket te avisa de lo que está por caducar y adapta tus recetas a los ingredientes disponibles.",
      img: FOOD_IMAGES.pantry,
      tag: "Inventario",
    },
  ];

  const specialMenus = [
    { emoji: "🤰", label: "Embarazadas" },
    { emoji: "🌱", label: "Veganos" },
    { emoji: "🌾", label: "Celíacos" },
    { emoji: "💉", label: "Diabéticos" },
    { emoji: "❤️", label: "Hipertensión" },
    { emoji: "💪", label: "Deportistas" },
    { emoji: "🤧", label: "Resfriado" },
    { emoji: "🧓", label: "Mayores 65" },
    { emoji: "👶", label: "Niños" },
    { emoji: "🔬", label: "Oncológico" },
    { emoji: "🧘", label: "Intestino irritable" },
    { emoji: "🦴", label: "Osteoporosis" },
  ];

  const plans = [
    {
      name: "Free",
      price: "0€",
      period: "para siempre",
      color: "#6b7280",
      features: [
        "Perfil nutricional básico",
        "5 recetas al mes",
        "Diario nutricional",
        "Lista de la compra",
        "Acceso a la comunidad",
      ],
      cta: "Empezar gratis",
      highlight: false,
    },
    {
      name: "Pro",
      price: "9,99€",
      period: "al mes",
      color: ORANGE,
      features: [
        "Todo lo de Free",
        "Menús semanales ilimitados",
        "IA nutricional personalizada",
        "Menús especializados (24 perfiles)",
        "Inventario del hogar",
        "Estadísticas avanzadas",
        "BuddyMakers y BuddyExperts",
      ],
      cta: "Comenzar Pro",
      highlight: true,
    },
    {
      name: "Pro Max",
      price: "19,99€",
      period: "al mes",
      color: "#7c3aed",
      features: [
        "Todo lo de Pro",
        "Consultas con nutricionistas",
        "Planes médicos supervisados",
        "Análisis de sangre integrado",
        "Soporte prioritario 24/7",
        "Acceso anticipado a nuevas funciones",
      ],
      cta: "Comenzar Pro Max",
      highlight: false,
    },
  ];

  const testimonials = [
    {
      name: "María G.",
      role: "Mamá de 3 hijos",
      text: "BuddyMarket me ha cambiado la vida. Antes tardaba horas en planificar la semana, ahora en 2 minutos tengo el menú completo y la lista de la compra lista.",
      img: FOOD_IMAGES.ensalada,
      stars: 5,
    },
    {
      name: "Carlos R.",
      role: "Deportista amateur",
      text: "El seguimiento de macros es increíble. Por fin tengo una herramienta que entiende mis objetivos de rendimiento y me ayuda a comer bien sin complicarme.",
      img: FOOD_IMAGES.pollo,
      stars: 5,
    },
    {
      name: "Ana M.",
      role: "Celíaca diagnosticada",
      text: "Soy celíaca y encontrar recetas seguras era un calvario. Con BuddyMarket filtro por alérgenos y tengo menús específicos para mi condición. Una maravilla.",
      img: FOOD_IMAGES.buddha,
      stars: 5,
    },
  ];

  const stats = [
    { value: "50.000+", label: "Usuarios activos" },
    { value: "200.000+", label: "Menús generados" },
    { value: "15.000+", label: "Recetas disponibles" },
    { value: "24", label: "Perfiles especializados" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", overflowX: "hidden" }}>

      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled || mobileMenuOpen ? "rgba(255,255,255,0.98)" : "transparent",
        backdropFilter: scrolled || mobileMenuOpen ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled || mobileMenuOpen ? "blur(16px)" : "none",
        borderBottom: scrolled || mobileMenuOpen ? "1px solid #f3f4f6" : "none",
        transition: "all 0.3s ease",
      }}>
        {/* ── Top bar ── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          {/* Logo */}
          <a href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 56, objectFit: "contain", display: "block" }} />
          </a>

          {/* Desktop Nav — hidden on mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="landing-desktop-nav">
            {[
              { label: "Funcionalidades", href: "#features" },
              { label: "Menús Especiales", href: "#special" },
              { label: "Precios", href: "#pricing" },
              { label: "Blog", href: "/blog" },
              { label: "BuddyCoach ↗", href: "https://buddycoach.io" },
            ].map(item => (
              <a key={item.label} href={item.href}
                style={{ fontSize: 15, fontWeight: 500, color: "#374151", textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap" }}
                onMouseEnter={e => (e.currentTarget.style.color = ORANGE)}
                onMouseLeave={e => (e.currentTarget.style.color = "#374151")}
              >{item.label}</a>
            ))}
          </div>

          {/* Desktop CTAs — hidden on mobile */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }} className="landing-desktop-cta">
            <a href={loginUrl} style={{
              padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600,
              color: ORANGE, background: "transparent", border: `2px solid ${ORANGE}`,
              textDecoration: "none", transition: "all 0.2s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = ORANGE; }}
            >Iniciar sesión</a>
            <a href={loginUrl} style={{
              padding: "9px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: "white", background: ORANGE, border: "none",
              textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 14px rgba(249,115,22,0.35)", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = ORANGE_DARK; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = ORANGE; e.currentTarget.style.transform = "translateY(0)"; }}
            >Empezar gratis</a>
          </div>

          {/* Hamburger button — visible on mobile only */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            className="landing-hamburger"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            style={{
              display: "none", /* overridden by CSS media query */
              flexDirection: "column", justifyContent: "center", alignItems: "center",
              width: 44, height: 44, borderRadius: 12,
              background: mobileMenuOpen ? "rgba(249,115,22,0.1)" : "rgba(0,0,0,0.05)",
              border: "none", cursor: "pointer", gap: 5, padding: 0,
              transition: "background 0.2s", flexShrink: 0,
            }}
          >
            {mobileMenuOpen ? (
              /* X icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              /* Hamburger icon */
              <>
                <span style={{ width: 22, height: 2.5, borderRadius: 2, background: "#374151", transition: "all 0.2s" }} />
                <span style={{ width: 16, height: 2.5, borderRadius: 2, background: "#374151", transition: "all 0.2s", alignSelf: "flex-start", marginLeft: 3 }} />
                <span style={{ width: 22, height: 2.5, borderRadius: 2, background: "#374151", transition: "all 0.2s" }} />
              </>
            )}
          </button>
        </div>

        {/* ── Mobile dropdown menu ── */}
        {mobileMenuOpen && (
          <div style={{
            background: "white",
            borderTop: "1px solid #f3f4f6",
            padding: "16px 20px 24px",
            display: "flex", flexDirection: "column", gap: 4,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }} className="landing-mobile-menu">
            {[
              { label: "Funcionalidades", href: "#features", emoji: "✨" },
              { label: "Menús Especiales", href: "#special", emoji: "🥗" },
              { label: "Precios", href: "#pricing", emoji: "💎" },
              { label: "Blog", href: "/blog", emoji: "📝" },
              { label: "BuddyCoach", href: "https://buddycoach.io", emoji: "💪", external: true },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 16px", borderRadius: 12,
                  fontSize: 16, fontWeight: 600, color: "#111827",
                  textDecoration: "none", transition: "all 0.15s",
                  background: "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(249,115,22,0.07)"; e.currentTarget.style.color = ORANGE; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#111827"; }}
              >
                <span style={{ fontSize: 20 }}>{item.emoji}</span>
                <span>{item.label}{item.external ? " ↗" : ""}</span>
              </a>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "#f3f4f6", margin: "8px 0" }} />

            {/* Auth buttons */}
            <a href={loginUrl} style={{
              display: "block", textAlign: "center",
              padding: "13px 20px", borderRadius: 12, fontSize: 15, fontWeight: 600,
              color: ORANGE, background: "transparent", border: `2px solid ${ORANGE}`,
              textDecoration: "none", marginBottom: 8,
            }}>Iniciar sesión</a>
            <a href={loginUrl} style={{
              display: "block", textAlign: "center",
              padding: "14px 20px", borderRadius: 12, fontSize: 15, fontWeight: 700,
              color: "white", background: ORANGE,
              textDecoration: "none", boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
            }}>Empezar gratis →</a>
          </div>
        )}
      </nav>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fef3c7 100%)",
        padding: "120px 24px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(249,115,22,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(249,115,22,0.04)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          {/* Left */}
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(249,115,22,0.1)", borderRadius: 100,
              padding: "6px 16px", marginBottom: 24,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.08em", textTransform: "uppercase" }}>🚀 Ahora con IA Nutricional</span>
            </div>

            <h1 style={{
              fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.1,
              color: "#111827", marginBottom: 24, letterSpacing: "-0.03em",
            }}>
              Tu nutrición,<br />
              <span style={{ color: ORANGE }}>inteligente</span><br />
              y personalizada
            </h1>

            <p style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              BuddyMarket es el gestor nutricional que se adapta a ti. Menús semanales automáticos, recetas personalizadas, control de inventario y seguimiento nutricional — todo en un solo lugar.
            </p>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 48 }}>
              <a href={loginUrl} style={{
                padding: "16px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700,
                color: "white", background: ORANGE, textDecoration: "none",
                boxShadow: "0 8px 24px rgba(249,115,22,0.4)", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(249,115,22,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(249,115,22,0.4)"; }}
              >Empezar gratis →</a>
              <a href="#features" style={{
                padding: "16px 32px", borderRadius: 12, fontSize: 16, fontWeight: 600,
                color: "#374151", background: "white", textDecoration: "none",
                border: "2px solid #e5e7eb", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#374151"; }}
              >Ver funcionalidades</a>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {["✅ Sin tarjeta de crédito", "✅ Gratis para siempre", "✅ Cancela cuando quieras"].map(t => (
                <span key={t} style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Right — food grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 16, height: 480 }}>
            <div style={{ gridRow: "1 / 3", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
              <img src={FOOD_IMAGES.salmon} alt="Salmón con quinoa" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
              <img src={FOOD_IMAGES.ensalada} alt="Ensalada mediterránea" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
              <img src={FOOD_IMAGES.bowl} alt="Bowl de açaí" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ──────────────────────────────────────────────────────── */}
      <section style={{ background: "#111827", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40, textAlign: "center" }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: ORANGE, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: "#9ca3af", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "100px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>FUNCIONALIDADES</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#111827", marginTop: 12, marginBottom: 16, letterSpacing: "-0.02em" }}>
              Todo lo que necesitas para<br />comer bien cada día
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 560, margin: "0 auto" }}>
              Una plataforma completa que combina inteligencia artificial con nutrición real para ayudarte a alcanzar tus objetivos.
            </p>
          </div>

          {/* Feature tabs */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
            {features.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)} style={{
                padding: "10px 20px", borderRadius: 100, fontSize: 14, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s", border: "none",
                background: activeFeature === i ? ORANGE : "#f3f4f6",
                color: activeFeature === i ? "white" : "#374151",
                boxShadow: activeFeature === i ? "0 4px 14px rgba(249,115,22,0.3)" : "none",
              }}>{f.icon} {f.tag}</button>
            ))}
          </div>

          {/* Active feature */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{features[activeFeature].icon}</div>
              <h3 style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginBottom: 16, letterSpacing: "-0.02em" }}>
                {features[activeFeature].title}
              </h3>
              <p style={{ fontSize: 17, color: "#6b7280", lineHeight: 1.8, marginBottom: 32 }}>
                {features[activeFeature].desc}
              </p>
              <a href={loginUrl} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                color: "white", background: ORANGE, textDecoration: "none",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
              }}>Probar ahora →</a>
            </div>
            <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.12)", aspectRatio: "4/3" }}>
              <img src={features[activeFeature].img} alt={features[activeFeature].title}
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "all 0.4s ease" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SPECIAL MENUS ──────────────────────────────────────────────── */}
      <section id="special" style={{ padding: "100px 24px", background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>MENÚS ESPECIALIZADOS</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#111827", marginTop: 12, marginBottom: 16, letterSpacing: "-0.02em" }}>
              Un menú para cada persona,<br />condición y momento vital
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 560, margin: "0 auto" }}>
              Nuestra IA genera menús adaptados a más de 24 perfiles especiales, desde embarazadas hasta personas con condiciones médicas crónicas.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
            {specialMenus.map(m => (
              <div key={m.label} style={{
                background: "white", borderRadius: 16, padding: "20px 16px", textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: "all 0.2s", cursor: "pointer",
                border: "2px solid transparent",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(249,115,22,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{m.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Food mosaic */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, borderRadius: 24, overflow: "hidden" }}>
            {[FOOD_IMAGES.pasta, FOOD_IMAGES.teriyaki, FOOD_IMAGES.brownie, FOOD_IMAGES.tortilla, FOOD_IMAGES.acai, FOOD_IMAGES.buddha, FOOD_IMAGES.pan, FOOD_IMAGES.pollo].map((img, i) => (
              <div key={i} style={{ aspectRatio: "1", overflow: "hidden" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section style={{ padding: "100px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>TESTIMONIOS</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#111827", marginTop: 12, letterSpacing: "-0.02em" }}>
              Lo que dicen nuestros usuarios
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: "#f9fafb", borderRadius: 20, padding: 32,
                border: "1px solid #f3f4f6", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {"★★★★★".split("").map((s, j) => <span key={j} style={{ color: ORANGE, fontSize: 18 }}>{s}</span>)}
                </div>
                <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.7, marginBottom: 24, fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                    <img src={t.img} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: "#9ca3af" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "100px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>PRECIOS</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#111827", marginTop: 12, marginBottom: 16, letterSpacing: "-0.02em" }}>
              Elige tu plan
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280" }}>Sin permanencia. Cancela cuando quieras.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? "#111827" : "white",
                borderRadius: 24, padding: 40,
                border: plan.highlight ? `3px solid ${ORANGE}` : "2px solid #e5e7eb",
                position: "relative", transition: "all 0.2s",
                boxShadow: plan.highlight ? "0 24px 80px rgba(0,0,0,0.15)" : "0 4px 20px rgba(0,0,0,0.04)",
                transform: plan.highlight ? "scale(1.04)" : "scale(1)",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: ORANGE, color: "white", fontSize: 12, fontWeight: 700,
                    padding: "4px 16px", borderRadius: 100, letterSpacing: "0.05em",
                  }}>MÁS POPULAR</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 8, letterSpacing: "0.05em" }}>{plan.name.toUpperCase()}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: plan.highlight ? "white" : "#111827" }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.highlight ? "#9ca3af" : "#6b7280" }}>/{plan.period}</span>
                </div>
                <div style={{ height: 1, background: plan.highlight ? "#374151" : "#f3f4f6", margin: "24px 0" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: plan.highlight ? "#d1d5db" : "#374151" }}>
                      <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={loginUrl} style={{
                  display: "block", textAlign: "center",
                  padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                  color: plan.highlight ? "white" : plan.color,
                  background: plan.highlight ? ORANGE : "transparent",
                  border: plan.highlight ? "none" : `2px solid ${plan.color}`,
                  textDecoration: "none", transition: "all 0.2s",
                  boxShadow: plan.highlight ? "0 8px 24px rgba(249,115,22,0.4)" : "none",
                }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                >{plan.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BUDDYCOACH ─────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 24px", background: "#0f172a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            {/* Left: text */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f97316", letterSpacing: "0.1em", textTransform: "uppercase" }}>ECOSISTEMA BUDDY</span>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "white", marginTop: 12, marginBottom: 20, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                ¿Eres entrenador personal?<br />
                <span style={{ color: "#f97316" }}>Conoce BuddyCoach</span>
              </h2>
              <p style={{ fontSize: 17, color: "#94a3b8", lineHeight: 1.8, marginBottom: 32 }}>
                BuddyCoach.io es la plataforma hermana de BuddyMarket diseñada para entrenadores personales y coaches de fitness. Gestiona tus clientes, crea planes de entrenamiento personalizados y conecta la nutrición con el rendimiento deportivo.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                {[
                  { icon: "👥", text: "Gestión completa de clientes y seguimiento de progreso" },
                  { icon: "🏋️", text: "Planes de entrenamiento personalizados con IA" },
                  { icon: "🔗", text: "Integración directa con los menús nutricionales de BuddyMarket" },
                  { icon: "📈", text: "Métricas de rendimiento, fuerza y composición corporal" },
                  { icon: "💬", text: "Comunicación directa con tus clientes desde la plataforma" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                    <span style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.6 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "16px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700,
                color: "white", background: "#f97316", textDecoration: "none",
                boxShadow: "0 8px 24px rgba(249,115,22,0.4)", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(249,115,22,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(249,115,22,0.4)"; }}
              >
                Visitar BuddyCoach.io
                <span style={{ fontSize: 18 }}>→</span>
              </a>
            </div>

            {/* Right: feature cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { icon: "🎯", title: "Planes a medida", desc: "Crea rutinas de entrenamiento adaptadas a cada cliente con IA" },
                { icon: "📊", title: "Seguimiento real", desc: "Monitoriza fuerza, peso, medidas y rendimiento en tiempo real" },
                { icon: "🥗", title: "Nutrición integrada", desc: "Conecta con BuddyMarket para planes nutricionales completos" },
                { icon: "💰", title: "Gestión de negocio", desc: "Facturación, pagos y gestión de suscripciones de clientes" },
              ].map((card, i) => (
                <div key={i} style={{
                  background: "#1e293b", borderRadius: 16, padding: "24px",
                  border: "1px solid #334155", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 8 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{card.desc}</div>
                </div>
              ))}
              <div style={{
                gridColumn: "1 / -1",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                borderRadius: 16, padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>🤝 Ecosistema completo</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>BuddyMarket + BuddyCoach = nutrición y entrenamiento unidos</div>
                </div>
                <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  color: "#f97316", background: "white", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                }}>Ver más →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ──────────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 24px",
        background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 80, objectFit: "contain", marginBottom: 32, filter: "brightness(0) invert(1)" }} />
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "white", marginBottom: 20, letterSpacing: "-0.02em" }}>
            Empieza hoy a comer<br />de forma inteligente
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", marginBottom: 40, lineHeight: 1.7 }}>
            Únete a más de 50.000 personas que ya han transformado su alimentación con BuddyMarket. Gratis para siempre, sin tarjeta de crédito.
          </p>
          <a href={loginUrl} style={{
            display: "inline-block", padding: "18px 48px", borderRadius: 14, fontSize: 18, fontWeight: 800,
            color: ORANGE, background: "white", textDecoration: "none",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.2)"; }}
          >Crear cuenta gratuita →</a>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0f172a", color: "#9ca3af", padding: "64px 24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 60, objectFit: "contain", marginBottom: 16, filter: "brightness(0) invert(1)" }} />
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#6b7280", maxWidth: 280 }}>
                El gestor nutricional inteligente que se adapta a ti. Planifica, cocina y come bien cada día.
              </p>
              <p style={{ fontSize: 12, color: "#4b5563", marginTop: 16, lineHeight: 1.6 }}>
                ⚠️ El contenido de BuddyMarket es orientativo y no sustituye el consejo de un profesional de la salud. Consulta siempre con un nutricionista o médico.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase" }}>Producto</h4>
              {["Funcionalidades", "Precios", "Menús Especiales", "BuddyMakers", "BuddyExperts"].map(l => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = ORANGE)}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                  >{l}</a>
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#f97316", textDecoration: "none", fontWeight: 600 }}>BuddyCoach.io ↗</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase" }}>Recursos</h4>
              {[
                { label: "Blog", href: "/blog" },
                { label: "Centro de ayuda", href: "#" },
                { label: "Comunidad", href: "#" },
                { label: "API", href: "#" },
              ].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <a href={l.href} style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = ORANGE)}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                  >{l.label}</a>
                </div>
              ))}
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase" }}>Legal</h4>
              {[
                { label: "Términos y Condiciones", href: "/terms" },
                { label: "Política de Privacidad", href: "/privacy" },
                { label: "Política de Cookies", href: "/cookies" },
                { label: "Aviso Legal", href: "/legal" },
                { label: "RGPD", href: "/gdpr" },
              ].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e: any) => (e.currentTarget.style.color = ORANGE)}
                    onMouseLeave={(e: any) => (e.currentTarget.style.color = "#6b7280")}
                  >{l.label}</Link>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <p style={{ fontSize: 13, color: "#4b5563" }}>© 2025 BuddyMarket. Todos los derechos reservados.</p>
            <div style={{ display: "flex", gap: 24 }}>
              {["Twitter/X", "Instagram", "LinkedIn", "YouTube"].map(s => (
                <a key={s} href="#" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = ORANGE)}
                  onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}
                >{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }
        @media (max-width: 900px) {
          section > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          section > div > div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
          section > div > div[style*="grid-template-columns: 2fr 1fr 1fr 1fr"] {
            grid-template-columns: 1fr 1fr !important;
          }
          section > div > div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
