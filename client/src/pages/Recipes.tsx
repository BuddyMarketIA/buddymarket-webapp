import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

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

const FILTER_CATEGORIES: { id: FilterCategory; label: string; emoji: string }[] = [
  { id: "momento", label: "Momento del día", emoji: "🕐" },
  { id: "cocina", label: "Tipo de cocina", emoji: "🌍" },
  { id: "metodo", label: "Método de cocción", emoji: "🍳" },
];

const MEAL_TIME_OPTIONS = [
  { value: "", label: "Todos", emoji: "🍽️" },
  { value: "desayuno", label: "Desayuno", emoji: "☀️" },
  { value: "media_manana", label: "Media mañana", emoji: "🍎" },
  { value: "comida", label: "Comida", emoji: "🥗" },
  { value: "merienda", label: "Merienda", emoji: "🫐" },
  { value: "cena", label: "Cena", emoji: "🌙" },
];

const CUISINE_OPTIONS = [
  { value: "", label: "Todas", emoji: "🌍" },
  { value: "española", label: "Española", emoji: "🇪🇸" },
  { value: "italiana", label: "Italiana", emoji: "🇮🇹" },
  { value: "asiatica", label: "Asiática", emoji: "🥢" },
  { value: "mexicana", label: "Mexicana", emoji: "🌮" },
  { value: "americana", label: "Americana", emoji: "🍔" },
  { value: "arabe", label: "Árabe", emoji: "🧆" },
  { value: "francesa", label: "Francesa", emoji: "🥐" },
  { value: "mediterranea", label: "Mediterránea", emoji: "🫒" },
  { value: "latinoamericana", label: "Latinoamericana", emoji: "🌶️" },
];

const COOKING_METHOD_OPTIONS = [
  { value: "", label: "Todos", emoji: "🍳" },
  { value: "airfryer", label: "Air Fryer", emoji: "💨" },
  { value: "horno", label: "Horno", emoji: "🔥" },
  { value: "plancha", label: "Plancha/Sartén", emoji: "🥘" },
  { value: "olla", label: "Olla/Cocido", emoji: "🫕" },
  { value: "sin_coccion", label: "Sin cocción", emoji: "🥗" },
  { value: "microondas", label: "Microondas", emoji: "📡" },
  { value: "vaporizador", label: "Al vapor", emoji: "♨️" },
  { value: "wok", label: "Wok", emoji: "🥡" },
];

const MEAL_TIME_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  media_manana: "Media mañana",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  cualquiera: "Cualquier momento",
};

const MEAL_TIME_EMOJI: Record<string, string> = {
  desayuno: "☀️",
  media_manana: "🍎",
  comida: "🍽️",
  merienda: "🫐",
  cena: "🌙",
  cualquiera: "🕐",
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
];

