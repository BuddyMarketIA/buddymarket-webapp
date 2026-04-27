import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import ShareRecipeButton from "@/components/ShareRecipeButton";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "@/components/sonner-a11y-shim";
import { useState, useMemo } from "react";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import { useRecipeAllergyCheck } from "@/hooks/useRecipeAllergyCheck";
import {
  ArrowLeftIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

type Tab = "ingredients" | "instructions" | "nutrition";

export default function RecipeDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // ── ALL hooks must be called unconditionally before any early return ──
  const [activeTab, setActiveTab] = useState<Tab>("ingredients");
  const [servings, setServings] = useState<number | null>(null);
  const [loggedMeal, setLoggedMeal] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logDayPartId, setLogDayPartId] = useState("1");
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [adaptResult, setAdaptResult] = useState<{
    adaptedName: string;
    description: string;
    substitutions: Array<{ original: string; replacement: string; reason: string }>;
    adaptedIngredients: string;
    adaptedInstructions: string;
    nutritionalNote: string;
  } | null>(null);

  const [savedAdapted, setSavedAdapted] = useState(false);
  const saveAdaptedMutation = trpc.recipes.saveAdaptedAsPublic.useMutation({
    onSuccess: (data) => {
      setSavedAdapted(true);
      toast.success("¡Receta adaptada guardada en la comunidad! 🎉", {
        description: "Ya está disponible para todos los usuarios de Buddy One",
        action: data.recipeId ? { label: "Ver receta", onClick: () => navigate(`/app/recipes/${data.recipeId}`) } : undefined,
        duration: 6000,
      });
    },
    onError: (err) => toast.error(err.message || "Error al guardar la receta"),
  });
  const adaptRecipe = trpc.recipes.adaptForUser.useMutation({
    onSuccess: (data) => {
      setAdaptResult(data);
      setShowAdaptModal(true);
      // Mostrar toast de insignia si se ha ganado alguna
      if (data.badgesAwarded && data.badgesAwarded.length > 0) {
        data.badgesAwarded.forEach((badge: any) => {
          setTimeout(() => {
            toast.success(
              `🎖️ ¡Insignia desbloqueada! ${badge.icon ?? "🎖️"} ${badge.nameEs}`,
              {
                description: badge.descriptionEs,
                duration: 6000,
                action: {
                  label: "Ver insignias",
                  onClick: () => { window.location.href = "/app/badges"; },
                },
              }
            );
          }, 1500);
        });
      }
    },
    onError: (err) => {
      toast.error(err.message || "Error al adaptar la receta");
    },
  });
  const { data: dayParts } = trpc.catalogs.dayParts.useQuery();

  const { data: recipe, isLoading } = trpc.recipes.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );
  // SAFETY: Must be called unconditionally (before any early return)
  const { hasViolation, violatingIngredients } = useRecipeAllergyCheck(recipe);

  const { data: inventoryItems } = trpc.inventory.list.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();

  const { data: likeStatus } = trpc.recipeLikes.getStatus.useQuery(
    { recipeId: Number(id) },
    { enabled: !!user && !!id }
  );
  const toggleLike = trpc.recipeLikes.toggle.useMutation({
    // Optimistic update: flip liked state and adjust count immediately
    onMutate: async () => {
      await utils.recipeLikes.getStatus.cancel({ recipeId: Number(id) });
      const prev = utils.recipeLikes.getStatus.getData({ recipeId: Number(id) });
      if (prev) {
        utils.recipeLikes.getStatus.setData(
          { recipeId: Number(id) },
          {
            liked: !prev.liked,
            likesCount: prev.liked
              ? Math.max(0, (prev.likesCount ?? 0) - 1)
              : (prev.likesCount ?? 0) + 1,
          }
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        utils.recipeLikes.getStatus.setData({ recipeId: Number(id) }, ctx.prev);
      }
    },
    onSettled: () => {
      utils.recipeLikes.getStatus.invalidate({ recipeId: Number(id) });
    },
  });

  const { data: isFavoriteData } = trpc.recipes.isFavorite.useQuery(
    { recipeId: Number(id) },
    { enabled: !!user && !!id }
  );
  const toggleFav = trpc.recipes.toggleFavorite.useMutation({
    onMutate: async () => {
      await utils.recipes.isFavorite.cancel({ recipeId: Number(id) });
      const prev = utils.recipes.isFavorite.getData({ recipeId: Number(id) });
      utils.recipes.isFavorite.setData({ recipeId: Number(id) }, !prev);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        utils.recipes.isFavorite.setData({ recipeId: Number(id) }, ctx.prev);
      }
    },
    onSettled: () => {
      utils.recipes.isFavorite.invalidate({ recipeId: Number(id) });
      utils.recipes.getFavoriteIds.invalidate();
    },
    onSuccess: () => {
      toast.success(
        isFavoriteData
          ? t("recipes.removedFromFavorites", "Eliminada de favoritos")
          : t("recipes.addedToFavorites", "Añadida a favoritos ❤️")
      );
    },
  });

  const deleteRecipe = trpc.recipes.delete.useMutation({
    onSuccess: () => {
      toast.success(t("recipes.deleted", "Recipe deleted"));
      navigate("/app/recipes");
    },
  });

  const logMeal = trpc.mealLogs.add.useMutation({
    onSuccess: () => {
      setLoggedMeal(true);
      setShowLogDialog(false);
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
        <p className="text-muted-foreground">{t("recipes.notFound", "Recipe not found")}</p>
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
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleFav.mutate({ recipeId: recipe.id })}
            className="rounded-full p-2 hover:bg-orange-50 transition-colors"
            title={isFavoriteData ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            {isFavoriteData ? (
              <HeartSolid className="h-5 w-5 text-orange-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-muted-foreground/70" />
            )}
          </button>
          {user && (
            <button
              onClick={() => toggleLike.mutate({ recipeId: recipe.id })}
              className="flex items-center gap-1 rounded-full px-2 py-1.5 hover:bg-red-50 transition-colors"
              title={likeStatus?.liked ? "Quitar like" : "Me gusta"}
            >
              {likeStatus?.liked ? (
                <HeartSolid className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-muted-foreground/70" />
              )}
              {likeStatus?.likesCount !== undefined && likeStatus.likesCount > 0 && (
                <span className="text-xs font-medium text-muted-foreground">{likeStatus.likesCount}</span>
              )}
            </button>
          )}
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
                <PencilIcon className="h-5 w-5 text-muted-foreground/70" />
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
        <h1 className="text-xl font-extrabold text-foreground mb-1">{recipe.name}</h1>
        {recipe.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{recipe.description}</p>
        )}
      </div>

      {/* ALLERGY ALERT BANNER — shown when recipe contains forbidden ingredients */}
      {hasViolation && user && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
            border: "1.5px solid #fca5a5",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <div style={{
              background: "#dc2626",
              borderRadius: "10px",
              padding: "8px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <ExclamationTriangleIcon style={{ width: "20px", height: "20px", color: "white" }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#991b1b", lineHeight: 1.3 }}>
                Esta receta no está pensada para ti
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#b91c1c", lineHeight: 1.4 }}>
                Contiene ingredientes que debes evitar según tu perfil:
              </p>
            </div>
          </div>
          {/* Violating ingredients pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "38px" }}>
            {violatingIngredients.map((ing) => (
              <span
                key={ing}
                style={{
                  background: "#dc2626",
                  color: "white",
                  borderRadius: "20px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ⚠️ {ing}
              </span>
            ))}
          </div>
          {/* Adapt button */}
          <button
            onClick={() => {
              if (adaptRecipe.isPending) return;
              adaptRecipe.mutate({
                recipeId: recipe.id,
                forbiddenIngredients: violatingIngredients,
              });
            }}
            disabled={adaptRecipe.isPending}
            style={{
              background: "linear-gradient(135deg, #F97316 0%, #ea580c 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 16px rgba(249,115,22,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(249,115,22,0.3)"; }}
          >
            {adaptRecipe.isPending ? (
              <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Adaptando con IA...</>
            ) : (
              <><SparklesIcon style={{ width: "18px", height: "18px" }} /> Adaptar esta receta para mí con IA</>
            )}
          </button>
          {/* Disclaimer */}
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", textAlign: "center", lineHeight: 1.4 }}>
            Buddy One te cuida. La IA sustituirá los ingredientes problemáticos manteniendo el sabor y los valores nutricionales.
          </p>
        </div>
      )}

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
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
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
      <div className="mb-4 rounded-2xl overflow-hidden border border-border/50 bg-background shadow-sm">
        <div className="grid grid-cols-3">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center py-3 px-2 text-center transition-all ${
                  isActive ? "bg-[#F97316] text-white" : "bg-background text-[#F97316]"
                } ${idx < 2 ? "border-r border-border/50" : ""}`}
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
                    isActive ? "text-white" : "text-foreground/80"
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
        <div className="rounded-2xl bg-background shadow-sm p-4">
          {/* Servings selector */}
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => setServings(Math.max(1, currentServings - 1))}
              className="h-9 w-9 rounded-full border-2 border-[#F97316] flex items-center justify-center text-[#F97316] text-xl font-bold hover:bg-orange-50"
            >
              −
            </button>
            <span className="text-lg font-bold text-foreground">{currentServings} raciones</span>
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
                      <span className="font-semibold text-foreground text-sm truncate">
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
                        <span className="font-normal text-muted-foreground">{ing.unit}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground/70 text-center py-4">
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
              setShowLogDialog(true);
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
              <div key={step.stepNumber} className="rounded-2xl bg-background shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-sm font-bold text-white">
                    {step.stepNumber}
                  </div>
                  <span className="font-bold text-foreground text-sm">
                    Paso {step.stepNumber}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80 pl-11">
                  {step.instruction}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-background shadow-sm p-6 text-center">
              <p className="text-sm text-muted-foreground/70">Sin instrucciones registradas</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Nutritional values ── */}
      {activeTab === "nutrition" && (
        <div className="rounded-2xl bg-background shadow-sm p-4">
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
                      <span className="text-sm text-foreground/80">{row.label}</span>
                      <span
                        className={`text-sm font-bold ${
                          row.highlight ? "text-[#F97316] text-base" : "text-foreground"
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
              <p className="text-sm font-semibold text-foreground/80 mb-1">
                Sin datos nutricionales
              </p>
              <p className="text-xs text-muted-foreground/70">
                Esta receta aún no tiene información nutricional calculada.
              </p>
            </div>
          )}

          {/* Allergens */}
          {recipe.allergies && recipe.allergies.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/50">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
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

      {/* Log meal dialog */}
      {showLogDialog && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLogDialog(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">¿Cuándo lo comiste?</h3>
              <button
                onClick={() => setShowLogDialog(false)}
                className="rounded-full p-1 hover:bg-muted/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">📅 Día</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-2xl border-2 border-border/50 bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">🕐 Momento del día</label>
                <div className="grid grid-cols-2 gap-2">
                  {(dayParts ?? [
                    { id: 1, nameEs: "Desayuno" },
                    { id: 2, nameEs: "Media mañana" },
                    { id: 3, nameEs: "Almuerzo" },
                    { id: 4, nameEs: "Merienda" },
                    { id: 5, nameEs: "Cena" },
                  ]).map((dp) => {
                    const emojis: Record<string, string> = {
                      "Desayuno": "🌅",
                      "Media mañana": "☕",
                      "Almuerzo": "🍽️",
                      "Comida": "🍽️",
                      "Merienda": "🍎",
                      "Cena": "🌙",
                    };
                    const isSelected = String(dp.id) === logDayPartId;
                    return (
                      <button
                        key={dp.id}
                        onClick={() => setLogDayPartId(String(dp.id))}
                        className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                          isSelected
                            ? "border-[#F97316] bg-orange-50 text-[#F97316]"
                            : "border-border/50 bg-muted/30 text-muted-foreground hover:border-orange-200"
                        }`}
                      >
                        <span>{emojis[dp.nameEs] ?? "🍴"}</span>
                        <span>{dp.nameEs}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 text-center">
                Se registrarán <strong>{currentServings} ración{currentServings !== 1 ? "es" : ""}</strong> de <strong>{recipe.name}</strong>
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowLogDialog(false)}
                className="flex-1 rounded-2xl border-2 border-border py-3 text-sm font-semibold text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  logMeal.mutate({
                    recipeId: recipe.id,
                    servings: currentServings,
                    logDate: logDate,
                    dayPartId: Number(logDayPartId),
                  });
                }}
                disabled={logMeal.isPending}
                className="flex-1 rounded-2xl bg-[#F97316] py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60"
              >
                {logMeal.isPending ? "Guardando..." : "Guardar en el diario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADAPT RECIPE RESULT MODAL */}
      {showAdaptModal && adaptResult && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdaptModal(false); }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "24px",
              background: "white",
              padding: "24px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "linear-gradient(135deg, #F97316, #ea580c)", borderRadius: "12px", padding: "8px", display: "flex" }}>
                  <SparklesIcon style={{ width: "20px", height: "20px", color: "white" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>Receta adaptada para ti</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>Buddy One IA</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdaptModal(false)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ×
              </button>
            </div>

            {/* New name */}
            <div style={{ background: "linear-gradient(135deg, #fff7ed, #ffedd5)", borderRadius: "16px", padding: "16px", marginBottom: "16px", border: "1px solid #fed7aa" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Versión adaptada</p>
              <p style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a" }}>{adaptResult.adaptedName}</p>
              {adaptResult.description && (
                <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#4b5563", lineHeight: 1.5 }}>{adaptResult.description}</p>
              )}
            </div>

            {/* Substitutions */}
            {adaptResult.substitutions.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Sustituciones realizadas</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {adaptResult.substitutions.map((sub, i) => (
                    <div key={i} style={{ background: "#f9fafb", borderRadius: "12px", padding: "12px", border: "1px solid #e5e7eb" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ background: "#fee2e2", color: "#dc2626", borderRadius: "8px", padding: "2px 8px", fontSize: "12px", fontWeight: 700 }}>{sub.original}</span>
                        <span style={{ color: "#9ca3af", fontSize: "14px" }}>→</span>
                        <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: "8px", padding: "2px 8px", fontSize: "12px", fontWeight: 700 }}>{sub.replacement}</span>
                      </div>
                      {sub.reason && (
                        <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", lineHeight: 1.4 }}>{sub.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adapted ingredients */}
            {adaptResult.adaptedIngredients && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Ingredientes adaptados</p>
                <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "12px", border: "1px solid #e5e7eb" }}>
                  <pre style={{ margin: 0, fontSize: "12px", color: "#374151", whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>{adaptResult.adaptedIngredients}</pre>
                </div>
              </div>
            )}

            {/* Nutritional note */}
            {adaptResult.nutritionalNote && (
              <div style={{ background: "#eff6ff", borderRadius: "12px", padding: "12px", marginBottom: "16px", border: "1px solid #bfdbfe" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nota nutricional</p>
                <p style={{ margin: 0, fontSize: "12px", color: "#1e40af", lineHeight: 1.5 }}>{adaptResult.nutritionalNote}</p>
              </div>
            )}

            {/* Save adapted recipe button */}
            {!savedAdapted ? (
              <button
                onClick={() => {
                  if (!adaptResult) return;
                  saveAdaptedMutation.mutate({
                    originalRecipeId: recipe.id,
                    adaptedName: adaptResult.adaptedName,
                    description: adaptResult.description,
                    adaptedIngredients: adaptResult.adaptedIngredients,
                    adaptedInstructions: adaptResult.adaptedInstructions,
                    nutritionalNote: adaptResult.nutritionalNote,
                    substitutions: adaptResult.substitutions,
                  });
                }}
                disabled={saveAdaptedMutation.isPending}
                style={{
                  width: "100%",
                  background: saveAdaptedMutation.isPending ? "#e5e7eb" : "linear-gradient(135deg, #16a34a, #15803d)",
                  color: saveAdaptedMutation.isPending ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: saveAdaptedMutation.isPending ? "not-allowed" : "pointer",
                  marginBottom: "10px",
                }}
              >
                {saveAdaptedMutation.isPending ? "Guardando y generando imagen..." : "💾 Guardar en Mis Recetas"}
              </button>
            ) : (
              <div style={{ textAlign: "center", padding: "12px", marginBottom: "10px", background: "#f0fdf4", borderRadius: "12px", color: "#16a34a", fontWeight: 700, fontSize: "14px" }}>
                ✅ Receta guardada en la comunidad
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => { setShowAdaptModal(false); setSavedAdapted(false); }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #F97316, #ea580c)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Entendido — gracias Buddy One ❤️
            </button>
          </div>
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
        <p>Buddy One no constituye asesoramiento nutricional profesional.</p>
      </div>
    </div>
  );
}
