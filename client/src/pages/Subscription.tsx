import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SparklesIcon, BoltIcon, StarIcon, CheckIcon, XMarkIcon, LockClosedIcon, FireIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { usePlan } from "@/hooks/usePlan";
import { usePayment, type PaymentPlan } from "@/hooks/usePayment";


// ─── Feature comparison table ─────────────────────────────────────────────────
type CellVal = boolean | string;

const FEATURES: Array<{
  category: string;
  emoji: string;
  rows: Array<{ label: string; free: CellVal; pro: CellVal; promax: CellVal; hot?: boolean }>;
}> = [
  {
    category: "Recetas",
    emoji: "📖",
    rows: [
      { label: "Ver recetas de la comunidad", free: true, pro: true, promax: true },
      { label: "Recetas guardadas", free: "Solo 5", pro: "Ilimitadas", promax: "Ilimitadas" },
      { label: "Crear tus propias recetas", free: false, pro: true, promax: true, hot: true },
      { label: "Cálculo nutricional automático con IA", free: false, pro: true, promax: true },
      { label: "Compartir recetas con la comunidad", free: false, pro: true, promax: true },
    ],
  },
  {
    category: "Menús con IA",
    emoji: "🤖",
    rows: [
      { label: "Menús generados al mes", free: "Solo 1", pro: "Ilimitados", promax: "Ilimitados", hot: true },
      { label: "Generación de menús con IA", free: false, pro: true, promax: true, hot: true },
      { label: "24 menús especializados (diabetes, embarazo...)", free: false, pro: true, promax: true, hot: true },
      { label: "Menús para eventos (cumpleaños, cenas...)", free: "1 de prueba", pro: "Ilimitados", promax: "Ilimitados" },
    ],
  },
  {
    category: "Listas de la Compra",
    emoji: "🛒",
    rows: [
      { label: "Listas de la compra al mes", free: "Solo 2", pro: "Ilimitadas", promax: "Ilimitadas", hot: true },
      { label: "Generar lista desde menú IA", free: false, pro: true, promax: true },
      { label: "Conectar supermercado online", free: false, pro: true, promax: true },
    ],
  },
  {
    category: "Diario Nutricional",
    emoji: "📊",
    rows: [
      { label: "Registro de comidas diario", free: false, pro: true, promax: true, hot: true },
      { label: "Seguimiento de macros y calorías", free: false, pro: true, promax: true },
      { label: "Historial nutricional", free: false, pro: "6 meses", promax: "Ilimitado" },
    ],
  },
  {
    category: "Inventario",
    emoji: "🏠",
    rows: [
      { label: "Productos en inventario", free: "Solo 10", pro: "Ilimitados", promax: "Ilimitados" },
      { label: "Alertas de caducidad", free: false, pro: true, promax: true },
    ],
  },
  {
    category: "BuddyIA (Asistente)",
    emoji: "💬",
    rows: [
      { label: "Mensajes con BuddyIA al día", free: "Bloqueado", pro: "50 mensajes", promax: "Ilimitados", hot: true },
      { label: "Adaptar recetas a tus alergias con IA", free: false, pro: true, promax: true },
      { label: "Consejos nutricionales personalizados", free: false, pro: true, promax: true },
    ],
  },
  {
    category: "Métricas de Salud",
    emoji: "❤️",
    rows: [
      { label: "Seguimiento de peso y medidas", free: false, pro: true, promax: true },
      { label: "Historial de métricas", free: false, pro: "6 meses", promax: "Ilimitado" },
    ],
  },
  {
    category: "Comunidad",
    emoji: "👥",
    rows: [
      { label: "Ver BuddyMakers y BuddyExperts", free: true, pro: true, promax: true },
      { label: "Consultas con nutricionistas (BuddyExperts)", free: true, pro: true, promax: true },
      { label: "Solicitar ser BuddyMaker/Expert", free: true, pro: true, promax: true },
    ],
  },
  {
    category: "Exclusivo Pro Max",
    emoji: "👑",
    rows: [
      { label: "BuddyIA ilimitado (sin límite diario)", free: false, pro: false, promax: true, hot: true },
      { label: "Modo Familia — hogar compartido", free: false, pro: false, promax: true, hot: true },
      { label: "Múltiples perfiles familiares", free: false, pro: false, promax: true },
      { label: "Exportar informes PDF", free: false, pro: false, promax: true },
      { label: "Soporte prioritario 24/7", free: false, pro: false, promax: true },
    ],
  },
];

