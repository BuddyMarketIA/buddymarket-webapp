import { useState, useEffect, useRef } from "react";
import NutritionalCalculatorSection from "@/components/NutritionalCalculatorSection";
import HabitsChecklistSection from "@/components/HabitsChecklistSection";
import AIMenuExamplesSection from "@/components/AIMenuExamplesSection";
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
  menu:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu_semanal_banner-bJvcZL6L7JygtVy2QeuafW.webp",
  recipes:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",
  shopping: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",
  pantry:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",
  mealprep: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
};

const MODULES = [
  { icon: "🤖", color: "#F97316", bg: "#fff7ed", tag: "BuddyIA", title: "Inteligencia Artificial Nutricional",
    desc: "Genera menús semanales personalizados en segundos. La IA analiza tu perfil, objetivos, alergias y condiciones médicas para crear planes únicos adaptados a ti.",
    img: FOOD.menu, highlights: ["Menús en 30 segundos", "24 perfiles especiales", "Ajuste de macros automático"] },
  { icon: "🍳", color: "#10b981", bg: "#f0fdf4", tag: "Recetas", title: "Biblioteca de Recetas Saludables",
    desc: "Miles de recetas con información nutricional completa, instrucciones paso a paso y filtros por alérgenos, tiempo de preparación y objetivo de salud.",
    img: FOOD.recipes, highlights: ["15.000+ recetas", "Filtros por alérgenos", "Macros detallados"] },
  { icon: "🛒", color: "#3b82f6", bg: "#eff6ff", tag: "Lista de la Compra", title: "Compra Inteligente Automatizada",
    desc: "Genera tu lista de la compra directamente desde tu menú semanal. Organizada por categorías y con integración con supermercados online.",
    img: FOOD.shopping, highlights: ["Lista automática", "Por categorías", "Integración supermercados"] },
  { icon: "📊", color: "#8b5cf6", bg: "#f5f3ff", tag: "Diario Nutricional", title: "Seguimiento Nutricional en Tiempo Real",
    desc: "Registra tus comidas y monitoriza calorías, proteínas, carbohidratos y grasas. Estadísticas detalladas y sistema de logros para mantenerte motivado.",
    img: FOOD.mealprep, highlights: ["Registro por voz", "Análisis de fotos", "Estadísticas avanzadas"] },
  { icon: "🏪", color: "#ec4899", bg: "#fdf2f8", tag: "Inventario", title: "Control Total de tu Despensa",
    desc: "Gestiona lo que tienes en casa. BuddyMarket te avisa de lo que está por caducar y adapta tus recetas al inventario disponible.",
    img: FOOD.pantry, highlights: ["Alertas de caducidad", "Escaneo de códigos", "Adapta recetas al stock"] },
  { icon: "📈", color: "#f59e0b", bg: "#fffbeb", tag: "Métricas", title: "Análisis de Salud y Progreso",
    desc: "Registra peso, medidas, energía y bienestar. Visualiza tu evolución con gráficas detalladas y comparte informes con tu nutricionista.",
    img: FOOD.salmon, highlights: ["Historial completo", "Exportar PDF", "Compartir con profesional"] },
];

