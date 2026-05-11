/**
 * Oura Ring OAuth 2.0 Integration
 * Handles OAuth flow, token management, and API calls to Oura
 */

import { env } from "./env";

const OURA_AUTH_URL = "https://cloud.ouraring.com/oauth/authorize";
const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const OURA_API_BASE = "https://api.ouraring.com/v2";

export interface OuraTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface OuraUser {
  id: string;
  email?: string;
}

/**
 * Generate Oura OAuth authorization URL
 */
export function generateOuraAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.OURA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope: "personal",
  });

  return `${OURA_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeOuraCode(
  code: string,
  redirectUri: string
): Promise<OuraTokenResponse> {
  const response = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: env.OURA_CLIENT_ID,
      client_secret: env.OURA_CLIENT_SECRET,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Oura token exchange failed: ${response.statusText}`);
  }

  return response.json() as Promise<OuraTokenResponse>;
}

/**
 * Refresh Oura access token
 */
export async function refreshOuraToken(refreshToken: string): Promise<OuraTokenResponse> {
  const response = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.OURA_CLIENT_ID,
      client_secret: env.OURA_CLIENT_SECRET,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Oura token refresh failed: ${response.statusText}`);
  }

  return response.json() as Promise<OuraTokenResponse>;
}

/**
 * Get Oura user info
 */
export async function getOuraUser(accessToken: string): Promise<OuraUser> {
  const response = await fetch(`${OURA_API_BASE}/usercollection/personal_info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Oura user info: ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  return {
    id: data.id || "unknown",
    email: data.email,
  };
}

/**
 * Fetch Oura sleep data
 */
export async function fetchOuraSleepData(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${OURA_API_BASE}/usercollection/sleep?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura sleep data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Oura activity data
 */
export async function fetchOuraActivityData(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${OURA_API_BASE}/usercollection/activity?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura activity data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Oura readiness (recovery) data
 */
export async function fetchOuraReadinessData(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${OURA_API_BASE}/usercollection/readiness?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura readiness data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch Oura heart rate data
 */
export async function fetchOuraHeartRateData(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${OURA_API_BASE}/usercollection/heart_rate?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura heart rate data: ${response.statusText}`);
  }

  return response.json();
}
