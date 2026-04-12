import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Loader2, Home, Check, AlertTriangle, Clock } from "lucide-react";
import { toast } from "@/components/sonner-a11y-shim";

export default function FamiliaUnirse() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const { data: invite, isLoading: loadingInvite, error } = trpc.household.getInviteByToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const accept = trpc.household.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("¡Te has unido al hogar familiar!");
      navigate("/familia");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!token || loadingInvite || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Invitación no encontrada</h2>
        <p className="text-muted-foreground mb-6">Este enlace no es válido o ya fue utilizado.</p>
        <Button onClick={() => navigate("/")} variant="outline">Ir al inicio</Button>
      </div>
    );
  }

  if (invite.isExpired || invite.status !== "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Invitación expirada</h2>
        <p className="text-muted-foreground mb-6">
          {invite.status === "accepted"
            ? "Esta invitación ya fue aceptada anteriormente."
            : "Este enlace de invitación ha expirado. Pide al propietario del hogar que te envíe uno nuevo."}
        </p>
        <Button onClick={() => navigate("/")} variant="outline">Ir al inicio</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Invitación al hogar</h1>
          <p className="text-orange-100 mt-1 text-sm">BuddyMarket · Modo Familia</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">{invite.inviterName}</strong> te ha invitado a unirte al hogar
            </p>
            <p className="text-2xl font-bold text-foreground mt-2">"{invite.householdName}"</p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              Comparte el menú semanal con toda la familia
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              Una lista de la compra unificada para el hogar
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              Tus propias preferencias y restricciones dietéticas
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Expira el {new Date(invite.expiresAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {user ? (
            <Button
              onClick={() => accept.mutate({ token: token! })}
              disabled={accept.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              size="lg"
            >
              {accept.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Home className="w-4 h-4 mr-2" />
              )}
              Unirme al hogar
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Necesitas iniciar sesión para aceptar la invitación
              </p>
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                size="lg"
              >
                Iniciar sesión y unirme
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