const SERVICES = [
  { icon: "👤", color: "#F97316", gradient: "linear-gradient(135deg,#fff7ed,#ffedd5)", border: "#fed7aa",
    title: "Para Usuarios", subtitle: "Tu nutrición, simplificada",
    desc: "Toma el control de tu alimentación con herramientas de IA que antes solo tenían los nutricionistas. Sin complicaciones, sin excusas.",
    items: ["Menús semanales personalizados con IA","Diario nutricional con registro por voz","Lista de la compra automática","24 planes especializados","Seguimiento de métricas y progreso","Biblioteca de 15.000+ recetas"],
    cta: "Empezar gratis" },
  { icon: "🧑‍⚕️", color: "#10b981", gradient: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "#86efac",
    title: "BuddyExperts", subtitle: "Para nutricionistas y dietistas",
    desc: "Gestiona tu consulta online, crea planes nutricionales personalizados y acompaña a tus pacientes en su evolución. Herramientas profesionales para escalar tu práctica.",
    badge: "Para profesionales sanitarios",
    items: ["Panel profesional con historial de pacientes","Crear y publicar menús y planes de nutrición","Seguimiento de evolución de clientes","Mensajería directa con pacientes","Monetización de planes premium","Badge BuddyExpert verificado","Gestión de citas y agenda","Informes de progreso exportables"],
    cta: "Convertirme en BuddyExpert" },
  { icon: "🍳", color: "#f59e0b", gradient: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "#fcd34d",
    title: "BuddyMakers", subtitle: "Para creadores de contenido culinario",
    desc: "Comparte tu pasión por la cocina saludable. Sube tus recetas, construye tu comunidad y monetiza tu contenido. Solo recetas, sin complicaciones.",
    badge: "Para creadores de contenido",
    items: ["Perfil de creador con página propia","Subir y publicar recetas con fotos","Comunidad de seguidores y likes","Monetización de recetas premium","Analíticas de alcance y engagement","Badge BuddyMaker verificado"],
    cta: "Convertirme en BuddyMaker" },
  { icon: "🏢", color: "#7c3aed", gradient: "linear-gradient(135deg,#f5f3ff,#ede9fe)", border: "#c4b5fd",
    title: "Para Empresas", subtitle: "Bienestar corporativo con ROI medible",
    desc: "Mejora la salud y productividad de tu equipo. Planes de nutrición corporativos con dashboard de administración y reportes de impacto.",
    items: ["Dashboard de administración centralizado","Planes nutricionales para equipos","Reportes de bienestar y engagement","Integración con RRHH y beneficios","Facturación y gestión de licencias","Soporte dedicado y onboarding"],
    cta: "Solicitar demo" },
];

const SPECIAL_MENUS = [
  { emoji: "🤰", label: "Embarazadas", color: "#fce7f3", text: "#9d174d" },
  { emoji: "🌱", label: "Veganos", color: "#d1fae5", text: "#065f46" },
  { emoji: "🌾", label: "Celíacos", color: "#fef3c7", text: "#92400e" },
  { emoji: "💉", label: "Diabéticos", color: "#dbeafe", text: "#1e40af" },
  { emoji: "❤️", label: "Hipertensión", color: "#fee2e2", text: "#991b1b" },
  { emoji: "💪", label: "Deportistas", color: "#ede9fe", text: "#5b21b6" },
  { emoji: "🤧", label: "Resfriado", color: "#e0f2fe", text: "#0c4a6e" },
  { emoji: "🧓", label: "Mayores 65", color: "#f0fdf4", text: "#14532d" },
  { emoji: "👶", label: "Niños", color: "#fef9c3", text: "#713f12" },
  { emoji: "🔬", label: "Oncológico", color: "#f3f4f6", text: "#374151" },
  { emoji: "🧘", label: "Intestino irritable", color: "#ecfdf5", text: "#064e3b" },
  { emoji: "🦴", label: "Osteoporosis", color: "#eff6ff", text: "#1e3a8a" },
  { emoji: "🫀", label: "Colesterol", color: "#fff1f2", text: "#9f1239" },
  { emoji: "🧠", label: "Ansiedad", color: "#faf5ff", text: "#581c87" },
  { emoji: "🤱", label: "Lactancia", color: "#fdf4ff", text: "#701a75" },
  { emoji: "🏋️", label: "Volumen muscular", color: "#f0f9ff", text: "#0c4a6e" },
];

const STATS = [
  { value: 15000, suffix: "+", label: "Usuarios activos", icon: "👥" },
  { value: 48000, suffix: "+", label: "Menús generados", icon: "📋" },
  { value: 8500, suffix: "+", label: "Recetas disponibles", icon: "🍳" },
  { value: 24, suffix: "", label: "Perfiles especializados", icon: "🎯" },
];

