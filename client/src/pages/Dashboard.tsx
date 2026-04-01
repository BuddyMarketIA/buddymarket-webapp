import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

const QUICK_ACCESS = [
  {
    label: "Recetas",
    emoji: "🍽️",
    to: "/recipes",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",
    accent: "#F97316",
    size: "large",
    subtitle: "Explora recetas",
  },
  {
    label: "Menús",
    emoji: "📅",
    to: "/menus",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
    accent: "#6366F1",
    size: "small",
    subtitle: "Plan semanal",
  },
  {
    label: "Supermercados",
    emoji: "🛒",
    to: "/supermercados",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",
    accent: "#10B981",
    size: "small",
    subtitle: "Hacer la compra",
  },
  {
    label: "Inventario",
    emoji: "📦",
    to: "/inventory",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",
    accent: "#F59E0B",
    size: "small",
    subtitle: "Tu despensa",
  },
  {
    label: "BuddyScan IA",
    emoji: "🤖",
    to: "/menus",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyscan_dd3e1e08.jpg",
    accent: "#8B5CF6",
    size: "wide",
    subtitle: "Escanea ingredientes con IA",
  },
  {
    label: "Diario",
    emoji: "📊",
    to: "/meal-log",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg",
    accent: "#EF4444",
    size: "small",
    subtitle: "Registro nutricional",
  },
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

const RECIPE_OF_DAY = [
  { name: "Ensalada mediterránea", kcal: 320, time: "15 min", img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", tag: "Ligero" },
  { name: "Pollo al horno con verduras", kcal: 480, time: "40 min", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80", tag: "Proteínas" },
  { name: "Pasta con pesto y tomates", kcal: 540, time: "20 min", img: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80", tag: "Energético" },
  { name: "Salmón con quinoa", kcal: 420, time: "25 min", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80", tag: "Omega-3" },
  { name: "Bowl de açaí con frutas", kcal: 290, time: "10 min", img: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80", tag: "Antioxidante" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [goalCalories, setGoalCalories] = useState(2000);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [recipeIdx, setRecipeIdx] = useState(0);

  // Auto-rotate recipe carousel every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRecipeIdx((prev) => (prev + 1) % RECIPE_OF_DAY.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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

      {/* Weekly Menu Banner (mockup style) */}
      <Link href="/menus">
        <div style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(249,115,22,0.35)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-10px", right: "-10px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "20px" }}>🍽️</span>
              <p style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>Menú semanal personalizado</p>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>Basado en tus objetivos</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "6px 14px", backdropFilter: "blur(4px)" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "white" }}>Ver menú</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
          <div style={{ width: "80px", height: "80px", borderRadius: "16px", overflow: "hidden", flexShrink: 0 }}>
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80" alt="Menú semanal" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </Link>

      {/* 4 Quick Access Cards: Lista compra, Menús BuddyExperts, BuddyIA, Biblioteca Menús */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {[
          { href: "/shopping-lists", emoji: "🛒", label: "Lista de la compra", bg: "white", color: "#1a1a1a", shadow: "0 2px 10px rgba(0,0,0,0.07)", border: "none" },
          { href: "/buddy-experts", emoji: "🧑‍🍳", label: "Menús BuddyExperts", bg: "white", color: "#1a1a1a", shadow: "0 2px 10px rgba(0,0,0,0.07)", border: "none" },
          { href: "/buddy-ia", emoji: "🤖", label: "Buddy IA", bg: "white", color: "#1a1a1a", shadow: "0 2px 10px rgba(0,0,0,0.07)", border: "none" },
          { href: "/menu-library", emoji: "📚", label: "Biblioteca Menús", bg: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", color: "#F97316", shadow: "0 2px 10px rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.15)" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div style={{ background: item.bg, borderRadius: "18px", padding: "16px 10px", textAlign: "center", boxShadow: item.shadow, cursor: "pointer", transition: "transform 0.2s", border: item.border }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>{item.emoji}</div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: item.color, lineHeight: 1.3 }}>{item.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Access — Bento Grid */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 14px", fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Accesos Rápidos</h2>

        {/* Row 1: large + 2 small */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", gap: "10px", marginBottom: "10px" }}>
          {/* Large card — Recetas */}
          <Link href={QUICK_ACCESS[0].to} style={{ gridRow: "1 / 3" }}>
            <div style={{ height: "200px", borderRadius: "22px", overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.18)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${QUICK_ACCESS[0].img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)" }} />
              <div style={{ position: "absolute", top: "12px", left: "12px", background: QUICK_ACCESS[0].accent, borderRadius: "10px", padding: "5px 10px", display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ fontSize: "14px" }}>{QUICK_ACCESS[0].emoji}</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "white" }}>{QUICK_ACCESS[0].label}</span>
              </div>
              <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{QUICK_ACCESS[0].subtitle}</p>
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ flex: 1, height: "2px", background: "rgba(255,255,255,0.3)", borderRadius: "1px" }}>
                    <div style={{ width: "60%", height: "100%", background: QUICK_ACCESS[0].accent, borderRadius: "1px" }} />
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Small cards — Menús + Supermercados */}
          {[QUICK_ACCESS[1], QUICK_ACCESS[2]].map((item) => (
            <Link key={item.label} href={item.to}>
              <div style={{ height: "95px", borderRadius: "18px", overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${item.img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.70) 100%)" }} />
                <div style={{ position: "absolute", top: "10px", left: "10px", background: item.accent, borderRadius: "8px", padding: "3px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "11px" }}>{item.emoji}</span>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "white" }}>{item.label}</span>
                </div>
                <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
                  <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.75)", fontWeight: 500, lineHeight: 1.3 }}>{item.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Row 2: wide BuddyScan + small Inventario + small Diario */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {/* Wide BuddyScan — spans 2 cols */}
          <Link href={QUICK_ACCESS[4].to} style={{ gridColumn: "1 / 3" }}>
            <div style={{ height: "90px", borderRadius: "18px", overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${QUICK_ACCESS[4].img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(139,92,246,0.85) 0%, rgba(0,0,0,0.4) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                  {QUICK_ACCESS[4].emoji}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>{QUICK_ACCESS[4].label}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>{QUICK_ACCESS[4].subtitle}</p>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "4px 10px", backdropFilter: "blur(8px)" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "white" }}>✨ IA</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Small — Inventario */}
          <Link href={QUICK_ACCESS[3].to}>
            <div style={{ height: "90px", borderRadius: "18px", overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${QUICK_ACCESS[3].img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.72) 100%)" }} />
              <div style={{ position: "absolute", top: "10px", left: "10px", background: QUICK_ACCESS[3].accent, borderRadius: "8px", padding: "3px 8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "white" }}>{QUICK_ACCESS[3].emoji}</span>
              </div>
              <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "6px" }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "white" }}>{QUICK_ACCESS[3].label}</p>
                <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.7)" }}>{QUICK_ACCESS[3].subtitle}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Row 3: Diario full width */}
        <div style={{ marginTop: "10px" }}>
          <Link href={QUICK_ACCESS[5].to}>
            <div style={{ height: "80px", borderRadius: "18px", overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${QUICK_ACCESS[5].img})`, backgroundSize: "cover", backgroundPosition: "center 40%" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(239,68,68,0.82) 0%, rgba(0,0,0,0.3) 100%)" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                  {QUICK_ACCESS[5].emoji}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>{QUICK_ACCESS[5].label}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>{QUICK_ACCESS[5].subtitle}</p>
                </div>
                <svg style={{ marginLeft: "auto" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          </Link>
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

      {/* Recipe of the Day Carousel */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Receta del día</h2>
          <Link href="/recipes"><span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316" }}>Ver más →</span></Link>
        </div>
        <div style={{ position: "relative", borderRadius: "22px", overflow: "hidden", height: "180px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          {RECIPE_OF_DAY.map((recipe, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 100%), url(${recipe.img}) center/cover`,
                opacity: idx === recipeIdx ? 1 : 0,
                transition: "opacity 0.7s ease",
                display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "16px",
              }}
            >
              <span style={{ display: "inline-block", background: "#F97316", color: "white", fontSize: "10px", fontWeight: 800, borderRadius: "8px", padding: "3px 8px", marginBottom: "6px", width: "fit-content" }}>{recipe.tag}</span>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{recipe.name}</p>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>🔥 {recipe.kcal} kcal</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>⏱ {recipe.time}</span>
              </div>
            </div>
          ))}
          {/* Dots indicator */}
          <div style={{ position: "absolute", bottom: "12px", right: "12px", display: "flex", gap: "5px" }}>
            {RECIPE_OF_DAY.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setRecipeIdx(idx)}
                style={{ width: idx === recipeIdx ? "18px" : "6px", height: "6px", borderRadius: "3px", background: idx === recipeIdx ? "white" : "rgba(255,255,255,0.5)", border: "none", padding: 0, cursor: "pointer", transition: "all 0.3s" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Community Section: BuddyExperts, BuddyMakers, BuddyIA */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Comunidad BuddyMarket</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {[
            { label: "BuddyExperts", emoji: "\u{1F468}\u{200D}\u{2695}\u{FE0F}", to: "/buddy-experts", desc: "Nutricionistas y deportistas", color: "linear-gradient(135deg, #F97316, #EA580C)" },
            { label: "BuddyMakers", emoji: "\u{1F468}\u{200D}\u{1F373}", to: "/buddy-makers", desc: "Creadores de recetas", color: "linear-gradient(135deg, #EC4899, #F97316)" },
            { label: "BuddyIA", emoji: "\u{1F916}", to: "/buddy-ia", desc: "Asistente nutricional IA", color: "linear-gradient(135deg, #8B5CF6, #6366F1)" },
          ].map((card) => (
            <Link key={card.label} href={card.to}>
              <div style={{ borderRadius: "18px", overflow: "hidden", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div style={{ background: card.color, padding: "14px 12px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "26px" }}>{card.emoji}</span>
                  <p style={{ margin: 0, fontSize: "11px", fontWeight: 900, color: "white", textAlign: "center", letterSpacing: "-0.01em" }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 1.3 }}>{card.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* BuddyShop Card */}
      <Link href="/buddy-shop">
        <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.20)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-15px", right: "-15px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(249,115,22,0.15)" }} />
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(249,115,22,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🛖</div>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "white" }}>BuddyShop</p>
              <span style={{ background: "#F97316", color: "white", fontSize: "9px", fontWeight: 800, borderRadius: "6px", padding: "2px 6px" }}>buddyshop.app</span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Utensilios y productos de cocina premium</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </Link>

      {/* Pro/Pro Max Upgrade Card */}
      <Link href="/subscription">
        <div style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(249,115,22,0.35)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>👑</div>
          <div style={{ flex: 1, position: "relative" }}>
            <p style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 900, color: "white" }}>Hazte Pro o Pro Max</p>
            <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>IA ilimitada · BuddyScan · Expertos</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </Link>

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
