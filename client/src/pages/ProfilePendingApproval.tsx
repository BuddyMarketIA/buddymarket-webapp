/**
 * ProfilePendingApproval — Shown to users waiting for admin approval
 * of their BuddyExpert, BuddyMaker, or Colaborador application.
 */
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const PROFILE_LABELS: Record<string, { emoji: string; title: string }> = {
  buddyexpert: { emoji: "👨‍⚕️", title: "BuddyExpert" },
  buddymaker: { emoji: "👨‍🍳", title: "BuddyMaker" },
  colaborador: { emoji: "🤝", title: "Colaborador" },
};

export default function ProfilePendingApproval() {
  const [, setLocation] = useLocation();
  const { data: status } = trpc.profileSetup.getStatus.useQuery();

  const profileType = status?.application?.profileType ?? "buddyexpert";
  const label = PROFILE_LABELS[profileType] ?? { emoji: "⏳", title: "Perfil" };
  const isRejected = status?.application?.status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f3] to-[#fff5ec] flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg ${
            isRejected ? "bg-red-100" : "bg-amber-100"
          }`}>
            {isRejected ? "❌" : label.emoji}
          </div>
        </div>

        {isRejected ? (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">
                Solicitud no aprobada
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tu solicitud de {label.title} no ha sido aprobada en esta ocasión.
                {status?.application?.reviewNote && (
                  <span className="block mt-2 text-foreground font-medium">
                    Motivo: {status.application.reviewNote}
                  </span>
                )}
              </p>
            </div>

            <div className="rounded-xl bg-background border border-border p-4 text-left space-y-2">
              <p className="text-sm font-semibold text-foreground">¿Qué puedes hacer?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Puedes volver a solicitar el perfil con más información</li>
                <li>• Continúa usando BuddyMarket como usuario normal</li>
                <li>• Contacta con soporte si crees que es un error</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setLocation("/profile-setup")}
                className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition-all active:scale-95 hover:bg-orange-600"
              >
                Volver a solicitar
              </button>
              <button
                onClick={() => setLocation("/app/dashboard")}
                className="w-full rounded-2xl border border-border bg-background py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
              >
                Ir al dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">
                Solicitud enviada ✓
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tu solicitud de <strong>{label.title}</strong> está siendo revisada por nuestro equipo.
                Te notificaremos en cuanto tengamos una respuesta.
              </p>
            </div>

            {/* Timeline */}
            <div className="rounded-xl bg-background border border-border p-5 text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">✓</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Solicitud recibida</p>
                  <p className="text-xs text-muted-foreground">Hemos recibido tu solicitud correctamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold animate-pulse">⏳</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">En revisión</p>
                  <p className="text-xs text-muted-foreground">Nuestro equipo está revisando tu perfil (24-48h)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">3</div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Aprobación y activación</p>
                  <p className="text-xs text-muted-foreground">Recibirás una notificación con el resultado</p>
                </div>
              </div>
            </div>

            {/* Use app while waiting */}
            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 text-left">
              <p className="text-sm font-semibold text-orange-800 mb-1">Mientras esperas…</p>
              <p className="text-xs text-orange-700">
                Puedes usar BuddyMarket como usuario normal. Cuando tu solicitud sea aprobada, tu perfil se actualizará automáticamente.
              </p>
            </div>

            <button
              onClick={() => setLocation("/buddy-setup")}
              className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition-all active:scale-95 hover:bg-orange-600"
            >
              Configurar mi perfil nutricional →
            </button>

            <button
              onClick={() => setLocation("/app/dashboard")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ir al dashboard directamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
