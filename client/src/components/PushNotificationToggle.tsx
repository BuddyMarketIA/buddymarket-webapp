/**
 * PushNotificationToggle
 * A card component that allows users to enable/disable push notifications.
 * Shows current permission state and subscription status.
 */

import { Bell, BellOff, BellRing, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationToggleProps {
  /** Whether to show as a compact inline toggle or a full card */
  variant?: "card" | "inline";
  className?: string;
}

export function PushNotificationToggle({
  variant = "card",
  className = "",
}: PushNotificationToggleProps) {
  const { permission, isSubscribed, isLoading, isSupported, toggle } = usePushNotifications();

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  if (variant === "inline") {
    return (
      <div className={`flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <BellRing className="h-4 w-4 text-orange-500" />
          ) : (
            <BellOff className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm font-medium">
            Notificaciones push
          </span>
        </div>
        <div className="flex items-center gap-2">
          {permission === "denied" ? (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Bloqueadas
            </span>
          ) : (
            <Switch
              checked={isSubscribed}
              onCheckedChange={toggle}
              disabled={isLoading}
              aria-label="Activar notificaciones push"
            />
          )}
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isSubscribed ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {isSubscribed ? (
            <BellRing className="h-5 w-5 text-orange-500" />
          ) : (
            <Bell className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm">Notificaciones push</h3>
            {permission === "denied" ? (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Bloqueadas
              </span>
            ) : (
              <Switch
                checked={isSubscribed}
                onCheckedChange={toggle}
                disabled={isLoading}
                aria-label="Activar notificaciones push"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {permission === "denied"
              ? "Activa los permisos en la configuración de tu navegador para recibir notificaciones."
              : isSubscribed
              ? "Recibirás recordatorios semanales de peso y registro diario de comidas."
              : "Activa para recibir recordatorios de registro de peso y diario nutricional."}
          </p>
          {isSubscribed && (
            <div className="mt-2 flex flex-wrap gap-1">
              {["⚖️ Peso semanal", "🍽️ Diario diario"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 text-xs text-orange-700 dark:text-orange-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Procesando...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
