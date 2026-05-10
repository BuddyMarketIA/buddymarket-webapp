/**
 * Centralised structured logger (Winston)
 *
 * Development: coloured human-readable output to stdout
 * Production:  JSON lines to stdout (compatible with Datadog, ELK, CloudWatch)
 *
 * Log levels (lowest → highest severity):
 *   debug → info → warn → error
 *
 * Environment variables:
 *   LOG_LEVEL   — override default level (e.g. "debug" in prod for troubleshooting)
 *   NODE_ENV    — "production" switches to JSON format
 */

import winston from "winston";
import path from "path";
import fs from "fs";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isDev = process.env.NODE_ENV !== "production";
const logLevel = process.env.LOG_LEVEL ?? (isDev ? "debug" : "info");

// ─── Custom dev format ────────────────────────────────────────────────────────

const devFormat = printf(({ level, message, timestamp: ts, stack, service, requestId, userId, ...meta }) => {
  const parts: string[] = [`[${ts}]`, `${level}:`];
  if (requestId) parts.push(`[req:${requestId}]`);
  if (userId) parts.push(`[user:${userId}]`);
  parts.push(String(stack || message));
  const metaKeys = Object.keys(meta);
  if (metaKeys.length) parts.push(JSON.stringify(meta));
  return parts.join(" ");
});

// ─── Production JSON format ───────────────────────────────────────────────────
// Adds standard fields for ELK/Datadog ingestion

const prodFormat = combine(
  errors({ stack: true }),
  timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
  json()
);

// ─── Transports ───────────────────────────────────────────────────────────────

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isDev
      ? combine(errors({ stack: true }), timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }), colorize(), devFormat)
      : prodFormat,
  }),
];

// In production, also write error logs to a file for post-mortem analysis
if (!isDev) {
  try {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
        format: prodFormat,
        maxsize: 10 * 1024 * 1024, // 10 MB
        maxFiles: 5,
        tailable: true,
      })
    );

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
        format: prodFormat,
        maxsize: 50 * 1024 * 1024, // 50 MB
        maxFiles: 3,
        tailable: true,
      })
    );
  } catch {
    // Non-fatal: log directory creation may fail in read-only environments
  }
}

// ─── Logger instance ──────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: "buddymarket-api",
    env: process.env.NODE_ENV ?? "development",
    version: process.env.npm_package_version ?? "unknown",
  },
  transports,
  exitOnError: false,
});

// ─── Child logger factory ─────────────────────────────────────────────────────

/**
 * Create a child logger with additional context fields.
 * Useful for per-request or per-user logging.
 *
 * @example
 *   const reqLogger = createChildLogger({ requestId: "abc123", userId: 42 });
 *   reqLogger.info("Processing payment");
 */
export function createChildLogger(meta: Record<string, unknown>): winston.Logger {
  return logger.child(meta);
}

export default logger;
