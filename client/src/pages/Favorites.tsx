import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

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
  mealTime?: string | null;
  cuisineType?: string | null;
  cookingMethod?: string | null;
  difficulty?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLACEHOLDER_IMAGES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/acai_bowl_granola-mcBZCMgPadkRDbMhMseJwZ.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
];
function getPlaceholderImage(id: number) {
  return PLACEHOLDER_IMAGES[id % PLACEHOLDER_IMAGES.length];
}

const MEAL_TIME_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  media_manana: "Media mañana",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  cualquiera: "Cualquier momento",
};
const MEAL_TIME_EMOJI: Record<string, string> = {
  desayuno: "☀️", media_manana: "🍎", comida: "🥗", merienda: "🫐", cena: "🌙", cualquiera: "🍽️",
};

const CUISINE_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "española", label: "🇪🇸 Española" },
  { value: "italiana", label: "🇮🇹 Italiana" },
  { value: "asiatica", label: "🥢 Asiática" },
  { value: "mexicana", label: "🌮 Mexicana" },
  { value: "americana", label: "🍔 Americana" },
  { value: "arabe", label: "🧆 Árabe" },
  { value: "francesa", label: "🥐 Francesa" },
  { value: "mediterranea", label: "🫒 Mediterránea" },
  { value: "latinoamericana", label: "🌶️ Latinoamericana" },
];

const COOKING_METHOD_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "airfryer", label: "💨 Air Fryer" },
  { value: "horno", label: "🔥 Horno" },
  { value: "plancha", label: "🥘 Plancha/Sartén" },
  { value: "olla", label: "🫕 Olla/Cocido" },
  { value: "sin_coccion", label: "🥗 Sin cocción" },
  { value: "vaporizador", label: "♨️ Al vapor" },
  { value: "wok", label: "🥡 Wok" },
];

const MEAL_TIME_FILTER = [
  { value: "", label: "Todos", emoji: "🍽️" },
  { value: "desayuno", label: "Desayuno", emoji: "☀️" },
  { value: "media_manana", label: "Media mañana", emoji: "🍎" },
  { value: "comida", label: "Comida", emoji: "🥗" },
  { value: "merienda", label: "Merienda", emoji: "🫐" },
  { value: "cena", label: "Cena", emoji: "🌙" },
];

