import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface SetupData {
  // Paso 1: Objetivo principal
  mainGoal: string;
  // Paso 2: Datos físicos
  gender: "male" | "female" | "";
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  // Paso 3: Restricciones alimentarias
  restrictions: string[];
  customRestrictions: string;
  // Paso 4: Horarios y comidas
  dailyMeals: number;
  mealTimes: string[];
  mealPrepTime: string;
  // Paso 5: Presupuesto y nivel
  budgetPerWeek: number;
  cookingLevel: string;
  // Paso 6: Confirmación
  generateMenu: boolean;
}

// ─── Fórmula Mifflin-St Jeor ──────────────────────────────────────────────────
function calculateTDEE(data: SetupData): { tmb: number; tdee: number; goal: number } | null {
  if (!data.gender || !data.age || !data.heightCm || !data.weightKg) return null;

  // TMB = 10×peso + 6.25×altura − 5×edad + (5 hombre / −161 mujer)
  const tmb =
    10 * data.weightKg +
    6.25 * data.heightCm -
    5 * data.age +
    (data.gender === "male" ? 5 : -161);

  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const factor = activityFactors[data.activityLevel] ?? 1.375;
  const tdee = Math.round(tmb * factor);

  // Ajuste según objetivo
  let goal = tdee;
  if (data.mainGoal === "lose_weight") goal = Math.round(tdee - 400);
  else if (data.mainGoal === "gain_muscle") goal = Math.round(tdee + 250);
  else if (data.mainGoal === "lose_fat") goal = Math.round(tdee - 300);

  return { tmb: Math.round(tmb), tdee, goal };
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
  { id: "sin_huevo", emoji: "🥚", label: "Sin huevo" },
  { id: "sin_soja", emoji: "🫘", label: "Sin soja" },
  { id: "sin_pescado", emoji: "🐟", label: "Sin pescado" },
  { id: "sin_cerdo", emoji: "🐷", label: "Sin cerdo" },
  { id: "sin_ternera", emoji: "🐄", label: "Sin ternera" },
  { id: "sin_azucar", emoji: "🍬", label: "Sin azúcar" },
  { id: "bajo_sal", emoji: "🧂", label: "Bajo en sal" },
  { id: "sin_picante", emoji: "🌶️", label: "Sin picante" },
  { id: "mediterranea", emoji: "🫒", label: "Mediterránea" },
  { id: "paleo", emoji: "🦴", label: "Paleo" },
  { id: "keto", emoji: "🥑", label: "Keto" },
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

const ACTIVITY_LEVELS = [
  { id: "sedentary", emoji: "🛋️", label: "Sedentario", desc: "Poco o nada de ejercicio" },
  { id: "light", emoji: "🚶", label: "Ligero", desc: "1–3 días/semana" },
  { id: "moderate", emoji: "🏃", label: "Moderado", desc: "3–5 días/semana" },
  { id: "active", emoji: "💪", label: "Activo", desc: "6–7 días/semana" },
  { id: "very_active", emoji: "🏋️", label: "Muy activo", desc: "Doble sesión diaria" },
];

const GENERATING_MESSAGES = [
  "Analizando tus preferencias nutricionales…",
  "Calculando tus necesidades calóricas personalizadas…",
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
  const [physicalDataPrefilled, setPhysicalDataPrefilled] = useState(false);

  const [data, setData] = useState<SetupData>({
    mainGoal: "",
    gender: "",
    age: 30,
    heightCm: 170,
    weightKg: 70,
    activityLevel: "moderate",
    restrictions: [],
    customRestrictions: "",
    dailyMeals: 3,
    mealTimes: ["desayuno", "comida", "cena"],
    mealPrepTime: "15_30",
    budgetPerWeek: 60,
    cookingLevel: "intermediate",
    generateMenu: true,
  });

  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();
  const { data: existingProfile } = trpc.profile.get.useQuery();

  // Pre-fill data from existing profile (set during Registration)
  useEffect(() => {
    if (!existingProfile?.profile) return;
    const p = existingProfile.profile;
    setData(prev => ({
      ...prev,
      gender: (p.gender as "male" | "female" | "") || prev.gender,
      age: p.age ?? prev.age,
      heightCm: p.height ?? prev.heightCm,
      weightKg: p.weight ?? prev.weightKg,
      activityLevel: p.activityLevel ?? prev.activityLevel,
      mainGoal: p.mainGoal ?? prev.mainGoal,
      cookingLevel: p.cookingLevel ?? prev.cookingLevel,
    }));
    // If profile already has physical data, skip step 2
    if (p.gender && p.age && p.height && p.weight) {
      setPhysicalDataPrefilled(true);
    }
  }, [existingProfile]);

  const totalSteps = 6;

  const goNext = () => {
    if (step < totalSteps) {
      setDirection("forward");
      setAnimating(true);
      setTimeout(() => {
        // Skip step 2 (physical data) if already prefilled from Registration
        const nextStep = (step === 1 && physicalDataPrefilled) ? 3 : step + 1;
        setStep(nextStep);
        setAnimating(false);
      }, 200);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection("back");
      setAnimating(true);
      setTimeout(() => {
        // Skip step 2 (physical data) if already prefilled from Registration
        const prevStep = (step === 3 && physicalDataPrefilled) ? 1 : step - 1;
        setStep(prevStep);
        setAnimating(false);
      }, 200);
    }
  };

  const handleFinish = () => {
    const tdeeResult = calculateTDEE(data);
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
        // Datos físicos para cálculo TMB/TDEE
        gender: data.gender || undefined,
        age: data.age || undefined,
        heightCm: data.heightCm || undefined,
        weightKg: data.weightKg || undefined,
        activityLevel: data.activityLevel || undefined,
        dailyCalorieGoal: tdeeResult?.goal || undefined,
        basalMetabolicRate: tdeeResult?.tmb || undefined,
      },
      {
        onSuccess: () => {
          setGenerating(false);
          setDone(true);
          // Redirect to tour if not seen yet, otherwise to dashboard
          const tourDone = localStorage.getItem("bm_tour_completed");
          setTimeout(() => setLocation(tourDone ? "/app/dashboard" : "/app/tour"), 2000);
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

  // Validación por paso
  const canContinue = () => {
    if (step === 1) return !!data.mainGoal;
    if (step === 2) return !!data.gender && data.age > 0 && data.heightCm > 0 && data.weightKg > 0;
    return true;
  };

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
        {step === 2 && <StepPhysical data={data} setData={setData} />}
        {step === 3 && <StepRestrictions data={data} toggleRestriction={toggleRestriction} setData={setData} />}
        {step === 4 && <StepMealTimes data={data} setData={setData} toggleMealTime={toggleMealTime} />}
        {step === 5 && <StepBudget data={data} setData={setData} />}
        {step === 6 && <StepConfirm data={data} setData={setData} />}
      </div>

      {/* Botón de acción */}
      <div className="px-5 pb-10 pt-4">
        {step < totalSteps ? (
          <button
            onClick={goNext}
            disabled={!canContinue()}
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

// ─── Paso 2: Datos físicos (NUEVO) ────────────────────────────────────────────
function StepPhysical({ data, setData }: { data: SetupData; setData: React.Dispatch<React.SetStateAction<SetupData>> }) {
  const tdee = calculateTDEE(data);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">Tus datos físicos</h1>
      <p className="mb-6 text-sm text-gray-500">Calculamos tus calorías reales con la fórmula Mifflin-St Jeor.</p>

      {/* Sexo */}
      <div className="mb-5">
        <p className="mb-2 font-bold text-gray-900 text-sm">Sexo biológico</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "male", emoji: "♂️", label: "Hombre" },
            { id: "female", emoji: "♀️", label: "Mujer" },
          ].map((g) => (
            <button
              key={g.id}
              onClick={() => setData((d) => ({ ...d, gender: g.id as "male" | "female" }))}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-4 transition-all ${
                data.gender === g.id
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-sm font-semibold text-gray-700">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Edad */}
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-900 text-sm">Edad</span>
          <span className="text-xl font-extrabold text-orange-500">{data.age} años</span>
        </div>
        <input
          type="range" min={15} max={80} step={1} value={data.age}
          onChange={(e) => setData((d) => ({ ...d, age: Number(e.target.value) }))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>15</span><span>80</span></div>
      </div>

      {/* Altura */}
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-900 text-sm">Altura</span>
          <span className="text-xl font-extrabold text-orange-500">{data.heightCm} cm</span>
        </div>
        <input
          type="range" min={140} max={220} step={1} value={data.heightCm}
          onChange={(e) => setData((d) => ({ ...d, heightCm: Number(e.target.value) }))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>140 cm</span><span>220 cm</span></div>
      </div>

      {/* Peso */}
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-gray-900 text-sm">Peso actual</span>
          <span className="text-xl font-extrabold text-orange-500">{data.weightKg} kg</span>
        </div>
        <input
          type="range" min={40} max={180} step={0.5} value={data.weightKg}
          onChange={(e) => setData((d) => ({ ...d, weightKg: Number(e.target.value) }))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>40 kg</span><span>180 kg</span></div>
      </div>

      {/* Nivel de actividad */}
      <div className="mb-5">
        <p className="mb-2 font-bold text-gray-900 text-sm">Nivel de actividad física</p>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((a) => (
            <button
              key={a.id}
              onClick={() => setData((d) => ({ ...d, activityLevel: a.id }))}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                data.activityLevel === a.id
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <span className="text-xl">{a.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{a.label}</p>
                <p className="text-xs text-gray-500">{a.desc}</p>
              </div>
              {data.activityLevel === a.id && <span className="text-orange-500">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado TDEE en tiempo real */}
      {tdee && data.gender && (
        <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 p-4 mb-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Tu metabolismo estimado</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-extrabold text-gray-900">{tdee.tmb}</p>
              <p className="text-xs text-gray-500">TMB (kcal)</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-gray-900">{tdee.tdee}</p>
              <p className="text-xs text-gray-500">TDEE (kcal)</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-orange-500">{tdee.goal}</p>
              <p className="text-xs text-gray-500">Objetivo (kcal)</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {tdee.goal < tdee.tdee
              ? `Déficit de ${tdee.tdee - tdee.goal} kcal/día para tu objetivo`
              : tdee.goal > tdee.tdee
              ? `Superávit de ${tdee.goal - tdee.tdee} kcal/día para tu objetivo`
              : "Mantenimiento calórico"}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Paso 3: Restricciones ────────────────────────────────────────────────────
function StepRestrictions({
  data,
  toggleRestriction,
  setData,
}: {
  data: SetupData;
  toggleRestriction: (id: string) => void;
  setData: React.Dispatch<React.SetStateAction<SetupData>>;
}) {
  const [showOtras, setShowOtras] = useState(false);

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
        {/* Botón Otras */}
        <button
          onClick={() => setShowOtras((v) => !v)}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-4 px-2 transition-all col-span-2 ${
            showOtras || (data.customRestrictions && data.customRestrictions.trim().length > 0)
              ? "border-orange-400 bg-orange-50 shadow-sm"
              : "border-gray-100 bg-white hover:border-gray-200"
          }`}
        >
          <span className="text-2xl">✍️</span>
          <span className="text-xs font-semibold text-gray-700 text-center">Otras restricciones</span>
        </button>
      </div>
      {/* Campo de texto para restricciones personalizadas */}
      {showOtras && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Describe tus restricciones o alergias específicas
          </label>
          <textarea
            value={data.customRestrictions || ""}
            onChange={(e) => setData((d) => ({ ...d, customRestrictions: e.target.value }))}
            placeholder="Ej: alérgico al apio, intolerante al sorbitol, dieta baja en FODMAP, sin sulfitos..."
            rows={3}
            className="w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-orange-400 focus:outline-none resize-none transition-colors"
          />
          <p className="mt-1.5 text-xs text-gray-400">La IA tendrá en cuenta estas restricciones al generar tu menú.</p>
        </div>
      )}
    </div>
  );
}

// ─── Paso 4: Horarios ─────────────────────────────────────────────────────────
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

// ─── Paso 5: Presupuesto ──────────────────────────────────────────────────────
function StepBudget({ data, setData }: { data: SetupData; setData: React.Dispatch<React.SetStateAction<SetupData>> }) {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">Presupuesto y nivel</h1>
      <p className="mb-6 text-sm text-gray-500">Ajustaremos las recetas a tu bolsillo y habilidades.</p>

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold text-gray-900">Presupuesto semanal</span>
          <span className="text-xl font-extrabold text-orange-500">{data.budgetPerWeek}€</span>
        </div>
        <input
          type="range" min={20} max={200} step={5} value={data.budgetPerWeek}
          onChange={(e) => setData((d) => ({ ...d, budgetPerWeek: Number(e.target.value) }))}
          className="w-full accent-orange-500"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-400">
          <span>20€</span><span>200€</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {data.budgetPerWeek < 40
            ? "🟡 Recetas económicas y de temporada"
            : data.budgetPerWeek < 100
            ? "🟢 Variedad equilibrada"
            : "⭐ Ingredientes premium y gourmet"}
        </p>
      </div>

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

// ─── Paso 6: Confirmación ─────────────────────────────────────────────────────
function StepConfirm({ data, setData }: { data: SetupData; setData: React.Dispatch<React.SetStateAction<SetupData>> }) {
  const goalLabel = GOALS.find((g) => g.id === data.mainGoal)?.label ?? data.mainGoal;
  const goalEmoji = GOALS.find((g) => g.id === data.mainGoal)?.emoji ?? "🎯";
  const tdee = calculateTDEE(data);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">¡Casi listo!</h1>
      <p className="mb-6 text-sm text-gray-500">Revisa tu configuración antes de empezar.</p>

      <div className="space-y-3">
        <SummaryRow emoji={goalEmoji} label="Objetivo" value={goalLabel} />
        {tdee && (
          <SummaryRow
            emoji="🔥"
            label="Calorías objetivo/día"
            value={`${tdee.goal} kcal (TDEE: ${tdee.tdee} kcal)`}
          />
        )}
        <SummaryRow
          emoji="👤"
          label="Perfil físico"
          value={`${data.gender === "male" ? "Hombre" : "Mujer"}, ${data.age} años, ${data.heightCm} cm, ${data.weightKg} kg`}
        />
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
