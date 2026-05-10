/**
 * Whoop Data Synchronization
 *
 * Sincroniza datos de Whoop con la base de datos
 * Maneja:
 * - Obtención de datos de la API de Whoop
 * - Almacenamiento en BD
 * - Manejo de errores y retry logic
 * - Actualización de timestamps
 */

import { ENV } from './env';
import { decryptToken, refreshWhoopToken } from './wearables-oauth';
import * as db from '../db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score: {
    state: string;
    score: number;
    recovery: number;
    strain: number;
    kilojoule: number;
  };
  days: number;
}

export interface WhoopRecovery {
  id: number;
  cycle_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score: number;
  resting_heart_rate: number;
  heart_rate_variability: number;
  skin_temperature_celsius: number;
  skin_temperature_trend_celsius: number;
}

export interface WhoopStrain {
  id: number;
  cycle_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

export interface WhoopSleep {
  id: number;
  cycle_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score: {
    stage_summary: {
      total_light_sleep_duration_ms: number;
      total_slow_wave_sleep_duration_ms: number;
      total_rem_sleep_duration_ms: number;
      total_awake_time_ms: number;
    };
    sleep_needed_ms: number;
    sleep_debt_ms: number;
    terp_score: number;
  };
}

// ─── Whoop API Functions ──────────────────────────────────────────────────────

const WHOOP_API_BASE = 'https://api.prod.whoop.com/v2';

/**
 * Obtiene ciclos de Whoop
 */
export async function fetchWhoopCycles(
  accessToken: string,
  startDate?: string,
  endDate?: string
): Promise<WhoopCycle[]> {
  const url = new URL(`${WHOOP_API_BASE}/user/cycles`);

  if (startDate) url.searchParams.append('start', startDate);
  if (endDate) url.searchParams.append('end', endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop cycles: ${response.status}`);
  }

  const data = await response.json();
  return data.records || [];
}

/**
 * Obtiene recuperación de Whoop
 */
export async function fetchWhoopRecovery(
  accessToken: string,
  cycleId: number
): Promise<WhoopRecovery | null> {
  const url = new URL(`${WHOOP_API_BASE}/cycle/${cycleId}/recovery`);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop recovery: ${response.status}`);
  }

  return response.json();
}

/**
 * Obtiene strain de Whoop
 */
export async function fetchWhoopStrain(
  accessToken: string,
  cycleId: number
): Promise<WhoopStrain | null> {
  const url = new URL(`${WHOOP_API_BASE}/cycle/${cycleId}/strain`);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop strain: ${response.status}`);
  }

  return response.json();
}

/**
 * Obtiene sueño de Whoop
 */
export async function fetchWhoopSleep(
  accessToken: string,
  cycleId: number
): Promise<WhoopSleep | null> {
  const url = new URL(`${WHOOP_API_BASE}/cycle/${cycleId}/sleep`);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch Whoop sleep: ${response.status}`);
  }

  return response.json();
}

// ─── Sync Functions ───────────────────────────────────────────────────────────

/**
 * Sincroniza todos los datos de Whoop para un usuario
 */
