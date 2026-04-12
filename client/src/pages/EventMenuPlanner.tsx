import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { usePlan } from "@/hooks/usePlan";
import { useLocation } from "wouter";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Dish {
  name: string;
  description: string;
  servingTip?: string;
  prepTime?: string;
  canPrepAhead?: boolean;
  difficulty?: string;
  ingredients?: string[];
  steps?: string[];
}

interface Course {
  name: string;
  emoji: string;
  description?: string;
  dishes: Dish[];
}

interface ShoppingCategory {
  category: string;
  items: string[];
}

interface PrepTask {
  when: string;
  tasks: string[];
}

interface GeneratedMenu {
  eventTitle: string;
  intro: string;
  timeline: string;
  courses: Course[];
  drinks: { nonAlcoholic: string[]; alcoholic?: string[] | null };
  shoppingList: ShoppingCategory[];
  hostingTips: string[];
  estimatedBudget: string;
  prepSchedule?: PrepTask[];
  error?: string;
}

// ─── Event types ─────────────────────────────────────────────────────────────

type EventCategory = "todos" | "informal" | "familiar" | "formal" | "romántico" | "festivo";

const EVENT_TYPES = [
  { id: "cena_amigos",   label: "Cena con amigos",  emoji: "🍽️", desc: "Cena informal en casa",      categories: ["informal"] as EventCategory[] },
  { id: "barbacoa",      label: "Barbacoa",          emoji: "🔥", desc: "Asado al aire libre",        categories: ["informal", "familiar"] as EventCategory[] },
  { id: "brunch",        label: "Brunch",             emoji: "🥞", desc: "Brunch dominical",           categories: ["informal", "familiar"] as EventCategory[] },
  { id: "aperitivo",    label: "Aperitivo",          emoji: "🫒", desc: "Vermut y tapas",             categories: ["informal"] as EventCategory[] },
  { id: "cumpleanos",   label: "Cumpleaños",        emoji: "🎂", desc: "Celebración de cumpleaños",  categories: ["familiar", "informal"] as EventCategory[] },
  { id: "navidad",      label: "Navidad",             emoji: "🎄", desc: "Cena o comida navideña",    categories: ["familiar", "festivo"] as EventCategory[] },
  { id: "fin_de_ano",   label: "Fin de Año",        emoji: "🥂", desc: "Nochevieja con estilo",     categories: ["festivo", "formal"] as EventCategory[] },
  { id: "reyes",        label: "Reyes",              emoji: "👑", desc: "Comida de Reyes Magos",     categories: ["familiar", "festivo"] as EventCategory[] },
  { id: "semana_santa", label: "Semana Santa",        emoji: "🐟", desc: "Menú de Cuaresma",         categories: ["familiar", "formal"] as EventCategory[] },
  { id: "cena_empresa", label: "Cena de empresa",    emoji: "🤝", desc: "Comida corporativa",        categories: ["formal"] as EventCategory[] },
  { id: "cena_romantica",label: "Cena romántica",   emoji: "🕯️", desc: "Para dos",                  categories: ["romántico"] as EventCategory[] },
  { id: "otro",         label: "Otro evento",        emoji: "🎉", desc: "Personaliza tu evento",    categories: ["informal"] as EventCategory[] },
];

const INTOLERANCES = [
  "Gluten", "Lactosa", "Frutos secos", "Mariscos", "Pescado",
  "Huevo", "Soja", "Sésamo", "Mostaza", "Apio", "Sulfitos",
];

const ALCOHOL_TYPES = ["Vino tinto", "Vino blanco", "Cava / Champán", "Cerveza", "Sidra", "Gin tonic", "Cócteles", "Whisky"];

const CUISINE_STYLES = [
  { id: "española", label: "🇪🇸 Española" },
  { id: "italiana", label: "🇮🇹 Italiana" },
  { id: "mediterránea", label: "🌊 Mediterránea" },
  { id: "internacional", label: "🌍 Internacional" },
  { id: "fusión", label: "✨ Fusión creativa" },
  { id: "tradicional", label: "🏡 Tradicional" },
];

