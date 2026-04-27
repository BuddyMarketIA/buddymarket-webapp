import { useState, useEffect, useRef } from "react";
import NutritionalCalculatorSection from "@/components/NutritionalCalculatorSection";
import HabitsChecklistSection from "@/components/HabitsChecklistSection";
import AIMenuExamplesSection from "@/components/AIMenuExamplesSection";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";

// ─── Hero video sequence ─────────────────────────────────────────────────────
const HERO_VIDEOS = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/supermarket_2d753c38.mp4",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/healthy-food_51264735.mp4",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/batch-cooking_aa70ccb0.mp4",
];

function HeroVideoBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnded = () => setCurrentIndex(prev => (prev + 1) % HERO_VIDEOS.length);
    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [currentIndex]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = HERO_VIDEOS[currentIndex];
    video.load();
    video.play().catch(() => {});
  }, [currentIndex]);
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
    >
      <source src={HERO_VIDEOS[0]} type="video/mp4" />
    </video>
  );
}

const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png";
const BUDDY_LOGOS_URL = "/manus-storage/buddy-logos_ad247c16.png";

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

// ─── Módulos del ecosistema Buddy One ────────────────────────────────────────
const MODULES = [
  { icon: "🤖", color: "#F97316", bg: "#fff7ed", tag: "BuddyIA", title: "Inteligencia Artificial Nutricional",
    desc: "Genera menús semanales personalizados en segundos. La IA analiza tu perfil, objetivos, alergias y condiciones médicas para crear planes únicos adaptados a ti.",
    img: FOOD.menu, highlights: ["Menús en 30 segundos", "24 perfiles especiales", "Ajuste de macros automático"] },
  { icon: "🍳", color: "#10b981", bg: "#f0fdf4", tag: "Recetas", title: "Biblioteca de Recetas Saludables",
    desc: "Miles de recetas con información nutricional completa, instrucciones paso a paso y filtros por alérgenos, tiempo de preparación y objetivo de salud.",
    img: FOOD.recipes, highlights: ["207+ recetas", "Filtros por alérgenos", "Macros detallados"] },
  { icon: "🛒", color: "#3b82f6", bg: "#eff6ff", tag: "Buddy Market", title: "Compra Inteligente Automatizada",
    desc: "Genera tu lista de la compra directamente desde tu menú semanal. Organizada por categorías y con integración con supermercados online.",
    img: FOOD.shopping, highlights: ["Lista automática", "Por categorías", "Integración supermercados"] },
  { icon: "📊", color: "#8b5cf6", bg: "#f5f3ff", tag: "Buddy Care", title: "Seguimiento Nutricional en Tiempo Real",
    desc: "Registra tus comidas y monitoriza calorías, proteínas, carbohidratos y grasas. Estadísticas detalladas y sistema de logros para mantenerte motivado.",
    img: FOOD.mealprep, highlights: ["Registro por voz", "Análisis de fotos", "Estadísticas avanzadas"] },
  { icon: "🏪", color: "#ec4899", bg: "#fdf2f8", tag: "Buddy Shop", title: "Tienda de Productos Saludables",
    desc: "Accede a productos saludables, suplementos y alimentos especiales seleccionados por nutricionistas. Envío directo a tu puerta.",
    img: FOOD.pantry, highlights: ["Productos curados", "Suplementos", "Envío a domicilio"] },
  { icon: "📈", color: "#f59e0b", bg: "#fffbeb", tag: "Buddy Coach", title: "Tu Nutricionista Personal Online",
    desc: "Accede a nutricionistas certificados que crean planes 100% personalizados para ti, hacen seguimiento de tu evolución y responden tus dudas en tiempo real.",
    img: FOOD.salmon, highlights: ["Planes personalizados", "Seguimiento semanal", "Mensajería directa"] },
];

