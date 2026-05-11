/**
 * Oura Ring OAuth 2.0 Helper
 * Handles token exchange and API calls to Oura Ring API v2
 */

const OURA_AUTH_URL = "https://cloud.ouraring.com/oauth/authorize";
const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const OURA_API_BASE = "https://api.ouraring.com/v2/usercollection";

export function getOuraAuthUrl(redirectUri: string, state?: string): string {
  const clientId = process.env.OURA_CLIENT_ID;
  if (!clientId) throw new Error("OURA_CLIENT_ID not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "personal daily heartrate workout tag session spo2",
    ...(state ? { state } : {}),
  });

  return `${OURA_AUTH_URL}?${params.toString()}`;
}

export async function exchangeOuraCode(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const clientId = process.env.OURA_CLIENT_ID;
  const clientSecret = process.env.OURA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Oura OAuth not configured");

  const res = await fetch(OURA_TOKEN_URL, {
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
    throw new Error(`Oura token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshOuraToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientId = process.env.OURA_CLIENT_ID;
  const clientSecret = process.env.OURA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Oura OAuth not configured");

  const res = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) throw new Error("Oura token refresh failed");
  return res.json();
}

export async function fetchOuraSleep(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `${OURA_API_BASE}/daily_sleep?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchOuraReadiness(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `${OURA_API_BASE}/daily_readiness?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchOuraActivity(accessToken: string, startDate: string, endDate: string) {
  const res = await fetch(
    `${OURA_API_BASE}/daily_activity?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}