// ─── Heart Button ─────────────────────────────────────────────────────────────
function HeartButton({ recipeId, isFav, onToggle }: { recipeId: number; isFav: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        background: isFav ? "rgba(239,68,68,0.95)" : "rgba(255,255,255,0.9)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        transition: "transform 0.15s, background 0.15s",
        zIndex: 10,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "white" : "none"} stroke={isFav ? "white" : "#ef4444"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function FavoriteRecipeCard({ recipe, onRemove }: { recipe: Recipe; onRemove: () => void }) {
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);
  const imgSrc = recipe.imageUrl || getPlaceholderImage(recipe.id);
  const mealTime = recipe.mealTime || "cualquiera";

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <div
        style={{
          background: "white",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"; }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
          <img
            src={imgSrc}
            alt={recipe.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGES[0]; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />
          {/* Meal time badge */}
          <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", borderRadius: "10px", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px" }}>{MEAL_TIME_EMOJI[mealTime] || "🕐"}</span>
            <span style={{ fontSize: "10px", color: "white", fontWeight: 700 }}>{MEAL_TIME_LABELS[mealTime] || mealTime}</span>
          </div>
          {/* Heart button */}
          <HeartButton recipeId={recipe.id} isFav={true} onToggle={onRemove} />
          {/* Time + kcal overlay */}
          <div style={{ position: "absolute", bottom: "8px", left: "10px", display: "flex", gap: "6px" }}>
            {totalTime > 0 && (
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", fontWeight: 600, background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "2px 6px" }}>
                ⏱ {totalTime} min
              </span>
            )}
            {recipe.caloriesPerServing && (
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)", fontWeight: 600, background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "2px 6px" }}>
                🔥 {recipe.caloriesPerServing} kcal
              </span>
            )}
          </div>
        </div>
        {/* Content */}
        <div style={{ padding: "12px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {recipe.name}
          </p>
          {/* Nutritional mini-summary */}
          {(recipe.proteinsPerServing || recipe.carbsPerServing || recipe.fatsPerServing) && (
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
              {recipe.proteinsPerServing && <span style={{ fontSize: "10px", color: "#6b7280" }}>💪 {Math.round(recipe.proteinsPerServing)}g</span>}
              {recipe.carbsPerServing && <span style={{ fontSize: "10px", color: "#6b7280" }}>🌾 {Math.round(recipe.carbsPerServing)}g</span>}
              {recipe.fatsPerServing && <span style={{ fontSize: "10px", color: "#6b7280" }}>🥑 {Math.round(recipe.fatsPerServing)}g</span>}
            </div>
          )}
          {/* Cuisine + method tags */}
          <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
            {recipe.cuisineType && (
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#F97316", background: "rgba(249,115,22,0.1)", borderRadius: "6px", padding: "2px 6px" }}>
                {CUISINE_OPTIONS.find(c => c.value === recipe.cuisineType)?.label || recipe.cuisineType}
              </span>
            )}
            {recipe.cookingMethod && (
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#6b7280", background: "#f3f4f6", borderRadius: "6px", padding: "2px 6px" }}>
                {COOKING_METHOD_OPTIONS.find(m => m.value === recipe.cookingMethod)?.label || recipe.cookingMethod}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Favorites Page ──────────────────────────────────────────────────────
export default function Favorites() {
  const [, navigate] = useLocation();
  const [mealTimeFilter, setMealTimeFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const utils = trpc.useUtils();
  const { data: favorites, isLoading } = trpc.recipes.favorites.useQuery();
  const toggleFavMutation = trpc.recipes.toggleFavorite.useMutation({
    onMutate: async ({ recipeId }) => {
      await utils.recipes.favorites.cancel();
      const prev = utils.recipes.favorites.getData();
      utils.recipes.favorites.setData(undefined, (old) => old?.filter(r => r.id !== recipeId) ?? []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.recipes.favorites.setData(undefined, ctx.prev);
      toast.error("Error al actualizar favoritos");
    },
    onSettled: () => {
      utils.recipes.favorites.invalidate();
      utils.recipes.getFavoriteIds.invalidate();
    },
  });

  const handleRemove = (recipeId: number, recipeName: string) => {
    toggleFavMutation.mutate({ recipeId });
    toast.success(`"${recipeName}" eliminada de favoritos`);
  };

  // Filter locally
  const filtered = useMemo(() => {
    if (!favorites) return [];
    return favorites.filter(r => {
      if (mealTimeFilter && r.mealTime !== mealTimeFilter) return false;
      if (cuisineFilter && r.cuisineType !== cuisineFilter) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (!r.name.toLowerCase().includes(q) && !(r.description || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [favorites, mealTimeFilter, cuisineFilter, searchText]);

  const activeFilters = [mealTimeFilter, cuisineFilter].filter(Boolean).length;

  return (
    <div style={{ paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "14px", background: "linear-gradient(135deg, #ef4444, #f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>Mis Favoritas</h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
              {isLoading ? "Cargando..." : `${favorites?.length ?? 0} receta${(favorites?.length ?? 0) !== 1 ? "s" : ""} guardada${(favorites?.length ?? 0) !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar en favoritas..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: "100%", padding: "11px 36px 11px 38px", borderRadius: "14px", border: "2px solid #f3f4f6", background: "white", fontSize: "14px", color: "#1a1a1a", outline: "none", boxSizing: "border-box" }}
          />
          {searchText && (
            <button onClick={() => setSearchText("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {/* Meal time filter */}
          <select
            value={mealTimeFilter}
            onChange={e => setMealTimeFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "12px", border: `2px solid ${mealTimeFilter ? "#F97316" : "#f3f4f6"}`, background: mealTimeFilter ? "rgba(249,115,22,0.08)" : "white", fontSize: "12px", fontWeight: 600, color: mealTimeFilter ? "#F97316" : "#6b7280", cursor: "pointer", outline: "none", flexShrink: 0 }}
          >
            {MEAL_TIME_FILTER.map(o => <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>)}
          </select>
          {/* Cuisine filter */}
          <select
            value={cuisineFilter}
            onChange={e => setCuisineFilter(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "12px", border: `2px solid ${cuisineFilter ? "#F97316" : "#f3f4f6"}`, background: cuisineFilter ? "rgba(249,115,22,0.08)" : "white", fontSize: "12px", fontWeight: 600, color: cuisineFilter ? "#F97316" : "#6b7280", cursor: "pointer", outline: "none", flexShrink: 0 }}
          >
            {CUISINE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Clear filters */}
          {(activeFilters > 0 || searchText) && (
            <button
              onClick={() => { setMealTimeFilter(""); setCuisineFilter(""); setSearchText(""); }}
              style={{ padding: "8px 14px", borderRadius: "12px", border: "2px solid #ef4444", background: "rgba(239,68,68,0.08)", fontSize: "12px", fontWeight: 700, color: "#ef4444", cursor: "pointer", flexShrink: 0 }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 0" }}>
        {isLoading ? (
          /* Skeleton */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ borderRadius: "18px", overflow: "hidden", background: "white" }}>
                <div style={{ height: "160px", background: "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                <div style={{ padding: "12px" }}>
                  <div style={{ height: "14px", borderRadius: "7px", background: "#f3f4f6", marginBottom: "8px" }} />
                  <div style={{ height: "10px", borderRadius: "5px", background: "#f3f4f6", width: "60%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : favorites?.length === 0 ? (
          /* Empty state — no favorites at all */
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>💔</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, color: "#1a1a1a" }}>Aún no tienes favoritas</h3>
            <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#9ca3af", lineHeight: 1.5 }}>
              Guarda tus recetas preferidas tocando el corazón ❤️ en cualquier receta para encontrarlas aquí rápidamente.
            </p>
            <button
              onClick={() => navigate("/recipes")}
              style={{ padding: "14px 28px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", border: "none", color: "white", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(249,115,22,0.4)" }}
            >
              Explorar recetas
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state — filters applied */
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800, color: "#1a1a1a" }}>Sin resultados</h3>
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#9ca3af" }}>
              Ninguna favorita coincide con los filtros aplicados.
            </p>
            <button
              onClick={() => { setMealTimeFilter(""); setCuisineFilter(""); setSearchText(""); }}
              style={{ padding: "10px 20px", borderRadius: "12px", background: "#F97316", border: "none", color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            {(activeFilters > 0 || searchText) && (
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#9ca3af", fontWeight: 600 }}>
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </p>
            )}
            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {filtered.map(recipe => (
                <FavoriteRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onRemove={() => handleRemove(recipe.id, recipe.name)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <div style={{ margin: "24px 16px 0", padding: "12px 14px", background: "rgba(249,115,22,0.06)", borderRadius: "12px", borderLeft: "3px solid #F97316" }}>
        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", lineHeight: 1.5 }}>
          <strong style={{ color: "#F97316" }}>BuddyMarket</strong> — El contenido de esta sección no constituye recomendaciones profesionales. Consulta con un nutricionista o profesional de la salud antes de realizar cambios en tu dieta.
        </p>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
