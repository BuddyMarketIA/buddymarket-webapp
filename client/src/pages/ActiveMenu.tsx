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
  HomeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import MercadonaCartExport from "@/components/MercadonaCartExport";
import LidlCartExport from "@/components/LidlCartExport";
import CarrefourCartExport from "@/components/CarrefourCartExport";

const SUPERMARKETS = [
  { id: "general", name: "General", emoji: "🛒" },
  { id: "mercadona", name: "Mercadona", emoji: "🟠" },
  { id: "lidl", name: "Lidl", emoji: "🔵" },
  { id: "carrefour", name: "Carrefour", emoji: "🔴" },
  { id: "alcampo", name: "Alcampo", emoji: "🟡" },
  { id: "dia", name: "Día", emoji: "🟢" },
  { id: "el_corte_ingles", name: "El Corte Inglés", emoji: "🟤" },
] as const;

const SUPERMARKET_SEARCH_URLS: Record<string, (q: string) => string> = {
  general: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " comprar supermercado")}`,
  lidl: (q) => `https://www.lidl.es/es/buscar.htm?query=${encodeURIComponent(q)}`,
  carrefour: (q) => `https://www.carrefour.es/supermercado/buscar?query=${encodeURIComponent(q)}`,
  alcampo: (q) => `https://www.alcampo.es/compra-online/buscar/?q=${encodeURIComponent(q)}`,
  dia: (q) => `https://www.dia.es/buscar?text=${encodeURIComponent(q)}`,
  el_corte_ingles: (q) => `https://www.elcorteingles.es/supermercado/buscar/?s=${encodeURIComponent(q)}`,
};

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

// ── Inline Mercadona-style list view ─────────────────────────────────────────
interface GeneratedListItem {
  id: number;
  name: string;
  qty?: string;
  unit?: string;
  isPurchased: boolean;
  inPantry?: boolean;
}

interface MercadonaListModalProps {
  items: GeneratedListItem[];
  supermarket: string;
  onClose: () => void;
}

