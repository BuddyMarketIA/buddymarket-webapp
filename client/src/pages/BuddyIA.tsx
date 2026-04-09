import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
type ActivityLevel = "sedentario" | "ligero" | "moderado" | "activo" | "muy_activo";
type ProteinSource = "carne" | "pescado" | "legumbres" | "huevos" | "mixto" | "vegetal";
type CookingTime = "menos_15" | "15_30" | "30_60" | "mas_60";
type CookingSkill = "principiante" | "intermedio" | "avanzado";
type DietType = "omnivoro" | "flexitariano" | "pescetariano" | "vegetariano" | "vegano" | "cetogenico" | "paleo" | "mediterraneo" | "dash";
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
  // New extended fields
  activityLevel?: ActivityLevel;
  proteinSource?: ProteinSource;
  cookingTime?: CookingTime;
  cookingSkill?: CookingSkill;
  kitchenEquipment?: string[];
  mealTimings?: {
    breakfast?: string;
    morningSnack?: string;
    lunch?: string;
    afternoonSnack?: string;
    dinner?: string;
  };
  dietType?: DietType;
  allergies?: string[];
  waterIntake?: number;
  supplementsUsed?: string;
  specialNotes?: string;
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

const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; emoji: string; desc: string }[] = [
  { id: "sedentario", label: "Sedentario", emoji: "🪑", desc: "Trabajo de oficina, sin ejercicio regular" },
  { id: "ligero", label: "Ligeramente activo", emoji: "🚶", desc: "1-2 días/semana de ejercicio o caminatas" },
  { id: "moderado", label: "Moderadamente activo", emoji: "🏃", desc: "3-4 días/semana de ejercicio" },
  { id: "activo", label: "Muy activo", emoji: "💪", desc: "5-6 días/semana de ejercicio intenso" },
  { id: "muy_activo", label: "Atleta / Extremo", emoji: "🏆", desc: "Entrenamiento diario o trabajo físico intenso" },
];

const PROTEIN_SOURCES: { id: ProteinSource; label: string; emoji: string; desc: string }[] = [
  { id: "mixto", label: "Variado", emoji: "🍽️", desc: "Carne, pescado, huevos y legumbres" },
  { id: "carne", label: "Carne", emoji: "🥩", desc: "Pollo, ternera, cerdo, pavo" },
  { id: "pescado", label: "Pescado y marisco", emoji: "🐟", desc: "Preferencia por proteína marina" },
  { id: "legumbres", label: "Legumbres", emoji: "🫘", desc: "Lentejas, garbanzos, alubias" },
  { id: "huevos", label: "Huevos y lácteos", emoji: "🥚", desc: "Proteína de huevo y derivados lácteos" },
  { id: "vegetal", label: "100% Vegetal", emoji: "🌱", desc: "Tofu, tempeh, seitán, proteína vegetal" },
];

const COOKING_TIMES: { id: CookingTime; label: string; emoji: string; desc: string }[] = [
  { id: "menos_15", label: "Menos de 15 min", emoji: "⚡", desc: "Recetas ultrarrápidas, mínima preparación" },
  { id: "15_30", label: "15-30 minutos", emoji: "🕐", desc: "Recetas rápidas y sencillas" },
  { id: "30_60", label: "30-60 minutos", emoji: "🕑", desc: "Recetas estándar con algo de elaboración" },
  { id: "mas_60", label: "Más de 1 hora", emoji: "👨‍🍳", desc: "Cocina elaborada, guisos lentos, recetas complejas" },
];

const COOKING_SKILLS: { id: CookingSkill; label: string; emoji: string; desc: string }[] = [
  { id: "principiante", label: "Principiante", emoji: "🌱", desc: "Recetas muy sencillas, pocos pasos" },
  { id: "intermedio", label: "Intermedio", emoji: "🍳", desc: "Técnicas básicas, recetas variadas" },
  { id: "avanzado", label: "Avanzado", emoji: "⭐", desc: "Técnicas complejas, presentación cuidada" },
];

const DIET_TYPES: { id: DietType; label: string; emoji: string; desc: string }[] = [
  { id: "omnivoro", label: "Omnívoro", emoji: "🍖", desc: "Como de todo" },
  { id: "mediterraneo", label: "Mediterráneo", emoji: "🫒", desc: "Aceite de oliva, verduras, legumbres, pescado" },
  { id: "flexitariano", label: "Flexitariano", emoji: "🥗", desc: "Mayormente vegetal, algo de carne/pescado" },
  { id: "pescetariano", label: "Pescetariano", emoji: "🐟", desc: "Pescado pero no carne" },
  { id: "vegetariano", label: "Vegetariano", emoji: "🥦", desc: "Sin carne ni pescado" },
  { id: "vegano", label: "Vegano", emoji: "🌿", desc: "Sin ningún producto de origen animal" },
  { id: "cetogenico", label: "Cetogénico", emoji: "🥑", desc: "Muy bajo en carbohidratos, alto en grasas" },
  { id: "paleo", label: "Paleo", emoji: "🦴", desc: "Sin cereales, sin lácteos, sin legumbres" },
  { id: "dash", label: "DASH", emoji: "❤️", desc: "Bajo en sodio, para hipertensión" },
];

