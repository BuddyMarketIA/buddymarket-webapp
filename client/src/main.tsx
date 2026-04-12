import { trpc } from "@/lib/trpc";

// ── Service Worker Registration ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => console.log('[SW] Registered:', reg.scope))
      .catch((err) => console.warn('[SW] Registration failed:', err));
  });
}
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import "@/lib/i18n"; // i18n must be initialized before App renders

// Detect server-down / HTML-instead-of-JSON errors (e.g. 502 from sandbox waking up)
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry up to 3 times for server-down errors, with exponential backoff
      retry: (failureCount, error) => {
        if (isServerDownError(error)) return failureCount < 3;
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 30_000,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations automatically (could cause duplicate actions)
        // But do retry server-down errors once
        if (isServerDownError(error)) return failureCount < 1;
        return false;
      },
      retryDelay: 2000,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = "/login";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    // Only log non-server-down errors to avoid noise
    if (!isServerDownError(error)) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (!isServerDownError(error)) {
      console.error("[API Mutation Error]", error);
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
