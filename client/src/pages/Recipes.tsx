import { useState } from "react";
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
  allergens?: string | null;
  tags?: string | null;
  difficulty?: string | null;
  servings?: number | null;
  buddyMakerId?: number | null;
  isSeeded?: boolean | null;
  isPublic?: boolean | null;
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "para_ti", label: "Para ti", tag: undefined },
  { id: "rapidas", label: "Rápidas", tag: "rapida" },
  { id: "fitness", label: "Fitness", tag: "fitness" },
  { id: "vegetarianas", label: "Vegetarianas", tag: "vegetariana" },
  { id: "top_semana", label: "Top semana", tag: "top" },
  { id: "mis_recetas", label: "Mis recetas", tag: undefined },
];

// ─── Meal time labels ─────────────────────────────────────────────────────────
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

// ─── Placeholder images ───────────────────────────────────────────────────────
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80",
];

function getPlaceholderImage(id: number) {
  return PLACEHOLDER_IMAGES[id % PLACEHOLDER_IMAGES.length];
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);
  const imgSrc = recipe.imageUrl || getPlaceholderImage(recipe.id);
  const mealTime = recipe.mealTime || "cualquiera";
  const tags: string[] = (() => { try { return recipe.tags ? JSON.parse(recipe.tags) : []; } catch { return []; } })();

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
          {recipe.description && (
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#6b7280", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {recipe.description}
            </p>
          )}
          {/* Nutritional mini-summary */}
          {(recipe.proteinsPerServing || recipe.carbsPerServing || recipe.fatsPerServing) && (
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              {recipe.proteinsPerServing && <span style={{ fontSize: "10px", color: "#6b7280" }}>💪 {Math.round(recipe.proteinsPerServing)}g prot</span>}
              {recipe.carbsPerServing && <span style={{ fontSize: "10px", color: "#6b7280" }}>🌾 {Math.round(recipe.carbsPerServing)}g carbs</span>}
              {recipe.fatsPerServing && <span style={{ fontSize: "10px", color: "#6b7280" }}>🥑 {Math.round(recipe.fatsPerServing)}g grasas</span>}
            </div>
          )}
          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
              {tags.slice(0, 2).map((tag: string) => (
                <span key={tag} style={{ fontSize: "10px", fontWeight: 700, color: "#F97316", background: "rgba(249,115,22,0.1)", borderRadius: "6px", padding: "2px 6px" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── BuddyMaker Card ──────────────────────────────────────────────────────────
type BuddyMaker = {
  id: number;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  instagramHandle?: string | null;
  followersCount?: number | null;
  recipesCount?: number | null;
  specialty?: string | null;
};

function BuddyMakerCard({ maker }: { maker: BuddyMaker }) {
  return (
    <Link href="/buddy-makers">
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "14px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <div style={{ width: "50px", height: "50px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #EC4899, #F97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {maker.avatarUrl ? (
            <img src={maker.avatarUrl} alt={maker.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "20px" }}>👨‍🍳</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>{maker.displayName}</p>
          {maker.specialty && <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#6b7280" }}>{maker.specialty}</p>}
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            {maker.followersCount != null && (
              <span style={{ fontSize: "10px", color: "#9ca3af" }}>👥 {maker.followersCount.toLocaleString()}</span>
            )}
            {maker.recipesCount != null && (
              <span style={{ fontSize: "10px", color: "#9ca3af" }}>🍳 {maker.recipesCount} recetas</span>
            )}
            {maker.instagramHandle && (
              <span style={{ fontSize: "10px", color: "#EC4899", fontWeight: 700 }}>@{maker.instagramHandle}</span>
            )}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Recipes() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("para_ti");
  const [search, setSearch] = useState("");
  const [mealTimeFilter, setMealTimeFilter] = useState("todos");
  const [showSearch, setShowSearch] = useState(false);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];

  // Recipes query
  const { data: recipes, isLoading } = trpc.recipes.list.useQuery({
    search: search || undefined,
    isPublic: activeTab === "mis_recetas" ? undefined : true,
    userId: activeTab === "mis_recetas" ? user?.id : undefined,
    tag: currentTab.tag,
    mealTime: mealTimeFilter !== "todos" ? mealTimeFilter : undefined,
    limit: 40,
  });

  // BuddyMakers query
  const { data: buddyMakersRaw } = trpc.buddyMakers.list.useQuery({ featured: true });

  const mealTimeOptions = [
    { value: "todos", label: "Todos" },
    { value: "desayuno", label: "☀️ Desayuno" },
    { value: "media_manana", label: "🍎 Media mañana" },
    { value: "comida", label: "🍽️ Comida" },
    { value: "merienda", label: "🫐 Merienda" },
    { value: "cena", label: "🌙 Cena" },
  ];

  return (
    <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto", paddingBottom: "100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>Recetas</h1>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "14px", scrollbarWidth: "none" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              background: activeTab === tab.id ? "#F97316" : "white",
              color: activeTab === tab.id ? "white" : "#6b7280",
              boxShadow: activeTab === tab.id ? "0 4px 12px rgba(249,115,22,0.35)" : "0 1px 4px rgba(0,0,0,0.06)",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Meal time filter */}
      {activeTab !== "mis_recetas" && (
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px", scrollbarWidth: "none" }}>
          {mealTimeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMealTimeFilter(opt.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "14px",
                border: `2px solid ${mealTimeFilter === opt.value ? "#F97316" : "#f3f4f6"}`,
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                background: mealTimeFilter === opt.value ? "rgba(249,115,22,0.08)" : "white",
                color: mealTimeFilter === opt.value ? "#F97316" : "#6b7280",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* BuddyMakers section (shown in Para ti tab) */}
      {activeTab === "para_ti" && buddyMakersRaw && buddyMakersRaw.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>BuddyMakers</h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>Creadores de recetas</p>
            </div>
            <Link href="/buddy-makers">
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316", cursor: "pointer" }}>Ver todos →</span>
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(buddyMakersRaw || []).slice(0, 3).map((item: any) => (
              <BuddyMakerCard key={item.maker?.id || item.id} maker={item.maker || item} />
            ))}
          </div>
        </div>
      )}

      {/* Recipes grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>
            {activeTab === "mis_recetas" ? "Mis recetas" : "Recetas recomendadas"}
          </h2>
          {recipes && <span style={{ fontSize: "12px", color: "#9ca3af" }}>{recipes.length} recetas</span>}
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[1, 2, 3, 4].map(i => (
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
              {activeTab === "mis_recetas" ? "Aún no tienes recetas" : "No hay recetas con estos filtros"}
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#9ca3af" }}>
              {activeTab === "mis_recetas" ? "Crea tu primera receta" : "Prueba cambiando los filtros"}
            </p>
            {activeTab === "mis_recetas" && isAuthenticated && (
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
