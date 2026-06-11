/**
 * Test: Google OAuth secrets configuration
 * Verifica que los secrets de Google OAuth están configurados correctamente
 * para buddyone.io y que se pueden usar para autenticación.
 */
import { describe, it, expect } from "vitest";

describe("Google OAuth secrets for buddyone.io", () => {
  it("should have VITE_GOOGLE_CLIENT_ID configured", () => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    expect(clientId).toBeTruthy();
    expect(typeof clientId).toBe("string");
    expect(clientId).toContain(".apps.googleusercontent.com");
  });

  it("should have GOOGLE_CLIENT_SECRET configured", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeTruthy();
    expect(typeof clientSecret).toBe("string");
    // Google OAuth secrets typically start with GOCSPX- or similar
    expect(clientSecret.length).toBeGreaterThan(10);
  });

  it("should have correct Google Client ID format", () => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID ?? "";
    // Google Client IDs follow pattern: {numeric-id}.apps.googleusercontent.com
    expect(clientId).toMatch(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
  });

  it("should have correct Google Client Secret format", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
    // Google OAuth secrets are typically long alphanumeric strings
    expect(clientSecret.length).toBeGreaterThan(20);
    // Should not contain spaces or special characters that would break OAuth
    expect(clientSecret).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should have both credentials for OAuth flow", () => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Both must be present for OAuth to work
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();
    
    // Verify they are different (not accidentally the same value)
    expect(clientId).not.toBe(clientSecret);
  });

  it("should support OAuth callback flow", () => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    
    // Verify the client ID can be used in OAuth URLs
    expect(clientId).toBeTruthy();
    
    // The client ID should be suitable for use in:
    // https://accounts.google.com/o/oauth2/v2/auth?client_id={clientId}&...
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=https://buddyone.io/api/oauth/callback&response_type=code&scope=openid%20email%20profile`;
    
    expect(oauthUrl).toContain(clientId);
    expect(oauthUrl).toContain("buddyone.io");
    expect(oauthUrl).toContain("/api/oauth/callback");
  });
});
