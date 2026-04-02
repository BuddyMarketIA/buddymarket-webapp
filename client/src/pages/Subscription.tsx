import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SparklesIcon, BoltIcon, StarIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const PLANS = [
  {
    key: "basic" as const,
    name: "Basic",
    price: "4,99€",
    period: "/mes",
    icon: BoltIcon,
    highlight: false,
    color: "border-blue-100",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    features: [
      "Recetas ilimitadas",
      "Planificador de menús",
      "Listas de compra automáticas",
      "Inventario básico",
      "Seguimiento nutricional básico",
    ],
  },
  {
    key: "premium" as const,
    name: "Premium",
    price: "9,99€",
    period: "/mes",
    icon: StarIcon,
    highlight: true,
    color: "border-[#F97316]",
    iconBg: "bg-[#F97316]/10",
    iconColor: "text-[#F97316]",
    features: [
      "Todo lo del plan Basic",
      "Generación de menús con IA",
      "Seguimiento nutricional avanzado",
      "Perfil médico completo",
      "Alertas de inventario",
      "Recomendaciones personalizadas",
      "Soporte prioritario",
    ],
  },
  {
    key: "pro_max" as const,
    name: "Pro Max",
    price: "19,99€",
    period: "/mes",
    icon: SparklesIcon,
    highlight: false,
    color: "border-purple-100",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    features: [
      "Todo lo del plan Premium",
      "Consultas con nutricionistas",
      "Análisis avanzado de salud",
      "Integración con dispositivos",
      "API de integración",
      "Soporte 24/7 dedicado",
    ],
  },
];

export default function Subscription() {
  const { data: subscription, isLoading } = trpc.subscriptions.getStatus.useQuery();

  const createCheckout = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirigiendo al pago...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // cancel not implemented yet - placeholder
  const cancelSub = { mutate: () => toast.info("Contacta con soporte para cancelar"), isPending: false };

  const currentPlan = (subscription as any)?.plan ?? null;
  const isActive = (subscription as any)?.status === "active";

  const planNames: Record<string, string> = {
    basic: "Basic (4,99€/mes)",
    premium: "Premium (9,99€/mes)",
    pro_max: "Pro Max (19,99€/mes)",
  };
  const currentPlanName = currentPlan ? (planNames[currentPlan] ?? currentPlan) : null;

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316]/10">
          <SparklesIcon className="h-7 w-7 text-[#F97316]" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Planes VIVELY</h1>
        <p className="mt-1 text-sm text-gray-500">Elige el plan que mejor se adapta a tus necesidades</p>
      </div>

      {/* Current plan badge */}
      {isActive && currentPlan && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#F97316]/10 p-4">
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-[#F97316]" />
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Plan activo: {currentPlanName}</p>
            <p className="text-xs text-gray-500">Tu suscripción está activa y al día</p>
          </div>
          <button
            onClick={() => toast.info("Para cancelar tu suscripción, contacta con soporte en support@buddymarket.app")}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.key && isActive;

          return (
            <div
              key={plan.key}
              className={`relative rounded-3xl border-2 bg-white p-5 transition-all ${plan.color} ${plan.highlight ? "shadow-lg shadow-[#F97316]/10" : "shadow-sm"}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F97316] px-4 py-1 text-[13px] font-bold text-white shadow">
                  MÁS POPULAR
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 rounded-full bg-gray-900 px-3 py-1 text-[13px] font-bold text-white">
                  ACTIVO
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${plan.iconBg}`}>
                  <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">{plan.name}</h2>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-xs text-gray-400">{plan.period}</span>
                  </div>
                </div>
              </div>

              <ul className="mb-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-[#F97316]" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => createCheckout.mutate({ plan: plan.key, origin: window.location.origin })}
                disabled={isCurrent || createCheckout.isPending}
                className={`w-full rounded-2xl py-3 text-sm font-bold transition-all ${
                  isCurrent
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : plan.highlight
                    ? "bg-[#F97316] text-white hover:bg-[#EA6C0A]"
                    : "border-2 border-[#F97316] text-[#F97316] hover:bg-[#F97316]/5"
                }`}
              >
                {isCurrent ? "Plan actual" : `Suscribirse a ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Test mode notice */}
      <div className="mt-5 rounded-2xl bg-yellow-50 p-4 text-center">
        <p className="text-xs font-semibold text-yellow-700">🧪 Modo de prueba</p>
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
