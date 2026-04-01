import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const MEAL_TYPES = [
  { key: "breakfast", label: "Desayuno", emoji: "🌅" },
  { key: "lunch", label: "Almuerzo", emoji: "☀️" },
  { key: "dinner", label: "Cena", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍎" },
];

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function getWeekDates(baseDate: Date) {
  const dow = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function Menus() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [menuName, setMenuName] = useState("");
  const [aiObjective, setAiObjective] = useState("");
  const [generating, setGenerating] = useState(false);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const startDate = useMemo(() => weekDates[0].toISOString().split("T")[0], [weekDates]);
  const endDate = useMemo(() => weekDates[6].toISOString().split("T")[0], [weekDates]);

  const { data: menus, refetch } = trpc.menus.list.useQuery();
  // Note: getItems not available, we'll use list and filter client-side
  const { data: menuItemsRaw, refetch: refetchItems } = trpc.menus.list.useQuery();

  const utils = trpc.useUtils();
  const createMenu = trpc.menus.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNewMenu(false);
      setMenuName("");
      toast.success("Menú creado");
    },
  });
  const removeItem = trpc.menus.removeRecipeFromDayPart.useMutation({
    onSuccess: () => { refetchItems(); toast.success("Receta eliminada del menú"); },
  });
  const generateAI = trpc.menus.generateWithAI.useMutation({
    onSuccess: () => {
      refetchItems();
      setGenerating(false);
      setShowAI(false);
      toast.success("¡Menú generado con IA!");
    },
    onError: () => { setGenerating(false); toast.error("Error al generar el menú"); },
  });

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  // No per-day items endpoint available, show empty state
  const selectedItems: any[] = [];

  const handleGenerateAI = () => {
    if (!menus || menus.length === 0) {
      toast.error("Crea un menú primero");
      return;
    }
    setGenerating(true);
    generateAI.mutate({
      objective: aiObjective || undefined,
      days: 7,
      mealsPerDay: 4,
    });
  };

  return (
    <div className="vively-page container">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Menús</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-100"
          >
            <SparklesIcon className="h-4 w-4" />
            IA
          </button>
          <button
            onClick={() => setShowNewMenu(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00D27A] shadow-sm"
          >
            <PlusIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {weekDates[0].getDate()} – {weekDates[6].getDate()} {MONTHS_ES[weekDates[6].getMonth()]}
        </span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Day selector */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {weekDates.map((date) => {
          const dateStr = date.toISOString().split("T")[0];
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          const hasItems = false; // items loaded per-day

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(date)}
              className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-2 transition-all ${
                isSelected
                  ? "bg-[#00D27A] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="text-[10px] font-medium">{DAYS_ES[date.getDay()]}</span>
              <span className={`text-base font-bold ${isToday && !isSelected ? "text-[#00D27A]" : ""}`}>
                {date.getDate()}
              </span>
              {hasItems && (
                <div className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[#00D27A]"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day meals */}
      <div className="mb-4">
        <h2 className="mb-3 text-sm font-bold text-gray-700">
          {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </h2>

          {MEAL_TYPES.map((mealType) => {
          const items: any[] = [];
          return (
            <div key={mealType.key} className="vively-card mb-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{mealType.emoji}</span>
                  <span className="text-sm font-semibold text-gray-800">{mealType.label}</span>
                </div>
                <span className="text-xs text-gray-400">{items.length} receta{items.length !== 1 ? "s" : ""}</span>
              </div>

              {items.length === 0 ? (
                <p className="text-xs italic text-gray-400">Sin recetas asignadas</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🍳</span>
                        <span className="text-sm font-medium text-gray-800">
                          {(item as any).recipe?.name ?? "Receta eliminada"}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem.mutate({ menuOrganizerDayPartId: item.dayPartId ?? 0, recipeId: item.recipeId ?? 0 })}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showNewMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Nuevo menú</h3>
            <input
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="Nombre del menú (ej: Semana saludable)"
              className="vively-input mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewMenu(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
                createMenu.mutate({ name: menuName || "Mi menú", startDate: today, endDate: nextWeek });
              }}
                disabled={createMenu.isPending}
                className="flex-1 btn-vively"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {showAI && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Generar menú con IA</h3>
            <p className="mb-4 text-xs text-gray-500">La IA creará recetas basadas en tus preferencias</p>
            <input
              value={aiObjective}
              onChange={(e) => setAiObjective(e.target.value)}
              placeholder="Objetivo (ej: perder peso, dieta mediterránea...)"
              className="vively-input mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAI(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={generating}
                className="flex-1 btn-vively"
              >
                {generating ? "Generando..." : "Generar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vively-disclaimer">
        <p>Los menús generados por IA son orientativos. Consulta con un nutricionista.</p>
      </div>
    </div>
  );
}
