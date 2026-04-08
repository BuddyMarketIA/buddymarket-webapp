/**
 * BuddyMarket — SSO: Sign in with Apple & Sign in with Google
 *
 * Expone dos endpoints REST (no tRPC porque necesitan manejar cookies directamente):
 *   POST /api/auth/apple   — valida el identity token de Apple
 *   POST /api/auth/google  — valida el id_token de Google
 *
 * Ambos crean/actualizan el usuario en BD y devuelven la misma cookie de sesión
 * que usa el flujo OAuth de Manus, por lo que el resto de la app no necesita cambios.
 */

import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import appleSignin from "apple-signin-auth";
import { createHash } from "crypto";
import { SignJWT, importPKCS8 } from "jose";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./_core/env";

// ─── Apple OAuth Web Flow helpers ────────────────────────────────────────────

async function generateAppleClientSecret(): Promise<string> {
  const keyId = process.env.APPLE_KEY_ID ?? "";
  const teamId = process.env.APPLE_TEAM_ID ?? "";
  const clientId = process.env.APPLE_CLIENT_ID ?? "com.buddymarket.web";
  const privateKeyPem = process.env.APPLE_PRIVATE_KEY ?? "";

  if (!keyId || !teamId || !privateKeyPem) {
    throw new Error("Apple Sign In not configured: missing APPLE_KEY_ID, APPLE_TEAM_ID, or APPLE_PRIVATE_KEY");
  }

  // Normalise PEM: env vars may use \\n literal instead of real newlines
  const normalizedKey = privateKeyPem.replace(/\\n/g, "\n");
  const privateKey = await importPKCS8(normalizedKey, "ES256");

  const now = Math.floor(Date.now() / 1000);
  const clientSecret = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 15777000) // ~6 months
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(privateKey);

  return clientSecret;
}

// ─── Google OAuth2 Client ─────────────────────────────────────────────────────
// GOOGLE_CLIENT_ID es el Client ID web principal (también acepta los de iOS/Android)
const GOOGLE_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID ?? "",
  process.env.GOOGLE_CLIENT_ID_IOS ?? "",
  process.env.GOOGLE_CLIENT_ID_ANDROID ?? "",
  process.env.GOOGLE_CLIENT_ID_WEB ?? "",
].filter(Boolean);

const googleClient = new OAuth2Client();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createSessionAndSetCookie(
  req: Request,
  res: Response,
  params: {
    openId: string;
    name: string | null;
    email: string | null;
    imageUrl?: string | null;
    loginMethod: string;
  }
) {
  // 1. Crear/actualizar usuario en BD
  await db.upsertUser({
    openId: params.openId,
    name: params.name,
    email: params.email,
    imageUrl: params.imageUrl ?? null,
    loginMethod: params.loginMethod,
    lastSignedIn: new Date(),
  });

  // 2. Obtener el usuario para devolver sus datos
  const user = await db.getUserByOpenId(params.openId);

  // 3. Crear JWT de sesión (mismo formato que el flujo OAuth de Manus)
  const sessionToken = await sdk.createSessionToken(params.openId, {
    name: params.name ?? "",
    expiresInMs: ONE_YEAR_MS,
  });

  // 4. Establecer cookie de sesión
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

  return user;
}

// ─── Registro de rutas ────────────────────────────────────────────────────────

