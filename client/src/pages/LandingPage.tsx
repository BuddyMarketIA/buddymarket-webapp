import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import WebSSOButtons from "@/components/WebSSOButtons";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";

const LOGO_HORIZONTAL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-horizontal-orange_0dcbe0a8.png";
const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png";

const FOOD = {
  salmon:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  ensalada: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  bowl:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp",
  pasta:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pasta_pesto_tomates-ShvKafyUPxQbbjm5oqKBmm.webp",
  pollo:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp",
  menu:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu_semanal_banner-bJvcZL6L7JygtVy2QeuafW.webp",
  teriyaki: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_teriyaki_arroz-BxhouEXinEgLMtuwwTB4gh.webp",
  brownie:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp",
  tortilla: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/tortilla_espinacas-cEYtBTb5hV7xgFpTkVy3TG.webp",
  acai:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/acai_bowl_granola-mcBZCMgPadkRDbMhMseJwZ.webp",
  buddha:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
  pan:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp",
  recipes:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",
  shopping: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",
  pantry:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",
  mealprep: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
};

const FEATURES = [
  { icon: "🤖", tag: "IA Nutricional", title: "IA Nutricional\nPersonalizada", img: FOOD.salmon,
    desc: "Nuestra inteligencia artificial analiza tu perfil, alergias, condiciones médicas y objetivos para generar planes de alimentación únicos. Más de 24 perfiles especiales.", color: "#F97316" },
  { icon: "📋", tag: "Menús", title: "Menús Semanales\nAutomáticos", img: FOOD.menu,
    desc: "Genera tu menú semanal completo en segundos. Con 5 comidas diarias, macros detallados y lista de la compra integrada. Adaptado a tus restricciones dietéticas.", color: "#10b981" },
  { icon: "🍳", tag: "Recetas", title: "Biblioteca de\nRecetas", img: FOOD.recipes,
    desc: "Miles de recetas saludables con información nutricional completa, instrucciones paso a paso, tiempos de preparación y filtros por alérgenos.", color: "#8b5cf6" },
  { icon: "🛒", tag: "Compras", title: "Lista de la Compra\nInteligente", img: FOOD.shopping,
    desc: "Genera automáticamente tu lista de la compra a partir de tus menús semanales. Organizada por categorías, con control de inventario en tiempo real.", color: "#3b82f6" },
  { icon: "📊", tag: "Seguimiento", title: "Seguimiento\nNutricional", img: FOOD.mealprep,
    desc: "Registra tus comidas y monitoriza en tiempo real tus calorías, proteínas, carbohidratos y grasas. Estadísticas detalladas y sistema de logros.", color: "#f59e0b" },
  { icon: "🏪", tag: "Inventario", title: "Inventario\ndel Hogar", img: FOOD.pantry,
    desc: "Controla lo que tienes en tu despensa, nevera y congelador. BuddyMarket te avisa de lo que está por caducar y adapta tus recetas al instante.", color: "#ec4899" },
];

const SPECIAL_MENUS = [
  { emoji: "🤰", label: "Embarazadas", color: "#fce7f3" },
  { emoji: "🌱", label: "Veganos", color: "#d1fae5" },
  { emoji: "🌾", label: "Celíacos", color: "#fef3c7" },
  { emoji: "💉", label: "Diabéticos", color: "#dbeafe" },
  { emoji: "❤️", label: "Hipertensión", color: "#fee2e2" },
  { emoji: "💪", label: "Deportistas", color: "#ede9fe" },
  { emoji: "🤧", label: "Resfriado", color: "#e0f2fe" },
  { emoji: "🧓", label: "Mayores 65", color: "#f0fdf4" },
  { emoji: "👶", label: "Niños", color: "#fef9c3" },
  { emoji: "🔬", label: "Oncológico", color: "#f3f4f6" },
  { emoji: "🧘", label: "Intestino irritable", color: "#ecfdf5" },
  { emoji: "🦴", label: "Osteoporosis", color: "#eff6ff" },
];

const STATS = [
  { value: 50000, suffix: "+", label: "Usuarios activos", icon: "👥" },
  { value: 200000, suffix: "+", label: "Menús generados", icon: "📋" },
  { value: 15000, suffix: "+", label: "Recetas disponibles", icon: "🍳" },
  { value: 24, suffix: "", label: "Perfiles especializados", icon: "🎯" },
];

