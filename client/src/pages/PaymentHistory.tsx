import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Receipt, ExternalLink, Download, CreditCard, Smartphone, CheckCircle2, Clock, XCircle } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  basic: "Basic",
  premium: "Premium",
  pro_max: "Pro Max",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  basic: "bg-blue-100 text-blue-700",
  premium: "bg-purple-100 text-purple-700",
  pro_max: "bg-amber-100 text-amber-700",
};

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null || currency === null) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(ts: number | null) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "paid" || status === "active") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Pagado
      </span>
    );
  }
  if (status === "open" || status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" />
      {status ?? "Desconocido"}
    </span>
  );
}

export default function PaymentHistory() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.subscriptions.getUserPayments.useQuery();

  const subscription = data?.subscription;
  const payments = data?.payments ?? [];

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-orange-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setLocation("/app/profile")}
          className="p-2 rounded-full hover:bg-orange-50 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Historial de pagos</h1>
          <p className="text-xs text-gray-500">Tus suscripciones y facturas</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Current subscription card */}
        <Card className="border-orange-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-500" />
              Suscripción actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : subscription ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${PLAN_COLORS[subscription.plan ?? "free"]}`}>
                    {PLAN_LABELS[subscription.plan ?? "free"] ?? subscription.plan}
                  </span>
                  {subscription.currentPeriodEnd && (
                    <p className="text-xs text-gray-500 mt-1">
                      Válida hasta: {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <StatusBadge status={subscription.status} />
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm text-gray-500">No tienes ninguna suscripción activa.</p>
                <Button
                  size="sm"
                  className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setLocation("/app/subscription")}
                >
                  Ver planes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment history */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" />
            Facturas y pagos
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <Card className="border-dashed border-orange-200 bg-orange-50/50">
              <CardContent className="py-10 text-center">
                <Receipt className="w-10 h-10 text-orange-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">Sin facturas todavía</p>
                <p className="text-xs text-gray-400 mt-1">Aquí aparecerán tus pagos cuando realices una compra.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          {(payment as any).platform ? (
                            <Smartphone className="w-4 h-4 text-orange-600" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {payment.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(payment.created)}
                          </p>
                          {payment.periodStart && payment.periodEnd && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Período: {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-sm font-bold text-gray-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                        <StatusBadge status={payment.status} />
                      </div>
                    </div>

                    {/* Actions */}
                    {(payment.receiptUrl || payment.pdfUrl) && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-orange-50">
                        {payment.receiptUrl && (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver factura
                          </a>
                        )}
                        {payment.pdfUrl && (
                          <a
                            href={payment.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            <Download className="w-3 h-3" />
                            Descargar PDF
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-400 text-center pb-4">
          Para cualquier consulta sobre pagos, contacta con nosotros en{" "}
          <a href="mailto:soporte@buddymarketapp.com" className="text-orange-500 underline">
            soporte@buddymarketapp.com
          </a>
        </p>
      </div>
    </div>
  );
}
