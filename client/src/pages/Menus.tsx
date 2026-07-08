import React, { useState, useMemo, useEffect, useRef } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { getErrorMessage } from "@/lib/errorUtils";
import { getLocalDateString } from "@/lib/utils";
import MenuPreviewModal from "@/components/MenuPreviewModal";
import { toast } from "@/components/sonner-a11y-shim";
import { Link, useLocation } from "wouter";
import { usePlan } from "@/hooks/usePlan";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  SparklesIcon,
  CalendarDaysIcon,
  PencilIcon,
  PlayIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  StarIcon,
  ClockIcon,
  FireIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

// ─── Helpers ────────────────────────────────────────────────────────────────

const MEAL_TYPE_KEYS = [
  { key: "breakfast", tKey: "mealLog.breakfast", emoji: "🌅", apiParam: "breakfast", label: "Desayuno" },
  { key: "lunch",     tKey: "mealLog.lunch",     emoji: "☀️", apiParam: "lunch",      label: "Almuerzo" },
  { key: "snack",     tKey: "mealLog.snack",     emoji: "🍎", apiParam: "snack",      label: "Merienda" },
  { key: "dinner",    tKey: "mealLog.dinner",    emoji: "🌙", apiParam: "dinner",     label: "Cena"     },
];

const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getWeekDates(baseDate: Date) {
  const dow    = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getGoalLabel(goal: string) {
  const map: Record<string, string> = {
    perdida_peso: "Pérdida de peso", ganancia_muscular: "Ganancia muscular",
    definicion: "Definición", dieta_equilibrada: "Equilibrado", rendimiento: "Rendimiento",
    bienestar: "Bienestar", vegano: "Vegano", tonificacion: "Tonificación",
    mantenimiento: "Mantenimiento", mediterraneo: "Mediterráneo",
  };
  return map[goal] ?? goal;
}

function getGoalColor(goal: string) {
  const map: Record<string, string> = {
    perdida_peso: "bg-blue-100 text-blue-700", ganancia_muscular: "bg-purple-100 text-purple-700",
    definicion: "bg-indigo-100 text-indigo-700", dieta_equilibrada: "bg-green-100 text-green-700",
    rendimiento: "bg-yellow-100 text-yellow-700", bienestar: "bg-teal-100 text-teal-700",
    vegano: "bg-emerald-100 text-emerald-700", tonificacion: "bg-pink-100 text-pink-700",
    mantenimiento: "bg-orange-100 text-orange-700", mediterraneo: "bg-amber-100 text-amber-700",
  };
  return map[goal] ?? "bg-muted/60 text-muted-foreground";
}

function isSpecialMenu(menu: any) {
  const name = (menu.name ?? "").toLowerCase();
  return name.includes("evento") || name.includes("fiesta") || name.includes("navidad") ||
    name.includes("cumpleaños") || name.includes("celebraci") || name.includes("boda") ||
    name.includes("verano") || name.includes("especial");
}

// ─── Tab IDs ─────────────────────────────────────────────────────────────────

type TabId = "active" | "saved" | "explore";

// ─── Sub-component: Tab Bar ──────────────────────────────────────────────────

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  const tabs: { id: TabId; label: string; emoji: string; desc: string }[] = [
    { id: "active",  label: "En curso",   emoji: "▶️", desc: "El menú que estás usando ahora" },
    { id: "saved",   label: "Mis menús",  emoji: "📂", desc: "Menús que has guardado"   },
    { id: "explore", label: "Explorar",   emoji: "🔍", desc: "Todos los menús disponibles" },
  ];
  return (
    <div className="mb-5">
      <div className="flex rounded-2xl bg-muted/40 p-1 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2.5 px-1 text-center transition-all ${
              tab === t.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            <span className="text-base leading-none">{t.emoji}</span>
            <span className={`text-[11px] font-bold leading-tight ${tab === t.id ? "text-[#F97316]" : ""}`}>{t.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground/70">
        {tabs.find(t => t.id === tab)?.desc}
      </p>
    </div>
  );
}

// ─── Sub-component: Visual Menu Card ─────────────────────────────────────────

function MenuCard({
  menu,
  onActivate,
  onSave,
  onDelete,
  onDuplicate,
  onRename,
  onApply,
  onPreview,
  showActions = true,
  isOwned = false,
}: {
  menu: any;
  onActivate?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onApply?: () => void;
  onPreview?: () => void;
  showActions?: boolean;
  isOwned?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const coverImage = menu.coverImage || null;
  const special = isSpecialMenu(menu);

  return (
    <div className={`rounded-3xl overflow-hidden shadow-sm border transition-all ${
      menu.isActive ? "border-[#F97316]/50 shadow-orange-100" : "border-border/60"
    }`}>
      {/* Cover image - click to preview */}
      <div
        className="relative h-36 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden cursor-pointer"
        onClick={onPreview}
        title="Ver recetas del menú"
      >
        {coverImage ? (
          <img src={coverImage} alt={menu.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">{special ? "🎉" : "🥗"}</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Badges top */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {menu.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F97316] px-2.5 py-1 text-[10px] font-bold text-white shadow">
              ▶ En curso
            </span>
          )}
          {special && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-bold text-yellow-900 shadow">
              🎉 Especial
            </span>
          )}
          {menu.goal && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold shadow ${getGoalColor(menu.goal)}`}>
              {getGoalLabel(menu.goal)}
            </span>
          )}
          {(menu as any).isAiGenerated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-1 text-[10px] font-bold text-white shadow">
              ✨ IA
            </span>
          )}
        </div>

        {/* Calories badge bottom-right */}
        {menu.dailyCalories && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1">
            <FireIcon className="h-3 w-3 text-orange-300" />
            <span className="text-[10px] font-bold text-white">{menu.dailyCalories} kcal/día</span>
          </div>
        )}

        {/* Menu name bottom-left */}
        <div className="absolute bottom-3 left-3 right-16">
          <p className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow">{menu.name}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="bg-background p-4">
        {/* Objective / description */}
        {menu.objective && (
          <div>
            <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              {menu.objective}
            </p>
            {menu.objective.length > 80 && (
              <button onClick={() => setExpanded(e => !e)}
                className="mt-1 flex items-center gap-0.5 text-[10px] font-semibold text-[#F97316]">
                {expanded ? <><ChevronUpIcon className="h-3 w-3" /> Ver menos</> : <><ChevronDownIcon className="h-3 w-3" /> Ver más</>}
              </button>
            )}
          </div>
        )}

        {/* Author (BuddyExpert) */}
        {menu.expertName && (
          <div className="mt-2 flex items-center gap-1.5">
            <UserCircleIcon className="h-4 w-4 text-[#F97316]" />
            <span className="text-xs text-muted-foreground">Por <span className="font-semibold text-foreground">{menu.expertName}</span></span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-[#F97316]">
              <StarSolidIcon className="h-2.5 w-2.5" /> BuddyExpert
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground/70">
          {menu.dailyMealsCount && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" /> {menu.dailyMealsCount} comidas/día
            </span>
          )}
          {menu.startDate && (
            <span>Desde {new Date(menu.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {onActivate && !menu.isActive && (
              <button onClick={onActivate}
                className="flex items-center gap-1 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                <PlayIcon className="h-3.5 w-3.5" /> Usar este menú
              </button>
            )}
            {menu.isActive && onApply && (
              <button onClick={onApply}
                className="flex items-center gap-1 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                <CalendarDaysIcon className="h-3.5 w-3.5" /> Aplicar al diario
              </button>
            )}
            {onSave && !isOwned && (
              <button onClick={onSave}
                className="flex items-center gap-1 rounded-xl bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-bold text-[#F97316]">
                <PlusIcon className="h-3.5 w-3.5" /> Guardar
              </button>
            )}
            {onRename && (
              <button onClick={onRename}
                className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                <PencilIcon className="h-3.5 w-3.5" /> Renombrar
              </button>
            )}
            {onDuplicate && (
              <button onClick={onDuplicate}
                className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                <DocumentDuplicateIcon className="h-3.5 w-3.5" /> Duplicar
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete}
                className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500">
                <TrashIcon className="h-3.5 w-3.5" /> Eliminar
              </button>
            )}
            {onPreview && (
              <button onClick={onPreview}
                className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                <MagnifyingGlassIcon className="h-3.5 w-3.5" /> Ver recetas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DnD Components ─────────────────────────────────────────────────────────
function DraggableRecipeCard({ item, onRemove }: { item: any; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${item.menuOrganizerDayPartId}-${item.recipeId}`,
    data: { item },
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50, opacity: 0.85 } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 rounded-2xl bg-muted/20 border border-border/40 p-2.5 ${isDragging ? "shadow-xl ring-2 ring-orange-300" : ""}`}>
      <button {...listeners} {...attributes} className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-muted active:cursor-grabbing touch-none">
        <Bars3Icon className="h-4 w-4" />
      </button>
      <img src={item.recipe?.imageUrl || RECIPE_PLACEHOLDER_IMAGE} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{item.recipe?.name ?? "Receta eliminada"}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.recipe?.caloriesPerServing && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
              <FireIcon className="h-3 w-3 text-orange-400" />
              {item.recipe.caloriesPerServing} kcal
            </span>
          )}
          {item.recipe?.preparationTime && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
              <ClockIcon className="h-3 w-3" />
              {item.recipe.preparationTime} min
            </span>
          )}
        </div>
      </div>
      <button onClick={onRemove} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/40 hover:bg-red-50 hover:text-red-400 transition-all">
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function DroppableMealSlot({ id, children, isOver }: { id: string; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`min-h-[20px] rounded-xl transition-all ${isOver ? "ring-2 ring-orange-300 bg-orange-50/30" : ""}`}>
      {children}
    </div>
  );
}

// ─── Sub-component: Tab "Menú en curso" ──────────────────────────────────────
function ActiveMenuTab({ editMenuId }: { editMenuId?: number }) {
  const { t }                 = useTranslation();
  const [, navigate]          = useLocation();
  const MEAL_TYPES            = MEAL_TYPE_KEYS.map(m => ({ ...m, label: t(m.tKey, m.label) }));
  const [weekOffset, setWeekOffset]   = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showAddRecipe, setShowAddRecipe] = useState<{ dayPartId: number; mealType: string } | null>(null);
  const [recipeSearch, setRecipeSearch]   = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyStartDate, setApplyStartDate] = useState(() => getLocalDateString());
  const [confirmingMeals, setConfirmingMeals] = useState<Set<string>>(new Set());
  const [confirmedMeals, setConfirmedMeals] = useState<Set<string>>(new Set());

  const baseDate   = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + weekOffset * 7); return d; }, [weekOffset]);
  const weekDates  = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const selectedDateStr = getLocalDateString(selectedDate);

  const { data: menus }    = trpc.menus.list.useQuery();
  const activeMenu         = useMemo(() => menus?.find((m: any) => m.isActive) ?? null, [menus]);
  // If editMenuId is provided, use that specific menu; otherwise use the active menu
  const editMenu           = useMemo(() => editMenuId ? (menus?.find((m: any) => m.id === editMenuId) ?? null) : null, [menus, editMenuId]);
  const targetMenu         = editMenu ?? activeMenu;
  const isEditingOtherMenu = !!editMenuId && editMenu && !editMenu.isActive;
  const { data: dayItems, refetch: refetchDayItems, isLoading: loadingDayItems } = trpc.menus.getItemsByDate.useQuery(
    { date: selectedDateStr, menuId: editMenuId },
    { enabled: !!targetMenu }
  );
  const { data: recipeResults } = trpc.recipes.list.useQuery(
    { search: recipeSearch, limit: 20, excludeUserAllergens: true },
    { enabled: showAddRecipe !== null && recipeSearch.length > 1 }
  );

  const utils              = trpc.useUtils();
  const ensureDayPart      = trpc.menus.ensureDayPart.useMutation();
  const addRecipeToDayPart = trpc.menus.addRecipeToDayPart.useMutation({
    onSuccess: () => { refetchDayItems(); setShowAddRecipe(null); setRecipeSearch(""); toast.success("Receta añadida al menú"); },
    onError:   (err: any) => toast.error(getErrorMessage(err, "Error al añadir receta")),
  });
  const removeRecipe = trpc.menus.removeRecipeFromDayPart.useMutation({
    onSuccess: () => { refetchDayItems(); toast.success("Receta eliminada"); },
  });
  const moveRecipe = trpc.menus.moveRecipeBetweenDayParts.useMutation({
    onSuccess: () => { refetchDayItems(); toast.success("Receta movida"); },
    onError: (err: any) => toast.error(getErrorMessage(err, "Error al mover receta")),
  });
  const [activeDragItem, setActiveDragItem] = useState<any | null>(null);
  const applyToCalendar = trpc.menus.applyToCalendar.useMutation({
    onSuccess: (data) => {
      utils.mealLogs.list.invalidate();
      setShowApplyModal(false);
      toast.success(`✅ ${data.logsCreated} comidas añadidas al diario desde ${applyStartDate}`);
    },
    onError: () => toast.error("Error al aplicar el menú al diario"),
  });
  const logMeal = trpc.mealLogs.add.useMutation({
    onSuccess: () => { utils.mealLogs.list.invalidate(); },
  });

  const handleAddToMeal = async (mealType: string) => {
    if (!targetMenu) { toast.error("No tienes ningún menú activo. Ve a 'Mis menús' para activar uno."); return; }
    try {
      const result = await ensureDayPart.mutateAsync({ menuId: targetMenu.id, date: selectedDateStr, mealType });
      setShowAddRecipe({ dayPartId: result.id, mealType });
    } catch { toast.error("Error preparando el menú"); }
  };

  const handleConfirmMeal = async (mealType: string, recipes: any[]) => {
    const key = `${selectedDateStr}-${mealType}`;
    setConfirmingMeals(prev => new Set(Array.from(prev).concat(key)));
    try {
      for (const item of recipes) {
        if (!item.recipe) continue;
        await logMeal.mutateAsync({
          logDate: selectedDateStr,
          recipeId: item.recipe.id,
          servings: 1,
        });
      }
      setConfirmedMeals(prev => new Set(Array.from(prev).concat(key)));
      toast.success(`✅ ${recipes.length} receta${recipes.length > 1 ? "s" : ""} añadida${recipes.length > 1 ? "s" : ""} al diario`);
    } catch {
      toast.error("Error al añadir al diario");
    } finally {
      setConfirmingMeals(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  };

  const mealMap: Record<string, any[]> = {};
  (dayItems ?? []).forEach((dp: any) => {
    const key = dp.dayPartKey ?? "meal";
    if (!mealMap[key]) mealMap[key] = [];
    mealMap[key].push(...(dp.recipes ?? []));
  });

  // ── No active menu state ──
  if (!targetMenu) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50">
          <span className="text-4xl">▶️</span>
        </div>
        <h3 className="text-base font-bold text-foreground mb-2">Sin menú en curso</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Elige un menú de la biblioteca o crea uno personalizado para empezar a seguir tu plan nutricional.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link href="/app/menus?tab=explore">
            <button className="btn-vively w-full">🔍 Explorar menús disponibles</button>
          </Link>
          <Link href="/app/menus?tab=saved">
            <button className="btn-vively-outline w-full">📂 Ver mis menús guardados</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner: editing another menu vs active menu */}
      {isEditingOtherMenu ? (
        <div className="mb-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">✏️</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Editando menú</p>
              <p className="text-sm font-bold text-foreground truncate">{targetMenu.name}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/app/my-menus")}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white"
          >
            ← Volver
          </button>
        </div>
      ) : (
        <div className="mb-4 rounded-2xl overflow-hidden shadow-sm">
          {targetMenu.coverImage ? (
            <div className="relative h-24">
              <img src={targetMenu.coverImage} alt={targetMenu.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-[#F97316] shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-orange-300 uppercase tracking-wide">Menú en curso</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-white">{targetMenu.name}</p>
                      {(targetMenu as any).generatedByAI && <span className="text-[10px] bg-purple-500/80 text-white font-bold px-1.5 py-0.5 rounded-full">✨ IA</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setShowApplyModal(true); setApplyStartDate(getLocalDateString()); }}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white"
                >
                  <CalendarDaysIcon className="h-3.5 w-3.5" />
                  Aplicar al diario
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircleIcon className="h-5 w-5 text-[#F97316] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Menú en curso</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground truncate">{targetMenu.name}</p>
                    {(targetMenu as any).generatedByAI && <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">✨ IA</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setShowApplyModal(true); setApplyStartDate(getLocalDateString()); }}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white"
              >
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                Aplicar al diario
              </button>
            </div>
          )}
        </div>
      )}

      {/* Week navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setWeekOffset(o => o - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground/80">
          {weekDates[0].getDate()} – {weekDates[6].getDate()} {MONTHS_ES[weekDates[6].getMonth()]}
        </span>
        <button onClick={() => setWeekOffset(o => o + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Day selector */}
      <div className="mb-5 grid grid-cols-7 gap-1">
        {weekDates.map(date => {
          const ds       = getLocalDateString(date);
          const isSel    = ds === selectedDateStr;
          const isToday  = ds === getLocalDateString();
          return (
            <button key={ds} onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center rounded-xl px-1 py-2 transition-all ${isSel ? "bg-[#F97316] text-white shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <span className="text-[11px] font-medium">{DAYS_ES[date.getDay()]}</span>
              <span className={`text-sm font-bold ${isToday && !isSel ? "text-[#F97316]" : ""}`}>{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Day label */}
      <h2 className="mb-3 text-sm font-bold text-foreground/80 capitalize">
        {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </h2>

      {/* Loading state */}
      {loadingDayItems && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="vively-card animate-pulse">
              <div className="h-4 w-24 rounded bg-muted/60 mb-3" />
              <div className="h-16 rounded-xl bg-muted/40" />
            </div>
          ))}
        </div>
      )}

            {/* Meal slots — wrapped in DndContext for drag-and-drop between meal types */}
      {!loadingDayItems && (
        <DndContext
          onDragStart={({ active }) => setActiveDragItem(active.data.current?.item ?? null)}
          onDragEnd={({ active, over }: DragEndEvent) => {
            setActiveDragItem(null);
            if (!over || active.id === over.id) return;
            const item = active.data.current?.item;
            if (!item) return;
            // over.id is the droppable meal slot id: `slot-${mealType.apiParam}`
            const toMealType = String(over.id).replace("slot-", "");
            const fromDayPartId = item.menuOrganizerDayPartId;
            // Find the target day part id for the destination meal type
            const toDayPartItems = mealMap[toMealType] ?? [];
            if (toDayPartItems.length > 0) {
              const toDayPartId = toDayPartItems[0].menuOrganizerDayPartId;
              if (toDayPartId !== fromDayPartId) {
                moveRecipe.mutate({ fromDayPartId, toDayPartId, recipeId: item.recipeId, servings: item.servings });
              }
            } else {
              // Need to ensure the day part exists first, then move
              ensureDayPart.mutateAsync({ menuId: targetMenu!.id, date: selectedDateStr, mealType: toMealType })
                .then(dp => moveRecipe.mutate({ fromDayPartId, toDayPartId: dp.id, recipeId: item.recipeId, servings: item.servings }))
                .catch(() => toast.error("Error al mover receta"));
            }
          }}
        >
      {MEAL_TYPES.map(mealType => {
        const items = mealMap[mealType.apiParam] ?? [];
        const confirmKey = `${selectedDateStr}-${mealType.apiParam}`;
        const isConfirmed = confirmedMeals.has(confirmKey);
        const isConfirming = confirmingMeals.has(confirmKey);
        return (
          <div key={mealType.key} className={`vively-card mb-3 transition-all ${isConfirmed ? "border-green-200 bg-green-50/30" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mealType.emoji}</span>
                <span className="text-sm font-bold text-foreground">{mealType.label}</span>
                {items.length > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#F97316]">
                    {items.length} receta{items.length > 1 ? "s" : ""}
                  </span>
                )}
                {isConfirmed && (
                  <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">
                    <CheckIcon className="h-3 w-3" /> Añadido al diario
                  </span>
                )}
              </div>
              <button onClick={() => handleAddToMeal(mealType.apiParam)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-[#F97316] hover:bg-orange-100 transition-all">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <button onClick={() => handleAddToMeal(mealType.apiParam)}
                className="w-full rounded-xl border-2 border-dashed border-border py-4 text-xs text-muted-foreground/70 hover:border-[#F97316]/40 hover:text-[#F97316] transition-all flex flex-col items-center gap-1">
                <PlusIcon className="h-4 w-4" />
                <span>Añadir receta para {mealType.label.toLowerCase()}</span>
              </button>
            ) : (
              <div>
                {/* Recipe cards — draggable */}
                <DroppableMealSlot id={`slot-${mealType.apiParam}`} isOver={false}>
                  <div className="space-y-2 mb-3">
                    {items.map((item: any) => (
                      <DraggableRecipeCard
                        key={`${item.menuOrganizerDayPartId}-${item.recipeId}`}
                        item={item}
                        onRemove={() => removeRecipe.mutate({ menuOrganizerDayPartId: item.menuOrganizerDayPartId, recipeId: item.recipeId })}
                      />
                    ))}
                  </div>
                </DroppableMealSlot>

                {/* Confirm to diary button */}
                {!isConfirmed && (
                  <button
                    onClick={() => handleConfirmMeal(mealType.apiParam, items)}
                    disabled={isConfirming}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-green-50 border border-green-200 py-2 text-xs font-bold text-green-600 hover:bg-green-100 transition-all disabled:opacity-60"
                  >
                    {isConfirming ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                    {isConfirming ? "Añadiendo..." : `Confirmar ${mealType.label.toLowerCase()} y añadir al diario`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
            })}
        <DragOverlay>
          {activeDragItem ? (
            <div className="flex items-center gap-3 rounded-2xl bg-background border border-orange-300 shadow-2xl p-2.5 opacity-90">
              <img src={activeDragItem.recipe?.imageUrl || RECIPE_PLACEHOLDER_IMAGE} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
              <p className="text-sm font-semibold text-foreground">{activeDragItem.recipe?.name ?? "Receta"}</p>
            </div>
          ) : null}
        </DragOverlay>
        </DndContext>
      )}
      {/* Shopping list CTA */}
      <div className="vively-card mb-4 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="h-5 w-5 text-[#F97316] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Generar lista de la compra</p>
            <p className="text-xs text-muted-foreground">Basada en las recetas de este menú</p>
          </div>
          <Link href="/app/shopping-lists">
            <button className="shrink-0 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white">Crear lista</button>
          </Link>
        </div>
      </div>

      {/* Add recipe modal */}
      {showAddRecipe && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowAddRecipe(null); setRecipeSearch(""); } }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
            <h3 className="mb-1 text-lg font-bold text-foreground">Añadir receta</h3>
            <p className="mb-4 text-xs text-muted-foreground">Busca una receta para añadir al menú</p>
            <input value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} placeholder="Buscar receta..." className="vively-input mb-3" autoFocus />
            <div className="flex-1 overflow-y-auto space-y-2">
              {recipeSearch.length < 2 ? (
                <p className="text-center text-sm text-muted-foreground/70 py-4">Escribe al menos 2 letras para buscar</p>
              ) : !recipeResults || (recipeResults as any).recipes?.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground/70 py-4">Sin resultados para "{recipeSearch}"</p>
              ) : (
                ((recipeResults as any).recipes ?? []).map((recipe: any) => (
                  <button key={recipe.id} onClick={() => addRecipeToDayPart.mutate({ menuOrganizerDayPartId: showAddRecipe.dayPartId, recipeId: recipe.id })}
                    disabled={addRecipeToDayPart.isPending}
                    className="w-full flex items-center gap-3 rounded-2xl border border-border/50 bg-background p-3 text-left hover:border-[#F97316]/30 hover:bg-orange-50 transition-all">
                    <img src={recipe.imageUrl || RECIPE_PLACEHOLDER_IMAGE} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground/70">{recipe.caloriesPerServing ? `${recipe.caloriesPerServing} kcal · ` : ""}{recipe.preparationTime ? `${recipe.preparationTime} min` : ""}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => { setShowAddRecipe(null); setRecipeSearch(""); }} className="mt-4 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Apply to calendar modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowApplyModal(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-1 text-lg font-bold text-foreground">Aplicar al diario</h3>
            <p className="mb-4 text-xs text-muted-foreground">Las recetas del menú se añadirán al diario nutricional a partir de la fecha elegida</p>
            <label className="block text-xs font-semibold text-foreground/80 mb-1">Fecha de inicio</label>
            <input type="date" value={applyStartDate} onChange={e => setApplyStartDate(e.target.value)} className="vively-input mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowApplyModal(false)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button
                onClick={() => applyToCalendar.mutate({ menuId: targetMenu!.id, startDate: applyStartDate })}
                disabled={applyToCalendar.isPending}
                className="flex-1 btn-vively"
              >
                {applyToCalendar.isPending ? "Aplicando..." : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Tab "Mis menús guardados" ────────────────────────────────

function SavedMenusTab() {
  const [, navigate]      = useLocation();
  const { can }           = usePlan();
  const [showNewMenu, setShowNewMenu]   = useState(false);
  const [showAI, setShowAI]             = useState(false);
  const [menuName, setMenuName]         = useState("");
  const [aiObjective, setAiObjective]   = useState("");
  const [generating, setGenerating]     = useState(false);
  const [renaming, setRenaming]         = useState<{ id: number; name: string } | null>(null);
  const [applyModal, setApplyModal]     = useState<{ id: number; name: string } | null>(null);
  const [applyStartDate, setApplyStartDate] = useState(() => getLocalDateString());
  const [previewMenuId, setPreviewMenuId] = useState<number | null>(null);

  const { data: menus, refetch } = trpc.menus.list.useQuery();
  const utils = trpc.useUtils();

  const createMenu = trpc.menus.create.useMutation({
    onSuccess: () => { refetch(); setShowNewMenu(false); setMenuName(""); toast.success("Menú creado"); },
  });
  const deleteMenu = trpc.menus.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Menú eliminado"); },
  });
  const setActive = trpc.menus.setActive.useMutation({
    onSuccess: () => { refetch(); toast.success("✅ Menú activado — ahora está en curso"); },
  });
  const duplicateMenu = trpc.menus.duplicate.useMutation({
    onSuccess: () => { refetch(); toast.success("Menú duplicado"); },
  });
  const renameMenu = trpc.menus.rename.useMutation({
    onSuccess: () => { refetch(); setRenaming(null); toast.success("Menú renombrado"); },
  });
  const applyToCalendar = trpc.menus.applyToCalendar.useMutation({
    onSuccess: (data) => {
      utils.mealLogs.list.invalidate();
      setApplyModal(null);
      toast.success(`✅ ${data.logsCreated} comidas añadidas al diario`);
    },
    onError: () => toast.error("Error al aplicar el menú al diario"),
  });
  const generateAI = trpc.menus.generateWithAI.useMutation({
    onSuccess: () => { refetch(); setGenerating(false); setShowAI(false); toast.success("¡Menú generado con IA!"); },
    onError:   () => { setGenerating(false); toast.error("Error al generar el menú"); },
  });

  const userMenus = (menus ?? []).filter((m: any) => !m.isSeeded);

  return (
    <div>
      {/* Action buttons */}
      <div className="mb-5 flex gap-2">
        <button onClick={() => setShowNewMenu(true)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#F97316] py-2.5 text-sm font-bold text-white shadow-sm">
          <PlusIcon className="h-4 w-4" /> Nuevo menú
        </button>
        <button
          onClick={() => {
            if (!can("canGenerateAIMenus")) { toast.error("Genera menús con IA con el plan Pro"); navigate("/app/subscription"); return; }
            setShowAI(true);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-blue-50 border border-blue-200 py-2.5 text-sm font-bold text-blue-600">
          <SparklesIcon className="h-4 w-4" /> Generar con IA
        </button>
      </div>

      {/* Empty state */}
      {userMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/40">
            <span className="text-4xl">📂</span>
          </div>
          <h3 className="text-base font-bold text-foreground mb-2">Aún no tienes menús guardados</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">Crea tu primer menú personalizado o genera uno con IA en segundos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userMenus.map((menu: any) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              isOwned
              onActivate={() => setActive.mutate({ menuId: menu.id })}
              onApply={() => { setApplyModal({ id: menu.id, name: menu.name }); setApplyStartDate(getLocalDateString()); }}
              onRename={() => setRenaming({ id: menu.id, name: menu.name })}
              onDuplicate={() => duplicateMenu.mutate({ id: menu.id })}
              onDelete={() => { if (confirm(`¿Eliminar "${menu.name}"?`)) deleteMenu.mutate({ id: menu.id }); }}
              onPreview={() => setPreviewMenuId(menu.id)}
            />
          ))}
        </div>
      )}
      {/* Menu preview modal */}
      {previewMenuId !== null && (
        <MenuPreviewModal
          menuId={previewMenuId}
          onClose={() => setPreviewMenuId(null)}
          isOwned
        />
      )}

      {/* New menu modal */}
      {showNewMenu && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowNewMenu(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-1 text-lg font-bold text-foreground">Nuevo menú</h3>
            <p className="mb-4 text-xs text-muted-foreground">Dale un nombre a tu planificador semanal</p>
            <input value={menuName} onChange={e => setMenuName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { const today = getLocalDateString(); const nextWeek = getLocalDateString(new Date(Date.now() + 7 * 86400000)); createMenu.mutate({ name: menuName || "Mi menú", startDate: today, endDate: nextWeek }); } }}
              placeholder="Ej: Semana saludable, Dieta mediterránea..." className="vively-input mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowNewMenu(false)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button onClick={() => { const today = getLocalDateString(); const nextWeek = getLocalDateString(new Date(Date.now() + 7 * 86400000)); createMenu.mutate({ name: menuName || "Mi menú", startDate: today, endDate: nextWeek }); }}
                disabled={createMenu.isPending} className="flex-1 btn-vively">
                {createMenu.isPending ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI modal */}
      {showAI && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAI(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                <SparklesIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Generar menú con IA</h3>
                <p className="text-xs text-muted-foreground">La IA creará un menú personalizado para ti</p>
              </div>
            </div>
            <textarea value={aiObjective} onChange={e => setAiObjective(e.target.value)}
              placeholder="Describe tu objetivo: perder peso, ganar músculo, dieta mediterránea, sin gluten..." className="vively-input mb-4 h-24 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowAI(false)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button
                onClick={() => { setGenerating(true); generateAI.mutate({ days: 7, mealsPerDay: 3, objective: aiObjective || "menú equilibrado semanal" }); }}
                disabled={generating}
                className="flex-1 btn-vively flex items-center justify-center gap-2">
                {generating ? <><span className="animate-spin">⏳</span> Generando...</> : <><SparklesIcon className="h-4 w-4" /> Generar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {renaming && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setRenaming(null); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-foreground">Renombrar menú</h3>
            <input value={renaming.name} onChange={e => setRenaming(r => r ? { ...r, name: e.target.value } : null)}
              className="vively-input mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setRenaming(null)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button onClick={() => renameMenu.mutate({ id: renaming.id, name: renaming.name })}
                disabled={renameMenu.isPending} className="flex-1 btn-vively">
                {renameMenu.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply modal */}
      {applyModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setApplyModal(null); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-1 text-lg font-bold text-foreground">Aplicar al diario</h3>
            <p className="mb-4 text-xs text-muted-foreground">"{applyModal.name}" se añadirá al diario desde la fecha elegida</p>
            <label className="block text-xs font-semibold text-foreground/80 mb-1">Fecha de inicio</label>
            <input type="date" value={applyStartDate} onChange={e => setApplyStartDate(e.target.value)} className="vively-input mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setApplyModal(null)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button
                onClick={() => applyToCalendar.mutate({ menuId: applyModal.id, startDate: applyStartDate })}
                disabled={applyToCalendar.isPending}
                className="flex-1 btn-vively"
              >
                {applyToCalendar.isPending ? "Aplicando..." : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Tab "Explorar todos los menús" ───────────────────────────

function ExploreMenusTab() {
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState<string>("all");
  const [previewMenuId, setPreviewMenuId] = useState<number | null>(null);
  const { data: menus }         = trpc.menus.list.useQuery();
  const { data: savedMenus }    = trpc.menus.list.useQuery();

  // All menus (seeded + user's own)
  const allMenus = menus ?? [];
  const savedIds = new Set((savedMenus ?? []).filter((m: any) => !m.isSeeded).map((m: any) => m.id));

  // Separate special/party menus
  const specialMenus = allMenus.filter((m: any) => isSpecialMenu(m));
  const regularMenus = allMenus.filter((m: any) => !isSpecialMenu(m));

  const CATEGORIES = [
    { id: "all",         label: "Todos"           },
    { id: "perdida",     label: "Pérdida de peso" },
    { id: "muscular",    label: "Ganancia muscular"},
    { id: "vegano",      label: "Vegano"          },
    { id: "mediterraneo",label: "Mediterráneo"    },
    { id: "economico",   label: "Económico"       },
    { id: "oficina",     label: "Oficina/Tupper"  },
  ];

  const filterMenu = (m: any) => {
    const name = (m.name ?? "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || (m.objective ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all"
      || (category === "perdida"      && (name.includes("pérdida") || m.goal === "perdida_peso"))
      || (category === "muscular"     && (name.includes("muscular") || name.includes("ganancia") || m.goal === "ganancia_muscular"))
      || (category === "vegano"       && (name.includes("vegano") || name.includes("vegetariano") || m.goal === "vegano"))
      || (category === "mediterraneo" && (name.includes("mediterráneo") || m.goal === "mediterraneo"))
      || (category === "economico"    && name.includes("€"))
      || (category === "oficina"      && name.includes("oficina"));
    return matchSearch && matchCat;
  };

  const filteredRegular = regularMenus.filter(filterMenu);
  const filteredSpecial = specialMenus.filter(filterMenu);

  const saveMenu = trpc.menus.saveFromLibrary.useMutation({
    onSuccess: () => toast.success("✅ Menú guardado en 'Mis menús'"),
    onError:   () => toast.error("Error al guardar el menú"),
  });
  const setActive = trpc.menus.setActive.useMutation({
    onSuccess: () => toast.success("✅ Menú activado — ahora está en curso"),
  });

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre u objetivo..." className="vively-input pl-9" />
      </div>

      {/* Category filter */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              category === cat.id ? "bg-[#F97316] text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Special / Party menus section */}
      {filteredSpecial.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎉</span>
            <h2 className="text-sm font-bold text-foreground">Menús especiales y de fiesta</h2>
          </div>
          <div className="space-y-4">
            {filteredSpecial.map((menu: any) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                isOwned={savedIds.has(menu.id)}
                onSave={() => saveMenu.mutate({ menuId: menu.id })}
                onActivate={() => setActive.mutate({ menuId: menu.id })}
                onPreview={() => setPreviewMenuId(menu.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular menus */}
      {filteredRegular.length === 0 && filteredSpecial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm text-muted-foreground">Sin resultados para "{search}"</p>
        </div>
      ) : (
        <div>
          {filteredSpecial.length > 0 && filteredRegular.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🥗</span>
              <h2 className="text-sm font-bold text-foreground">Todos los menús</h2>
            </div>
          )}
          <div className="space-y-4">
            {filteredRegular.map((menu: any) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                isOwned={savedIds.has(menu.id)}
                onSave={() => saveMenu.mutate({ menuId: menu.id })}
                onActivate={() => setActive.mutate({ menuId: menu.id })}
                onPreview={() => setPreviewMenuId(menu.id)}
              />
            ))}
          </div>
        </div>
      )}
      {/* Menu preview modal */}
      {previewMenuId !== null && (
        <MenuPreviewModal
          menuId={previewMenuId}
          onClose={() => setPreviewMenuId(null)}
          isSaved={savedIds.has(previewMenuId)}
          onSave={() => saveMenu.mutate({ menuId: previewMenuId })}
          onActivate={() => setActive.mutate({ menuId: previewMenuId })}
        />
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Menus() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const initialTab = (searchParams.get("tab") as TabId) ?? "active";
  const editMenuIdParam = searchParams.get("editMenu");
  const editMenuId = editMenuIdParam ? parseInt(editMenuIdParam, 10) : undefined;
  const [tab, setTab] = useState<TabId>(initialTab);

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Menús</h1>
      </div>

      {/* Tab bar */}
      <TabBar tab={tab} setTab={setTab} />

      {/* Tab content */}
      {tab === "active"  && <ActiveMenuTab editMenuId={editMenuId} />}
      {tab === "saved"   && <SavedMenusTab />}
      {tab === "explore" && <ExploreMenusTab />}
    </div>
  );
}
