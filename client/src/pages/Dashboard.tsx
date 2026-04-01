import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const QUICK_ACCESS = [
  { label: "Lista de Compra", emoji: "🛒", to: "/shopping-lists", bg: "#FEF3C7" },
  { label: "Menús", emoji: "📅", to: "/menus", bg: "#DBEAFE" },
  { label: "BuddyScan IA", emoji: "🤖", to: "/menus", bg: "#EDE9FE" },
  { label: "Objetivos", emoji: "💪", to: "/profile", bg: "#FCE7F3" },
  { label: "Inventario", emoji: "📦", to: "/inventory", bg: "#D1FAE5" },
  { label: "Evolución", emoji: "📊", to: "/meal-log", bg: "#FEE2E2" },
];

const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "¡Buenos días";
  if (h < 20) return "¡Buenas tardes";
  return "¡Buenas noches";
}

function getDay() {
  return new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [goalCalories, setGoalCalories] = useState(2000);
  const [showGoalEdit, setShowGoalEdit] = useState(false);

  const dailySummary = trpc.mealLogs.dailySummary.useQuery({ date: today });
  const inventoryList = trpc.inventory.list.useQuery();
  const recentRecipes = trpc.recipes.list.useQuery(useMemo(() => ({ limit: 3, isPublic: true }), []));
  const _menusList = trpc.menus.list.useQuery();

  const consumed = dailySummary.data?.calories ?? 0;
  const remaining = Math.max(0, goalCalories - consumed);
  const progress = Math.min(100, (consumed / goalCalories) * 100);
  const protein = dailySummary.data?.proteins ?? 0;
  const carbs = dailySummary.data?.carbohydrates ?? 0;
  const fat = dailySummary.data?.fats ?? 0;

  const firstName = user?.name?.split(" ")[0] || "Usuario";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const todayMenuItems: any[] = [];

  return (
    <div style={{ padding: "16px", paddingBottom: "8px" }}>

      {/* Greeting Row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, color: "white", flexShrink: 0, boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}>
          {userInitial}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>
            {getGreeting()}, {firstName}! 👋
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>
            {getDay().charAt(0).toUpperCase() + getDay().slice(1)}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#F97316", fontWeight: 600 }}>
            🎯 ¡Sigue así, estás en racha!
          </p>
        </div>
      </div>

      {/* Calorie Ring Card */}
      <div style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 60%, #FDBA74 100%)", borderRadius: "24px", padding: "20px", marginBottom: "16px", boxShadow: "0 8px 32px rgba(249,115,22,0.30)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
        <div style={{ position: "absolute", bottom: "-30px", left: "-10px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative" }}>
          {/* Ring */}
          <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8"/>
              <circle cx="45" cy="45" r="38" fill="none" stroke="white" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - progress / 100)}`}
                strokeLinecap="round" transform="rotate(-90 45 45)"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "18px", fontWeight: 900, color: "white", lineHeight: 1 }}>{consumed}</span>
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>kcal</span>
            </div>
          </div>
          {/* Stats */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>Calorías hoy</p>
              <button onClick={() => setShowGoalEdit(!showGoalEdit)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", padding: "2px 8px", fontSize: "11px", color: "white", cursor: "pointer", fontWeight: 600 }}>
                Meta: {goalCalories}
              </button>
            </div>
            {showGoalEdit && (
              <div style={{ marginBottom: "8px", display: "flex", gap: "6px" }}>
                <input type="number" defaultValue={goalCalories} onBlur={(e) => { setGoalCalories(Number(e.target.value)); setShowGoalEdit(false); }} style={{ flex: 1, padding: "4px 8px", borderRadius: "8px", border: "none", fontSize: "13px", background: "rgba(255,255,255,0.9)" }} />
              </div>
            )}
            <p style={{ margin: "0 0 12px", fontSize: "26px", fontWeight: 900, color: "white", letterSpacing: "-0.04em" }}>
              {remaining} <span style={{ fontSize: "13px", fontWeight: 600, opacity: 0.8 }}>restantes</span>
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              {[{ label: "P", value: `${Math.round(protein)}g`, color: "rgba(255,255,255,0.9)" }, { label: "C", value: `${Math.round(carbs)}g`, color: "rgba(255,255,255,0.9)" }, { label: "G", value: `${Math.round(fat)}g`, color: "rgba(255,255,255,0.9)" }].map((m) => (
                <div key={m.label} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: m.color }}>{m.value}</p>
                  <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Menu */}
      {todayMenuItems.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Menú de hoy</h2>
            <Link href="/menus"><span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316" }}>Ver semana →</span></Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {todayMenuItems.slice(0, 3).map((item: any, i: number) => (
              <div key={i} style={{ background: "white", borderRadius: "16px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                  {item.mealType === "breakfast" ? "🌅" : item.mealType === "lunch" ? "☀️" : item.mealType === "dinner" ? "🌙" : "🍎"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{item.recipe?.nameEs || item.customMealName || "Comida"}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{item.mealType === "breakfast" ? "Desayuno" : item.mealType === "lunch" ? "Comida" : item.mealType === "dinner" ? "Cena" : "Snack"}</p>
                </div>
                <Link href={`/meal-log`}>
                  <button onClick={() => toast.success("Añadido al diario")} style={{ background: "#F97316", border: "none", borderRadius: "10px", padding: "6px 12px", fontSize: "11px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                    + Registrar
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Accesos Rápidos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          {QUICK_ACCESS.map((item) => (
            <Link key={item.label} href={item.to}>
              <div style={{ background: "white", borderRadius: "18px", padding: "16px 12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer", transition: "transform 0.15s", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 8px" }}>
                  {item.emoji}
                </div>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#374151", lineHeight: 1.3 }}>{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Expiring Items Alert */}
      {((inventoryList.data?.filter((item: any) => {
        if (!item.item?.expirationDate) return false;
        const exp = new Date(item.item.expirationDate);
        const diff = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff <= 3 && diff >= 0;
      })?.length ?? 0) > 0) && (
        <Link href="/inventory">
          <div style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", borderRadius: "18px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", border: "1px solid rgba(245,158,11,0.2)" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#92400E" }}>
                Productos próximos a caducar en tu inventario
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#B45309" }}>Toca para ver el inventario →</p>
            </div>
          </div>
        </Link>
      )}

      {/* Recent Recipes */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Recetas destacadas</h2>
          <Link href="/recipes"><span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316" }}>Ver todas →</span></Link>
        </div>
        {recentRecipes.isLoading ? (
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: "160px", height: "120px", borderRadius: "18px", background: "#f3f4f6", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : recentRecipes.data && recentRecipes.data.length > 0 ? (
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
            {recentRecipes.data.map((recipe: any, i: number) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <div style={{ width: "160px", flexShrink: 0, borderRadius: "18px", overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                  <div style={{ height: "110px", background: `linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%), url(${FOOD_IMAGES[i % FOOD_IMAGES.length]}) center/cover` }}>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px" }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "white", lineHeight: 1.3, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{recipe.nameEs}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "10px", color: "rgba(255,255,255,0.8)" }}>{recipe.calories ?? 0} kcal</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "18px", padding: "24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 4px", fontSize: "28px" }}>🍽️</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>Aún no hay recetas públicas</p>
            <Link href="/recipes/new">
              <button style={{ marginTop: "10px", background: "#F97316", border: "none", borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                Crear receta
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Add Meal CTA */}
      <Link href="/meal-log">
        <div style={{ background: "white", borderRadius: "20px", padding: "16px 20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "2px dashed rgba(249,115,22,0.25)", cursor: "pointer" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>Registrar comida</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>Añade lo que has comido hoy</p>
          </div>
        </div>
      </Link>

      {/* Disclaimer */}
      <p style={{ fontSize: "10px", color: "#d1d5db", textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
        BuddyMarket no constituye asesoramiento médico o nutricional profesional. Consulta a un profesional.
      </p>
    </div>
  );
}
