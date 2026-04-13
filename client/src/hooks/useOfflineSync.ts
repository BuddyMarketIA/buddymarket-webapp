/**
 * useOfflineSync — Hook para gestionar el estado offline y la cola de sincronización
 *
 * Funcionalidades:
 * - Detecta si el usuario está offline/online
 * - Muestra el número de acciones pendientes de sincronizar
 * - Dispara la sincronización manual o automática al recuperar conexión
 * - Escucha mensajes del Service Worker (SYNC_COMPLETE, PENDING_COUNT)
 */
import { useState, useEffect, useCallback } from "react";

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  triggerSync: () => void;
  clearApiCache: () => void;
}

export function useOfflineSync(): OfflineSyncState {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // Get pending count from SW
  const refreshPendingCount = useCallback(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "GET_PENDING_COUNT" });
    }
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(() => {
    if (!isOnline) return;
    setIsSyncing(true);
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "TRIGGER_SYNC" });
    }
    // Also try Background Sync API
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if ("sync" in reg) {
          (reg as any).sync.register("replay-mutations").catch(() => {});
        }
      });
    }
    // Fallback: reset syncing state after 5s
    setTimeout(() => setIsSyncing(false), 5000);
  }, [isOnline]);

  // Clear API cache (force fresh data)
  const clearApiCache = useCallback(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_API_CACHE" });
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      setTimeout(() => {
        triggerSync();
        refreshPendingCount();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for SW messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_COMPLETE") {
        setIsSyncing(false);
        setLastSyncAt(new Date());
        setPendingCount(0);
      }
      if (event.data?.type === "PENDING_COUNT") {
        setPendingCount(event.data.count ?? 0);
      }
      if (event.data?.type === "API_CACHE_CLEARED") {
        // Optionally notify user
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    // Initial pending count
    refreshPendingCount();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [triggerSync, refreshPendingCount]);

  return { isOnline, pendingCount, isSyncing, lastSyncAt, triggerSync, clearApiCache };
}
