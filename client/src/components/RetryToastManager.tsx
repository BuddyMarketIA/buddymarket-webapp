/**
 * RetryToastManager
 *
 * Componente que detecta reintentos automáticos del interceptor tRPC
 * y muestra un toast discreto al usuario para informarle de que la
 * conexión se está recuperando.
 *
 * Se suscribe a los eventos de QueryCache y MutationCache para detectar
 * cuando una query o mutation está en estado de reintento.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";

const isServerDownError = (error: unknown): boolean => {
  if (!(error instanceof TRPCClientError)) return false;
  const msg = error.message ?? "";
  return (
    msg.includes("<!DOCTYPE") ||
    msg.includes("<!doctype") ||
    msg.includes("not valid JSON") ||
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("502") ||
    msg.includes("503")
  );
};

export function RetryToastManager() {
  const queryClient = useQueryClient();
  // Track active retry toast ID to avoid duplicates
  const retryToastIdRef = useRef<string | number | null>(null);
  // Track number of queries currently retrying
  const retryingCountRef = useRef(0);

  useEffect(() => {
    const showRetryToast = () => {
      retryingCountRef.current += 1;
      if (retryToastIdRef.current !== null) return; // already showing

      retryToastIdRef.current = toast.loading(
        "Reconectando con el servidor…",
        {
          id: "trpc-retry",
          description: "Reintentando automáticamente. Por favor espera.",
          duration: Infinity, // stays until dismissed
        }
      );
    };

    const hideRetryToast = () => {
      retryingCountRef.current = Math.max(0, retryingCountRef.current - 1);
      if (retryingCountRef.current > 0) return; // others still retrying

      if (retryToastIdRef.current !== null) {
        toast.dismiss("trpc-retry");
        retryToastIdRef.current = null;
        // Show brief success toast to confirm reconnection
        toast.success("Conexión restaurada", {
          id: "trpc-reconnected",
          duration: 3000,
        });
      }
    };

    const unsubscribeQuery = queryClient.getQueryCache().subscribe((event) => {
      if (!event) return;

      // Detect retry start: query transitions to fetching after an error
      if (
        event.type === "updated" &&
        event.action.type === "fetch" &&
        event.query.state.fetchFailureCount > 0 &&
        isServerDownError(event.query.state.fetchFailureReason)
      ) {
        showRetryToast();
      }

      // Detect retry success or final failure
      if (event.type === "updated" && event.action.type === "success") {
        if (retryToastIdRef.current !== null) {
          hideRetryToast();
        }
      }

      // Detect final failure (no more retries)
      if (
        event.type === "updated" &&
        event.action.type === "error" &&
        isServerDownError(event.action.error)
      ) {
        // If we were showing a retry toast, dismiss it and show error
        if (retryToastIdRef.current !== null) {
          toast.dismiss("trpc-retry");
          retryToastIdRef.current = null;
          retryingCountRef.current = 0;
          toast.error("No se pudo conectar con el servidor", {
            id: "trpc-failed",
            description: "Comprueba tu conexión a internet e inténtalo de nuevo.",
            duration: 6000,
          });
        }
      }
    });

    return () => {
      unsubscribeQuery();
    };
  }, [queryClient]);

  // This component renders nothing — it only manages toasts as a side effect
  return null;
}
