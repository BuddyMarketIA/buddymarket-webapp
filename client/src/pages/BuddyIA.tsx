import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeGate } from "@/components/UpgradeGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
type GoalType = "perdida_peso" | "ganancia_muscular" | "tonificacion" | "perdida_grasa" | "mantenimiento" | "definicion" | "salud";
type CookingStyle = "batch_cooking" | "tuppers" | "rapido" | "trabajo" | "restaurante" | "mixto";
type AppMode = "home" | "chat" | "questionnaire" | "menu_result";

interface QuestionnaireData {
  startDate: string;
  cookingStyle: CookingStyle;
  persons: number;
  mealsPerDay: number;
  goal: GoalType;
  calories?: number;
  restrictions: string[];
  preferences: string;
  daysCount: number;
  eatOutDays: string[];
  dislikedFoods: string;
  budgetPerWeek?: number;
}

interface GeneratedMeal {
  name: string;
  food: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  prepTime?: string;
  ingredients?: string[];
}

interface GeneratedDay {
  day: string;
  date?: string;
  totalCalories?: number;
  meals: GeneratedMeal[];
}

interface GeneratedMenu {
  menuName: string;
  targetCalories: number;
  persons: number;
  cookingTips?: string;
  shoppingListSummary?: string;
  days: GeneratedDay[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GOALS: { id: GoalType; label: string; emoji: string; desc: string }[] = [
  { id: "perdida_peso", label: "Pérdida de peso", emoji: "🔥", desc: "Déficit calórico controlado" },
  { id: "ganancia_muscular", label: "Ganancia muscular", emoji: "💪", desc: "Superávit calórico + proteína" },
  { id: "tonificacion", label: "Tonificación", emoji: "⚡", desc: "Músculo definido y firme" },
  { id: "perdida_grasa", label: "Pérdida de grasa", emoji: "🎯", desc: "Reducir % grasa corporal" },
  { id: "mantenimiento", label: "Mantenimiento", emoji: "⚖️", desc: "Equilibrio calórico" },
  { id: "definicion", label: "Definición", emoji: "🏆", desc: "Mantener músculo, perder grasa" },
  { id: "salud", label: "Salud general", emoji: "💚", desc: "Bienestar y energía diaria" },
];

const COOKING_STYLES: { id: CookingStyle; label: string; emoji: string; desc: string }[] = [
  { id: "batch_cooking", label: "Batch Cooking", emoji: "🍳", desc: "Cocino todo el domingo para la semana" },
  { id: "tuppers", label: "Tuppers al trabajo", emoji: "🥡", desc: "Preparo tuppers para llevar" },
  { id: "rapido", label: "Comidas rápidas", emoji: "⚡", desc: "Menos de 20 minutos de preparación" },
  { id: "trabajo", label: "Mucho tiempo en el trabajo", emoji: "💼", desc: "Poco tiempo para cocinar entre semana" },
  { id: "restaurante", label: "Como fuera de casa", emoji: "🍽️", desc: "Restaurantes o menús del día" },
  { id: "mixto", label: "Combinado", emoji: "🔄", desc: "Mezcla de cocina en casa y fuera" },
];

const RESTRICTIONS = [
  "Sin gluten", "Sin lactosa", "Vegano", "Vegetariano", "Sin frutos secos",
  "Sin mariscos", "Sin huevos", "Sin cerdo", "Halal", "Kosher",
];

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const COMMON_DISLIKES = [
  "Hígado", "Morcilla", "Sardinas", "Anchoas", "Cebolla cruda", "Pimiento",
  "Berenjena", "Coliflor", "Brócoli", "Espinacas", "Remolacha", "Tofu",
  "Cilantro", "Picante", "Vinagre", "Mostaza",
];

const SUGGESTED_PROMPTS = [
  "¿Qué debo comer antes y después de entrenar?",
  "¿Cuánta proteína necesito al día para ganar músculo?",
  "Recetas rápidas y saludables para la cena",
  "¿Qué alimentos me ayudan a reducir la inflamación?",
  "¿Cómo puedo comer sano con poco presupuesto?",
  "Explícame qué son los macronutrientes",
];

// ─── Chat View ────────────────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "assistant"; content: string; }

function ChatView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");

  const chatMutation = trpc.buddyIA.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.content as string }]);
    },
    onError: () => toast.error("Error al conectar con BuddyIA"),
  });

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const newMessages: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({ messages: newMessages });
  }, [messages, chatMutation]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Volver</button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">B</div>
          <div>
            <p className="font-semibold text-sm">BuddyIA</p>
            <p className="text-xs text-muted-foreground">Asistente nutricional</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl mx-auto mb-3">🤖</div>
              <p className="font-semibold">Hola, soy BuddyIA</p>
              <p className="text-sm text-muted-foreground mt-1">¿En qué puedo ayudarte hoy?</p>
            </div>
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="w-full text-left text-sm px-4 py-3 rounded-xl border border-border hover:border-orange-300 hover:bg-orange-50 transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">B</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "bg-orange-500 text-white rounded-tr-sm"
                : "bg-card border border-border rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1">B</div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Escribe tu pregunta..."
            className="resize-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <Button onClick={() => sendMessage(input)} disabled={!input.trim() || chatMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white self-end">
            ➤
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          BuddyIA no sustituye el consejo de un profesional de la salud
        </p>
      </div>
    </div>
  );
}

