/**
 * Wearables OAuth Authentication
 *
 * Maneja la autenticación OAuth 2.0 con Oura Ring y Whoop
 * Proporciona funciones para:
 * - Generar URLs de autorización
 * - Intercambiar códigos por tokens
 * - Refrescar tokens expirados
 * - Obtener datos del usuario
 */

import { ENV } from './env';
import crypto from 'crypto';

// ─── Configuration ────────────────────────────────────────────────────────────

const OURA_CONFIG = {
  authUrl: 'https://cloud.ouraring.com/oauth/authorize',
  tokenUrl: 'https://cloud.ouraring.com/oauth/token',
  apiUrl: 'https://api.ouraring.com/v2',
  scopes: [
    'personal_info',
    'sleep',
    'activity',
    'readiness',
    'heart_rate',
    'hrv',
    'spo2',
    'workout',
    'stress',
    'resilience',
    'cardiovascular_age',
    'vo2_max',
  ],
};

const WHOOP_CONFIG = {
  authUrl: 'https://app.prod.whoop.com/oauth/oauth2/auth',
  tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
  apiUrl: 'https://api.prod.whoop.com/v2',
  scopes: [
    'read:recovery',
    'read:cycles',
    'read:workout',
    'read:sleep',
    'read:profile',
    'read:body_measurement',
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  tokenType: string;
}

export interface OuraUser {
  id: string;
  age?: number;
  weight?: number;
  height?: number;
  biological_sex?: string;
  email?: string;
}

export interface WhoopUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

// ─── Oura OAuth Functions ─────────────────────────────────────────────────────

/**
 * Genera la URL de autorización para Oura
 */
export function generateOuraAuthUrl(state: string): string {
  if (!ENV.ouraClientId) {
    throw new Error('OURA_CLIENT_ID no está configurado');
  }

  const redirectUri = getRedirectUri('oura');
  const params = new URLSearchParams({
    client_id: ENV.ouraClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: OURA_CONFIG.scopes.join(' '),
  });

  return `${OURA_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Intercambia un código de autorización por un token de acceso (Oura)
 */
export async function exchangeOuraCode(code: string): Promise<OAuthToken> {
  if (!ENV.ouraClientId || !ENV.ouraClientSecret) {
    throw new Error('Oura credentials no están configurados');
  }

  const redirectUri = getRedirectUri('oura');

  const response = await fetch(OURA_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: ENV.ouraClientId,
      client_secret: ENV.ouraClientSecret,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Oura token exchange failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
    tokenType: data.token_type || 'Bearer',
  };
}

/**
 * Refresca un token de acceso expirado (Oura)
 */
export async function refreshOuraToken(refreshToken: string): Promise<OAuthToken> {
  if (!ENV.ouraClientId || !ENV.ouraClientSecret) {
    throw new Error('Oura credentials no están configurados');
  }

  const response = await fetch(OURA_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: ENV.ouraClientId,
      client_secret: ENV.ouraClientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Oura token refresh failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
    tokenType: data.token_type || 'Bearer',
  };
}

/**
 * Obtiene la información del usuario desde Oura
 */
export async function getOuraUser(accessToken: string): Promise<OuraUser> {
  const response = await fetch(`${OURA_CONFIG.apiUrl}/usercollection/personal_info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Oura user info: ${response.status} - ${error}`);
  }

  return response.json();
}

// ─── Whoop OAuth Functions ────────────────────────────────────────────────────

/**
 * Genera la URL de autorización para Whoop
 */
export function generateWhoopAuthUrl(state: string): string {
  if (!ENV.whoopClientId) {
    throw new Error('WHOOP_CLIENT_ID no está configurado');
  }

  const redirectUri = getRedirectUri('whoop');
  const params = new URLSearchParams({
    client_id: ENV.whoopClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: WHOOP_CONFIG.scopes.join(' '),
  });

  return `${WHOOP_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Intercambia un código de autorización por un token de acceso (Whoop)
 */
export async function exchangeWhoopCode(code: string): Promise<OAuthToken> {
  if (!ENV.whoopClientId || !ENV.whoopClientSecret) {
    throw new Error('Whoop credentials no están configurados');
  }

  const redirectUri = getRedirectUri('whoop');

  const response = await fetch(WHOOP_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: ENV.whoopClientId,
      client_secret: ENV.whoopClientSecret,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whoop token exchange failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
    tokenType: data.token_type || 'Bearer',
  };
}

/**
 * Refresca un token de acceso expirado (Whoop)
 */
export async function refreshWhoopToken(refreshToken: string): Promise<OAuthToken> {
  if (!ENV.whoopClientId || !ENV.whoopClientSecret) {
    throw new Error('Whoop credentials no están configurados');
  }

  const response = await fetch(WHOOP_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: ENV.whoopClientId,
      client_secret: ENV.whoopClientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whoop token refresh failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
    tokenType: data.token_type || 'Bearer',
  };
}

/**
 * Obtiene la información del usuario desde Whoop
 */
export async function getWhoopUser(accessToken: string): Promise<WhoopUser> {
  const response = await fetch(`${WHOOP_CONFIG.apiUrl}/user/profile/basic`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Whoop user info: ${response.status} - ${error}`);
  }

  return response.json();
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Obtiene el URI de redirección correcto basado en el entorno
 */
function getRedirectUri(provider: 'oura' | 'whoop'): string {
  const baseUrl = ENV.publicAppUrl || 'http://localhost:3000';
  return `${baseUrl}/api/health-hub/oauth/${provider}/callback`;
}

/**
 * Genera un state aleatorio para CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Valida el state para prevenir CSRF attacks
 */
export function validateState(state: string, storedState: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(state),
    Buffer.from(storedState)
  );
}

/**
 * Encripta un token para almacenamiento seguro
 */
export function encryptToken(token: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'base64'),
    iv
  );

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta un token almacenado
 */
export function decryptToken(encryptedToken: string, encryptionKey: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(encryptionKey, 'base64'),
    iv
  );

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
