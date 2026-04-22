/**
 * usePushNotifications
 * Hook to manage Web Push notification subscriptions.
 * Handles permission request, subscription creation/deletion,
 * and syncing with the server.
 */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  const saveSub = trpc.notifications.savePushSubscription.useMutation();
  const removeSub = trpc.notifications.removePushSubscription.useMutation();
  const sendTest = trpc.notifications.inApp.sendTestPush.useMutation();

  // Check current state on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          setIsSubscribed(true);
          setCurrentEndpoint(sub.endpoint);
        }
      })
      .catch(() => {});
  }, []);

  /**
   * Request permission and subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Tu navegador no soporta notificaciones push");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      toast.error("Configuración de notificaciones no disponible");
      return false;
    }

    setIsLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);

      if (perm !== "granted") {
        toast.error("Permiso de notificaciones denegado");
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const reg = await navigator.serviceWorker.ready;

      // Unsubscribe from any existing subscription first
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Subscribe with VAPID key
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = sub.toJSON();
      const p256dh = subJson.keys?.p256dh ?? "";
      const auth = subJson.keys?.auth ?? "";

      if (!p256dh || !auth) {
        throw new Error("Invalid subscription keys");
      }

      // Save to server
      await saveSub.mutateAsync({
        endpoint: sub.endpoint,
        p256dh,
        auth,
        userAgent: navigator.userAgent.slice(0, 200),
      });

      setIsSubscribed(true);
      setCurrentEndpoint(sub.endpoint);

      // Send a test notification
      sendTest.mutate(undefined, {
        onError: () => {}, // Ignore test errors
      });

      toast.success("✅ Notificaciones push activadas");
      return true;
    } catch (err: any) {
      console.error("[PushNotifications] Subscribe error:", err);
      toast.error("Error al activar notificaciones: " + (err?.message || "Error desconocido"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveSub, sendTest]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await removeSub.mutateAsync({ endpoint });
      }

      setIsSubscribed(false);
      setCurrentEndpoint(null);
      toast.success("Notificaciones push desactivadas");
      return true;
    } catch (err: any) {
      console.error("[PushNotifications] Unsubscribe error:", err);
      toast.error("Error al desactivar notificaciones");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [removeSub]);

  /**
   * Toggle subscription state
   */
  const toggle = useCallback(async () => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported: permission !== "unsupported",
    subscribe,
    unsubscribe,
    toggle,
  };
}
