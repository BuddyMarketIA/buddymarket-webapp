import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";
import DidYouKnow from "@/components/DidYouKnow";
import { useTranslation } from "react-i18next";

// QUICK_ACCESS built inside component
const _QUICK_ACCESS_PLACEHOLDER = [
  {
    label: "Recetas",
    emoji: "🍽️",
    to: "/app/recipes",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",
    accent: "#F97316",
    size: "large",
    subtitle: "Explora recetas",
  },
  {
    label: "Menús",
    emoji: "📅",
    to: "/app/menus",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
    accent: "#6366F1",
    size: "small",
    subtitle: "Plan semanal",
  },
  {
    label: "Supermercados",
    emoji: "🛒",
    to: "/app/supermercados",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",
    accent: "#10B981",
    size: "small",
    subtitle: "Hacer la compra",
  },
  {
    label: "Inventario",
    emoji: "📦",
    to: "/app/inventory",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",
    accent: "#F59E0B",
    size: "small",
    subtitle: "Tu despensa",
  },
  {
    label: "BuddyScan IA",
    emoji: "🤖",
    to: "/app/menus",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyscan_dd3e1e08.jpg",
    accent: "#8B5CF6",
    size: "wide",
    subtitle: "Escanea ingredientes con IA",
  },
  {
    label: "Diario",
    emoji: "📊",
    to: "/app/meal-log",
    img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg",
    accent: "#EF4444",
    size: "small",
    subtitle: "Registro nutricional",
  },
];

const FOOD_IMAGES = [RECIPE_PLACEHOLDER_IMAGE];

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "morningGreeting";
  if (h < 20) return "afternoonGreeting";
  return "eveningGreeting";
}

function getDay(lang?: string) {
  return new Date().toLocaleDateString(lang || "es-ES", { weekday: "long", day: "numeric", month: "short" });
}

