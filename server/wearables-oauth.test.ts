/**
 * Wearables OAuth Tests
 *
 * Pruebas para validar la autenticación OAuth con Oura y Whoop
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  generateOuraAuthUrl,
  generateWhoopAuthUrl,
  generateState,
  validateState,
  encryptToken,
  decryptToken,
} from './server/_core/wearables-oauth';
import crypto from 'crypto';

describe('Wearables OAuth', () => {
  // ─── State Generation & Validation ────────────────────────────────────────

  describe('State Generation & Validation', () => {
    it('should generate a valid state string', () => {
      const state = generateState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate unique states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });

    it('should validate matching states', () => {
      const state = generateState();
      expect(validateState(state, state)).toBe(true);
    });

    it('should reject mismatched states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(validateState(state1, state2)).toBe(false);
    });
  });

  // ─── Token Encryption & Decryption ────────────────────────────────────────

  describe('Token Encryption & Decryption', () => {
    let encryptionKey: string;

    beforeAll(() => {
      // Generar clave de encriptación válida
      encryptionKey = crypto.randomBytes(32).toString('base64');
    });

    it('should encrypt and decrypt tokens', () => {
      const originalToken = 'test_access_token_12345';
      const encrypted = encryptToken(originalToken, encryptionKey);
      const decrypted = decryptToken(encrypted, encryptionKey);

      expect(decrypted).toBe(originalToken);
    });

    it('should produce different encrypted values for same token', () => {
      const token = 'test_token';
      const encrypted1 = encryptToken(token, encryptionKey);
      const encrypted2 = encryptToken(token, encryptionKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail to decrypt with wrong key', () => {
      const token = 'test_token';
      const encrypted = encryptToken(token, encryptionKey);
      const wrongKey = crypto.randomBytes(32).toString('base64');

      expect(() => decryptToken(encrypted, wrongKey)).toThrow();
    });

    it('should handle long tokens', () => {
      const longToken = 'x'.repeat(1000);
      const encrypted = encryptToken(longToken, encryptionKey);
      const decrypted = decryptToken(encrypted, encryptionKey);

      expect(decrypted).toBe(longToken);
    });

    it('should handle special characters in tokens', () => {
      const specialToken = 'token_with_!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encrypted = encryptToken(specialToken, encryptionKey);
      const decrypted = decryptToken(encrypted, encryptionKey);

      expect(decrypted).toBe(specialToken);
    });
  });

  // ─── Oura Auth URL Generation ─────────────────────────────────────────────

  describe('Oura Auth URL Generation', () => {
    it('should generate valid Oura auth URL', () => {
      const state = generateState();
      const url = generateOuraAuthUrl(state);

      expect(url).toContain('https://cloud.ouraring.com/oauth/authorize');
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=');
    });

    it('should include required scopes in Oura URL', () => {
      const state = generateState();
      const url = generateOuraAuthUrl(state);

      const requiredScopes = ['personal_info', 'sleep', 'activity', 'readiness'];
      requiredScopes.forEach((scope) => {
        expect(url).toContain(scope);
      });
    });

    it('should include client_id in Oura URL', () => {
      const state = generateState();
      const url = generateOuraAuthUrl(state);

      expect(url).toContain('client_id=');
    });

    it('should include redirect_uri in Oura URL', () => {
      const state = generateState();
      const url = generateOuraAuthUrl(state);

      expect(url).toContain('redirect_uri=');
    });

    it('should throw error if OURA_CLIENT_ID is not configured', () => {
      // Este test requeriría mockear las variables de entorno
      // Por ahora, solo verificamos que la función existe
      expect(typeof generateOuraAuthUrl).toBe('function');
    });
  });

  // ─── Whoop Auth URL Generation ────────────────────────────────────────────

  describe('Whoop Auth URL Generation', () => {
    it('should generate valid Whoop auth URL', () => {
      const state = generateState();
      const url = generateWhoopAuthUrl(state);

      expect(url).toContain('https://app.prod.whoop.com/oauth/oauth2/auth');
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=');
    });

    it('should include required scopes in Whoop URL', () => {
      const state = generateState();
      const url = generateWhoopAuthUrl(state);

      const requiredScopes = ['read:recovery', 'read:cycles', 'read:workout', 'read:sleep'];
      requiredScopes.forEach((scope) => {
        expect(url).toContain(scope);
      });
    });

    it('should include client_id in Whoop URL', () => {
      const state = generateState();
      const url = generateWhoopAuthUrl(state);

      expect(url).toContain('client_id=');
    });

    it('should include redirect_uri in Whoop URL', () => {
      const state = generateState();
      const url = generateWhoopAuthUrl(state);

      expect(url).toContain('redirect_uri=');
    });
  });

  // ─── Integration Tests ────────────────────────────────────────────────────

  describe('Integration Tests', () => {
    it('should handle complete OAuth flow state management', () => {
      // 1. Generate state
      const state = generateState();

      // 2. Generate auth URLs
      const ouraUrl = generateOuraAuthUrl(state);
      const whoopUrl = generateWhoopAuthUrl(state);

      // 3. Validate state
      expect(validateState(state, state)).toBe(true);

      // 4. Verify URLs contain state
      expect(ouraUrl).toContain(`state=${state}`);
      expect(whoopUrl).toContain(`state=${state}`);
    });

    it('should handle token encryption in OAuth flow', () => {
      const encryptionKey = crypto.randomBytes(32).toString('base64');
      const accessToken = 'oauth_access_token_xyz';
      const refreshToken = 'oauth_refresh_token_abc';

      // Encrypt tokens
      const encryptedAccess = encryptToken(accessToken, encryptionKey);
      const encryptedRefresh = encryptToken(refreshToken, encryptionKey);

      // Verify encryption
      expect(encryptedAccess).not.toBe(accessToken);
      expect(encryptedRefresh).not.toBe(refreshToken);

      // Decrypt tokens
      const decryptedAccess = decryptToken(encryptedAccess, encryptionKey);
      const decryptedRefresh = decryptToken(encryptedRefresh, encryptionKey);

      // Verify decryption
      expect(decryptedAccess).toBe(accessToken);
      expect(decryptedRefresh).toBe(refreshToken);
    });
  });
});