// ─── Questionnaire View ───────────────────────────────────────────────────────
function QuestionnaireView({
  onBack,
  onMenuGenerated,
  onDataChange,
}: {
  onBack: () => void;
  onMenuGenerated: (menu: GeneratedMenu, data: Partial<QuestionnaireData>) => void;
  onDataChange: (data: Partial<QuestionnaireData>) => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<QuestionnaireData>>({
    startDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    persons: 1,
    mealsPerDay: 5,
    daysCount: 7,
    restrictions: [],
    preferences: "",
    eatOutDays: [],
    dislikedFoods: "",
    budgetPerWeek: undefined,
  });
  const [dislikedInput, setDislikedInput] = useState("");

  const updateData = (updates: Partial<QuestionnaireData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onDataChange(newData);
  };

  const toggleEatOutDay = (day: string) => {
    const current = data.eatOutDays || [];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    updateData({ eatOutDays: updated });
  };

  const toggleDislike = (food: string) => {
    const current = (data.dislikedFoods || "").split(",").map(s => s.trim()).filter(Boolean);
    const updated = current.includes(food) ? current.filter(f => f !== food) : [...current, food];
    updateData({ dislikedFoods: updated.join(", ") });
  };

  const addCustomDislike = () => {
    if (!dislikedInput.trim()) return;
    const current = (data.dislikedFoods || "").split(",").map(s => s.trim()).filter(Boolean);
    if (!current.includes(dislikedInput.trim())) {
      updateData({ dislikedFoods: [...current, dislikedInput.trim()].join(", ") });
    }
    setDislikedInput("");
  };

  const generateMutation = trpc.buddyIA.generateMenuWithQuestionnaire.useMutation({
    onSuccess: (result) => {
      if (result.menu) {
        onMenuGenerated(result.menu as GeneratedMenu, data);
      } else {
        toast.error((result as any).error || "Error al generar el menú");
      }
    },
    onError: () => toast.error("Error al generar el menú. Inténtalo de nuevo."),
  });

  // 9 steps total
  const steps = [
    { title: "¿Cuándo empieza tu menú?", subtitle: "Elige la fecha de inicio y duración" },
    { title: "¿Cuál es tu objetivo?", subtitle: "Personalizamos las calorías y macros para ti" },
    { title: "¿Cómo vas a cocinar esta semana?", subtitle: "Tu estilo de vida determina el tipo de recetas" },
    { title: "¿Para cuántas personas?", subtitle: "Ajustamos las cantidades de la lista de la compra" },
    { title: "¿Cuántas comidas al día?", subtitle: "Distribuimos las calorías según tus hábitos" },
    { title: "¿Qué días comes fuera de casa?", subtitle: "Para esos días te proponemos opciones de restaurante" },
    { title: "¿Hay alimentos que no te gusten?", subtitle: "Opcional — los excluimos del menú" },
    { title: "¿Tienes restricciones alimentarias?", subtitle: "Opcional — excluimos lo que no puedes comer" },
    { title: "Últimos detalles", subtitle: "Presupuesto y preferencias adicionales" },
  ];

  const canProceed = () => {
    if (step === 0) return !!data.startDate;
    if (step === 1) return !!data.goal;
    if (step === 2) return !!data.cookingStyle;
    if (step === 3) return !!data.persons && data.persons >= 1;
    if (step === 4) return !!data.mealsPerDay;
    return true;
  };

  const handleGenerate = () => {
    if (!data.startDate || !data.cookingStyle || !data.persons || !data.mealsPerDay || !data.goal) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    generateMutation.mutate({
      startDate: data.startDate!,
      cookingStyle: data.cookingStyle!,
      persons: data.persons!,
      mealsPerDay: data.mealsPerDay!,
      goal: data.goal!,
      calories: data.calories,
      restrictions: data.restrictions || [],
      preferences: data.preferences || "",
      daysCount: data.daysCount || 7,
      eatOutDays: data.eatOutDays || [],
      dislikedFoods: data.dislikedFoods || "",
      budgetPerWeek: data.budgetPerWeek,
    });
  };

  const dislikedList = (data.dislikedFoods || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Volver</button>
        <div>
          <p className="font-semibold text-sm">Crear menú personalizado</p>
          <p className="text-xs text-muted-foreground">Paso {step + 1} de {steps.length}</p>
        </div>
      </div>

      <div className="h-1 bg-muted">
        <div className="h-1 bg-orange-500 transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-5">
          <h2 className="text-lg font-bold">{steps[step].title}</h2>
          <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
        </div>

        {/* Step 0: Date & duration */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fecha de inicio</label>
              <input type="date" value={data.startDate || ""} min={new Date().toISOString().split("T")[0]}
                onChange={(e) => updateData({ startDate: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">¿Cuántos días?</label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 7].map(d => (
                  <button key={d} onClick={() => updateData({ daysCount: d })}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${data.daysCount === d ? "bg-orange-500 text-white border-orange-500" : "border-border hover:border-orange-300"}`}>
                    {d} días
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="space-y-3">
            {GOALS.map(goal => (
              <button key={goal.id} onClick={() => updateData({ goal: goal.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  data.goal === goal.id ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                }`}>
                <span className="text-2xl">{goal.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{goal.label}</p>
                  <p className="text-xs text-muted-foreground">{goal.desc}</p>
                </div>
                {data.goal === goal.id && <span className="text-orange-500 font-bold">✓</span>}
              </button>
            ))}
            <div className="mt-2">
              <label className="text-sm font-medium mb-2 block">Calorías diarias objetivo (opcional)</label>
              <input type="number" value={data.calories || ""} min={1000} max={5000}
                onChange={(e) => updateData({ calories: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Ej: 2000 kcal (si lo dejas vacío, lo calculamos)"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        )}

        {/* Step 2: Cooking style */}
        {step === 2 && (
          <div className="space-y-3">
            {COOKING_STYLES.map(style => (
              <button key={style.id} onClick={() => updateData({ cookingStyle: style.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  data.cookingStyle === style.id ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                }`}>
                <span className="text-2xl">{style.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{style.label}</p>
                  <p className="text-xs text-muted-foreground">{style.desc}</p>
                </div>
                {data.cookingStyle === style.id && <span className="text-orange-500 font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Persons */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-6 py-4">
              <button onClick={() => updateData({ persons: Math.max(1, (data.persons || 1) - 1) })}
                className="w-14 h-14 rounded-full border-2 border-orange-500 text-orange-500 text-2xl font-bold hover:bg-orange-50 transition-colors">−</button>
              <div className="text-center">
                <span className="text-6xl font-bold text-orange-500">{data.persons || 1}</span>
                <p className="text-sm text-muted-foreground mt-1">{(data.persons || 1) === 1 ? "persona" : "personas"}</p>
              </div>
              <button onClick={() => updateData({ persons: Math.min(20, (data.persons || 1) + 1) })}
                className="w-14 h-14 rounded-full border-2 border-orange-500 text-orange-500 text-2xl font-bold hover:bg-orange-50 transition-colors">+</button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Las cantidades de la lista de la compra se multiplicarán × {data.persons || 1}
            </p>
          </div>
        )}

        {/* Step 4: Meals per day */}
        {step === 4 && (
          <div className="space-y-3">
            {[
              { n: 2, label: "2 comidas", desc: "Desayuno + Cena (ayuno intermitente)" },
              { n: 3, label: "3 comidas", desc: "Desayuno + Comida + Cena" },
              { n: 4, label: "4 comidas", desc: "Desayuno + Comida + Merienda + Cena" },
              { n: 5, label: "5 comidas", desc: "Desayuno + Media mañana + Comida + Merienda + Cena" },
              { n: 6, label: "6 comidas", desc: "5 comidas + Recena (deportistas)" },
            ].map(opt => (
              <button key={opt.n} onClick={() => updateData({ mealsPerDay: opt.n })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  data.mealsPerDay === opt.n ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                }`}>
                <span className="text-2xl font-bold text-orange-500 w-8 text-center">{opt.n}</span>
                <div>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {data.mealsPerDay === opt.n && <span className="ml-auto text-orange-500 font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 5: Eat out days */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para los días que marques, la IA propondrá opciones de restaurante o menú del día saludable en lugar de recetas para cocinar.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button key={day}
                  onClick={() => toggleEatOutDay(day)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    (data.eatOutDays || []).includes(day)
                      ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500"
                      : "border-border hover:border-orange-300"
                  }`}>
                  <span className="text-lg">🍽️</span>
                  <span className="text-sm font-medium">{day}</span>
                  {(data.eatOutDays || []).includes(day) && <span className="ml-auto text-orange-500 text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
            {(data.eatOutDays || []).length > 0 ? (
              <p className="text-sm text-orange-600 font-medium">
                🍽️ Comes fuera: {(data.eatOutDays || []).join(", ")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Si no marcas ningún día, todos los días serán con recetas para cocinar en casa.</p>
            )}
          </div>
        )}

        {/* Step 6: Disliked foods */}
        {step === 6 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona o escribe los alimentos que no te gustan. La IA los evitará al crear tu menú.
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_DISLIKES.map(food => (
                <button key={food}
                  onClick={() => toggleDislike(food)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    dislikedList.includes(food)
                      ? "bg-red-100 text-red-700 border-red-300"
                      : "border-border hover:border-red-300 hover:bg-red-50"
                  }`}>
                  {dislikedList.includes(food) ? "✕ " : ""}{food}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={dislikedInput}
                onChange={(e) => setDislikedInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomDislike(); } }}
                placeholder="Añadir otro alimento..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button onClick={addCustomDislike} variant="outline" className="px-3">
                +
              </Button>
            </div>
            {dislikedList.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">No me gustan:</p>
                <div className="flex flex-wrap gap-1.5">
                  {dislikedList.map(food => (
                    <span key={food}
                      onClick={() => toggleDislike(food)}
                      className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium cursor-pointer hover:bg-red-200 transition-colors">
                      {food} ✕
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Si no tienes alimentos que no te gusten, puedes saltar este paso.</p>
          </div>
        )}

        {/* Step 7: Restrictions */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {RESTRICTIONS.map(r => (
                <button key={r}
                  onClick={() => updateData({ restrictions: data.restrictions?.includes(r) ? data.restrictions.filter(x => x !== r) : [...(data.restrictions || []), r] })}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    data.restrictions?.includes(r) ? "bg-orange-500 text-white border-orange-500" : "border-border hover:border-orange-300"
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            {data.restrictions && data.restrictions.length > 0 && (
              <p className="text-sm text-muted-foreground">Seleccionadas: {data.restrictions.join(", ")}</p>
            )}
            <p className="text-xs text-muted-foreground">Si no tienes restricciones, puedes saltar este paso</p>
          </div>
        )}

        {/* Step 8: Budget & preferences + summary */}
        {step === 8 && (
          <div className="space-y-4">
            {/* Budget */}
            <div>
              <label className="text-sm font-medium mb-2 block">💶 Presupuesto semanal (opcional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={data.budgetPerWeek || ""}
                  min={20}
                  max={500}
                  onChange={(e) => updateData({ budgetPerWeek: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Ej: 80"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-muted-foreground">€/semana</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[40, 60, 80, 120].map(b => (
                  <button key={b} onClick={() => updateData({ budgetPerWeek: b })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                      data.budgetPerWeek === b ? "bg-orange-500 text-white border-orange-500" : "border-border hover:border-orange-300"
                    }`}>
                    {b}€
                  </button>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label className="text-sm font-medium mb-2 block">💬 Preferencias adicionales (opcional)</label>
              <Textarea value={data.preferences || ""}
                onChange={(e) => updateData({ preferences: e.target.value })}
                placeholder="Ej: Me gusta la cocina mediterránea, no me gusta el picante, prefiero recetas sencillas..."
                className="min-h-[80px] resize-none" />
            </div>

            {/* Summary */}
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">📋 Resumen de tu menú:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>📅 Inicio: {data.startDate} · {data.daysCount} días</p>
                <p>🎯 Objetivo: {GOALS.find(g => g.id === data.goal)?.label}</p>
                <p>🍳 Estilo: {COOKING_STYLES.find(c => c.id === data.cookingStyle)?.label}</p>
                <p>👥 Personas: {data.persons}</p>
                <p>🍽️ Comidas/día: {data.mealsPerDay}</p>
                {(data.eatOutDays || []).length > 0 && <p>🍽️ Fuera de casa: {(data.eatOutDays || []).join(", ")}</p>}
                {dislikedList.length > 0 && <p>🚫 No me gustan: {dislikedList.slice(0, 4).join(", ")}{dislikedList.length > 4 ? ` +${dislikedList.length - 4}` : ""}</p>}
                {data.calories && <p>🔥 Calorías: {data.calories} kcal/día</p>}
                {data.budgetPerWeek && <p>💶 Presupuesto: {data.budgetPerWeek}€/semana</p>}
                {data.restrictions?.length ? <p>⚠️ Sin: {data.restrictions.join(", ")}</p> : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">← Anterior</Button>
          )}
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              Siguiente →
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              {generateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando menú...
                </span>
              ) : "✨ Generar mi menú"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Menu Result View ─────────────────────────────────────────────────────────
function MenuResultView({
  menu,
  questionnaireData,
  onBack,
  onSaved,
}: {
  menu: GeneratedMenu;
  questionnaireData: Partial<QuestionnaireData>;
  onBack: () => void;
  onSaved: (menuId: number) => void;
}) {
  const [, navigate] = useLocation();
  const [activeDay, setActiveDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedMenuId, setSavedMenuId] = useState<number | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [applyDate, setApplyDate] = useState(() => questionnaireData.startDate || new Date().toISOString().split("T")[0]);
  const [applying, setApplying] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const utils = trpc.useUtils();

  const applyToCalendarMutation = trpc.menus.applyToCalendar.useMutation({
    onSuccess: (data) => {
      setApplying(false);
      utils.mealLogs.list.invalidate();
      toast.success(`✅ ${data.logsCreated} comidas añadidas al diario desde ${applyDate}`);
    },
    onError: () => {
      setApplying(false);
      toast.error("Error al aplicar el menú al diario.");
    },
  });

  const handleApplyToCalendar = () => {
    if (!savedMenuId) return;
    setApplying(true);
    applyToCalendarMutation.mutate({ menuId: savedMenuId, startDate: applyDate, overwrite: false });
  };

  const generateListMutation = trpc.shoppingLists.generateFromMenu.useMutation({
    onSuccess: () => {
      setCreatingList(false);
      utils.shoppingLists.list.invalidate();
      toast.success("🛒 Lista de la compra creada y lista para revisar");
    },
    onError: () => {
      setCreatingList(false);
      toast.error("No se pudo crear la lista. Inténtalo desde Lista de la Compra.");
    },
  });

  const saveMutation = trpc.buddyIA.saveGeneratedMenu.useMutation({
    onSuccess: (data) => {
      setSaved(true);
      setSavedMenuId(data.menuId);
      setShowSaveModal(true);
      toast.success("¡Menú guardado en Mis Menús!");
      onSaved(data.menuId);
      utils.menus.list.invalidate();
    },
    onError: () => toast.error("Error al guardar el menú. Asegúrate de estar conectado."),
  });

  const handleCreateShoppingList = () => {
    if (!savedMenuId) return;
    setCreatingList(true);
    generateListMutation.mutate({
      menuId: savedMenuId,
      persons: menu.persons || questionnaireData.persons || 1,
      supermarket: "general",
      name: `Lista: ${menu.menuName}`,
    });
  };

  const handleSave = () => {
    saveMutation.mutate({
      menuName: menu.menuName || "Mi menú personalizado",
      startDate: questionnaireData.startDate || new Date().toISOString().split("T")[0],
      goal: questionnaireData.goal || "mantenimiento",
      persons: menu.persons || questionnaireData.persons || 1,
      targetCalories: menu.targetCalories || 2000,
      days: menu.days.map(d => ({
        day: d.day,
        date: d.date,
        totalCalories: d.totalCalories,
        meals: d.meals,
      })),
    });
  };

  const day = menu.days[activeDay];

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Nuevo</button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{menu.menuName}</p>
            <p className="text-xs text-muted-foreground">{menu.targetCalories} kcal/día · {menu.persons} {menu.persons === 1 ? "persona" : "personas"}</p>
          </div>
          {!saved ? (
            <Button onClick={handleSave} disabled={saveMutation.isPending} size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs flex-shrink-0">
              {saveMutation.isPending ? "..." : "💾 Guardar"}
            </Button>
          ) : (
            <Badge className="bg-green-100 text-green-700 border-green-200 flex-shrink-0">✓ Guardado</Badge>
          )}
        </div>

        {menu.cookingTips && (
          <div className="mx-4 mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-700 dark:text-orange-300">💡 {menu.cookingTips}</p>
          </div>
        )}

        <div className="flex gap-2 p-3 overflow-x-auto border-b border-border">
          {menu.days.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeDay === i ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground hover:bg-orange-100"
              }`}>
              {d.day}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {day?.meals.map((meal, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{meal.name}</CardTitle>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {meal.calories && <span>🔥 {meal.calories} kcal</span>}
                    {meal.prepTime && <span>⏱ {meal.prepTime}</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <p className="text-sm">{meal.food}</p>
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Ingredientes:</p>
                    <div className="flex flex-wrap gap-1">
                      {meal.ingredients.map((ing, j) => (
                        <span key={j} className="text-xs bg-muted px-2 py-0.5 rounded-full">{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(meal.protein || meal.carbs || meal.fat) && (
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    {meal.protein && <span className="text-blue-600">P: {meal.protein}g</span>}
                    {meal.carbs && <span className="text-orange-600">C: {meal.carbs}g</span>}
                    {meal.fat && <span className="text-yellow-600">G: {meal.fat}g</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {saved && (
          <div className="p-4 border-t border-border bg-background space-y-3">
            {/* Apply to calendar */}
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">📅 Aplicar al diario de comidas</p>
              <p className="text-xs text-muted-foreground mb-2">Elige la fecha de inicio y las comidas se añadirán automáticamente a tu diario.</p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={applyDate}
                  onChange={e => setApplyDate(e.target.value)}
                  className="flex-1 text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
                />
                <Button
                  onClick={handleApplyToCalendar}
                  disabled={applying || applyToCalendarMutation.isSuccess}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs"
                >
                  {applying ? "⏳" : applyToCalendarMutation.isSuccess ? "✅ Aplicado" : "Aplicar"}
                </Button>
              </div>
              {applyToCalendarMutation.isSuccess && (
                <Link href="/app/meal-log">
                  <Button variant="outline" className="w-full text-xs mt-2 border-orange-300 text-orange-600">
                    Ver diario de comidas →
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex gap-2">
              <Link href="/app/my-menus" className="flex-1">
                <Button variant="outline" className="w-full text-sm">📋 Mis Menús</Button>
              </Link>
              <Button
                onClick={handleCreateShoppingList}
                disabled={creatingList || generateListMutation.isSuccess}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm"
              >
                {creatingList ? "⏳ Creando..." : generateListMutation.isSuccess ? "✅ Lista creada" : "🛒 Crear lista"}
              </Button>
            </div>
            {generateListMutation.isSuccess && (
              <Link href="/app/shopping-lists">
                <Button variant="outline" className="w-full text-sm border-orange-300 text-orange-600">
                  Ver lista de la compra →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Save Success Modal */}
      {showSaveModal && savedMenuId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowSaveModal(false)}>
          <div className="bg-background rounded-t-2xl w-full max-w-[480px] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">✅</div>
              <h3 className="text-lg font-bold">¡Menú guardado!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tu menú <strong>{menu.menuName}</strong> se ha guardado en "Mis Menús".
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => { setShowSaveModal(false); navigate("/app/my-menus"); }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                📋 Ver en Mis Menús
              </Button>
              <Button
                onClick={() => { setShowSaveModal(false); navigate("/app/active-menu"); }}
                variant="outline"
                className="w-full"
              >
                🎯 Ver menú activo
              </Button>
              <Button
                onClick={() => setShowSaveModal(false)}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Seguir revisando el menú
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main BuddyIA Page ────────────────────────────────────────────────────────
export default function BuddyIA() {
  const { can } = usePlan();
  const [mode, setMode] = useState<AppMode>("home");
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState<Partial<QuestionnaireData>>({});
  const [savedMenuId, setSavedMenuId] = useState<number | null>(null);

  if (!can("canUseBuddyIA")) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: 600, margin: "0 auto" }}>
        <UpgradeGate feature="canUseBuddyIA">{null}</UpgradeGate>
      </div>
    );
  }

  if (mode === "chat") {
    return <div className="h-full flex flex-col"><ChatView onBack={() => setMode("home")} /></div>;
  }

  if (mode === "questionnaire") {
    return (
      <div className="h-full flex flex-col">
        <QuestionnaireView
          onBack={() => setMode("home")}
          onMenuGenerated={(menu, data) => {
            setGeneratedMenu(menu);
            setQuestionnaireData(data);
            setMode("menu_result");
          }}
          onDataChange={setQuestionnaireData}
        />
      </div>
    );
  }

  if (mode === "menu_result" && generatedMenu) {
    return (
      <div className="h-full flex flex-col">
        <MenuResultView
          menu={generatedMenu}
          questionnaireData={questionnaireData}
          onBack={() => setMode("questionnaire")}
          onSaved={(id) => setSavedMenuId(id)}
        />
      </div>
    );
  }

  // Home screen
  return (
    <div className="p-4 space-y-6 pb-8">
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl mx-auto mb-3">🤖</div>
        <h1 className="text-2xl font-bold">BuddyIA</h1>
        <p className="text-muted-foreground text-sm mt-1">Tu asistente nutricional inteligente</p>
      </div>

      <div className="space-y-3">
        <button onClick={() => setMode("questionnaire")}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-left hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg">
          <span className="text-3xl">📅</span>
          <div className="flex-1">
            <p className="font-bold text-base">Crear menú semanal</p>
            <p className="text-orange-100 text-sm">Cuestionario inteligente de 9 pasos</p>
          </div>
          <span className="text-xl">→</span>
        </button>

        <button onClick={() => setMode("chat")}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 text-left hover:border-orange-400 transition-all">
          <span className="text-3xl">💬</span>
          <div className="flex-1">
            <p className="font-bold text-base text-foreground">Consultar a BuddyIA</p>
            <p className="text-muted-foreground text-sm">Preguntas sobre nutrición, recetas y dietas</p>
          </div>
          <span className="text-xl text-orange-500">→</span>
        </button>

        <Link href="/app/my-menus">
          <button className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-card text-left hover:border-orange-300 transition-all">
            <span className="text-3xl">🗂️</span>
            <div className="flex-1">
              <p className="font-bold text-base text-foreground">Mis Menús</p>
              <p className="text-muted-foreground text-sm">Ver y gestionar tus menús guardados</p>
            </div>
            <span className="text-xl text-muted-foreground">→</span>
          </button>
        </Link>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">¿Qué puede hacer BuddyIA?</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: "🎯", title: "Menús por objetivo", desc: "Pérdida de peso, músculo, tonificación..." },
            { emoji: "🍳", title: "Batch cooking", desc: "Cocina una vez, come toda la semana" },
            { emoji: "🥡", title: "Tuppers al trabajo", desc: "Recetas para llevar y calentar" },
            { emoji: "🍽️", title: "Días fuera de casa", desc: "Opciones de restaurante saludables" },
            { emoji: "👥", title: "Para toda la familia", desc: "Ajusta cantidades por personas" },
            { emoji: "🛒", title: "Lista de la compra", desc: "Generada automáticamente" },
          ].map((f) => (
            <div key={f.title} className="p-3 rounded-xl bg-card border border-border">
              <span className="text-xl">{f.emoji}</span>
              <p className="text-xs font-semibold mt-1">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        ⚠️ BuddyIA no sustituye el consejo de un profesional de la salud o nutricionista
      </p>
    </div>
  );
}
