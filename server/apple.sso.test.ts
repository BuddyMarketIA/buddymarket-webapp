/**
 * Test: Apple Sign In secrets configuration
 * Verifica que los secrets de Apple están configurados y que se puede
 * generar un client_secret JWT válido con ellos.
 */
import { describe, it, expect } from "vitest";
import { SignJWT, importPKCS8, decodeJwt } from "jose";

async function generateAppleClientSecret(): Promise<string> {
  const keyId = process.env.APPLE_KEY_ID ?? "";
  const teamId = process.env.APPLE_TEAM_ID ?? "";
  const clientId = process.env.APPLE_CLIENT_ID ?? "com.buddymarket.web";
  const privateKeyPem = process.env.APPLE_PRIVATE_KEY ?? "";

  if (!keyId || !teamId || !privateKeyPem) {
    throw new Error("Apple Sign In not configured: missing APPLE_KEY_ID, APPLE_TEAM_ID, or APPLE_PRIVATE_KEY");
  }

  const normalizedKey = privateKeyPem.replace(/\\n/g, "\n");
  const privateKey = await importPKCS8(normalizedKey, "ES256");

  const now = Math.floor(Date.now() / 1000);
  const clientSecret = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 15777000)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(privateKey);

  return clientSecret;
}

describe("Apple Sign In secrets", () => {
  it("should have all required Apple environment variables set", () => {
    expect(process.env.APPLE_KEY_ID).toBeTruthy();
    expect(process.env.APPLE_TEAM_ID).toBeTruthy();
    expect(process.env.APPLE_CLIENT_ID).toBeTruthy();
    expect(process.env.APPLE_PRIVATE_KEY).toBeTruthy();
  });

  it("should have correct Apple Key ID format", () => {
    const keyId = process.env.APPLE_KEY_ID ?? "";
    // Apple Key IDs are 10 uppercase alphanumeric characters
    expect(keyId).toMatch(/^[A-Z0-9]{10}$/);
  });

  it("should have correct Apple Team ID format", () => {
    const teamId = process.env.APPLE_TEAM_ID ?? "";
    // Apple Team IDs are 10 uppercase alphanumeric characters
    expect(teamId).toMatch(/^[A-Z0-9]{10}$/);
  });

  it("should generate a valid Apple client_secret JWT", async () => {
    const clientSecret = await generateAppleClientSecret();
    expect(clientSecret).toBeTruthy();
    expect(typeof clientSecret).toBe("string");

    // Decode and verify JWT structure
    const payload = decodeJwt(clientSecret);
    expect(payload.iss).toBe(process.env.APPLE_TEAM_ID);
    expect(payload.sub).toBe(process.env.APPLE_CLIENT_ID);
    expect(payload.aud).toBe("https://appleid.apple.com");
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});
