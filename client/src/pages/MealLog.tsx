import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const MEAL_TYPES = [
  { key: "breakfast", label: "Desayuno", emoji: "🌅" },
  { key: "lunch", label: "Almuerzo", emoji: "☀️" },
  { key: "dinner", label: "Cena", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍎" },
];

export default function MealLog() {
  const [dateOffset, setDateOffset] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [mealType, setMealType] = useState("lunch");
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [servings, setServings] = useState("1");

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toISOString().split("T")[0];
  }, [dateOffset]);

  const { data: logs, isLoading } = trpc.mealLogs.list.useQuery({
    startDate: selectedDate,
    endDate: selectedDate,
  });
  const { data: summary } = trpc.mealLogs.dailySummary.useQuery({ date: selectedDate });
  const { data: dayParts } = trpc.catalogs.dayParts.useQuery();
  const utils = trpc.useUtils();

  const addLog = trpc.mealLogs.add.useMutation({
    onSuccess: () => {
      utils.mealLogs.list.invalidate({ startDate: selectedDate, endDate: selectedDate });
      utils.mealLogs.dailySummary.invalidate({ date: selectedDate });
      setShowAdd(false);
      setMealName("");
      setCalories("");
      setProteins("");
      setCarbs("");
      setFats("");
      toast.success("Comida registrada");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeLog = trpc.mealLogs.remove.useMutation({
    onSuccess: () => {
      utils.mealLogs.list.invalidate({ startDate: selectedDate, endDate: selectedDate });
      utils.mealLogs.dailySummary.invalidate({ date: selectedDate });
      toast.success("Registro eliminado");
    },
  });

  const isToday = dateOffset === 0;
  const dateLabel = isToday
    ? "Hoy"
    : dateOffset === -1
    ? "Ayer"
    : new Date(selectedDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  const totalCals = (summary as any)?.calories ?? 0;
  const targetCals = 2000;
  const calPct = Math.min(100, Math.round((totalCals / targetCals) * 100));

  // Group by day part
  const grouped: Record<string, any[]> = {};
  (logs ?? []).forEach((log: any) => {
    const part = log.dayPart?.nameEs ?? "Comida";
    if (!grouped[part]) grouped[part] = [];
    grouped[part].push(log);
  });

  return (
    <div className="vively-page container">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Diario</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00D27A] shadow-sm"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Date navigation */}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => setDateOffset((o) => o - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold capitalize text-gray-800">{dateLabel}</span>
        <button
          onClick={() => setDateOffset((o) => Math.min(0, o + 1))}
          disabled={isToday}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Calorie summary card */}
      <div className="vively-card mb-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">Calorías del día</span>
          <span className="text-lg font-bold text-[#00D27A]">{Math.round(totalCals)} kcal</span>
        </div>
        <div className="macro-bar mb-1">
          <div className="macro-bar-fill" style={{ width: `${calPct}%`, background: "#00D27A" }} />
        </div>
        <p className="text-right text-xs text-gray-400">Objetivo: {targetCals} kcal</p>

        {(summary as any)?.proteins !== undefined && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-base font-bold text-blue-500">{Math.round((summary as any).proteins ?? 0)}g</p>
              <p className="text-xs text-gray-400">Proteína</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-orange-500">{Math.round((summary as any).carbohydrates ?? 0)}g</p>
              <p className="text-xs text-gray-400">Carbos</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-yellow-500">{Math.round((summary as any).fats ?? 0)}g</p>
              <p className="text-xs text-gray-400">Grasas</p>
            </div>
          </div>
        )}
      </div>

      {/* Meal logs by type */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="vively-card animate-pulse h-20" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <span className="mb-4 text-5xl">📋</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">Sin registros para hoy</h3>
          <p className="mb-6 text-sm text-gray-500">Registra tus comidas para hacer seguimiento nutricional</p>
          <button onClick={() => setShowAdd(true)} className="btn-vively">Registrar comida</button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([part, partLogs]) => (
            <div key={part} className="vively-card">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{part}</h3>
              <div className="space-y-1.5">
                {partLogs.map((log: any) => (
                  <div key={log.log.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-gray-800">
                        {log.recipe?.name ?? log.log.customMealName ?? "Comida"}
                      </span>
                      {log.log.calories && (
                        <span className="ml-2 text-xs text-gray-400">{Math.round(log.log.calories)} kcal</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeLog.mutate({ id: log.log.id })}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add log modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Registrar comida</h3>
            <div className="space-y-3">
              <input
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="¿Qué comiste? (ej: Ensalada de pollo)"
                className="vively-input"
              />
              <select
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="vively-input"
              >
                {dayParts?.map((dp) => (
                  <option key={dp.id} value={String(dp.id)}>{dp.nameEs}</option>
                )) ?? (
                  <>
                    <option value="1">Desayuno</option>
                    <option value="2">Almuerzo</option>
                    <option value="3">Merienda</option>
                    <option value="4">Cena</option>
                  </>
                )}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calorías (kcal)" className="vively-input" />
                <input type="number" value={proteins} onChange={(e) => setProteins(e.target.value)} placeholder="Proteínas (g)" className="vively-input" />
                <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbohidratos (g)" className="vively-input" />
                <input type="number" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="Grasas (g)" className="vively-input" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!mealName.trim()) { toast.error("El nombre es obligatorio"); return; }
                  addLog.mutate({
                    customMealName: mealName.trim(),
                    logDate: selectedDate,
                    dayPartId: Number(servings) || 1,
                    servings: 1,
                    calories: calories ? Number(calories) : undefined,
                    proteins: proteins ? Number(proteins) : undefined,
                    carbohydrates: carbs ? Number(carbs) : undefined,
                    fats: fats ? Number(fats) : undefined,
                  });
                }}
                disabled={addLog.isPending}
                className="flex-1 btn-vively"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vively-disclaimer">
        <p>VIVELY no constituye recomendaciones profesionales de nutrición.</p>
      </div>
    </div>
  );
}
