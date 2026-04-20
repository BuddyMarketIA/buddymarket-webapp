import { trpc } from "@/lib/trpc";

// ── ELIMINAR TODOS LOS SERVICE WORKERS Y CACHÉS ──────────────────────────────
// El SW causaba "Unexpected token '<'" en TODAS las peticiones de la app.
// Eliminamos agresivamente cualquier SW registrado y todas las cachés.
(async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (_) {
    // Ignorar errores silenciosamente
  }
})();


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import "@/lib/i18n"; // i18n must be initialized before App renders

// Detect server-down / HTML-instead-of-JSON errors (e.g. 502 from sandbox waking up)
const SERVER_DOWN_PATTERNS = [
  "<!DOCTYPE", "<!doctype", "not valid JSON", "Failed to fetch",
  "NetworkError", "SERVER_DOWN", "502", "503", "504",
];
const isServerDownError = (error: unknown): boolean => {
  if (!(error instanceof TRPCClientError)) return false;
  const msg = error.message ?? "";
  return SERVER_DOWN_PATTERNS.some((p) => msg.includes(p));
};

// Custom fetch that intercepts HTML responses BEFORE tRPC tries to parse them.
// Converts the cryptic "Unexpected token '<'" into a clear SERVER_DOWN error.
const safeFetch: typeof globalThis.fetch = async (input, init) => {
  const response = await globalThis.fetch(input, {
    ...(init ?? {}),
    credentials: "include",
  });
  // If the server returned HTML (502/503/504 from proxy), intercept it
  const contentType = response.headers.get("content-type") ?? "";
  if (
    !response.ok &&
    (contentType.includes("text/html") || contentType.includes("text/plain"))
  ) {
    // Return a fake JSON error response that tRPC can parse cleanly
    const errorBody = JSON.stringify([{
      error: {
        json: {
          message: `SERVER_DOWN: HTTP ${response.status} — el servidor está arrancando, reintentando...`,
          code: -32603,
          data: { code: "INTERNAL_SERVER_ERROR", httpStatus: response.status },
        }
      }
    }]);
    return new Response(errorBody, {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  }
  return response;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Retry up to 4 times for server-down errors (cold start can take ~10s)
        if (isServerDownError(error)) return failureCount < 4;
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1500 * 2 ** attemptIndex, 15000),
      staleTime: 30_000,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Only retry once for mutations to avoid double-submitting
        if (isServerDownError(error)) return failureCount < 1;
        return false;
      },
      retryDelay: 3000,
    },
  },
});

// NOTE: We intentionally do NOT redirect to /login on UNAUTHORIZED errors here.
// Transient network errors, server cold-starts, and background refetches can
// temporarily return 401 even for authenticated users. The session is managed
// by the cookie (1-year expiry) and the useAuth hook, which only redirects
// on a definitive 401 after the user has never authenticated.
// Redirecting here would log users out every ~2 minutes on any network blip.

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    if (!isServerDownError(error)) {
      console.warn("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    if (!isServerDownError(error)) {
      console.warn("[API Mutation Error]", error);
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: safeFetch,
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