function MercadonaListModal({ items, supermarket, onClose }: MercadonaListModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <MercadonaCartExport
          items={items}
          onBack={onClose}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

// ── Non-Mercadona generic list modal ─────────────────────────────────────────
interface GenericListModalProps {
  items: GeneratedListItem[];
  supermarket: string;
  supermarketName: string;
  onClose: () => void;
}

function GenericListModal({ items, supermarket, supermarketName, onClose }: GenericListModalProps) {
  const utils = trpc.useUtils();
  const [localItems, setLocalItems] = useState<GeneratedListItem[]>(items);
  const togglePantry = trpc.shoppingLists.togglePantry.useMutation({
    onMutate: async ({ id }) => {
      setLocalItems(prev => prev.map(item =>
        item.id === id ? { ...item, inPantry: !item.inPantry } : item
      ));
    },
  });
  const searchFn = SUPERMARKET_SEARCH_URLS[supermarket];
  const pending = localItems.filter((i) => !i.isPurchased && !i.inPantry);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {SUPERMARKETS.find((s) => s.id === supermarket)?.emoji} {supermarketName}
          </h3>
          <button onClick={onClose} className="text-gray-400 text-xl font-bold">×</button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          {pending.length} productos de tu menú. Pulsa en cada uno para buscarlo en {supermarketName}.
        </p>
        {searchFn && (
          <button
            onClick={() => {
              pending.forEach((item, idx) => {
                setTimeout(() => window.open(searchFn(item.name), "_blank"), idx * 400);
              });
              toast.success(`Abriendo ${pending.length} búsquedas en ${supermarketName}`);
            }}
            className="mb-4 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
            style={{ background: "#FF6B35" }}
          >
            <ShoppingCartIcon className="h-4 w-4" />
            Buscar todos los productos ({pending.length})
          </button>
        )}
        {/* In-pantry info hint */}
        {localItems.filter(i => i.inPantry).length === 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-2xl bg-green-50 p-3">
            <HomeIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <p className="text-xs text-green-700"><span className="font-semibold">¿Ya tienes algo en casa?</span> Pulsa 🏠 para marcarlo como en despensa.</p>
          </div>
        )}
        <div className="space-y-2">
          {localItems.filter(i => !i.isPurchased).map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                item.inPantry
                  ? "border-green-200 bg-green-50"
                  : "border-gray-100 hover:border-orange-300 hover:bg-orange-50"
              }`}
            >
              {/* Link to search */}
              <a
                href={!item.inPantry && searchFn ? searchFn(item.name) : undefined}
                onClick={item.inPantry ? (e) => e.preventDefault() : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-3 min-w-0"
              >
                {item.inPantry
                  ? <HomeIcon className="h-4 w-4 shrink-0 text-green-500" />
                  : <ShoppingCartIcon className="h-4 w-4 shrink-0 text-[#FF6B35]" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-medium truncate ${item.inPantry ? "text-green-700" : "text-gray-900"}`}>{item.name}</p>
                    {item.inPantry && <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">despensa</span>}
                  </div>
                  {(item.qty || item.unit) && (
                    <p className="text-xs text-gray-400">{item.qty} {item.unit}</p>
                  )}
                </div>
                {!item.inPantry && (
                  <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
              {/* Pantry toggle */}
              <button
                onClick={() => {
                  togglePantry.mutate({ id: item.id });
                  if (!item.inPantry) toast.success("Marcado como en despensa");
                }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                  item.inPantry ? "bg-green-500 text-white" : "text-gray-300 hover:bg-green-50 hover:text-green-500"
                }`}
                title={item.inPantry ? "Quitar de despensa" : "Marcar como en despensa"}
              >
                <HomeIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {localItems.filter(i => i.inPantry).length > 0 && (
          <p className="mt-3 text-center text-xs text-gray-400">
            {localItems.filter(i => i.inPantry).length} producto(s) marcados como en despensa (no se compran)
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ActiveMenu() {
  const [, navigate] = useLocation();
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>("mercadona");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showMercadonaModal, setShowMercadonaModal] = useState(false);
  const [showLidlModal, setShowLidlModal] = useState(false);
  const [showCarrefourModal, setShowCarrefourModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedListItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingListInfo, setExistingListInfo] = useState<{ id: number; name: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: activeMenu, isLoading } = trpc.menus.getActive.useQuery();

  const generateShoppingList = trpc.shoppingLists.generateFromMenu.useMutation({
    onSuccess: async (data) => {
      setIsGenerating(false);
      // Handle duplicate detection — backend signals requiresConfirmation
      if ((data as any).requiresConfirmation) {
        setExistingListInfo({ id: (data as any).existingListId, name: (data as any).existingListName });
        setShowDuplicateDialog(true);
        return;
      }
      // Fetch the generated list items to show in the modal
      utils.shoppingLists.list.invalidate();
      // Get the list items via getById
      if (data.shoppingListId) {
        try {
          const listData = await utils.shoppingLists.getById.fetch({ id: data.shoppingListId });
          const items: GeneratedListItem[] = (listData as any)?.items?.map((i: any) => ({
            id: i.id,
            name: i.ingredient?.name ?? i.customName ?? i.name ?? "Producto",
            qty: i.amount ? String(Math.round(i.amount * 10) / 10) : "",
            unit: i.measure?.name ?? i.unit ?? "",
            isPurchased: i.isPurchased ?? false,
            inPantry: i.inPantry ?? false,
          })) ?? [];
          setGeneratedItems(items);
          if (selectedSupermarket === "mercadona") {
            setShowMercadonaModal(true);
          } else if (selectedSupermarket === "lidl") {
            setShowLidlModal(true);
          } else if (selectedSupermarket === "carrefour") {
            setShowCarrefourModal(true);
          } else {
            setShowGenericModal(true);
          }
        } catch {
          // Fallback: navigate to shopping lists
          toast.success("¡Lista generada! Redirigiendo...");
          navigate("/app/shopping-lists");
        }
      }
    },
    onError: (err) => {
      setIsGenerating(false);
      toast.error("Error al generar la lista: " + err.message);
    },
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

  const completedDps = (activeMenu.dayParts ?? []).filter((dp: any) => dp.completed).length;
  const progressPct = activeMenu.dayParts?.length ? Math.round((completedDps / activeMenu.dayParts.length) * 100) : 0;

  const handleGenerateList = (replaceExisting = false) => {
    setShowDuplicateDialog(false);
    setIsGenerating(true);
    generateShoppingList.mutate({
      menuId: activeMenu.id,
      persons: activeMenu.persons ?? 1,
      supermarket: selectedSupermarket as any,
      name: `Lista - ${activeMenu.name}`,
      replaceExisting,
    });
  };

  const selectedSupermarketInfo = SUPERMARKETS.find((s) => s.id === selectedSupermarket);

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
                        <img src={r.recipe.imageUrl} alt={r.recipe.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">🍽️</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.recipe?.name ?? "Receta"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.recipe?.preparationTime ? (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <ClockIcon className="h-3 w-3" />{r.recipe.preparationTime}min
                            </span>
                          ) : null}
                          {r.recipe?.caloriesPerServing ? (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                              <FireIcon className="h-3 w-3" />{r.recipe.caloriesPerServing}kcal
                            </span>
                          ) : null}
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

      {/* Shopping list CTA — new design */}
      <div className="rounded-3xl overflow-hidden mb-4 shadow-lg">
        {/* Header */}
        <div className="p-5" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <ShoppingCartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lista de la compra</h3>
              <p className="text-xs text-white/50">Genera los ingredientes de toda la semana</p>
            </div>
          </div>
        </div>

        {/* Supermarket selector */}
        <div className="bg-white px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Elige tu supermercado</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SUPERMARKETS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSupermarket(s.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2"
                style={{
                  background: selectedSupermarket === s.id ? "#FF6B35" : "white",
                  color: selectedSupermarket === s.id ? "white" : "#6b7280",
                  borderColor: selectedSupermarket === s.id ? "#FF6B35" : "#f3f4f6",
                }}
              >
                <span>{s.emoji}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="bg-white px-4 pb-4">
          {/* Mercadona badge */}
          {selectedSupermarket === "mercadona" && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-green-50 border border-green-100 px-3 py-2">
              <span className="text-green-600 text-sm">🟢</span>
              <p className="text-xs text-green-700 font-semibold">
                Integración directa con Mercadona — verás productos reales con foto y precio
              </p>
            </div>
          )}
          <button
            onClick={() => handleGenerateList(false)}
            disabled={isGenerating || generateShoppingList.isPending}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #FF6B35, #f59e0b)", color: "white", boxShadow: "0 4px 16px rgba(255,107,53,0.35)" }}
          >
            {isGenerating || generateShoppingList.isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando lista...
              </>
            ) : (
              <>
                <ShoppingCartIcon className="h-4 w-4" />
                {selectedSupermarket === "mercadona"
                  ? `Generar lista para Mercadona`
                  : `Generar lista${selectedSupermarketInfo ? ` para ${selectedSupermarketInfo.name}` : ""}`}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Change menu link */}
      <button
        onClick={() => navigate("/app/menu-library")}
        className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 bg-white border border-gray-200"
      >
        Cambiar menú activo
      </button>

      {/* Mercadona modal */}
      {showMercadonaModal && generatedItems.length > 0 && (
        <MercadonaListModal
          items={generatedItems}
          supermarket={selectedSupermarket}
          onClose={() => setShowMercadonaModal(false)}
        />
      )}

      {/* Lidl modal */}
      {showLidlModal && generatedItems.length > 0 && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLidlModal(false); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <LidlCartExport
              items={generatedItems}
              onBack={() => setShowLidlModal(false)}
              onClose={() => setShowLidlModal(false)}
            />
          </div>
        </div>
      )}

      {/* Carrefour modal */}
      {showCarrefourModal && generatedItems.length > 0 && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCarrefourModal(false); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <CarrefourCartExport
              items={generatedItems}
              onBack={() => setShowCarrefourModal(false)}
              onClose={() => setShowCarrefourModal(false)}
            />
          </div>
        </div>
      )}

      {/* Generic supermarket modal */}
      {showGenericModal && generatedItems.length > 0 && (
        <GenericListModal
          items={generatedItems}
          supermarket={selectedSupermarket}
          supermarketName={selectedSupermarketInfo?.name ?? selectedSupermarket}
          onClose={() => setShowGenericModal(false)}
        />
      )}

      {/* Duplicate list confirmation dialog */}
      {showDuplicateDialog && existingListInfo && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDuplicateDialog(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ya existe una lista</h3>
              <p className="text-sm text-gray-500">
                Ya tienes una lista de la compra para este menú en <strong>{selectedSupermarketInfo?.name ?? selectedSupermarket}</strong>.
                ¿Qué quieres hacer?
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleGenerateList(true)}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #FF6B35, #f59e0b)" }}
              >
                🔄 Reemplazar lista existente
              </button>
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  navigate("/app/shopping-lists");
                }}
                className="w-full py-3 rounded-2xl font-bold text-sm bg-gray-100 text-gray-700"
              >
                👁 Ver lista existente
              </button>
              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="w-full py-2 text-sm text-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
