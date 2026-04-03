import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  ShoppingCartIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const SUPERMARKETS = [
  { id: "general", name: "General", emoji: "🛒" },
  { id: "mercadona", name: "Mercadona", emoji: "🟠" },
  { id: "lidl", name: "Lidl", emoji: "🔵" },
  { id: "carrefour", name: "Carrefour", emoji: "🔴" },
  { id: "alcampo", name: "Alcampo", emoji: "🟡" },
  { id: "dia", name: "Día", emoji: "🟢" },
  { id: "el_corte_ingles", name: "El Corte Inglés", emoji: "🟤" },
] as const;

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MEAL_ORDER = ["desayuno", "almuerzo", "comida", "merienda", "cena", "snack"];

function getMealIcon(key: string) {
  const icons: Record<string, string> = {
    desayuno: "☀️", almuerzo: "🥐", comida: "🍽️",
    merienda: "🍎", cena: "🌙", snack: "🥜",
  };
  return icons[key] ?? "🍴";
}

function groupByDay(dayParts: any[]) {
  const groups: Record<number, any[]> = {};
  for (const dp of dayParts) {
    const day = dp.dayNumber ?? 1;
    if (!groups[day]) groups[day] = [];
    groups[day].push(dp);
  }
  return groups;
}

export default function ActiveMenu() {
  const [, navigate] = useLocation();
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>("general");
  const [showSupermarketPicker, setShowSupermarketPicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: activeMenu, isLoading } = trpc.menus.getActive.useQuery();

  const generateShoppingList = trpc.shoppingLists.generateFromMenu.useMutation({
    onSuccess: (data) => {
      toast.success("¡Lista de la compra generada!");
      utils.shoppingLists.list.invalidate();
      navigate("/app/shopping-lists");
    },
    onError: (err) => toast.error("Error al generar la lista: " + err.message),
  });
  const confirmDayPart = trpc.menus.confirmDayPart.useMutation({
    onSuccess: (data, vars) => {
      if (vars.undo) {
        toast.success("Comida desmarcada del diario");
      } else {
        toast.success(data.logsCreated > 0 ? `✅ ${data.logsCreated} receta(s) añadidas al diario` : "✅ Comida confirmada");
      }
      utils.menus.getActive.invalidate();
      utils.mealLogs.dailySummary.invalidate();
    },
    onError: (err) => toast.error("Error: " + err.message),
  });

  if (isLoading) {
    return (
      <div className="vively-page">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-2xl bg-gray-100" />
          <div className="h-48 rounded-2xl bg-gray-100" />
          <div className="h-48 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!activeMenu) {
    return (
      <div className="vively-page flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="text-5xl">📋</div>
        <h2 className="text-xl font-bold text-gray-800">No tienes ningún menú activo</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Ve a la biblioteca de menús, elige uno y guárdalo para activarlo como tu menú en curso.
        </p>
        <button
          onClick={() => navigate("/app/menu-library")}
          className="mt-2 px-6 py-3 rounded-2xl bg-[#FF6B35] text-white font-bold text-sm"
        >
          Ir a la biblioteca de menús
        </button>
      </div>
    );
  }

  const dayGroups = groupByDay(activeMenu.dayParts ?? []);
  const totalDays = Object.keys(dayGroups).length;
  const allDayNumbers = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

  // Calculate week dates from startDate
  const startDate = activeMenu.startDate ? new Date(activeMenu.startDate) : new Date();

  function getDayDate(dayNumber: number) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayNumber - 1);
    return d;
  }

  function isToday(dayNumber: number) {
    const d = getDayDate(dayNumber);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  const activeDayNum = selectedDay ?? (allDayNumbers.find(isToday) ?? allDayNumbers[0]);
  const activeDayParts = (dayGroups[activeDayNum] ?? []).sort((a: any, b: any) => {
    const ai = MEAL_ORDER.indexOf(a.dayPartInfo?.apiParam ?? "");
    const bi = MEAL_ORDER.indexOf(b.dayPartInfo?.apiParam ?? "");
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const totalRecipes = (activeMenu.dayParts ?? []).reduce((sum: number, dp: any) => sum + (dp.recipes?.length ?? 0), 0);
  const completedDps = (activeMenu.dayParts ?? []).filter((dp: any) => dp.completed).length;
  const progressPct = activeMenu.dayParts?.length ? Math.round((completedDps / activeMenu.dayParts.length) * 100) : 0;

  return (
    <div className="vively-page pb-24">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/app/menus")} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-wide">Menú en curso</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 truncate">{activeMenu.name}</h1>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="vively-card p-3 text-center">
            <CalendarDaysIcon className="h-5 w-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{totalDays}</p>
            <p className="text-xs text-gray-500">días</p>
          </div>
          <div className="vively-card p-3 text-center">
            <FireIcon className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{activeMenu.dailyCalories ?? "—"}</p>
            <p className="text-xs text-gray-500">kcal/día</p>
          </div>
          <div className="vively-card p-3 text-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{progressPct}%</p>
            <p className="text-xs text-gray-500">completado</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="vively-card p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Progreso semanal</span>
            <span className="text-sm text-gray-500">{completedDps}/{activeMenu.dayParts?.length ?? 0} comidas</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #FF6B35, #f59e0b)" }}
            />
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {allDayNumbers.map((dayNum) => {
          const date = getDayDate(dayNum);
          const today = isToday(dayNum);
          const active = dayNum === activeDayNum;
          const dayDps = dayGroups[dayNum] ?? [];
          const allDone = dayDps.length > 0 && dayDps.every((dp: any) => dp.completed);
          return (
            <button
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl transition-all"
              style={{
                background: active ? "#FF6B35" : today ? "#fff7f4" : "white",
                border: today && !active ? "2px solid #FF6B35" : "2px solid transparent",
                boxShadow: active ? "0 4px 12px rgba(255,107,53,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
                minWidth: "52px",
              }}
            >
              <span className="text-xs font-bold" style={{ color: active ? "white" : "#6b7280" }}>
                {DAY_NAMES[(date.getDay() + 6) % 7]}
              </span>
              <span className="text-base font-extrabold" style={{ color: active ? "white" : "#1f2937" }}>
                {date.getDate()}
              </span>
              {allDone && <CheckCircleSolid className="h-3.5 w-3.5 mt-0.5" style={{ color: active ? "rgba(255,255,255,0.8)" : "#22c55e" }} />}
              {!allDone && today && <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Day meals */}
      <div className="space-y-3 mb-6">
        {activeDayParts.length === 0 ? (
          <div className="vively-card p-6 text-center">
            <p className="text-gray-400 text-sm">No hay comidas planificadas para este día</p>
          </div>
        ) : (
          activeDayParts.map((dp: any) => (
            <div
              key={dp.id}
              className="vively-card p-4"
              style={{ borderLeft: dp.completed ? "3px solid #22c55e" : "3px solid #e5e7eb" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getMealIcon(dp.dayPartInfo?.apiParam ?? "")}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {dp.dayPartInfo?.nameEs ?? dp.dayPartInfo?.apiParam ?? "Comida"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const logDate = getDayDate(activeDayNum).toISOString().split("T")[0];
                    confirmDayPart.mutate({ dayPartId: dp.id, logDate, undo: dp.completed });
                  }}
                  disabled={confirmDayPart.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: dp.completed ? "#dcfce7" : "#FF6B35",
                    color: dp.completed ? "#16a34a" : "white",
                  }}
                >
                  {dp.completed ? (
                    <><CheckCircleSolid className="h-3.5 w-3.5" />Confirmado</>
                  ) : (
                    <><PlayIcon className="h-3.5 w-3.5" />Confirmar</>
                  )}
                </button>
              </div>
              {dp.recipes?.length > 0 ? (
                <div className="space-y-2">
                  {dp.recipes.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-3 py-1">
                      {r.recipe?.imageUrl ? (
                        <img src={r.recipe.imageUrl} alt={r.recipe.nameEs} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">🍽️</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.recipe?.nameEs ?? "Receta"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.recipe?.prepTime && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <ClockIcon className="h-3 w-3" />{r.recipe.prepTime}min
                            </span>
                          )}
                          {r.recipe?.calories && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <FireIcon className="h-3 w-3" />{r.recipe.calories}kcal
                            </span>
                          )}
                          {r.servings && r.servings !== 1 && (
                            <span className="text-xs text-gray-400">×{r.servings}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Sin recetas asignadas</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Shopping list CTA */}
      <div className="vively-card p-5 mb-4" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <ShoppingCartIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white mb-1">Lista de la compra</h3>
            <p className="text-xs text-white/60 mb-3">
              Genera la lista completa de ingredientes para toda la semana, organizada por categorías.
            </p>
            {/* Supermarket selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
              {SUPERMARKETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSupermarket(s.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: selectedSupermarket === s.id ? "#FF6B35" : "rgba(255,255,255,0.1)",
                    color: selectedSupermarket === s.id ? "white" : "rgba(255,255,255,0.6)",
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                generateShoppingList.mutate({
                  menuId: activeMenu.id,
                  persons: activeMenu.persons ?? 1,
                  supermarket: selectedSupermarket as any,
                  name: `Lista - ${activeMenu.name}`,
                });
              }}
              disabled={generateShoppingList.isPending}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
              style={{ background: "#FF6B35", color: "white" }}
            >
              {generateShoppingList.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generando lista...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCartIcon className="h-4 w-4" />
                  Generar lista de la compra
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Change menu link */}
      <button
        onClick={() => navigate("/app/menu-library")}
        className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 bg-white border border-gray-200"
      >
        Cambiar menú activo
      </button>
    </div>
  );
}