const KITCHEN_EQUIPMENT = [
  { id: "horno", label: "Horno", emoji: "🔥" },
  { id: "freidora_aire", label: "Freidora de aire", emoji: "💨" },
  { id: "thermomix", label: "Thermomix", emoji: "⚙️" },
  { id: "olla_presion", label: "Olla a presión", emoji: "🫕" },
  { id: "barbacoa", label: "Barbacoa/Grill", emoji: "🔥" },
  { id: "vaporera", label: "Vaporera", emoji: "💧" },
  { id: "microondas", label: "Microondas", emoji: "📡" },
  { id: "batidora", label: "Batidora/Licuadora", emoji: "🌀" },
];

const SPECIFIC_ALLERGIES = [
  "Cacahuetes", "Frutos secos", "Leche", "Huevos", "Trigo", "Soja",
  "Pescado", "Marisco", "Sésamo", "Mostaza", "Apio", "Sulfitos",
  "Moluscos", "Altramuces",
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
            <p className="font-semibold text-sm">{"BuddyIA"}</p>
            <p className="text-xs text-muted-foreground">{"Nutritional assistant"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl mx-auto mb-3">🤖</div>
              <p className="font-semibold">{"Hola, soy BuddyIA"}</p>
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
            placeholder={"Type your question..."}
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
    kitchenEquipment: [],
    allergies: [],
    mealTimings: {},
  });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const { data: savedPrefs } = trpc.profile.getMenuPreferences.useQuery();
  const [allergyInput, setAllergyInput] = useState("");
  const [dislikedInput, setDislikedInput] = useState("");

  // Load saved preferences once when they arrive
  useEffect(() => {
    if (!savedPrefs || prefsLoaded) return;
    setPrefsLoaded(true);
    const updates: Partial<QuestionnaireData> = {};
    if (savedPrefs.dietType) updates.dietType = savedPrefs.dietType as any;
    if (savedPrefs.allergies?.length) updates.allergies = savedPrefs.allergies;
    if (savedPrefs.restrictions?.length) updates.restrictions = savedPrefs.restrictions;
    if (savedPrefs.dislikedFoods) updates.dislikedFoods = savedPrefs.dislikedFoods;
    if (savedPrefs.proteinSource) updates.proteinSource = savedPrefs.proteinSource as any;
    if (savedPrefs.cookingTime) updates.cookingTime = savedPrefs.cookingTime as any;
    if (savedPrefs.cookingSkill) updates.cookingSkill = savedPrefs.cookingSkill as any;
    if (savedPrefs.kitchenEquipment?.length) updates.kitchenEquipment = savedPrefs.kitchenEquipment;
    if (savedPrefs.supplementsUsed) updates.supplementsUsed = savedPrefs.supplementsUsed;
    if (savedPrefs.specialNotes) updates.specialNotes = savedPrefs.specialNotes;
    if (savedPrefs.persons) updates.persons = savedPrefs.persons;
    if (savedPrefs.mealsPerDay) updates.mealsPerDay = savedPrefs.mealsPerDay;
    if (Object.keys(updates).length > 0) {
      setData(prev => ({ ...prev, ...updates }));
    }
  }, [savedPrefs, prefsLoaded]);

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

  // 14 steps total
  const steps = [
    { title: "¿Cuándo empieza tu menú?", subtitle: "Elige la fecha de inicio y duración" },
    { title: "¿Cuál es tu objetivo?", subtitle: "Personalizamos las calorías y macros para ti" },
    { title: "¿Qué tipo de dieta sigues?", subtitle: "Opcional — adaptamos el menú a tu estilo alimentario" },
    { title: "¿Cómo vas a cocinar esta semana?", subtitle: "Tu estilo de vida determina el tipo de recetas" },
    { title: "¿Para cuántas personas?", subtitle: "Ajustamos las cantidades de la lista de la compra" },
    { title: "¿Cuántas comidas al día?", subtitle: "Distribuimos las calorías según tus hábitos" },
    { title: "¿Cuál es tu nivel de actividad?", subtitle: "Opcional — ajustamos las calorías a tu gasto energético" },
    { title: "¿Qué proteína prefieres?", subtitle: "Opcional — priorizamos tu fuente de proteína favorita" },
    { title: "¿Cuánto tiempo tienes para cocinar?", subtitle: "Opcional — recetas adaptadas a tu disponibilidad" },
    { title: "¿Qué días comes fuera de casa?", subtitle: "Opcional — para esos días te proponemos opciones de restaurante" },
    { title: "¿Hay alimentos que no te gusten?", subtitle: "Opcional — los excluimos del menú" },
    { title: "¿Tienes restricciones o alergias?", subtitle: "Opcional — excluimos lo que no puedes comer" },
    { title: "¿Qué equipo de cocina tienes?", subtitle: "Opcional — aprovechamos tus herramientas" },
    { title: "Presupuesto y detalles finales", subtitle: "Opcional — cuanto más nos cuentes, mejor será tu menú" },
  ];

  const canProceed = () => {
    if (step === 0) return !!data.startDate;
    if (step === 1) return !!data.goal;
    if (step === 3) return !!data.cookingStyle;
    if (step === 4) return !!data.persons && data.persons >= 1;
    if (step === 5) return !!data.mealsPerDay;
    return true;
  };

  const handleGenerate = () => {
    if (!data.startDate || !data.cookingStyle || !data.persons || !data.mealsPerDay || !data.goal) {
      toast.error("Please complete all required fields");
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
      activityLevel: data.activityLevel,
      proteinSource: data.proteinSource,
      cookingTime: data.cookingTime,
      cookingSkill: data.cookingSkill,
      kitchenEquipment: data.kitchenEquipment || [],
      mealTimings: data.mealTimings,
      dietType: data.dietType,
      allergies: data.allergies || [],
      waterIntake: data.waterIntake,
      supplementsUsed: data.supplementsUsed,
      specialNotes: data.specialNotes,
    });
  };

  const dislikedList = (data.dislikedFoods || "").split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm">← Volver</button>
        <div>
          <p className="font-semibold text-sm">{"Create personalised menu"}</p>
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

        {/* Banner: saved preferences loaded */}
        {step === 0 && prefsLoaded && savedPrefs && Object.keys(savedPrefs).some(k => k !== "updatedAt" && k !== "persons" && k !== "mealsPerDay" && (savedPrefs as any)[k] && (Array.isArray((savedPrefs as any)[k]) ? (savedPrefs as any)[k].length > 0 : true)) && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-start gap-2">
            <span className="text-green-600 text-base mt-0.5">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">{"Preferences loaded from your profile"}</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Hemos rellenado el cuestionario con tus preferencias guardadas. Puedes modificar cualquier campo.</p>
            </div>
          </div>
        )}

        {/* Step 0: Date & duration */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{"Start date"}</label>
              <input type="date" value={data.startDate || ""} min={new Date().toISOString().split("T")[0]}
                onChange={(e) => updateData({ startDate: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">¿Cuántos días?</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 14].map(d => (
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
                placeholder={"E.g.: 2000 kcal (if left empty, we calculate it)"}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        )}

        {/* Step 2: Diet type (NEW) */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Opcional — si no lo seleccionas, generaremos un menú omnívoro equilibrado.</p>
            {DIET_TYPES.map(dt => (
              <button key={dt.id} onClick={() => updateData({ dietType: data.dietType === dt.id ? undefined : dt.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  data.dietType === dt.id ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                }`}>
                <span className="text-2xl">{dt.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{dt.label}</p>
                  <p className="text-xs text-muted-foreground">{dt.desc}</p>
                </div>
                {data.dietType === dt.id && <span className="text-orange-500 font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Cooking style */}
        {step === 3 && (
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

        {/* Step 4: Persons */}
        {step === 4 && (
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

        {/* Step 5: Meals per day */}
        {step === 5 && (
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

        {/* Step 6: Activity level (NEW) */}
        {step === 6 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Opcional — ajustamos las calorías según tu gasto energético real.</p>
            {ACTIVITY_LEVELS.map(al => (
              <button key={al.id} onClick={() => updateData({ activityLevel: data.activityLevel === al.id ? undefined : al.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  data.activityLevel === al.id ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                }`}>
                <span className="text-2xl">{al.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{al.label}</p>
                  <p className="text-xs text-muted-foreground">{al.desc}</p>
                </div>
                {data.activityLevel === al.id && <span className="text-orange-500 font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 7: Protein source (NEW) */}
        {step === 7 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Opcional — priorizaremos tu fuente de proteína favorita en las recetas.</p>
            {PROTEIN_SOURCES.map(ps => (
              <button key={ps.id} onClick={() => updateData({ proteinSource: data.proteinSource === ps.id ? undefined : ps.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  data.proteinSource === ps.id ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                }`}>
                <span className="text-2xl">{ps.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{ps.label}</p>
                  <p className="text-xs text-muted-foreground">{ps.desc}</p>
                </div>
                {data.proteinSource === ps.id && <span className="text-orange-500 font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}

        {/* Step 8: Cooking time & skill (NEW) */}
        {step === 8 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium mb-3">Tiempo disponible para cocinar</p>
              <div className="space-y-2">
                {COOKING_TIMES.map(ct => (
                  <button key={ct.id} onClick={() => updateData({ cookingTime: data.cookingTime === ct.id ? undefined : ct.id })}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-all ${
                      data.cookingTime === ct.id ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                    }`}>
                    <span className="text-xl">{ct.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{ct.label}</p>
                      <p className="text-xs text-muted-foreground">{ct.desc}</p>
                    </div>
                    {data.cookingTime === ct.id && <span className="text-orange-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Nivel de habilidad en cocina</p>
              <div className="space-y-2">
                {COOKING_SKILLS.map(cs => (
                  <button key={cs.id} onClick={() => updateData({ cookingSkill: data.cookingSkill === cs.id ? undefined : cs.id })}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-all ${
                      data.cookingSkill === cs.id ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500" : "border-border hover:border-orange-300"
                    }`}>
                    <span className="text-xl">{cs.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{cs.label}</p>
                      <p className="text-xs text-muted-foreground">{cs.desc}</p>
                    </div>
                    {data.cookingSkill === cs.id && <span className="text-orange-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Eat out days */}
        {step === 9 && (
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

        {/* Step 10: Disliked foods */}
        {step === 10 && (
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
                placeholder={"Add another food..."}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button onClick={addCustomDislike} variant="outline" className="px-3">+</Button>
            </div>
            {dislikedList.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">No me gustan:</p>
                <div className="flex flex-wrap gap-1.5">
                  {dislikedList.map(food => (
                    <span key={food} onClick={() => toggleDislike(food)}
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

        {/* Step 11: Restrictions & allergies */}
        {step === 11 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">Restricciones alimentarias</p>
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
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Alergias específicas (14 alérgenos principales)</p>
              <div className="flex flex-wrap gap-2">
                {SPECIFIC_ALLERGIES.map(a => (
                  <button key={a}
                    onClick={() => updateData({ allergies: data.allergies?.includes(a) ? data.allergies.filter(x => x !== a) : [...(data.allergies || []), a] })}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      data.allergies?.includes(a) ? "bg-red-500 text-white border-red-500" : "border-border hover:border-red-300"
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault();
                  if (allergyInput.trim() && !(data.allergies || []).includes(allergyInput.trim())) {
                    updateData({ allergies: [...(data.allergies || []), allergyInput.trim()] });
                  }
                  setAllergyInput("");
                }}}
                placeholder={"Another allergy..."}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button onClick={() => {
                if (allergyInput.trim() && !(data.allergies || []).includes(allergyInput.trim())) {
                  updateData({ allergies: [...(data.allergies || []), allergyInput.trim()] });
                }
                setAllergyInput("");
              }} variant="outline" className="px-3">+</Button>
            </div>
            <p className="text-xs text-muted-foreground">Si no tienes restricciones ni alergias, puedes saltar este paso.</p>
          </div>
        )}

        {/* Step 12: Kitchen equipment (NEW) */}
        {step === 12 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Opcional — adaptamos las recetas al equipo que tienes disponible.</p>
            <div className="grid grid-cols-2 gap-2">
              {KITCHEN_EQUIPMENT.map(eq => (
                <button key={eq.id}
                  onClick={() => updateData({ kitchenEquipment: (data.kitchenEquipment || []).includes(eq.id)
                    ? (data.kitchenEquipment || []).filter(e => e !== eq.id)
                    : [...(data.kitchenEquipment || []), eq.id] })}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    (data.kitchenEquipment || []).includes(eq.id)
                      ? "bg-orange-50 dark:bg-orange-950/30 border-orange-500"
                      : "border-border hover:border-orange-300"
                  }`}>
                  <span className="text-xl">{eq.emoji}</span>
                  <span className="text-sm font-medium">{eq.label}</span>
                  {(data.kitchenEquipment || []).includes(eq.id) && <span className="ml-auto text-orange-500 text-xs font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 13: Budget, supplements, notes + summary + disclaimer */}
        {step === 13 && (
          <div className="space-y-4">
            {/* Budget */}
            <div>
              <label className="text-sm font-medium mb-2 block">💶 Presupuesto semanal (opcional)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={data.budgetPerWeek || ""} min={20} max={500}
                  onChange={(e) => updateData({ budgetPerWeek: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder={"E.g.: 80"}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <span className="text-sm font-medium text-muted-foreground">€/semana</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[40, 60, 80, 120].map(b => (
                  <button key={b} onClick={() => updateData({ budgetPerWeek: b })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                      data.budgetPerWeek === b ? "bg-orange-500 text-white border-orange-500" : "border-border hover:border-orange-300"
                    }`}>{b}€</button>
                ))}
              </div>
            </div>
            {/* Supplements */}
            <div>
              <label className="text-sm font-medium mb-2 block">💪 Suplementos que usas (opcional)</label>
              <input type="text" value={data.supplementsUsed || ""}
                onChange={(e) => updateData({ supplementsUsed: e.target.value })}
                placeholder={"E.g.: whey protein, creatine, omega-3..."}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            {/* Water intake */}
            <div>
              <label className="text-sm font-medium mb-2 block">💧 Objetivo de hidratación (opcional)</label>
              <div className="flex gap-2">
                {[1.5, 2, 2.5, 3].map(l => (
                  <button key={l} onClick={() => updateData({ waterIntake: data.waterIntake === l ? undefined : l })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                      data.waterIntake === l ? "bg-blue-500 text-white border-blue-500" : "border-border hover:border-blue-300"
                    }`}>{l}L</button>
                ))}
              </div>
            </div>
            {/* Preferences */}
            <div>
              <label className="text-sm font-medium mb-2 block">💬 Notas adicionales (opcional)</label>
              <Textarea value={data.preferences || ""}
                onChange={(e) => updateData({ preferences: e.target.value })}
                placeholder={"E.g.: I like Mediterranean cuisine, I prefer simple recipes, I have little time on Mondays..."}
                className="min-h-[70px] resize-none" />
            </div>
            {/* Summary */}
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">📋 Resumen de tu menú:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>📅 Inicio: {data.startDate} · {data.daysCount} días</p>
                <p>🎯 Objetivo: {GOALS.find(g => g.id === data.goal)?.label}</p>
                {data.dietType && <p>🌿 Dieta: {DIET_TYPES.find(d => d.id === data.dietType)?.label}</p>}
                <p>🍳 Estilo: {COOKING_STYLES.find(c => c.id === data.cookingStyle)?.label}</p>
                <p>👥 Personas: {data.persons} · 🍽️ {data.mealsPerDay} comidas/día</p>
                {data.activityLevel && <p>🏃 Actividad: {ACTIVITY_LEVELS.find(a => a.id === data.activityLevel)?.label}</p>}
                {data.proteinSource && <p>🥩 Proteína: {PROTEIN_SOURCES.find(p => p.id === data.proteinSource)?.label}</p>}
                {data.cookingTime && <p>⏱️ Tiempo: {COOKING_TIMES.find(t => t.id === data.cookingTime)?.label}</p>}
                {(data.eatOutDays || []).length > 0 && <p>🍽️ Fuera de casa: {(data.eatOutDays || []).join(", ")}</p>}
                {dislikedList.length > 0 && <p>🚫 No me gustan: {dislikedList.slice(0, 3).join(", ")}{dislikedList.length > 3 ? ` +${dislikedList.length - 3}` : ""}</p>}
                {data.restrictions?.length ? <p>⚠️ Restricciones: {data.restrictions.join(", ")}</p> : null}
                {data.allergies?.length ? <p>🚨 Alergias: {data.allergies.join(", ")}</p> : null}
                {(data.kitchenEquipment || []).length > 0 && <p>🍳 Equipo: {(data.kitchenEquipment || []).map(e => KITCHEN_EQUIPMENT.find(k => k.id === e)?.label).join(", ")}</p>}
                {data.budgetPerWeek && <p>💶 Presupuesto: {data.budgetPerWeek}€/semana</p>}
                {data.waterIntake && <p>💧 Hidratación: {data.waterIntake}L/día</p>}
              </div>
            </div>
            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">⚠️ Aviso importante</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                El menú generado por BuddyIA es una propuesta orientativa basada en los datos que has proporcionado. <strong>No sustituye el consejo de un nutricionista o profesional de la salud.</strong> Si tienes condiciones médicas, embarazo, o necesidades dietéticas especiales, consulta siempre con un especialista antes de seguir cualquier plan nutricional.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium">
                {"💡 The more data you complete, the more personalised and accurate your menu will be."}
              </p>
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
              ) : `✨ ${"Generate my menu"}`}
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
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [activeDay, setActiveDay] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedMenuId, setSavedMenuId] = useState<number | null>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [applyDate, setApplyDate] = useState(() => questionnaireData.startDate || new Date().toISOString().split("T")[0]);
  const [applying, setApplying] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const utils = trpc.useUtils();

  // ── Mutable local copy of the menu (allows replacing meals) ──────────────
  const [localMenu, setLocalMenu] = useState<GeneratedMenu>(() => JSON.parse(JSON.stringify(menu)));

  // ── Replace-meal panel state ──────────────────────────────────────────────
  type ReplaceState = { dayIdx: number; mealIdx: number } | null;
  const [replacing, setReplacing] = useState<ReplaceState>(null);
  type AltMeal = { food: string; calories?: number; protein?: number; carbs?: number; fat?: number; prepTime?: string; ingredients?: string[]; reason?: string };
  const [altMeal, setAltMeal] = useState<AltMeal | null>(null);
  const [altError, setAltError] = useState<string | null>(null);

  const replaceMealMutation = trpc.buddyIA.replaceMeal.useMutation({
    onSuccess: (data) => {
      if (data.error || !data.alternative) {
        setAltError(data.error || "No se pudo generar la alternativa.");
        setAltMeal(null);
      } else {
        setAltMeal(data.alternative as AltMeal);
        setAltError(null);
      }
    },
    onError: () => {
      setAltError("Error de conexión. Inténtalo de nuevo.");
      setAltMeal(null);
    },
  });

  const handleRequestAlternative = (dayIdx: number, mealIdx: number) => {
    const day = localMenu.days[dayIdx];
    const meal = day.meals[mealIdx];
    setReplacing({ dayIdx, mealIdx });
    setAltMeal(null);
    setAltError(null);
    const otherMeals = day.meals.filter((_, i) => i !== mealIdx).map((m) => m.food).slice(0, 5);
    replaceMealMutation.mutate({
      mealName: meal.name,
      currentFood: meal.food,
      targetCalories: meal.calories ?? Math.round((localMenu.targetCalories || 2000) / Math.max(day.meals.length, 1)),
      dayName: day.day,
      menuGoal: questionnaireData.goal || "mantenimiento",
      persons: localMenu.persons || 1,
      previousMealsToday: otherMeals,
    });
  };

  const handleAcceptAlternative = () => {
    if (!replacing || !altMeal) return;
    const { dayIdx, mealIdx } = replacing;
    setLocalMenu((prev) => {
      const updated: GeneratedMenu = JSON.parse(JSON.stringify(prev));
      const meal = updated.days[dayIdx].meals[mealIdx];
      meal.food = altMeal.food;
      if (altMeal.calories != null) meal.calories = altMeal.calories;
      if (altMeal.protein != null) meal.protein = altMeal.protein;
      if (altMeal.carbs != null) meal.carbs = altMeal.carbs;
      if (altMeal.fat != null) meal.fat = altMeal.fat;
      if (altMeal.prepTime) meal.prepTime = altMeal.prepTime;
      if (altMeal.ingredients) meal.ingredients = altMeal.ingredients;
      updated.days[dayIdx].totalCalories = updated.days[dayIdx].meals.reduce((s, m) => s + (m.calories ?? 0), 0);
      return updated;
    });
    setReplacing(null);
    setAltMeal(null);
    setSaved(false);
    toast.success("✅ Comida reemplazada. Recuerda guardar el menú actualizado.");
  };

  const handleCancelReplace = () => {
    setReplacing(null);
    setAltMeal(null);
    setAltError(null);
  };

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
      toast.error("Could not create the list. Try from Shopping List.");
    },
  });

  const [exportingPDF, setExportingPDF] = useState(false);

  const generatePDFMutation = trpc.buddyIA.generateMenuPDF.useMutation({
    onSuccess: (data) => {
      setExportingPDF(false);
      if (data.url) {
        window.open(data.url, '_blank');
        toast.success("📄 PDF generado correctamente");
      } else {
        toast.error(data.error || "No se pudo generar el PDF.");
      }
    },
    onError: () => {
      setExportingPDF(false);
      toast.error("Error al generar el PDF. Inténtalo de nuevo.");
    },
  });

  const handleExportPDF = () => {
    setExportingPDF(true);
    generatePDFMutation.mutate({
      menuName: localMenu.menuName || "Mi menú personalizado",
      goal: questionnaireData.goal,
      daysCount: localMenu.days.length,
      days: localMenu.days.map(d => ({
        dayName: d.day,
        date: d.date,
        meals: d.meals.map(m => ({
          mealType: m.name,
          name: m.food,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          ingredients: m.ingredients,
        })),
      })),
    });
  };

  const saveMutation = trpc.buddyIA.saveGeneratedMenu.useMutation({
    onSuccess: (data) => {
      setSaved(true);
      setSavedMenuId(data.menuId);
      setShowSaveModal(true);
      toast.success("✅ Menú guardado en Mis Menús");
      onSaved(data.menuId);
      utils.menus.list.invalidate();
    },
    onError: () => toast.error("Error al guardar el menú. Comprueba tu conexión."),
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
    const baseDate = questionnaireData.startDate || new Date().toISOString().split("T")[0];
    saveMutation.mutate({
      menuName: localMenu.menuName || "Mi menú personalizado",
      startDate: baseDate,
      goal: questionnaireData.goal || "mantenimiento",
      persons: localMenu.persons || questionnaireData.persons || 1,
      targetCalories: localMenu.targetCalories || 2000,
      days: localMenu.days.map((d, idx) => {
        // Ensure each day has a date: use the day's own date or calculate from startDate + index
        let dayDate = d.date;
        if (!dayDate) {
          const base = new Date(baseDate + 'T12:00:00Z');
          base.setUTCDate(base.getUTCDate() + idx);
          dayDate = base.toISOString().split('T')[0];
        }
        return {
          day: d.day,
          date: dayDate,
          totalCalories: d.totalCalories,
          meals: d.meals,
        };
      }),
    });
  };

  const day = localMenu.days[activeDay];
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  // Format date for day selector: "Lun\n14 abr"
  function formatDayLabel(dayName: string, dateStr?: string) {
    if (!dateStr) return { short: dayName.slice(0, 3), date: "" };
    const d = new Date(dateStr + "T12:00:00");
    const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return { short: dayName.slice(0, 3), date: `${d.getDate()} ${months[d.getMonth()]}` };
  }

  const MEAL_ICONS: Record<string, string> = {
    "Desayuno": "☀️", "Almuerzo": "🌤️", "Comida": "🍽️", "Merienda": "🍎", "Cena": "🌙",
    "Snack": "🥜", "Tentempié": "🥨",
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-background">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm flex-shrink-0">← Nuevo</button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{localMenu.menuName}</p>
            <p className="text-xs text-muted-foreground">{localMenu.targetCalories} kcal/día · {localMenu.persons} {localMenu.persons === 1 ? "persona" : "personas"} · {localMenu.days.length} días</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button onClick={handleExportPDF} disabled={exportingPDF || generatePDFMutation.isPending} size="sm" variant="outline"
              className="text-xs px-2 py-1 h-7 border-orange-300 text-orange-600 hover:bg-orange-50">
              {exportingPDF ? "⏳" : "📄 PDF"}
            </Button>
            {!saved ? (
              <Button onClick={handleSave} disabled={saveMutation.isPending} size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7 px-2">
                {saveMutation.isPending ? "⏳" : "💾 Guardar"}
              </Button>
            ) : (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">✓ Guardado</Badge>
            )}
          </div>
        </div>

        {/* Day selector - visual cards */}
        <div className="flex gap-2 px-3 py-3 overflow-x-auto border-b border-border bg-background" style={{ scrollbarWidth: "none" }}>
          {localMenu.days.map((d, i) => {
            const { short, date } = formatDayLabel(d.day, d.date);
            const isActive = activeDay === i;
            return (
              <button key={i} onClick={() => setActiveDay(i)}
                style={{
                  flexShrink: 0, minWidth: "56px", padding: "8px 6px",
                  borderRadius: "14px", border: isActive ? "2px solid #F97316" : "2px solid transparent",
                  background: isActive ? "#F97316" : "#f3f4f6",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "white" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{short}</span>
                {date && <span style={{ fontSize: "12px", fontWeight: 800, color: isActive ? "white" : "#1f2937", lineHeight: 1.1 }}>{date}</span>}
                {d.totalCalories && <span style={{ fontSize: "9px", color: isActive ? "rgba(255,255,255,0.8)" : "#9ca3af", marginTop: "2px" }}>{d.totalCalories} kcal</span>}
              </button>
            );
          })}
        </div>

        {/* Day summary banner */}
        {day && (
          <div style={{ margin: "12px 16px 0", padding: "12px 16px", borderRadius: "14px", background: "linear-gradient(135deg, #fff7ed, #ffedd5)", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1f2937" }}>{day.day}{day.date ? ` · ${(() => { const d2 = new Date(day.date + "T12:00:00"); return d2.toLocaleDateString("es-ES", { day: "numeric", month: "long" }); })()}` : ""}</p>
              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{day.meals.length} comidas planificadas</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#F97316" }}>{day.totalCalories ?? day.meals.reduce((s, m) => s + (m.calories ?? 0), 0)}</p>
              <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af", fontWeight: 600 }}>kcal totales</p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mx-4 mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            🛡️ Menú generado respetando tus restricciones. <strong>No sustituye el consejo médico.</strong>
          </p>
        </div>
        {localMenu.cookingTips && (
          <div className="mx-4 mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-700 dark:text-orange-300">💡 {localMenu.cookingTips}</p>
          </div>
        )}

        {/* Meal cards */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {day?.meals.map((meal, i) => {
            const isExpanded = expandedMeal === i;
            const mealIcon = MEAL_ICONS[meal.name] || "🍴";
            return (
              <div key={i} style={{ borderRadius: "16px", background: "white", border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                {/* Meal header - always visible */}
                <button
                  onClick={() => setExpandedMeal(isExpanded ? null : i)}
                  style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  {/* Meal type icon */}
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                    {mealIcon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.05em" }}>{meal.name}</p>
                      {meal.calories && (
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#F97316", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "2px 8px", flexShrink: 0 }}>🔥 {meal.calories} kcal</span>
                      )}
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 600, color: "#1f2937", lineHeight: 1.3 }}>{meal.food}</p>
                    {/* Macros pills */}
                    {(meal.protein || meal.carbs || meal.fat) && (
                      <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                        {meal.protein && <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", borderRadius: "6px", padding: "2px 7px" }}>P {meal.protein}g</span>}
                        {meal.carbs && <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", background: "#fffbeb", borderRadius: "6px", padding: "2px 7px" }}>C {meal.carbs}g</span>}
                        {meal.fat && <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", borderRadius: "6px", padding: "2px 7px" }}>G {meal.fat}g</span>}
                        {meal.prepTime && <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", background: "#f9fafb", borderRadius: "6px", padding: "2px 7px" }}>⏱ {meal.prepTime}</span>}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "16px", color: "#9ca3af", flexShrink: 0, marginTop: "2px", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
                </button>
                {/* Expandable ingredients + replace button */}
                {isExpanded && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f3f4f6" }}>
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <>
                        <p style={{ margin: "10px 0 6px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ingredientes</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                          {meal.ingredients.map((ing, j) => (
                            <span key={j} style={{ fontSize: "12px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "3px 10px", color: "#374151" }}>{ing}</span>
                          ))}
                        </div>
                      </>
                    )}
                    {/* Replace meal button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRequestAlternative(activeDay, i); }}
                      style={{ width: "100%", padding: "10px 16px", background: "#fff7ed", border: "1.5px dashed #fb923c", borderRadius: "10px", color: "#ea580c", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      🔄 Cambiar por alternativa IA
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
                  {applying ? "⏳" : applyToCalendarMutation.isSuccess ? `✅ ${"Applied"}` : "Apply"}
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
                {"Your menu"} <strong>{menu.menuName}</strong> {t("buddyIA.savedInMyMenus", "has been saved in \"My Menus\"")}
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

      {/* ── Replace Meal Modal ───────────────────────────────────────────────────────────────────────── */}
      {replacing !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={handleCancelReplace}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto" }}
          >
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 4, margin: "0 auto 20px" }} />

            <h3 style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 800, color: "#1f2937" }}>Alternativa IA</h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
              Reemplazando: <strong>{localMenu.days[replacing.dayIdx]?.meals[replacing.mealIdx]?.name}</strong> del {localMenu.days[replacing.dayIdx]?.day}
            </p>

            {/* Loading state */}
            {replaceMealMutation.isPending && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ width: 48, height: 48, border: "4px solid #fed7aa", borderTopColor: "#F97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: 600 }}>Generando alternativa...</p>
                <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: 4 }}>Respetando tus alergias y restricciones</p>
              </div>
            )}

            {/* Error state */}
            {altError && !replaceMealMutation.isPending && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                <p style={{ color: "#dc2626", fontSize: "14px", fontWeight: 600, margin: 0 }}>⚠️ {altError}</p>
              </div>
            )}

            {/* Alternative preview */}
            {altMeal && !replaceMealMutation.isPending && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>✨ Alternativa sugerida</span>
                  {altMeal.calories && (
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#F97316", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "2px 8px" }}>🔥 {altMeal.calories} kcal</span>
                  )}
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700, color: "#1f2937", lineHeight: 1.3 }}>{altMeal.food}</p>
                {/* Macros */}
                {(altMeal.protein || altMeal.carbs || altMeal.fat) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {altMeal.protein && <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", borderRadius: 6, padding: "2px 7px" }}>P {altMeal.protein}g</span>}
                    {altMeal.carbs && <span style={{ fontSize: "11px", fontWeight: 700, color: "#d97706", background: "#fffbeb", borderRadius: 6, padding: "2px 7px" }}>C {altMeal.carbs}g</span>}
                    {altMeal.fat && <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", borderRadius: 6, padding: "2px 7px" }}>G {altMeal.fat}g</span>}
                    {altMeal.prepTime && <span style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", background: "#f9fafb", borderRadius: 6, padding: "2px 7px" }}>⏱ {altMeal.prepTime}</span>}
                  </div>
                )}
                {/* Ingredients */}
                {altMeal.ingredients && altMeal.ingredients.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Ingredientes</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {altMeal.ingredients.map((ing, j) => (
                        <span key={j} style={{ fontSize: "11px", background: "white", border: "1px solid #d1fae5", borderRadius: 6, padding: "2px 8px", color: "#374151" }}>{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Reason */}
                {altMeal.reason && (
                  <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#16a34a", fontStyle: "italic" }}>💡 {altMeal.reason}</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {altMeal && !replaceMealMutation.isPending && (
                <button
                  onClick={handleAcceptAlternative}
                  style={{ padding: "13px", background: "#F97316", color: "white", border: "none", borderRadius: 12, fontSize: "15px", fontWeight: 700, cursor: "pointer" }}
                >
                  ✅ Aceptar alternativa
                </button>
              )}
              {!replaceMealMutation.isPending && (
                <button
                  onClick={() => replacing && handleRequestAlternative(replacing.dayIdx, replacing.mealIdx)}
                  style={{ padding: "12px", background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  🔄 Generar otra alternativa
                </button>
              )}
              <button
                onClick={handleCancelReplace}
                style={{ padding: "12px", background: "transparent", color: "#9ca3af", border: "none", borderRadius: 12, fontSize: "14px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main BuddyIA Page ────────────────────────────────────────────────────────
export default function BuddyIA() {
  const { t } = useTranslation();
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