const TESTIMONIALS = [
  { name: "Laura M.", role: "Madre de familia, Madrid", avatar: "LM", color: "#F97316",
    text: "Antes pasaba horas pensando qué cocinar. Ahora BuddyMarket me genera el menú de la semana en segundos, adaptado a los gustos de mis hijos y con la lista de la compra incluida. Un cambio de vida.", stars: 5 },
  { name: "Carlos R.", role: "Deportista amateur, Barcelona", avatar: "CR", color: "#10b981",
    text: "Llevo 3 meses usando BuddyIA para mis menús de ganancia muscular. He ganado 4kg de masa muscular manteniendo el % de grasa. Los macros son perfectos y las recetas están buenísimas.", stars: 5 },
  { name: "Ana G.", role: "Nutricionista, Valencia", avatar: "AG", color: "#8b5cf6",
    text: "Como nutricionista, recomiendo BuddyMarket a mis pacientes para el seguimiento entre consultas. La herramienta de diario nutricional y las métricas me ayudan a ver su evolución real.", stars: 5 },
  { name: "Pedro S.", role: "Diabético tipo 2, Sevilla", avatar: "PS", color: "#3b82f6",
    text: "El plan para diabéticos es increíble. Controla el índice glucémico de cada comida y me ayuda a mantener la glucosa estable. Mi médico está impresionado con mi evolución.", stars: 5 },
];

const PLANS = [
  { name: "Free", price: "0€", period: "para siempre", accent: "#6b7280", highlight: false, cta: "Empezar gratis",
    description: "Para explorar BuddyMarket sin compromiso",
    features: ["Perfil nutricional básico","Ver recetas de la comunidad","3 menús al mes (sin IA)","Lista de la compra básica","Inventario (hasta 20 productos)"] },
  { name: "Pro", price: "9,99€", period: "al mes", accent: "#F97316", highlight: true, cta: "Empezar con Pro",
    description: "Para quienes quieren resultados reales",
    features: ["Menús semanales ilimitados con IA","24 planes especializados","BuddyIA: 50 consultas/día","Diario nutricional ilimitado","Inventario ilimitado + alertas","Métricas de salud (6 meses)","Integración supermercados online"] },
  { name: "Pro Max", price: "19,99€", period: "al mes", accent: "#7c3aed", highlight: false, cta: "Empezar con Pro Max",
    description: "Para profesionales y familias",
    features: ["Todo lo de Pro","BuddyIA ilimitado","Historial de métricas ilimitado","Crear y publicar recetas propias","Acceso a BuddyExperts","Perfiles familiares múltiples","Exportar informes PDF","Soporte prioritario 24/7"] },
];

const HOW_IT_WORKS = [
  { step: "01", icon: "👤", color: "#F97316", title: "Crea tu perfil nutricional",
    desc: "Cuéntanos tus objetivos, alergias, condiciones médicas y estilo de vida. Solo tarda 3 minutos." },
  { step: "02", icon: "🤖", color: "#10b981", title: "La IA genera tu plan personalizado",
    desc: "BuddyIA analiza tu perfil y crea un menú semanal completo con 5 comidas diarias y lista de la compra." },
  { step: "03", icon: "📊", color: "#8b5cf6", title: "Sigue tu progreso y mejora",
    desc: "Registra tus comidas, monitoriza tus métricas y deja que BuddyIA ajuste tu plan semana a semana." },
];

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

