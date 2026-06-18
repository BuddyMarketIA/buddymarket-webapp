/**
 * AdminProfileApplications — Admin panel for reviewing profile applications
 * (BuddyExpert, BuddyMaker, Colaborador)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

type StatusFilter = "pending" | "approved" | "rejected" | "all";
type TypeFilter = "buddyexpert" | "buddymaker" | "colaborador" | "all";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprobado", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, { emoji: string; label: string }> = {
  buddyexpert: { emoji: "👨‍⚕️", label: "BuddyExpert" },
  buddymaker: { emoji: "👨‍🍳", label: "BuddyMaker" },
  colaborador: { emoji: "🤝", label: "Colaborador" },
};

interface ReviewModalProps {
  application: {
    id: number;
    profileType: string;
    user: { name: string | null; email: string | null } | null;
  };
  onClose: () => void;
  onReviewed: () => void;
}

function ReviewModal({ application, onClose, onReviewed }: ReviewModalProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const reviewMutation = trpc.profileSetup.reviewApplication.useMutation();

  const handleSubmit = async () => {
    if (!action) return;
    setLoading(true);
    try {
      await reviewMutation.mutateAsync({
        applicationId: application.id,
        action,
        reviewNote: note || undefined,
      });
      toast.success(action === "approve" ? "Solicitud aprobada ✓" : "Solicitud rechazada");
      onReviewed();
    } catch {
      toast.error("Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
        <div className="p-6">
          <h2 className="text-lg font-extrabold text-foreground mb-1">Revisar solicitud</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {TYPE_LABELS[application.profileType]?.emoji} {TYPE_LABELS[application.profileType]?.label} — {application.user?.name ?? "Usuario"} ({application.user?.email})
          </p>

          {/* Action selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setAction("approve")}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
                action === "approve"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-border bg-background text-foreground hover:border-green-300"
              }`}
            >
              ✓ Aprobar
            </button>
            <button
              onClick={() => setAction("reject")}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
                action === "reject"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-border bg-background text-foreground hover:border-red-300"
              }`}
            >
              ✗ Rechazar
            </button>
          </div>

          {/* Note */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Nota para el usuario {action === "reject" ? "(recomendado)" : "(opcional)"}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={action === "reject"
                ? "Explica el motivo del rechazo para que el usuario pueda mejorar su solicitud..."
                : "Mensaje de bienvenida o instrucciones adicionales..."}
              rows={3}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!action || loading}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all disabled:opacity-40 ${
                action === "approve" ? "bg-green-500 hover:bg-green-600" :
                action === "reject" ? "bg-red-500 hover:bg-red-600" :
                "bg-muted"
              }`}
            >
              {loading ? "Procesando…" : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ApplicationDetailProps {
  app: {
    id: number;
    profileType: string;
    status: string;
    motivation: string | null;
    experience: string | null;
    specialties: string[] | null;
    certifications: string[] | null;
    portfolioUrl: string | null;
    socialLinks: Record<string, string> | null;
    reviewNote: string | null;
    createdAt: Date | null;
    user: { name: string | null; email: string | null; imageUrl: string | null } | null;
  };
  onReview: () => void;
}

function ApplicationCard({ app, onReview }: ApplicationDetailProps) {
  const [expanded, setExpanded] = useState(false);
  const typeLabel = TYPE_LABELS[app.profileType] ?? { emoji: "❓", label: app.profileType };
  const statusLabel = STATUS_LABELS[app.status] ?? { label: app.status, color: "bg-muted text-muted-foreground" };

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-xl overflow-hidden">
          {app.user?.imageUrl ? (
            <img src={app.user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{typeLabel.emoji}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-sm">{app.user?.name ?? "Sin nombre"}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusLabel.color}`}>
              {statusLabel.label}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {typeLabel.emoji} {typeLabel.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{app.user?.email}</p>
          <p className="text-xs text-muted-foreground">
            {app.createdAt ? new Date(app.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            {expanded ? "Ocultar" : "Ver detalles"}
          </button>
          {app.status === "pending" && (
            <button
              onClick={onReview}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
            >
              Revisar
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          {app.motivation && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Motivación</p>
              <p className="text-sm text-foreground leading-relaxed">{app.motivation}</p>
            </div>
          )}
          {app.experience && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Experiencia</p>
              <p className="text-sm text-foreground leading-relaxed">{app.experience}</p>
            </div>
          )}
          {app.specialties && app.specialties.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-1.5">
                {app.specialties.map(s => (
                  <span key={s} className="rounded-full bg-orange-100 text-orange-700 px-2.5 py-0.5 text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
          {app.certifications && app.certifications.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Certificaciones</p>
              <ul className="space-y-0.5">
                {app.certifications.map((c, i) => (
                  <li key={i} className="text-sm text-foreground">• {c}</li>
                ))}
              </ul>
            </div>
          )}
          {app.socialLinks && Object.keys(app.socialLinks).length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Redes sociales</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(app.socialLinks).map(([k, v]) => v && (
                  <a key={k} href={v.startsWith("http") ? v : `https://instagram.com/${v.replace("@", "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-orange-600 hover:underline"
                  >
                    {k === "instagram" ? "📸" : "🌐"} {v}
                  </a>
                ))}
              </div>
            </div>
          )}
          {app.portfolioUrl && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Portfolio</p>
              <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-orange-600 hover:underline"
              >
                {app.portfolioUrl}
              </a>
            </div>
          )}
          {app.reviewNote && (
            <div className="rounded-lg bg-background border border-border p-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Nota de revisión</p>
              <p className="text-sm text-foreground">{app.reviewNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProfileApplications() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [reviewingApp, setReviewingApp] = useState<{
    id: number;
    profileType: string;
    user: { name: string | null; email: string | null } | null;
  } | null>(null);

  const { data: applications, refetch } = trpc.profileSetup.listApplications.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    profileType: typeFilter === "all" ? undefined : typeFilter,
  });

  const pendingCount = applications?.filter(a => a.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Solicitudes de perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revisa y aprueba solicitudes de BuddyExpert, BuddyMaker y Colaborador
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-bold shadow-md">
            {pendingCount}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex rounded-xl border border-border overflow-hidden">
          {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                statusFilter === s ? "bg-orange-500 text-white" : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {s === "pending" ? "Pendientes" : s === "approved" ? "Aprobadas" : s === "rejected" ? "Rechazadas" : "Todas"}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex rounded-xl border border-border overflow-hidden">
          {(["all", "buddyexpert", "buddymaker", "colaborador"] as TypeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                typeFilter === t ? "bg-orange-500 text-white" : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "all" ? "Todos" : TYPE_LABELS[t]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications list */}
      {!applications ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">📭</span>
          <p className="font-semibold text-foreground">No hay solicitudes</p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter === "pending" ? "No hay solicitudes pendientes de revisión." : "No se encontraron solicitudes con estos filtros."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app as any}
              onReview={() => setReviewingApp({
                id: app.id,
                profileType: app.profileType,
                user: app.user ?? null,
              })}
            />
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewingApp && (
        <ReviewModal
          application={reviewingApp}
          onClose={() => setReviewingApp(null)}
          onReviewed={() => {
            setReviewingApp(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