// ─── Módulos del ecosistema (tarjetas de branding) ───────────────────────────
const ECOSYSTEM = [
  { name: "Buddy Market", tagline: "Compra inteligente", color: "#F97316", bg: "#FFF7ED", border: "#FED7AA", icon: "🛒" },
  { name: "Buddy Coach", tagline: "Tu nutricionista IA", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: "👤" },
  { name: "Buddy Shop", tagline: "Productos saludables", color: "#E11D48", bg: "#FFF1F2", border: "#FECDD3", icon: "🛍️" },
  { name: "Buddy Care", tagline: "Salud y bienestar", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "➕" },
  { name: "Buddy Pets", tagline: "Nutrición para mascotas", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🐾" },
];

const SERVICES = [
  { icon: "👤", color: "#F97316", gradient: "linear-gradient(135deg,#fff7ed,#ffedd5)", border: "#fed7aa",
    title: "Para Usuarios", subtitle: "Tu nutrición, simplificada",
    desc: "Toma el control de tu alimentación con herramientas de IA que antes solo tenían los nutricionistas. Sin complicaciones, sin excusas.",
    items: ["Menús semanales personalizados con IA","Diario nutricional con registro por voz","Lista de la compra automática","24 planes especializados","Seguimiento de métricas y progreso","Biblioteca de 207+ recetas saludables"],
    cta: "Empezar gratis" },
  { icon: "🧑‍⚕️", color: "#10b981", gradient: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "#86efac",
    title: "Buddy Coach", subtitle: "Escala tu consulta y multiplica tus ingresos",
    desc: "Gestiona tu consulta online, publica planes nutricionales y acompaña a tus pacientes. Buddy One te da las herramientas para llegar a más clientes y cobrar por tu expertise sin intermediarios.",
    badge: "Para nutricionistas y dietistas certificados",
    earnings: { label: "Ingresos potenciales", value: "800–3.500€/mes", note: "según número de pacientes activos" },
    perks: [
      { icon: "💰", title: "70% de comisión", desc: "Te quedas el 70% de cada plan o consulta vendida. Sin cuotas fijas." },
      { icon: "🔗", title: "Código de referido", desc: "Gana un 20% recurrente de cada usuario que se suscriba con tu código." },
      { icon: "🏅", title: "Badge verificado", desc: "Sello de nutricionista certificado que genera confianza y más conversiones." },
      { icon: "📈", title: "Panel de analíticas", desc: "Visualiza ingresos, pacientes activos, evolución y tasa de retención." },
    ],
    items: ["Panel profesional con historial de pacientes","Crear y publicar menús y planes de nutrición","Seguimiento de evolución de clientes","Mensajería directa con pacientes","Monetización de planes premium","Badge BuddyExpert verificado","Gestión de citas y agenda","Informes de progreso exportables"],
    cta: "Convertirme en Buddy Coach" },
  { icon: "🍳", color: "#f59e0b", gradient: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "#fcd34d",
    title: "BuddyMakers", subtitle: "Monetiza tus recetas y construye tu comunidad",
    desc: "Sube tus recetas, crece tu audiencia y cobra por tu contenido. Buddy One te da visibilidad ante miles de usuarios que buscan exactamente lo que tú creas.",
    badge: "Para creadores de contenido culinario",
    earnings: { label: "Ingresos potenciales", value: "200–1.500€/mes", note: "según seguidores y recetas premium" },
    perks: [
      { icon: "💰", title: "Recetas premium", desc: "Cobra por tus recetas exclusivas. Tú fijas el precio, nosotros gestionamos el cobro." },
      { icon: "🔗", title: "Código de referido", desc: "Gana un 20% recurrente de cada usuario que se suscriba con tu código de creador." },
      { icon: "📣", title: "Visibilidad garantizada", desc: "Tus recetas aparecen en búsquedas, newsletters y la portada de la app." },
      { icon: "📊", title: "Analíticas de creador", desc: "Visualiza alcance, seguidores, ingresos y qué recetas generan más engagement." },
    ],
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
  { value: 207, suffix: "+", label: "Recetas disponibles", icon: "🍳" },
  { value: 24, suffix: "", label: "Perfiles especializados", icon: "🎯" },
  { value: 6, suffix: "", label: "Supermercados integrados", icon: "🛒" },
  { value: 100, suffix: "%", label: "Gratis para empezar", icon: "🎁" },
];

const TESTIMONIALS = [
  { name: "Laura M.", role: "Madre de familia, Madrid", avatar: "LM", color: "#F97316",
    text: "Antes pasaba horas pensando qué cocinar. Ahora Buddy One me genera el menú de la semana en segundos, adaptado a los gustos de mis hijos y con la lista de la compra incluida. Un cambio de vida.", stars: 5 },
  { name: "Carlos R.", role: "Deportista amateur, Barcelona", avatar: "CR", color: "#10b981",
    text: "Llevo 3 meses usando BuddyIA para mis menús de ganancia muscular. He ganado 4kg de masa muscular manteniendo el % de grasa. Los macros son perfectos y las recetas están buenísimas.", stars: 5 },
  { name: "Ana G.", role: "Nutricionista, Valencia", avatar: "AG", color: "#8b5cf6",
    text: "Como nutricionista, recomiendo Buddy One a mis pacientes para el seguimiento entre consultas. La herramienta de diario nutricional y las métricas me ayudan a ver su evolución real.", stars: 5 },
  { name: "Pedro S.", role: "Diabético tipo 2, Sevilla", avatar: "PS", color: "#3b82f6",
    text: "El plan para diabéticos es increíble. Controla el índice glucémico de cada comida y me ayuda a mantener la glucosa estable. Mi médico está impresionado con mi evolución.", stars: 5 },
];

const PLANS = [
  { name: "Free", price: "0€", period: "para siempre", accent: "#6b7280", highlight: false, cta: "Empezar gratis",
    description: "Para explorar Buddy One sin compromiso",
    features: ["Perfil nutricional básico","Ver 207+ recetas de la comunidad","2 menús/mes + 1 menú IA de prueba","3 listas de la compra/mes","Inventario (hasta 25 productos)"] },
  { name: "Pro", price: "9,99€", period: "al mes", accent: "#F97316", highlight: true, cta: "Empezar con Pro",
    description: "Para quienes quieren resultados reales",
    features: ["Menús semanales ilimitados con IA","24 planes especializados","BuddyIA: 50 consultas/día","Diario nutricional ilimitado","Inventario ilimitado + alertas","Métricas de salud (6 meses)","Integración supermercados online"] },
  { name: "Pro Max", price: "19,99€", period: "al mes", accent: "#7c3aed", highlight: false, cta: "Empezar con Pro Max",
    description: "Para profesionales y familias",
    features: ["Todo lo de Pro","BuddyIA ilimitado","Historial de métricas ilimitado","Crear y publicar recetas propias","Acceso a Buddy Coach","Perfiles familiares múltiples","Exportar informes PDF","Soporte prioritario 24/7"] },
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
  const { user, loading: authLoading } = useAuth();
  const isLoggedIn = !authLoading && !!user;
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

  // No autoplay — navegación manual

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

      {/* ═══ ESTILOS GLOBALES ══════════════════════════════════════════════════ */}
      <style>{`
        @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.2)} }
        @keyframes lp-marquee { from{transform:translateX(0)} to{transform:translateX(-33.33%)} }
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @media(max-width:768px){
          .lp-nav-links{display:none!important}
          .lp-nav-cta{display:none!important}
          .lp-hamburger{display:flex!important}
          .lp-mobile-cta{display:flex!important}
          .lp-hero-grid{grid-template-columns:1fr!important}
          .lp-hero-imgs{display:none!important}
          .lp-stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .lp-module-grid{grid-template-columns:1fr!important;padding:24px!important}
          .lp-services-grid{grid-template-columns:1fr!important}
          .lp-plans-grid{grid-template-columns:1fr!important}
          .lp-testimonials-grid{grid-template-columns:1fr!important}
          .lp-how-grid{grid-template-columns:1fr!important}
          .lp-ecosystem-grid{grid-template-columns:repeat(2,1fr)!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
        }
      `}</style>

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.3s ease",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0, marginRight: 24 }}>
            <img src={LOGO_ICON} alt="Buddy One logo" style={{ height: 40, width: 40 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>Buddy</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#F97316", letterSpacing: "-0.5px" }}>One</span>
            </div>
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

          <div className="lp-mobile-cta" style={{ display: "none" }}>
            <a href={isLoggedIn ? dashboardUrl : loginUrl} style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", borderRadius: 8, textDecoration: "none", whiteSpace: "nowrap" }}>
              {isLoggedIn ? "Ir a la app" : "Empezar"}
            </a>
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
      <section style={{ paddingTop: "calc(68px + env(safe-area-inset-top, 0px))", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", minHeight: "100svh" }}>
        <HeroVideoBackground />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.25) 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(to top, rgba(249,115,22,0.18) 0%, transparent 100%)", zIndex: 1, pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", width: "100%", position: "relative", zIndex: 2 }} className="lp-hero-grid">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 100, padding: "6px 14px", marginBottom: 28, backdropFilter: "blur(8px)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316", display: "inline-block", animation: "lp-pulse 2s infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>El ecosistema de bienestar inteligente</span>
            </div>

            <h1 style={{ fontSize: "clamp(36px,5.5vw,66px)", fontWeight: 900, lineHeight: 1.08, color: "#ffffff", margin: "0 0 24px", letterSpacing: "-0.03em", textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
              Todo lo que necesitas<br />
              <span style={{ color: "#F97316", position: "relative", display: "inline-block" }}>
                para cuidarte
                <svg viewBox="0 0 300 14" style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 10 }} preserveAspectRatio="none">
                  <path d="M0,10 Q75,2 150,8 Q225,14 300,6" stroke="#F97316" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45" />
                </svg>
              </span><br />
              en un solo lugar
            </h1>

            <p style={{ fontSize: "clamp(16px,2vw,19px)", color: "rgba(255,255,255,0.85)", lineHeight: 1.75, maxWidth: 520, marginBottom: 36 }}>
              Buddy One combina inteligencia artificial, nutrición, compra inteligente y acceso a profesionales para ayudarte a mejorar tu salud de forma simple, personalizada y continua.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", textDecoration: "none", boxShadow: "0 8px 24px rgba(249,115,22,0.35)", transition: "all 0.2s", whiteSpace: "nowrap", flex: "1 1 auto", maxWidth: 220, justifyContent: "center" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(249,115,22,0.45)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(249,115,22,0.35)"; }}>
                Empezar gratis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <button onClick={() => scrollTo("features")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 20px", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", flex: "1 1 auto", maxWidth: 220, justifyContent: "center", backdropFilter: "blur(8px)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.35)"; }}>
                Ver cómo funciona
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
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}><strong style={{ color: "#ffffff" }}>Únete</strong> a la comunidad Buddy One</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "200px 200px", gap: 12, position: "relative" }} className="lp-hero-imgs">
            {[
              { src: FOOD.shopping, alt: "Compra inteligente Buddy Market", badge: "🛒", label: "Buddy Market" },
              { src: "/manus-storage/buddy-pets-cat-dog_d6068ecc.jpg", alt: "Nutrición para mascotas Buddy Pets", badge: "🐾", label: "Buddy Pets" },
              { src: "/manus-storage/buddy-coach-nutritionist_3e23352c.jpg", alt: "Nutricionista online Buddy Coach", badge: "👤", label: "Buddy Coach" },
              { src: FOOD.bowl, alt: "Nutrición saludable Buddy Care", badge: "➕", label: "Buddy Care" },
            ].map((item, i) => (
              <div key={i} style={{ borderRadius: 20, overflow: "hidden", transform: ["rotate(-1.5deg)","rotate(1deg)","rotate(1.5deg)","rotate(-1deg)"][i], boxShadow: "0 12px 32px rgba(0,0,0,0.12)", transition: "transform 0.3s", position: "relative" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "rotate(0deg) scale(1.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ["rotate(-1.5deg)","rotate(1deg)","rotate(1.5deg)","rotate(-1deg)"][i]; }}>
                <img src={item.src} alt={item.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 12 }}>{item.badge}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{item.label}</span>
                </div>
              </div>
            ))}
            <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 100, padding: "10px 20px", boxShadow: "0 8px 24px rgba(0,0,0,0.14)", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", zIndex: 10 }}>
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
          {[...Array(3)].flatMap(() => ["🤖 BuddyIA","📋 Menús Semanales","🍳 207+ Recetas","🛒 Buddy Market","📊 Buddy Care","🛍️ Buddy Shop","💪 24 Planes Especiales","🐾 Buddy Pets","🧑‍⚕️ Buddy Coach"]).map((item, i) => (
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

      {/* ═══ ECOSISTEMA — LOGOS OFICIALES ════════════════════════════════════ */}
      <section style={{ background: "#F9FAFB", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "#F97316", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "16px" }}>El ecosistema Buddy One</p>
          <h2 style={{ fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 900, color: "#111827", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Cinco módulos. Un solo ecosistema.
          </h2>
          <p style={{ fontSize: 17, color: "#6B7280", maxWidth: 480, margin: "0 auto 48px", lineHeight: 1.6 }}>
            Cada módulo trabaja de forma independiente y en conjunto para transformar tu bienestar.
          </p>
          <img
            src={BUDDY_LOGOS_URL}
            alt="Módulos del ecosistema Buddy One: Buddy Market, Buddy Coach, Buddy Shop, Buddy Care, Buddy Pets"
            style={{ maxWidth: "420px", width: "100%", height: "auto", objectFit: "contain", margin: "0 auto 48px", display: "block" }}
          />
          {/* Tarjetas de módulos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }} className="lp-ecosystem-grid">
            {ECOSYSTEM.map(m => (
              <div key={m.name} style={{ background: m.bg, border: `1.5px solid ${m.border}`, borderRadius: 18, padding: "20px 14px", textAlign: "center", transition: "all 0.2s", cursor: "default" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${m.color}20`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
                  <span style={{ color: "#111827" }}>Buddy </span>
                  <span style={{ color: m.color }}>{m.name.replace("Buddy ", "")}</span>
                </div>
                <div style={{ fontSize: 11, color: m.color, fontWeight: 600 }}>{m.tagline}</div>
              </div>
            ))}
          </div>
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
              Módulos integrados que trabajan juntos para transformar tu relación con la alimentación.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginBottom: 40 }}>
            <button onClick={() => setActiveModule(i => (i - 1 + MODULES.length) % MODULES.length)} style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#F97316"; (e.currentTarget as HTMLElement).style.color = "#F97316"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            {MODULES.map((m, i) => (
              <button key={i} onClick={() => setActiveModule(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "2px solid", transition: "all 0.2s", borderColor: activeModule === i ? m.color : "#e5e7eb", background: activeModule === i ? m.bg : "white", color: activeModule === i ? m.color : "#6b7280", boxShadow: activeModule === i ? `0 4px 16px ${m.color}30` : "none" }}>
                <span>{m.icon}</span><span>{m.tag}</span>
              </button>
            ))}
            <button onClick={() => setActiveModule(i => (i + 1) % MODULES.length)} style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#F97316"; (e.currentTarget as HTMLElement).style.color = "#F97316"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
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
              De cero a tu plan personalizado<br />en menos de 5 minutos
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }} className="lp-how-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "36px 28px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: step.color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>PASO {step.step}</div>
                <div style={{ fontSize: 48, marginBottom: 20 }}>{step.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "white", margin: "0 0 12px", lineHeight: 1.3 }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 32px", borderRadius: 14, fontSize: 16, fontWeight: 700, color: "white", background: "linear-gradient(135deg,#F97316,#ea580c)", textDecoration: "none", boxShadow: "0 8px 24px rgba(249,115,22,0.35)" }}>
              Empezar ahora — es gratis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═════════════════════════════════════════════════════════ */}
      <section id="services" style={{ padding: "100px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>SERVICIOS</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", lineHeight: 1.2 }}>
              Para cada tipo de usuario
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 500, margin: "0 auto" }}>
              Buddy One se adapta a ti, seas usuario final, profesional de la salud o empresa.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
            {SERVICES.map((s, i) => (
              <button key={i} onClick={() => setActiveService(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "2px solid", transition: "all 0.2s", borderColor: activeService === i ? s.color : "#e5e7eb", background: activeService === i ? s.color : "white", color: activeService === i ? "white" : "#6b7280", boxShadow: activeService === i ? `0 4px 16px ${s.color}30` : "none" }}>
                <span>{s.icon}</span><span>{s.title}</span>
              </button>
            ))}
          </div>

          <div style={{ background: SERVICES[activeService].gradient, borderRadius: 24, padding: "clamp(24px,4vw,48px)", border: `1.5px solid ${SERVICES[activeService].border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }} className="lp-services-grid">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: SERVICES[activeService].color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: `0 8px 24px ${SERVICES[activeService].color}40` }}>{SERVICES[activeService].icon}</div>
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>{SERVICES[activeService].title}</h3>
                    <p style={{ fontSize: 14, color: SERVICES[activeService].color, fontWeight: 600, margin: 0 }}>{SERVICES[activeService].subtitle}</p>
                  </div>
                </div>
                {(SERVICES[activeService] as any).badge && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", borderRadius: 100, padding: "5px 12px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: SERVICES[activeService].color }}>✓ {(SERVICES[activeService] as any).badge}</span>
                  </div>
                )}
                <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.7, marginBottom: 20 }}>{SERVICES[activeService].desc}</p>
                {(SERVICES[activeService] as any).earnings && (
                  <div style={{ background: "white", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: `1.5px solid ${SERVICES[activeService].color}30` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>{(SERVICES[activeService] as any).earnings.label}</p>
                    <p style={{ fontSize: 28, fontWeight: 900, color: SERVICES[activeService].color, margin: "0 0 2px" }}>{(SERVICES[activeService] as any).earnings.value}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{(SERVICES[activeService] as any).earnings.note}</p>
                  </div>
                )}
                {(SERVICES[activeService] as any).perks && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {(SERVICES[activeService] as any).perks.map((p: any, i: number) => (
                      <div key={i} style={{ background: "white", borderRadius: 12, padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{p.title}</p>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "white", background: SERVICES[activeService].color, textDecoration: "none", boxShadow: `0 6px 20px ${SERVICES[activeService].color}40` }}>
                  {SERVICES[activeService].cta}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

      {/* ═══ SHARE CALCULADORA ══════════════════════════════════════════════ */}
      <section style={{ padding: "56px 24px", background: "#111827" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
          <div style={{ fontSize: 44 }}>🤝</div>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            ¿Conoces a alguien que quiera mejorar su alimentación?
          </h2>
          <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(255,255,255,0.7)", maxWidth: 520, margin: 0, lineHeight: 1.7 }}>
            Envíales el enlace a la <strong style={{ color: "#F97316" }}>calculadora nutricional gratuita</strong>. Descubrirán su IMC, metabolismo basal y macros en segundos — sin registro, sin coste.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            <a href="/calculadora" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, fontSize: 16, fontWeight: 800, background: "linear-gradient(135deg, #F97316, #ea580c)", color: "white", textDecoration: "none", boxShadow: "0 8px 24px rgba(249,115,22,0.4)", transition: "all 0.2s" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              Abrir calculadora y compartir
            </a>
            <button
              onClick={() => {
                const url = `${window.location.origin}/calculadora`;
                navigator.clipboard.writeText(url).catch(() => {});
                const btn = document.getElementById('lp-share-btn');
                if (btn) { btn.textContent = '✓ ¡Enlace copiado!'; setTimeout(() => { if (btn) btn.textContent = '📋 Copiar enlace'; }, 2500); }
              }}
              id="lp-share-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 12, fontSize: 16, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "white", border: "1.5px solid rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }}>
              📋 Copiar enlace
            </button>
          </div>
        </div>
      </section>

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
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? plan.accent : "#6b7280"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.8)" : "#374151", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handlePlanCta(plan.name)} disabled={checkoutLoading === plan.name} style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: plan.highlight ? `linear-gradient(135deg,${plan.accent},#ea580c)` : `${plan.accent}15`, color: plan.highlight ? "white" : plan.accent, boxShadow: plan.highlight ? `0 6px 20px ${plan.accent}40` : "none" }}>
                  {checkoutLoading === plan.name ? "Cargando..." : plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HERRAMIENTAS DEL ECOSISTEMA ═══════════════════════════════════ */}
      <section id="herramientas" style={{ padding: "100px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>HERRAMIENTAS</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: "#111827", margin: "12px 0 16px", lineHeight: 1.2 }}>Explora el ecosistema</h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 500, margin: "0 auto" }}>Cinco herramientas integradas, cada una especializada en un área de tu bienestar.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 24 }}>

            {/* Buddy Market */}
            <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid #FED7AA", transition: "all 0.3s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(249,115,22,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; }}>
              <div style={{ height: 160, background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <img src={FOOD.shopping} alt="Buddy Market" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 48 }}>🛒</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#F97316", marginTop: 4 }}>Buddy Market</div>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF7ED", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F97316", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#F97316" }}>DISPONIBLE AHORA</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Compra inteligente</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: "0 0 20px" }}>Genera tu lista de la compra automáticamente desde tu menú semanal. Integración con Mercadona, Carrefour, Lidl y más.</p>
                <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "#F97316", textDecoration: "none", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}>
                  Ir a Buddy Market
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
            </div>

            {/* Buddy Shop */}
            <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid #FECDD3", transition: "all 0.3s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(225,29,72,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; }}>
              <div style={{ height: 160, background: "linear-gradient(135deg,#FFF1F2,#FFE4E6)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <img src={FOOD.pantry} alt="Buddy Shop" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 48 }}>🛍️</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#E11D48", marginTop: 4 }}>Buddy Shop</div>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFF1F2", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E11D48", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#E11D48" }}>DISPONIBLE AHORA</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Productos saludables</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: "0 0 20px" }}>Accede a suplementos, alimentos especiales y productos saludables seleccionados por nutricionistas. Envío a domicilio.</p>
                <a href="https://buddyshop.app" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "#E11D48", textDecoration: "none", boxShadow: "0 4px 16px rgba(225,29,72,0.3)" }}>
                  Ir a Buddy Shop
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              </div>
            </div>

            {/* Buddy Coach */}
            <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid #DDD6FE", transition: "all 0.3s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(124,58,237,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; }}>
              <div style={{ height: 160, background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <img src={FOOD.salmon} alt="Buddy Coach" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} />
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 48 }}>👤</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#7C3AED", marginTop: 4 }}>Buddy Coach</div>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F5F3FF", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>DISPONIBLE AHORA</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Tu nutricionista online</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: "0 0 20px" }}>Accede a nutricionistas certificados que crean planes 100% personalizados, hacen seguimiento de tu evolución y responden tus dudas.</p>
                <a href="/app/buddy-experts" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "#7C3AED", textDecoration: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                  Ir a Buddy Coach
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
            </div>

            {/* Buddy Pets */}
            <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid #BFDBFE", transition: "all 0.3s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(37,99,235,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; }}>
              <div style={{ height: 160, background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <img src={FOOD.mealprep} alt="Buddy Pets" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} />
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 48 }}>🐾</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", marginTop: 4 }}>Buddy Pets</div>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", display: "inline-block" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB" }}>DISPONIBLE AHORA</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Nutrición para mascotas</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: "0 0 20px" }}>Planes nutricionales personalizados para perros y gatos. Analiza las necesidades de tu mascota y genera menús adaptados a su raza, edad y condición.</p>
                <a href="/app/buddy-pet" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: "#2563EB", textDecoration: "none", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                  Ir a Buddy Pets
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
            </div>

            {/* Buddy Care */}
            <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1.5px solid #BBF7D0", transition: "all 0.3s", opacity: 0.85 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(22,163,74,0.15)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}>
              <div style={{ height: 160, background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <img src={FOOD.ensalada} alt="Buddy Care" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} />
                <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: 100, padding: "4px 12px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>🔨 En desarrollo</span>
                </div>
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 48 }}>➕</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#16A34A", marginTop: 4 }}>Buddy Care</div>
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0FDF4", borderRadius: 100, padding: "4px 12px", marginBottom: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A", display: "inline-block", animation: "lp-pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>PRÓXIMAMENTE</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Salud y bienestar integral</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.65, margin: "0 0 20px" }}>Estamos trabajando en Buddy Care, tu herramienta de seguimiento de salud integral. Métricas avanzadas, historial médico, recordatorios y mucho más.</p>
                <button disabled style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", border: "2px solid #BBF7D0", cursor: "not-allowed", opacity: 0.7 }}>
                  Notificarme cuando esté listo
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ════════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px", background: "#0f172a" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#F97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 32, boxShadow: "0 12px 32px rgba(249,115,22,0.35)", animation: "lp-float 3s ease-in-out infinite" }}>🚀</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 900, color: "white", margin: "0 0 20px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Empieza hoy tu<br />
            <span style={{ background: "linear-gradient(135deg,#F97316,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ecosistema Buddy One</span>
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 40 }}>
            Únete a miles de personas que ya cuidan su salud de forma inteligente. Gratis para siempre, sin tarjeta de crédito.
          </p>
          <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "18px 40px", borderRadius: 16, background: "linear-gradient(135deg,#F97316,#ea580c)", color: "white", fontSize: 17, fontWeight: 800, textDecoration: "none", boxShadow: "0 12px 40px rgba(249,115,22,0.30)", letterSpacing: "-0.01em", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(249,115,22,0.45)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(249,115,22,0.30)"; }}>
            Empezar gratis ahora
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 16 }}>Sin tarjeta de crédito · Cancela cuando quieras · Soporte en español</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <img src={LOGO_ICON} alt="Buddy One" style={{ height: 36, width: 36 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "white" }}>Buddy</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#F97316" }}>One</span>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.65, maxWidth: 260, marginBottom: 20, color: "rgba(255,255,255,0.45)" }}>
                Tu ecosistema de bienestar inteligente. Nutrición, compra, salud y mascotas en un solo lugar.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {ECOSYSTEM.map(m => (
                  <span key={m.name} style={{ padding: "3px 10px", borderRadius: 100, background: `${m.color}18`, color: m.color, fontSize: 11, fontWeight: 600 }}>{m.name}</span>
                ))}
              </div>
            </div>
            {[
              { title: "Producto", links: ["Funcionalidades", "Precios", "BuddyIA", "Recetas", "Menús especiales", "Para empresas"] },
              { title: "Empresa", links: ["Sobre nosotros", "Blog", "Creadores", "FAQ", "Contacto"] },
              { title: "Legal", links: ["Privacidad", "Términos de uso", "Cookies", "RGPD", "Aviso legal"] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>{col.title}</h4>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,0.40)", textDecoration: "none", marginBottom: 10, transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}
                  >{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>© 2025 Buddy One. Todos los derechos reservados.</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>El contenido de Buddy One es orientativo y no sustituye el consejo de un profesional de la salud.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
