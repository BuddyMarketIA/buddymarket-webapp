import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";

const CATEGORY_LABELS: Record<string, string> = {
  verdura: "🥦 Verduras",
  fruta: "🍎 Frutas",
  carne: "🥩 Carnes",
  pescado: "🐟 Pescados",
  lácteo: "🧀 Lácteos y Huevos",
  cereal: "🌾 Cereales",
  legumbre: "🫘 Legumbres",
  fruto_seco: "🥜 Frutos secos",
  semilla: "🌱 Semillas",
  aceite: "🫙 Aceites",
  condimento: "🧂 Condimentos",
  azucar: "🍯 Azúcares",
  conserva: "🥫 Conservas",
  caldo: "🍲 Caldos",
  bebida: "🥤 Bebidas",
  proteína: "💪 Proteínas",
  suplemento: "💊 Suplementos",
  otro: "📦 Otros",
};

type Ingredient = {
  id: number;
  name: string;
  nameEn?: string | null;
  category?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  saturatedFat?: number | null;
  vitaminC?: number | null;
  vitaminA?: number | null;
  calcium?: number | null;
  iron?: number | null;
  potassium?: number | null;
  glycemicIndex?: number | null;
  isProcessed?: boolean | null;
};

function NutritionBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "#666" }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value.toFixed(1)}g</span>
      </div>
      <div style={{ background: "#f0ebe3", borderRadius: 4, height: 6 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: 6, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function IngredientCard({ ing, onClick }: { ing: Ingredient; onClick: () => void }) {
  const cat = ing.category ?? "otro";
  const emoji = CATEGORY_LABELS[cat]?.split(" ")[0] ?? "📦";
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "16px",
        cursor: "pointer",
        border: "1.5px solid #f0ebe3",
        transition: "box-shadow 0.2s, transform 0.1s",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ing.name}</div>
          <div style={{ fontSize: 11, color: "#999" }}>{CATEGORY_LABELS[cat]?.split(" ").slice(1).join(" ") ?? cat}</div>
        </div>
        {ing.isProcessed && (
          <span style={{ fontSize: 10, background: "#fff3e0", color: "#e65100", borderRadius: 8, padding: "2px 7px", fontWeight: 600 }}>Procesado</span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
        {[
          { label: "Kcal", value: ing.calories, unit: "", color: "#FF6B35" },
          { label: "Prot", value: ing.protein, unit: "g", color: "#4CAF50" },
          { label: "Carbs", value: ing.carbs, unit: "g", color: "#2196F3" },
          { label: "Grasa", value: ing.fat, unit: "g", color: "#FF9800" },
        ].map(m => (
          <div key={m.label} style={{ textAlign: "center", background: "#faf8f5", borderRadius: 8, padding: "6px 4px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value.toFixed(0)}{m.unit}</div>
            <div style={{ fontSize: 10, color: "#999" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IngredientDetail({ ing, onClose }: { ing: Ingredient; onClose: () => void }) {
  const [grams, setGrams] = useState(100);
  const factor = grams / 100;
  const cat = ing.category ?? "otro";
  const emoji = CATEGORY_LABELS[cat]?.split(" ")[0] ?? "📦";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div
        style={{
          background: "#faf8f5", borderRadius: "24px 24px 0 0", padding: "24px 20px 32px",
          width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>{emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a" }}>{ing.name}</div>
            {ing.nameEn && <div style={{ fontSize: 13, color: "#999" }}>{ing.nameEn}</div>}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, background: "#f0ebe3", color: "#666", borderRadius: 8, padding: "2px 8px" }}>
                {CATEGORY_LABELS[cat]?.split(" ").slice(1).join(" ") ?? cat}
              </span>
              {ing.isProcessed && (
                <span style={{ fontSize: 11, background: "#fff3e0", color: "#e65100", borderRadius: 8, padding: "2px 8px", fontWeight: 600 }}>Procesado</span>
              )}
              {ing.glycemicIndex != null && (
                <span style={{ fontSize: 11, background: ing.glycemicIndex < 55 ? "#e8f5e9" : ing.glycemicIndex < 70 ? "#fff8e1" : "#ffebee", color: ing.glycemicIndex < 55 ? "#2e7d32" : ing.glycemicIndex < 70 ? "#f57f17" : "#c62828", borderRadius: 8, padding: "2px 8px" }}>
                  IG: {ing.glycemicIndex}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#999" }}>✕</button>
        </div>

        {/* Gram selector */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 16, border: "1.5px solid #f0ebe3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: "#1a1a1a" }}>Cantidad</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <button onClick={() => setGrams(g => Math.max(10, g - 10))} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #e0d8ce", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <input
                type="number" min={1} max={2000} value={grams}
                onChange={e => setGrams(Math.max(1, Math.min(2000, Number(e.target.value))))}
                style={{ width: 70, textAlign: "center", border: "1.5px solid #e0d8ce", borderRadius: 10, padding: "6px", fontSize: 16, fontWeight: 700 }}
              />
              <span style={{ color: "#666", fontSize: 14 }}>g</span>
              <button onClick={() => setGrams(g => Math.min(2000, g + 10))} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #e0d8ce", background: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          </div>
          {[25, 50, 100, 150, 200].map(g => (
            <button key={g} onClick={() => setGrams(g)} style={{ marginRight: 8, padding: "4px 12px", borderRadius: 20, border: "1.5px solid", borderColor: grams === g ? "#FF6B35" : "#e0d8ce", background: grams === g ? "#FF6B35" : "#fff", color: grams === g ? "#fff" : "#666", cursor: "pointer", fontSize: 13, fontWeight: grams === g ? 700 : 400 }}>
              {g}g
            </button>
          ))}
        </div>

        {/* Macros */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 16, border: "1.5px solid #f0ebe3" }}>
          <div style={{ fontWeight: 700, marginBottom: 12, color: "#1a1a1a" }}>Macronutrientes por {grams}g</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ textAlign: "center", background: "#fff8f5", borderRadius: 12, padding: "12px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#FF6B35" }}>{(ing.calories * factor).toFixed(0)}</div>
              <div style={{ fontSize: 12, color: "#999" }}>kcal</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                { label: "Prot.", value: ing.protein, color: "#4CAF50" },
                { label: "Carbs", value: ing.carbs, color: "#2196F3" },
                { label: "Grasa", value: ing.fat, color: "#FF9800" },
              ].map(m => (
                <div key={m.label} style={{ textAlign: "center", background: "#faf8f5", borderRadius: 10, padding: "8px 4px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{(m.value * factor).toFixed(1)}</div>
                  <div style={{ fontSize: 10, color: "#999" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <NutritionBar label="Proteínas" value={ing.protein * factor} max={50} color="#4CAF50" />
          <NutritionBar label="Carbohidratos" value={ing.carbs * factor} max={100} color="#2196F3" />
          <NutritionBar label="Grasas" value={ing.fat * factor} max={80} color="#FF9800" />
          {ing.fiber != null && <NutritionBar label="Fibra" value={ing.fiber * factor} max={30} color="#8BC34A" />}
          {ing.sugar != null && <NutritionBar label="Azúcares" value={ing.sugar * factor} max={50} color="#E91E63" />}
          {ing.saturatedFat != null && <NutritionBar label="Grasas saturadas" value={ing.saturatedFat * factor} max={20} color="#FF5722" />}
        </div>

        {/* Micronutrients */}
        {(ing.vitaminC != null || ing.vitaminA != null || ing.calcium != null || ing.iron != null || ing.potassium != null || ing.sodium != null) && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px", border: "1.5px solid #f0ebe3" }}>
            <div style={{ fontWeight: 700, marginBottom: 12, color: "#1a1a1a" }}>Micronutrientes por {grams}g</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Vitamina C", value: ing.vitaminC, unit: "mg", color: "#FF9800" },
                { label: "Vitamina A", value: ing.vitaminA, unit: "μg", color: "#FFC107" },
                { label: "Calcio", value: ing.calcium, unit: "mg", color: "#9C27B0" },
                { label: "Hierro", value: ing.iron, unit: "mg", color: "#F44336" },
                { label: "Potasio", value: ing.potassium, unit: "mg", color: "#3F51B5" },
                { label: "Sodio", value: ing.sodium, unit: "mg", color: "#607D8B" },
              ].filter(m => m.value != null && m.value > 0).map(m => (
                <div key={m.label} style={{ textAlign: "center", background: "#faf8f5", borderRadius: 10, padding: "8px 4px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{((m.value! * factor)).toFixed(1)}</div>
                  <div style={{ fontSize: 10, color: "#999" }}>{m.unit}</div>
                  <div style={{ fontSize: 10, color: "#bbb" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IngredientExplorer() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debounce = useCallback((value: string) => {
    setQuery(value);
    const t = setTimeout(() => setDebouncedQuery(value), 350);
    return () => clearTimeout(t);
  }, []);

  const { data: categories } = trpc.ingredientNutrition.categories.useQuery();
  const { data: searchResults, isLoading: searching } = trpc.ingredientNutrition.search.useQuery(
    { query: debouncedQuery, limit: 40 },
    { enabled: debouncedQuery.length >= 2 }
  );
  const { data: categoryResults, isLoading: loadingCat } = trpc.ingredientNutrition.byCategory.useQuery(
    { category: selectedCategory ?? "", limit: 60 },
    { enabled: !!selectedCategory && debouncedQuery.length < 2 }
  );

  const results: Ingredient[] = debouncedQuery.length >= 2
    ? (searchResults ?? [])
    : selectedCategory
      ? (categoryResults ?? [])
      : [];

  const isLoading = searching || loadingCat;

  return (
    <AppLayout title="Ingredientes" showBack>
      <div style={{ padding: "16px 16px 100px", maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Explorador de Ingredientes</h1>
          <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>231 ingredientes con valores nutricionales por 100g</p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "#aaa" }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar ingrediente... (ej: pollo, arroz, manzana)"
            value={query}
            onChange={e => debounce(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px 12px 44px",
              borderRadius: 14, border: "1.5px solid #e0d8ce",
              fontSize: 15, background: "#fff", outline: "none",
              boxSizing: "border-box",
            }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setDebouncedQuery(""); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#aaa" }}>✕</button>
          )}
        </div>

        {/* Category pills */}
        {debouncedQuery.length < 2 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16, scrollbarWidth: "none" }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, border: "1.5px solid", borderColor: !selectedCategory ? "#FF6B35" : "#e0d8ce", background: !selectedCategory ? "#FF6B35" : "#fff", color: !selectedCategory ? "#fff" : "#666", cursor: "pointer", fontSize: 13, fontWeight: !selectedCategory ? 700 : 400 }}
            >
              Todas
            </button>
            {(categories ?? []).map((cat: string) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 20, border: "1.5px solid", borderColor: selectedCategory === cat ? "#FF6B35" : "#e0d8ce", background: selectedCategory === cat ? "#FF6B35" : "#fff", color: selectedCategory === cat ? "#fff" : "#666", cursor: "pointer", fontSize: 13, fontWeight: selectedCategory === cat ? 700 : 400 }}
              >
                {CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Buscando...</div>
        ) : results.length > 0 ? (
          <>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>{results.length} ingredientes encontrados</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {results.map(ing => (
                <IngredientCard key={ing.id} ing={ing} onClick={() => setSelectedIng(ing)} />
              ))}
            </div>
          </>
        ) : debouncedQuery.length >= 2 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ color: "#666" }}>No se encontraron ingredientes para "<strong>{debouncedQuery}</strong>"</div>
          </div>
        ) : !selectedCategory ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
            <div style={{ color: "#666" }}>Busca un ingrediente o selecciona una categoría</div>
          </div>
        ) : null}
      </div>

      {selectedIng && <IngredientDetail ing={selectedIng} onClose={() => setSelectedIng(null)} />}
    </AppLayout>
  );
}
