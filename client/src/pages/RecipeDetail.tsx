import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import ShareRecipeButton from "@/components/ShareRecipeButton";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import {
  ArrowLeftIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

type Tab = "ingredients" | "instructions" | "nutrition";

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // ── ALL hooks must be called unconditionally before any early return ──
  const [activeTab, setActiveTab] = useState<Tab>("ingredients");
  const [servings, setServings] = useState<number | null>(null);
  const [loggedMeal, setLoggedMeal] = useState(false);

  const { data: recipe, isLoading } = trpc.recipes.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const { data: inventoryItems } = trpc.inventory.list.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();

  const toggleFav = trpc.recipes.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.recipes.getById.invalidate({ id: Number(id) });
      toast.success("Favoritos actualizados");
    },
  });

  const deleteRecipe = trpc.recipes.delete.useMutation({
    onSuccess: () => {
      toast.success("Receta eliminada");
      navigate("/app/recipes");
    },
  });

  const logMeal = trpc.mealLogs.add.useMutation({
    onSuccess: () => {
      setLoggedMeal(true);
      toast.success("¡Plato registrado en tu diario!");
    },
  });

  // Derived values — safe to compute even when recipe is undefined
  const baseServings = recipe?.servings ?? 1;
  const currentServings = servings ?? baseServings;
  const ratio = currentServings / Math.max(baseServings, 1);

  const inventoryIngredientIds = useMemo(() => {
    if (!inventoryItems) return new Set<number>();
    return new Set(
      inventoryItems
        .filter((item) => item.ingredient?.id != null)
        .map((item) => item.ingredient!.id)
    );
  }, [inventoryItems]);

  const structuredIngredients: Array<{
    id?: number;
    name: string;
    amount: number | null;
    unit: string;
    ingredientId?: number;
  }> = useMemo(() => {
    // Returns null if value is not a valid finite positive number
    const safeAmount = (v: any): number | null => {
      if (v == null) return null;
      const n = typeof v === "string" ? parseFloat(v) : Number(v);
      return isFinite(n) && n > 0 ? n : null;
    };
    if (!recipe) return [];
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      return recipe.ingredients.map((ing: any) => ({
        id: ing.id,
        name: ing.ingredient?.nameEs || ing.customName || "Ingrediente",
        amount: safeAmount(ing.amount),
        unit: ing.measure?.nameEs || "g",
        ingredientId: ing.ingredientId,
      }));
    }
    if (recipe.ingredientsJson) {
      try {
        const parsed = JSON.parse(recipe.ingredientsJson as string);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, i: number) => ({
            id: i,
            name: item.name || item.ingredient || "Ingrediente",
            amount: safeAmount(item.amount ?? item.quantity),
            unit: item.unit || "g",
          }));
        }
      } catch {}
    }
    return [];
  }, [recipe]);

  const structuredSteps: Array<{ stepNumber: number; instruction: string }> = useMemo(() => {
    if (!recipe) return [];
    if (recipe.steps && recipe.steps.length > 0) {
      return recipe.steps
        .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
        .map((s: any) => ({
          stepNumber: s.stepNumber,
          instruction: s.instruction || s.description || "",
        }));
    }
    if (recipe.instructionsJson) {
      try {
        const parsed = JSON.parse(recipe.instructionsJson as string);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, i: number) => ({
            stepNumber: item.step ?? i + 1,
            instruction: item.text || item.instruction || item.description || "",
          }));
        }
      } catch {}
    }
    return [];
  }, [recipe]);

  // ── Early returns AFTER all hooks ──
  if (isLoading) {
    return (
      <div className="vively-page">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F97316] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="vively-page container text-center">
        <p className="text-gray-500">Receta no encontrada</p>
        <Link href="/app/recipes" className="btn-vively mt-4 inline-block">
          Volver a recetas
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === recipe.userId;
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);

  const nutrition = {
    calories: recipe.caloriesPerServing ? Math.round(recipe.caloriesPerServing * ratio) : null,
    proteins: recipe.proteinsPerServing ? +(recipe.proteinsPerServing * ratio).toFixed(1) : null,
    carbs: recipe.carbsPerServing ? +(recipe.carbsPerServing * ratio).toFixed(1) : null,
    fats: recipe.fatsPerServing ? +(recipe.fatsPerServing * ratio).toFixed(1) : null,
    fiber: recipe.fiberPerServing ? +(recipe.fiberPerServing * ratio).toFixed(1) : null,
  };

  const hasNutrition =
    nutrition.calories || nutrition.proteins || nutrition.carbs || nutrition.fats;

  const tabs: { key: Tab; label: string; extra?: string; icon?: string }[] = [
    {
      key: "ingredients",
      label: "Ingredientes",
      extra: structuredIngredients.length > 0 ? String(structuredIngredients.length) : undefined,
    },
    {
      key: "instructions",
      label: "Instrucciones",
      extra: totalTime > 0 ? `${totalTime} min` : undefined,
    },
    { key: "nutrition", label: "Valores\nnutricionales", icon: "🍽️" },
  ];

  return (
    <div className="vively-page pb-24" style={{ background: "#FAF8F5", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => navigate("/app/recipes")}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFav.mutate({ recipeId: recipe.id })}
            className="rounded-full p-2 hover:bg-orange-50"
          >
            <HeartIcon className="h-5 w-5 text-gray-400" />
          </button>
          <ShareRecipeButton
            recipeId={recipe.id}
            recipeName={recipe.name}
            recipeDescription={recipe.description ?? undefined}
            variant="icon"
          />
          {isOwner && (
            <>
              <Link
                href={`/app/recipes/${recipe.id}/edit`}
                className="rounded-full p-2 hover:bg-orange-50"
              >
                <PencilIcon className="h-5 w-5 text-gray-400" />
              </Link>
              <button
                onClick={() => {
                  if (confirm("¿Eliminar esta receta?")) deleteRecipe.mutate({ id: recipe.id });
                }}
                className="rounded-full p-2 hover:bg-red-50"
              >
                <TrashIcon className="h-5 w-5 text-red-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recipe image */}
      <div className="mb-4 -mx-4 overflow-hidden" style={{ height: 220 }}>
        <img
          src={recipe.imageUrl || RECIPE_PLACEHOLDER_IMAGE}
          alt={recipe.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }}
        />
      </div>

      {/* Title & description */}
      <div className="mb-3 px-1">
        <h1 className="text-xl font-extrabold text-gray-900 mb-1">{recipe.name}</h1>
        {recipe.description && (
          <p className="text-sm text-gray-500 leading-relaxed">{recipe.description}</p>
        )}
      </div>

      {/* Meal-time tags */}
      {recipe.mealTime && recipe.mealTime !== "cualquiera" && (
        <div className="flex flex-wrap gap-2 mb-4 px-1">
          {(
            {
              desayuno: "Desayuno",
              comida: "Almuerzo",
              cena: "Cena",
              merienda: "Merienda",
              media_manana: "Media mañana",
            } as Record<string, string>
          )[recipe.mealTime] && (
            <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600">
              {
                (
                  {
                    desayuno: "Desayuno",
                    comida: "Almuerzo",
                    cena: "Cena",
                    merienda: "Merienda",
                    media_manana: "Media mañana",
                  } as Record<string, string>
                )[recipe.mealTime]
              }
            </span>
          )}
        </div>
      )}

      {/* 3-tab selector */}
      <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-3">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center py-3 px-2 text-center transition-all ${
                  isActive ? "bg-[#F97316] text-white" : "bg-white text-[#F97316]"
                } ${idx < 2 ? "border-r border-gray-100" : ""}`}
              >
                {tab.icon && <span className="text-base mb-0.5">{tab.icon}</span>}
                {tab.extra && (
                  <span
                    className={`text-base font-bold ${
                      isActive ? "text-white" : "text-[#F97316]"
                    }`}
                  >
                    {tab.extra}
                  </span>
                )}
                <span
                  className={`text-xs font-semibold leading-tight whitespace-pre-line ${
                    isActive ? "text-white" : "text-gray-700"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB: Ingredients ── */}
      {activeTab === "ingredients" && (
        <div className="rounded-2xl bg-white shadow-sm p-4">
          {/* Servings selector */}
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => setServings(Math.max(1, currentServings - 1))}
              className="h-9 w-9 rounded-full border-2 border-[#F97316] flex items-center justify-center text-[#F97316] text-xl font-bold hover:bg-orange-50"
            >
              −
            </button>
            <span className="text-lg font-bold text-gray-900">{currentServings} raciones</span>
            <button
              onClick={() => setServings(currentServings + 1)}
              className="h-9 w-9 rounded-full border-2 border-[#F97316] flex items-center justify-center text-[#F97316] text-xl font-bold hover:bg-orange-50"
            >
              +
            </button>
          </div>

          {/* Ingredient list */}
          {structuredIngredients.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {structuredIngredients.map((ing, i) => {
                const inStock = ing.ingredientId
                  ? inventoryIngredientIds.has(ing.ingredientId)
                  : false;
                const scaledAmount =
                  ing.amount != null ? +(ing.amount * ratio).toFixed(1) : null;
                const displayAmount =
                  scaledAmount != null
                    ? scaledAmount % 1 === 0
                      ? scaledAmount.toFixed(0)
                      : scaledAmount.toFixed(1)
                    : null;

                return (
                  <li key={i} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {ing.name}
                      </span>
                      {user &&
                        (inStock ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600 shrink-0">
                            <CheckCircleIcon className="h-3 w-3" />
                            En stock
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500 shrink-0">
                            <ShoppingCartIcon className="h-3 w-3" />
                            Sin stock
                          </span>
                        ))}
                    </div>
                    {displayAmount != null && (
                      <span className="ml-3 text-sm font-bold text-[#F97316] shrink-0">
                        {displayAmount}{" "}
                        <span className="font-normal text-gray-500">{ing.unit}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin ingredientes registrados
            </p>
          )}

          {/* "He comido este plato" */}
          <button
            onClick={() => {
              if (!user) {
                toast.error("Inicia sesión para registrar comidas");
                return;
              }
              if (loggedMeal) return;
              logMeal.mutate({
                recipeId: recipe.id,
                servings: currentServings,
                logDate: new Date().toISOString().slice(0, 10),
              });
            }}
            className={`mt-5 w-full rounded-2xl border-2 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              loggedMeal
                ? "border-green-400 text-green-600 bg-green-50"
                : "border-[#F97316] text-[#F97316] hover:bg-orange-50"
            }`}
          >
            <CheckCircleIcon className="h-5 w-5" />
            {loggedMeal ? "¡Registrado en el diario!" : "He comido este plato"}
          </button>
        </div>
      )}

      {/* ── TAB: Instructions ── */}
      {activeTab === "instructions" && (
        <div className="space-y-3">
          {structuredSteps.length > 0 ? (
            structuredSteps.map((step) => (
              <div key={step.stepNumber} className="rounded-2xl bg-white shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-sm font-bold text-white">
                    {step.stepNumber}
                  </div>
                  <span className="font-bold text-gray-900 text-sm">
                    Paso {step.stepNumber}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700 pl-11">
                  {step.instruction}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400">Sin instrucciones registradas</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Nutritional values ── */}
      {activeTab === "nutrition" && (
        <div className="rounded-2xl bg-white shadow-sm p-4">
          {hasNutrition ? (
            <>
              <p className="text-sm font-bold text-[#F97316] mb-4">
                Por ración
                {currentServings !== baseServings ? ` (×${currentServings})` : ""}
              </p>
              <ul className="divide-y divide-gray-50">
                {(
                  [
                    { label: "Grasas", value: nutrition.fats, unit: "g" },
                    { label: "Carbohidratos", value: nutrition.carbs, unit: "g" },
                    { label: "Proteínas", value: nutrition.proteins, unit: "g" },
                    { label: "Fibra", value: nutrition.fiber, unit: "g" },
                    { label: "Calorías", value: nutrition.calories, unit: "Kcal", highlight: true },
                  ] as Array<{ label: string; value: number | null; unit: string; highlight?: boolean }>
                ).map((row) =>
                  row.value != null ? (
                    <li key={row.label} className="flex items-center justify-between py-3">
                      <span className="text-sm text-gray-700">{row.label}</span>
                      <span
                        className={`text-sm font-bold ${
                          row.highlight ? "text-[#F97316] text-base" : "text-gray-900"
                        }`}
                      >
                        {row.value} {row.unit}
                      </span>
                    </li>
                  ) : null
                )}
              </ul>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-2xl mb-2">🍽️</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Sin datos nutricionales
              </p>
              <p className="text-xs text-gray-400">
                Esta receta aún no tiene información nutricional calculada.
              </p>
            </div>
          )}

          {/* Allergens */}
          {recipe.allergies && recipe.allergies.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Contiene alérgenos
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {recipe.allergies.map((a: any) => (
                  <span
                    key={a.id}
                    className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
                  >
                    {a.nameEs}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social share bar */}
      <ShareRecipeButton
        recipeId={recipe.id}
        recipeName={recipe.name}
        recipeDescription={recipe.description ?? undefined}
        variant="bar"
      />

      <div className="vively-disclaimer mt-6">
        <p>BuddyMarket no constituye asesoramiento nutricional profesional.</p>
      </div>
    </div>
  );
}
