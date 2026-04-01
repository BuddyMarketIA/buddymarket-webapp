import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type GoalType = "perdida_peso" | "ganancia_muscular" | "mantenimiento" | "definicion";

const GOALS: { id: GoalType; label: string; emoji: string; desc: string }[] = [
  { id: "perdida_peso", label: "Pérdida de peso", emoji: "🔥", desc: "Déficit calórico controlado" },
  { id: "ganancia_muscular", label: "Ganancia muscular", emoji: "💪", desc: "Superávit calórico + proteína" },
  { id: "mantenimiento", label: "Mantenimiento", emoji: "⚖️", desc: "Equilibrio calórico" },
  { id: "definicion", label: "Definición", emoji: "⚡", desc: "Mantener músculo, perder grasa" },
];

const RESTRICTIONS = [
  "Sin gluten", "Sin lactosa", "Vegano", "Vegetariano", "Sin frutos secos",
  "Sin mariscos", "Sin huevos", "Halal", "Kosher",
];

const SUGGESTED_PROMPTS = [
  "¿Qué debo comer antes y después de entrenar?",
  "Crea un menú semanal de 2000 kcal para perder peso",
  "¿Cuánta proteína necesito al día para ganar músculo?",
  "Recetas rápidas y saludables para la cena",
  "¿Qué alimentos me ayudan a reducir la inflamación?",
  "Explícame qué son los macronutrientes",
  "¿Cómo puedo comer sano con poco presupuesto?",
  "Menú vegano de 1800 kcal para una semana",
];

// ─── Weekly menu display ──────────────────────────────────────────────────────

