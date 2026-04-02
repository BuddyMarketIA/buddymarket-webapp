import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SparklesIcon, BoltIcon, StarIcon, CheckIcon, MinusIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { usePlan } from "@/hooks/usePlan";

// ─── Plan definitions (aligned with shared/plans.ts) ─────────────────────────
const PLANS = [
  {
    key: "free" as const,
    name: "Free",
    price: "0€",
    period: "/siempre",
    icon: StarIcon,
    highlight: false,
    accentColor: "#6B7280",
    borderColor: "border-gray-200",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-400",
    description: "Para empezar a explorar BuddyMarket",
    features: [
      "Perfil nutricional básico",
      "Ver recetas de la comunidad",
      "3 menús generados al mes (sin IA)",
      "Lista de la compra básica",
      "Inventario del hogar (hasta 20 productos)",
    ],
  },
  {
    key: "basic" as const,
    name: "Pro",
    price: "9,99€",
    period: "/mes",
    icon: BoltIcon,
    highlight: true,
    accentColor: "#F97316",
    borderColor: "border-[#F97316]",
    iconBg: "bg-[#F97316]/10",
    iconColor: "text-[#F97316]",
    description: "Para quienes quieren sacar el máximo partido a su nutrición",
    features: [
      "Menús semanales ilimitados con IA",
      "24 menús especializados (diabetes, embarazo, celiaquía...)",
      "BuddyIA: hasta 50 mensajes/día",
      "Diario nutricional ilimitado",
      "Inventario ilimitado + alertas de caducidad",
      "Métricas de salud (6 meses de historial)",
      "Conectar supermercado online",
    ],
  },
  {
    key: "premium" as const,
    name: "Pro Max",
    price: "19,99€",
    period: "/mes",
    icon: SparklesIcon,
    highlight: false,
    accentColor: "#7c3aed",
    borderColor: "border-purple-300",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    description: "Para profesionales de la salud y usuarios avanzados",
    features: [
      "Todo lo de Pro",
      "BuddyIA ilimitado (sin límite de mensajes)",
      "Historial de métricas ilimitado",
      "Crear y publicar tus propias recetas",
      "Acceso a BuddyExperts (nutricionistas reales)",
      "Múltiples perfiles familiares",
      "Exportar informes PDF",
      "Soporte prioritario 24/7",
    ],
  },
];