function StatCounter({ value, suffix, label, icon, start }: { value: number; suffix: string; label: string; icon: string; start: boolean }) {
  const count = useCounter(value, 2000, start);
  const display = value >= 1000 ? count.toLocaleString("es-ES") : count.toString();
  return (
    <div style={{ textAlign: "center", padding: "24px 16px" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 40, fontWeight: 900, color: "#F97316", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {display}{suffix}
      </div>
      <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const createCheckout = trpc.subscriptions.createCheckout.useMutation();
  const appUrl = window.location.origin;
  const loginUrl = `${appUrl}/login`;
  const dashboardUrl = `${appUrl}/app/dashboard`;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(0);
  const [activeService, setActiveService] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const statsSection = useInView(0.3);
  const modulesSection = useInView(0.1);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveModule(i => (i + 1) % MODULES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const handlePlanCta = async (planName: string) => {
    if (planName === "Free") { window.location.href = isLoggedIn ? dashboardUrl : loginUrl; return; }
    if (!isLoggedIn) { window.location.href = loginUrl; return; }
    const planMap: Record<string, "basic" | "premium" | "pro_max"> = { "Pro": "basic", "Pro Max": "pro_max" };
    const stripePlan = planMap[planName];
    if (!stripePlan) return;
    setCheckoutLoading(planName);
    try {
      const result = await createCheckout.mutateAsync({ plan: stripePlan, origin: window.location.origin });
      if (result.url) { toast.info("Redirigiendo al pago seguro..."); window.open(result.url, "_blank"); }
    } catch { toast.error("Error al iniciar el pago. Inténtalo de nuevo."); }
    finally { setCheckoutLoading(null); }
  };

  const ctaHref = isLoggedIn ? dashboardUrl : loginUrl;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden", background: "#fff" }}>

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0, marginRight: 24 }}>
            <img src={LOGO_ICON} alt="" style={{ height: 32, width: 32 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", lineHeight: 1 }}>
              <span style={{ color: "#F97316" }}>B</span>uddy<span style={{ color: "#F97316" }}>M</span>arket
            </span>
          </a>

          <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            {[
              { label: "Funcionalidades", id: "features" },
              { label: "Servicios", id: "services" },
              { label: "Precios", id: "pricing" },
            ].map(item => (
              <button key={item.label} onClick={() => scrollTo(item.id)} style={{ padding: "8px 14px", fontSize: 14, fontWeight: 500, color: "#4b5563", background: "none", border: "none", cursor: "pointer", borderRadius: 8, transition: "all 0.15s" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = "#F97316"; (e.target as HTMLElement).style.background = "#fff7ed"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = "#4b5563"; (e.target as HTMLElement).style.background = "transparent"; }}>
                {item.label}
              </button>
            ))}
            <a href="/blog" style={{ padding: "8px 14px", fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none", borderRadius: 8, transition: "all 0.15s" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = "#F97316"; (e.target as HTMLElement).style.background = "#fff7ed"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = "#4b5563"; (e.target as HTMLElement).style.background = "transparent"; }}>
              Blog
            </a>
          </div>

          <div className="lp-nav-cta" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isLoggedIn ? (
              <a href={dashboardUrl} style={{ padding: "9px 20px", fontSize: 14, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 12px rgba(249,115,22,0.3)" }}>
                Ir a la app
              </a>
            ) : (
              <>
                <a href={loginUrl} style={{ padding: "9px 18px", fontSize: 14, fontWeight: 500, color: "#374151", textDecoration: "none", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#F97316"; (e.currentTarget as HTMLElement).style.color = "#F97316"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}>
                  Iniciar sesión
                </a>
                <a href={loginUrl} style={{ padding: "9px 20px", fontSize: 14, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 12px rgba(249,115,22,0.3)", transition: "all 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 20px rgba(249,115,22,0.4)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(249,115,22,0.3)"; }}>
                  Empezar gratis
                </a>
              </>
            )}
          </div>

          <button className="lp-hamburger" onClick={() => setMobileOpen(o => !o)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer" }}>
            {mobileOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
        </div>

        {mobileOpen && (
          <div style={{ background: "white", borderTop: "1px solid #f3f4f6", padding: "12px 20px 20px" }}>
            {[{ label: "Funcionalidades", id: "features" }, { label: "Servicios", id: "services" }, { label: "Precios", id: "pricing" }].map(item => (
              <button key={item.label} onClick={() => scrollTo(item.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 0", fontSize: 15, fontWeight: 500, color: "#374151", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                {item.label}
              </button>
            ))}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={loginUrl} style={{ padding: "12px", textAlign: "center", fontSize: 15, fontWeight: 600, color: "#374151", textDecoration: "none", borderRadius: 10, border: "1.5px solid #e5e7eb" }}>Iniciar sesión</a>
              <a href={loginUrl} style={{ padding: "12px", textAlign: "center", fontSize: 15, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", borderRadius: 10, textDecoration: "none" }}>Empezar gratis</a>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: 68, background: "linear-gradient(150deg,#fff7ed 0%,#ffffff 50%,#f0fdf4 100%)", minHeight: "100svh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "8%", right: "-4%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "-6%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", width: "100%" }} className="lp-hero-grid">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 100, padding: "6px 14px", marginBottom: 28 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316", display: "inline-block", animation: "lp-pulse 2s infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#ea580c" }}>Ahora con IA Nutricional</span>
            </div>

            <h1 style={{ fontSize: "clamp(36px,5.5vw,66px)", fontWeight: 900, lineHeight: 1.08, color: "#111827", margin: "0 0 24px", letterSpacing: "-0.03em" }}>
              Tu nutrición,<br />
              <span style={{ color: "#F97316", position: "relative", display: "inline-block" }}>
                inteligente
                <svg viewBox="0 0 300 14" style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 10 }} preserveAspectRatio="none">
                  <path d="M0,10 Q75,2 150,8 Q225,14 300,6" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45" />
                </svg>
              </span><br />
              y personalizada
            </h1>

            <p style={{ fontSize: "clamp(16px,2vw,19px)", color: "#6b7280", lineHeight: 1.75, maxWidth: 520, marginBottom: 36 }}>
              BuddyMarket combina inteligencia artificial y nutrición científica para crear menús semanales únicos, gestionar tu despensa y ayudarte a alcanzar tus objetivos de salud.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", textDecoration: "none", boxShadow: "0 8px 24px rgba(249,115,22,0.35)", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(249,115,22,0.45)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(249,115,22,0.35)"; }}>
                Empezar gratis
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <button onClick={() => scrollTo("features")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 12, fontSize: 16, fontWeight: 600, color: "#374151", background: "white", border: "2px solid #e5e7eb", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#F97316"; (e.currentTarget as HTMLElement).style.color = "#F97316"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}>
                Ver funcionalidades
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex" }}>
                {[["LM","#F97316"],["CR","#10b981"],["AG","#8b5cf6"],["PS","#3b82f6"],["MR","#f59e0b"]].map(([init, bg], i) => (
                  <div key={i} style={{ width: 34, height: 34, borderRadius: "50%", background: bg, border: "2.5px solid white", marginLeft: i === 0 ? 0 : -9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white" }}>{init}</div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>)}</div>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}><strong style={{ color: "#111827" }}>15.000+</strong> usuarios confían en BuddyMarket</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "200px 200px", gap: 12 }} className="lp-hero-imgs">
            {[FOOD.salmon, FOOD.ensalada, FOOD.bowl, FOOD.pasta].map((src, i) => (
              <div key={i} style={{ borderRadius: 20, overflow: "hidden", transform: ["rotate(-1.5deg)","rotate(1deg)","rotate(1.5deg)","rotate(-1deg)"][i], boxShadow: "0 12px 32px rgba(0,0,0,0.12)", transition: "transform 0.3s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "rotate(0deg) scale(1.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ["rotate(-1.5deg)","rotate(1deg)","rotate(1.5deg)","rotate(-1deg)"][i]; }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
            <div style={{ position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 100, padding: "10px 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827" }}>Menú generado por IA</p><p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>1.847 kcal · 142g proteína</p></div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "lp-pulse 2s infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ══════════════════════════════════════════════════════════ */}
      <div style={{ background: "#111827", padding: "14px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 48, animation: "lp-marquee 30s linear infinite", width: "max-content" }}>
          {[...Array(3)].flatMap(() => ["🤖 IA Nutricional","📋 Menús Semanales","🍳 15.000+ Recetas","🛒 Lista de la Compra","📊 Diario Nutricional","🏪 Control de Inventario","💪 24 Planes Especiales","📈 Métricas de Salud"]).map((item, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", whiteSpace: "nowrap" }}>{item}</span>
          ))}
        </div>
      </div>

      {/* ═══ STATS ════════════════════════════════════════════════════════════ */}
      <section ref={statsSection.ref} style={{ background: "#111827", padding: "60px 24px 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }} className="lp-stats-grid">
          {STATS.map((s, i) => <StatCounter key={i} {...s} start={statsSection.inView} />)}
        </div>
      </section>

      {/* ═══ FEATURES / MODULES ═══════════════════════════════════════════════ */}
      <section id="features" ref={modulesSection.ref} style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>FUNCIONALIDADES</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", lineHeight: 1.2 }}>
              Todo lo que necesitas para<br />comer bien, en un solo lugar
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 540, margin: "0 auto" }}>
              Seis módulos integrados que trabajan juntos para transformar tu relación con la alimentación.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
            {MODULES.map((m, i) => (
              <button key={i} onClick={() => setActiveModule(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "2px solid", transition: "all 0.2s", borderColor: activeModule === i ? m.color : "#e5e7eb", background: activeModule === i ? m.bg : "white", color: activeModule === i ? m.color : "#6b7280", boxShadow: activeModule === i ? `0 4px 16px ${m.color}30` : "none" }}>
                <span>{m.icon}</span><span>{m.tag}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", background: MODULES[activeModule].bg, borderRadius: 24, padding: "48px", border: `1.5px solid ${MODULES[activeModule].color}20`, transition: "all 0.4s" }} className="lp-module-grid">
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", borderRadius: 12, padding: "10px 16px", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize: 26 }}>{MODULES[activeModule].icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: MODULES[activeModule].color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{MODULES[activeModule].tag}</span>
              </div>
              <h3 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#111827", margin: "0 0 14px", lineHeight: 1.3 }}>{MODULES[activeModule].title}</h3>
              <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.7, marginBottom: 24 }}>{MODULES[activeModule].desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {MODULES[activeModule].highlights.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: MODULES[activeModule].color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>{h}</span>
                  </div>
                ))}
              </div>
              <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "white", background: MODULES[activeModule].color, textDecoration: "none", boxShadow: `0 6px 20px ${MODULES[activeModule].color}40` }}>
                Probar {MODULES[activeModule].tag}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
            <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", aspectRatio: "4/3" }}>
              <img src={MODULES[activeModule].img} alt={MODULES[activeModule].title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "all 0.5s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "#0f172a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>CÓMO FUNCIONA</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "white", margin: "12px 0 0", lineHeight: 1.2 }}>
              De cero a tu menú personalizado<br />en menos de 5 minutos
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 28 }} className="lp-steps-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "36px 28px", textAlign: "center", transition: "all 0.3s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${step.color}20`, border: `2px solid ${step.color}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>{step.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: step.color, letterSpacing: "0.1em", marginBottom: 12 }}>PASO {step.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "white", margin: "0 0 12px", lineHeight: 1.3 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#9ca3af", lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", textDecoration: "none", boxShadow: "0 8px 24px rgba(249,115,22,0.4)" }}>
              Empezar ahora — es gratis
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═════════════════════════════════════════════════════════ */}
      <section id="services" style={{ padding: "100px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>SERVICIOS</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", lineHeight: 1.2 }}>Una plataforma para todos</h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 540, margin: "0 auto" }}>Tanto si eres usuario individual, nutricionista o empresa, BuddyMarket tiene una solución diseñada para ti.</p>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 36, flexWrap: "wrap" }}>
            {SERVICES.map((s, i) => (
              <button key={i} onClick={() => setActiveService(i)} style={{ padding: "10px 22px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "2px solid", transition: "all 0.2s", borderColor: activeService === i ? s.color : "#e5e7eb", background: activeService === i ? s.color : "white", color: activeService === i ? "white" : "#6b7280" }}>
                {s.icon} {s.title}
              </button>
            ))}
          </div>
          <div style={{ background: SERVICES[activeService].gradient, border: `1.5px solid ${SERVICES[activeService].border}`, borderRadius: 24, padding: "48px", transition: "all 0.4s" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }} className="lp-service-grid">
              <div>
                <div style={{ fontSize: 44, marginBottom: 16 }}>{SERVICES[activeService].icon}</div>
                {(SERVICES[activeService] as any).badge && (
                  <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700, background: SERVICES[activeService].color + "18", color: SERVICES[activeService].color, border: `1px solid ${SERVICES[activeService].color}40`, marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {(SERVICES[activeService] as any).badge}
                  </span>
                )}
                <p style={{ fontSize: 12, fontWeight: 800, color: SERVICES[activeService].color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{SERVICES[activeService].title}</p>
                <h3 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 800, color: "#111827", margin: "0 0 16px", lineHeight: 1.3 }}>{SERVICES[activeService].subtitle}</h3>
                <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.7, marginBottom: 28 }}>{SERVICES[activeService].desc}</p>
                <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "white", background: SERVICES[activeService].color, textDecoration: "none", boxShadow: `0 6px 20px ${SERVICES[activeService].color}40` }}>
                  {SERVICES[activeService].cta}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {SERVICES[activeService].items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: "white", borderRadius: 12, padding: "13px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: SERVICES[activeService].color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SPECIAL MENUS ════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>PLANES ESPECIALIZADOS</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", lineHeight: 1.2 }}>24 planes nutricionales<br />para cada condición</h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 500, margin: "0 auto" }}>Menús diseñados para condiciones médicas, etapas de vida y objetivos concretos. Avalados por nutricionistas.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
            {SPECIAL_MENUS.map((m, i) => (
              <div key={i} style={{ background: m.color, borderRadius: 14, padding: "16px 10px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", border: "1.5px solid transparent" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = m.text; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{m.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: m.text }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 36 }}>
            <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "#F97316", background: "#fff7ed", border: "2px solid #fed7aa", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F97316"; (e.currentTarget as HTMLElement).style.color = "white"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#fff7ed"; (e.currentTarget as HTMLElement).style.color = "#F97316"; }}>
              Ver todos los planes especializados
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>TESTIMONIOS</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#111827", margin: "12px 0 0", lineHeight: 1.2 }}>Lo que dicen nuestros usuarios</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }} className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "white", borderRadius: 20, padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", transition: "all 0.3s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f59e0b", fontSize: 15 }}>★</span>)}</div>
                <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>{t.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EJEMPLOS DE MENÚS IA ════════════════════════════════════════════ */}
      <AIMenuExamplesSection appUrl={appUrl} />

      {/* ═══ CALCULADORA NUTRICIONAL ══════════════════════════════════════════ */}
      <NutritionalCalculatorSection appUrl={appUrl} />

      {/* ═══ CHECKLIST DE HÁBITOS ════════════════════════════════════════════ */}
      <HabitsChecklistSection appUrl={appUrl} />

      {/* ═══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>PRECIOS</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", lineHeight: 1.2 }}>Planes para cada necesidad</h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 460, margin: "0 auto" }}>Empieza gratis y escala cuando lo necesites. Sin permanencia, cancela cuando quieras.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, alignItems: "start" }} className="lp-plans-grid">
            {PLANS.map((plan, i) => (
              <div key={i} style={{ borderRadius: 24, padding: "36px 28px", background: plan.highlight ? "#111827" : "white", border: plan.highlight ? "none" : "2px solid #f3f4f6", boxShadow: plan.highlight ? "0 20px 60px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.04)", position: "relative", transition: "all 0.3s", transform: plan.highlight ? "scale(1.04)" : "scale(1)" }}
                onMouseEnter={e => { if (!plan.highlight) { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; } }}
                onMouseLeave={e => { if (!plan.highlight) { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.04)"; } }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#F97316", color: "white", fontSize: 11, fontWeight: 800, padding: "5px 16px", borderRadius: 100, whiteSpace: "nowrap" }}>MÁS POPULAR</div>
                )}
                <p style={{ fontSize: 12, fontWeight: 700, color: plan.accent, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 46, fontWeight: 900, color: plan.highlight ? "white" : "#111827", lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: plan.highlight ? "#9ca3af" : "#6b7280" }}>/{plan.period}</span>
                </div>
                <p style={{ fontSize: 14, color: plan.highlight ? "#9ca3af" : "#6b7280", marginBottom: 24 }}>{plan.description}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: plan.highlight ? `${plan.accent}30` : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={plan.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ fontSize: 14, color: plan.highlight ? "#d1d5db" : "#374151", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handlePlanCta(plan.name)} disabled={checkoutLoading === plan.name} style={{ display: "block", width: "100%", textAlign: "center", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", background: plan.highlight ? plan.accent : "transparent", color: plan.highlight ? "white" : plan.accent, border: `2px solid ${plan.accent}`, transition: "all 0.2s", opacity: checkoutLoading === plan.name ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!plan.highlight) { (e.currentTarget as HTMLElement).style.background = plan.accent; (e.currentTarget as HTMLElement).style.color = "white"; } }}
                  onMouseLeave={e => { if (!plan.highlight) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = plan.accent; } }}>
                  {checkoutLoading === plan.name ? "Cargando..." : plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 28 }}>
            * El contenido de BuddyMarket es orientativo y no sustituye el consejo de un profesional de la salud. Consulta siempre con tu médico o nutricionista.
          </p>
        </div>
      </section>

      {/* ═══ CTA FINAL ════════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 680, margin: "0 auto", position: "relative" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>🚀</div>
          <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, color: "white", margin: "0 0 20px", lineHeight: 1.2 }}>
            Empieza hoy a comer<br />de forma inteligente
          </h2>
          <p style={{ fontSize: 18, color: "#94a3b8", marginBottom: 36, lineHeight: 1.7 }}>
            Únete a más de 15.000 personas que ya están transformando su alimentación con BuddyMarket. Gratis para siempre, sin tarjeta de crédito.
          </p>
          <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 32px", borderRadius: 12, fontSize: 17, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", textDecoration: "none", boxShadow: "0 8px 32px rgba(249,115,22,0.4)" }}>
            Empezar gratis ahora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 18 }}>Sin tarjeta de crédito · Cancela cuando quieras · Soporte en español</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#0f172a", padding: "64px 24px 32px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }} className="lp-footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <img src={LOGO_ICON} alt="" style={{ height: 26 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <span style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px" }}>
                  <span style={{ color: "#F97316" }}>B</span>uddy<span style={{ color: "#F97316" }}>M</span>arket
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 280, marginBottom: 16 }}>
                Tu asistente nutricional inteligente. Menús personalizados, recetas saludables y seguimiento nutricional con IA.
              </p>
              <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                El contenido de BuddyMarket es orientativo y no sustituye el consejo de un profesional de la salud.
              </p>
            </div>
            {[
              { title: "Producto", items: ["Funcionalidades","Precios","BuddyIA","Recetas","Menús especiales","Para empresas"] },
              { title: "Empresa", items: ["Sobre nosotros","Blog","Creadores","Afiliados","Prensa","Contacto"] },
              { title: "Legal", items: ["Privacidad","Términos de uso","Cookies","RGPD","Aviso legal"] },
            ].map(col => (
              <div key={col.title}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{col.title}</p>
                {col.items.map(item => (
                  <a key={item} href="#" style={{ display: "block", fontSize: 14, color: "#64748b", textDecoration: "none", marginBottom: 10, transition: "color 0.15s" }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = "#F97316"; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = "#64748b"; }}>
                    {item}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>© 2025 BuddyMarket · buddymarket.io · Todos los derechos reservados</p>
            <div style={{ display: "flex", gap: 16 }}>
              {["Twitter","Instagram","LinkedIn","YouTube"].map(net => (
                <a key={net} href="#" style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = "#F97316"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = "#475569"; }}>
                  {net}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ GLOBAL CSS ═══════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes lp-marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }
        @keyframes lp-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.85); } }
        .lp-nav-links, .lp-nav-cta { display: flex; }
        .lp-hamburger { display: none !important; }
        @media (max-width: 768px) {
          .lp-nav-links, .lp-nav-cta { display: none !important; }
          .lp-hamburger { display: flex !important; }
          .lp-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .lp-hero-imgs { display: none !important; }
          .lp-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .lp-steps-grid { grid-template-columns: 1fr !important; }
          .lp-module-grid { grid-template-columns: 1fr !important; }
          .lp-service-grid { grid-template-columns: 1fr !important; }
          .lp-testimonials-grid { grid-template-columns: 1fr !important; }
          .lp-plans-grid { grid-template-columns: 1fr !important; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </div>
  );
}
