import "dotenv/config";
// Sentry MUST be initialised before any other imports that may throw
import { initSentry, attachSentryRequestHandler, attachSentryErrorHandler, captureException } from "./sentry";
initSentry();

import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerSSORoutes } from "../sso";
import { registerMobileApi } from "../mobileApi";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe-webhook";
import { processPendingEmails } from "../email";
import { storagePut } from "../storage";
import logger from "./logger";
import { registerMetricsRoutes } from "./metrics";
import { startPerformanceWatchdog, sendStartupAlert, startSupabaseMonitor } from "./alerts";
import { registerOGRoutes } from "../og";
import { registerSitemapRoutes } from "../sitemap";

// ─── Allowed origins ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://buddymarket-ndjzmo7p.manus.space",
  "https://buddymarket.io",
  "https://www.buddymarket.io",
];

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy (needed for rate limiting behind load balancers / Manus proxy)
  app.set("trust proxy", 1);

  // ─── Security headers (Helmet) ────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://js.stripe.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://accounts.google.com",
          "https://appleid.cdn-apple.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://accounts.google.com",
          "https://appleid.apple.com",
          "wss:",
          "ws:",
        ],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://accounts.google.com"],
        objectSrc: ["'none'"],
        // Permitir redirigir a Google y Apple para OAuth (importante para Safari iOS)
        formAction: ["'self'", "https://accounts.google.com", "https://appleid.apple.com"],
        upgradeInsecureRequests: [],
      },
    },
    // Disable COEP to allow Google Maps and Stripe iframes
    crossOriginEmbedderPolicy: false,
    // HSTS: enforce HTTPS for 1 year
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // ─── Sentry request context ───────────────────────────────────────────────
  attachSentryRequestHandler(app);

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      logger.warn(`[CORS] Blocked request from origin: ${origin}`);
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  }));

  // ─── Rate limiting ────────────────────────────────────────────────────────
  // Global limiter: 300 req/min per IP
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Inténtalo de nuevo en un minuto." },
    skip: (req) => req.path.startsWith("/api/stripe"), // skip webhook
  });

  // Strict limiter for auth endpoints: 20 req/min per IP
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiados intentos de autenticación. Inténtalo más tarde." },
  });

  // AI generation limiter: 10 req/min per IP (expensive operations)
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Límite de generación IA alcanzado. Espera un minuto." },
  });

  app.use(globalLimiter);
  app.use("/api/trpc/buddyIA", aiLimiter);

  // ─── Stripe webhook (raw body, BEFORE express.json) ───────────────────────
  registerStripeWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Request logging ──────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    if (req.path.startsWith("/api/") && !req.path.startsWith("/api/stripe/webhook")) {
      logger.debug(`[HTTP] ${req.method} ${req.path}`);
    }
    next();
  });

  // SSO: Sign in with Apple & Google
  registerSSORoutes(app);
  // Mobile REST API (iOS native app)
  registerMobileApi(app);

  // ─── Upload inventory photo to S3 (multipart) ──────────────────────────────
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } });
  app.post("/api/upload-inventory-photo", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });
      const ext = (req.file.originalname || "photo.jpg").split(".").pop() ?? "jpg";
      const key = `inventory-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype || "image/jpeg");
      return res.json({ url });
    } catch (err) {
      logger.error("[upload-inventory-photo] error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  // ─── Debug headers endpoint (temporal) ──────────────────────────────────────
  app.get("/api/debug-headers", (req: any, res: any) => {
    res.json({
      host: req.get("host"),
      protocol: req.protocol,
      xForwardedHost: req.headers["x-forwarded-host"],
      xForwardedProto: req.headers["x-forwarded-proto"],
      xForwardedFor: req.headers["x-forwarded-for"],
    });
  });

  // ─── Health check endpoint ──────────────────────────────────────
  const startTime = Date.now();
  app.get("/api/health", async (_req: any, res: any) => {
    const uptimeMs = Date.now() - startTime;
    const uptimeSec = Math.floor(uptimeMs / 1000);
    const uptimeFormatted = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;

    // Quick DB ping
    let dbStatus: "ok" | "error" = "ok";
    let dbLatencyMs: number | null = null;
    try {
      const dbStart = Date.now();
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      await db.execute("SELECT 1");
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = "error";
    }

    let pkg: { version?: string } = {};
    try {
      pkg = JSON.parse(
        (await import("fs")).readFileSync(new URL("../../package.json", import.meta.url), "utf8")
      );
    } catch {
      // En producción el path puede no existir; usamos versión por defecto
      pkg = { version: "1.0.0" };
    }

    const health = {
      ok: dbStatus === "ok",
      version: pkg.version ?? "1.0.0",
      environment: process.env.NODE_ENV ?? "development",
      uptime: uptimeFormatted,
      uptimeMs,
      timestamp: new Date().toISOString(),
      db: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };

    const statusCode = health.ok ? 200 : 503;
    return res.status(statusCode).json(health);
  });

   // ─── Metrics endpoints ───────────────────────────────────
  registerMetricsRoutes(app);
  // ─── Open Graph (social media bots) ──────────────────────────────────────
  registerOGRoutes(app);
  // ─── Sitemap & robots.txt ─────────────────────────────────────────────────
  registerSitemapRoutes(app);
  // ─── tRPC API ─────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          logger.error(`[tRPC] Error in procedure ${path}:`, error);
          captureException(error, { tags: { "trpc.path": path ?? "unknown" } });
        }
      },
    })
  );

  // ─── Universal Links / App Links (iOS + Android) ──────────────────────────
  import("path").then(({ default: path }) => {
    const aasaPath = path.resolve(import.meta.dirname, "../../client/public/.well-known/apple-app-site-association");
    const assetlinksPath = path.resolve(import.meta.dirname, "../../client/public/.well-known/assetlinks.json");
    app.get("/.well-known/apple-app-site-association", (_req: any, res: any) => {
      res.setHeader("Content-Type", "application/json");
      res.sendFile(aasaPath);
    });
    app.get("/apple-app-site-association", (_req: any, res: any) => {
      res.setHeader("Content-Type", "application/json");
      res.sendFile(aasaPath);
    });
    app.get("/.well-known/assetlinks.json", (_req: any, res: any) => {
      res.setHeader("Content-Type", "application/json");
      res.sendFile(assetlinksPath);
    });
  });
  // ─── Error logger middleware (captura errores 4xx/5xx en DB) ──────────────
  app.use(async (err: Error & { status?: number; statusCode?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = (err as { status?: number; statusCode?: number }).status ?? (err as { status?: number; statusCode?: number }).statusCode ?? 500;
    // Solo registrar errores de servidor (5xx) y algunos 4xx relevantes
    if (statusCode >= 400) {
      try {
        const { insertServerLog } = await import("../db.js");
        const ctx = (req as { trpcContext?: { user?: { id: number } } }).trpcContext;
        await insertServerLog({
          level: statusCode >= 500 ? "error" : "warn",
          message: err.message || "Unknown error",
          stack: err.stack,
          path: req.path,
          method: req.method,
          statusCode,
          userId: ctx?.user?.id,
          userAgent: req.headers["user-agent"],
          ip: req.ip,
          metadata: {
            query: req.query,
            body: statusCode >= 500 ? undefined : req.body,
          },
        });
      } catch {
        // No propagar errores del logger
      }
    }
    next(err);
  });

  // ─── Sentry error handler (MUST be after all routes) ────────────────────
  attachSentryErrorHandler(app);

  // ─── Frontend ─────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
    // Start performance watchdog after server is up
    startPerformanceWatchdog();
    startSupabaseMonitor();
    sendStartupAlert().catch(() => {});
    // Start API health monitor job (every 5 min)
    import("../apiMonitor").then(({ startMonitorJob }) => {
      startMonitorJob(`http://localhost:${port}`);
    }).catch((e) => logger.warn("[Monitor] Failed to start monitor job:", e));
  });
}

