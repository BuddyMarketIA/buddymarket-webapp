import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(name?: string | null) {
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
  return `${saludo}${name ? `, ${name.split(" ")[0]}` : ""}! 👋`;
}
function fmtDate() {
  return new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Calorie Ring ─────────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal, protein, carbs, fat }: { consumed: number; goal: number; protein: number; carbs: number; fat: number }) {
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const r = 52; const circ = 2 * Math.PI * r;
  const remaining = goal - consumed; // puede ser negativo (exceso)
  const over = consumed > goal;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
      {/* Ring */}
      <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#FED7AA" strokeWidth="10" />
          <circle cx="65" cy="65" r={r} fill="none"
            stroke={over ? "#EF4444" : "#F97316"} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" transform="rotate(-90 65 65)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: over ? "#EF4444" : "#F97316", lineHeight: 1 }}>{remaining}</span>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>kcal rest.</span>
        </div>
      </div>
      {/* Macros */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#6b7280" }}>Meta diaria</span>
          <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{goal} kcal</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "#6b7280" }}>Consumidas</span>
          <span style={{ fontWeight: 700, color: over ? "#EF4444" : "#1a1a1a" }}>{consumed} kcal</span>
        </div>
        <div style={{ height: 1, background: "#f3f4f6" }} />
        {[
          { label: "Proteínas", val: protein, color: "#F97316", unit: "g" },
          { label: "Carbos", val: carbs, color: "#6366F1", unit: "g" },
          { label: "Grasas", val: fat, color: "#10B981", unit: "g" },
        ].map(m => (
          <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#6b7280", flex: 1 }}>{m.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{m.val}{m.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Wellness Strip ───────────────────────────────────────────────────────────
function WellnessStrip() {
  const metrics = [
    { label: "Recovery", value: "–", unit: "%", color: "#10B981", icon: "⚡" },
    { label: "Sueño", value: "–", unit: "h", color: "#6366F1", icon: "🌙" },
    { label: "HRV", value: "–", unit: "ms", color: "#F97316", icon: "💓" },
    { label: "Pasos", value: "–", unit: "", color: "#0EA5E9", icon: "👟" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {metrics.map(m => (
        <Link key={m.label} href="/app/health-hub">
          <div style={{ background: "white", borderRadius: 14, padding: "12px 10px", textAlign: "center", border: "1px solid #f3f4f6", cursor: "pointer", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{m.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Quick Access Grid ────────────────────────────────────────────────────────
const QUICK = [
  { label: "Recetas", emoji: "🍽️", to: "/app/recipes", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg", color: "#F97316" },
  { label: "Menús", emoji: "📅", to: "/app/menus", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg", color: "#6366F1" },
  { label: "Supermercados", emoji: "🛒", to: "/app/supermercados", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg", color: "#10B981" },
  { label: "Inventario", emoji: "📦", to: "/app/inventory", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg", color: "#F59E0B" },
  { label: "BuddyScan", emoji: "📷", to: "/app/buddy-scan", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyscan_dd3e1e08.jpg", color: "#8B5CF6" },
  { label: "BuddyIA", emoji: "🧠", to: "/app/buddy-ia", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyia_card-VHfq39XvN8Z86UvgxyYrxs.webp", color: "#7C3AED" },
];

function QuickAccessGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {QUICK.map(q => (
        <Link key={q.label} href={q.to}>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "1/0.75", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
            <img src={q.img} alt={q.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{q.emoji} {q.label}</div>
            </div>
            <div style={{ position: "absolute", top: 8, left: 8, width: 8, height: 8, borderRadius: "50%", background: q.color }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Buddy Coach CTA ──────────────────────────────────────────────────────────
function BuddyCoachCTA() {
  return (
    <Link href="/app/health-hub">
      <div style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)", borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "white" }}>Buddy Coach</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Tu asesor de bienestar personalizado</p>
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.8)" }}>→</div>
      </div>
    </Link>
  );
}

// ─── Active Menu Card ─────────────────────────────────────────────────────────
function ActiveMenuCard({ menu }: { menu: any }) {
  if (!menu) return (
    <Link href="/app/menus">
      <div style={{ background: "#FFF7ED", borderRadius: 18, padding: "16px 20px", border: "1.5px dashed #FED7AA", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ fontSize: 28 }}>📅</div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#F97316" }}>Sin menú activo</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>Genera un menú personalizado →</p>
        </div>
      </div>
    </Link>
  );
  return (
    <Link href="/app/active-menu">
      <div style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)", borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ fontSize: 28 }}>📅</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Menú en curso</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 800, color: "white" }}>{menu.name}</p>
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.8)" }}>→</div>
      </div>
    </Link>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe }: { recipe: any }) {
  if (!recipe) return null;
  return (
    <Link href={`/app/recipes/${recipe.id}`}>
      <div style={{ background: "white", borderRadius: 18, overflow: "hidden", border: "1px solid #f3f4f6", cursor: "pointer" }}>
        {recipe.imageUrl && (
          <div style={{ height: 140, overflow: "hidden" }}>
            <img src={recipe.imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: "#FFF7ED", color: "#F97316", padding: "2px 8px", borderRadius: 20 }}>Receta del día</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{recipe.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>🔥 {recipe.calories ?? "–"} kcal · ⏱ {recipe.prepTime ?? "–"} min</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Community Strip ──────────────────────────────────────────────────────────
function CommunityStrip() {
  const items = [
    { label: "Mi Nutricionista", emoji: "👩‍⚕️", to: "/app/my-expert", color: "#6366F1" },
    { label: "BuddyExperts", emoji: "🧑‍⚕️", to: "/app/buddy-experts", color: "#0EA5E9" },
    { label: "BuddyShop", emoji: "🛍️", to: "/app/buddy-shop", color: "#F97316" },
    { label: "BuddyCare", emoji: "💚", to: "/app/buddy-care", color: "#10B981" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {items.map(i => (
        <Link key={i.label} href={i.to}>
          <div style={{ background: "white", borderRadius: 14, padding: "12px 8px", textAlign: "center", border: "1px solid #f3f4f6", cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: i.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, margin: "0 auto 6px" }}>{i.emoji}</div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#374151", lineHeight: 1.2 }}>{i.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Streak / Level Widget ────────────────────────────────────────────────────
function StreakWidget({ streak, level, levelName }: { streak: number; level: number; levelName: string }) {
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6" }}>
      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mi progreso</p>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🔥</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F97316", lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>días racha</div>
        </div>
        <div style={{ width: 1, height: 48, background: "#f3f4f6" }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{levelName}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Nv. {level}</span>
          </div>
          <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99 }}>
            <div style={{ height: "100%", width: `${Math.min((level % 10) * 10, 100)}%`, background: "linear-gradient(90deg, #F97316, #FB923C)", borderRadius: 99 }} />
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <Link href="/app/health-hub">
              <span style={{ fontSize: 11, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver metas →</span>
            </Link>
            <Link href="/app/health-hub">
              <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, cursor: "pointer" }}>Logros →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendations ──────────────────────────────────────────────────────────
function RecommendationsList({ recipes }: { recipes: any[] }) {
  if (!recipes.length) return null;
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>✨ Para ti hoy</p>
        <Link href="/app/recipes"><span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver todas →</span></Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recipes.slice(0, 3).map((r: any) => (
          <Link key={r.id} href={`/app/recipes/${r.id}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 12, background: "#FFF7ED", cursor: "pointer" }}>
              {r.imageUrl && <img src={r.imageUrl} alt={r.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>🔥 {r.calories ?? "–"} kcal</p>
              </div>
              <span style={{ fontSize: 16, color: "#F97316" }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Daily Recommendations ──────────────────────────────────────────────────
type DailyRecsProps = { consumed: number; goal: number; protein: number; carbs: number; fat: number; proteinGoal: number; carbsGoal: number; fatGoal: number; streak: number; };
function DailyRecs({ consumed, goal, protein, carbs, fat, proteinGoal, carbsGoal, fatGoal, streak }: DailyRecsProps) {
  const hour = new Date().getHours();
  const pct = goal > 0 ? consumed / goal : 0;
  const recs: { icon: string; text: string; color: string }[] = [];

  if (consumed === 0) {
    if (hour < 10) recs.push({ icon: "🌅", text: "Empieza el día con un desayuno equilibrado: proteínas + carbohidratos complejos.", color: "#FFF7ED" });
    else if (hour < 14) recs.push({ icon: "🍽️", text: "Aún no has registrado comidas hoy. ¡Registra tu almuerzo para seguir tu progreso!", color: "#FFF7ED" });
    else recs.push({ icon: "📋", text: "Registra tus comidas para que Buddy Coach pueda darte recomendaciones personalizadas.", color: "#FFF7ED" });
  } else if (pct < 0.4) {
    recs.push({ icon: "⚡", text: `Solo llevas ${consumed} kcal de ${goal} kcal. Asegúrate de comer suficiente para mantener tu energía.`, color: "#FFF7ED" });
  } else if (pct > 0.9 && pct < 1.05) {
    recs.push({ icon: "🎯", text: "¡Casi en tu meta calórica! Elige una cena ligera rica en verduras y proteína magra.", color: "#F0FDF4" });
  } else if (pct >= 1.05) {
    recs.push({ icon: "⚠️", text: `Has superado tu meta en ${consumed - goal} kcal. Opta por una cena muy ligera y bebe agua.`, color: "#FEF3C7" });
  }

  const proteinPct = proteinGoal > 0 ? protein / proteinGoal : 0;
  if (proteinPct < 0.5 && consumed > 0) recs.push({ icon: "💪", text: `Tu proteína está baja (${Math.round(protein)}g de ${proteinGoal}g). Añade pollo, huevos o legumbres en tu próxima comida.`, color: "#EFF6FF" });

  if (streak >= 7) recs.push({ icon: "🔥", text: `¡${streak} días de racha! Mantén el ritmo — la consistencia es la clave del éxito.`, color: "#FFF7ED" });
  else if (streak === 0) recs.push({ icon: "🚀", text: "Registra tus comidas hoy para empezar tu racha. ¡Los primeros 7 días son los más importantes!", color: "#F5F3FF" });

  if (hour >= 14 && hour < 17 && consumed > 0) recs.push({ icon: "🥜", text: "Hora del snack de tarde: un puñado de frutos secos o una fruta te dará energía hasta la cena.", color: "#F0FDF4" });

  if (!recs.length) return null;
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>💡 Recomendaciones de hoy</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recs.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: r.color }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardV2() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [today] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Data
  const profileData = trpc.profile.get.useQuery();
  const dailySummary = trpc.mealLogs.dailySummary.useQuery({ date: today });
  const streakData = trpc.mealLogs.getStreak.useQuery();
  const activeMenuData = trpc.menus.getActive.useQuery();
  const levelInfo = trpc.retention.getLevelInfo.useQuery();
  const contextualRecipe = trpc.retention.getDailyContextualRecipe.useQuery();
  const recommendedRecipes = trpc.recipes.list.useQuery(
    useMemo(() => ({ limit: 3, isPublic: true, excludeUserAllergens: true }), [])
  );

  const profile = profileData.data;
  const summary = dailySummary.data;
  const goalCal = profile?.dailyCalorieGoal ?? 2000;
  const consumed = summary?.totalCalories ?? 0;
  const streak = streakData.data?.currentStreak ?? 0;
  const lvl = levelInfo.data;
  const recipe = contextualRecipe.data;
  const recs = recommendedRecipes.data ?? [];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 40px" }}>

      {/* ── PROTOTYPE BANNER ── */}
      <div style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)", borderRadius: 14, padding: "10px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>🧪</span>
        <p style={{ margin: 0, fontSize: 13, color: "white", fontWeight: 600 }}>Prototipo del nuevo Dashboard — <span style={{ opacity: 0.85 }}>Dinos qué te parece antes de reemplazar el actual</span></p>
        <Link href="/app/dashboard" style={{ marginLeft: "auto" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>← Ver dashboard actual</span>
        </Link>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)", borderRadius: 22, padding: "22px 24px", marginBottom: 20, border: "1px solid #FED7AA" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{getGreeting(user?.name)}</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>{capitalize(fmtDate())} · {streak > 0 ? `🔥 ¡Sigues en racha! ${streak} días` : "Empieza tu racha hoy"}</p>
          </div>
          <Link href="/app/health-hub">
            <div style={{ background: "white", borderRadius: 14, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, border: "1px solid #FED7AA", cursor: "pointer" }}>
              <span style={{ fontSize: 14 }}>💓</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#F97316" }}>Health Hub</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>→</span>
            </div>
          </Link>
        </div>

        {/* Wellness strip */}
        <div style={{ marginTop: 16 }}>
          <WellnessStrip />
        </div>
      </div>

      {/* ── 2-COLUMN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }}>

        {/* ── COLUMN LEFT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Calorías */}
          <div style={{ background: "white", borderRadius: 20, padding: "20px 22px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>🔥 Calorías hoy</p>
              <Link href="/app/meal-log">
                <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>+ Registrar →</span>
              </Link>
            </div>
            <CalorieRing
              consumed={consumed}
              goal={goalCal}
              protein={summary?.totalProtein ?? 0}
              carbs={summary?.totalCarbs ?? 0}
              fat={summary?.totalFat ?? 0}
            />
          </div>

          {/* Menú activo */}
          <ActiveMenuCard menu={activeMenuData.data} />

          {/* Buddy Coach CTA */}
          <BuddyCoachCTA />

          {/* Recomendaciones diarias personalizadas */}
          <DailyRecs
            consumed={consumed}
            goal={goalCal}
            protein={summary?.totalProtein ?? 0}
            carbs={summary?.totalCarbs ?? 0}
            fat={summary?.totalFat ?? 0}
            proteinGoal={Math.round((goalCal * 0.30) / 4)}
            carbsGoal={Math.round((goalCal * 0.45) / 4)}
            fatGoal={Math.round((goalCal * 0.25) / 9)}
            streak={streak}
          />

          {/* Recetas recomendadas */}
          <RecommendationsList recipes={recs} />

        </div>

        {/* ── COLUMN RIGHT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Accesos rápidos */}
          <div style={{ background: "white", borderRadius: 20, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Accesos rápidos</p>
            <QuickAccessGrid />
          </div>

          {/* Racha + Nivel */}
          <StreakWidget
            streak={streak}
            level={lvl?.level ?? 1}
            levelName={lvl?.levelName ?? "Principiante"}
          />

          {/* Receta del día */}
          {recipe && <RecipeCard recipe={recipe} />}

          {/* Comunidad */}
          <div style={{ background: "white", borderRadius: 20, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Comunidad & Tienda</p>
            <CommunityStrip />
          </div>

        </div>
      </div>
    </div>
  );
}
