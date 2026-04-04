import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface SetupData {
  // Paso 1: Objetivo principal
  mainGoal: string;
  // Paso 2: Restricciones alimentarias
  restrictions: string[];
  // Paso 3: Horarios y comidas
  dailyMeals: number;
  mealTimes: string[];
  mealPrepTime: string;
  // Paso 4: Presupuesto y nivel
  budgetPerWeek: number;
  cookingLevel: string;
  // Paso 5: Generación del menú
  generateMenu: boolean;
}

const GOALS = [
  { id: "lose_weight", emoji: "🔥", label: "Perder peso", desc: "Déficit calórico controlado" },
  { id: "gain_muscle", emoji: "💪", label: "Ganar músculo", desc: "Superávit con más proteína" },
  { id: "maintain", emoji: "⚖️", label: "Mantener peso", desc: "Equilibrio nutricional" },
  { id: "improve_health", emoji: "❤️", label: "Mejorar salud", desc: "Alimentación equilibrada" },
  { id: "eat_healthier", emoji: "🥗", label: "Comer mejor", desc: "Hábitos más saludables" },
];

const RESTRICTIONS = [
  { id: "vegetariano", emoji: "🥦", label: "Vegetariano" },
  { id: "vegano", emoji: "🌱", label: "Vegano" },
  { id: "sin_gluten", emoji: "🌾", label: "Sin gluten" },
  { id: "sin_lactosa", emoji: "🥛", label: "Sin lactosa" },
  { id: "sin_frutos_secos", emoji: "🥜", label: "Sin frutos secos" },
  { id: "sin_mariscos", emoji: "🦐", label: "Sin mariscos" },
  { id: "halal", emoji: "☪️", label: "Halal" },
  { id: "kosher", emoji: "✡️", label: "Kosher" },
  { id: "ninguna", emoji: "✅", label: "Ninguna" },
];

const MEAL_TIMES = [
  { id: "desayuno", emoji: "☀️", label: "Desayuno" },
  { id: "media_manana", emoji: "🍎", label: "Media mañana" },
  { id: "comida", emoji: "🍽️", label: "Comida" },
  { id: "merienda", emoji: "🍪", label: "Merienda" },
  { id: "cena", emoji: "🌙", label: "Cena" },
];

const PREP_TIMES = [
  { id: "under_15", label: "< 15 min", desc: "Recetas rápidas" },
  { id: "15_30", label: "15–30 min", desc: "Equilibrado" },
  { id: "30_60", label: "30–60 min", desc: "Con tiempo" },
  { id: "over_60", label: "+ 1 hora", desc: "Me encanta cocinar" },
];

const COOKING_LEVELS = [
  { id: "beginner", emoji: "👶", label: "Principiante", desc: "Recetas sencillas" },
  { id: "intermediate", emoji: "👨‍🍳", label: "Intermedio", desc: "Me defiendo bien" },
  { id: "advanced", emoji: "⭐", label: "Avanzado", desc: "Técnicas complejas" },
];

const GENERATING_MESSAGES = [
  "Analizando tus preferencias nutricionales…",
  "Calculando tus necesidades calóricas…",
  "Seleccionando recetas adaptadas a ti…",
  "Organizando el menú semanal…",
  "Ajustando porciones y macros…",
  "Casi listo, finalizando tu menú…",
];