const PLANS = [
  {
    name: "Free", price: "0€", period: "para siempre", accent: "#6b7280", highlight: false, cta: "Empezar gratis",
    description: "Para empezar a explorar BuddyMarket",
    features: [
      "Perfil nutricional básico",
      "Ver recetas de la comunidad",
      "3 menús generados al mes (sin IA)",
      "Lista de la compra básica",
      "Inventario del hogar (hasta 20 productos)",
    ],
  },
  {
    name: "Pro", price: "9,99€", period: "al mes", accent: "#F97316", highlight: true, cta: "Empezar con Pro",
    description: "Para quienes quieren sacar el máximo partido a su nutrición",
    features: [
      "Menús semanales ilimitados con IA",
      "24 menús especializados (diabetes, embarazo, celiacía...)",
      "BuddyIA: hasta 50 mensajes/día",
      "Diario nutricional ilimitado",
      "Inventario ilimitado + alertas de caducidad",
      "Métricas de salud (6 meses de historial)",
      "Conectar supermercado online",
    ],
  },
  {
    name: "Pro Max", price: "19,99€", period: "al mes", accent: "#7c3aed", highlight: false, cta: "Empezar con Pro Max",
    description: "Para profesionales de la salud y usuarios avanzados",
    features: [
      "Todo lo de Pro",
      "BuddyIA ilimitado (sin límite de mensajes)",
      "Historial de métricas ilimitado",
      "Crear y publicar tus propias recetas",
      "Acceso a BuddyExperts (nutricionistas reales)",
      "Múltiples perfiles familiares",
      "Exportar informes PDF",
      "Soporte prioritario 24/7",
    ],
  },
];

