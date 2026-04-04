import { useState, useRef, useCallback } from "react";

interface Fact {
  emoji: string;
  category: string;
  categoryColor: string;
  title: string;
  content: string;
  tip?: string;
}

const FACTS: Fact[] = [
  {
    emoji: "🥑",
    category: "Grasas saludables",
    categoryColor: "bg-green-100 text-green-700",
    title: "El aguacate tiene más potasio que el plátano",
    content: "Un aguacate mediano contiene 975 mg de potasio, frente a los 422 mg del plátano. El potasio regula la presión arterial y la función muscular.",
    tip: "Añade ¼ de aguacate a tu desayuno para empezar el día con energía.",
  },
  {
    emoji: "💧",
    category: "Hidratación",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "Beber agua antes de comer reduce el apetito",
    content: "Estudios demuestran que beber 500 ml de agua 30 minutos antes de las comidas puede reducir la ingesta calórica hasta un 13%.",
    tip: "Prueba a beber un vaso grande de agua antes de cada comida principal.",
  },
  {
    emoji: "🥦",
    category: "Verduras",
    categoryColor: "bg-emerald-100 text-emerald-700",
    title: "El brócoli cocinado al vapor conserva más nutrientes",
    content: "Hervir el brócoli destruye hasta el 50% de su vitamina C. Al vapor, se conserva más del 90% de sus antioxidantes y vitaminas.",
    tip: "Cocina el brócoli al vapor 3-4 minutos para máximo beneficio nutricional.",
  },
  {
    emoji: "🍳",
    category: "Proteínas",
    categoryColor: "bg-yellow-100 text-yellow-700",
    title: "Los huevos son la proteína más completa que existe",
    content: "El huevo tiene un valor biológico de 100, lo que significa que su proteína es absorbida casi al 100% por el cuerpo. Contiene los 9 aminoácidos esenciales.",
    tip: "2 huevos en el desayuno te mantienen saciado hasta 4 horas más.",
  },
  {
    emoji: "🫐",
    category: "Antioxidantes",
    categoryColor: "bg-purple-100 text-purple-700",
    title: "Los arándanos mejoran la memoria a corto plazo",
    content: "Los flavonoides de los arándanos aumentan el flujo sanguíneo al cerebro. Consumirlos regularmente puede mejorar la memoria y la concentración en un 20%.",
    tip: "Un puñado de arándanos (80g) al día es suficiente para notar beneficios.",
  },
  {
    emoji: "🌾",
    category: "Carbohidratos",
    categoryColor: "bg-amber-100 text-amber-700",
    title: "La avena reduce el colesterol LDL de forma natural",
    content: "El beta-glucano de la avena forma una capa viscosa en el intestino que atrapa el colesterol malo antes de que sea absorbido. 3g al día son suficientes.",
    tip: "Un bol de avena en el desayuno cubre tus necesidades diarias de beta-glucano.",
  },
  {
    emoji: "🐟",
    category: "Omega-3",
    categoryColor: "bg-cyan-100 text-cyan-700",
    title: "El salmón reduce la inflamación mejor que muchos medicamentos",
    content: "Los ácidos grasos omega-3 del salmón (EPA y DHA) inhiben las mismas vías inflamatorias que los antiinflamatorios, sin efectos secundarios.",
    tip: "2 raciones de pescado azul a la semana cubren tus necesidades de omega-3.",
  },
  {
    emoji: "🧄",
    category: "Superalimentos",
    categoryColor: "bg-orange-100 text-orange-700",
    title: "El ajo crudo es 10 veces más potente que cocinado",
    content: "La alicina, el compuesto activo del ajo, se destruye con el calor. Para aprovechar sus propiedades antibacterianas, consúmelo crudo o déjalo reposar 10 min tras cortarlo.",
    tip: "Machaca un diente de ajo y espera 10 minutos antes de añadirlo a tus platos.",
  },
  {
    emoji: "🍫",
    category: "Caprichos sanos",
    categoryColor: "bg-rose-100 text-rose-700",
    title: "El chocolate negro mejora la sensibilidad a la insulina",
    content: "El cacao puro (>70%) contiene flavanoles que mejoran la función de los vasos sanguíneos y reducen la resistencia a la insulina en un 17% según estudios clínicos.",
    tip: "20-30g de chocolate negro al día es la dosis óptima para obtener beneficios.",
  },
  {
    emoji: "🥗",
    category: "Digestión",
    categoryColor: "bg-lime-100 text-lime-700",
    title: "Comer despacio puede hacerte consumir 100 kcal menos por comida",
    content: "La señal de saciedad tarda 20 minutos en llegar al cerebro. Comer en menos de 10 minutos hace que sigas comiendo aunque ya estés lleno.",
    tip: "Mastica cada bocado al menos 20 veces y deja el tenedor entre bocados.",
  },
  {
    emoji: "☀️",
    category: "Vitaminas",
    categoryColor: "bg-yellow-100 text-yellow-700",
    title: "El 80% de los españoles tiene déficit de vitamina D",
    content: "A pesar del sol, la mayoría de españoles tiene niveles insuficientes de vitamina D. Esta vitamina regula el sistema inmune, los huesos y el estado de ánimo.",
    tip: "15 minutos de sol en brazos y cara entre las 10h y 14h son suficientes en verano.",
  },
  {
    emoji: "🫀",
    category: "Corazón",
    categoryColor: "bg-red-100 text-red-700",
    title: "El aceite de oliva virgen extra protege el corazón mejor que el regular",
    content: "El AOVE contiene oleocantal, un compuesto con propiedades antiinflamatorias similares al ibuprofeno. El aceite refinado pierde estos compuestos en el proceso.",
    tip: "Usa AOVE en crudo para ensaladas y añádelo al final de tus platos calientes.",
  },
  {
    emoji: "🧠",
    category: "Cerebro",
    categoryColor: "bg-violet-100 text-violet-700",
    title: "El ayuno intermitente estimula la neuroplasticidad",
    content: "Periodos de ayuno de 14-16 horas aumentan los niveles de BDNF (factor neurotrófico), una proteína que favorece el crecimiento de nuevas neuronas y mejora la memoria.",
    tip: "Un ayuno de 12h (cenar a las 20h y desayunar a las 8h) ya tiene beneficios.",
  },
  {
    emoji: "🥕",
    category: "Piel",
    categoryColor: "bg-orange-100 text-orange-700",
    title: "Los carotenoides de la zanahoria mejoran el tono de piel",
    content: "Consumir zanahoria regularmente deposita beta-caroteno en la piel, dándole un tono más cálido y saludable. Este efecto es más apreciado que un bronceado moderado.",
    tip: "Combina zanahoria con una grasa (aceite, aguacate) para absorber mejor el beta-caroteno.",
  },
  {
    emoji: "🌿",
    category: "Microbiota",
    categoryColor: "bg-teal-100 text-teal-700",
    title: "Tienes más bacterias en el intestino que células en el cuerpo",
    content: "El microbioma intestinal contiene 38 billones de bacterias que influyen en tu estado de ánimo, sistema inmune y metabolismo. La diversidad de tu dieta determina su salud.",
    tip: "Intenta comer al menos 30 tipos diferentes de plantas a la semana.",
  },
  {
    emoji: "⚡",
    category: "Energía",
    categoryColor: "bg-yellow-100 text-yellow-700",
    title: "El magnesio es el mineral más deficiente en la dieta moderna",
    content: "El 75% de la población occidental no consume suficiente magnesio. Este mineral participa en más de 300 reacciones enzimáticas, incluyendo la producción de energía.",
    tip: "Semillas de calabaza, almendras y espinacas son las mejores fuentes de magnesio.",
  },
  {
    emoji: "🍵",
    category: "Bebidas",
    categoryColor: "bg-green-100 text-green-700",
    title: "El té verde aumenta la quema de grasa un 17% durante el ejercicio",
    content: "La combinación de cafeína y EGCG del té verde activa la lipólisis (quema de grasa) de forma sinérgica. El efecto es mayor si se consume 30 minutos antes de entrenar.",
    tip: "2-3 tazas de té verde al día maximizan sus beneficios metabólicos.",
  },
  {
    emoji: "🦴",
    category: "Huesos",
    categoryColor: "bg-slate-100 text-slate-700",
    title: "La vitamina K2 dirige el calcio a los huesos, no a las arterias",
    content: "Sin vitamina K2, el calcio que consumes puede depositarse en las arterias en lugar de en los huesos. El queso curado, el natto y los huevos son las mejores fuentes.",
    tip: "Combina siempre los suplementos de calcio y vitamina D con vitamina K2.",
  },
  {
    emoji: "🏃",
    category: "Rendimiento",
    categoryColor: "bg-blue-100 text-blue-700",
    title: "Los nitratos de la remolacha mejoran el rendimiento deportivo",
    content: "Beber zumo de remolacha 2-3 horas antes del ejercicio mejora la resistencia hasta un 16% al reducir el coste de oxígeno del músculo.",
    tip: "200ml de zumo de remolacha pura antes de entrenar es la dosis efectiva.",
  },
  {
    emoji: "😴",
    category: "Sueño",
    categoryColor: "bg-indigo-100 text-indigo-700",
    title: "Dormir mal hace que comas 385 kcal más al día siguiente",
    content: "La privación de sueño eleva la grelina (hormona del hambre) y reduce la leptina (hormona de la saciedad), llevando a un consumo extra de casi 400 kcal, especialmente de ultraprocesados.",
    tip: "Mantener un horario de sueño regular es tan importante como la dieta.",
  },
];

