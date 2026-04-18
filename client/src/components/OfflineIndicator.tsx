/**
 * OfflineIndicator — Banner/pill que muestra el estado de conexión
 *
 * Aparece automáticamente cuando el usuario pierde la conexión.
 * Muestra el número de acciones pendientes de sincronizar.
 * Desaparece cuando se recupera la conexión y se sincronizan los datos.
 */
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { WifiIcon, ArrowPathIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    }
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Nothing to show when online and no pending items
  if (isOnline && !showReconnected && pendingCount === 0) return null;

  // Reconnected banner
  if (isOnline && showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center">
        <div className="mt-safe-top mx-4 mt-2 flex items-center gap-2 rounded-2xl bg-green-500 px-4 py-2.5 shadow-lg text-white text-sm font-semibold animate-in slide-in-from-top-2">
          <WifiIcon className="h-4 w-4" />
          Conexión restaurada
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-background/20 px-2 py-0.5 text-xs">
              Sincronizando {pendingCount} acción{pendingCount > 1 ? "es" : ""}…
            </span>
          )}
        </div>
      </div>
    );
  }

  // Offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center">
        <div className="mt-safe-top mx-4 mt-2 flex items-center gap-2 rounded-2xl bg-gray-800 px-4 py-2.5 shadow-lg text-white text-sm font-semibold">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 shrink-0" />
          <span>Sin conexión — modo offline</span>
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-background/10 px-2 py-0.5 text-xs text-gray-300">
              {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Online but with pending sync items
  if (isOnline && pendingCount > 0) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 shadow-lg text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-70"
        >
          {isSyncing ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <CloudArrowUpIcon className="h-4 w-4" />
          )}
          {isSyncing ? "Sincronizando…" : `Sincronizar (${pendingCount})`}
        </button>
      </div>
    );
  }

  return null;
}