// ─── Comparison table data ────────────────────────────────────────────────────
type CellVal = boolean | string;
const COMPARISON: Array<{
  category: string;
  rows: Array<{ label: string; free: CellVal; pro: CellVal; promax: CellVal }>;
}> = [
  {
    category: "Recetas",
    rows: [
      { label: "Ver recetas de la comunidad", free: true, pro: true, promax: true },
      { label: "Recetas guardadas", free: "10", pro: "Ilimitadas", promax: "Ilimitadas" },
      { label: "Crear tus propias recetas", free: false, pro: false, promax: true },
      { label: "Publicar como BuddyMaker", free: "Con aprobación", pro: "Con aprobación", promax: "Con aprobación" },
    ],
  },
  {
    category: "Menús con IA",
    rows: [
      { label: "Menús generados al mes", free: "3", pro: "Ilimitados", promax: "Ilimitados" },
      { label: "Generación de menús con IA", free: false, pro: true, promax: true },
      { label: "24 menús especializados", free: false, pro: true, promax: true },
    ],
  },
  {
    category: "Diario Nutricional",
    rows: [
      { label: "Registro de comidas diario", free: false, pro: true, promax: true },
      { label: "Seguimiento de macros y calorías", free: false, pro: true, promax: true },
      { label: "Historial nutricional", free: false, pro: "6 meses", promax: "Ilimitado" },
    ],
  },
  {
    category: "Inventario",
    rows: [
      { label: "Inventario del hogar", free: "20 prod.", pro: "Ilimitado", promax: "Ilimitado" },
      { label: "Alertas de caducidad", free: false, pro: true, promax: true },
      { label: "Lista de la compra automática", free: true, pro: true, promax: true },
      { label: "Conectar supermercado online", free: false, pro: true, promax: true },
    ],
  },
  {
    category: "BuddyIA",
    rows: [
      { label: "Mensajes/día con BuddyIA", free: "0", pro: "50", promax: "Ilimitados" },
      { label: "Menús por cuestionario IA", free: false, pro: true, promax: true },
    ],
  },
  {
    category: "Métricas de Salud",
    rows: [
      { label: "Seguimiento de peso y medidas", free: false, pro: true, promax: true },
      { label: "Historial de métricas", free: false, pro: "6 meses", promax: "Ilimitado" },
    ],
  },
  {
    category: "Comunidad",
    rows: [
      { label: "Ver recetas de BuddyMakers", free: true, pro: true, promax: true },
      { label: "Consultas con BuddyExperts", free: false, pro: false, promax: true },
      { label: "Solicitar ser BuddyMaker", free: "Con aprobación", pro: "Con aprobación", promax: "Con aprobación" },
      { label: "Solicitar ser BuddyExpert", free: "Con aprobación", pro: "Con aprobación", promax: "Con aprobación" },
    ],
  },
  {
    category: "Exclusivo Pro Max",
    rows: [
      { label: "Exportar informes PDF", free: false, pro: false, promax: true },
      { label: "Múltiples perfiles familiares", free: false, pro: false, promax: true },
      { label: "Soporte prioritario 24/7", free: false, pro: false, promax: true },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Subscription() {
  const { data: subscription, isLoading } = trpc.subscriptions.getStatus.useQuery();
  const { tier, planDisplay } = usePlan();

  const createCheckout = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirigiendo al pago seguro...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

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
    const stripeKey = planKey === "premium" ? "premium" : "basic";
    createCheckout.mutate({ plan: stripeKey as "basic" | "premium" | "pro_max", origin: window.location.origin });
  }

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316]/10">
          <SparklesIcon className="h-7 w-7 text-[#F97316]" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Planes BuddyMarket</h1>
        <p className="mt-1 text-sm text-gray-500">Sin permanencia. Cancela cuando quieras.</p>
      </div>

      {/* Current plan badge */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[#F97316]/10 p-4">
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

      {/* Plan cards */}
      <div className="space-y-4 mb-8">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const current = isCurrent(plan.key);

          return (
            <div
              key={plan.key}
              className={`relative rounded-3xl border-2 bg-white p-5 transition-all ${plan.borderColor} ${plan.highlight ? "shadow-lg shadow-[#F97316]/10" : "shadow-sm"}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F97316] px-4 py-1 text-[13px] font-bold text-white shadow">
                  MÁS POPULAR
                </div>
              )}
              {current && (
                <div className="absolute -top-3 right-4 rounded-full bg-gray-900 px-3 py-1 text-[13px] font-bold text-white">
                  ACTIVO
                </div>
              )}

              <div className="mb-3 flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${plan.iconBg}`}>
                  <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <h2 className="text-base font-extrabold text-gray-900">{plan.name}</h2>
                    <span className="text-xl font-extrabold" style={{ color: plan.accentColor }}>{plan.price}</span>
                    <span className="text-xs text-gray-400">{plan.period}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                </div>
              </div>

              <ul className="mb-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: plan.accentColor }} />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.key === "free" ? (
                <div className="w-full rounded-2xl bg-gray-100 py-3 text-center text-sm font-bold text-gray-400">
                  {current ? "Plan actual" : "Plan básico gratuito"}
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={current || createCheckout.isPending}
                  className={`w-full rounded-2xl py-3 text-sm font-bold transition-all ${
                    current
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : plan.highlight
                      ? "bg-[#F97316] text-white hover:bg-[#EA6C0A]"
                      : "border-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                  }`}
                >
                  {current ? "Plan actual" : `Mejorar a ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Full comparison table */}
      <div className="mb-6">
        <h2 className="text-center text-lg font-extrabold text-gray-900 mb-4">Comparativa completa</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-4 bg-gray-900">
            <div className="p-3 text-xs font-bold text-gray-400">Funcionalidad</div>
            {[
              { name: "Free", color: "#9ca3af" },
              { name: "Pro", color: "#F97316" },
              { name: "Pro Max", color: "#a78bfa" },
            ].map((p) => (
              <div key={p.name} className="p-3 text-center">
                <div className="text-sm font-extrabold" style={{ color: p.color }}>{p.name}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          {COMPARISON.map((section, si) => (
            <div key={si}>
              <div className={`bg-gray-50 px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 ${si > 0 ? "border-t border-gray-100" : ""}`}>
                {section.category}
              </div>
              {section.rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-4 border-t border-gray-100">
                  <div className="p-3 text-xs text-gray-600">{row.label}</div>
                  {([row.free, row.pro, row.promax] as CellVal[]).map((val, ci) => {
                    const colors = ["#9ca3af", "#F97316", "#7c3aed"];
                    return (
                      <div key={ci} className="flex items-center justify-center p-3">
                        {val === true && (
                          <CheckIcon className="h-4 w-4 font-bold" style={{ color: colors[ci] }} />
                        )}
                        {val === false && (
                          <MinusIcon className="h-4 w-4 text-gray-200" />
                        )}
                        {typeof val === "string" && (
                          <span className="text-[11px] font-bold" style={{ color: colors[ci] }}>{val}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {/* CTA row */}
          <div className="grid grid-cols-4 border-t-2 border-gray-100 bg-gray-50">
            <div className="p-3" />
            {[
              { key: "free", name: "Free", accent: "#6b7280", cta: "Gratis" },
              { key: "basic", name: "Pro", accent: "#F97316", cta: "Mejorar" },
              { key: "premium", name: "Pro Max", accent: "#7c3aed", cta: "Mejorar" },
            ].map((p) => (
              <div key={p.key} className="p-2">
                {p.key === "free" ? (
                  <div className="w-full rounded-xl py-2 text-center text-xs font-bold text-gray-400">
                    Gratis
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(p.key)}
                    disabled={isCurrent(p.key) || createCheckout.isPending}
                    className="w-full rounded-xl py-2 text-xs font-bold transition-all"
                    style={{
                      background: isCurrent(p.key) ? "#f3f4f6" : (p.key === "basic" ? p.accent : "transparent"),
                      color: isCurrent(p.key) ? "#9ca3af" : (p.key === "basic" ? "white" : p.accent),
                      border: `2px solid ${isCurrent(p.key) ? "#e5e7eb" : p.accent}`,
                    }}
                  >
                    {isCurrent(p.key) ? "Activo" : p.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test mode notice */}
      <div className="mb-4 rounded-2xl bg-yellow-50 p-4 text-center">
        <p className="text-xs font-semibold text-yellow-700">Modo de prueba</p>
        <p className="mt-1 text-xs text-yellow-600">
          Usa la tarjeta <strong>4242 4242 4242 4242</strong> para probar pagos sin cargo real.
        </p>
      </div>

      <div className="vively-disclaimer">
        <p>Los precios incluyen IVA. Cancela en cualquier momento.</p>
      </div>
    </div>
  );
}