export function registerSSORoutes(app: Express) {

  // ── Sign in with Apple ──────────────────────────────────────────────────────
  app.post("/api/auth/apple", async (req: Request, res: Response) => {
    const { identityToken, fullName, email, nonce } = req.body as {
      identityToken?: string;
      fullName?: { givenName?: string; familyName?: string } | null;
      email?: string | null;
      nonce?: string;
    };

    if (!identityToken) {
      res.status(400).json({ error: "identityToken is required" });
      return;
    }

    try {
      // Verificar el identity token con los servidores de Apple
      const applePayload = await appleSignin.verifyIdToken(identityToken, {
        audience: "com.buddymarket.app",
        nonce: nonce ? createHash('sha256').update(nonce).digest('hex') : undefined,
      });

      const appleUserId = applePayload.sub; // Identificador único de Apple
      const openId = `apple:${appleUserId}`;

      // Apple solo envía el email y nombre en el PRIMER login
      const userName = fullName
        ? [fullName.givenName, fullName.familyName].filter(Boolean).join(" ") || null
        : null;
      const userEmail = email ?? applePayload.email ?? null;

      const user = await createSessionAndSetCookie(req, res, {
        openId,
        name: userName,
        email: userEmail,
        loginMethod: "apple",
      });

      console.log(`[SSO] Apple login: ${openId} (${userEmail})`);
      res.json({ success: true, user: { id: user?.id, name: user?.name, email: user?.email } });
    } catch (err: any) {
      console.error("[SSO] Apple token verification failed:", err?.message);
      res.status(401).json({ error: "Token de Apple inválido o expirado" });
    }
  });

  // ── Sign in with Apple — OAuth Redirect Flow (Web) ────────────────────────────
  // GET /api/auth/apple/login  → redirige a Apple OAuth
  app.get("/api/auth/apple/login", (req: Request, res: Response) => {
    const clientId = process.env.APPLE_CLIENT_ID ?? "com.buddymarket.web";
    const keyId = process.env.APPLE_KEY_ID ?? "";
    const teamId = process.env.APPLE_TEAM_ID ?? "";
    if (!keyId || !teamId) {
      res.status(500).json({ error: "Apple Sign In not configured" });
      return;
    }
    const origin = (req.query.origin as string) || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/auth/apple/callback`;
    const state = Buffer.from(JSON.stringify({ origin, returnPath: req.query.returnPath ?? "/" })).toString("base64url");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "name email",
      state,
      response_mode: "form_post",
    });
    res.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`);
  });

  // POST /api/auth/apple/callback → intercambia code por tokens y crea sesión
  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    const { code, state, error, id_token, user: userJson } = req.body as {
      code?: string;
      state?: string;
      error?: string;
      id_token?: string;
      user?: string;
    };

    let origin = `${req.protocol}://${req.get("host")}`;
    let returnPath = "/";
    try {
      if (state) {
        const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
        origin = parsed.origin ?? origin;
        returnPath = parsed.returnPath ?? "/";
      }
    } catch { /* ignore parse errors */ }

    if (error || !code) {
      res.redirect(`${origin}/login?error=apple_cancelled`);
      return;
    }

    try {
      const clientId = process.env.APPLE_CLIENT_ID ?? "com.buddymarket.web";
      const redirectUri = `${origin}/api/auth/apple/callback`;
      const clientSecret = await generateAppleClientSecret();

      // Intercambiar code por tokens
      const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      const tokens = await tokenRes.json() as {
        id_token?: string;
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (tokens.error || !tokens.id_token) {
        throw new Error(tokens.error_description ?? tokens.error ?? "No id_token in Apple response");
      }

      // Verificar el ID token de Apple
      const applePayload = await appleSignin.verifyIdToken(tokens.id_token, {
        audience: clientId,
      });

      const appleUserId = applePayload.sub;
      const openId = `apple:${appleUserId}`;

      // Apple solo envía nombre en el PRIMER login (via form_post body)
      let userName: string | null = null;
      let userEmail: string | null = applePayload.email ?? null;
      if (userJson) {
        try {
          const parsedUser = JSON.parse(userJson) as {
            name?: { firstName?: string; lastName?: string };
            email?: string;
          };
          const firstName = parsedUser.name?.firstName ?? "";
          const lastName = parsedUser.name?.lastName ?? "";
          userName = [firstName, lastName].filter(Boolean).join(" ") || null;
          userEmail = parsedUser.email ?? userEmail;
        } catch { /* ignore */ }
      }

      await createSessionAndSetCookie(req, res, {
        openId,
        name: userName,
        email: userEmail,
        loginMethod: "apple",
      });
      console.log(`[SSO] Apple OAuth redirect login: ${openId} (${userEmail})`);
      res.redirect(`${origin}${returnPath}`);
    } catch (err: any) {
      console.error("[SSO] Apple OAuth callback error:", err?.message);
      res.redirect(`${origin}/login?error=apple_failed`);
    }
  });

  // ── Sign in with Google — OAuth Redirect Flow ────────────────────────────────
  // GET /api/auth/google/login  → redirige a Google OAuth
  app.get("/api/auth/google/login", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
    if (!clientId) {
      res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });
      return;
    }
    const origin = (req.query.origin as string) || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/auth/google/callback`;
    const state = Buffer.from(JSON.stringify({ origin, returnPath: req.query.returnPath ?? "/" })).toString("base64url");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  // GET /api/auth/google/callback → intercambia code por tokens y crea sesión
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as { code?: string; state?: string; error?: string };
    let origin = `${req.protocol}://${req.get("host")}`;
    let returnPath = "/";
    try {
      if (state) {
        const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
        origin = parsed.origin ?? origin;
        returnPath = parsed.returnPath ?? "/";
      }
    } catch { /* ignore parse errors */ }

    if (error || !code) {
      res.redirect(`${origin}/login?error=google_cancelled`);
      return;
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
      const redirectUri = `${origin}/api/auth/google/callback`;

      // Intercambiar code por tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });
      const tokens = await tokenRes.json() as { id_token?: string; access_token?: string; error?: string };
      if (tokens.error || !tokens.id_token) {
        throw new Error(tokens.error ?? "No id_token in response");
      }

      // Verificar el ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_IDS.length > 0 ? GOOGLE_CLIENT_IDS : undefined,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub) throw new Error("Invalid Google token payload");

      const openId = `google:${payload.sub}`;
      await createSessionAndSetCookie(req, res, {
        openId,
        name: payload.name ?? null,
        email: payload.email ?? null,
        imageUrl: payload.picture ?? null,
        loginMethod: "google",
      });
      console.log(`[SSO] Google OAuth redirect login: ${openId} (${payload.email})`);
      res.redirect(`${origin}${returnPath}`);
    } catch (err: any) {
      console.error("[SSO] Google OAuth callback error:", err?.message);
      res.redirect(`${origin}/login?error=google_failed`);
    }
  });

  // ── Sign in with Google — Token Flow (GSI) ─────────────────────────────────
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    const { idToken, accessToken } = req.body as {
      idToken?: string;
      accessToken?: string;
    };

    if (!idToken && !accessToken) {
      res.status(400).json({ error: "idToken or accessToken is required" });
      return;
    }

    try {
      let googleUserId: string;
      let userEmail: string | null = null;
      let userName: string | null = null;
      let userPicture: string | null = null;

      if (idToken) {
        // Verificar el ID token de Google
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_IDS.length > 0 ? GOOGLE_CLIENT_IDS : undefined,
        });
        const payload = ticket.getPayload();
        if (!payload?.sub) throw new Error("Invalid Google token payload");

        googleUserId = payload.sub;
        userEmail = payload.email ?? null;
        userName = payload.name ?? null;
        userPicture = payload.picture ?? null;
      } else {
        // Usar accessToken para obtener la info del usuario (flujo Expo)
        const resp = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
        );
        if (!resp.ok) throw new Error("Failed to fetch Google user info");
        const info = await resp.json() as {
          sub?: string; email?: string; name?: string; picture?: string;
        };
        if (!info.sub) throw new Error("Missing sub in Google user info");

        googleUserId = info.sub;
        userEmail = info.email ?? null;
        userName = info.name ?? null;
        userPicture = info.picture ?? null;
      }

      const openId = `google:${googleUserId}`;

      const user = await createSessionAndSetCookie(req, res, {
        openId,
        name: userName,
        email: userEmail,
        imageUrl: userPicture,
        loginMethod: "google",
      });

      console.log(`[SSO] Google login: ${openId} (${userEmail})`);
      res.json({ success: true, user: { id: user?.id, name: user?.name, email: user?.email } });
    } catch (err: any) {
      console.error("[SSO] Google token verification failed:", err?.message);
      res.status(401).json({ error: "Token de Google inválido o expirado" });
    }
  });

  // ── Validar recibo IAP de Apple ─────────────────────────────────────────────
  app.post("/api/iap/apple/validate", async (req: Request, res: Response) => {
    const { receipt, productId, transactionId } = req.body as {
      receipt?: string;
      productId?: string;
      transactionId?: string;
    };

    if (!receipt || !productId) {
      res.status(400).json({ error: "receipt and productId are required" });
      return;
    }

    try {
      // Verificar el recibo con Apple (sandbox primero, luego producción)
      const verifyUrl = process.env.NODE_ENV === "production"
        ? "https://buy.itunes.apple.com/verifyReceipt"
        : "https://sandbox.itunes.apple.com/verifyReceipt";

      const appleResponse = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "receipt-data": receipt,
          "password": process.env.APPLE_SHARED_SECRET ?? "",
          "exclude-old-transactions": true,
        }),
      });

      const appleData = await appleResponse.json() as {
        status: number;
        latest_receipt_info?: Array<{
          product_id: string;
          transaction_id: string;
          expires_date_ms: string;
          original_transaction_id: string;
        }>;
      };

      // Status 0 = válido, 21007 = recibo de sandbox en producción
      if (appleData.status !== 0 && appleData.status !== 21007) {
        throw new Error(`Apple receipt validation failed with status: ${appleData.status}`);
      }

      // Si es sandbox en producción, re-verificar en sandbox
      if (appleData.status === 21007) {
        const sandboxResponse = await fetch("https://sandbox.itunes.apple.com/verifyReceipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "receipt-data": receipt,
            "password": process.env.APPLE_SHARED_SECRET ?? "",
          }),
        });
        const sandboxData = await sandboxResponse.json() as typeof appleData;
        if (sandboxData.status !== 0) {
          throw new Error(`Apple sandbox receipt validation failed: ${sandboxData.status}`);
        }
      }

      // Determinar el tier basado en el productId
      const tier = _getTierFromProductId(productId);

      res.json({ success: true, tier, transactionId });
    } catch (err: any) {
      console.error("[IAP] Apple receipt validation error:", err?.message);
      res.status(400).json({ error: err?.message ?? "Error al validar recibo de Apple" });
    }
  });

  // ── Validar recibo IAP de Google Play ───────────────────────────────────────
  app.post("/api/iap/google/validate", async (req: Request, res: Response) => {
    const { purchaseToken, productId, packageName } = req.body as {
      purchaseToken?: string;
      productId?: string;
      packageName?: string;
    };

    if (!purchaseToken || !productId) {
      res.status(400).json({ error: "purchaseToken and productId are required" });
      return;
    }

    try {
      // Para Google Play necesitas el Google Play Developer API
      // Por ahora devolvemos éxito con el tier correcto (implementar con googleapis en producción)
      const tier = _getTierFromProductId(productId);
      console.log(`[IAP] Google Play purchase: ${productId} → tier: ${tier}`);
      res.json({ success: true, tier, purchaseToken });
    } catch (err: any) {
      console.error("[IAP] Google receipt validation error:", err?.message);
      res.status(400).json({ error: err?.message ?? "Error al validar compra de Google Play" });
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _getTierFromProductId(productId: string): string {
  if (productId.includes('promax')) return 'promax';
  if (productId.includes('pro')) return 'pro';
  if (productId.includes('expert')) return 'expert';
  return 'pro';
}
