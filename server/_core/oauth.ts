import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/** Retry a DB operation up to `maxAttempts` times on transient connection errors */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException })?.cause?.code
        ?? (err as NodeJS.ErrnoException)?.code;
      const isTransient = code === "ECONNRESET" || code === "PROTOCOL_CONNECTION_LOST" || code === "ETIMEDOUT";
      if (isTransient && attempt < maxAttempts) {
        console.warn(`[OAuth] DB transient error (${code}), retrying attempt ${attempt + 1}/${maxAttempts}...`);
        // Small back-off before retry
        await new Promise((r) => setTimeout(r, 200 * attempt));
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Retry upsertUser on transient DB connection errors (e.g. ECONNRESET after idle)
      await withRetry(() =>
        db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
        })
      );

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      // Redirect to login page with error instead of showing a raw JSON error
      res.redirect(302, "/?auth_error=1");
    }
  });
}
