import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import ShareRecipeButton from "@/components/ShareRecipeButton";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import { useRecipeAllergyCheck } from "@/hooks/useRecipeAllergyCheck";
import { usePlan } from "@/hooks/usePlan";

// ─── Types ────────────────────────────────────────────────────────────────────
type Recipe = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  preparationTime?: number | null;
  cookTime?: number | null;
  caloriesPerServing?: number | null;
  proteinsPerServing?: number | null;
  carbsPerServing?: number | null;
  fatsPerServing?: number | null;
  fiberPerServing?: number | null;
  mealTime?: string | null;
  category?: string | null;
  cuisineType?: string | null;
  cookingMethod?: string | null;
  allergens?: string | null;
  tags?: string | null;
  difficulty?: string | null;
  servings?: number | null;
  buddyMakerId?: number | null;
  isSeeded?: boolean | null;
  isPublic?: boolean | null;
};

// ─── Filter categories ────────────────────────────────────────────────────────
type FilterCategory = "momento" | "cocina" | "metodo";

const FILTER_CATEGORY_KEYS: { id: FilterCategory; key: string; emoji: string }[] = [
  { id: "momento", key: "mealTime", emoji: "🕐" },
  { id: "cocina", key: "cuisineType", emoji: "🌍" },
  { id: "metodo", key: "cookingMethod", emoji: "🍳" },
];

const MEAL_TIME_OPTIONS_KEYS = [
  { value: "", key: "all", emoji: "🍽️" },
  { value: "desayuno", key: "breakfast", emoji: "☀️" },
  { value: "media_manana", key: "midMorning", emoji: "🍎" },
  { value: "comida", key: "lunch", emoji: "🥗" },
  { value: "merienda", key: "snack", emoji: "🫐" },
  { value: "cena", key: "dinner", emoji: "🌙" },
];

const CUISINE_OPTIONS_KEYS = [
  { value: "", key: "allCuisines", emoji: "🌍" },
  { value: "española", key: "spanish", emoji: "🇪🇸" },
  { value: "italiana", key: "italian", emoji: "🇮🇹" },
  { value: "asiatica", key: "asian", emoji: "🥢" },
  { value: "mexicana", key: "mexican", emoji: "🌮" },
  { value: "americana", key: "american", emoji: "🍔" },
  { value: "arabe", key: "arabic", emoji: "🧆" },
  { value: "francesa", key: "french", emoji: "🥐" },
  { value: "mediterranea", key: "mediterranean", emoji: "🫒" },
  { value: "latinoamericana", key: "latinAmerican", emoji: "🌶️" },
];

const COOKING_METHOD_OPTIONS_KEYS = [
  { value: "", key: "all", emoji: "🍳" },
  { value: "airfryer", key: "airFryer", emoji: "💨" },
  { value: "horno", key: "oven", emoji: "🔥" },
  { value: "plancha", key: "grill", emoji: "🥘" },
  { value: "olla", key: "pot", emoji: "🫕" },
  { value: "sin_coccion", key: "noCooking", emoji: "🥗" },
  { value: "microondas", key: "microwave", emoji: "📡" },
  { value: "vaporizador", key: "steam", emoji: "♨️" },
  { value: "wok", key: "wok", emoji: "🥡" },
];

const MEAL_TIME_LABEL_KEYS: Record<string, string> = {
  desayuno: "breakfast",
  media_manana: "midMorning",
  comida: "lunch",
  merienda: "snack",
  cena: "dinner",
  cualquiera: "anyTime",
};

const MEAL_TIME_EMOJI: Record<string, string> = {
  desayuno: "☀️",
  media_manana: "🍎",
  comida: "🍽️",
  merienda: "🫐",
  cena: "🌙",
  cualquiera: "🕐",
};

const RECENT_SEARCHES_KEY = "buddymarket_recent_recipe_searches";

function getPlaceholderImage(_id: number) {
  return RECIPE_PLACEHOLDER_IMAGE;
}

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  const existing = getRecentSearches().filter(s => s !== query);
  const updated = [query, ...existing].slice(0, 5);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