const BUDGETS = [
  { id: "economico", label: "💰 Económico", desc: "Máximo aprovechamiento" },
  { id: "moderado", label: "💰💰 Moderado", desc: "Calidad-precio" },
  { id: "premium", label: "💰💰💰 Premium", desc: "Sin límites" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventMenuPlanner() {
  const { user, loading } = useAuth();
  const { limits, isFree } = usePlan();
  const [, navigate] = useLocation();
  const usageQuery = trpc.subscriptions.getMonthlyUsage.useQuery(undefined, { enabled: !!user });
  const eventMenusUsed = usageQuery.data?.eventMenusThisMonth ?? 0;
  const maxEventMenus = limits.maxEventMenusPerMonth;
  const eventLimitReached = maxEventMenus !== -1 && eventMenusUsed >= maxEventMenus;

  // Wizard state
  const [step, setStep] = useState(0);
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null);
  const [expandedDish, setExpandedDish] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "shopping" | "prep" | "tips">("menu");
  const [activeCategory, setActiveCategory] = useState<EventCategory>("todos");

  // Form state
  const [eventType, setEventType] = useState("");
  const [eventName, setEventName] = useState("");
  const [persons, setPersons] = useState(8);
  const [hasChildren, setHasChildren] = useState(false);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [servesAlcohol, setServesAlcohol] = useState(true);
  const [alcoholTypes, setAlcoholTypes] = useState<string[]>(["Vino tinto", "Vino blanco", "Cava / Champán"]);
  const [courses, setCourses] = useState({
    aperitivo: true,
    primero: true,
    segundo: true,
    postre: true,
    cafe: false,
  });
  const [cuisineStyle, setCuisineStyle] = useState("española");
  const [budget, setBudget] = useState("moderado");
  const [season, setSeason] = useState(() => {
    const m = new Date().getMonth();
    if (m >= 2 && m <= 4) return "primavera";
    if (m >= 5 && m <= 7) return "verano";
    if (m >= 8 && m <= 10) return "otoño";
    return "invierno";
  });
  const [extraNotes, setExtraNotes] = useState("");

  const saveEvent = trpc.savedEvents.save.useMutation({
    onSuccess: () => toast.success("⭐ Evento guardado en Mis Eventos"),
    onError: () => toast.error("Error al guardar el evento"),
  });

  const handleSaveEvent = () => {
    if (!generatedMenu) return;
    saveEvent.mutate({
      eventType,
      eventName: generatedMenu.eventTitle,
      persons,
      categories: activeCategory,
      menuData: JSON.stringify(generatedMenu),
    });
  };

  const generateMenu = trpc.events.generateMenu.useMutation({
    onSuccess: (data) => {
      setGeneratedMenu(data as unknown as GeneratedMenu);
      setStep(7);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (loading) return (
    <AppLayout title="Menú para Eventos">
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!user) return (
    <AppLayout title="Menú para Eventos">
      <div className="vively-page flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <span className="text-6xl">🎉</span>
        <h2 className="text-2xl font-bold">Inicia sesión para planificar tu evento</h2>
        <a href="/login" className="vively-btn-primary px-6 py-3 rounded-2xl">Iniciar sesión</a>
      </div>
    </AppLayout>
  );

  const toggleIntolerance = (i: string) =>
    setIntolerances(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const toggleAlcohol = (a: string) =>
    setAlcoholTypes(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handleGenerate = () => {
    if (eventLimitReached) {
      toast.error("Has usado tu menú de evento gratuito. Actualiza a Pro para crear menús ilimitados.");
      navigate("/app/subscription");
      return;
    }
    generateMenu.mutate({
      eventType,
      eventName: eventType === "otro" ? eventName : undefined,
      persons,
      hasChildren,
      intolerances,
      servesAlcohol,
      alcoholTypes: servesAlcohol ? alcoholTypes : [],
      courses,
      cuisineStyle,
      budget,
      season,
      extraNotes: extraNotes || undefined,
    });
    setStep(6); // loading step
  };

  const selectedEvent = EVENT_TYPES.find(e => e.id === eventType);

  // ── Steps ──────────────────────────────────────────────────────────────────

  const steps = [
    { label: "Evento", icon: "🎉" },
    { label: "Personas", icon: "👥" },
    { label: "Alergias", icon: "⚠️" },
    { label: "Bebidas", icon: "🥂" },
    { label: "Platos", icon: "🍽️" },
    { label: "Estilo", icon: "👨‍🍳" },
  ];

  return (
    <AppLayout title="Menú para Eventos">
      <div className="vively-page max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🎉 Asistente de Eventos</h1>
          <p className="text-gray-500 text-sm mt-1">La IA te crea el menú perfecto para ser un anfitrión 10</p>
        </div>

        {/* Plan limit banner */}
        {isFree && (
          <div className={`mb-4 rounded-2xl p-4 border-2 ${eventLimitReached ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            {eventLimitReached ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-red-700">🔒 Has usado tu menú de evento gratuito</p>
                  <p className="text-sm text-red-600 mt-0.5">Actualiza a Pro para crear menús ilimitados para todos tus eventos</p>
                </div>
                <button onClick={() => navigate('/app/subscription')} className="shrink-0 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap">
                  Ver Pro →
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-amber-800">✨ Plan gratuito: 1 menú de evento al mes</p>
                  <p className="text-sm text-amber-700 mt-0.5">Usados: {eventMenusUsed}/{maxEventMenus} · Pro incluye menús ilimitados</p>
                </div>
                <button onClick={() => navigate('/app/subscription')} className="shrink-0 border border-amber-400 text-amber-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                  Mejorar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress bar (steps 0-5) */}
        {step < 6 && (
          <div className="mb-6">
            <div className="flex items-center gap-1 mb-3">
              {steps.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step ? "bg-orange-500 text-white" :
                    i === step ? "bg-orange-100 text-orange-600 ring-2 ring-orange-400" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {i < step ? "✓" : s.icon}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === step ? "text-orange-600 font-semibold" : "text-gray-400"}`}>{s.label}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 0: Tipo de evento ── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">¿Qué tipo de evento vas a celebrar?</h2>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2">
              {([
                { id: "todos",     label: "Todos",      emoji: "📌" },
                { id: "informal",  label: "Informal",   emoji: "🍻" },
                { id: "familiar", label: "Familiar",   emoji: "👨‍👩‍👧" },
                { id: "formal",   label: "Formal",     emoji: "🤺" },
                { id: "festivo",  label: "Festivo",    emoji: "🎊" },
                { id: "romántico",label: "Romántico",  emoji: "🕯️" },
              ] as { id: EventCategory; label: string; emoji: string }[]).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    activeCategory === cat.id
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {EVENT_TYPES.filter(e => activeCategory === "todos" || e.categories.includes(activeCategory)).map(e => (
                <button
                  key={e.id}
                  onClick={() => { setEventType(e.id); if (e.id !== "otro") setStep(1); }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    eventType === e.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-100 bg-white hover:border-orange-200"
                  }`}
                >
                  <div className="text-2xl mb-1">{e.emoji}</div>
                  <div className="font-semibold text-sm text-gray-800">{e.label}</div>
                  <div className="text-xs text-gray-400">{e.desc}</div>
                </button>
              ))}
            </div>
            {eventType === "otro" && (
              <div className="space-y-2">
                <input
                  className="vively-input w-full"
                  placeholder="Nombre de tu evento..."
                  value={eventName}
                  onChange={e => setEventName(e.target.value)}
                />
                <button
                  onClick={() => eventName.trim() && setStep(1)}
                  disabled={!eventName.trim()}
                  className="vively-btn-primary w-full py-3 rounded-2xl disabled:opacity-50"
                >
                  Continuar →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Número de personas ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">¿Cuántas personas vais a ser?</h2>
              <p className="text-gray-500 text-sm">Incluyendo anfitriones</p>
            </div>

            <div className="vively-card text-center py-8">
              <div className="text-6xl font-bold text-orange-500 mb-2">{persons}</div>
              <div className="text-gray-500 mb-6">personas</div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPersons(p => Math.max(1, p - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 transition-colors"
                >−</button>
                <input
                  type="range" min={1} max={200} value={persons}
                  onChange={e => setPersons(Number(e.target.value))}
                  className="w-40 accent-orange-500"
                />
                <button
                  onClick={() => setPersons(p => Math.min(200, p + 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 transition-colors"
                >+</button>
              </div>
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {[2, 4, 6, 8, 10, 15, 20, 30, 50].map(n => (
                  <button
                    key={n}
                    onClick={() => setPersons(n)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                      persons === n ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-orange-100"
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div
              onClick={() => setHasChildren(!hasChildren)}
              className={`vively-card flex items-center gap-3 cursor-pointer transition-all ${
                hasChildren ? "border-2 border-orange-400 bg-orange-50" : ""
              }`}
            >
              <span className="text-2xl">👶</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">¿Habrá niños?</div>
                <div className="text-xs text-gray-400">Incluiremos opciones para los más pequeños</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                hasChildren ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300"
              }`}>
                {hasChildren && "✓"}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold">← Atrás</button>
              <button onClick={() => setStep(2)} className="flex-1 vively-btn-primary py-3 rounded-2xl">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Intolerancias ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">¿Hay alguna intolerancia o alergia?</h2>
              <p className="text-gray-500 text-sm">Selecciona todas las que apliquen entre tus invitados</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTOLERANCES.map(i => (
                <button
                  key={i}
                  onClick={() => toggleIntolerance(i)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                    intolerances.includes(i)
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-red-300"
                  }`}
                >
                  {intolerances.includes(i) ? "✓ " : ""}{i}
                </button>
              ))}
            </div>

            {intolerances.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-3 text-sm text-red-700">
                ⚠️ El menú evitará: <strong>{intolerances.join(", ")}</strong>
              </div>
            )}

            {intolerances.length === 0 && (
              <div className="bg-green-50 rounded-2xl p-3 text-sm text-green-700">
                ✅ Sin restricciones — ¡podemos hacer el menú más completo!
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold">← Atrás</button>
              <button onClick={() => setStep(3)} className="flex-1 vively-btn-primary py-3 rounded-2xl">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Alcohol ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">¿Se servirá alcohol?</h2>
              <p className="text-gray-500 text-sm">Incluiremos maridajes y sugerencias de bebidas</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setServesAlcohol(true)}
                className={`p-5 rounded-2xl border-2 text-center transition-all ${
                  servesAlcohol ? "border-orange-500 bg-orange-50" : "border-gray-100 bg-white"
                }`}
              >
                <div className="text-3xl mb-2">🥂</div>
                <div className="font-bold text-sm">Sí, con alcohol</div>
                <div className="text-xs text-gray-400 mt-1">Vinos, cavas, cócteles...</div>
              </button>
              <button
                onClick={() => setServesAlcohol(false)}
                className={`p-5 rounded-2xl border-2 text-center transition-all ${
                  !servesAlcohol ? "border-orange-500 bg-orange-50" : "border-gray-100 bg-white"
                }`}
              >
                <div className="text-3xl mb-2">🍹</div>
                <div className="font-bold text-sm">Sin alcohol</div>
                <div className="text-xs text-gray-400 mt-1">Bebidas sin alcohol</div>
              </button>
            </div>

            {servesAlcohol && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">¿Qué tipo de bebidas?</p>
                <div className="flex flex-wrap gap-2">
                  {ALCOHOL_TYPES.map(a => (
                    <button
                      key={a}
                      onClick={() => toggleAlcohol(a)}
                      className={`px-3 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                        alcoholTypes.includes(a)
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold">← Atrás</button>
              <button onClick={() => setStep(4)} className="flex-1 vively-btn-primary py-3 rounded-2xl">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Platos ── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">¿Qué momentos quieres incluir?</h2>
              <p className="text-gray-500 text-sm">Selecciona los platos del menú</p>
            </div>

            <div className="space-y-3">
              {[
                { key: "aperitivo", label: "Aperitivo", emoji: "🫒", desc: "Tapas, pinchos, canapés" },
                { key: "primero", label: "Primer plato", emoji: "🥗", desc: "Ensalada, sopa, entrante" },
                { key: "segundo", label: "Segundo plato", emoji: "🥩", desc: "Carne, pescado, principal" },
                { key: "postre", label: "Postre", emoji: "🍮", desc: "Dulce, fruta, helado" },
                { key: "cafe", label: "Café y petit fours", emoji: "☕", desc: "Cierre del menú" },
              ].map(({ key, label, emoji, desc }) => (
                <div
                  key={key}
                  onClick={() => setCourses(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className={`vively-card flex items-center gap-3 cursor-pointer transition-all ${
                    courses[key as keyof typeof courses] ? "border-2 border-orange-400 bg-orange-50" : ""
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    courses[key as keyof typeof courses]
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-gray-300"
                  }`}>
                    {courses[key as keyof typeof courses] && "✓"}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold">← Atrás</button>
              <button onClick={() => setStep(5)} className="flex-1 vively-btn-primary py-3 rounded-2xl">Continuar →</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Estilo y preferencias ── */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Últimos detalles</h2>
              <p className="text-gray-500 text-sm">Para personalizar aún más tu menú</p>
            </div>

            {/* Estilo de cocina */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Estilo de cocina</p>
              <div className="grid grid-cols-3 gap-2">
                {CUISINE_STYLES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCuisineStyle(c.id)}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      cuisineStyle === c.id
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-100 bg-white text-gray-600 hover:border-orange-200"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presupuesto */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Presupuesto</p>
              <div className="grid grid-cols-3 gap-2">
                {BUDGETS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBudget(b.id)}
                    className={`py-3 px-2 rounded-xl text-center border-2 transition-all ${
                      budget === b.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-100 bg-white hover:border-orange-200"
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-800">{b.label}</div>
                    <div className="text-xs text-gray-400">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">¿Algo más que quieras añadir? (opcional)</p>
              <textarea
                className="vively-input w-full h-24 resize-none"
                placeholder="Ej: quiero que sea un menú ligero, que incluya un plato sorpresa, que tenga opciones veganas..."
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
              />
            </div>

            {/* Resumen */}
            <div className="bg-orange-50 rounded-2xl p-4 space-y-1 text-sm">
              <p className="font-bold text-orange-700 mb-2">📋 Resumen de tu evento</p>
              <p>🎉 <strong>{selectedEvent?.label || eventName}</strong></p>
              <p>👥 <strong>{persons} personas</strong>{hasChildren ? " (con niños)" : ""}</p>
              {intolerances.length > 0 && <p>⚠️ Sin: <strong>{intolerances.join(", ")}</strong></p>}
              <p>{servesAlcohol ? `🥂 Con alcohol: ${alcoholTypes.join(", ")}` : "🍹 Sin alcohol"}</p>
              <p>🍽️ {Object.entries(courses).filter(([,v]) => v).map(([k]) => k).join(", ")}</p>
              <p>👨‍🍳 Cocina {cuisineStyle} · Presupuesto {budget}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold">← Atrás</button>
              <button
                onClick={handleGenerate}
                className="flex-1 vively-btn-primary py-3 rounded-2xl font-bold text-base"
              >
                ✨ Generar menú
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Loading ── */}
        {step === 6 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
            <div className="relative w-24 h-24">
              <div className="w-24 h-24 border-4 border-orange-100 rounded-full" />
              <div className="absolute inset-0 w-24 h-24 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl">👨‍🍳</div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Creando tu menú perfecto...</h2>
              <p className="text-gray-500 text-sm">La IA está diseñando un menú a medida para {persons} personas</p>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>🍽️ Seleccionando los mejores platos...</p>
              <p>📝 Calculando cantidades para {persons} personas...</p>
              <p>🛒 Preparando la lista de la compra...</p>
              <p>💡 Añadiendo consejos de anfitrión...</p>
            </div>
          </div>
        )}

        {/* ── STEP 7: Resultado ── */}
        {step === 7 && generatedMenu && !generatedMenu.error && (
          <div className="space-y-5">
            {/* Header del menú */}
            <div className="vively-card bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide mb-1">
                    {selectedEvent?.emoji} {selectedEvent?.label || eventName}
                  </p>
                  <h2 className="text-xl font-bold">{generatedMenu.eventTitle}</h2>
                  <p className="text-orange-100 text-sm mt-2">{generatedMenu.intro}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-orange-400 flex flex-wrap gap-3 text-sm">
                <span>👥 {persons} personas</span>
                {generatedMenu.timeline && <span>🕐 {generatedMenu.timeline}</span>}
                {generatedMenu.estimatedBudget && <span>💰 {generatedMenu.estimatedBudget}</span>}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
              {[
                { id: "menu", label: "🍽️ Menú" },
                { id: "shopping", label: "🛒 Compra" },
                { id: "prep", label: "📅 Planificación" },
                { id: "tips", label: "💡 Consejos" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === t.id ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Menú */}
            {activeTab === "menu" && (
              <div className="space-y-4">
                {generatedMenu.courses?.map((course, ci) => (
                  <div key={ci} className="vively-card">
                    <button
                      className="w-full flex items-center gap-3 text-left"
                      onClick={() => setExpandedCourse(expandedCourse === course.name ? null : course.name)}
                    >
                      <span className="text-2xl">{course.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{course.name}</h3>
                        {course.description && <p className="text-xs text-gray-400">{course.description}</p>}
                      </div>
                      <span className="text-gray-400">{expandedCourse === course.name ? "▲" : "▼"}</span>
                    </button>

                    {expandedCourse === course.name && (
                      <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                        {course.dishes?.map((dish, di) => (
                          <div key={di} className="bg-gray-50 rounded-2xl p-4">
                            <button
                              className="w-full flex items-start justify-between gap-2 text-left"
                              onClick={() => {
                                const key = `${ci}-${di}`;
                                setExpandedDish(expandedDish === key ? null : key);
                              }}
                            >
                              <div className="flex-1">
                                <h4 className="font-bold text-sm text-gray-800">{dish.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{dish.description}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {dish.prepTime && (
                                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500">⏱ {dish.prepTime}</span>
                                  )}
                                  {dish.difficulty && (
                                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500">📊 {{ easy: "Fácil", facil: "Fácil", medium: "Media", medio: "Media", hard: "Difícil", dificil: "Difícil" }[dish.difficulty] ?? dish.difficulty}</span>
                                  )}
                                  {dish.canPrepAhead && (
                                    <span className="text-xs bg-green-100 px-2 py-0.5 rounded-full text-green-700">✓ Preparar antes</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-gray-400 text-sm">{expandedDish === `${ci}-${di}` ? "▲" : "▼"}</span>
                            </button>

                            {expandedDish === `${ci}-${di}` && (
                              <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                                {dish.servingTip && (
                                  <div className="bg-amber-50 rounded-xl p-3">
                                    <p className="text-xs font-semibold text-amber-700 mb-1">💡 Consejo de presentación</p>
                                    <p className="text-xs text-amber-800">{dish.servingTip}</p>
                                  </div>
                                )}
                                {dish.ingredients && dish.ingredients.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-600 mb-2">🧾 Ingredientes ({persons} personas)</p>
                                    <ul className="space-y-1">
                                      {dish.ingredients.map((ing, ii) => (
                                        <li key={ii} className="text-xs text-gray-600 flex items-start gap-1">
                                          <span className="text-orange-400 mt-0.5">•</span> {ing}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {dish.steps && dish.steps.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-600 mb-2">👨‍🍳 Elaboración</p>
                                    <ol className="space-y-2">
                                      {dish.steps.map((step, si) => (
                                        <li key={si} className="text-xs text-gray-600 flex items-start gap-2">
                                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">{si + 1}</span>
                                          {step}
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Bebidas */}
                {generatedMenu.drinks && (
                  <div className="vively-card">
                    <h3 className="font-bold text-gray-800 mb-3">🥤 Bebidas</h3>
                    {generatedMenu.drinks.nonAlcoholic?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Sin alcohol</p>
                        <div className="flex flex-wrap gap-2">
                          {generatedMenu.drinks.nonAlcoholic.map((d, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {generatedMenu.drinks.alcoholic && generatedMenu.drinks.alcoholic.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Con alcohol</p>
                        <div className="flex flex-wrap gap-2">
                          {generatedMenu.drinks.alcoholic.map((d, i) => (
                            <span key={i} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Lista de la compra */}
            {activeTab === "shopping" && (
              <div className="space-y-3">
                {generatedMenu.shoppingList?.map((cat, ci) => (
                  cat.items?.length > 0 && (
                    <div key={ci} className="vively-card">
                      <h3 className="font-bold text-sm text-gray-800 mb-3">{cat.category}</h3>
                      <ul className="space-y-2">
                        {cat.items.map((item, ii) => (
                          <li key={ii} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-orange-400 mt-0.5">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
                <button
                  onClick={() => {
                    const text = generatedMenu.shoppingList
                      ?.map(cat => `${cat.category}:\n${cat.items.map(i => `  - ${i}`).join("\n")}`)
                      .join("\n\n") || "";
                    navigator.clipboard.writeText(text);
                    toast.success("Lista de la compra copiada al portapapeles");
                  }}
                  className="w-full py-3 rounded-2xl border-2 border-orange-300 text-orange-600 font-bold text-sm hover:bg-orange-50 transition-colors"
                >
                  📋 Copiar lista de la compra
                </button>
              </div>
            )}

            {/* Tab: Planificación */}
            {activeTab === "prep" && (
              <div className="space-y-3">
                {generatedMenu.prepSchedule?.map((p, pi) => (
                  <div key={pi} className="vively-card">
                    <h3 className="font-bold text-sm text-orange-600 mb-3">📅 {p.when}</h3>
                    <ul className="space-y-2">
                      {p.tasks?.map((task, ti) => (
                        <li key={ti} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">{ti + 1}</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {(!generatedMenu.prepSchedule || generatedMenu.prepSchedule.length === 0) && (
                  <div className="text-center text-gray-400 py-8">No hay planificación disponible</div>
                )}
              </div>
            )}

            {/* Tab: Consejos */}
            {activeTab === "tips" && (
              <div className="space-y-3">
                {generatedMenu.hostingTips?.map((tip, ti) => (
                  <div key={ti} className="vively-card flex gap-3">
                    <span className="text-2xl flex-shrink-0">💡</span>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveEvent}
                disabled={saveEvent.isPending}
                className="flex-1 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                {saveEvent.isPending ? "⏳ Guardando..." : "⭐ Guardar evento"}
              </button>
              <button
                onClick={() => {
                  setStep(0);
                  setGeneratedMenu(null);
                  setEventType("");
                  setEventName("");
                  setIntolerances([]);
                  setAlcoholTypes(["Vino tinto", "Vino blanco", "Cava / Champán"]);
                  setExtraNotes("");
                }}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                🔄 Planificar otro
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {step === 7 && generatedMenu?.error && (
          <div className="text-center py-12 space-y-4">
            <span className="text-5xl">😕</span>
            <h2 className="text-xl font-bold text-gray-800">No se pudo generar el menú</h2>
            <p className="text-gray-500 text-sm">{generatedMenu.error}</p>
            <button onClick={() => setStep(5)} className="vively-btn-primary px-6 py-3 rounded-2xl">
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
