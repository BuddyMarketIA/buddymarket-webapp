/**
 * Sentry Observability Module
 * Provides error reporting, performance monitoring, and structured alerting.
 *
 * Usage:
 *   1. Set SENTRY_DSN in environment variables (Settings → Secrets)
 *   2. Import initSentry() and call it BEFORE any other server code
 *   3. Use sentryTrpcMiddleware() in tRPC router for per-procedure tracking
 *   4. Use captureException() / captureMessage() for manual reporting
 */

import * as Sentry from "@sentry/node";
import type { Express, Request, Response, NextFunction } from "express";

// ─── Initialisation ──────────────────────────────────────────────────────────

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn("[Sentry] SENTRY_DSN not set — error reporting disabled. Set it in Settings → Secrets.");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: process.env.npm_package_version ?? "unknown",

    // Performance: capture 100% of transactions in dev, 20% in prod
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Profiling: capture 10% of profiled transactions in prod
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Ignore common non-actionable errors
    ignoreErrors: [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "BAD_REQUEST",
      "ResizeObserver loop limit exceeded",
    ],

    beforeSend(event) {
      // Strip PII from request bodies
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        const sensitiveKeys = ["password", "token", "secret", "card", "cvv", "ssn"];
        for (const key of sensitiveKeys) {
          if (key in data) data[key] = "[REDACTED]";
        }
      }
      return event;
    },
  });

  console.info(`[Sentry] Initialized — env: ${process.env.NODE_ENV}, DSN: ${dsn.slice(0, 30)}...`);
}

// ─── Express Middleware ───────────────────────────────────────────────────────

/**
 * Attach Sentry request handler BEFORE all routes.
 * Captures request context for every transaction.
 */
export function attachSentryRequestHandler(app: Express): void {
  if (!process.env.SENTRY_DSN) return;
  // Sentry v8+ uses setupExpressErrorHandler instead of requestHandler
  // We manually set user context via a lightweight middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user) {
      Sentry.setUser({ id: String(user.id), email: user.email });
    }
    Sentry.setTag("request_id", req.headers["x-request-id"] as string ?? crypto.randomUUID());
    next();
  });
}

/**
 * Attach Sentry error handler AFTER all routes and other error handlers.
 * Must be the last middleware registered.
 */
export function attachSentryErrorHandler(app: Express): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setupExpressErrorHandler(app);
}

// ─── tRPC Middleware ──────────────────────────────────────────────────────────

/**
 * tRPC middleware that reports errors to Sentry and tracks performance spans.
 * Add to protectedProcedure and publicProcedure in trpc.ts.
 *
 * Example:
 *   const t = initTRPC.context<Context>().create({ transformer: superjson });
 *   export const publicProcedure = t.procedure.use(sentryTrpcMiddleware);
 */
export const sentryTrpcMiddleware = async (opts: {
  path: string;
  type: string;
  next: () => Promise<unknown>;
  ctx: unknown;
  rawInput: unknown;
}) => {
  const { path, type, next } = opts;

  return await Sentry.startSpan(
    {
      name: `trpc.${type}.${path}`,
      op: "trpc",
      attributes: {
        "trpc.path": path,
        "trpc.type": type,
      },
    },
    async (span) => {
      try {
        const result = await next();
        span?.setStatus({ code: 1 }); // OK
        return result;
      } catch (error) {
        span?.setStatus({ code: 2, message: "error" }); // ERROR

        // Only report unexpected errors (not client errors like UNAUTHORIZED)
        if (error instanceof Error) {
          const trpcCode = (error as any).code as string | undefined;
          const clientErrors = ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST", "CONFLICT"];
          if (!trpcCode || !clientErrors.includes(trpcCode)) {
            Sentry.captureException(error, {
              tags: { "trpc.path": path, "trpc.type": type },
              extra: { trpcCode },
            });
          }
        }
        throw error;
      }
    }
  );
};

// ─── Manual helpers ───────────────────────────────────────────────────────────

export const captureException = Sentry.captureException.bind(Sentry);
export const captureMessage = Sentry.captureMessage.bind(Sentry);
export const setUser = Sentry.setUser.bind(Sentry);
export const setTag = Sentry.setTag.bind(Sentry);
export const addBreadcrumb = Sentry.addBreadcrumb.bind(Sentry);
