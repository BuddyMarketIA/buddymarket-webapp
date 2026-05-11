/**
 * Whoop OAuth 2.0 Helper
 * Handles token exchange and API calls to Whoop API
 */

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v1";

export function getWhoopAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.WHOOP_CLIENT_ID;
  if (!clientId) throw new Error("WHOOP_CLIENT_ID not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement",
    ...(state ? { state } : {}),
  });

  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeWhoopCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Whoop OAuth not configured");

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whoop token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshWhoopToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Whoop OAuth not configured");

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) throw new Error("Whoop token refresh failed");
  return res.json();
}

export async function fetchWhoopRecovery(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `${WHOOP_API_BASE}/recovery?start=${startDate}&end=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWhoopWorkouts(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `${WHOOP_API_BASE}/activity/workout?start=${startDate}&end=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWhoopSleep(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `${WHOOP_API_BASE}/activity/sleep?start=${startDate}&end=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWhoopCycles(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `${WHOOP_API_BASE}/cycle?start=${startDate}&end=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}