// ─── Highlight text ───────────────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(249,115,22,0.2)", color: "#c2410c", borderRadius: "3px", padding: "0 2px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

// ─── Heart Button ────────────────────────────────────────────────────────────
function HeartButton({ isFav, onToggle }: { isFav: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: isFav ? "rgba(239,68,68,0.95)" : "rgba(255,255,255,0.88)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        transition: "transform 0.15s, background 0.2s",
        zIndex: 10,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? "white" : "none"} stroke={isFav ? "white" : "#ef4444"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

// ─── Recipe Card ────────────────────────────────────────────
function RecipeCard({ recipe, searchQuery, isFav, onToggleFav }: { recipe: Recipe; searchQuery?: string; isFav?: boolean; onToggleFav?: () => void }) {
  const { t } = useTranslation();
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);
  const hasRealImage = !!(recipe.imageUrl && !recipe.imageUrl.includes('placeholder'));
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(recipe.imageUrl || null);
  const [generatingImg, setGeneratingImg] = useState(false);
  const imgSrc = localImageUrl || getPlaceholderImage(recipe.id);
  const mealTime = recipe.mealTime || "cualquiera";
  const methodBadge = COOKING_METHOD_OPTIONS_KEYS.find((m: { value: string; key: string; emoji: string }) => m.value === recipe.cookingMethod);
  const { user } = useAuth();
  const generateAIImage = trpc.recipes.generateAIImage.useMutation();
  // SAFETY: Check if this recipe contains ingredients the user is allergic to
  const { hasViolation, violatingIngredients } = useRecipeAllergyCheck(recipe);

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (generatingImg) return;
    setGeneratingImg(true);
    try {
      const result = await generateAIImage.mutateAsync({ recipeId: recipe.id });
      setLocalImageUrl(result.url);
      toast.success(t('recipes.imageGenerated', 'Image generated successfully'));
    } catch {
      toast.error(t('recipes.imageError', 'Error generating image'));
    } finally {
      setGeneratingImg(false);
    }
  };

  return (
    <Link href={`/app/recipes/${recipe.id}`}>
      <div
        style={{
          background: "white",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: hasViolation ? "0 2px 16px rgba(239,68,68,0.35)" : "0 2px 12px rgba(0,0,0,0.08)",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          border: hasViolation ? "1.5px solid rgba(239,68,68,0.5)" : "none",
          position: "relative",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = hasViolation ? "0 8px 24px rgba(239,68,68,0.4)" : "0 8px 24px rgba(0,0,0,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = hasViolation ? "0 2px 16px rgba(239,68,68,0.35)" : "0 2px 12px rgba(0,0,0,0.08)"; }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
          <img
            src={imgSrc}
            alt={recipe.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
          {/* Meal time badge */}
          <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", borderRadius: "10px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "14px" }}>{MEAL_TIME_EMOJI[mealTime] || "🕐"}</span>
            <span style={{ fontSize: "13px", color: "white", fontWeight: 700 }}>{t(`recipes.mealTime.${MEAL_TIME_LABEL_KEYS[mealTime] || "anyTime"}`, mealTime) || mealTime}</span>
          </div>
          {/* Generar imagen IA — solo si no tiene foto real y el usuario está logueado */}
          {user && !hasRealImage && !localImageUrl && (
            <button
              onClick={handleGenerateImage}
              disabled={generatingImg}
              style={{
                position: "absolute", bottom: "8px", right: "8px",
                background: generatingImg ? "rgba(0,0,0,0.5)" : "rgba(249,115,22,0.9)",
                backdropFilter: "blur(4px)",
                border: "none", borderRadius: "10px", padding: "4px 8px",
                cursor: generatingImg ? "wait" : "pointer",
                color: "white", fontSize: "12px", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "4px",
                transition: "all 0.2s",
              }}
            >
              {generatingImg ? (
                <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Generando...</>
              ) : (
                <>✨ Generar foto</>
              )}
            </button>
          )}
          {/* Heart button — only shown when user is logged in */}
          {onToggleFav !== undefined && (
            <HeartButton isFav={!!isFav} onToggle={onToggleFav} />
          )}
          {/* Share button — always visible, top-right corner */}
          <div
            style={{ position: "absolute", top: "10px", right: onToggleFav !== undefined ? "46px" : "10px" }}
            onClick={e => e.preventDefault()}
          >
            <ShareRecipeButton
              recipeId={recipe.id}
              recipeName={recipe.name}
              recipeDescription={recipe.description ?? undefined}
              variant="icon"
            />
          </div>
          {/* Cooking method badge — shift left when no heart button */}
          {methodBadge && methodBadge.value && onToggleFav === undefined && (
            <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(249,115,22,0.85)", backdropFilter: "blur(4px)", borderRadius: "10px", padding: "4px 8px" }}>
              <span style={{ fontSize: "14px" }}>{methodBadge.emoji}</span>
            </div>
          )}
          {/* ALLERGY WARNING OVERLAY — blur + red tint when recipe contains forbidden ingredients */}
          {hasViolation && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(239,68,68,0.18)",
                backdropFilter: "blur(2px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                zIndex: 5,
              }}
            >
              <div style={{
                background: "rgba(220,38,38,0.92)",
                backdropFilter: "blur(8px)",
                borderRadius: "12px",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                maxWidth: "90%",
              }}>
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "white", textAlign: "center", lineHeight: 1.3 }}>
                  Contiene ingredientes que debes evitar
                </span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 1.3 }}>
                  {violatingIngredients.slice(0, 3).join(" · ")}{violatingIngredients.length > 3 ? " · ..." : ""}
                </span>
              </div>
            </div>
          )}
          {/* Time + kcal overlay */}
          <div style={{ position: "absolute", bottom: "8px", left: "10px", display: "flex", gap: "6px" }}>
            {totalTime > 0 && (
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: 600, background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "2px 6px" }}>
                ⏱ {totalTime} min
              </span>
            )}
            {recipe.caloriesPerServing && (
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: 600, background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "2px 6px" }}>
                🔥 {recipe.caloriesPerServing} kcal
              </span>
            )}
          </div>
        </div>
        {/* Content */}
        <div style={{ padding: "12px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {searchQuery ? <HighlightText text={recipe.name} query={searchQuery} /> : recipe.name}
          </p>
          {/* Nutritional mini-summary */}
          {(recipe.proteinsPerServing || recipe.carbsPerServing || recipe.fatsPerServing) && (
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
              {recipe.proteinsPerServing && <span style={{ fontSize: "13px", color: "#6b7280" }}>💪 {Math.round(recipe.proteinsPerServing)}g</span>}
              {recipe.carbsPerServing && <span style={{ fontSize: "13px", color: "#6b7280" }}>🌾 {Math.round(recipe.carbsPerServing)}g</span>}
              {recipe.fatsPerServing && <span style={{ fontSize: "13px", color: "#6b7280" }}>🥑 {Math.round(recipe.fatsPerServing)}g</span>}
            </div>
          )}
          {/* Cuisine type */}
          {recipe.cuisineType && (
            <div style={{ marginTop: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", background: "rgba(249,115,22,0.1)", borderRadius: "6px", padding: "2px 6px" }}>
                {CUISINE_OPTIONS_KEYS.find((c: { value: string; key: string; emoji: string }) => c.value === recipe.cuisineType)?.emoji || "🌍"} {recipe.cuisineType}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Recipe Card Skeleton ────────────────────────────────────────────────────
function RecipeCardSkeleton() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Image placeholder */}
      <div
        style={{
          height: "160px",
          background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
        }}
      />
      {/* Content placeholder */}
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Title lines */}
        <div
          style={{
            height: "14px",
            borderRadius: "7px",
            background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
            width: "85%",
          }}
        />
        <div
          style={{
            height: "14px",
            borderRadius: "7px",
            background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s 0.1s infinite",
            width: "60%",
          }}
        />
        {/* Macros row */}
        <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
          {["40%", "35%", "30%"].map((w, i) => (
            <div
              key={i}
              style={{
                height: "10px",
                borderRadius: "5px",
                background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
                backgroundSize: "200% 100%",
                animation: `shimmer 1.4s ${i * 0.1}s infinite`,
                width: w,
              }}
            />
          ))}
        </div>
        {/* Cuisine badge */}
        <div
          style={{
            height: "20px",
            borderRadius: "6px",
            background: "linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s 0.2s infinite",
            width: "45%",
          }}
        />
      </div>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────
function FilterPill({ emoji, label, active, onClick }: { emoji: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: "20px",
        border: `2px solid ${active ? "#F97316" : "#f3f4f6"}`,
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 700,
        whiteSpace: "nowrap",
        background: active ? "rgba(249,115,22,0.08)" : "white",
        color: active ? "#F97316" : "#6b7280",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Recipes() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { can, isFree } = usePlan();
  const [, navigate] = useLocation();
  // Build translated options
  const MEAL_TIME_OPTIONS = MEAL_TIME_OPTIONS_KEYS.map(o => ({ ...o, label: t(`recipes.mealTime.${o.key}`, o.key) }));
  const CUISINE_OPTIONS = CUISINE_OPTIONS_KEYS.map(o => ({ ...o, label: t(`recipes.cuisine.${o.key}`, o.key) }));
  const COOKING_METHOD_OPTIONS = COOKING_METHOD_OPTIONS_KEYS.map(o => ({ ...o, label: t(`recipes.cookingMethodOptions.${o.key}`, o.key) }));
  const FILTER_CATEGORIES = FILTER_CATEGORY_KEYS.map(o => ({ ...o, label: t(`recipes.filterCat.${o.key}`, o.key) }));

  // Search state
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [activeFilterCat, setActiveFilterCat] = useState<FilterCategory>("momento");
  const [mealTimeFilter, setMealTimeFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [cookingMethodFilter, setCookingMethodFilter] = useState("");
  const [showMyRecipes, setShowMyRecipes] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Suggestions query (fires when user is typing, before debounce commits)
  const suggestionsQuery = trpc.recipes.searchSuggestions.useQuery(
    { query: inputValue, limit: 6 },
    { enabled: inputValue.trim().length >= 2 && searchFocused }
  );

  const queryParams = useMemo(() => ({
    search: debouncedSearch || undefined,
    isPublic: showMyRecipes ? undefined : true,
    userId: showMyRecipes ? user?.id : undefined,
    mealTime: mealTimeFilter || undefined,
    cuisineType: cuisineFilter || undefined,
    cookingMethod: cookingMethodFilter || undefined,
    limit: 20,
  }), [debouncedSearch, showMyRecipes, user?.id, mealTimeFilter, cuisineFilter, cookingMethodFilter]);

  // Sentinel ref for IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = trpc.recipes.list.useInfiniteQuery(
    queryParams,
    { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined }
  );

  const recipes: Recipe[] = useMemo(
    () => (infiniteData?.pages ?? []).flatMap((p) => p.recipes as Recipe[]),
    [infiniteData]
  );
  const isFetching = isFetchingNextPage;

  // IntersectionObserver — load next page when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Favorites
  const utils = trpc.useUtils();
  const { data: favoriteIds } = trpc.recipes.getFavoriteIds.useQuery(undefined, { enabled: isAuthenticated });
  const toggleFavMutation = trpc.recipes.toggleFavorite.useMutation({
    onMutate: async ({ recipeId }) => {
      await utils.recipes.getFavoriteIds.cancel();
      const prev = utils.recipes.getFavoriteIds.getData();
      utils.recipes.getFavoriteIds.setData(undefined, (old) => {
        if (!old) return [recipeId];
        return old.includes(recipeId) ? old.filter(id => id !== recipeId) : [...old, recipeId];
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) utils.recipes.getFavoriteIds.setData(undefined, ctx.prev);
      toast.error("Error al actualizar favoritos");
    },
    onSettled: () => {
      utils.recipes.getFavoriteIds.invalidate();
      utils.recipes.favorites.invalidate();
    },
  });

  const handleToggleFav = (recipe: Recipe) => {
    const isFav = favoriteIds?.includes(recipe.id);
    toggleFavMutation.mutate({ recipeId: recipe.id });
    toast.success(isFav ? `"${recipe.name}" eliminada de favoritos` : `"${recipe.name}" añadida a favoritos ❤️`);
  };

  const activeFiltersCount = [mealTimeFilter, cuisineFilter, cookingMethodFilter].filter(Boolean).length;

  const clearFilters = () => {
    setMealTimeFilter("");
    setCuisineFilter("");
    setCookingMethodFilter("");
  };

  const handleSearchSubmit = useCallback((query: string) => {
    setInputValue(query);
    setDebouncedSearch(query);
    setSearchFocused(false);
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    searchRef.current?.blur();
  }, []);

  const clearSearch = () => {
    setInputValue("");
    setDebouncedSearch("");
    searchRef.current?.focus();
  };

  const showDropdown = searchFocused && (
    (inputValue.trim().length >= 2 && (suggestionsQuery.data?.length ?? 0) > 0) ||
    (inputValue.trim().length === 0 && recentSearches.length > 0)
  );

  return (
    <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto", paddingBottom: "100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>{t("recipes.title")}</h1>
          <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#9ca3af" }}>{t("recipes.available", "427 recipes available")}</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => {
              if (!can("canCreateRecipes")) {
                toast.error("¡Crea tus propias recetas con el plan Pro! ✨");
                navigate("/app/subscription");
                return;
              }
              navigate("/app/recipes/new");
            }}
            style={{
              width: "38px", height: "38px", borderRadius: "12px",
              background: isFree ? "linear-gradient(135deg, #F97316, #EA580C)" : "#F97316",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
              position: "relative",
            }}
          >
            {isFree && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#7c3aed", color: "white", borderRadius: "50%", width: "14px", height: "14px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>P</span>
            )}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* ─── Search Bar (always visible) ─────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: "14px" }} ref={dropdownRef}>
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "white",
          borderRadius: searchFocused ? "16px 16px 0 0" : "16px",
          border: `2px solid ${searchFocused ? "#F97316" : "#f3f4f6"}`,
          boxShadow: searchFocused ? "0 4px 20px rgba(249,115,22,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
          padding: "10px 14px",
          gap: "10px",
          transition: "all 0.2s",
        }}>
          {/* Search icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? "#F97316" : "#9ca3af"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "stroke 0.2s" }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder={t("recipes.searchPlaceholder")}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={e => { if (e.key === "Enter" && inputValue.trim()) handleSearchSubmit(inputValue.trim()); }}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", fontWeight: 500, color: "#1a1a1a", background: "transparent" }}
          />
          {/* Loading spinner or clear button */}
          {isFetching && debouncedSearch ? (
            <div style={{ width: "18px", height: "18px", border: "2px solid #f3f4f6", borderTopColor: "#F97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          ) : inputValue ? (
            <button onClick={clearSearch} style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#6b7280", fontSize: "14px", fontWeight: 700 }}>
              ✕
            </button>
          ) : null}
        </div>

        {/* ─── Dropdown: suggestions or recent searches ─────────────────────── */}
        {showDropdown && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            borderRadius: "0 0 16px 16px",
            border: "2px solid #F97316",
            borderTop: "none",
            boxShadow: "0 8px 24px rgba(249,115,22,0.15)",
            zIndex: 100,
            overflow: "hidden",
          }}>
            {/* Recent searches (when input is empty) */}
            {inputValue.trim().length === 0 && recentSearches.length > 0 && (
              <div>
                <div style={{ padding: "8px 14px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("recipes.recentSearches")}</span>
                  <button
                    onClick={() => { localStorage.removeItem(RECENT_SEARCHES_KEY); setRecentSearches([]); }}
                    style={{ fontSize: "14px", color: "#F97316", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                  >
                    {t("common.clear", "Clear")}
                  </button>
                </div>
                {recentSearches.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSearchSubmit(s)}
                    style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FFF7ED"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                  >
                    <span style={{ fontSize: "14px" }}>🕐</span>
                    <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{s}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions (when typing) */}
            {inputValue.trim().length >= 2 && (suggestionsQuery.data?.length ?? 0) > 0 && (
              <div>
                <div style={{ padding: "8px 14px 4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("recipes.suggestions")}</span>
                </div>
                {suggestionsQuery.data?.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => handleSearchSubmit(s.name)}
                    style={{ width: "100%", padding: "8px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FFF7ED"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                  >
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.name} style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🍳</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <HighlightText text={s.name} query={inputValue} />
                      </p>
                      {s.caloriesPerServing && (
                        <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>{s.caloriesPerServing} kcal</p>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active search indicator */}
      {debouncedSearch && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", background: "rgba(249,115,22,0.06)", borderRadius: "12px", padding: "8px 12px" }}>
          <span style={{ fontSize: "14px" }}>🔍</span>
          <span style={{ fontSize: "13px", color: "#374151", fontWeight: 600, flex: 1 }}>
            {t("recipes.resultsFor", "Results for")} <strong style={{ color: "#F97316" }}>"{debouncedSearch}"</strong>
          </span>
          <button onClick={clearSearch} style={{ fontSize: "14px", color: "#F97316", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
            ✕ {t("common.clear", "Clear")}
          </button>
        </div>
      )}

      {/* My recipes / All recipes toggle */}
      {isAuthenticated && !debouncedSearch && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <button
            onClick={() => setShowMyRecipes(false)}
            style={{ flex: 1, padding: "9px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: !showMyRecipes ? "#F97316" : "white", color: !showMyRecipes ? "white" : "#6b7280", boxShadow: !showMyRecipes ? "0 4px 12px rgba(249,115,22,0.35)" : "0 1px 4px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
          >
            {t("recipes.catalog", "All recipes")}
          </button>
          <button
            onClick={() => setShowMyRecipes(true)}
            style={{ flex: 1, padding: "9px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: showMyRecipes ? "#F97316" : "white", color: showMyRecipes ? "white" : "#6b7280", boxShadow: showMyRecipes ? "0 4px 12px rgba(249,115,22,0.35)" : "0 1px 4px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
          >
            {t("recipes.myRecipes", "My recipes")}
          </button>
        </div>
      )}

      {/* Filter category selector (hidden during active search) */}
      {!debouncedSearch && (
        <>
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            {FILTER_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilterCat(cat.id)}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  borderRadius: "12px",
                  border: `2px solid ${activeFilterCat === cat.id ? "#F97316" : "#f3f4f6"}`,
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                  background: activeFilterCat === cat.id ? "rgba(249,115,22,0.08)" : "white",
                  color: activeFilterCat === cat.id ? "#F97316" : "#6b7280",
                  transition: "all 0.2s",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "16px", marginBottom: "2px" }}>{cat.emoji}</div>
                <div style={{ lineHeight: 1.2 }}>{cat.label}</div>
              </button>
            ))}
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "14px", scrollbarWidth: "none" }}>
            {activeFilterCat === "momento" && MEAL_TIME_OPTIONS.map(opt => (
              <FilterPill key={opt.value} emoji={opt.emoji} label={opt.label} active={mealTimeFilter === opt.value} onClick={() => setMealTimeFilter(opt.value)} />
            ))}
            {activeFilterCat === "cocina" && CUISINE_OPTIONS.map(opt => (
              <FilterPill key={opt.value} emoji={opt.emoji} label={opt.label} active={cuisineFilter === opt.value} onClick={() => setCuisineFilter(opt.value)} />
            ))}
            {activeFilterCat === "metodo" && COOKING_METHOD_OPTIONS.map(opt => (
              <FilterPill key={opt.value} emoji={opt.emoji} label={opt.label} active={cookingMethodFilter === opt.value} onClick={() => setCookingMethodFilter(opt.value)} />
            ))}
          </div>

          {/* Active filters summary */}
          {activeFiltersCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", background: "rgba(249,115,22,0.06)", borderRadius: "12px", padding: "8px 12px" }}>
              <span style={{ fontSize: "14px", color: "#F97316", fontWeight: 700 }}>
                {activeFiltersCount} {t("recipes.activeFilters", "active filter")}{activeFiltersCount > 1 ? "s" : ""}
              </span>
              <button onClick={clearFilters} style={{ fontSize: "14px", color: "#F97316", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
                {t("common.clear", "Clear")} ✕
              </button>
            </div>
          )}
        </>
      )}

      {/* Recipes count + grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>
            {debouncedSearch
              ? t("recipes.results", "Results")
              : showMyRecipes
              ? t("recipes.myRecipes", "My recipes")
              : mealTimeFilter ? MEAL_TIME_OPTIONS.find(m => m.value === mealTimeFilter)?.label
              : cuisineFilter ? `Cocina ${CUISINE_OPTIONS.find(c => c.value === cuisineFilter)?.label}`
              : cookingMethodFilter ? `${COOKING_METHOD_OPTIONS.find(m => m.value === cookingMethodFilter)?.label}`
              : t("recipes.allRecipes", "All recipes")
            }
          </h2>
          {recipes && (
            <span style={{ fontSize: "14px", color: "#9ca3af" }}>
              {isFetching ? t("common.loading", "Loading...") : `${recipes.length}${hasNextPage ? "+" : ""} ${t("recipes.recipesCount", "recipes")}`}
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : recipes && recipes.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {(recipes as Recipe[]).map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                searchQuery={debouncedSearch || undefined}
                isFav={favoriteIds?.includes(recipe.id)}
                onToggleFav={isAuthenticated ? () => handleToggleFav(recipe) : undefined}
              />
            ))}
            {/* Skeleton cards appended while fetching next page */}
            {isFetchingNextPage && [1, 2, 3, 4].map(i => (
              <RecipeCardSkeleton key={`skeleton-next-${i}`} />
            ))}
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "18px", padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 8px", fontSize: "32px" }}>
              {debouncedSearch ? "🔍" : "🍳"}
            </p>
            <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>
              {debouncedSearch
                ? `${t("recipes.noResultsFor", "No results for")} "${debouncedSearch}"`
                : showMyRecipes
                ? t("recipes.noMyRecipes", "You have no recipes yet")
                : t("recipes.noRecipesFilter", "No recipes with these filters")}
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#9ca3af" }}>
              {debouncedSearch
                ? t("recipes.tryOtherSearch", "Try another name or ingredient")
                : showMyRecipes
                ? t("recipes.createFirst", "Create your first recipe")
                : t("recipes.tryFilters", "Try changing the filters")}
            </p>
            {debouncedSearch && (
              <button onClick={clearSearch} style={{ background: "#F97316", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer", marginRight: "8px" }}>
                {t("recipes.clearSearch", "Clear search")}
              </button>
            )}
            {activeFiltersCount > 0 && !debouncedSearch && (
              <button onClick={clearFilters} style={{ background: "#F97316", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                {t("recipes.clearFilters", "Clear filters")}
              </button>
            )}
            {showMyRecipes && isAuthenticated && !debouncedSearch && (
              <Link href="/app/recipes/new">
                <button style={{ background: "#F97316", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                  {t("recipes.create", "Create recipe")}
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      {recipes.length > 0 && (
        <div ref={sentinelRef} style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "8px" }}>
          {isFetchingNextPage && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", border: "3px solid #f3f4f6", borderTop: "3px solid #F97316", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: 600 }}>{t("recipes.loadingMore", "Loading more recipes...")}</span>
            </div>
          )}
          {!hasNextPage && recipes.length > 0 && !isFetchingNextPage && (
            <p style={{ fontSize: "14px", color: "#d1d5db", fontWeight: 600, margin: 0 }}>✅ {t("recipes.allSeen", "All recipes seen")} ({recipes.length})</p>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: "13px", color: "#d1d5db", textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
        {t("recipes.disclaimer", "BuddyMarket recipes are for guidance only. Consult a nutrition professional.")}
      </p>

      {/* Animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
