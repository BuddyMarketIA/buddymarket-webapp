import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Loader2, Sparkles, Star, Zap } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    key: "basic" as const,
    name: "Basic",
    price: "4,99€",
    period: "/mes",
    icon: Zap,
    color: "border-blue-200 bg-blue-50/30",
    iconColor: "text-blue-600 bg-blue-100",
    badgeColor: "bg-blue-100 text-blue-700",
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
    icon: Star,
    color: "border-primary bg-primary/5 ring-2 ring-primary/20",
    iconColor: "text-primary bg-primary/10",
    badgeColor: "bg-primary text-primary-foreground",
    popular: true,
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
    icon: Crown,
    color: "border-amber-200 bg-amber-50/30",
    iconColor: "text-amber-600 bg-amber-100",
    badgeColor: "bg-amber-100 text-amber-700",
    features: [
      "Todo lo del plan Premium",
      "Gestión de múltiples perfiles",
      "Exportación de datos",
      "API de integración",
      "Soporte dedicado 24/7",
      "Acceso anticipado a nuevas funciones",
      "Consulta con nutricionista",
    ],
  },
];

export default function Subscription() {
  const { data: subscription } = trpc.subscriptions.getStatus.useQuery();
  const createCheckout = trpc.subscriptions.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirigiendo al pago...");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const currentPlan = subscription?.plan;
  const isActive = subscription?.status === "active";

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Planes de suscripción
          </div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Elige tu plan
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Desbloquea todas las funcionalidades de BuddyMarket con un plan premium.
            Cancela cuando quieras.
          </p>
        </div>

        {isActive && currentPlan && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Plan activo: {plans.find((p) => p.key === currentPlan)?.name || currentPlan}
              </p>
              <p className="text-xs text-green-600">Tu suscripción está activa y al día.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = isActive && currentPlan === plan.key;

            return (
              <Card key={plan.key} className={`border-2 relative ${plan.color}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1">
                      Más popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${plan.iconColor} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Plan actual
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    disabled={isCurrent || createCheckout.isPending}
                    onClick={() => {
                      if (!isCurrent) {
                        createCheckout.mutate({
                          plan: plan.key,
                          origin: window.location.origin,
                        });
                      }
                    }}
                  >
                    {createCheckout.isPending && createCheckout.variables?.plan === plan.key ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {isCurrent ? "Plan actual" : `Suscribirse al ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Pago seguro con Stripe. Cancela en cualquier momento.
          </p>
          <p className="text-xs text-muted-foreground">
            Para pruebas, usa la tarjeta: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">4242 4242 4242 4242</code>
          </p>
          <p className="text-xs text-muted-foreground">
            La información de suscripción no constituye recomendación médica. Consulta siempre con un profesional de la salud.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
