import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeGate } from "@/components/UpgradeGate";

// ─── Types ────────────────────────────────────────────────────────────────────
type CategoryKey =
  | "embarazada" | "lactancia" | "vegano" | "vegetariano" | "celiaco"
  | "diabetico" | "hipertension" | "colesterol" | "renal" | "cancer"
  | "acatarrado" | "gastritis" | "reflujo" | "intestino_irritable"
  | "anemia" | "hipotiroidismo" | "osteoporosis" | "gota"
  | "nino_6_12" | "adolescente" | "mayor_65" | "deportista"
  | "perdida_peso_medica" | "preoperatorio" | "postoperatorio";

interface CategoryDef {
  key: CategoryKey;
  label: string;
  emoji: string;
  group: string;
  color: string;
}

interface GeneratedMeal {
  name: string;
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  nutritionNote?: string;
}

interface GeneratedDay {
  day: string;
  totalCalories: number;
  meals: GeneratedMeal[];
}

interface GeneratedMenu {
  menuTitle: string;
  targetProfile: string;
  keyNutrients: string[];
  avoidList: string[];
  generalTips: string[];
  days: GeneratedDay[];
}

// ─── Catalog ──────────────────────────────────────────────────────────────────
const CATEGORIES: CategoryDef[] = [
  // Etapas vitales
  { key: "embarazada",         label: "Embarazada",           emoji: "🤰", group: "Etapas vitales", color: "bg-pink-50 border-pink-200 text-pink-800" },
  { key: "lactancia",          label: "Lactancia",            emoji: "👶", group: "Etapas vitales", color: "bg-pink-50 border-pink-200 text-pink-800" },
  { key: "nino_6_12",          label: "Niños 6-12 años",      emoji: "🧒", group: "Etapas vitales", color: "bg-pink-50 border-pink-200 text-pink-800" },
  { key: "adolescente",        label: "Adolescentes",         emoji: "🧑", group: "Etapas vitales", color: "bg-pink-50 border-pink-200 text-pink-800" },
  { key: "mayor_65",           label: "Mayores de 65",        emoji: "👴", group: "Etapas vitales", color: "bg-pink-50 border-pink-200 text-pink-800" },
  // Estilos de vida
  { key: "vegano",             label: "Vegano",               emoji: "🌱", group: "Estilo de vida", color: "bg-green-50 border-green-200 text-green-800" },
  { key: "vegetariano",        label: "Vegetariano",          emoji: "🥦", group: "Estilo de vida", color: "bg-green-50 border-green-200 text-green-800" },
  { key: "deportista",         label: "Deportista",           emoji: "🏋️", group: "Estilo de vida", color: "bg-green-50 border-green-200 text-green-800" },
  { key: "perdida_peso_medica",label: "Pérdida de peso",      emoji: "⚖️", group: "Estilo de vida", color: "bg-green-50 border-green-200 text-green-800" },
  // Condiciones médicas
  { key: "celiaco",            label: "Celíaco / Sin gluten", emoji: "🌾", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "diabetico",          label: "Diabético",            emoji: "🩺", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "hipertension",       label: "Hipertensión",         emoji: "❤️", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "colesterol",         label: "Colesterol alto",      emoji: "🫀", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "renal",              label: "Enfermedad renal",     emoji: "🫘", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "anemia",             label: "Anemia",               emoji: "🩸", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "hipotiroidismo",     label: "Hipotiroidismo",       emoji: "🦋", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "osteoporosis",       label: "Osteoporosis",         emoji: "🦴", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "gota",               label: "Gota",                 emoji: "🦶", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  { key: "cancer",             label: "Apoyo oncológico",     emoji: "🎗️", group: "Condiciones médicas", color: "bg-amber-50 border-amber-200 text-amber-800" },
  // Digestivo
  { key: "gastritis",          label: "Gastritis",            emoji: "🫃", group: "Digestivo", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { key: "reflujo",            label: "Reflujo",              emoji: "🔥", group: "Digestivo", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { key: "intestino_irritable",label: "Intestino irritable",  emoji: "💙", group: "Digestivo", color: "bg-blue-50 border-blue-200 text-blue-800" },
  // Recuperación
  { key: "acatarrado",         label: "Resfriado / Gripe",    emoji: "🤧", group: "Recuperación", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { key: "preoperatorio",      label: "Pre-operatorio",       emoji: "🏥", group: "Recuperación", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { key: "postoperatorio",     label: "Post-operatorio",      emoji: "💊", group: "Recuperación", color: "bg-purple-50 border-purple-200 text-purple-800" },
];

const GROUPS = ["Etapas vitales", "Estilo de vida", "Condiciones médicas", "Digestivo", "Recuperación"];

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SpecializedMenus() {
  const { user } = useAuth();
  const { can } = usePlan();

  const [selectedCategory, setSelectedCategory] = useState<CategoryDef | null>(null);
  const [days, setDays] = useState(7);
  const [persons, setPersons] = useState(1);
  const [extraNotes, setExtraNotes] = useState("");
  const [generatedMenu, setGeneratedMenu] = useState<GeneratedMenu | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [view, setView] = useState<"catalog" | "config" | "result">("catalog");

  const generateMutation = trpc.specializedMenus.generate.useMutation({
    onSuccess: (data) => {
      if (data.menu) {
        setGeneratedMenu(data.menu as GeneratedMenu);
        setActiveDay(0);
        setView("result");
      } else {
        toast.error(data.error || "No se pudo generar el menú.");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSelectCategory = (cat: CategoryDef) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setSelectedCategory(cat);
    setView("config");
  };

  const handleGenerate = () => {
    if (!selectedCategory) return;
    generateMutation.mutate({
      category: selectedCategory.key,
      days,
      persons,
      extraNotes: extraNotes.trim() || undefined,
    });
  };

  // ── Plan gate ──────────────────────────────────────────────────────────────
  if (!can("canAccessSpecializedMenus")) {
    return (
      <AppLayout title="Menús Especializados" showBack>
        <div className="max-w-2xl mx-auto px-4 pb-24">
          {/* Hero */}
          <div className="py-6 text-center">
            <div className="text-4xl mb-2">🏥</div>
            <h1 className="text-2xl font-bold text-gray-900">Menús Especializados</h1>
            <p className="text-gray-500 text-sm mt-1">
              Menús generados por IA adaptados a tu condición médica o estilo de vida
            </p>
          </div>

          {/* Blurred preview of categories */}
          <div className="relative mb-6">
            <div className="blur-sm pointer-events-none select-none opacity-60">
              {GROUPS.slice(0, 3).map((group) => {
                const cats = CATEGORIES.filter((c) => c.group === group);
                return (
                  <div key={group} className="mb-4">
                    <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-2 px-1">{group}</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {cats.slice(0, 4).map((cat) => (
                        <div key={cat.key} className={`flex items-center gap-3 rounded-2xl border p-3 ${cat.color}`}>
                          <span className="text-2xl">{cat.emoji}</span>
                          <span className="text-sm font-semibold">{cat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-white/95 rounded-3xl shadow-xl border-2 border-orange-200 p-6 mx-4 text-center max-w-xs">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">Función Pro</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Accede a <strong>24 menús especializados</strong> para embarazo, diabetes, celiaquía, deportistas y mucho más
                </p>
                <div className="space-y-2 mb-4 text-left">
                  {["🤰 Embarazo y lactancia", "🩺 Diabetes e hipertensión", "🌱 Vegano y vegetariano", "🏋️ Deportistas", "🎗️ Apoyo oncológico"].map((f, i) => (
                    <div key={i} className="text-xs text-gray-600 flex items-center gap-2">
                      <span>{f}</span>
                    </div>
                  ))}
                  <div className="text-xs text-gray-400 italic">...y 19 más</div>
                </div>
                <a href="/app/subscription?plan=basic" className="block w-full py-3 rounded-xl bg-[#F97316] text-white text-sm font-extrabold hover:bg-[#ea6c0a] transition-all shadow-md text-center">
                  Activar Pro por 9,99€/mes →
                </a>
                <p className="text-xs text-gray-400 mt-2">Sin permanencia · Cancela cuando quieras</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Catalog view ─────────────────────────────────────────────────────────────
  if (view === "catalog") {
    return (
      <AppLayout title="Menús Especializados" showBack>
        <div className="max-w-2xl mx-auto px-4 pb-24">
          {/* Header */}
          <div className="py-6 text-center">
            <div className="text-4xl mb-2">🏥</div>
            <h1 className="text-2xl font-bold text-gray-900">Menús Especializados</h1>
            <p className="text-gray-500 text-sm mt-1">
              Menús generados por IA adaptados a tu condición médica o estilo de vida
            </p>
          </div>

          {/* Categories by group */}
          {GROUPS.map((group) => {
            const cats = CATEGORIES.filter((c) => c.group === group);
            return (
              <div key={group} className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                  {group}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {cats.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleSelectCategory(cat)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${cat.color}`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-sm font-medium leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Disclaimer */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
            <strong>Aviso importante:</strong> Los menús generados son orientativos y no sustituyen el consejo de un profesional sanitario. Consulta siempre con tu médico o dietista antes de realizar cambios en tu alimentación, especialmente si tienes una condición médica.
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Config view ───────────────────────────────────────────────────────────────
  if (view === "config" && selectedCategory) {
    return (
      <AppLayout
        title="Configurar menú"
        showBack
        onBack={() => setView("catalog")}
      >
        <div className="max-w-lg mx-auto px-4 pb-24">
          {/* Selected category badge */}
          <div className={`mt-6 mb-6 flex items-center gap-3 p-4 rounded-2xl border ${selectedCategory.color}`}>
            <span className="text-3xl">{selectedCategory.emoji}</span>
            <div>
              <div className="font-bold text-base">{selectedCategory.label}</div>
              <div className="text-xs opacity-70">{selectedCategory.group}</div>
            </div>
          </div>

          {/* Days */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de días
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 3, 5, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    days === d
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
                  }`}
                >
                  {d} {d === 1 ? "día" : "días"}
                </button>
              ))}
            </div>
          </div>

          {/* Persons */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de personas
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPersons(Math.max(1, persons - 1))}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="text-2xl font-bold text-gray-900 w-8 text-center">{persons}</span>
              <button
                onClick={() => setPersons(Math.min(10, persons + 1))}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Extra notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notas adicionales <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Ej: también soy intolerante a la lactosa, no me gusta el pescado azul..."
              maxLength={500}
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <div className="text-right text-xs text-gray-400 mt-1">{extraNotes.length}/500</div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 text-base font-semibold"
          >
            {generateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Generando menú personalizado...
              </span>
            ) : (
              "✨ Generar menú con IA"
            )}
          </Button>

          {generateMutation.isPending && (
            <p className="text-center text-xs text-gray-400 mt-3">
              La IA está creando tu menú especializado. Puede tardar unos segundos...
            </p>
          )}
        </div>
      </AppLayout>
    );
  }

  // ── Result view ───────────────────────────────────────────────────────────────
  if (view === "result" && generatedMenu && selectedCategory) {
    const currentDay = generatedMenu.days?.[activeDay];

    return (
      <AppLayout
        title={generatedMenu.menuTitle || "Menú generado"}
        showBack
        onBack={() => setView("config")}
      >
        <div className="max-w-2xl mx-auto px-4 pb-28">
          {/* Profile badge */}
          <div className={`mt-4 mb-4 flex items-center gap-3 p-3 rounded-xl border ${selectedCategory.color}`}>
            <span className="text-2xl">{selectedCategory.emoji}</span>
            <div>
              <div className="font-semibold text-sm">{generatedMenu.targetProfile || selectedCategory.label}</div>
              <div className="text-xs opacity-70">{days} días · {persons} persona{persons > 1 ? "s" : ""}</div>
            </div>
          </div>

          {/* Key nutrients */}
          {generatedMenu.keyNutrients?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nutrientes clave</h3>
              <div className="flex flex-wrap gap-2">
                {generatedMenu.keyNutrients.map((n, i) => (
                  <Badge key={i} className="bg-green-100 text-green-800 border-green-200 text-xs">{n}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Avoid list */}
          {generatedMenu.avoidList?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Alimentos a evitar</h3>
              <div className="flex flex-wrap gap-2">
                {generatedMenu.avoidList.map((a, i) => (
                  <Badge key={i} className="bg-red-100 text-red-800 border-red-200 text-xs">{a}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* General tips */}
          {generatedMenu.generalTips?.length > 0 && (
            <div className="mb-5 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <h3 className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2">Consejos nutricionales</h3>
              <ul className="space-y-1">
                {generatedMenu.generalTips.map((tip, i) => (
                  <li key={i} className="text-sm text-orange-900 flex gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Day selector */}
          {generatedMenu.days?.length > 1 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Día</h3>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {generatedMenu.days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDay(i)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      activeDay === i
                        ? "bg-orange-500 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
                    }`}
                  >
                    {d.day || DAY_NAMES[i] || `Día ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day meals */}
          {currentDay && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-base">
                  {currentDay.day || DAY_NAMES[activeDay] || `Día ${activeDay + 1}`}
                </h3>
                {currentDay.totalCalories > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {currentDay.totalCalories} kcal
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {currentDay.meals?.map((meal, mi) => (
                  <div key={mi} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                        {meal.name}
                      </span>
                      {meal.calories > 0 && (
                        <span className="text-xs text-gray-400 flex-shrink-0">{meal.calories} kcal</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{meal.food}</p>

                    {/* Macros */}
                    {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
                      <div className="flex gap-3 mt-2">
                        {meal.protein > 0 && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            P: {meal.protein}g
                          </span>
                        )}
                        {meal.carbs > 0 && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            HC: {meal.carbs}g
                          </span>
                        )}
                        {meal.fat > 0 && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            G: {meal.fat}g
                          </span>
                        )}
                      </div>
                    )}

                    {/* Nutrition note */}
                    {meal.nutritionNote && (
                      <p className="text-xs text-gray-400 mt-2 italic">{meal.nutritionNote}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => { setView("config"); setGeneratedMenu(null); }}
              variant="outline"
              className="flex-1 rounded-xl border-gray-200"
            >
              Regenerar
            </Button>
            <Button
              onClick={() => setView("catalog")}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            >
              Otro perfil
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
            <strong>Aviso médico:</strong> Este menú es orientativo y ha sido generado por IA. No sustituye el diagnóstico ni el tratamiento de un profesional sanitario. Consulta siempre con tu médico o dietista.
          </div>
        </div>
      </AppLayout>
    );
  }

  return null;
}