function getPlaceholderImage(id: number) {
  return PLACEHOLDER_IMAGES[id % PLACEHOLDER_IMAGES.length];
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);
  const imgSrc = recipe.imageUrl || getPlaceholderImage(recipe.id);
  const mealTime = recipe.mealTime || "cualquiera";

  // Cooking method badge
  const methodBadge = COOKING_METHOD_OPTIONS.find(m => m.value === recipe.cookingMethod);

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
          {/* Cooking method badge */}
          {methodBadge && methodBadge.value && (
            <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(249,115,22,0.85)", backdropFilter: "blur(4px)", borderRadius: "10px", padding: "4px 8px" }}>
              <span style={{ fontSize: "11px" }}>{methodBadge.emoji}</span>
            </div>
          )}
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
          {/* Cuisine type */}
          {recipe.cuisineType && (
            <div style={{ marginTop: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#F97316", background: "rgba(249,115,22,0.1)", borderRadius: "6px", padding: "2px 6px" }}>
                {CUISINE_OPTIONS.find(c => c.value === recipe.cuisineType)?.emoji || "🌍"} {recipe.cuisineType}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
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
        fontSize: "12px",
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Recipes() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilterCat, setActiveFilterCat] = useState<FilterCategory>("momento");
  const [mealTimeFilter, setMealTimeFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [cookingMethodFilter, setCookingMethodFilter] = useState("");
  const [showMyRecipes, setShowMyRecipes] = useState(false);

  const queryParams = useMemo(() => ({
    search: search || undefined,
    isPublic: showMyRecipes ? undefined : true,
    userId: showMyRecipes ? user?.id : undefined,
    mealTime: mealTimeFilter || undefined,
    cuisineType: cuisineFilter || undefined,
    cookingMethod: cookingMethodFilter || undefined,
    limit: 50,
  }), [search, showMyRecipes, user?.id, mealTimeFilter, cuisineFilter, cookingMethodFilter]);

  const { data: recipes, isLoading } = trpc.recipes.list.useQuery(queryParams);

  // Active filters count
  const activeFiltersCount = [mealTimeFilter, cuisineFilter, cookingMethodFilter].filter(Boolean).length;

  const clearFilters = () => {
    setMealTimeFilter("");
    setCuisineFilter("");
    setCookingMethodFilter("");
  };

  return (
    <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto", paddingBottom: "100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>Recetas</h1>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>427 recetas disponibles</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            style={{ width: "38px", height: "38px", borderRadius: "12px", background: showSearch ? "#F97316" : "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showSearch ? "white" : "#374151"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          {isAuthenticated && (
            <Link href="/recipes/new">
              <button style={{ width: "38px", height: "38px", borderRadius: "12px", background: "#F97316", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar recetas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 12px 10px 38px", borderRadius: "14px", border: "2px solid #f3f4f6", background: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      )}

      {/* My recipes / All recipes toggle */}
      {isAuthenticated && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <button
            onClick={() => setShowMyRecipes(false)}
            style={{ flex: 1, padding: "9px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: !showMyRecipes ? "#F97316" : "white", color: !showMyRecipes ? "white" : "#6b7280", boxShadow: !showMyRecipes ? "0 4px 12px rgba(249,115,22,0.35)" : "0 1px 4px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
          >
            Todas las recetas
          </button>
          <button
            onClick={() => setShowMyRecipes(true)}
            style={{ flex: 1, padding: "9px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: showMyRecipes ? "#F97316" : "white", color: showMyRecipes ? "white" : "#6b7280", boxShadow: showMyRecipes ? "0 4px 12px rgba(249,115,22,0.35)" : "0 1px 4px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
          >
            Mis recetas
          </button>
        </div>
      )}

      {/* Filter category selector */}
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
              fontSize: "11px",
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
          <FilterPill
            key={opt.value}
            emoji={opt.emoji}
            label={opt.label}
            active={mealTimeFilter === opt.value}
            onClick={() => setMealTimeFilter(opt.value)}
          />
        ))}
        {activeFilterCat === "cocina" && CUISINE_OPTIONS.map(opt => (
          <FilterPill
            key={opt.value}
            emoji={opt.emoji}
            label={opt.label}
            active={cuisineFilter === opt.value}
            onClick={() => setCuisineFilter(opt.value)}
          />
        ))}
        {activeFilterCat === "metodo" && COOKING_METHOD_OPTIONS.map(opt => (
          <FilterPill
            key={opt.value}
            emoji={opt.emoji}
            label={opt.label}
            active={cookingMethodFilter === opt.value}
            onClick={() => setCookingMethodFilter(opt.value)}
          />
        ))}
      </div>

      {/* Active filters summary */}
      {activeFiltersCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", background: "rgba(249,115,22,0.06)", borderRadius: "12px", padding: "8px 12px" }}>
          <span style={{ fontSize: "12px", color: "#F97316", fontWeight: 700 }}>
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} activo{activeFiltersCount > 1 ? "s" : ""}
          </span>
          <button onClick={clearFilters} style={{ fontSize: "12px", color: "#F97316", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>
            Limpiar ✕
          </button>
        </div>
      )}

      {/* Recipes count + grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>
            {showMyRecipes ? "Mis recetas" : (
              mealTimeFilter ? MEAL_TIME_OPTIONS.find(m => m.value === mealTimeFilter)?.label :
              cuisineFilter ? `Cocina ${CUISINE_OPTIONS.find(c => c.value === cuisineFilter)?.label}` :
              cookingMethodFilter ? `${COOKING_METHOD_OPTIONS.find(m => m.value === cookingMethodFilter)?.label}` :
              "Todas las recetas"
            )}
          </h2>
          {recipes && <span style={{ fontSize: "12px", color: "#9ca3af" }}>{recipes.length} recetas</span>}
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ borderRadius: "18px", background: "#f3f4f6", height: "220px" }} />
            ))}
          </div>
        ) : recipes && recipes.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {(recipes as Recipe[]).map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "18px", padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 8px", fontSize: "32px" }}>🍳</p>
            <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>
              {showMyRecipes ? "Aún no tienes recetas" : "No hay recetas con estos filtros"}
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#9ca3af" }}>
              {showMyRecipes ? "Crea tu primera receta" : "Prueba cambiando los filtros"}
            </p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} style={{ background: "#F97316", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                Limpiar filtros
              </button>
            )}
            {showMyRecipes && isAuthenticated && (
              <Link href="/recipes/new">
                <button style={{ background: "#F97316", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                  Crear receta
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: "10px", color: "#d1d5db", textAlign: "center", margin: "24px 0 0", lineHeight: 1.5 }}>
        Las recetas de BuddyMarket son orientativas. Consulta a un profesional de la nutrición.
      </p>
    </div>
  );
}