export async function syncWhoopData(
  userId: string,
  connectionId: string,
  encryptedAccessToken: string,
  encryptedRefreshToken: string | null,
  expiresAt: Date,
  retryCount = 0
): Promise<{
  success: boolean;
  message: string;
  recordsSync: number;
  error?: string;
}> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000 * Math.pow(2, retryCount); // Exponential backoff

  try {
    // Desencriptar token
    const encryptionKey = ENV.encryptionKey;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY no está configurado');
    }

    let accessToken: string;
    try {
      const { decryptToken } = await import('./wearables-oauth');
      accessToken = decryptToken(encryptedAccessToken, encryptionKey);
    } catch (error) {
      throw new Error(`Failed to decrypt access token: ${error}`);
    }

    // Verificar si el token está expirado y refrescarlo si es necesario
    if (new Date() >= expiresAt && encryptedRefreshToken) {
      try {
        const { decryptToken } = await import('./wearables-oauth');
        const refreshToken = decryptToken(encryptedRefreshToken, encryptionKey);
        const newToken = await refreshWhoopToken(refreshToken);

        // Actualizar token en BD
        const { encryptToken } = await import('./wearables-oauth');
        const newEncryptedAccessToken = encryptToken(newToken.accessToken, encryptionKey);
        const newEncryptedRefreshToken = encryptToken(newToken.refreshToken || refreshToken, encryptionKey);

        await db.updateWearableConnectionTokens(
          connectionId,
          newEncryptedAccessToken,
          newEncryptedRefreshToken,
          newToken.expiresAt
        );

        accessToken = newToken.accessToken;
      } catch (error) {
        console.error('Failed to refresh Whoop token:', error);
        throw new Error(`Token refresh failed: ${error}`);
      }
    }

    // Definir rango de fechas (últimos 30 días)
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Obtener ciclos
    const cycles = await fetchWhoopCycles(accessToken, startDate, endDate);

    let recordsSync = 0;

    // Procesar cada ciclo
    for (const cycle of cycles) {
      try {
        // Obtener datos del ciclo
        const [recovery, strain, sleep] = await Promise.all([
          fetchWhoopRecovery(accessToken, cycle.id).catch((err) => {
            console.error(`Error fetching recovery for cycle ${cycle.id}:`, err);
            return null;
          }),
          fetchWhoopStrain(accessToken, cycle.id).catch((err) => {
            console.error(`Error fetching strain for cycle ${cycle.id}:`, err);
            return null;
          }),
          fetchWhoopSleep(accessToken, cycle.id).catch((err) => {
            console.error(`Error fetching sleep for cycle ${cycle.id}:`, err);
            return null;
          }),
        ]);

        // Guardar datos del ciclo
        const cycleDate = new Date(cycle.start);

        await db.saveHealthMetric(userId, 'whoop', {
          date: cycleDate,
          strainScore: cycle.score.strain,
          recoveryScore: recovery?.score || 0,
          restingHeartRate: recovery?.resting_heart_rate || 0,
          heartRateVariability: recovery?.heart_rate_variability || 0,
          sleepDuration: sleep
            ? (sleep.score.stage_summary.total_light_sleep_duration_ms +
                sleep.score.stage_summary.total_slow_wave_sleep_duration_ms +
                sleep.score.stage_summary.total_rem_sleep_duration_ms) /
              (1000 * 3600)
            : 0,
          lightSleep: sleep ? sleep.score.stage_summary.total_light_sleep_duration_ms / (1000 * 3600) : 0,
          deepSleep: sleep ? sleep.score.stage_summary.total_slow_wave_sleep_duration_ms / (1000 * 3600) : 0,
          remSleep: sleep ? sleep.score.stage_summary.total_rem_sleep_duration_ms / (1000 * 3600) : 0,
          awakeTime: sleep ? sleep.score.stage_summary.total_awake_time_ms / (1000 * 3600) : 0,
          metadata: {
            cycleId: cycle.id,
            kilojoule: cycle.score.kilojoule,
            maxHeartRate: strain?.max_heart_rate || 0,
            averageHeartRate: strain?.average_heart_rate || 0,
            skinTemperature: recovery?.skin_temperature_celsius,
            skinTemperatureTrend: recovery?.skin_temperature_trend_celsius,
            sleepNeeded: sleep?.score.sleep_needed_ms,
            sleepDebt: sleep?.score.sleep_debt_ms,
          },
        });

        recordsSync++;
      } catch (error) {
        console.error(`Error processing Whoop cycle ${cycle.id}:`, error);
        // Continuar con el siguiente ciclo en caso de error
      }
    }

    // Actualizar último sync
    await db.updateWearableConnectionLastSync(connectionId);

    return {
      success: true,
      message: `Sincronización de Whoop completada: ${recordsSync} ciclos`,
      recordsSync,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Retry logic con exponential backoff
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `Whoop sync failed (attempt ${retryCount + 1}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms:`,
        errorMessage
      );

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return syncWhoopData(
        userId,
        connectionId,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        retryCount + 1
      );
    }

    console.error(`Whoop sync failed after ${MAX_RETRIES} attempts:`, errorMessage);

    return {
      success: false,
      message: `Sincronización de Whoop falló: ${errorMessage}`,
      recordsSync: 0,
      error: errorMessage,
    };
  }
}

/**
 * Sincroniza datos de Whoop para todos los usuarios conectados
 */
export async function syncAllWhoopData(): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}> {
  const errors: Array<{ userId: string; error: string }> = [];
  let successful = 0;
  let failed = 0;

  try {
    const connections = await db.getAllWearableConnections('whoop');

    for (const connection of connections) {
      try {
        const result = await syncWhoopData(
          connection.userId,
          connection.id,
          connection.accessToken,
          connection.refreshToken,
          connection.expiresAt
        );

        if (result.success) {
          successful++;
          console.log(`✓ Whoop sync successful for user ${connection.userId}: ${result.message}`);
        } else {
          failed++;
          errors.push({
            userId: connection.userId,
            error: result.error || result.message,
          });
          console.error(`✗ Whoop sync failed for user ${connection.userId}: ${result.message}`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ userId: connection.userId, error: errorMessage });
        console.error(`✗ Whoop sync error for user ${connection.userId}:`, errorMessage);
      }
    }

    return {
      total: connections.length,
      successful,
      failed,
      errors,
    };
  } catch (error) {
    console.error('Error syncing all Whoop data:', error);
    throw error;
  }
}