// Animated counter hook
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// Intersection observer hook
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function StatCard({ value, suffix, label, icon, start }: { value: number; suffix: string; label: string; icon: string; start: boolean }) {
  const count = useCounter(value, 1800, start);
  const display = value >= 1000 ? (count >= 1000 ? `${Math.floor(count / 1000)}k` : "0") : count.toString();
  return (
    <div className="lp-stat-card">
      <div className="lp-stat-icon">{icon}</div>
      <div className="lp-stat-value">{display}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const loginUrl = getLoginUrl();
  const appUrl = user ? "/app/dashboard" : loginUrl;
  const createCheckout = trpc.subscriptions.createCheckout.useMutation();

  const handlePlanCta = async (planName: string) => {
    if (planName === "Free") {
      window.location.href = appUrl;
      return;
    }
    if (!user) {
      window.location.href = loginUrl;
      return;
    }
    const planMap: Record<string, "basic" | "premium" | "pro_max"> = {
      "Pro": "basic",
      "Pro Max": "pro_max",
    };
    const stripePlan = planMap[planName];
    if (!stripePlan) return;
    setCheckoutLoading(planName);
    try {
      const result = await createCheckout.mutateAsync({ plan: stripePlan, origin: window.location.origin });
      if (result.url) {
        toast.info("Redirigiendo al pago seguro...");
        window.open(result.url, "_blank");
      }
    } catch {
      toast.error("Error al iniciar el pago. Inténtalo de nuevo.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.1);
  const specialSection = useInView(0.1);
  const pricingSection = useInView(0.1);
  const coachSection = useInView(0.1);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(i => (i + 1) % FEATURES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled || mobileMenuOpen ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid #f3f4f6" : "1px solid transparent",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <img src={LOGO_ICON} alt="BuddyMarket" style={{ height: 52, width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: 20, fontWeight: 900, color: "#F97316", letterSpacing: "-0.03em", lineHeight: 1 }}>BuddyMarket</span>
          </a>

          {/* Desktop links */}
          <div className="lp-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { label: "Funcionalidades", href: "#features" },
              { label: "Menús Especiales", href: "#special" },
              { label: "Precios", href: "#pricing" },
              { label: "Creadores 💼", href: "/creators" },
              { label: "Blog", href: "/blog" },
              { label: "FAQ", href: "/faq" },
              { label: "BuddyCoach ↗", href: "https://buddycoach.io" },
            ].map(item => (
              <a key={item.label} href={item.href}
                style={{ fontSize: 14, fontWeight: 600, color: "#374151", textDecoration: "none", padding: "8px 14px", borderRadius: 10, transition: "all 0.2s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = "#F97316"; (e.target as HTMLElement).style.background = "#fff7ed"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = "#374151"; (e.target as HTMLElement).style.background = "transparent"; }}>
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="lp-desktop-cta" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href={appUrl} style={{ fontSize: 14, fontWeight: 600, color: "#374151", textDecoration: "none", padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e5e7eb", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#F97316"; (e.target as HTMLElement).style.color = "#F97316"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "#e5e7eb"; (e.target as HTMLElement).style.color = "#374151"; }}>
              Iniciar sesión
            </a>
            <a href={appUrl} style={{ fontSize: 14, fontWeight: 700, color: "white", textDecoration: "none", padding: "10px 22px", borderRadius: 10, background: "linear-gradient(135deg,#F97316,#ea580c)", boxShadow: "0 4px 14px rgba(249,115,22,0.35)", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-1px)"; (e.target as HTMLElement).style.boxShadow = "0 8px 24px rgba(249,115,22,0.45)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; (e.target as HTMLElement).style.boxShadow = "0 4px 14px rgba(249,115,22,0.35)"; }}>
              Empezar gratis
            </a>
          </div>

          {/* Hamburger */}
          <button className="lp-hamburger"
            onClick={() => setMobileMenuOpen(o => !o)}
            style={{ display: "none", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", flexShrink: 0 }}>
            {mobileMenuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{ padding: "12px 20px 20px", borderTop: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 4, background: "white" }}>
            {[
              { label: "Funcionalidades", href: "#features", emoji: "✨" },
              { label: "Menús Especiales", href: "#special", emoji: "🥗" },
              { label: "Precios", href: "#pricing", emoji: "💎" },
              { label: "Creadores", href: "/creators", emoji: "💼" },
              { label: "Blog", href: "/blog", emoji: "📝" },
              { label: "FAQ", href: "/faq", emoji: "❓" },
              { label: "BuddyCoach ↗", href: "https://buddycoach.io", emoji: "💪", external: true },
            ].map(item => (
              <a key={item.label} href={item.href}
                target={(item as any).external ? "_blank" : undefined}
                rel={(item as any).external ? "noopener noreferrer" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, fontSize: 16, fontWeight: 600, color: "#374151", textDecoration: "none" }}>
                <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{item.emoji}</span>
                <span>{item.label}</span>
              </a>
            ))}
            <div style={{ height: 1, background: "#f3f4f6", margin: "8px 0" }} />
            <a href={appUrl} style={{ display: "block", textAlign: "center", padding: "13px 20px", borderRadius: 12, fontSize: 16, fontWeight: 600, color: "#374151", textDecoration: "none", border: "1.5px solid #e5e7eb", marginBottom: 8 }}>Iniciar sesión</a>
            <a href={appUrl} style={{ display: "block", textAlign: "center", padding: "14px 20px", borderRadius: 12, fontSize: 16, fontWeight: 700, color: "white", textDecoration: "none", background: "linear-gradient(135deg,#F97316,#ea580c)", boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}>Empezar gratis →</a>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 72, background: "linear-gradient(150deg, #fff7ed 0%, #ffffff 55%, #f0fdf4 100%)", minHeight: "100svh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "-8%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="lp-hero-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px", display: "flex", flexDirection: "column", gap: 48, width: "100%" }}>
          {/* Text column */}
          <div className="lp-hero-text" style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(32px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "#fff7ed", border: "1.5px solid #fed7aa", fontSize: 13, fontWeight: 700, color: "#ea580c", marginBottom: 24 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#F97316", animation: "lp-pulse 2s infinite" }} />
              Ahora con IA Nutricional
            </div>

            <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", fontWeight: 900, color: "#111827", lineHeight: 1.02, letterSpacing: "-0.04em", margin: "0 0 24px" }}>
              Tu nutrición,<br />
              <span style={{ color: "#F97316", position: "relative" }}>
                inteligente
                <svg style={{ position: "absolute", bottom: -6, left: 0, width: "100%", height: 8, overflow: "visible" }} viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0,6 Q50,0 100,5 Q150,10 200,4" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </span><br />
              y personalizada
            </h1>

            <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#6b7280", lineHeight: 1.75, maxWidth: 540, marginBottom: 36 }}>
              BuddyMarket es el gestor nutricional que se adapta a ti. Menús semanales automáticos, recetas personalizadas, control de inventario y seguimiento nutricional — todo en un solo lugar.
            </p>

            <div className="lp-hero-btns" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              <a href={appUrl} className="lp-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "17px 36px", borderRadius: 14, fontSize: 17, fontWeight: 800, color: "white", textDecoration: "none", background: "linear-gradient(135deg,#F97316,#ea580c)", boxShadow: "0 8px 32px rgba(249,115,22,0.4)", transition: "all 0.25s", width: "fit-content" }}>
                Empezar gratis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>

              <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 28px", borderRadius: 14, fontSize: 16, fontWeight: 700, color: "#374151", textDecoration: "none", border: "2px solid #e5e7eb", background: "white", transition: "all 0.2s", width: "fit-content" }}>
                Ver funcionalidades
              </a>
            </div>

            <div className="lp-trust-row" style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {["✅ Sin tarjeta de crédito", "✅ Gratis para siempre", "✅ Cancela cuando quieras"].map(t => (
                <span key={t} style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Food grid */}
          <div className="lp-hero-grid" style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(48px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.2s" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "200px 200px", gap: 12, borderRadius: 24, overflow: "hidden" }}>
              <div style={{ gridRow: "1 / 3", borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
                <img src={FOOD.salmon} alt="Salmón con quinoa" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s", display: "block" }}
                  onMouseEnter={e => (e.target as HTMLImageElement).style.transform = "scale(1.05)"}
                  onMouseLeave={e => (e.target as HTMLImageElement).style.transform = "scale(1)"} />
              </div>
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
                <img src={FOOD.ensalada} alt="Ensalada mediterránea" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s", display: "block" }}
                  onMouseEnter={e => (e.target as HTMLImageElement).style.transform = "scale(1.05)"}
                  onMouseLeave={e => (e.target as HTMLImageElement).style.transform = "scale(1)"} />
              </div>
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
                <img src={FOOD.bowl} alt="Bowl de açaí" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s", display: "block" }}
                  onMouseEnter={e => (e.target as HTMLImageElement).style.transform = "scale(1.05)"}
                  onMouseLeave={e => (e.target as HTMLImageElement).style.transform = "scale(1)"} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE STRIP ════════════════════════════════════════════════ */}
      <div style={{ background: "#F97316", padding: "14px 0", overflow: "hidden", position: "relative" }}>
        <div style={{ display: "flex", animation: "lp-marquee 20s linear infinite", whiteSpace: "nowrap", gap: 0 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 0, flexShrink: 0 }}>
              {["🤖 IA Nutricional", "📋 Menús Semanales", "🍳 Miles de Recetas", "🛒 Lista de Compra", "📊 Seguimiento", "🏪 Inventario", "🤰 Embarazadas", "🌱 Veganos", "🌾 Celíacos", "💉 Diabéticos", "💪 Deportistas"].map(item => (
                <span key={item} style={{ fontSize: 14, fontWeight: 700, color: "white", padding: "0 32px", letterSpacing: "0.02em" }}>
                  {item} <span style={{ opacity: 0.5, marginLeft: 16 }}>•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STATS ════════════════════════════════════════════════════════ */}
      <section ref={statsSection.ref} style={{ background: "#111827", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="lp-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
            {STATS.map((s, i) => (
              <div key={i} className="lp-stat-card" style={{
                textAlign: "center", padding: "32px 20px",
                background: "rgba(255,255,255,0.04)", borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: statsSection.inView ? 1 : 0,
                transform: statsSection.inView ? "translateY(0)" : "translateY(24px)",
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 900, color: "#F97316", lineHeight: 1 }}>
                  <StatCard value={s.value} suffix={s.suffix} label={s.label} icon="" start={statsSection.inView} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═════════════════════════════════════════════════════ */}
      <section id="features" ref={featuresSection.ref} style={{ padding: "96px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56,
            opacity: featuresSection.inView ? 1 : 0, transform: featuresSection.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>FUNCIONALIDADES</span>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Todo lo que necesitas<br className="lp-desktop-br" /> para comer bien cada día
            </h2>
            <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#6b7280", maxWidth: 560, margin: "0 auto", lineHeight: 1.75 }}>
              Una plataforma completa que combina inteligencia artificial con nutrición real.
            </p>
          </div>

          {/* Feature tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 48, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)} style={{
                padding: "10px 18px", borderRadius: 100, fontSize: 14, fontWeight: 700,
                cursor: "pointer", border: "none", transition: "all 0.25s", flexShrink: 0,
                background: activeFeature === i ? FEATURES[i].color : "#f3f4f6",
                color: activeFeature === i ? "white" : "#374151",
                boxShadow: activeFeature === i ? `0 4px 16px ${FEATURES[i].color}55` : "none",
                transform: activeFeature === i ? "scale(1.05)" : "scale(1)",
              }}>
                {f.icon} {f.tag}
              </button>
            ))}
          </div>

          {/* Active feature */}
          <div className="lp-feature-layout" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{FEATURES[activeFeature].icon}</div>
              <h3 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.025em", lineHeight: 1.15, whiteSpace: "pre-line" }}>
                {FEATURES[activeFeature].title}
              </h3>
              <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.8, marginBottom: 32, maxWidth: 480 }}>
                {FEATURES[activeFeature].desc}
              </p>
              <a href={appUrl} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "white", textDecoration: "none", background: FEATURES[activeFeature].color, boxShadow: `0 6px 20px ${FEATURES[activeFeature].color}55`, transition: "all 0.2s" }}>
                Probar ahora →
              </a>
            </div>
            <div style={{ flex: 1, borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.12)", aspectRatio: "4/3", transition: "all 0.4s" }}>
              <img src={FEATURES[activeFeature].img} alt={FEATURES[activeFeature].title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "all 0.5s", display: "block" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SPECIAL MENUS ════════════════════════════════════════════════ */}
      <section id="special" ref={specialSection.ref} style={{ padding: "96px 24px", background: "linear-gradient(135deg, #fff7ed 0%, #fef9c3 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52,
            opacity: specialSection.inView ? 1 : 0, transform: specialSection.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>MENÚS ESPECIALIZADOS</span>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Un menú para cada persona,<br className="lp-desktop-br" /> condición y momento vital
            </h2>
            <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#6b7280", maxWidth: 560, margin: "0 auto", lineHeight: 1.75 }}>
              Nuestra IA genera menús adaptados a más de 24 perfiles especiales.
            </p>
          </div>

          <div className="lp-special-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 40 }}>
            {SPECIAL_MENUS.map((m, i) => (
              <div key={m.label} style={{
                background: m.color, borderRadius: 16, padding: "20px 12px", textAlign: "center",
                border: "2px solid transparent", cursor: "pointer",
                opacity: specialSection.inView ? 1 : 0,
                transform: specialSection.inView ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
                transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px) scale(1.03)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{m.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", lineHeight: 1.3 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Mosaic */}
          <div className="lp-mosaic-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.1)" }}>
            {[FOOD.pasta, FOOD.teriyaki, FOOD.brownie, FOOD.tortilla, FOOD.acai, FOOD.buddha, FOOD.pan, FOOD.pollo].map((img, i) => (
              <div key={i} style={{ aspectRatio: "1", overflow: "hidden" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s" }}
                  onMouseEnter={e => (e.target as HTMLImageElement).style.transform = "scale(1.08)"}
                  onMouseLeave={e => (e.target as HTMLImageElement).style.transform = "scale(1)"} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "#111827" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>CÓMO FUNCIONA</span>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "white", margin: "12px 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              En 3 pasos, come mejor
            </h2>
          </div>
          <div className="lp-steps-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
            {[
              { step: "01", icon: "👤", title: "Crea tu perfil", desc: "Indica tus objetivos, alergias, condiciones médicas y preferencias. La IA aprende de ti." },
              { step: "02", icon: "🤖", title: "La IA genera tu plan", desc: "En segundos, BuddyMarket crea tu menú semanal personalizado con recetas y lista de la compra." },
              { step: "03", icon: "🎯", title: "Sigue tu progreso", desc: "Registra tus comidas, monitoriza tus macros y alcanza tus objetivos con estadísticas en tiempo real." },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "28px", background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#F97316", letterSpacing: "0.06em", opacity: 0.6, minWidth: 28, paddingTop: 4 }}>{s.step}</div>
                <div style={{ fontSize: 36 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 15, color: "#9ca3af", lineHeight: 1.7 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>TESTIMONIOS</span>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "#111827", margin: "12px 0", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Lo que dicen nuestros usuarios
            </h2>
          </div>
          <div className="lp-testimonials-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            {[
              { text: "Desde que uso BuddyMarket he perdido 8 kg en 3 meses sin pasar hambre. Los menús son deliciosos y muy fáciles de seguir.", name: "María G.", role: "Usuaria desde 2024", img: FOOD.ensalada, rating: 5 },
              { text: "Como celíaco, siempre fue difícil encontrar recetas variadas. BuddyMarket me genera menús sin gluten increíbles cada semana.", name: "Carlos M.", role: "Celíaco, usuario Pro", img: FOOD.pasta, rating: 5 },
              { text: "Soy nutricionista y recomiendo BuddyMarket a mis pacientes. La precisión nutricional y la variedad de perfiles médicos es impresionante.", name: "Laura P.", role: "Nutricionista", img: FOOD.bowl, rating: 5 },
            ].map((t, i) => (
              <div key={i} style={{ background: "#f9fafb", borderRadius: 20, padding: "28px", border: "1px solid #f3f4f6", transition: "all 0.3s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                <div style={{ color: "#F97316", fontSize: 18, letterSpacing: 3, marginBottom: 14 }}>{"★".repeat(t.rating)}</div>
                <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.75, marginBottom: 20, fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
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

      {/* ═══ PRICING ══════════════════════════════════════════════════════ */}
      <section id="pricing" ref={pricingSection.ref} style={{ padding: "96px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 56,
            opacity: pricingSection.inView ? 1 : 0, transform: pricingSection.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>PRECIOS</span>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", letterSpacing: "-0.03em" }}>
              Elige tu plan
            </h2>
            <p style={{ fontSize: 17, color: "#6b7280" }}>Sin permanencia. Cancela cuando quieras.</p>
          </div>

          {/* Plan cards */}
          <div className="lp-pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 56 }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? "#111827" : "white",
                borderRadius: 24, padding: "32px 28px",
                border: `2px solid ${plan.highlight ? plan.accent : "#e5e7eb"}`,
                position: "relative",
                boxShadow: plan.highlight ? "0 24px 80px rgba(0,0,0,0.15)" : "0 4px 20px rgba(0,0,0,0.04)",
                opacity: pricingSection.inView ? 1 : 0,
                transform: pricingSection.inView ? (plan.highlight ? "scale(1.02)" : "scale(1)") : "translateY(24px)",
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#F97316", color: "white", fontSize: 11, fontWeight: 800, padding: "5px 20px", borderRadius: 100, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    &#9733; MÁS POPULAR
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 800, color: plan.accent, marginBottom: 8, letterSpacing: "0.08em" }}>{plan.name.toUpperCase()}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: plan.highlight ? "white" : "#111827", lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: plan.highlight ? "#9ca3af" : "#6b7280" }}>/{plan.period}</span>
                </div>
                <p style={{ fontSize: 13, color: plan.highlight ? "#9ca3af" : "#6b7280", marginBottom: 20, marginTop: 4 }}>{plan.description}</p>
                <div style={{ height: 1, background: plan.highlight ? "#374151" : "#f3f4f6", margin: "0 0 20px" }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: plan.highlight ? "#d1d5db" : "#374151" }}>
                      <span style={{ color: plan.accent, fontWeight: 900, flexShrink: 0, fontSize: 15 }}>&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanCta(plan.name)}
                  disabled={checkoutLoading === plan.name}
                  style={{
                    display: "block", width: "100%", textAlign: "center", padding: "14px 20px", borderRadius: 14,
                    fontSize: 15, fontWeight: 700, cursor: checkoutLoading === plan.name ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    background: checkoutLoading === plan.name ? "#D1D5DB" : (plan.highlight ? plan.accent : "transparent"),
                    color: checkoutLoading === plan.name ? "#9CA3AF" : (plan.highlight ? "white" : plan.accent),
                    border: `2px solid ${checkoutLoading === plan.name ? "#D1D5DB" : plan.accent}`,
                    boxShadow: plan.highlight && checkoutLoading !== plan.name ? `0 8px 24px ${plan.accent}55` : "none",
                  }}
                >
                  {checkoutLoading === plan.name ? "Procesando..." : plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Full comparison table */}
          <div style={{ opacity: pricingSection.inView ? 1 : 0, transition: "all 0.8s 0.4s" }}>
            <h3 style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 24 }}>
              Comparativa completa de planes
            </h3>
            <div className="lp-comparison-table" style={{ background: "white", borderRadius: 24, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#111827" }}>
                <div style={{ padding: "18px 24px", fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>Funcionalidad</div>
                {[
                  { name: "Free", color: "#9ca3af", price: "0€" },
                  { name: "Pro", color: "#F97316", price: "9,99€" },
                  { name: "Pro Max", color: "#a78bfa", price: "19,99€" },
                ].map(p => (
                  <div key={p.name} style={{ padding: "18px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{p.price}/mes</div>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {([
                { category: "Recetas", rows: [
                  { label: "Ver recetas de la comunidad", free: true, pro: true, promax: true },
                  { label: "Recetas guardadas", free: "10", pro: "Ilimitadas", promax: "Ilimitadas" },
                  { label: "Crear tus propias recetas", free: false, pro: false, promax: true },
                  { label: "Publicar como BuddyMaker", free: "Con aprobación", pro: "Con aprobación", promax: "Con aprobación" },
                ]},
                { category: "Menús con IA", rows: [
                  { label: "Menús generados al mes", free: "3", pro: "Ilimitados", promax: "Ilimitados" },
                  { label: "Generación de menús con IA", free: false, pro: true, promax: true },
                  { label: "24 menús especializados (diabetes, embarazo...)", free: false, pro: true, promax: true },
                ]},
                { category: "Diario Nutricional", rows: [
                  { label: "Registro de comidas diario", free: false, pro: true, promax: true },
                  { label: "Seguimiento de macros y calorías", free: false, pro: true, promax: true },
                  { label: "Historial nutricional", free: false, pro: "6 meses", promax: "Ilimitado" },
                ]},
                { category: "Inventario", rows: [
                  { label: "Inventario del hogar", free: "20 productos", pro: "Ilimitado", promax: "Ilimitado" },
                  { label: "Alertas de caducidad", free: false, pro: true, promax: true },
                  { label: "Lista de la compra automática", free: true, pro: true, promax: true },
                  { label: "Conectar supermercado online", free: false, pro: true, promax: true },
                ]},
                { category: "BuddyIA (Asistente IA)", rows: [
                  { label: "Mensajes al día con BuddyIA", free: "0", pro: "50", promax: "Ilimitados" },
                  { label: "Generación de menús por cuestionario", free: false, pro: true, promax: true },
                ]},
                { category: "Métricas de Salud", rows: [
                  { label: "Seguimiento de peso y medidas", free: false, pro: true, promax: true },
                  { label: "Historial de métricas", free: false, pro: "6 meses", promax: "Ilimitado" },
                ]},
                { category: "Comunidad BuddyMarket", rows: [
                  { label: "Ver recetas de BuddyMakers", free: true, pro: true, promax: true },
                  { label: "Consultas con BuddyExperts (nutricionistas)", free: false, pro: false, promax: true },
                  { label: "Solicitar ser BuddyMaker", free: "Con aprobación", pro: "Con aprobación", promax: "Con aprobación" },
                  { label: "Solicitar ser BuddyExpert", free: "Con aprobación", pro: "Con aprobación", promax: "Con aprobación" },
                ]},
                { category: "Extras Pro Max", rows: [
                  { label: "Exportar informes PDF", free: false, pro: false, promax: true },
                  { label: "Múltiples perfiles familiares", free: false, pro: false, promax: true },
                  { label: "Soporte prioritario 24/7", free: false, pro: false, promax: true },
                ]},
              ] as Array<{ category: string; rows: Array<{ label: string; free: boolean | string; pro: boolean | string; promax: boolean | string }>}>).map((section, si) => (
                <div key={si}>
                  <div style={{ background: "#f9fafb", padding: "9px 24px", fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", borderTop: si > 0 ? "1px solid #f3f4f6" : "none" }}>
                    {section.category}
                  </div>
                  {section.rows.map((row, ri) => (
                    <div key={ri} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ padding: "13px 24px", fontSize: 13.5, color: "#374151" }}>{row.label}</div>
                      {([row.free, row.pro, row.promax] as Array<boolean | string>).map((val, ci) => {
                        const colors = ["#9ca3af", "#F97316", "#7c3aed"];
                        const isTrue = val === true;
                        const isFalse = val === false;
                        return (
                          <div key={ci} style={{ padding: "13px 12px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isTrue && <span style={{ fontSize: 17, color: colors[ci], fontWeight: 900 }}>&#10003;</span>}
                            {isFalse && <span style={{ fontSize: 17, color: "#e5e7eb" }}>&#8722;</span>}
                            {!isTrue && !isFalse && <span style={{ fontSize: 12, fontWeight: 700, color: colors[ci] }}>{val}</span>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA row */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", borderTop: "2px solid #f3f4f6", background: "#f9fafb" }}>
                <div style={{ padding: "20px 24px" }} />
                {[
                  { name: "Free", accent: "#6b7280", cta: "Empezar gratis" },
                  { name: "Pro", accent: "#F97316", cta: "Empezar con Pro" },
                  { name: "Pro Max", accent: "#7c3aed", cta: "Empezar con Pro Max" },
                ].map(p => (
                  <div key={p.name} style={{ padding: "16px 10px" }}>
                    <button
                      onClick={() => handlePlanCta(p.name)}
                      disabled={checkoutLoading === p.name}
                      style={{
                        width: "100%", padding: "10px 6px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", transition: "all 0.2s",
                        background: p.name === "Pro" ? p.accent : "transparent",
                        color: p.name === "Pro" ? "white" : p.accent,
                        border: `2px solid ${p.accent}`,
                      }}
                    >
                      {checkoutLoading === p.name ? "..." : p.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BUDDYCOACH ═══════════════════════════════════════════════════ */}
      <section ref={coachSection.ref} style={{ padding: "96px 24px", background: "#0f172a" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="lp-coach-layout" style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            <div style={{ opacity: coachSection.inView ? 1 : 0, transform: coachSection.inView ? "translateX(0)" : "translateX(-32px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>ECOSISTEMA BUDDY</span>
              <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "white", margin: "12px 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                ¿Eres entrenador personal?<br />
                <span style={{ color: "#F97316" }}>Conoce BuddyCoach</span>
              </h2>
              <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.8, marginBottom: 28, maxWidth: 520 }}>
                BuddyCoach.io es la plataforma hermana diseñada para entrenadores personales y coaches de fitness. Gestiona tus clientes, crea planes de entrenamiento con IA y conecta la nutrición con el rendimiento deportivo.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
                {[
                  { icon: "👥", text: "Gestión completa de clientes y seguimiento de progreso" },
                  { icon: "🏋️", text: "Planes de entrenamiento personalizados con IA" },
                  { icon: "🔗", text: "Integración directa con los menús nutricionales de BuddyMarket" },
                  { icon: "📈", text: "Métricas de rendimiento, fuerza y composición corporal" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                    <span style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.6 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 32px", borderRadius: 14, fontSize: 16, fontWeight: 700, color: "white", textDecoration: "none", background: "linear-gradient(135deg,#F97316,#ea580c)", boxShadow: "0 8px 32px rgba(249,115,22,0.4)" }}>
                Visitar BuddyCoach.io →
              </a>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, opacity: coachSection.inView ? 1 : 0, transform: coachSection.inView ? "translateX(0)" : "translateX(32px)", transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s" }}>
              {[
                { icon: "🎯", title: "Planes a medida", desc: "Rutinas adaptadas a cada cliente con IA" },
                { icon: "📊", title: "Seguimiento real", desc: "Fuerza, peso, medidas y rendimiento" },
                { icon: "🥗", title: "Nutrición integrada", desc: "Conecta con BuddyMarket" },
                { icon: "💰", title: "Gestión de negocio", desc: "Facturación y suscripciones" },
              ].map((card, i) => (
                <div key={i} style={{ background: "#1e293b", borderRadius: 16, padding: "22px", border: "1px solid #334155", transition: "all 0.25s", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#F97316"; (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#334155"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{card.desc}</div>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg,#F97316,#ea580c)", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>🤝 Ecosistema completo</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>BuddyMarket + BuddyCoach = nutrición y entrenamiento unidos</div>
                </div>
                <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#F97316", background: "white", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>Ver más →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ════════════════════════════════════════════════════ */}
      <section style={{ padding: "96px 24px", background: "linear-gradient(135deg, #F97316 0%, #ea580c 100%)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <img src={LOGO_ICON} alt="BuddyMarket" style={{ height: 72, width: "auto", objectFit: "contain", marginBottom: 28 }} />
          <h2 style={{ fontSize: "clamp(28px, 6vw, 56px)", fontWeight: 900, color: "white", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Empieza hoy a comer<br />de forma inteligente
          </h2>
          <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "rgba(255,255,255,0.88)", marginBottom: 40, lineHeight: 1.75 }}>
            Únete a más de 50.000 personas que ya han transformado su alimentación con BuddyMarket. Gratis para siempre, sin tarjeta de crédito.
          </p>
          <a href={appUrl} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "18px 48px", borderRadius: 16, fontSize: 18, fontWeight: 800, color: "#F97316", background: "white", textDecoration: "none", boxShadow: "0 16px 48px rgba(0,0,0,0.2)", transition: "all 0.25s" }}
            onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-3px)"; (e.target as HTMLElement).style.boxShadow = "0 24px 64px rgba(0,0,0,0.25)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; (e.target as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.2)"; }}>
            Crear cuenta gratuita
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 20 }}>Sin tarjeta de crédito · Gratis para siempre · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer style={{ background: "#0f172a", padding: "60px 24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="lp-footer-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 36, marginBottom: 44 }}>
            <div>
              <img src={LOGO_ICON} alt="BuddyMarket" style={{ height: 56, width: "auto", objectFit: "contain", marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.75, maxWidth: 280, marginBottom: 12 }}>El gestor nutricional inteligente que se adapta a ti. Planifica, cocina y come bien cada día.</p>
              <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>⚠️ El contenido de BuddyMarket es orientativo y no sustituye el consejo de un profesional de la salud.</p>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Producto</h4>
              {["Funcionalidades", "Precios", "Menús Especiales", "BuddyMakers", "BuddyExperts"].map(l => (
                <div key={l} style={{ marginBottom: 10 }}><a href="#" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "#F97316"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "#6b7280"}>{l}</a></div>
              ))}
              <div style={{ marginBottom: 10 }}><a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: "#F97316", fontWeight: 600, textDecoration: "none" }}>BuddyCoach.io ↗</a></div>
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Recursos</h4>
              {[{ label: "Blog", href: "/blog" }, { label: "Preguntas Frecuentes", href: "/faq" }, { label: "Centro de ayuda", href: "#" }, { label: "Comunidad", href: "#" }].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}><a href={l.href} style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "#F97316"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "#6b7280"}>{l.label}</a></div>
              ))}
            </div>

            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Legal</h4>
              {[
                { label: "Términos y Condiciones", href: "/terms" },
                { label: "Política de Privacidad", href: "/privacy" },
                { label: "Política de Cookies", href: "/cookies" },
              ].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <Link href={l.href} style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>{l.label}</Link>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: "#4b5563" }}>© 2025 BuddyMarket. Todos los derechos reservados.</p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["Twitter/X", "Instagram", "LinkedIn"].map(s => (
                <a key={s} href="#" style={{ fontSize: 13, color: "#4b5563", textDecoration: "none" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "#F97316"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "#4b5563"}>{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ GLOBAL ANIMATIONS ════════════════════════════════════════════ */}
      <style>{`
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes lp-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .lp-btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 16px 48px rgba(249,115,22,0.5) !important; }
        .lp-stat-card .lp-stat-icon { display: none; }
        .lp-stat-card .lp-stat-value { font-size: clamp(32px,6vw,52px); font-weight: 900; color: #F97316; line-height: 1; }
        .lp-stat-card .lp-stat-label { font-size: 13px; color: #9ca3af; margin-top: 8px; font-weight: 500; }

        /* Responsive */
        @media (max-width: 767px) {
          .lp-desktop-nav, .lp-desktop-cta { display: none !important; }
          .lp-hamburger { display: flex !important; }
          .lp-comparison-table { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .lp-comparison-table > div { min-width: 520px !important; }
        }
        @media (min-width: 640px) {
          .lp-stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .lp-special-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .lp-mosaic-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .lp-testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-steps-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .lp-hero-btns { flex-direction: row !important; }
          .lp-trust-row { flex-direction: row !important; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (min-width: 1024px) {
          .lp-hero-inner { flex-direction: row !important; align-items: center !important; gap: 72px !important; }
          .lp-hero-text { flex: 1; }
          .lp-hero-grid { flex: 1; }
          .lp-hero-grid > div { grid-template-rows: 280px 280px !important; }
          .lp-feature-layout { flex-direction: row !important; gap: 72px !important; align-items: center !important; }
          .lp-feature-layout > div:first-child { flex: 1; }
          .lp-feature-layout > div:last-child { flex: 1; }
          .lp-testimonials-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .lp-pricing-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .lp-coach-layout { flex-direction: row !important; gap: 80px !important; align-items: center !important; }
          .lp-coach-layout > div:first-child { flex: 1; }
          .lp-coach-layout > div:last-child { flex: 1; }
          .lp-footer-grid { grid-template-columns: 2fr 1fr 1fr 1fr !important; }
          .lp-special-grid { grid-template-columns: repeat(6, 1fr) !important; }
          .lp-desktop-br { display: block; }
          .lp-footer-grid > div:last-child, .lp-footer-grid > div:nth-child(3), .lp-footer-grid > div:nth-child(4) { display: block; }
        }
      `}</style>
    </div>
  );
}
