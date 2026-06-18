import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";

export default function HireRequests() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: requests, isLoading } = trpc.expertPatients.getExpertHireRequests.useQuery();
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: number; action: "accept" | "reject" } | null>(null);

  const respondMut = trpc.expertPatients.respondHireRequest.useMutation({
    onSuccess: (data) => {
      toast.success(data.action === "accept" ? "¡Solicitud aceptada! El paciente ya está en tu lista." : "Solicitud rechazada.");
      utils.expertPatients.getExpertHireRequests.invalidate();
      utils.expertPatients.getPatients.invalidate();
      setShowResponseModal(false);
      setResponseText("");
      setPendingAction(null);
    },
    onError: (err) => toast.error(err.message || "Error al responder"),
  });

  const openModal = (id: number, action: "accept" | "reject") => {
    setPendingAction({ id, action });
    setResponseText("");
    setShowResponseModal(true);
  };

  const pending = (requests ?? []).filter((r: any) => r.status === "pending");
  const responded = (requests ?? []).filter((r: any) => r.status !== "pending");

  const statusBadge = (status: string) => {
    if (status === "pending") return <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">Pendiente</span>;
    if (status === "accepted") return <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Aceptada</span>;
    return <span className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">Rechazada</span>;
  };

  return (
    <AppLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-background border-b border-border/50 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate("/app/expert/dashboard")} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">←</button>
          <div>
            <h1 className="font-bold text-foreground text-lg">Solicitudes de pacientes</h1>
            <p className="text-xs text-muted-foreground">{pending.length} pendiente{pending.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />)}
            </div>
          )}

          {!isLoading && pending.length === 0 && responded.length === 0 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="text-5xl mb-3">💭</div>
                <h3 className="font-bold text-foreground mb-1">Sin solicitudes todavía</h3>
                <p className="text-sm text-muted-foreground">Cuando un paciente solicite tus servicios, aparecerá aquí.</p>
              </div>
              {/* CTA para compartir perfil */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔗</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground text-sm mb-1">¿Cómo conseguir pacientes?</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      Comparte tu enlace de perfil público para que los pacientes puedan encontrarte y solicitar tus servicios.
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          const profileUrl = `${window.location.origin}/experto/${encodeURIComponent((window as any).__expertSlug ?? "")}`;
                          const shareUrl = `${window.location.origin}/app/buddy-experts`;
                          if (navigator.share) {
                            navigator.share({ title: "Mi perfil de experto en BuddyOne", url: shareUrl });
                          } else {
                            navigator.clipboard.writeText(shareUrl);
                            toast.success("¡Enlace copiado al portapapeles!");
                          }
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors"
                      >
                        📱 Compartir mi perfil
                      </button>
                      <a
                        href="/app/buddy-experts"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors"
                      >
                        👤 Ver mi perfil público
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              {/* Tips para conseguir pacientes */}
              <div className="bg-muted/30 rounded-2xl p-4">
                <h4 className="font-bold text-foreground text-sm mb-2">💡 Consejos para conseguir tus primeros pacientes</h4>
                <ul className="space-y-1.5">
                  {[
                    "Completa tu perfil con foto y descripción detallada",
                    "Publica menús de muestra para mostrar tu estilo",
                    "Comparte tu enlace en redes sociales",
                    "Configura tus precios y servicios en la pestaña Servicios",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-orange-400 font-bold mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Pendientes */}
          {pending.length > 0 && (
            <div>
              <h2 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Pendientes de respuesta ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((req: any) => (
                  <RequestCard key={req.id} req={req} onAccept={() => openModal(req.id, "accept")} onReject={() => openModal(req.id, "reject")} statusBadge={statusBadge} />
                ))}
              </div>
            </div>
          )}

          {/* Respondidas */}
          {responded.length > 0 && (
            <div>
              <h2 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-muted-foreground/30 rounded-full"></span>
                Respondidas ({responded.length})
              </h2>
              <div className="space-y-3">
                {responded.map((req: any) => (
                  <RequestCard key={req.id} req={req} statusBadge={statusBadge} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal de respuesta */}
        {showResponseModal && pendingAction && (
          <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowResponseModal(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground text-lg">
                    {pendingAction.action === "accept" ? "✅ Aceptar solicitud" : "❌ Rechazar solicitud"}
                  </h3>
                  <button onClick={() => setShowResponseModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground">×</button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                    Mensaje para el paciente <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder={pendingAction.action === "accept"
                      ? "Ej: ¡Bienvenido/a! Estaré encantada de acompañarte en tu proceso..."
                      : "Ej: En este momento no tengo disponibilidad, pero puedes volver a contactarme en..."}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 bg-background text-foreground"
                    rows={3}
                  />
                </div>
                <button
                  onClick={() => respondMut.mutate({ requestId: pendingAction.id, action: pendingAction.action, response: responseText || undefined })}
                  disabled={respondMut.isPending}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-opacity disabled:opacity-50 ${
                    pendingAction.action === "accept"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600"
                      : "bg-gradient-to-r from-red-500 to-rose-600"
                  }`}
                >
                  {respondMut.isPending ? "Procesando..." : pendingAction.action === "accept" ? "Aceptar y añadir paciente" : "Rechazar solicitud"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function RequestCard({ req, onAccept, onReject, statusBadge }: {
  req: any;
  onAccept?: () => void;
  onReject?: () => void;
  statusBadge: (s: string) => JSX.Element;
}) {
  const initials = (req.patient?.name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        {req.patient?.imageUrl ? (
          <img src={req.patient.imageUrl} alt={req.patient.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-sm flex-shrink-0">{initials}</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{req.patient?.name ?? "Paciente"}</span>
            {statusBadge(req.status)}
          </div>
          <p className="text-xs text-muted-foreground">{req.patient?.email}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{new Date(req.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {req.plan && (
        <div className="bg-orange-500/10 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Plan solicitado: {req.plan.name}</p>
          <p className="text-xs text-orange-500/80">{req.plan.price}€/{req.plan.billingPeriod === "monthly" ? "mes" : req.plan.billingPeriod}</p>
        </div>
      )}

      {req.message && (
        <div className="bg-muted/30 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">Mensaje del paciente:</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{req.message}</p>
        </div>
      )}

      {req.status === "pending" && onAccept && onReject && (
        <div className="flex gap-2">
          <button onClick={onAccept} className="flex-1 py-2 rounded-xl text-sm font-bold bg-green-500 text-white hover:bg-green-600 transition-colors">
            ✓ Aceptar
          </button>
          <button onClick={onReject} className="flex-1 py-2 rounded-xl text-sm font-bold bg-muted/50 text-foreground/80 hover:bg-red-500/10 hover:text-red-500 transition-colors">
            ✕ Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
