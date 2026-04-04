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
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./_core/env";

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

  // ── Sign in with Google ─────────────────────────────────────────────────────
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