export default function DidYouKnow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number, dir: "left" | "right") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    setTimeout(() => {
      setCurrentIndex(index);
      setDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    const next = (currentIndex + 1) % FACTS.length;
    goTo(next, "left");
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    const prev = (currentIndex - 1 + FACTS.length) % FACTS.length;
    goTo(prev, "right");
  }, [currentIndex, goTo]);

  // Touch / mouse drag handlers
  const handleDragStart = (clientX: number) => {
    setDragStart(clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleDragMove = (clientX: number) => {
    if (dragStart === null || !isDragging) return;
    setDragOffset(clientX - dragStart);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -50) goNext();
    else if (dragOffset > 50) goPrev();
    setDragOffset(0);
    setDragStart(null);
  };

  const fact = FACTS[currentIndex];

  const cardStyle: React.CSSProperties = {
    transform: isDragging
      ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.03}deg)`
      : direction === "left"
      ? "translateX(-100%) rotate(-5deg)"
      : direction === "right"
      ? "translateX(100%) rotate(5deg)"
      : "translateX(0) rotate(0deg)",
    transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    opacity: direction ? 0 : 1,
  };

  return (
    <div className="px-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h2 className="text-base font-bold text-gray-900">¿Sabías que...?</h2>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {currentIndex + 1} / {FACTS.length}
        </span>
      </div>

      {/* Card container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden select-none"
        style={{ height: "220px" }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        <div
          className="absolute inset-0 rounded-3xl p-5 cursor-grab active:cursor-grabbing"
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #fff9f5 0%, #fff5ee 100%)",
            border: "1.5px solid #ffe8d6",
            boxShadow: "0 4px 20px rgba(249,115,22,0.10)",
          }}
        >
          {/* Category badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${fact.categoryColor}`}>
            {fact.emoji} {fact.category}
          </span>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug">
            {fact.title}
          </h3>

          {/* Content */}
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            {fact.content}
          </p>

          {/* Tip */}
          {fact.tip && (
            <div className="flex items-start gap-1.5 bg-orange-50 rounded-xl px-3 py-2">
              <span className="text-xs">💡</span>
              <p className="text-xs text-orange-700 font-medium leading-snug">{fact.tip}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation dots + arrows */}
      <div className="flex items-center justify-between mt-3 px-1">
        <button
          onClick={goPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-colors text-sm font-bold"
        >
          ‹
        </button>

        {/* Dots — show 5 around current */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: FACTS.length }).map((_, i) => {
            const dist = Math.abs(i - currentIndex);
            if (dist > 2) return null;
            return (
              <button
                key={i}
                onClick={() => goTo(i, i > currentIndex ? "left" : "right")}
                className="rounded-full transition-all"
                style={{
                  width: i === currentIndex ? "20px" : "6px",
                  height: "6px",
                  background: i === currentIndex ? "#F97316" : "#e5e7eb",
                }}
              />
            );
          })}
        </div>

        <button
          onClick={goNext}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600 transition-colors text-sm font-bold"
        >
          ›
        </button>
      </div>

      {/* Swipe hint — shown only first time */}
      <p className="text-center text-xs text-gray-400 mt-1.5">
        Desliza para descubrir más curiosidades
      </p>
    </div>
  );
}
