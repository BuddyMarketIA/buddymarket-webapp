import { describe, it, expect } from "vitest";
import { SignJWT, importPKCS8, decodeJwt, decodeProtectedHeader } from "jose";

/**
 * Verifies that the Apple Sign in with Apple environment variables are correctly
 * configured and that we can generate a valid client secret JWT using jose.
 */
describe("Apple Sign in with Apple — environment variables", () => {
  it("should have all required Apple env vars set", () => {
    expect(process.env.APPLE_KEY_ID, "APPLE_KEY_ID is missing").toBeTruthy();
    expect(process.env.APPLE_TEAM_ID, "APPLE_TEAM_ID is missing").toBeTruthy();
    expect(process.env.APPLE_PRIVATE_KEY, "APPLE_PRIVATE_KEY is missing").toBeTruthy();
    expect(process.env.APPLE_CLIENT_ID, "APPLE_CLIENT_ID is missing").toBeTruthy();
    expect(process.env.APPLE_BUNDLE_ID, "APPLE_BUNDLE_ID is missing").toBeTruthy();
  });

  it("should have all required Apple IAP env vars set", () => {
    expect(process.env.APPLE_IAP_KEY_ID, "APPLE_IAP_KEY_ID is missing").toBeTruthy();
    expect(process.env.APPLE_IAP_ISSUER_ID, "APPLE_IAP_ISSUER_ID is missing").toBeTruthy();
    expect(process.env.APPLE_IAP_PRIVATE_KEY, "APPLE_IAP_PRIVATE_KEY is missing").toBeTruthy();
  });

  it("should generate a valid Apple client secret JWT using the private key", async () => {
    const keyId = process.env.APPLE_KEY_ID!;
    const teamId = process.env.APPLE_TEAM_ID!;
    const clientId = process.env.APPLE_CLIENT_ID!;
    const privateKeyPem = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

    const now = Math.floor(Date.now() / 1000);
    const privateKey = await importPKCS8(privateKeyPem, "ES256");

    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .setExpirationTime(now + 86400)
      .setAudience("https://appleid.apple.com")
      .setSubject(clientId)
      .sign(privateKey);

    expect(clientSecret).toBeTruthy();
    expect(typeof clientSecret).toBe("string");
    expect(clientSecret.split(".").length).toBe(3);

    const header = decodeProtectedHeader(clientSecret);
    expect(header.alg).toBe("ES256");
    expect(header.kid).toBe(keyId);

    const payload = decodeJwt(clientSecret);
    expect(payload.iss).toBe(teamId);
    expect(payload.sub).toBe(clientId);
    expect(payload.aud).toBe("https://appleid.apple.com");

    console.log("[Test] ✅ Apple Sign in with Apple JWT generated successfully");
    console.log("[Test] Key ID:", keyId, "| Team ID:", teamId, "| Client ID:", clientId);
  });

  it("should generate a valid Apple IAP JWT using the IAP private key", async () => {
    const keyId = process.env.APPLE_IAP_KEY_ID!;
    const issuerId = process.env.APPLE_IAP_ISSUER_ID!;
    const bundleId = process.env.APPLE_BUNDLE_ID!;
    const privateKeyPem = process.env.APPLE_IAP_PRIVATE_KEY!.replace(/\\n/g, "\n");

    const now = Math.floor(Date.now() / 1000);
    const privateKey = await importPKCS8(privateKeyPem, "ES256");

    const iapToken = await new SignJWT({ bid: bundleId })
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(issuerId)
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .setAudience("appstoreconnect-v1")
      .sign(privateKey);

    expect(iapToken).toBeTruthy();
    expect(typeof iapToken).toBe("string");
    expect(iapToken.split(".").length).toBe(3);

    const header = decodeProtectedHeader(iapToken);
    expect(header.alg).toBe("ES256");
    expect(header.kid).toBe(keyId);

    const payload = decodeJwt(iapToken);
    expect(payload.iss).toBe(issuerId);
    expect(payload.aud).toBe("appstoreconnect-v1");
    expect(payload.bid).toBe(bundleId);

    console.log("[Test] ✅ Apple IAP JWT generated successfully");
    console.log("[Test] IAP Key ID:", keyId, "| Issuer ID:", issuerId, "| Bundle ID:", bundleId);
  });
});