function WeeklyMenuDisplay({ menu }: { menu: any }) {
  const [activeDay, setActiveDay] = useState(0);

  if (!menu?.days?.length) return null;

  const day = menu.days[activeDay];

  return (
    <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
        <h3 className="text-white font-bold text-sm">🗓️ Tu menú semanal personalizado</h3>
        <p className="text-white/80 text-xs mt-0.5">Generado por BuddyIA</p>
      </div>

      {/* Day selector */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-orange-100">
        {menu.days.map((d: any, i: number) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-semibold transition-colors ${
              activeDay === i
                ? "border-b-2 border-orange-500 text-orange-600 bg-orange-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {d.day?.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Day meals */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-gray-900 text-sm">{day.day}</p>
          <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
            {day.totalCalories} kcal
          </span>
        </div>
        {day.meals?.map((meal: any, j: number) => (
          <div key={j} className="bg-orange-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-orange-700">{meal.name}</p>
              <span className="text-xs text-gray-500">{meal.calories} kcal</span>
            </div>
            <p className="text-xs text-gray-600">{meal.food}</p>
            {(meal.protein || meal.carbs || meal.fat) && (
              <div className="flex gap-3 mt-1.5">
                {meal.protein && <span className="text-xs text-blue-600">P: {meal.protein}g</span>}
                {meal.carbs && <span className="text-xs text-orange-600">C: {meal.carbs}g</span>}
                {meal.fat && <span className="text-xs text-yellow-600">G: {meal.fat}g</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => toast.success("Menú guardado en tu planificador")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          📋 Guardar menú en mi planificador
        </button>
      </div>
    </div>
  );
}

// ─── Menu generator form ──────────────────────────────────────────────────────

function MenuGenerator({ onMenuGenerated }: { onMenuGenerated: (menu: any) => void }) {
  const [calories, setCalories] = useState(2000);
  const [goal, setGoal] = useState<GoalType>("mantenimiento");
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [preferences, setPreferences] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const generateMutation = trpc.buddyIA.generateWeeklyMenu.useMutation({
    onSuccess: (data) => {
      if (data.menu) {
        onMenuGenerated(data.menu);
        setIsOpen(false);
        toast.success("Menú semanal generado correctamente");
      } else {
        toast.error("Error al generar el menú. Inténtalo de nuevo.");
      }
    },
    onError: () => toast.error("Error al generar el menú"),
  });

  const toggleRestriction = (r: string) => {
    setSelectedRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-2xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <span>🗓️</span>
        <span>Generar menú semanal personalizado</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-100 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm">Configurar menú semanal</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>

      {/* Calories */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 block">
          Calorías diarias: <span className="text-orange-600">{calories} kcal</span>
        </label>
        <input
          type="range"
          min={1200}
          max={4000}
          step={50}
          value={calories}
          onChange={(e) => setCalories(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1200</span>
          <span>4000</span>
        </div>
      </div>

      {/* Goal */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 block">Objetivo</label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                goal === g.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-orange-300"
              }`}
            >
              <span className="text-lg">{g.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{g.label}</p>
                <p className="text-xs text-gray-500">{g.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Restrictions */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 block">Restricciones alimentarias</label>
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map((r) => (
            <button
              key={r}
              onClick={() => toggleRestriction(r)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                selectedRestrictions.includes(r)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-2 block">Preferencias adicionales (opcional)</label>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="Ej: Me gusta la cocina mediterránea, no me gustan las legumbres..."
          className="w-full text-xs border border-gray-200 rounded-xl p-3 resize-none h-16 focus:outline-none focus:border-orange-400"
        />
      </div>

      <button
        onClick={() => generateMutation.mutate({ calories, goal, restrictions: selectedRestrictions, preferences: preferences || undefined })}
        disabled={generateMutation.isPending}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {generateMutation.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Generando menú...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Generar menú semanal</span>
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BuddyIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMenu, setGeneratedMenu] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<"chat" | "menu">("chat");

  const chatMutation = trpc.buddyIA.chat.useMutation({
    onSuccess: (data) => {
      const content = typeof data.content === "string" ? data.content : String(data.content);
      setMessages((prev) => [
        ...prev,
        { role: "assistant" as const, content },
      ]);
      setIsLoading(false);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, hubo un error al procesar tu consulta. Por favor, inténtalo de nuevo." },
      ]);
      setIsLoading(false);
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setIsLoading(true);
    chatMutation.mutate({ messages: newMessages });
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-4 pt-4 pb-3 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">BuddyIA</h1>
            <p className="text-xs text-gray-500">Tu asistente nutricional inteligente</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-lg shadow-md">
            🤖
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1">
          {[
            { id: "chat" as const, label: "Chat nutricional", icon: "💬" },
            { id: "menu" as const, label: "Generador de menús", icon: "🗓️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                activeSection === tab.id
                  ? "bg-orange-500 text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {activeSection === "chat" ? (
          <>
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
              <div className="relative z-10">
                <p className="text-xs font-semibold opacity-80 mb-1">🤖 Inteligencia artificial</p>
                <h2 className="text-lg font-bold mb-1">Tu nutricionista virtual</h2>
                <p className="text-xs opacity-80">Pregúntame sobre nutrición, recetas, macros, menús semanales o cualquier duda sobre alimentación saludable.</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-20">🤖</div>
            </div>

            {/* Quick topics */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "🥗", label: "Menús semanales", prompt: "Crea un menú semanal de 2000 kcal equilibrado" },
                { icon: "💪", label: "Ganar músculo", prompt: "¿Qué debo comer para ganar músculo?" },
                { icon: "🔥", label: "Perder peso", prompt: "Dame un plan de alimentación para perder peso" },
                { icon: "🧪", label: "Macros", prompt: "Explícame cómo calcular mis macronutrientes" },
              ].map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSection("chat");
                    handleSendMessage(topic.prompt);
                  }}
                  className="flex items-center gap-2 bg-white border border-orange-100 rounded-2xl p-3 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                >
                  <span className="text-xl">{topic.icon}</span>
                  <span className="text-xs font-semibold text-gray-700">{topic.label}</span>
                </button>
              ))}
            </div>

            {/* Chat */}
            <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
              <AIChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                placeholder="Pregúntame sobre nutrición, recetas, macros..."
                height={480}
                emptyStateMessage="¡Hola! Soy BuddyIA, tu asistente nutricional. Puedo ayudarte con menús semanales, recetas saludables, cálculo de calorías y mucho más. ¿En qué puedo ayudarte hoy?"
                suggestedPrompts={SUGGESTED_PROMPTS}
              />
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
              ⚠️ BuddyIA es un asistente informativo. No sustituye el consejo de un nutricionista o médico profesional. Consulta siempre con un especialista antes de realizar cambios significativos en tu dieta.
            </p>
          </>
        ) : (
          <>
            {/* Menu generator hero */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 to-teal-600 p-4 text-white">
              <p className="text-xs font-semibold opacity-80 mb-1">✨ Generado por IA</p>
              <h2 className="text-lg font-bold mb-1">Menú semanal personalizado</h2>
              <p className="text-xs opacity-80">Configura tus calorías, objetivo y restricciones alimentarias. BuddyIA generará un menú completo de 7 días adaptado a ti.</p>
            </div>

            {/* Generator form */}
            <MenuGenerator onMenuGenerated={setGeneratedMenu} />

            {/* Generated menu */}
            {generatedMenu && <WeeklyMenuDisplay menu={generatedMenu} />}

            {/* Features */}
            <div className="bg-white rounded-2xl p-4 border border-orange-100">
              <h3 className="font-bold text-gray-900 text-sm mb-3">¿Qué incluye el menú generado?</h3>
              <div className="space-y-2">
                {[
                  { icon: "🍽️", text: "5 comidas al día: desayuno, media mañana, comida, merienda y cena" },
                  { icon: "🔢", text: "Información nutricional detallada: calorías, proteínas, carbohidratos y grasas" },
                  { icon: "🎯", text: "Adaptado a tu objetivo: pérdida de peso, ganancia muscular, mantenimiento o definición" },
                  { icon: "🚫", text: "Respeta tus restricciones alimentarias y preferencias personales" },
                  { icon: "📋", text: "Guardable en tu planificador semanal con un solo clic" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-sm flex-shrink-0">{item.icon}</span>
                    <p className="text-xs text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
              ⚠️ Los menús generados por IA son orientativos. Consulta con un nutricionista para un plan personalizado y supervisado.
            </p>
          </>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
