import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { useLocation } from "wouter";

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
    if (status === "pending") return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Pendiente</span>;
    if (status === "accepted") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Aceptada</span>;
    return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Rechazada</span>;
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate("/app/expert/dashboard")} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">←</button>
        <div>
          <h1 className="font-bold text-gray-900 text-lg">Solicitudes de pacientes</h1>
          <p className="text-xs text-gray-500">{pending.length} pendiente{pending.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && pending.length === 0 && responded.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <h3 className="font-bold text-gray-800 mb-1">Sin solicitudes</h3>
            <p className="text-sm text-gray-500">Cuando un paciente solicite tus servicios, aparecerá aquí.</p>
          </div>
        )}

        {/* Pendientes */}
        {pending.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
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
            <h2 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowResponseModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">
                  {pendingAction.action === "accept" ? "✅ Aceptar solicitud" : "❌ Rechazar solicitud"}
                </h3>
                <button onClick={() => setShowResponseModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">×</button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mensaje para el paciente <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={pendingAction.action === "accept"
                    ? "Ej: ¡Bienvenido/a! Estaré encantada de acompañarte en tu proceso..."
                    : "Ej: En este momento no tengo disponibilidad, pero puedes volver a contactarme en..."}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        {req.patient?.imageUrl ? (
          <img src={req.patient.imageUrl} alt={req.patient.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">{initials}</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{req.patient?.name ?? "Paciente"}</span>
            {statusBadge(req.status)}
          </div>
          <p className="text-xs text-gray-500">{req.patient?.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(req.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {req.plan && (
        <div className="bg-orange-50 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs font-semibold text-orange-800">Plan solicitado: {req.plan.name}</p>
          <p className="text-xs text-orange-600">{req.plan.price}€/{req.plan.billingPeriod === "monthly" ? "mes" : req.plan.billingPeriod}</p>
        </div>
      )}

      {req.message && (
        <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-gray-500 font-medium mb-0.5">Mensaje del paciente:</p>
          <p className="text-xs text-gray-700 leading-relaxed">{req.message}</p>
        </div>
      )}

      {req.status === "pending" && onAccept && onReject && (
        <div className="flex gap-2">
          <button onClick={onAccept} className="flex-1 py-2 rounded-xl text-sm font-bold bg-green-500 text-white hover:bg-green-600 transition-colors">
            ✓ Aceptar
          </button>
          <button onClick={onReject} className="flex-1 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
            ✕ Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
