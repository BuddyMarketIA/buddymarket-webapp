import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const isDev = process.env.NODE_ENV !== "production";

const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `[${ts}] ${level}: ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
    isDev
      ? combine(colorize(), logFormat)
      : winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
  exitOnError: false,
});

export default logger;
