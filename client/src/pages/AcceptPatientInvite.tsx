// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Shield, CheckCircle2, UserCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcceptPatientInvite() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [expertName, setExpertName] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);

  // Get invite info (public procedure)
  const { data: inviteInfo, isLoading: loadingInfo, error: infoError } = trpc.offlinePatients.getOfflineInviteInfo.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  // Accept invite (protected procedure — requires login)
  const acceptMutation = trpc.offlinePatients.acceptOfflineInvite.useMutation({
    onSuccess: (data) => {
      setAccepted(true);
      setExpertName(data.expertName ?? null);
      setPatientName(data.patientName ?? null);
    },
  });

  // Auto-accept once user is logged in and invite info is loaded
  useEffect(() => {
    if (!authLoading && user && inviteInfo && !accepted && !acceptMutation.isPending && !acceptMutation.isSuccess) {
      acceptMutation.mutate({ token });
    }
  }, [authLoading, user, inviteInfo, accepted]);

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (authLoading || loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-orange-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  // ─── Invalid / expired token ───────────────────────────────────────────────
  if (infoError || !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-xl font-black text-foreground">Invitación no válida</h1>
          <p className="text-sm text-muted-foreground">
            Este enlace de invitación ha expirado o no es válido. Contacta con tu nutricionista para que te envíe una nueva invitación.
          </p>
          <Button onClick={() => navigate("/")} className="bg-orange-500 hover:bg-orange-600 text-white w-full">
            Ir al inicio
          </Button>
        </div>
      </div>
    );
  }

  // ─── Already accepted ──────────────────────────────────────────────────────
  if (inviteInfo.alreadyAccepted || accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-foreground">¡Conexión establecida!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ya estás conectado con <strong>{expertName ?? inviteInfo.expertName ?? "tu nutricionista"}</strong>.
            Ahora puedes ver tus planes nutricionales, seguir tu progreso y comunicarte directamente desde la app.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-orange-800">¿Qué puedes hacer ahora?</p>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>✅ Ver tus menús y planes personalizados</li>
              <li>✅ Seguir tu evolución de peso</li>
              <li>✅ Chatear con tu nutricionista</li>
              <li>✅ Recibir notificaciones de tus planes</li>
            </ul>
          </div>
          <Button
            onClick={() => navigate("/app/dashboard")}
            className="bg-orange-500 hover:bg-orange-600 text-white w-full flex items-center justify-center gap-2"
          >
            Ir a mi panel <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Not logged in — show info + login CTA ─────────────────────────────────
  if (!user) {
    const returnPath = `/patient-invite/${token}`;
    const loginUrl = getLoginUrl(returnPath);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full space-y-6">
          {/* Logo / brand */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-3">
              <UserCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground">BuddyOne</h1>
            <p className="text-sm text-muted-foreground">Tu plataforma de nutrición inteligente</p>
          </div>

          {/* Invite details */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-bold text-orange-800">
              👋 {inviteInfo.expertName ?? "Tu nutricionista"} te ha invitado
            </p>
            {inviteInfo.patientName && (
              <p className="text-xs text-orange-700">
                Hola <strong>{inviteInfo.patientName}</strong>, tu nutricionista ha creado tu perfil en BuddyOne.
                Acepta la invitación para acceder a tus planes personalizados.
              </p>
            )}
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <Shield size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-800">
              Tu nutricionista controla qué datos puedes ver. Siempre podrás ver tus planes y progreso, pero algunas notas internas pueden estar restringidas.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <a
              href={loginUrl}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
            >
              Crear cuenta o iniciar sesión <ArrowRight size={16} />
            </a>
            <p className="text-xs text-center text-muted-foreground">
              Si ya tienes cuenta, inicia sesión y la conexión se establecerá automáticamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Logged in, processing ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
        <Loader2 size={32} className="text-orange-500 animate-spin mx-auto" />
        <h1 className="text-lg font-black text-foreground">Estableciendo conexión...</h1>
        <p className="text-sm text-muted-foreground">
          Conectando tu cuenta con {inviteInfo.expertName ?? "tu nutricionista"}...
        </p>
        {acceptMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-700">{acceptMutation.error?.message ?? "Error al aceptar la invitación"}</p>
            <Button
              onClick={() => acceptMutation.mutate({ token })}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs"
              size="sm"
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
