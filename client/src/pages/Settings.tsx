import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Section = "account" | "notifications" | "privacy" | "data" | "subscription";

const SECTIONS: { id: Section; label: string; icon: string; desc: string }[] = [
  { id: "account", label: "Cuenta", icon: "👤", desc: "Información básica y seguridad" },
  { id: "notifications", label: "Notificaciones", icon: "🔔", desc: "Preferencias de alertas" },
  { id: "privacy", label: "Privacidad", icon: "🔒", desc: "Control de datos y visibilidad" },
  { id: "data", label: "Mis datos", icon: "📦", desc: "Exportar o eliminar tu cuenta" },
  { id: "subscription", label: "Suscripción", icon: "⭐", desc: "Plan actual y facturación" },
];

export default function Settings() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("account");
  const [notifMeals, setNotifMeals] = useState(true);
  const [notifHydration, setNotifHydration] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifExpert, setNotifExpert] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const subStatus = trpc.subscriptions.getStatus.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });
  const exportMyData = trpc.users.exportMyData.useQuery(undefined, { enabled: false });

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const result = await exportMyData.refetch();
      if (result.data) {
        const json = JSON.stringify(result.data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `buddyone-datos-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Datos exportados correctamente. Revisa tu carpeta de descargas.");
      }
    } catch {
      toast.error("Error al exportar los datos. Inténtalo de nuevo.");
    } finally {
      setExportLoading(false);
    }
  };

  const plan = (subStatus.data as any)?.plan ?? "free";
  const planLabel: Record<string, string> = {
    free: "Free",
    basic: "Pro",
    premium: "Pro Max",
    pro_max: "Pro Max+",
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 px-4">
      {/* Header */}
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-black text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona tu cuenta, notificaciones y privacidad</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar nav */}
        <div className="md:w-56 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all whitespace-nowrap md:whitespace-normal ${
                  section === s.id
                    ? "bg-orange-50 text-orange-600 font-bold border border-orange-200"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-lg">{s.icon}</span>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold leading-tight">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/70">{s.desc}</p>
                </div>
                <span className="md:hidden text-sm font-semibold">{s.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ACCOUNT */}
          {section === "account" && (
            <div className="bg-background rounded-2xl border border-border p-5 space-y-5">
              <h2 className="font-black text-lg">Información de cuenta</h2>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xl font-black">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground">{user?.name ?? "Usuario"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
                  <Badge variant="outline" className="mt-1 text-xs border-orange-200 text-orange-600">{planLabel[plan] ?? "Free"}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/app/profile")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">✏️</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Editar perfil</p>
                      <p className="text-xs text-muted-foreground">Nombre, foto, bio, objetivos</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground">›</span>
                </button>

                <button
                  onClick={() => navigate("/app/metrics")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚖️</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Mis métricas</p>
                      <p className="text-xs text-muted-foreground">Peso, composición corporal, evolución</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground">›</span>
                </button>

                <button
                  onClick={() => navigate("/app/meal-notifications")}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🔔</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold">Recordatorios de comidas</p>
                      <p className="text-xs text-muted-foreground">Configura tus alertas diarias</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground">›</span>
                </button>
              </div>

              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <span className="text-lg">🚪</span>
                  <span className="text-sm font-semibold">Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === "notifications" && (
            <div className="bg-background rounded-2xl border border-border p-5 space-y-5">
              <h2 className="font-black text-lg">Notificaciones</h2>
              <p className="text-sm text-muted-foreground">Controla qué alertas quieres recibir</p>

              <div className="space-y-4">
                {[
                  { id: "meals", label: "Recordatorios de comidas", desc: "Alertas para desayuno, comida, cena y merienda", value: notifMeals, set: setNotifMeals },
                  { id: "hydration", label: "Hidratación", desc: "Recordatorio de beber agua cada 2 horas", value: notifHydration, set: setNotifHydration },
                  { id: "weekly", label: "Resumen semanal", desc: "Informe de tu progreso cada lunes", value: notifWeekly, set: setNotifWeekly },
                  { id: "expert", label: "Mensajes del experto", desc: "Cuando tu nutricionista te envía un plan o mensaje", value: notifExpert, set: setNotifExpert },
                ].map(n => (
                  <div key={n.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                    <div>
                      <Label className="font-semibold text-sm">{n.label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                    </div>
                    <Switch
                      checked={n.value}
                      onCheckedChange={n.set}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={() => { toast.success("Preferencias guardadas"); }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold"
              >
                Guardar preferencias
              </Button>
            </div>
          )}

          {/* PRIVACY */}
          {section === "privacy" && (
            <div className="bg-background rounded-2xl border border-border p-5 space-y-5">
              <h2 className="font-black text-lg">Privacidad</h2>
              <p className="text-sm text-muted-foreground">Controla quién puede ver tu información</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                  <div>
                    <Label className="font-semibold text-sm">Perfil público</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Otros usuarios pueden ver tu perfil básico</p>
                  </div>
                  <Switch checked={profilePublic} onCheckedChange={setProfilePublic} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl">
                  <div>
                    <Label className="font-semibold text-sm">Aparecer en el directorio</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Tu perfil aparece en búsquedas de la comunidad</p>
                  </div>
                  <Switch checked={showInDirectory} onCheckedChange={setShowInDirectory} />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 font-semibold">🔒 Tus datos nutricionales, métricas y diario siempre son privados y nunca se comparten con terceros.</p>
              </div>

              <Button
                onClick={() => { toast.success("Configuración de privacidad guardada"); }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold"
              >
                Guardar configuración
              </Button>
            </div>
          )}

          {/* DATA */}
          {section === "data" && (
            <div className="bg-background rounded-2xl border border-border p-5 space-y-5">
              <h2 className="font-black text-lg">Mis datos</h2>
              <p className="text-sm text-muted-foreground">Exporta o elimina tu cuenta y todos tus datos</p>

              <div className="space-y-3">
                <div className="p-4 bg-muted/20 rounded-xl">
                  <h3 className="font-bold text-sm mb-1">📦 Exportar mis datos</h3>
                  <p className="text-xs text-muted-foreground mb-3">Descarga todos tus datos en formato JSON: perfil, diario nutricional, métricas, recetas favoritas, menús y más.</p>
                  <Button
                    onClick={handleExportData}
                    disabled={exportLoading}
                    variant="outline"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    {exportLoading ? "Procesando..." : "Solicitar exportación"}
                  </Button>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <h3 className="font-bold text-sm text-red-700 mb-1">⚠️ Eliminar cuenta</h3>
                  <p className="text-xs text-red-600 mb-3">Esta acción es irreversible. Se eliminarán todos tus datos, historial, menús y suscripciones.</p>
                  {!deleteConfirm ? (
                    <Button
                      onClick={() => setDeleteConfirm(true)}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Eliminar mi cuenta
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-red-700">¿Estás seguro? Esta acción no se puede deshacer.</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => { toast.error("Para eliminar tu cuenta, contacta con soporte@buddymarket.io"); setDeleteConfirm(false); }}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs"
                        >
                          Sí, eliminar
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(false)}
                          variant="outline"
                          className="text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION */}
          {section === "subscription" && (
            <div className="bg-background rounded-2xl border border-border p-5 space-y-5">
              <h2 className="font-black text-lg">Suscripción</h2>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-orange-700 text-lg">Plan {planLabel[plan] ?? "Free"}</span>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">{plan === "free" ? "Gratuito" : "Activo"}</Badge>
                </div>
                {plan === "free" && (
                  <p className="text-xs text-orange-600 mb-3">Actualiza a Pro para desbloquear menús ilimitados, análisis avanzados y más.</p>
                )}
              </div>

              {plan === "free" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-sm">Planes disponibles</h3>
                  {[
                    { name: "Pro", price: "9,99€/mes", features: ["Menús ilimitados", "Análisis nutricional avanzado", "Recetas premium", "Sin anuncios"] },
                    { name: "Pro Max", price: "19,99€/mes", features: ["Todo lo de Pro", "Acceso a BuddyExperts", "Menús familiares", "Exportación de datos", "Soporte prioritario"] },
                  ].map(p => (
                    <div key={p.name} className="p-4 bg-muted/20 rounded-xl border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black">{p.name}</span>
                        <span className="font-bold text-orange-600">{p.price}</span>
                      </div>
                      <ul className="space-y-1 mb-3">
                        {p.features.map(f => (
                          <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="text-green-500">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => { toast.info("Próximamente disponible. Contacta con soporte para activar tu plan."); }}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold text-sm"
                      >
                        Activar {p.name}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {plan !== "free" && (
                <div className="space-y-3">
                  <button
                    onClick={() => { toast.info("Para gestionar tu facturación, contacta con soporte@buddymarket.io"); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💳</span>
                      <div className="text-left">
                        <p className="text-sm font-semibold">Gestionar facturación</p>
                        <p className="text-xs text-muted-foreground">Facturas, método de pago, cancelar</p>
                      </div>
                    </div>
                    <span className="text-muted-foreground">›</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
