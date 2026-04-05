import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerSSORoutes } from "../sso";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe-webhook";
import { processPendingEmails } from "../email";
import { storagePut } from "../storage";
import logger from "./logger";

// ─── Allowed origins ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://buddymarket-ndjzmo7p.manus.space",
  "https://www.appbuddymarket.com",
  "https://appbuddymarket.com",
  "https://buddymarketapp.com",
  "https://www.buddymarketapp.com",
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
  app.use("/api/oauth", authLimiter);
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

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // SSO: Sign in with Apple & Google
  registerSSORoutes(app);

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

  // ─── tRPC API ─────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          logger.error(`[tRPC] Error in procedure ${path}:`, error);
        }
      },
    })
  );

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
  });
}

startServer().catch((err) => {
  logger.error("Failed to start server:", err);
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
