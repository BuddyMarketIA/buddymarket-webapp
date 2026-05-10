/**
 * Wearables Environment Variables
 *
 * Extensión del archivo env.ts para variables específicas de wearables
 */

import { ENV as baseEnv } from './env';

export const WEARABLES_ENV = {
  // Oura Configuration
  ouraClientId: process.env.OURA_CLIENT_ID || '',
  ouraClientSecret: process.env.OURA_CLIENT_SECRET || '',

  // Whoop Configuration
  whoopClientId: process.env.WHOOP_CLIENT_ID || '',
  whoopClientSecret: process.env.WHOOP_CLIENT_SECRET || '',

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || '',

  // Sync Configuration
  syncIntervalHours: parseInt(process.env.SYNC_INTERVAL_HOURS || '6', 10),
  maxSyncRetries: parseInt(process.env.MAX_SYNC_RETRIES || '3', 10),
  syncTimeoutMs: parseInt(process.env.SYNC_TIMEOUT_MS || '30000', 10),

  // Feature Flags
  enableOura: process.env.ENABLE_OURA === 'true',
  enableWhoop: process.env.ENABLE_WHOOP === 'true',
  enableAutoSync: process.env.ENABLE_AUTO_SYNC === 'true',

  // Validation
  validateConfig(): void {
    const errors: string[] = [];

    if (!this.ouraClientId) {
      errors.push('OURA_CLIENT_ID is not configured');
    }
    if (!this.ouraClientSecret) {
      errors.push('OURA_CLIENT_SECRET is not configured');
    }
    if (!this.whoopClientId) {
      errors.push('WHOOP_CLIENT_ID is not configured');
    }
    if (!this.whoopClientSecret) {
      errors.push('WHOOP_CLIENT_SECRET is not configured');
    }
    if (!this.encryptionKey) {
      errors.push('ENCRYPTION_KEY is not configured');
    }

    if (errors.length > 0) {
      console.warn('Wearables configuration warnings:');
      errors.forEach((error) => console.warn(`  - ${error}`));
    }
  },
};

// Validar configuración al cargar el módulo
WEARABLES_ENV.validateConfig();