// ─── Usage limit bar ──────────────────────────────────────────────────────────
function UsageBar({ used, max, label, icon, critical }: { used: number; max: number; label: string; icon: string; critical?: boolean }) {
  const pct = Math.min((used / max) * 100, 100);
  const isAlmostFull = pct >= 75;
  const isFull = pct >= 100;
  return (
    <div className={`rounded-2xl p-3 ${isFull ? "bg-red-50 border border-red-200" : isAlmostFull ? "bg-orange-50 border border-orange-200" : "bg-gray-50 border border-gray-100"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <span className="text-xs font-semibold text-gray-700">{label}</span>
        </div>
        <span className={`text-xs font-extrabold ${isFull ? "text-red-600" : isAlmostFull ? "text-orange-600" : "text-gray-500"}`}>
          {used}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFull ? "bg-red-500" : isAlmostFull ? "bg-orange-500" : "bg-gray-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isFull && (
        <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ Límite alcanzado este mes</p>
      )}
    </div>
  );
}

// ─── Locked feature teaser ────────────────────────────────────────────────────
function LockedFeature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-50/50" />
      <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
        <span className="text-xl filter grayscale opacity-50">{icon}</span>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <LockClosedIcon className="h-2.5 w-2.5 text-white" />
        </div>
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 blur-[0.5px]">{title}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 blur-[0.5px] line-clamp-1">{description}</p>
      </div>
      <div className="relative flex-shrink-0">
        <span className="text-[10px] font-extrabold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">PRO</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Subscription() {
  const { data: subscription, isLoading } = trpc.subscriptions.getStatus.useQuery();
  const { data: usage } = trpc.subscriptions.getMonthlyUsage.useQuery();
  const { tier, planDisplay, isFree, isPro, isProMax } = usePlan();
  const [showFullTable, setShowFullTable] = useState(false);
  const urlPlan = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("plan")
    : null;
  const { purchase, isPending: checkoutLoading } = usePayment();
  const currentPlan = (subscription as any)?.plan ?? null;
  const isActive = (subscription as any)?.status === "active";

  function isCurrent(planKey: string) {
    if (planKey === "free") return !isActive || !currentPlan;
    if (planKey === "basic") return isActive && (currentPlan === "basic");
    if (planKey === "premium") return isActive && (currentPlan === "premium" || currentPlan === "pro_max");
    return false;
  }

  function handleSubscribe(planKey: string) {
    if (planKey === "free") return;
    const planMap: Record<string, PaymentPlan> = { basic: "basic", premium: "premium", pro_max: "pro_max" };
    purchase(planMap[planKey] ?? "basic", window.location.origin);
  }

  return (
    <div className="vively-page">

      {/* ── Hero ── */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <SparklesIcon className="h-3.5 w-3.5" />
          Desbloquea todo BuddyMarket
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
          Come mejor.<br />
          <span className="text-[#F97316]">Sin límites.</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">Sin permanencia · Cancela cuando quieras</p>
      </div>

      {/* ── Current plan badge ── */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F97316]/10 p-4">
        <CheckCircleIcon className="h-5 w-5 shrink-0 text-[#F97316]" />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">
            Plan actual:{" "}
            <span style={{ color: planDisplay?.color || "#6B7280" }}>
              {planDisplay?.badge || "Free"}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            {isActive
              ? "Tu suscripción está activa y al día"
              : "Plan gratuito — mejora para desbloquear más funciones"}
          </p>
        </div>
        {isActive && (
          <button
            onClick={() => toast.info("Para cancelar, contacta con soporte en support@buddymarket.app")}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* ── 3 KEY DIFFERENCES BANNER (Free only) ── */}
      {isFree && (
        <div className="mb-5 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div className="p-5">
            <div className="text-center mb-4">
              <span className="text-xs font-extrabold tracking-widest text-orange-400 uppercase">Las 3 razones por las que Pro vale la pena</span>
            </div>
            <div className="space-y-3">
              {/* Diff 1: Menús IA */}
              <div className="flex items-start gap-3 rounded-2xl p-3" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(249,115,22,0.2)" }}>🤖</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-extrabold text-white">Menús IA ilimitados</span>
                    <span className="text-[10px] font-extrabold bg-orange-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                  </div>
                  <p className="text-xs text-gray-400">Genera menús semanales personalizados en segundos. Ahorra horas de planificación cada semana.</p>
                </div>
              </div>
              {/* Diff 2: BuddyIA */}
              <div className="flex items-start gap-3 rounded-2xl p-3" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(139,92,246,0.2)" }}>💬</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-extrabold text-white">BuddyIA — Tu nutricionista 24/7</span>
                    <span className="text-[10px] font-extrabold bg-purple-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                  </div>
                  <p className="text-xs text-gray-400">Pregunta sobre nutrición, adapta recetas a tus alergias y recibe consejos personalizados al instante.</p>
                </div>
              </div>
              {/* Diff 3: Crear recetas */}
              <div className="flex items-start gap-3 rounded-2xl p-3" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(16,185,129,0.2)" }}>🍳</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-extrabold text-white">Crea y comparte tus recetas</span>
                    <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                  </div>
                  <p className="text-xs text-gray-400">Publica tus recetas con foto generada por IA. Construye tu perfil de BuddyMaker y gana seguidores.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleSubscribe("basic")}
              className="mt-4 w-full py-4 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 8px 24px rgba(249,115,22,0.4)" }}
            >
              <SparklesIcon className="h-4 w-4" />
              Desbloquear todo por solo 9,99€/mes
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <p className="text-center text-[10px] text-gray-500 mt-2">Sin permanencia · Cancela cuando quieras · Pago seguro</p>
          </div>
        </div>
      )}

      {/* ── FREE USER: Usage meters + locked features ── */}
      {isFree && usage && (
        <div className="mb-5 space-y-3">
          {/* Usage meters */}
          <div className="rounded-3xl border-2 border-red-100 bg-red-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FireIcon className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-extrabold text-red-800">Tu uso este mes</h3>
              <span className="ml-auto text-[10px] text-red-500 font-bold bg-red-100 px-2 py-0.5 rounded-full">PLAN FREE</span>
            </div>
            <div className="space-y-2">
              <UsageBar
                used={usage.shoppingListsThisMonth}
                max={2}
                label="Listas de la compra"
                icon="🛒"
              />
              <UsageBar
                used={usage.menusThisMonth}
                max={1}
                label="Menús al mes"
                icon="📅"
              />
              <UsageBar
                used={usage.savedRecipes}
                max={5}
                label="Recetas guardadas"
                icon="📖"
              />
              <UsageBar
                used={usage.inventoryItems}
                max={10}
                label="Productos en inventario"
                icon="🏠"
              />
            </div>
          </div>

          {/* Locked features teaser */}
          <div className="rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <LockClosedIcon className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-extrabold text-orange-800">Lo que te estás perdiendo</h3>
            </div>
            <div className="space-y-2">
              <LockedFeature
                icon="🤖"
                title="Menús con IA personalizados"
                description="Genera menús semanales adaptados a tus objetivos, alergias y preferencias"
              />
              <LockedFeature
                icon="💬"
                title="BuddyIA — Tu asistente nutricional"
                description="Pregunta lo que quieras sobre nutrición, recetas y tu salud"
              />
              <LockedFeature
                icon="📊"
                title="Diario nutricional completo"
                description="Registra tus comidas y sigue tus macros y calorías cada día"
              />
              <LockedFeature
                icon="🏥"
                title="24 menús especializados"
                description="Diabetes, embarazo, celiaquía, deportistas, hipertensión y mucho más"
              />
              <LockedFeature
                icon="🍳"
                title="Crea tus propias recetas"
                description="Añade tus recetas favoritas y compártelas con la comunidad"
              />
              <LockedFeature
                icon="❤️"
                title="Seguimiento de métricas de salud"
                description="Controla tu peso, medidas y evolución con gráficas detalladas"
              />
            </div>
            <button
              onClick={() => handleSubscribe("basic")}
              className="mt-4 w-full py-3.5 rounded-2xl bg-[#F97316] text-white text-sm font-extrabold hover:bg-[#ea6c0a] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <SparklesIcon className="h-4 w-4" />
              Desbloquear todo por 9,99€/mes
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2">Sin permanencia · Cancela cuando quieras</p>
          </div>
        </div>
      )}

      {/* ── PRO user: upgrade to Pro Max ── */}
      {isPro && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-purple-50 border border-purple-200 p-4">
          <span className="text-xl">✨</span>
          <div>
            <p className="text-sm font-bold text-purple-800">Ya eres usuario Pro</p>
            <p className="text-xs text-purple-600">Mejora a Pro Max para desbloquear el Modo Familia 🏠, BuddyIA ilimitado, múltiples perfiles y más</p>
          </div>
        </div>
      )}
      {isProMax && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-purple-50 border border-purple-200 p-4">
          <span className="text-xl">👑</span>
          <div>
            <p className="text-sm font-bold text-purple-800">Ya tienes el plan más completo</p>
            <p className="text-xs text-purple-600">Estás en Pro Max — tienes acceso a todas las funciones sin límites</p>
          </div>
        </div>
      )}

      {/* ── Plan cards ── */}
      <div className="space-y-4 mb-6">
        {/* FREE card — shown only if not Pro/ProMax */}
        {isFree && (
          <div className="relative rounded-3xl border-2 border-gray-200 bg-white p-5 shadow-sm">
            <div className="absolute -top-3 left-4 rounded-full bg-gray-500 px-3 py-1 text-[11px] font-bold text-white">
              ACTIVO
            </div>
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-100">
                <StarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <h2 className="text-base font-extrabold text-gray-900">Free</h2>
                  <span className="text-xl font-extrabold text-gray-400">0€</span>
                  <span className="text-xs text-gray-400">/siempre</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Para echar un vistazo — muy limitado</p>
              </div>
            </div>
            <div className="mb-4 space-y-1">
              {[
                "❌ Sin menús con IA",
                "❌ Sin diario nutricional",
                "❌ Sin BuddyIA",
                "❌ Solo 5 recetas guardadas",
                "❌ Solo 2 listas de la compra/mes",
                "❌ Solo 1 menú/mes (sin IA)",
                "❌ Sin métricas de salud",
                "❌ Sin menús especializados",
              ].map((l, i) => (
                <div key={i} className="text-xs text-red-400 font-medium">{l}</div>
              ))}
            </div>
            <div className="w-full rounded-2xl bg-gray-100 py-3 text-center text-sm font-bold text-gray-400">
              Plan actual
            </div>
          </div>
        )}

        {/* PRO card */}
        {!isProMax && (
          <div
            className="relative rounded-3xl border-2 bg-white p-5 shadow-lg"
            style={{ borderColor: "#F97316" }}
          >
            {!isPro && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F97316] px-4 py-1 text-[11px] font-extrabold text-white shadow whitespace-nowrap">
                ⭐ MÁS POPULAR
              </div>
            )}
            {isPro && (
              <div className="absolute -top-3 right-4 rounded-full bg-gray-900 px-3 py-1 text-[11px] font-bold text-white">
                ACTIVO
              </div>
            )}
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F97316]/10">
                <BoltIcon className="h-5 w-5 text-[#F97316]" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <h2 className="text-base font-extrabold text-gray-900">Pro</h2>
                  <span className="text-xl font-extrabold text-[#F97316]">9,99€</span>
                  <span className="text-xs text-gray-400">/mes</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Todo lo que necesitas para comer bien</p>
              </div>
            </div>
            <div className="mb-4 space-y-1.5">
              {[
                "✅ Menús IA ilimitados",
                "✅ 24 menús especializados (diabetes, embarazo...)",
                "✅ BuddyIA asistente (50 msg/día)",
                "✅ Diario nutricional completo",
                "✅ Listas de la compra ilimitadas",
                "✅ Crear tus propias recetas",
                "✅ Métricas de salud",
                "✅ Inventario ilimitado",
              ].map((p, i) => (
                <div key={i} className="text-xs text-gray-700 font-medium">{p}</div>
              ))}
            </div>
            <button
                onClick={() => handleSubscribe("basic")}
                disabled={isPro || checkoutLoading || isLoading}
                className={`w-full rounded-2xl py-3 text-sm font-extrabold transition-all ${
                  isPro
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-[#F97316] text-white hover:bg-[#EA6C0A] shadow-md active:scale-95"
                }`}
              >
                {isPro ? "Plan actual" : checkoutLoading ? "Procesando..." : "Activar Pro →"}
              </button>
          </div>
        )}

        {/* PRO MAX card */}
        <div
          className="relative rounded-3xl border-2 bg-white p-5"
          style={{ borderColor: "#7c3aed", boxShadow: isProMax ? "0 0 0 4px rgba(124,58,237,0.1)" : "0 4px 24px rgba(124,58,237,0.12)" }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-4 py-1 text-[11px] font-extrabold text-white shadow whitespace-nowrap">
            {isProMax ? "ACTIVO" : isPro ? "👑 MEJORA RECOMENDADA" : "👑 MEJOR VALOR"}
          </div>
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-50">
              <SparklesIcon className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-base font-extrabold text-gray-900">Pro Max</h2>
                <span className="text-xl font-extrabold text-purple-600">19,99€</span>
                <span className="text-xs text-gray-400">/mes</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Para los que no quieren límites</p>
            </div>
          </div>
          <div className="mb-4 space-y-1.5">
            {[
              "✅ Todo lo de Pro",
              "✅ BuddyIA ilimitado (sin límite diario)",
              "🏠 Modo Familia — hogar compartido",
              "✅ Múltiples perfiles familiares",
              "✅ Exportar informes PDF",
              "✅ Historial nutricional ilimitado",
              "✅ Soporte prioritario 24/7",
            ].map((p, i) => (
              <div key={i} className="text-xs font-medium" style={{ color: i === 0 ? "#9ca3af" : "#374151" }}>{p}</div>
            ))}
          </div>
          {isProMax ? (
            <div className="w-full rounded-2xl bg-purple-50 py-3 text-center text-sm font-bold text-purple-500">
              Plan actual — tienes acceso completo 👑
            </div>
          ) : (
            <button
              onClick={() => handleSubscribe("premium")}
              disabled={checkoutLoading || isLoading}
              className="w-full rounded-2xl py-3 text-sm font-extrabold text-white transition-all bg-purple-600 hover:bg-purple-700 shadow-md active:scale-95"
            >
              {checkoutLoading ? "Procesando..." : isPro ? "Mejorar a Pro Max →" : "Activar Pro Max →"}
            </button>
          )}
        </div>
      </div>

      {/* ── Comparison table ── */}
      <div className="mb-4">
        <button
          onClick={() => setShowFullTable(!showFullTable)}
          className="w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
        >
          {showFullTable ? "Ocultar" : "Ver"} comparativa completa
          <span className={`transition-transform inline-block ${showFullTable ? "rotate-180" : ""}`}>▼</span>
        </button>
      </div>

      {showFullTable && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="grid grid-cols-4 bg-gray-900">
            <div className="p-3 text-xs font-bold text-gray-400">Función</div>
            {[
              { name: "Free", color: "#9ca3af" },
              { name: "Pro", color: "#F97316" },
              { name: "Pro Max", color: "#a78bfa" },
            ].map((p) => (
              <div key={p.name} className="p-3 text-center">
                <div className="text-xs font-extrabold" style={{ color: p.color }}>{p.name}</div>
              </div>
            ))}
          </div>

          {FEATURES.map((section, si) => (
            <div key={si}>
              <div className={`flex items-center gap-2 bg-gray-50 px-3 py-2 ${si > 0 ? "border-t border-gray-100" : ""}`}>
                <span>{section.emoji}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">{section.category}</span>
              </div>
              {section.rows.map((row, ri) => (
                <div key={ri} className={`grid grid-cols-4 border-t border-gray-100 ${row.hot ? "bg-orange-50/30" : ""}`}>
                  <div className="p-3 text-xs text-gray-600 flex items-start gap-1">
                    {row.hot && <span className="text-orange-400 text-[10px] mt-0.5">🔥</span>}
                    <span>{row.label}</span>
                  </div>
                  {([row.free, row.pro, row.promax] as CellVal[]).map((val, ci) => {
                    const colors = ["#9ca3af", "#F97316", "#7c3aed"];
                    const isNegative = typeof val === "string" && (val.startsWith("Solo") || val === "Bloqueado");
                    return (
                      <div key={ci} className="flex items-center justify-center p-3">
                        {val === true && <CheckIcon className="h-4 w-4" style={{ color: colors[ci] }} />}
                        {val === false && <XMarkIcon className="h-4 w-4 text-gray-200" />}
                        {typeof val === "string" && (
                          <span
                            className="text-[10px] font-bold text-center leading-tight"
                            style={{ color: isNegative ? "#ef4444" : colors[ci] }}
                          >
                            {val}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          <div className="grid grid-cols-4 border-t-2 border-gray-100 bg-gray-50 p-2 gap-2">
            <div />
            {[
              { key: "free", accent: "#6b7280" },
              { key: "basic", accent: "#F97316" },
              { key: "premium", accent: "#7c3aed" },
            ].map((p) => (
              <div key={p.key}>
                {p.key === "free" ? (
                  <div className="w-full rounded-xl py-2 text-center text-xs font-bold text-gray-400">Gratis</div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(p.key)}
                    disabled={isCurrent(p.key) || checkoutLoading}
                    className="w-full rounded-xl py-2 text-xs font-extrabold text-white transition-all"
                    style={{
                      background: isCurrent(p.key) ? "#f3f4f6" : p.accent,
                      color: isCurrent(p.key) ? "#9ca3af" : "white",
                    }}
                  >
                    {isCurrent(p.key) ? "Activo" : "Activar"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Social proof ── */}
      <div className="mb-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-4">
        <p className="text-xs font-extrabold text-orange-800 mb-2 text-center">💬 Lo que dicen nuestros usuarios Pro</p>
        <div className="space-y-2">
          {[
            { text: "\"Perdí 8kg en 3 meses siguiendo los menús IA. ¡Increíble!\"", name: "María G." },
            { text: "\"Los menús para diabéticos me han cambiado la vida\"", name: "Carlos M." },
            { text: "\"BuddyIA me resuelve todas las dudas de nutrición al instante\"", name: "Ana R." },
          ].map((r, i) => (
            <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
              <p className="text-xs text-gray-600 italic">{r.text}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">— {r.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Test mode notice ── */}
      <div className="mb-4 rounded-2xl bg-yellow-50 border border-yellow-200 p-4 text-center">
        <p className="text-xs font-semibold text-yellow-700">🧪 Modo de prueba activo</p>
        <p className="mt-1 text-xs text-yellow-600">
          Usa la tarjeta <strong>4242 4242 4242 4242</strong> para probar sin cargo real.
        </p>
      </div>

      <p className="text-center text-xs text-gray-400 pb-6">
        Los precios incluyen IVA · Cancela en cualquier momento
      </p>
    </div>
  );
}