// ─── Componente GeneratingScreen ──────────────────────────────────────────────
function GeneratingScreen({ onTimeout }: { onTimeout: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % GENERATING_MESSAGES.length);
    }, 3000);

    const elapsedTimer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    // Timeout de seguridad: si después de 45s no hay respuesta, redirigir
    const safetyTimeout = setTimeout(() => {
      onTimeout();
    }, 45000);

    return () => {
      clearInterval(msgTimer);
      clearInterval(elapsedTimer);
      clearTimeout(safetyTimeout);
    };
  }, [onTimeout]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#fdf8f3] px-6 text-center">
      <div className="mb-6 relative">
        <div className="text-6xl">🤖</div>
        <div className="absolute -bottom-1 -right-1 text-2xl animate-bounce">✨</div>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">Generando tu menú personalizado</h2>
      <p className="mb-2 text-sm text-orange-500 font-semibold min-h-[20px] transition-all">
        {GENERATING_MESSAGES[msgIndex]}
      </p>
      <p className="mb-8 text-xs text-gray-400">Esto puede tardar hasta 30 segundos</p>

      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((elapsed / 30) * 100, 95)}%` }}
        />
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-full bg-orange-400"
            style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      {elapsed >= 15 && (
        <button
          onClick={onTimeout}
          className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline transition-colors"
        >
          Ir al dashboard sin esperar →
        </button>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export default function BuddySetup() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const [data, setData] = useState<SetupData>({
    mainGoal: "",
    restrictions: [],
    dailyMeals: 3,
    mealTimes: ["desayuno", "comida", "cena"],
    mealPrepTime: "15_30",
    budgetPerWeek: 60,
    cookingLevel: "intermediate",
    generateMenu: true,
  });

  // FIX: usar mutate (no mutateAsync) con callbacks inline para evitar que
  // onSuccess no se dispare al usar await con mutateAsync
  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();

  const totalSteps = 5;

  const goNext = () => {
    if (step < totalSteps) {
      setDirection("forward");
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setAnimating(false);
      }, 200);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection("back");
      setAnimating(true);
      setTimeout(() => {
        setStep((s) => s - 1);
        setAnimating(false);
      }, 200);
    }
  };

  const handleFinish = () => {
    setGenerating(true);
    completeOnboarding.mutate(
      {
        mainGoal: data.mainGoal,
        restrictions: data.restrictions,
        dailyMeals: data.dailyMeals,
        mealTimes: data.mealTimes,
        mealPrepTime: data.mealPrepTime,
        budgetPerWeek: data.budgetPerWeek,
        cookingLevel: data.cookingLevel,
        generateMenu: data.generateMenu,
      },
      {
        onSuccess: () => {
          setGenerating(false);
          setDone(true);
          setTimeout(() => setLocation("/app/dashboard"), 2000);
        },
        onError: (err: { message: string }) => {
          toast.error("Error al guardar tu configuración: " + err.message);
          setGenerating(false);
        },
      }
    );
  };

  const toggleRestriction = (id: string) => {
    if (id === "ninguna") {
      setData((d) => ({ ...d, restrictions: ["ninguna"] }));
      return;
    }
    setData((d) => {
      const filtered = d.restrictions.filter((r) => r !== "ninguna");
      return {
        ...d,
        restrictions: filtered.includes(id)
          ? filtered.filter((r) => r !== id)
          : [...filtered, id],
      };
    });
  };

  const toggleMealTime = (id: string) => {
    setData((d) => ({
      ...d,
      mealTimes: d.mealTimes.includes(id)
        ? d.mealTimes.filter((m) => m !== id)
        : [...d.mealTimes, id],
      dailyMeals: d.mealTimes.includes(id)
        ? Math.max(1, d.mealTimes.length - 1)
        : d.mealTimes.length + 1,
    }));
  };

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#fdf8f3] px-6 text-center">
        <div className="mb-6 text-7xl animate-bounce">🎉</div>
        <h1 className="mb-3 text-3xl font-extrabold text-gray-900">¡Todo listo!</h1>
        <p className="text-gray-500">Tu primer menú personalizado está siendo preparado.<br />Redirigiendo al Dashboard…</p>
      </div>
    );
  }

  // ── Pantalla de generación ─────────────────────────────────────────────────
  if (generating) {
    return <GeneratingScreen onTimeout={() => setLocation("/app/dashboard")} />;
  }

  const animClass = animating
    ? direction === "forward"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <div className="fixed inset-0 flex flex-col bg-[#fdf8f3]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={goBack}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-gray-600 transition-opacity ${step === 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          ←
        </button>
        <div className="text-sm font-semibold text-gray-400">{step} / {totalSteps}</div>
        <button
          onClick={() => setLocation("/app/dashboard")}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Omitir
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="mx-5 mb-6 h-1.5 rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-orange-400 transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Contenido del paso */}
      <div
        className={`flex-1 overflow-y-auto px-5 transition-all duration-200 ${animClass}`}
      >
        {step === 1 && <StepGoal data={data} setData={setData} />}
        {step === 2 && <StepRestrictions data={data} toggleRestriction={toggleRestriction} />}
        {step === 3 && <StepMealTimes data={data} setData={setData} toggleMealTime={toggleMealTime} />}
        {step === 4 && <StepBudget data={data} setData={setData} />}
        {step === 5 && <StepConfirm data={data} setData={setData} />}
      </div>

      {/* Botón de acción */}
      <div className="px-5 pb-10 pt-4">
        {step < totalSteps ? (
          <button
            onClick={goNext}
            disabled={step === 1 && !data.mainGoal}
            className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 disabled:opacity-40 transition-all active:scale-95"
          >
            Continuar →
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition-all active:scale-95"
          >
            {data.generateMenu ? "✨ Generar mi menú personalizado" : "Empezar a usar BuddyMarket"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Paso 1: Objetivo ─────────────────────────────────────────────────────────
function StepGoal({ data, setData }: { data: SetupData; setData: React.Dispatch<React.SetStateAction<SetupData>> }) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">¿Cuál es tu objetivo?</h1>
      <p className="mb-6 text-sm text-gray-500">Personalizaremos tu menú y recetas según tu meta.</p>
      <div className="space-y-3">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => setData((d) => ({ ...d, mainGoal: g.id }))}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-all ${
              data.mainGoal === g.id
                ? "border-orange-400 bg-orange-50 shadow-sm"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <span className="text-3xl">{g.emoji}</span>
            <div>
              <p className="font-bold text-gray-900">{g.label}</p>
              <p className="text-xs text-gray-500">{g.desc}</p>
            </div>
            {data.mainGoal === g.id && (
              <span className="ml-auto text-orange-500 text-lg">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 2: Restricciones ────────────────────────────────────────────────────
function StepRestrictions({ data, toggleRestriction }: { data: SetupData; toggleRestriction: (id: string) => void }) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">¿Tienes restricciones?</h1>
      <p className="mb-6 text-sm text-gray-500">Selecciona todas las que apliquen. Puedes cambiarlo más tarde.</p>
      <div className="grid grid-cols-2 gap-3">
        {RESTRICTIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => toggleRestriction(r.id)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-4 px-2 transition-all ${
              data.restrictions.includes(r.id)
                ? "border-orange-400 bg-orange-50 shadow-sm"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <span className="text-2xl">{r.emoji}</span>
            <span className="text-xs font-semibold text-gray-700 text-center">{r.label}</span>
            {data.restrictions.includes(r.id) && (
              <span className="text-orange-500 text-xs">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 3: Horarios ─────────────────────────────────────────────────────────
function StepMealTimes({
  data,
  setData,
  toggleMealTime,
}: {
  data: SetupData;
  setData: React.Dispatch<React.SetStateAction<SetupData>>;
  toggleMealTime: (id: string) => void;
}) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">¿Cuándo comes?</h1>
      <p className="mb-6 text-sm text-gray-500">Selecciona las comidas que haces habitualmente.</p>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {MEAL_TIMES.map((m) => (
          <button
            key={m.id}
            onClick={() => toggleMealTime(m.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 px-2 transition-all ${
              data.mealTimes.includes(m.id)
                ? "border-orange-400 bg-orange-50"
                : "border-gray-100 bg-white"
            }`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-xs font-semibold text-gray-700 text-center">{m.label}</span>
          </button>
        ))}
      </div>

      <h2 className="mb-3 font-bold text-gray-900">Tiempo disponible para cocinar</h2>
      <div className="grid grid-cols-2 gap-3">
        {PREP_TIMES.map((p) => (
          <button
            key={p.id}
            onClick={() => setData((d) => ({ ...d, mealPrepTime: p.id }))}
            className={`rounded-2xl border-2 py-3 px-3 text-left transition-all ${
              data.mealPrepTime === p.id
                ? "border-orange-400 bg-orange-50"
                : "border-gray-100 bg-white"
            }`}
          >
            <p className="font-bold text-gray-900 text-sm">{p.label}</p>
            <p className="text-xs text-gray-500">{p.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 4: Presupuesto ──────────────────────────────────────────────────────
function StepBudget({ data, setData }: { data: SetupData; setData: React.Dispatch<React.SetStateAction<SetupData>> }) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">Presupuesto y nivel</h1>
      <p className="mb-6 text-sm text-gray-500">Ajustaremos las recetas a tu bolsillo y habilidades.</p>

      {/* Presupuesto semanal */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold text-gray-900">Presupuesto semanal</span>
          <span className="text-xl font-extrabold text-orange-500">{data.budgetPerWeek}€</span>
        </div>
        <input
          type="range"
          min={20}
          max={200}
          step={5}
          value={data.budgetPerWeek}
          onChange={(e) => setData((d) => ({ ...d, budgetPerWeek: Number(e.target.value) }))}
          className="w-full accent-orange-500"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>20€</span>
          <span>200€</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {data.budgetPerWeek < 40
            ? "🟡 Recetas económicas y de temporada"
            : data.budgetPerWeek < 100
            ? "🟢 Variedad equilibrada"
            : "⭐ Ingredientes premium y gourmet"}
        </p>
      </div>

      {/* Nivel de cocina */}
      <h2 className="mb-3 font-bold text-gray-900">Nivel de cocina</h2>
      <div className="space-y-3">
        {COOKING_LEVELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setData((d) => ({ ...d, cookingLevel: c.id }))}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
              data.cookingLevel === c.id
                ? "border-orange-400 bg-orange-50"
                : "border-gray-100 bg-white"
            }`}
          >
            <span className="text-2xl">{c.emoji}</span>
            <div>
              <p className="font-bold text-gray-900 text-sm">{c.label}</p>
              <p className="text-xs text-gray-500">{c.desc}</p>
            </div>
            {data.cookingLevel === c.id && <span className="ml-auto text-orange-500">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Paso 5: Confirmación ─────────────────────────────────────────────────────
function StepConfirm({ data, setData }: { data: SetupData; setData: React.Dispatch<React.SetStateAction<SetupData>> }) {
  const goalLabel = GOALS.find((g) => g.id === data.mainGoal)?.label ?? data.mainGoal;
  const goalEmoji = GOALS.find((g) => g.id === data.mainGoal)?.emoji ?? "🎯";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">¡Casi listo!</h1>
      <p className="mb-6 text-sm text-gray-500">Revisa tu configuración antes de empezar.</p>

      <div className="space-y-3">
        <SummaryRow emoji={goalEmoji} label="Objetivo" value={goalLabel} />
        <SummaryRow
          emoji="🚫"
          label="Restricciones"
          value={
            data.restrictions.length === 0 || data.restrictions.includes("ninguna")
              ? "Ninguna"
              : data.restrictions.join(", ")
          }
        />
        <SummaryRow
          emoji="🍽️"
          label="Comidas al día"
          value={`${data.mealTimes.length} comidas (${data.mealTimes.join(", ")})`}
        />
        <SummaryRow
          emoji="⏱️"
          label="Tiempo de cocina"
          value={PREP_TIMES.find((p) => p.id === data.mealPrepTime)?.label ?? data.mealPrepTime}
        />
        <SummaryRow emoji="💶" label="Presupuesto" value={`${data.budgetPerWeek}€/semana`} />
        <SummaryRow
          emoji="👨‍🍳"
          label="Nivel"
          value={COOKING_LEVELS.find((c) => c.id === data.cookingLevel)?.label ?? data.cookingLevel}
        />
      </div>

      {/* Toggle generar menú */}
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-orange-50 border-2 border-orange-200 px-4 py-4">
        <div>
          <p className="font-bold text-gray-900">✨ Generar mi primer menú</p>
          <p className="text-xs text-gray-500">La IA creará un menú personalizado para esta semana</p>
        </div>
        <button
          onClick={() => setData((d) => ({ ...d, generateMenu: !d.generateMenu }))}
          className={`relative h-7 w-12 rounded-full transition-colors ${data.generateMenu ? "bg-orange-500" : "bg-gray-300"}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${data.generateMenu ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <span className="text-xl">{emoji}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-semibold text-gray-900 text-sm leading-snug">{value}</p>
      </div>
    </div>
  );
}
