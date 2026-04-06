import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

// ─── Feature cards data ───────────────────────────────────────────────────────
const CARDS = [
  {
    id: 1,
    emoji: "🧠",
    color: "from-[#F97316] to-[#ea580c]",
    bg: "bg-[#1A1208]",
    accent: "#F97316",
    title: "IA Nutricional",
    subtitle: "Tu coach personal inteligente",
    description:
      "BuddyMarket analiza tus objetivos, metabolismo y preferencias para crear planes nutricionales completamente personalizados. La IA aprende contigo cada día.",
    features: ["Planes 100% personalizados", "Ajuste automático de calorías", "Aprende de tus hábitos"],
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
  },
  {
    id: 2,
    emoji: "🍽️",
    color: "from-[#10b981] to-[#059669]",
    bg: "bg-[#081A12]",
    accent: "#10b981",
    title: "Menús Semanales",
    subtitle: "Planificación sin esfuerzo",
    description:
      "Genera menús semanales completos en segundos. Desayuno, comida, merienda y cena adaptados a tus macros, con lista de la compra automática incluida.",
    features: ["Menús en 1 clic", "Lista de la compra automática", "Variedad garantizada"],
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu_semanal_banner-bJvcZL6L7JygtVy2QeuafW.webp",
  },
  {
    id: 3,
    emoji: "📖",
    color: "from-[#8b5cf6] to-[#7c3aed]",
    bg: "bg-[#100A1A]",
    accent: "#8b5cf6",
    title: "Recetas Personalizadas",
    subtitle: "Miles de recetas a tu medida",
    description:
      "Accede a un catálogo enorme de recetas filtradas por tus objetivos, alergias e ingredientes disponibles. Crea y comparte tus propias recetas con la comunidad.",
    features: ["Filtros por alergia e intolerancia", "Crea tus propias recetas", "Comparte con la comunidad"],
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",
  },
  {
    id: 4,
    emoji: "📊",
    color: "from-[#3b82f6] to-[#2563eb]",
    bg: "bg-[#080F1A]",
    accent: "#3b82f6",
    title: "Seguimiento Nutricional",
    subtitle: "Controla tu progreso en tiempo real",
    description:
      "Registra tus comidas con un escáner de código de barras o búsqueda inteligente. Visualiza tus macros, calorías y micronutrientes con gráficas detalladas.",
    features: ["Escáner de código de barras", "Gráficas de progreso", "Seguimiento de macros"],
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg",
  },
  {
    id: 5,
    emoji: "🛒",
    color: "from-[#f59e0b] to-[#d97706]",
    bg: "bg-[#1A1408]",
    accent: "#f59e0b",
    title: "Inventario Inteligente",
    subtitle: "Nunca más te faltará nada",
    description:
      "Gestiona tu despensa y nevera de forma inteligente. BuddyMarket sabe lo que tienes y genera recetas con los ingredientes disponibles, reduciendo el desperdicio.",
    features: ["Control de despensa", "Alertas de caducidad", "Recetas con lo que tienes"],
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",
  },
  {
    id: 6,
    emoji: "👥",
    color: "from-[#ec4899] to-[#db2777]",
    bg: "bg-[#1A0812]",
    accent: "#ec4899",
    title: "Comunidad BuddyMarket",
    subtitle: "Crece junto a otros",
    description:
      "Conecta con expertos en nutrición, sigue a otros usuarios, participa en retos y comparte tu progreso. La motivación es más fácil cuando no estás solo.",
    features: ["Retos y desafíos", "Buddy Experts certificados", "Comparte tu progreso"],
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",
  },
];

const STORAGE_KEY = "bm_tour_completed";

// ─── Component ────────────────────────────────────────────────────────────────
export default function OnboardingTour() {
  const [, setLocation] = useLocation();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [exiting, setExiting] = useState(false);
  const startX = useRef<number | null>(null);

  // If already completed, redirect immediately
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setLocation("/app/dashboard");
    }
  }, []);

  const card = CARDS[current];
  const isLast = current === CARDS.length - 1;

  const goNext = () => {
    if (isLast) {
      handleComplete();
      return;
    }
    setDirection(1);
    setCurrent((c) => c + 1);
  };

  const goPrev = () => {
    if (current === 0) return;
    setDirection(-1);
    setCurrent((c) => c - 1);
  };

  const handleComplete = () => {
    setExiting(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setLocation("/app/dashboard"), 700);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setLocation("/app/dashboard");
  };

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    startX.current = null;
  };

  const variants: any = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    }),
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#0F0D0B" }}
      animate={exiting ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress dots */}
      <div className="absolute top-6 left-0 right-0 flex justify-center gap-2 z-10">
        {CARDS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              background: i === current ? card.accent : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-5 z-10 text-white/40 text-sm font-medium hover:text-white/70 transition-colors"
      >
        Saltar
      </button>

      {/* Card */}
      <div className="w-full max-w-sm mx-auto px-4 relative" style={{ height: "calc(100vh - 100px)" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={card.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex flex-col rounded-3xl overflow-hidden"
            style={{ background: "#161412" }}
          >
            {/* Image section */}
            <div className="relative h-56 flex-shrink-0 overflow-hidden">
              <img
                src={card.img}
                alt={card.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, transparent 30%, #161412 100%)`,
                }}
              />
              {/* Emoji badge */}
              <div
                className="absolute bottom-4 left-5 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl"
                style={{ background: `linear-gradient(135deg, ${card.accent}33, ${card.accent}66)`, backdropFilter: "blur(8px)", border: `1px solid ${card.accent}44` }}
              >
                {card.emoji}
              </div>
              {/* Card number */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${card.accent}22`, color: card.accent, border: `1px solid ${card.accent}44` }}>
                {current + 1} / {CARDS.length}
              </div>
            </div>

            {/* Content section */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <p className="text-xs font-semibold mb-1" style={{ color: card.accent }}>
                {card.subtitle}
              </p>
              <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                {card.title}
              </h2>
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                {card.description}
              </p>

              {/* Feature list */}
              <div className="space-y-2.5 mb-6">
                {card.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${card.accent}22` }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke={card.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-white/70 text-sm">{f}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-auto mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/40 font-medium">{current + 1} de {CARDS.length} pasos</span>
                  <span className="text-xs font-semibold" style={{ color: card.accent }}>{Math.round(((current + 1) / CARDS.length) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${((current + 1) / CARDS.length) * 100}%`,
                      background: `linear-gradient(90deg, ${card.accent}99, ${card.accent})`,
                      boxShadow: `0 0 8px ${card.accent}66`,
                    }}
                  />
                </div>
              </div>
              {/* Navigation buttons */}
              <div className="flex gap-3">
                {current > 0 && (
                  <button
                    onClick={goPrev}
                    className="flex-shrink-0 w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex-1 h-12 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${card.accent}, ${card.accent}cc)`,
                    boxShadow: `0 4px 20px ${card.accent}44`,
                  }}
                >
                  {isLast ? (
                    <>
                      ¡Empezar ahora!
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Siguiente
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe hint (only first card) */}
      {current === 0 && (
        <motion.p
          className="absolute bottom-4 text-white/20 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Desliza para explorar →
        </motion.p>
      )}
    </motion.div>
  );
}