startServer().catch((err) => {
  logger.error("Failed to start server:", err);
  captureException(err);
  process.exit(1);
});

// ─── Email Sequence Scheduler (every 15 min) ───────────────────────────────
setTimeout(() => {
  processPendingEmails().catch((err) => logger.error("[Email] Scheduler error:", err));
  setInterval(() => {
    processPendingEmails().catch((err) => logger.error("[Email] Scheduler error:", err));
  }, 15 * 60 * 1000);
  logger.info("[Email] Sequence scheduler started (every 15 min)");
}, 5000);

// ─── Database Backup Scheduler (daily at 03:00 UTC) ──────────────────────────
function scheduleNextBackup() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(3, 0, 0, 0); // 03:00 UTC
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1); // tomorrow if past
  const msUntilNext = next.getTime() - now.getTime();
  const hoursUntil = (msUntilNext / 3600000).toFixed(1);
  logger.info(`[Backup] Next backup scheduled in ${hoursUntil}h (${next.toISOString()})`);
  setTimeout(async () => {
    logger.info("[Backup] Starting scheduled database backup...");
    try {
      const { execFileSync } = await import("child_process");
      execFileSync("node", ["scripts/db-backup.mjs"], {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 5 * 60 * 1000, // 5 min timeout
      });
      logger.info("[Backup] Scheduled backup completed successfully");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("[Backup] Scheduled backup failed:", message);
    }
    scheduleNextBackup(); // schedule next day
  }, msUntilNext);
}

if (process.env.NODE_ENV === "production") {
  scheduleNextBackup();
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Exported so startServer() can register the HTTP server for draining
let _httpServer: ReturnType<typeof import("http").createServer> | null = null;

export function registerServerForShutdown(srv: ReturnType<typeof import("http").createServer>) {
  _httpServer = srv;
}

async function gracefulShutdown(signal: string) {
  logger.info(`[Shutdown] Received ${signal} — starting graceful shutdown...`);

  // 1. Stop accepting new connections
  if (_httpServer) {
    await new Promise<void>((resolve) => {
      _httpServer!.close(() => {
        logger.info("[Shutdown] HTTP server closed — no more new connections");
        resolve();
      });
      // Force close after 15s
      setTimeout(() => {
        logger.warn("[Shutdown] Forcing close after 15s timeout");
        resolve();
      }, 15_000);
    });
  }

  // 2. Notify Slack (only in production to avoid alert spam during development)
  if (process.env.NODE_ENV === "production") {
    try {
      const { alert: sendAlert } = await import("./alerts");
      await sendAlert("info", `BuddyMarket server shutting down (${signal})`, {
        message: `Graceful shutdown initiated. Signal: ${signal}`,
      });
    } catch { /* ignore */ }
  }

  // 3. Flush Sentry events
  try {
    const SentryModule = await import("@sentry/node");
    await SentryModule.flush(2000).catch(() => {});
  } catch { /* ignore */ }

  logger.info("[Shutdown] Graceful shutdown complete. Exiting.");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions — log + alert before crashing
process.on("uncaughtException", (err) => {
  logger.error("[Process] Uncaught exception:", err);
  try {
    const { captureException } = require("./sentry");
    captureException(err);
  } catch { /* ignore */ }
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("[Process] Unhandled promise rejection:", reason);
});
