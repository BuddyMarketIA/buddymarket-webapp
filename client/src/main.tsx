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

import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';

// ── RELOAD → LOGIN ────────────────────────────────────────────────────────────
// sessionStorage is cleared on every page reload (unlike localStorage).
// If the user reloads the page and there is no active-session flag in
// sessionStorage, we clear the persistent cookie and send them to /login.
// The flag is set by LoginPage after a successful login.
// Exempt: /login, /buddy-setup, /reset-password, /api/*, public pages.
(function enforceSessionOnReload() {
  try {
    const path = window.location.pathname;
    const isPublicPath =
      path === '/login' ||
      path.startsWith('/login') ||
      path === '/' ||
      path.startsWith('/blog') ||
      path.startsWith('/nutricionistas') ||
      path.startsWith('/empresas') ||
      path.startsWith('/calculadora') ||
      path.startsWith('/faq') ||
      path.startsWith('/about') ||
      path.startsWith('/terms') ||
      path.startsWith('/privacy') ||
      path.startsWith('/cookies') ||
      path.startsWith('/registration') ||
      path.startsWith('/activar') ||
      path.startsWith('/reset-password') ||
      path.startsWith('/buddy-setup') ||
      path.startsWith('/onboarding') ||
      path.startsWith('/api') ||
      path.startsWith('/experts') ||
      path.startsWith('/creators') ||
      path.startsWith('/plan/') ||
      path.startsWith('/familia/unirse');

    if (isPublicPath) return;

    const hasActiveSession = sessionStorage.getItem('bm_session_active') === '1';
    if (!hasActiveSession) {
      // Clear the persistent cookie so the server also sees no session
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=None; Secure`;
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      window.location.replace('/login');
    }
  } catch (_) {
    // Silently ignore — never block the app from loading
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
