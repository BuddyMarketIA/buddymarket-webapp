import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
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
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// ─── Helpers ────────────────────────────────────────────────────────────────

const MEAL_TYPE_KEYS = [
  { key: "breakfast", tKey: "mealLog.breakfast", emoji: "🌅", apiParam: "breakfast" },
  { key: "lunch",     tKey: "mealLog.lunch",     emoji: "☀️", apiParam: "lunch"      },
  { key: "snack",     tKey: "mealLog.snack",     emoji: "🍎", apiParam: "snack"      },
  { key: "dinner",    tKey: "mealLog.dinner",    emoji: "🌙", apiParam: "dinner"     },
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

// ─── Tab IDs ─────────────────────────────────────────────────────────────────

type TabId = "active" | "saved" | "explore";

// ─── Sub-component: Tab Bar ──────────────────────────────────────────────────

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  const tabs: { id: TabId; label: string; emoji: string; desc: string }[] = [
    { id: "active",  label: "En curso",   emoji: "▶️", desc: "El menú que estás usando" },
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

// ─── Sub-component: Tab "En curso" ──────────────────────────────────────────

function ActiveMenuTab() {
  const { t }                 = useTranslation();
  const MEAL_TYPES            = MEAL_TYPE_KEYS.map(m => ({ ...m, label: t(m.tKey, m.key) }));
  const [weekOffset, setWeekOffset]   = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showAddRecipe, setShowAddRecipe] = useState<{ dayPartId: number; mealType: string } | null>(null);
  const [recipeSearch, setRecipeSearch]   = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyStartDate, setApplyStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  const baseDate   = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + weekOffset * 7); return d; }, [weekOffset]);
  const weekDates  = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  const { data: menus }    = trpc.menus.list.useQuery();
  const activeMenu         = useMemo(() => menus?.find((m: any) => m.isActive) ?? menus?.[0] ?? null, [menus]);
  const { data: dayItems, refetch: refetchDayItems } = trpc.menus.getItemsByDate.useQuery({ date: selectedDateStr });
  const { data: recipeResults } = trpc.recipes.list.useQuery(
    { search: recipeSearch, limit: 20, excludeUserAllergens: true },
    { enabled: showAddRecipe !== null && recipeSearch.length > 1 }
  );

  const utils              = trpc.useUtils();
  const ensureDayPart      = trpc.menus.ensureDayPart.useMutation();
  const addRecipeToDayPart = trpc.menus.addRecipeToDayPart.useMutation({
    onSuccess: () => { refetchDayItems(); setShowAddRecipe(null); setRecipeSearch(""); toast.success("Receta añadida al menú"); },
    onError:   (err: any) => toast.error(err.message || "Error al añadir receta"),
  });
  const removeRecipe = trpc.menus.removeRecipeFromDayPart.useMutation({
    onSuccess: () => { refetchDayItems(); toast.success("Receta eliminada"); },
  });
  const applyToCalendar = trpc.menus.applyToCalendar.useMutation({
    onSuccess: (data) => {
      utils.mealLogs.list.invalidate();
      setShowApplyModal(false);
      toast.success(`✅ ${data.logsCreated} comidas añadidas al diario desde ${applyStartDate}`);
    },
    onError: () => toast.error("Error al aplicar el menú al diario"),
  });

  const handleAddToMeal = async (mealType: string) => {
    if (!activeMenu) { toast.error("No tienes ningún menú activo. Ve a 'Mis menús' para activar uno."); return; }
    try {
      const result = await ensureDayPart.mutateAsync({ menuId: activeMenu.id, date: selectedDateStr, mealType });
      setShowAddRecipe({ dayPartId: result.id, mealType });
    } catch { toast.error("Error preparando el menú"); }
  };

  const mealMap: Record<string, any[]> = {};
  (dayItems ?? []).forEach((dp: any) => {
    const key = dp.dayPartKey ?? "meal";
    if (!mealMap[key]) mealMap[key] = [];
    mealMap[key].push(...(dp.recipes ?? []));
  });

  // ── No active menu state ──
  if (!activeMenu) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <span className="text-5xl mb-4">▶️</span>
        <h3 className="text-base font-bold text-foreground mb-2">Sin menú en curso</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Activa uno de tus menús guardados o explora la biblioteca para empezar.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Link href="/app/menus?tab=saved">
            <button className="btn-vively w-full">📂 Ver mis menús guardados</button>
          </Link>
          <Link href="/app/menus?tab=explore">
            <button className="btn-vively-outline w-full">🔍 Explorar todos los menús</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Active menu banner */}
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircleIcon className="h-5 w-5 text-[#F97316] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">Menú en curso</p>
              <p className="text-sm font-bold text-foreground truncate">{activeMenu.name}</p>
            </div>
          </div>
          <button
            onClick={() => { setShowApplyModal(true); setApplyStartDate(new Date().toISOString().split("T")[0]); }}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white"
          >
            <CalendarDaysIcon className="h-3.5 w-3.5" />
            Aplicar al diario
          </button>
        </div>
      </div>

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
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {weekDates.map(date => {
          const ds       = date.toISOString().split("T")[0];
          const isSel    = ds === selectedDateStr;
          const isToday  = ds === new Date().toISOString().split("T")[0];
          return (
            <button key={ds} onClick={() => setSelectedDate(date)}
              className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-2 transition-all ${isSel ? "bg-[#F97316] text-white shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
              <span className="text-[13px] font-medium">{DAYS_ES[date.getDay()]}</span>
              <span className={`text-base font-bold ${isToday && !isSel ? "text-[#F97316]" : ""}`}>{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Day label */}
      <h2 className="mb-3 text-sm font-bold text-foreground/80">
        {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
      </h2>

      {/* Meal slots */}
      {MEAL_TYPES.map(mealType => {
        const items = mealMap[mealType.apiParam] ?? [];
        return (
          <div key={mealType.key} className="vively-card mb-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mealType.emoji}</span>
                <span className="text-sm font-semibold text-foreground">{mealType.label}</span>
                {items.length > 0 && <span className="text-xs text-muted-foreground/60">({items.length})</span>}
              </div>
              <button onClick={() => handleAddToMeal(mealType.apiParam)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-[#F97316] hover:bg-orange-100 transition-all">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {items.length === 0 ? (
              <button onClick={() => handleAddToMeal(mealType.apiParam)}
                className="w-full rounded-xl border-2 border-dashed border-border py-3 text-xs text-muted-foreground/70 hover:border-[#F97316]/40 hover:text-[#F97316] transition-all">
                + Añadir receta
              </button>
            ) : (
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={item.recipe?.imageUrl || RECIPE_PLACEHOLDER_IMAGE} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0"
                        onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.recipe?.name ?? "Receta eliminada"}</p>
                        {item.recipe?.calories && <p className="text-xs text-muted-foreground/70">{item.recipe.calories} kcal</p>}
                      </div>
                    </div>
                    <button onClick={() => removeRecipe.mutate({ menuOrganizerDayPartId: item.menuOrganizerDayPartId, recipeId: item.recipeId })}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-red-50 hover:text-red-500">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

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
                      <p className="text-xs text-muted-foreground/70">{recipe.calories ? `${recipe.calories} kcal · ` : ""}{recipe.prepTime ? `${recipe.prepTime} min` : ""}</p>
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
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                <CalendarDaysIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Aplicar al diario</h3>
                <p className="text-xs text-muted-foreground">Las comidas del menú se añadirán a tu diario nutricional</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Fecha de inicio</label>
              <input type="date" value={applyStartDate} onChange={e => setApplyStartDate(e.target.value)} className="vively-input" />
              <p className="text-xs text-muted-foreground/70 mt-1">Las comidas se distribuirán desde esta fecha según los días del menú.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowApplyModal(false)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button onClick={() => applyToCalendar.mutate({ menuId: activeMenu.id, startDate: applyStartDate, overwrite: false })}
                disabled={applyToCalendar.isPending} className="flex-1 btn-vively">
                {applyToCalendar.isPending ? "Aplicando..." : "✅ Aplicar"}
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
  const [applyStartDate, setApplyStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: menus, refetch } = trpc.menus.list.useQuery();
  const utils = trpc.useUtils();

  const createMenu = trpc.menus.create.useMutation({
    onSuccess: () => { refetch(); setShowNewMenu(false); setMenuName(""); toast.success("Menú creado"); },
  });
  const deleteMenu = trpc.menus.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Menú eliminado"); },
  });
  const setActive = trpc.menus.setActive.useMutation({
    onSuccess: () => { refetch(); toast.success("Menú activado — ahora está en curso"); },
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
      <div className="mb-4 flex gap-2">
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
          <span className="text-5xl mb-4">📂</span>
          <h3 className="text-base font-bold text-foreground mb-2">Aún no tienes menús guardados</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">Crea tu primer menú personalizado o genera uno con IA en segundos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userMenus.map((menu: any) => (
            <div key={menu.id} className={`vively-card ${menu.isActive ? "border-2 border-[#F97316]/40 bg-orange-50/30" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {menu.isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F97316] px-2 py-0.5 text-[10px] font-bold text-white">
                        ▶ En curso
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-foreground truncate">{menu.name}</h3>
                  </div>
                  {menu.startDate && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Desde {new Date(menu.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap gap-2">
                {!menu.isActive && (
                  <button onClick={() => setActive.mutate({ menuId: menu.id })}
                    className="flex items-center gap-1 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white">
                    <PlayIcon className="h-3.5 w-3.5" /> Activar
                  </button>
                )}
                <button onClick={() => navigate("/app/menus?tab=active")}
                  className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                  <CalendarDaysIcon className="h-3.5 w-3.5" /> Ver planificador
                </button>
                <button onClick={() => { setApplyModal({ id: menu.id, name: menu.name }); setApplyStartDate(new Date().toISOString().split("T")[0]); }}
                  className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                  <CalendarDaysIcon className="h-3.5 w-3.5" /> Aplicar al diario
                </button>
                <button onClick={() => setRenaming({ id: menu.id, name: menu.name })}
                  className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                  <PencilIcon className="h-3.5 w-3.5" /> Renombrar
                </button>
                <button onClick={() => duplicateMenu.mutate({ menuId: menu.id })}
                  className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground/80">
                  <DocumentDuplicateIcon className="h-3.5 w-3.5" /> Duplicar
                </button>
                <button onClick={() => { if (confirm(`¿Eliminar "${menu.name}"?`)) deleteMenu.mutate({ menuId: menu.id }); }}
                  className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500">
                  <TrashIcon className="h-3.5 w-3.5" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New menu modal */}
      {showNewMenu && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowNewMenu(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-1 text-lg font-bold text-foreground">Nuevo menú</h3>
            <p className="mb-4 text-xs text-muted-foreground">Dale un nombre a tu planificador semanal</p>
            <input value={menuName} onChange={e => setMenuName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { const today = new Date().toISOString().split("T")[0]; const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]; createMenu.mutate({ name: menuName || "Mi menú", startDate: today, endDate: nextWeek }); } }}
              placeholder="Ej: Semana saludable, Dieta mediterránea..." className="vively-input mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setShowNewMenu(false)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button onClick={() => { const today = new Date().toISOString().split("T")[0]; const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]; createMenu.mutate({ name: menuName || "Mi menú", startDate: today, endDate: nextWeek }); }}
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
            <input value={aiObjective} onChange={e => setAiObjective(e.target.value)}
              placeholder="Objetivo (ej: perder peso, dieta mediterránea, vegano...)" className="vively-input mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowAI(false)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button onClick={() => { setGenerating(true); generateAI.mutate({ objective: aiObjective || undefined, days: 7, mealsPerDay: 4 }); }}
                disabled={generating} className="flex-1 btn-vively">
                {generating ? "Generando..." : "✨ Generar"}
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
            <input value={renaming.name} onChange={e => setRenaming({ ...renaming, name: e.target.value })} className="vively-input mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => setRenaming(null)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button onClick={() => renameMenu.mutate({ menuId: renaming.id, name: renaming.name })} disabled={renameMenu.isPending} className="flex-1 btn-vively">
                {renameMenu.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply to calendar modal */}
      {applyModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setApplyModal(null); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                <CalendarDaysIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Aplicar al diario</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{applyModal.name}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Fecha de inicio</label>
              <input type="date" value={applyStartDate} onChange={e => setApplyStartDate(e.target.value)} className="vively-input" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApplyModal(null)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
              <button onClick={() => applyToCalendar.mutate({ menuId: applyModal.id, startDate: applyStartDate, overwrite: false })}
                disabled={applyToCalendar.isPending} className="flex-1 btn-vively">
                {applyToCalendar.isPending ? "Aplicando..." : "✅ Aplicar"}
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
  const { data: menus }         = trpc.menus.list.useQuery();

  // Seeded/library menus
  const libraryMenus = (menus ?? []).filter((m: any) => m.isSeeded);

  const CATEGORIES = [
    { id: "all",         label: "Todos"           },
    { id: "perdida",     label: "Pérdida de peso" },
    { id: "muscular",    label: "Ganancia muscular"},
    { id: "vegano",      label: "Vegano"          },
    { id: "mediterraneo",label: "Mediterráneo"    },
    { id: "economico",   label: "Económico"       },
    { id: "oficina",     label: "Oficina/Tupper"  },
    { id: "especializado",label: "Especializado"  },
  ];

  const filtered = libraryMenus.filter((m: any) => {
    const name = (m.name ?? "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchCat = category === "all"
      || (category === "perdida"      && name.includes("pérdida"))
      || (category === "muscular"     && (name.includes("muscular") || name.includes("ganancia")))
      || (category === "vegano"       && (name.includes("vegano") || name.includes("vegetariano")))
      || (category === "mediterraneo" && name.includes("mediterráneo"))
      || (category === "economico"    && name.includes("€"))
      || (category === "oficina"      && name.includes("oficina"))
      || (category === "especializado"&& (name.includes("expert") || name.includes("hipertrofia") || name.includes("definición")));
    return matchSearch && matchCat;
  });

  const saveMenu = trpc.menus.saveFromLibrary.useMutation({
    onSuccess: () => toast.success("Menú guardado en 'Mis menús'"),
    onError:   () => toast.error("Error al guardar el menú"),
  });

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar menú..." className="vively-input pl-9" />
      </div>

      {/* Category filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              category === cat.id ? "bg-[#F97316] text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Quick access to specialized menus */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link href="/app/specialized-menus">
          <div className="vively-card flex items-center gap-2 cursor-pointer hover:border-[#F97316]/30 transition-all">
            <span className="text-2xl">🏥</span>
            <div>
              <p className="text-xs font-bold text-foreground">Menús médicos</p>
              <p className="text-[10px] text-muted-foreground">Diabetes, hipertensión...</p>
            </div>
          </div>
        </Link>
        <Link href="/app/event-menu">
          <div className="vively-card flex items-center gap-2 cursor-pointer hover:border-[#F97316]/30 transition-all">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-xs font-bold text-foreground">Menús para eventos</p>
              <p className="text-[10px] text-muted-foreground">Cumpleaños, cenas...</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Menu list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-sm text-muted-foreground">Sin resultados para "{search}"</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((menu: any) => (
            <div key={menu.id} className="vively-card flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{menu.name}</p>
                {menu.objective && <p className="text-xs text-muted-foreground/70 capitalize">{menu.objective}</p>}
              </div>
              <button
                onClick={() => saveMenu.mutate({ menuId: menu.id })}
                className="shrink-0 rounded-xl bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-bold text-[#F97316] hover:bg-orange-100 transition-all">
                + Guardar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Menus() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const initialTab = (searchParams.get("tab") as TabId) ?? "active";
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
      {tab === "active"  && <ActiveMenuTab />}
      {tab === "saved"   && <SavedMenusTab />}
      {tab === "explore" && <ExploreMenusTab />}
    </div>
  );
}
