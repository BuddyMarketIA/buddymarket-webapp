/**
 * Whoop OAuth 2.0 Integration
 * Handles OAuth flow, token management, and API calls to Whoop
 */

import { env } from "./env";

const WHOOP_AUTH_URL = "https://app.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://app.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE = "https://api.prod.whoop.com";

export interface WhoopTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface WhoopUser {
  user_id: string;
  email?: string;
}

/**
 * Generate Whoop OAuth authorization URL
 */
export function generateWhoopAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.WHOOP_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope: "read:cycles read:recovery read:sleep read:strain",
  });

  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeWhoopCode(
  code: string,
  redirectUri: string
): Promise<WhoopTokenResponse> {
  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: env.WHOOP_CLIENT_ID,
      client_secret: env.WHOOP_CLIENT_SECRET,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Whoop token exchange failed: ${response.statusText}`);
  }

  return response.json() as Promise<WhoopTokenResponse>;
}

/**
 * Refresh Whoop access token
 */
export async function refreshWhoopToken(refreshToken: string): Promise<WhoopTokenResponse> {
  const response = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.WHOOP_CLIENT_ID,
      client_secret: env.WHOOP_CLIENT_SECRET,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Whoop token refresh failed: ${response.statusText}`);
  }

  return response.json() as Promise<WhoopTokenResponse>;
}

/**
 * Get Whoop user info
 */
export async function getWhoopUser(accessToken: string): Promise<WhoopUser> {
  const response = await fetch(`${WHOOP_API_BASE}/user/profile/basic`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Whoop user info: ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  return {
    user_id: data.user_id || "unknown",
    email: data.email,
  };
}

/**
 * Fetch Whoop cycles data
 */
export async function fetchWhoopCycles(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start: new Date(startDate).toISOString(),
    end: new Date(endDate).toISOString(),
  });

  const response = await fetch(`${WHOOP_API_BASE}/cycles?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop cycles: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Whoop recovery data
 */
export async function fetchWhoopRecovery(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start: new Date(startDate).toISOString(),
    end: new Date(endDate).toISOString(),
  });

  const response = await fetch(`${WHOOP_API_BASE}/recovery?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop recovery: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Whoop sleep data
 */
export async function fetchWhoopSleep(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start: new Date(startDate).toISOString(),
    end: new Date(endDate).toISOString(),
  });

  const response = await fetch(`${WHOOP_API_BASE}/sleep?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop sleep: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Whoop strain data
 */
export async function fetchWhoopStrain(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start: new Date(startDate).toISOString(),
    end: new Date(endDate).toISOString(),
  });

  const response = await fetch(`${WHOOP_API_BASE}/strain?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop strain: ${response.statusText}`);
  }

  return response.json();
}
