import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  SparklesIcon,
  BookOpenIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

const MEAL_TYPE_KEYS = [
  { key: "breakfast", tKey: "mealLog.breakfast", emoji: "🌅", apiParam: "breakfast" },
  { key: "lunch", tKey: "mealLog.lunch", emoji: "☀️", apiParam: "lunch" },
  { key: "snack", tKey: "mealLog.snack", emoji: "🍎", apiParam: "snack" },
  { key: "dinner", tKey: "mealLog.dinner", emoji: "🌙", apiParam: "dinner" },
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
  const { t } = useTranslation();
  const MEAL_TYPES = MEAL_TYPE_KEYS.map(m => ({ ...m, label: t(m.tKey, m.key) }));
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState<{ dayPartId: number; mealType: string } | null>(null);
  const [menuName, setMenuName] = useState("");
  const [aiObjective, setAiObjective] = useState("");
  const [generating, setGenerating] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [showApplyModal, setShowApplyModal] = useState<number | null>(null); // menuId
  const [applyStartDate, setApplyStartDate] = useState(() => new Date().toISOString().split("T")[0]);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const { data: menus, refetch: refetchMenus } = trpc.menus.list.useQuery();
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const { data: dayItems, refetch: refetchDayItems } = trpc.menus.getItemsByDate.useQuery(
    { date: selectedDateStr },
    { enabled: true }
  );

  const { data: recipeResults } = trpc.recipes.list.useQuery(
    { search: recipeSearch, limit: 20 },
    { enabled: showAddRecipe !== null && recipeSearch.length > 1 }
  );

  const utils = trpc.useUtils();

  const createMenu = trpc.menus.create.useMutation({
    onSuccess: () => {
      refetchMenus();
      setShowNewMenu(false);
      setMenuName("");
      toast.success(t("menus.menuCreated", "Menu created"));
    },
  });

  const ensureDayPart = trpc.menus.ensureDayPart.useMutation();

  const addRecipeToDayPart = trpc.menus.addRecipeToDayPart.useMutation({
    onSuccess: () => {
      refetchDayItems();
      setShowAddRecipe(null);
      setRecipeSearch("");
      toast.success(t("menus.recipeAdded", "Recipe added to menu"));
    },
    onError: (err: any) => toast.error(err.message || t("menus.errorAddRecipe", "Error adding recipe")),
  });

  const removeRecipeFromDayPart = trpc.menus.removeRecipeFromDayPart.useMutation({
    onSuccess: () => {
      refetchDayItems();
      toast.success(t("menus.recipeRemoved", "Recipe removed from menu"));
    },
  });

  const applyToCalendar = trpc.menus.applyToCalendar.useMutation({
    onSuccess: (data) => {
      utils.mealLogs.list.invalidate();
      setShowApplyModal(null);
      toast.success(`✅ ${data.logsCreated} ${t("menus.mealsAddedToDiary", "meals added to diary from")} ${applyStartDate}`);
    },
    onError: () => toast.error(t("menus.errorApplyDiary", "Error applying menu to diary")),
  });

  const generateAI = trpc.menus.generateWithAI.useMutation({
    onSuccess: () => {
      refetchDayItems();
      setGenerating(false);
      setShowAI(false);
      toast.success(t("menus.aiGenerated", "Menu generated with AI!"));
    },
    onError: () => { setGenerating(false); toast.error(t("menus.errorGenerate", "Error generating menu")); },
  });

  const handleGenerateAI = () => {
    if (!menus || menus.length === 0) {
      toast.error(t("menus.createFirst", "Create a menu first"));
      return;
    }
    setGenerating(true);
    generateAI.mutate({
      objective: aiObjective || undefined,
      days: 7,
      mealsPerDay: 4,
    });
  };

  const handleAddRecipeToMeal = async (mealType: string) => {
    if (!menus || menus.length === 0) {
      toast.error(t("menus.createFirstRecipes", "Create a menu first to add recipes"));
      setShowNewMenu(true);
      return;
    }
    const menuId = selectedMenuId ?? menus[0].id;
    try {
      const result = await ensureDayPart.mutateAsync({ menuId, date: selectedDateStr, mealType });
      setShowAddRecipe({ dayPartId: result.id, mealType });
    } catch (e: any) {
      toast.error(t("menus.errorPrepare", "Error preparing menu"));
    }
  };

  const handleAddRecipe = (recipeId: number) => {
    if (!showAddRecipe) return;
    addRecipeToDayPart.mutate({ menuOrganizerDayPartId: showAddRecipe.dayPartId, recipeId });
  };

  // Build a map of mealType -> items from dayItems
  const mealMap: Record<string, any[]> = {};
  (dayItems ?? []).forEach((dp: any) => {
    const key = dp.dayPartKey ?? "meal";
    if (!mealMap[key]) mealMap[key] = [];
    mealMap[key].push(...(dp.recipes ?? []));
  });

  // Check if any day has items (for dot indicator)
  const daysWithItems = new Set<string>();
  (dayItems ?? []).forEach((dp: any) => {
    if (dp.recipes?.length > 0) daysWithItems.add(selectedDateStr);
  });

  const hasMenus = menus && menus.length > 0;

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Planificador</h1>
          <button
            onClick={() => setShowNewMenu(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F97316] shadow-sm"
          >
            <PlusIcon className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <Link href="/app/active-menu">
            <button className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600 whitespace-nowrap">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" />
              En curso
            </button>
          </Link>
          <Link href="/app/menu-library">
            <button className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-600 whitespace-nowrap">
              <BookOpenIcon className="h-4 w-4 shrink-0" />
              Biblioteca
            </button>
          </Link>
          <button
            onClick={() => setShowAI(true)}
            className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 whitespace-nowrap"
          >
            <SparklesIcon className="h-4 w-4 shrink-0" />
            IA
          </button>
        </div>
      </div>

      {/* Active menu selector */}
      {hasMenus && (
        <div className="mb-4">
          {menus.length > 1 && (
            <div className="overflow-x-auto mb-2">
              <div className="flex gap-2 pb-1">
                {menus.map((menu: any) => (
                  <button
                    key={menu.id}
                    onClick={() => setSelectedMenuId(menu.id)}
                    className={`shrink-0 rounded-2xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      (selectedMenuId ?? menus[0].id) === menu.id
                        ? "bg-[#F97316] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Apply to diary button for active menu */}
          {(() => {
            const activeMenu = menus.find((m: any) => m.id === (selectedMenuId ?? menus[0].id)) ?? menus[0];
            return activeMenu ? (
              <button
                onClick={() => { setShowApplyModal(activeMenu.id); setApplyStartDate(new Date().toISOString().split("T")[0]); }}
                className="flex items-center gap-2 rounded-2xl bg-orange-50 border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-600 w-full justify-center"
              >
                <CalendarDaysIcon className="h-4 w-4" />
                {t("menus.applyMenuToDiary", "Apply \"{{name}}\" to food diary").replace("{{name}}", activeMenu.name)}
              </button>
            ) : null;
          })()}
        </div>
      )}

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
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(date)}
              className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-2 transition-all ${
                isSelected
                  ? "bg-[#F97316] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="text-[13px] font-medium">{DAYS_ES[date.getDay()]}</span>
              <span className={`text-base font-bold ${isToday && !isSelected ? "text-[#F97316]" : ""}`}>
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* No menus state */}
      {!hasMenus ? (
        <div className="empty-state">
          <span className="mb-4 text-5xl">📅</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">Sin planificador activo</h3>
          <p className="mb-4 text-sm text-gray-500">Crea tu primer menú semanal o importa uno de la biblioteca de menús predefinidos.</p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button onClick={() => setShowNewMenu(true)} className="btn-vively w-full">➕ {t("menus.createNewMenu", "Create new menu")}</button>
            <Link href="/app/menu-library">
              <button className="btn-vively-outline w-full">📚 {t("menus.exploreLibrary", "Explore library")}</button>
            </Link>
            <button onClick={() => setShowAI(true)} className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 py-3 text-sm font-semibold text-blue-600 w-full">
              ✨ {t("menus.generateWithAI", "Generate with AI")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Selected day meals */}
          <div className="mb-4">
            <h2 className="mb-3 text-sm font-bold text-gray-700">
              {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </h2>

            {MEAL_TYPES.map((mealType) => {
              const items = mealMap[mealType.apiParam] ?? [];
              return (
                <div key={mealType.key} className="vively-card mb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{mealType.emoji}</span>
                      <span className="text-sm font-semibold text-gray-800">{mealType.label}</span>
                    </div>
                    <button
                      onClick={() => handleAddRecipeToMeal(mealType.apiParam)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-[#F97316] hover:bg-orange-100 transition-all"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <button
                      onClick={() => handleAddRecipeToMeal(mealType.apiParam)}
                      className="w-full rounded-xl border-2 border-dashed border-gray-200 py-3 text-xs text-gray-400 hover:border-[#F97316]/40 hover:text-[#F97316] transition-all"
                    >
                      + {t("menus.addRecipe", "Add recipe")}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={item.recipe?.imageUrl || RECIPE_PLACEHOLDER_IMAGE}
                              alt=""
                              className="h-8 w-8 rounded-lg object-cover shrink-0"
                              onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {item.recipe?.name ?? t("menus.deletedRecipe", "Deleted recipe")}
                              </p>
                              {item.recipe?.calories && (
                                <p className="text-xs text-gray-400">{item.recipe.calories} kcal</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeRecipeFromDayPart.mutate({
                              menuOrganizerDayPartId: item.menuOrganizerDayPartId,
                              recipeId: item.recipeId,
                            })}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
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

          {/* Quick actions */}
          <div className="vively-card mb-4 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="h-5 w-5 text-[#F97316] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{t("menus.generateShoppingList", "Generate your shopping list")}</p>
                <p className="text-xs text-gray-500">{t("menus.basedOnRecipes", "Based on this menu's recipes")}</p>
              </div>
              <Link href="/app/shopping-lists">
                <button className="shrink-0 rounded-xl bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white">
                  {t("menus.createList", "Create list")}
                </button>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* New menu modal */}
      {showNewMenu && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewMenu(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Nuevo menú semanal</h3>
            <p className="mb-4 text-xs text-gray-500">Dale un nombre a tu planificador</p>
            <input
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const today = new Date().toISOString().split("T")[0];
                  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
                  createMenu.mutate({ name: menuName || "Mi menú", startDate: today, endDate: nextWeek });
                }
              }}
              placeholder={t("menus.menuNamePlaceholder", "E.g.: Healthy week, Mediterranean diet...")}
              className="vively-input mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewMenu(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
              >
                {t("common.cancel", "Cancel")}
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
                {createMenu.isPending ? t("common.creating", "Creating...") : t("common.create", "Create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI generation modal */}
      {showAI && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAI(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                <SparklesIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t("menus.generateWithAI", "Generate with AI")}</h3>
                <p className="text-xs text-gray-500">{t("menus.aiWillCreate", "AI will create a personalised menu")}</p>
              </div>
            </div>
            {!hasMenus && (
              <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-700">
                ⚠️ {t("menus.needMenuFirst", "You need to create a menu first. One will be created automatically.")}
              </div>
            )}
            <input
              value={aiObjective}
              onChange={(e) => setAiObjective(e.target.value)}
              placeholder={t("menus.aiObjectivePlaceholder", "Objective (e.g.: lose weight, Mediterranean diet, vegan...)")}
              className="vively-input mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAI(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={generating}
                className="flex-1 btn-vively"
              >
                {generating ? t("common.generating", "Generating...") : `✨ ${t("common.generate", "Generate")}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add recipe modal */}
      {showAddRecipe && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddRecipe(null); setRecipeSearch(""); } }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[80vh] flex flex-col">
            <h3 className="mb-1 text-lg font-bold text-gray-900">{t("menus.addRecipe", "Add recipe")}</h3>
            <p className="mb-4 text-xs text-gray-500">{t("menus.searchRecipeDesc", "Search for a recipe to add to the menu")}</p>
            <input
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              placeholder={t("menus.searchRecipe", "Search recipe...")}
              className="vively-input mb-3"
              autoFocus
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {recipeSearch.length < 2 ? (
                <p className="text-center text-sm text-gray-400 py-4">{t("menus.typeToSearch", "Type at least 2 letters to search")}</p>
              ) : !recipeResults || (recipeResults as any).recipes?.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">{t("menus.noResults", "No results for")} "{recipeSearch}"</p>
              ) : (
                ((recipeResults as any).recipes ?? []).map((recipe: any) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAddRecipe(recipe.id)}
                    disabled={addRecipeToDayPart.isPending}
                    className="w-full flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left hover:border-[#F97316]/30 hover:bg-orange-50 transition-all"
                  >
                    <img
                      src={recipe.imageUrl || RECIPE_PLACEHOLDER_IMAGE}
                      alt=""
                      className="h-10 w-10 rounded-xl object-cover shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{recipe.name}</p>
                      <p className="text-xs text-gray-400">{recipe.calories ? `${recipe.calories} kcal · ` : ""}{recipe.prepTime ? `${recipe.prepTime} min` : ""}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setShowAddRecipe(null); setRecipeSearch(""); }}
              className="mt-4 w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
            >
              {t("common.cancel", "Cancel")}
            </button>
          </div>
        </div>
      )}
      {/* Apply to Calendar modal */}
      {showApplyModal !== null && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowApplyModal(null); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                <CalendarDaysIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t("menus.applyToDiary", "Apply to diary")}</h3>
                <p className="text-xs text-gray-500">{t("menus.applyToDiaryDesc", "Menu meals will be added to your diary")}</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("menus.startDate", "Start date")}</label>
              <input
                type="date"
                value={applyStartDate}
                onChange={e => setApplyStartDate(e.target.value)}
                className="vively-input"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t("menus.startDateDesc", "Meals will be distributed from this date according to the menu days.")}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(null)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                onClick={() => applyToCalendar.mutate({ menuId: showApplyModal, startDate: applyStartDate, overwrite: false })}
                disabled={applyToCalendar.isPending}
                className="flex-1 btn-vively"
              >
                {applyToCalendar.isPending ? `⏳ ${t("common.applying", "Applying...")}` : `✅ ${t("common.apply", "Apply")}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vively-disclaimer">
        <p>{t("menus.disclaimer", "AI-generated menus are for guidance only. Consult a nutritionist.")}</p>
      </div>
    </div>
  );
}
