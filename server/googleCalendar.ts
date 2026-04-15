/**
 * Google Calendar helper — OAuth 2.0 + Calendar API
 * Uses only native fetch (no googleapis SDK) to keep bundle small.
 */
import { ENV } from "./_core/env";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "openid",
  "email",
].join(" ");

// ─── OAuth helpers ────────────────────────────────────────────────────────────

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  email?: string;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  const data = await res.json() as any;
  // Decode id_token to get email
  let email: string | undefined;
  if (data.id_token) {
    try {
      const payload = JSON.parse(Buffer.from(data.id_token.split(".")[1], "base64url").toString());
      email = payload.email;
    } catch {}
  }
  return { ...data, email };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }
  return res.json() as any;
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: "POST" });
}

// ─── Token management ─────────────────────────────────────────────────────────

/** Returns a valid access token, refreshing if needed */
export async function getValidAccessToken(expert: {
  googleCalendarAccessToken: string | null;
  googleCalendarRefreshToken: string | null;
  googleCalendarTokenExpiry: Date | null;
}): Promise<string> {
  if (!expert.googleCalendarRefreshToken) {
    throw new Error("Google Calendar no está conectado");
  }
  const now = new Date();
  const expiry = expert.googleCalendarTokenExpiry;
  // Refresh if token expires in less than 5 minutes
  if (!expert.googleCalendarAccessToken || !expiry || expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(expert.googleCalendarRefreshToken);
    return refreshed.access_token;
  }
  return expert.googleCalendarAccessToken;
}

// ─── Calendar API calls ───────────────────────────────────────────────────────

/** Check free/busy for a time range — returns array of busy intervals */
export async function getFreeBusy(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
  calendarId = "primary"
): Promise<Array<{ start: string; end: string }>> {
  const res = await fetch(`${GOOGLE_CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google freeBusy failed: ${err}`);
  }
  const data = await res.json() as any;
  return data.calendars?.[calendarId]?.busy ?? [];
}

/** Check if a time slot conflicts with existing events */
export async function hasConflict(
  accessToken: string,
  startTime: Date,
  endTime: Date,
  excludeEventId?: string
): Promise<{ conflict: boolean; conflictingEvent?: { start: string; end: string } }> {
  const busy = await getFreeBusy(accessToken, startTime, endTime);
  // Filter out the event being updated (if any)
  const conflicts = busy.filter(b => {
    // We can't filter by eventId from freeBusy, but we can check overlap
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    const sTime = startTime.getTime();
    const eTime = endTime.getTime();
    return bStart < eTime && bEnd > sTime;
  });
  return {
    conflict: conflicts.length > 0,
    conflictingEvent: conflicts[0],
  };
}

/** Create a Google Calendar event with optional Google Meet link */
export async function createCalendarEvent(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail?: string;
    addMeet?: boolean;
    location?: string;
  }
): Promise<{ eventId: string; eventLink: string; meetUrl?: string }> {
  const body: any = {
    summary: event.title,
    description: event.description,
    start: { dateTime: event.startTime.toISOString(), timeZone: "Europe/Madrid" },
    end: { dateTime: event.endTime.toISOString(), timeZone: "Europe/Madrid" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 60 },
        { method: "popup", minutes: 15 },
      ],
    },
  };
  if (event.attendeeEmail) {
    body.attendees = [{ email: event.attendeeEmail }];
  }
  if (event.location) {
    body.location = event.location;
  }
  if (event.addMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `buddy-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const url = `${GOOGLE_CALENDAR_API}/calendars/primary/events${event.addMeet ? "?conferenceDataVersion=1" : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar event creation failed: ${err}`);
  }
  const data = await res.json() as any;
  const meetUrl = data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri;
  return {
    eventId: data.id,
    eventLink: data.htmlLink,
    meetUrl,
  };
}

/** Delete a Google Calendar event */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 404 is OK (already deleted), 410 Gone is OK too
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const err = await res.text();
    throw new Error(`Google Calendar event deletion failed: ${err}`);
  }
}
