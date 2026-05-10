import { trpc } from "@/lib/trpc";

// ── SERVICE WORKER REGISTRATION ──────────────────────────────────────────────
// Register the offline-capable Service Worker in production.
// In development (Vite HMR) we skip registration to avoid conflicts.
(async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (newSW) {
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — send skip-waiting
              newSW.postMessage({ type: 'BM_SKIP_WAITING' });
            }
          });
        }
      });
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
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
//
// IMPORTANT: "Please login (10001)" is also the message returned by ALL
// protectedProcedures in our own server (UNAUTHED_ERR_MSG in shared/const.ts).
// We must NOT redirect to /login when a protectedProcedure returns UNAUTHORIZED
// if the user was previously authenticated — that happens transiently on cold
// starts when the server wakes up but the cookie is still valid.
// Only redirect if the user was never authenticated in this browser session.
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // Guard: error may be null/undefined if the query was cancelled
    if (!error) return;
    if (!isServerDownError(error)) {
      console.warn("[API Query Error]", error);
    }
    // Do NOT auto-redirect to /login from background queries.
    // The useAuth hook and AppLayout handle auth-based redirects correctly.
    // Auto-redirecting here causes logout on cold starts and transient 401s.
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    // Guard: error may be null/undefined if the mutation was cancelled
    if (!error) return;
    if (!isServerDownError(error)) {
      console.warn("[API Mutation Error]", error);
    }
    // Do NOT auto-redirect to /login from mutations.
    // The useAuth hook handles session expiry detection correctly.
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