const RECIPE_OF_DAY = [
  { id: 81, name: "Ensalada mediterránea", kcal: 320, time: "15 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp", tag: "Ligero" },
  { id: 141, name: "Pollo al horno con verduras", kcal: 480, time: "40 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp", tag: "Proteínas" },
  { id: 135, name: "Pasta con pesto y tomates", kcal: 540, time: "20 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pasta_pesto_tomates-ShvKafyUPxQbbjm5oqKBmm.webp", tag: "Energético" },
  { id: 43, name: "Salmón con quinoa", kcal: 420, time: "25 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp", tag: "Omega-3" },
  { id: 85, name: "Bowl de açaí con frutas", kcal: 290, time: "10 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp", tag: "Antioxidante" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const QUICK_ACCESS = [
    { label: t("nav.recipes"), emoji: "🍽️", to: "/app/recipes", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg", accent: "#F97316", size: "large", subtitle: t("dashboard.recipeSubtitle") },
    { label: t("nav.menus"), emoji: "📅", to: "/app/menus", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg", accent: "#6366F1", size: "small", subtitle: t("dashboard.menuSubtitle") },
    { label: t("nav.supermarkets"), emoji: "🛒", to: "/app/supermercados", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg", accent: "#10B981", size: "small", subtitle: t("dashboard.supermarketsSubtitle") },
    { label: t("nav.inventory"), emoji: "📦", to: "/app/inventory", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg", accent: "#F59E0B", size: "small", subtitle: t("dashboard.inventorySubtitle") },
    { label: t("nav.scan"), emoji: "🤖", to: "/app/menus", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyscan_dd3e1e08.jpg", accent: "#8B5CF6", size: "wide", subtitle: t("dashboard.scanSubtitle") },
    { label: t("nav.diary"), emoji: "📊", to: "/app/meal-log", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg", accent: "#EF4444", size: "small", subtitle: t("dashboard.diarySubtitle") },
  ];
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [goalCaloriesOverride, setGoalCaloriesOverride] = useState<number | null>(null);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [recipeIdx, setRecipeIdx] = useState(0);
  const [stepsHidden, setStepsHidden] = useState(() => {
    try { return localStorage.getItem("bm_steps_hidden") === "true"; } catch { return false; }
  });

  // Auto-rotate recipe carousel every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setRecipeIdx((prev) => (prev + 1) % RECIPE_OF_DAY.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const profileData = trpc.profile.get.useQuery();
  const dailySummary = trpc.mealLogs.dailySummary.useQuery({ date: today });
  const streakData = trpc.mealLogs.getStreak.useQuery();
  const inventoryList = trpc.inventory.list.useQuery();
  const recentRecipes = trpc.recipes.list.useQuery(useMemo(() => ({ limit: 3, isPublic: true }), []));
  const _menusList = trpc.menus.list.useQuery();
  const activeMenuData = trpc.menus.getActive.useQuery();
  const activeMenu = activeMenuData.data;

  const consumed = dailySummary.data?.calories ?? 0;
  // goalCalories: use profile's dailyCalorieGoal if set, else manual override, else default 2000
  const profileCalorieGoal = profileData.data?.profile?.dailyCalorieGoal;
  const goalCalories = goalCaloriesOverride ?? profileCalorieGoal ?? 2000;
  const remaining = Math.max(0, goalCalories - consumed);
  const progress = Math.min(100, (consumed / goalCalories) * 100);
  const protein = dailySummary.data?.proteins ?? 0;
  const carbs = dailySummary.data?.carbohydrates ?? 0;
  const fat = dailySummary.data?.fats ?? 0;

  const firstName = user?.name?.split(" ")[0] || "Usuario";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const todayMenuItems: any[] = [];

  // Macro goals (based on calorie goal)
  const proteinGoal = Math.round((goalCalories * 0.30) / 4);
  const carbsGoal = Math.round((goalCalories * 0.45) / 4);
  const fatGoal = Math.round((goalCalories * 0.25) / 9);

  const proteinPct = proteinGoal > 0 ? (protein / proteinGoal) * 100 : 0;
  const carbsPct = carbsGoal > 0 ? (carbs / carbsGoal) * 100 : 0;
  const fatPct = fatGoal > 0 ? (fat / fatGoal) * 100 : 0;

  const allMacrosComplete = proteinPct >= 100 && carbsPct >= 100 && fatPct >= 100 && consumed > 0;

  // Track whether we already fired confetti today to avoid repeated triggers
  const confettiFiredRef = useRef(false);
  const prevAllCompleteRef = useRef(false);

  useEffect(() => {
    // Only fire when transitioning from incomplete → complete (not on every render)
    if (allMacrosComplete && !prevAllCompleteRef.current && !confettiFiredRef.current) {
      confettiFiredRef.current = true;

      // Burst from both sides
      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          origin: { y: 0.6 },
          ...opts,
          particleCount: Math.floor(200 * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55, colors: ["#F97316", "#FB923C", "#FCD34D"] });
      fire(0.2,  { spread: 60, colors: ["#818CF8", "#6366F1", "#A5B4FC"] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#22C55E", "#34D399", "#86EFAC"] });
      fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#FBBF24", "#F59E0B"] });
      fire(0.1,  { spread: 120, startVelocity: 45, colors: ["#EF4444", "#F87171"] });

      toast.success("🎉 ¡Objetivos de macros completados!", {
        description: "Has alcanzado tus metas de proteínas, carbos y grasas del día. ¡Excelente trabajo!",
        duration: 6000,
      });
    }
    prevAllCompleteRef.current = allMacrosComplete;
  }, [allMacrosComplete]);
  // Subscription tier for contextual upgrade cardd
  const { tier, isFree, isPro, isProMax } = usePlan();

  // Recommendations: recipes personalized by meal time and user goal
  const userGoal = profileData.data?.profile?.mainGoal;
  const recommendedRecipes = trpc.recipes.list.useQuery(
    { limit: 5, isPublic: true, isSeeded: true },
    { enabled: true }
  );
  // Suggested menus from library
  const suggestedMenus = trpc.menus.library.useQuery({ limit: 4 });

  // Calculate profile completion percentage
  const profileCompletion = (() => {
    if (!profileData.data) return 0;
    const { profile, allergies, dietRestrictions } = profileData.data;
    // Only check the core fields that the onboarding wizard fills in
    const checks = [
      !!profile?.age,
      !!profile?.height,
      !!profile?.weight,
      !!profile?.gender,
      !!profile?.mainGoal,
      !!profile?.activityLevel,
      (allergies?.length ?? 0) > 0 || (dietRestrictions?.length ?? 0) > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  })();
  // Hide the card if onboarding is done OR profile is >= 85% complete
  const onboardingDone = profileData.data?.user?.onboardingCompleted === true;
  const showProfileCard = !onboardingDone && profileCompletion < 85 && !profileData.isLoading;

  return (
    <div style={{ padding: "16px", paddingBottom: "8px" }}>

      {/* Greeting Row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, color: "white", flexShrink: 0, boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}>
          {userInitial}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>
            {t(`dashboard.${getGreetingKey()}`)}, {firstName}! 👋
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>
            {getDay(i18n.language).charAt(0).toUpperCase() + getDay(i18n.language).slice(1)}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#F97316", fontWeight: 600 }}>
            🎯 ¡Sigue así, estás en racha!
          </p>
        </div>
      </div>

      {/* ===== PRIMEROS PASOS ===== */}
      {!stepsHidden && (
        <div style={{ marginBottom: "20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🚀</div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>{t("dashboard.quickAccess")}</h2>            </div>
            <button
              onClick={() => { setStepsHidden(true); try { localStorage.setItem("bm_steps_hidden", "true"); } catch {} }}
              style={{ background: "none", border: "none", fontSize: "18px", color: "#9ca3af", cursor: "pointer", padding: "4px", lineHeight: 1 }}
              title="Ocultar"
            >×</button>
          </div>

          {/* Cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              {
                step: "1",
                emoji: "👤",
                title: "Configura tu perfil",
                desc: "Dinos tus objetivos, alergias y preferencias para recibir recomendaciones personalizadas.",
                cta: "Ir al perfil",
                to: "/app/profile",
                color: "linear-gradient(135deg, #6366F1, #818CF8)",
                bg: "#EEF2FF",
                border: "#C7D2FE",
                textColor: "#3730a3",
              },
              {
                step: "2",
                emoji: "🍽️",
                title: "Explora recetas",
                desc: "Más de 1.500 recetas saludables filtradas por calorías, tiempo y tipo de dieta.",
                cta: "Ver recetas",
                to: "/app/recipes",
                color: "linear-gradient(135deg, #F97316, #FB923C)",
                bg: "#FFF7ED",
                border: "#FED7AA",
                textColor: "#9a3412",
              },
              {
                step: "3",
                emoji: "📅",
                title: "Crea tu menú semanal",
                desc: "Planifica tus comidas de la semana con un solo clic y genera la lista de la compra automáticamente.",
                cta: "Crear menú",
                to: "/app/menus",
                color: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                bg: "#F5F3FF",
                border: "#DDD6FE",
                textColor: "#4c1d95",
              },
              {
                step: "4",
                emoji: "🛒",
                title: "Compra en tu súper",
                desc: "Compara precios en Mercadona, Lidl, Carrefour y Alcampo. Exporta tu lista con imágenes y precios.",
                cta: "Ver supermercados",
                to: "/app/supermercados",
                color: "linear-gradient(135deg, #10B981, #059669)",
                bg: "#ECFDF5",
                border: "#A7F3D0",
                textColor: "#065f46",
              },
              {
                step: "5",
                emoji: "📊",
                title: "Registra lo que comes",
                desc: "Lleva un diario nutricional diario y visualiza tus calorías, proteínas, carbos y grasas en tiempo real.",
                cta: "Abrir diario",
                to: "/app/meal-log",
                color: "linear-gradient(135deg, #EF4444, #F97316)",
                bg: "#FFF1F2",
                border: "#FECDD3",
                textColor: "#9f1239",
              },
              {
                step: "6",
                emoji: "📦",
                title: "Gestiona tu despensa",
                desc: "Marca los ingredientes que ya tienes en casa para no comprar lo que no necesitas.",
                cta: "Ver inventario",
                to: "/app/inventory",
                color: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                bg: "#FFFBEB",
                border: "#FDE68A",
                textColor: "#78350f",
              },
            ].map((item) => (
              <Link key={item.step} href={item.to}>
                <div
                  className="step-card"
                  style={{ position: "relative", background: item.bg, border: `1.5px solid ${item.border}`, borderRadius: "18px", padding: "14px", cursor: "pointer", height: "100%", boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                >
                  {/* Step badge + emoji */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div
                      className="step-icon"
                      style={{ width: "28px", height: "28px", borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                    >
                      {item.emoji}
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: item.textColor, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.7 }}>Paso {item.step}</span>
                  </div>
                  {/* Title */}
                  <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 800, color: item.textColor, lineHeight: 1.3 }}>{item.title}</p>
                  {/* Description */}
                  <p style={{ margin: "0 0 10px", fontSize: "11px", color: item.textColor, opacity: 0.75, lineHeight: 1.5 }}>{item.desc}</p>
                  {/* CTA */}
                  <div
                    className="step-cta"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: item.color, borderRadius: "8px", padding: "4px 10px" }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "white" }}>{item.cta} →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profile Completion Card */}
      {showProfileCard && (
        <Link href="/app/profile">
          <div style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)", border: "2px solid #C7D2FE", borderRadius: "20px", padding: "16px", marginBottom: "16px", cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,0.14)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #818CF8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>👤</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#3730a3" }}>Completa tu perfil</p>
                <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#4338ca", fontWeight: 500 }}>Para darte las mejores recomendaciones personalizadas</p>
              </div>
              <span style={{ fontSize: "20px", fontWeight: 900, color: "#6366F1" }}>{profileCompletion}%</span>
            </div>
            {/* Progress bar */}
            <div style={{ background: "#C7D2FE", borderRadius: "999px", height: "8px", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(90deg, #6366F1, #818CF8)", borderRadius: "999px", height: "100%", width: `${profileCompletion}%`, transition: "width 0.6s ease" }} />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#6366F1", fontWeight: 600, textAlign: "right" }}>Toca para completar →</p>
          </div>
        </Link>
      )}

      {/* Calorie Ring Card — clickable, navigates to /meal-log */}
      <Link href="/app/meal-log">
        <div style={{ background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", borderRadius: "28px", padding: "22px", marginBottom: "16px", boxShadow: "0 12px 40px rgba(0,0,0,0.30)", position: "relative", overflow: "hidden", cursor: "pointer" }}>
          {/* Decorative blobs */}
          <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "-40px", left: "-20px", width: "140px", height: "140px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)" }} />

          {/* Top row: label + meta button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(249,115,22,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "14px" }}>🔥</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.02em" }}>CALORÍAS HOY</span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGoalEdit(!showGoalEdit); }}
              style={{ background: "rgba(249,115,22,0.20)", border: "1px solid rgba(249,115,22,0.35)", borderRadius: "10px", padding: "4px 10px", fontSize: "14px", color: "#FB923C", cursor: "pointer", fontWeight: 700 }}
            >
              Meta: {goalCalories} kcal
            </button>
          </div>

          {showGoalEdit && (
            <div style={{ marginBottom: "14px", display: "flex", gap: "6px", position: "relative" }} onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                defaultValue={goalCalories}
                onBlur={(e) => { setGoalCaloriesOverride(Number(e.target.value)); setShowGoalEdit(false); }}
                style={{ flex: 1, padding: "8px 12px", borderRadius: "12px", border: "1px solid rgba(249,115,22,0.4)", fontSize: "14px", background: "rgba(255,255,255,0.1)", color: "white", outline: "none" }}
              />
            </div>
          )}

          {/* Main content: big ring + numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative" }}>
            {/* Large SVG ring */}
            <div style={{ position: "relative", width: "110px", height: "110px", flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                {/* Background track */}
                <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
                {/* Colored arc: green if on track, orange if over */}
                <circle cx="55" cy="55" r="46" fill="none"
                  stroke={progress >= 100 ? "#EF4444" : progress >= 80 ? "#F97316" : "#22C55E"}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${2 * Math.PI * 46 * (1 - Math.min(progress, 100) / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.4s" }}
                />
                {/* Glow dot at tip */}
                <circle
                  cx={55 + 46 * Math.cos((Math.min(progress, 100) / 100 * 360 - 90) * Math.PI / 180)}
                  cy={55 + 46 * Math.sin((Math.min(progress, 100) / 100 * 360 - 90) * Math.PI / 180)}
                  r="5" fill={progress >= 100 ? "#EF4444" : progress >= 80 ? "#F97316" : "#22C55E"}
                  style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                <span style={{ fontSize: "22px", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.04em" }}>{consumed}</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.05em" }}>kcal</span>
                <span style={{ fontSize: "9px", color: progress >= 100 ? "#EF4444" : "#22C55E", fontWeight: 700, marginTop: "1px" }}>
                  {progress >= 100 ? "¡Límite!" : `${Math.round(progress)}%`}
                </span>
              </div>
            </div>

            {/* Right column: remaining + macros */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Restantes</p>
              <p style={{ margin: "0 0 16px", fontSize: "32px", fontWeight: 900, color: "white", letterSpacing: "-0.05em", lineHeight: 1 }}>
                {remaining}<span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: "4px" }}>kcal</span>
              </p>

              {/* Macro bars */}
              {[
                { label: "Proteínas", value: Math.round(protein), max: Math.round((goalCalories * 0.30) / 4), color: "#818CF8", emoji: "💪" },
                { label: "Carbos", value: Math.round(carbs), max: Math.round((goalCalories * 0.45) / 4), color: "#FBBF24", emoji: "⚡" },
                { label: "Grasas", value: Math.round(fat), max: Math.round((goalCalories * 0.25) / 9), color: "#34D399", emoji: "🥑" },
              ].map((m) => {
                const pct = Math.min(100, m.max > 0 ? (m.value / m.max) * 100 : 0);
                return (
                  <div key={m.label} style={{ marginBottom: "7px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{m.emoji} {m.label}</span>
                      <span style={{ fontSize: "13px", color: m.color, fontWeight: 800 }}>{m.value}g</span>
                    </div>
                    <div style={{ height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: "999px", background: m.color, width: `${pct}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)", boxShadow: `0 0 6px ${m.color}80` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>📝</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Toca para registrar comidas</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(249,115,22,0.20)", borderRadius: "10px", padding: "5px 10px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#FB923C" }}>Abrir diario</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Streak Widget */}
      {(streakData.data?.currentStreak ?? 0) > 0 && (
        <div style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", borderRadius: "20px", padding: "18px 20px", marginBottom: "16px", boxShadow: "0 8px 24px rgba(99,102,241,0.35)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>🔥</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Racha actual</p>
              <p style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>{streakData.data?.currentStreak ?? 0} días</p>
              {(streakData.data?.longestStreak ?? 0) > (streakData.data?.currentStreak ?? 0) && (
                <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Récord: {streakData.data?.longestStreak} días 🏆</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's Menu */}
      {todayMenuItems.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Menú de hoy</h2>
            <Link href="/app/menus"><span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316" }}>Ver semana →</span></Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {todayMenuItems.slice(0, 3).map((item: any, i: number) => (
              <div key={i} style={{ background: "white", borderRadius: "16px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                  {item.mealType === "breakfast" ? "🌅" : item.mealType === "lunch" ? "☀️" : item.mealType === "dinner" ? "🌙" : "🍎"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>{item.recipe?.name || item.customMealName || "Comida"}</p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>{item.mealType === "breakfast" ? "Desayuno" : item.mealType === "lunch" ? "Comida" : item.mealType === "dinner" ? "Cena" : "Snack"}</p>
                </div>
                <Link href={`/app/meal-log`}>
                  <button onClick={() => toast.success("Añadido al diario")} style={{ background: "#F97316", border: "none", borderRadius: "10px", padding: "6px 12px", fontSize: "14px", fontWeight: 700, color: "white", cursor: "pointer" }}>
                    + Registrar
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Menu Banner - shows active menu if exists */}
      <Link href={activeMenu ? "/app/active-menu" : "/app/menu-library"}>
        <div style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(249,115,22,0.35)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-10px", right: "-10px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ flex: 1, position: "relative" }}>
            {activeMenu ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Menú en curso</span>
                </div>
                <p style={{ margin: "0 0 4px", fontSize: "17px", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>{activeMenu.name}</p>
                {(() => {
                  const total = activeMenu.dayParts?.length ?? 0;
                  const done = activeMenu.dayParts?.filter((dp: any) => dp.completed).length ?? 0;
                  return total > 0 ? (
                    <p style={{ margin: "0 0 10px", fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>
                      {done}/{total} comidas confirmadas esta semana
                    </p>
                  ) : (
                    <p style={{ margin: "0 0 10px", fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>
                      Toca para ver y confirmar tus comidas
                    </p>
                  );
                })()}
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "20px" }}>🍽️</span>
                  <p style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>Menú semanal personalizado</p>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>Basado en tus objetivos</p>
              </>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "6px 14px", backdropFilter: "blur(4px)" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{activeMenu ? "Ver menú →" : "Elegir menú →"}</span>
            </div>
          </div>
          <div style={{ width: "80px", height: "80px", borderRadius: "16px", overflow: "hidden", flexShrink: 0 }}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu_semanal_banner-bJvcZL6L7JygtVy2QeuafW.webp" alt="Menú semanal" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </Link>

      {/* 4 Quick Access Cards: Lista compra, Menús BuddyExperts, BuddyIA, Biblioteca Menús */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {[
          { href: "/app/shopping-lists", emoji: "🛒", label: t("dashboard.shoppingList") },
          { href: "/app/buddy-experts", emoji: "🧑‍🍳", label: t("dashboard.buddyExpertsMenu") },
          { href: "/app/notifications", emoji: "🔔", label: t("dashboard.reminders") },
          { href: "/app/achievements", emoji: "🏆", label: t("dashboard.achievements") },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div style={{ background: "white", borderRadius: "18px", padding: "18px 10px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", cursor: "pointer", transition: "transform 0.2s", border: "none", minHeight: "110px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <div style={{ fontSize: "30px" }}>{item.emoji}</div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3 }}>{item.label}</p>
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
                <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>{QUICK_ACCESS[0].label}</span>
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
                  <span style={{ fontSize: "14px" }}>{item.emoji}</span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "white" }}>{item.label}</span>
                </div>
                <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.75)", fontWeight: 500, lineHeight: 1.3 }}>{item.subtitle}</p>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{QUICK_ACCESS[4].label}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{QUICK_ACCESS[4].subtitle}</p>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", borderRadius: "10px", padding: "4px 10px", backdropFilter: "blur(8px)" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "white" }}>✨ IA</span>
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
                <span style={{ fontSize: "13px", fontWeight: 800, color: "white" }}>{QUICK_ACCESS[3].emoji}</span>
              </div>
              <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "6px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "white" }}>{QUICK_ACCESS[3].label}</p>
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
                  <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>{QUICK_ACCESS[5].subtitle}</p>
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
        <Link href="/app/inventory">
          <div style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", borderRadius: "18px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", border: "1px solid rgba(245,158,11,0.2)" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#92400E" }}>
                Productos próximos a caducar en tu inventario
              </p>
              <p style={{ margin: 0, fontSize: "14px", color: "#B45309" }}>Toca para ver el inventario →</p>
            </div>
          </div>
        </Link>
      )}

      {/* Recommendations Section */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
            ✨ Recomendaciones para ti
          </h2>
          <Link href="/app/recipes"><span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316" }}>Ver todas →</span></Link>
        </div>
        {recommendedRecipes.isLoading ? (
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: "150px", height: "130px", borderRadius: "18px", background: "#f3f4f6", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : recommendedRecipes.data && recommendedRecipes.data.recipes.length > 0 ? (
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
            {recommendedRecipes.data.recipes.map((recipe: any, i: number) => (
              <Link key={recipe.id} href={`/app/recipes/${recipe.id}`}>
                <div style={{ width: "150px", flexShrink: 0, borderRadius: "18px", overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                  <div style={{ height: "110px", position: "relative", background: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.70) 100%), url(${recipe.imageUrl || FOOD_IMAGES[i % FOOD_IMAGES.length]}) center/cover` }}>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "white", lineHeight: 1.25, textShadow: "0 1px 4px rgba(0,0,0,0.7)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{recipe.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>🔥 {recipe.caloriesPerServing ? `${recipe.caloriesPerServing} kcal` : "—"}</p>
                    </div>
                  </div>
                  <div style={{ background: "white", padding: "6px 10px" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af", fontWeight: 600 }}>
                      {recipe.mealTime === "desayuno" ? "☀️ Desayuno" :
                       recipe.mealTime === "comida" ? "🍽️ Comida" :
                       recipe.mealTime === "cena" ? "🌙 Cena" :
                       recipe.mealTime === "merienda" ? "🍎 Merienda" :
                       recipe.mealTime === "media_manana" ? "🥐 Media mañana" : "🍴 Cualquiera"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Link href="/app/profile">
            <div style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)", borderRadius: "18px", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)", cursor: "pointer" }}>
              <p style={{ margin: "0 0 6px", fontSize: "28px" }}>🍽️</p>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>Personaliza tus recomendaciones</p>
              <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#9ca3af" }}>Completa tu perfil para recibir recetas adaptadas a tus objetivos y preferencias</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#F97316", borderRadius: "12px", padding: "8px 16px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Completar perfil →</span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Suggested Menus Section */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>📅 Menús para ti</h2>
          <Link href="/app/menu-library"><span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316" }}>Ver todos →</span></Link>
        </div>
        {suggestedMenus.isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ height: "120px", borderRadius: "20px", background: "#f3f4f6", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : suggestedMenus.data && suggestedMenus.data.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {suggestedMenus.data.slice(0, 2).map((menu: any) => {
              const goalGradients: Record<string, string> = {
                perdida_peso: "linear-gradient(145deg, #16A34A 0%, #22C55E 100%)",
                ganancia_muscular: "linear-gradient(145deg, #1D4ED8 0%, #3B82F6 100%)",
                tonificacion: "linear-gradient(145deg, #EA580C 0%, #F97316 100%)",
                perdida_grasa: "linear-gradient(145deg, #B91C1C 0%, #EF4444 100%)",
                mantenimiento: "linear-gradient(145deg, #6D28D9 0%, #8B5CF6 100%)",
                bienestar: "linear-gradient(145deg, #059669 0%, #10B981 100%)",
                vegano: "linear-gradient(145deg, #4D7C0F 0%, #84CC16 100%)",
              };
              const goalEmojis: Record<string, string> = {
                perdida_peso: "⚖️", ganancia_muscular: "💪", tonificacion: "🏋️",
                perdida_grasa: "🔥", mantenimiento: "🎯", bienestar: "🌿", vegano: "🥦",
              };
              const goalLabels: Record<string, string> = {
                perdida_peso: "Pérdida de peso", ganancia_muscular: "Ganancia muscular",
                tonificacion: "Tonificación", perdida_grasa: "Pérdida de grasa",
                mantenimiento: "Mantenimiento", bienestar: "Bienestar", vegano: "Vegano",
              };
              const bg = goalGradients[menu.goal] || "linear-gradient(145deg, #EA580C 0%, #F97316 100%)";
              const emoji = goalEmojis[menu.goal] || "📅";
              const label = goalLabels[menu.goal] || menu.goal;
              return (
                <Link key={menu.id} href="/app/menu-library">
                  <div style={{ background: bg, borderRadius: "20px", padding: "16px", height: "120px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 6px 20px rgba(0,0,0,0.15)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", bottom: "-12px", right: "-12px", fontSize: "52px", opacity: 0.18, lineHeight: 1 }}>{emoji}</div>
                    <span style={{ fontSize: "26px", lineHeight: 1 }}>{emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "white", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{menu.name}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{menu.dailyCalories ?? "—"} kcal/día</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Link href="/app/menu-library">
            <div style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)", borderRadius: "20px", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", cursor: "pointer" }}>
              <p style={{ margin: "0 0 6px", fontSize: "28px" }}>📅</p>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>Explora la biblioteca de menús</p>
              <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#9ca3af" }}>50+ menús semanales por objetivo</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#22C55E", borderRadius: "12px", padding: "8px 16px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>Ver menús →</span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Recipe of the Day Carousel */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>{t("dashboard.recipeOfDay")}</h2>
          <Link href="/app/recipes"><span style={{ fontSize: "13px", fontWeight: 600, color: "#F97316" }}>{t("common.seeMore")} →</span></Link>
        </div>
        <div style={{ position: "relative", borderRadius: "22px", overflow: "hidden", height: "180px", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
          {RECIPE_OF_DAY.map((recipe, idx) => (
            <Link key={idx} href={`/app/recipes/${recipe.id}`} style={{ display: "block", position: "absolute", inset: 0, pointerEvents: idx === recipeIdx ? "auto" : "none" }}>
            <div
              style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 100%), url(${recipe.img}) center/cover`,
                opacity: idx === recipeIdx ? 1 : 0,
                transition: "opacity 0.7s ease",
                display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "16px",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "inline-block", background: "#F97316", color: "white", fontSize: "13px", fontWeight: 800, borderRadius: "8px", padding: "3px 8px", marginBottom: "6px", width: "fit-content" }}>{recipe.tag}</span>
              <p style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "white", letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>{recipe.name}</p>
              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>🔥 {recipe.kcal} kcal</span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>⏱ {recipe.time}</span>
              </div>
            </div>
            </Link>
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

      {/* Did You Know Section */}
      <DidYouKnow />

      {/* Community Section: BuddyExperts, BuddyMakers, BuddyIA */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em" }}>Comunidad BuddyMarket</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          {[
            { label: "BuddyExperts", emoji: "👨‍⚕️", to: "/app/buddy-experts", desc: "Nutricionistas y deportistas", color: "linear-gradient(135deg, #F97316, #EA580C)" },
            { label: "BuddyMakers", emoji: "👨‍🍳", to: "/app/buddy-makers", desc: "Creadores de recetas", color: "linear-gradient(135deg, #EC4899, #F97316)" },
            { label: "BuddyIA", emoji: "🤖", to: "/app/buddy-ia", desc: "Asistente nutricional IA", color: "linear-gradient(135deg, #8B5CF6, #6366F1)" },
          ].map((card) => (
            <Link key={card.label} href={card.to}>
              <div style={{ borderRadius: "18px", overflow: "hidden", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <div style={{ background: card.color, padding: "14px 10px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontSize: "24px" }}>{card.emoji}</span>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 900, color: "white", textAlign: "center", letterSpacing: "-0.01em", lineHeight: 1.2 }}>{card.label}</p>
                  <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.3 }}>{card.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* BuddyShop Card */}
      <Link href="/app/buddy-shop">
        <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.20)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-15px", right: "-15px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(249,115,22,0.15)" }} />
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(249,115,22,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🛖</div>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "white" }}>BuddyShop</p>
              <span style={{ background: "#F97316", color: "white", fontSize: "9px", fontWeight: 800, borderRadius: "6px", padding: "2px 6px" }}>buddyshop.app</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Utensilios y productos de cocina premium</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </Link>

      {/* Upgrade Card - contextual by tier */}
      {isFree && (
        <Link href="/app/subscription">
          <div style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(249,115,22,0.35)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>👑</div>
            <div style={{ flex: 1, position: "relative" }}>
              <p style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 900, color: "white" }}>Hazte Pro o Pro Max</p>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>IA ilimitada · BuddyScan · Expertos</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </Link>
      )}
      {isPro && (
        <Link href="/app/subscription?plan=premium">
          <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #a855f7 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(124,58,237,0.35)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
            <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>✨</div>
            <div style={{ flex: 1, position: "relative" }}>
              <p style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 900, color: "white" }}>Mejora a Pro Max</p>
              <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>IA ilimitada · BuddyExperts · Múltiples perfiles</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </Link>
      )}
      {/* Pro Max users: no upgrade card shown */}

      {/* BuddyCoach Card */}
      <a href="https://www.buddycoach.io" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.22)", cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-15px", right: "-15px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(99,102,241,0.18)" }} />
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "rgba(99,102,241,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🧑‍🏫</div>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "white" }}>BuddyCoach</p>
              <span style={{ background: "#6366F1", color: "white", fontSize: "9px", fontWeight: 800, borderRadius: "6px", padding: "2px 6px" }}>IA Nutricional</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Tu entrenador nutricional personal con IA</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </a>
      {/* Disclaimer */}
      <p style={{ fontSize: "13px", color: "#d1d5db", textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
        BuddyMarket no constituye asesoramiento médico o nutricional profesional. Consulta a un profesional.
      </p>
    </div>
  );
}
