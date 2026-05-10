/**
 * Oura Data Synchronization
 *
 * Sincroniza datos de Oura Ring con la base de datos
 * Maneja:
 * - Obtención de datos de la API de Oura
 * - Almacenamiento en BD
 * - Manejo de errores y retry logic
 * - Actualización de timestamps
 */

import { ENV } from './env';
import { decryptToken, refreshOuraToken } from './wearables-oauth';
import * as db from '../db';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OuraSleepData {
  id: string;
  day: string;
  bedtime_start: string;
  bedtime_end: string;
  duration: number;
  total_sleep: number;
  awake_time: number;
  light_sleep: number;
  deep_sleep: number;
  rem_sleep: number;
  sleep_phase_data?: Array<{
    phase: 'light' | 'deep' | 'rem' | 'awake';
    duration: number;
  }>;
}

export interface OuraActivityData {
  id: string;
  day: string;
  steps: number;
  cal_total: number;
  cal_active: number;
  met: number;
  non_wear: number;
  rest: number;
  inactive: number;
  low: number;
  medium: number;
  high: number;
}

export interface OuraReadinessData {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  temperature_trend_deviation: number;
  resting_heart_rate: number;
  heart_rate_variability: number;
  recovery_index: number;
  sleep_performance: number;
  previous_day_activity: number;
  previous_night_sleep: number;
}

export interface OuraHeartRateData {
  id: string;
  timestamp: string;
  bpm: number;
}

export interface OuraHRVData {
  id: string;
  timestamp: string;
  hrv_rmssd: number;
}

// ─── Oura API Functions ───────────────────────────────────────────────────────

const OURA_API_BASE = 'https://api.ouraring.com/v2';

/**
 * Obtiene datos de sueño de Oura
 */
export async function fetchOuraSleepData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OuraSleepData[]> {
  const url = new URL(`${OURA_API_BASE}/usercollection/sleep`);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura sleep data: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Obtiene datos de actividad de Oura
 */
export async function fetchOuraActivityData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OuraActivityData[]> {
  const url = new URL(`${OURA_API_BASE}/usercollection/activity`);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura activity data: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Obtiene datos de readiness de Oura
 */
export async function fetchOuraReadinessData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OuraReadinessData[]> {
  const url = new URL(`${OURA_API_BASE}/usercollection/readiness`);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura readiness data: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Obtiene datos de frecuencia cardíaca de Oura
 */
export async function fetchOuraHeartRateData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OuraHeartRateData[]> {
  const url = new URL(`${OURA_API_BASE}/usercollection/heartrate`);
  url.searchParams.append('start_date', startDate);
  url.searchParams.append('end_date', endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Oura heart rate data: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

// ─── Sync Functions ───────────────────────────────────────────────────────────

/**
 * Sincroniza todos los datos de Oura para un usuario
 */
export async function syncOuraData(
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
        const newToken = await refreshOuraToken(refreshToken);

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
        console.error('Failed to refresh Oura token:', error);
        throw new Error(`Token refresh failed: ${error}`);
      }
    }

    // Definir rango de fechas (últimos 30 días)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Obtener datos de todas las fuentes
    const [sleepData, activityData, readinessData, heartRateData] = await Promise.all([
      fetchOuraSleepData(accessToken, startDate, endDate).catch((err) => {
        console.error('Error fetching sleep data:', err);
        return [];
      }),
      fetchOuraActivityData(accessToken, startDate, endDate).catch((err) => {
        console.error('Error fetching activity data:', err);
        return [];
      }),
      fetchOuraReadinessData(accessToken, startDate, endDate).catch((err) => {
        console.error('Error fetching readiness data:', err);
        return [];
      }),
      fetchOuraHeartRateData(accessToken, startDate, endDate).catch((err) => {
        console.error('Error fetching heart rate data:', err);
        return [];
      }),
    ]);

    // Procesar y guardar datos
    let recordsSync = 0;

    // Guardar datos de sueño
    for (const sleep of sleepData) {
      await db.saveHealthMetric(userId, 'oura', {
        date: new Date(sleep.day),
        sleepDuration: sleep.total_sleep / 3600, // Convertir a horas
        deepSleep: sleep.deep_sleep / 3600,
        remSleep: sleep.rem_sleep / 3600,
        lightSleep: sleep.light_sleep / 3600,
        awakeTime: sleep.awake_time / 3600,
        metadata: {
          bedtimeStart: sleep.bedtime_start,
          bedtimeEnd: sleep.bedtime_end,
        },
      });
      recordsSync++;
    }

    // Guardar datos de actividad
    for (const activity of activityData) {
      await db.saveHealthMetric(userId, 'oura', {
        date: new Date(activity.day),
        caloriesBurned: activity.cal_total,
        caloriesActive: activity.cal_active,
        steps: activity.steps,
        met: activity.met,
        metadata: {
          nonWear: activity.non_wear,
          rest: activity.rest,
          inactive: activity.inactive,
          low: activity.low,
          medium: activity.medium,
          high: activity.high,
        },
      });
      recordsSync++;
    }

    // Guardar datos de readiness
    for (const readiness of readinessData) {
      await db.saveHealthMetric(userId, 'oura', {
        date: new Date(readiness.day),
        recoveryScore: readiness.score,
        restingHeartRate: readiness.resting_heart_rate,
        heartRateVariability: readiness.heart_rate_variability,
        metadata: {
          temperatureDeviation: readiness.temperature_deviation,
          temperatureTrendDeviation: readiness.temperature_trend_deviation,
          recoveryIndex: readiness.recovery_index,
          sleepPerformance: readiness.sleep_performance,
          previousDayActivity: readiness.previous_day_activity,
          previousNightSleep: readiness.previous_night_sleep,
        },
      });
      recordsSync++;
    }

    // Actualizar último sync
    await db.updateWearableConnectionLastSync(connectionId);

    return {
      success: true,
      message: `Sincronización de Oura completada: ${recordsSync} registros`,
      recordsSync,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Retry logic con exponential backoff
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `Oura sync failed (attempt ${retryCount + 1}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms:`,
        errorMessage
      );

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return syncOuraData(
        userId,
        connectionId,
        encryptedAccessToken,
        encryptedRefreshToken,
        expiresAt,
        retryCount + 1
      );
    }

    console.error(`Oura sync failed after ${MAX_RETRIES} attempts:`, errorMessage);

    return {
      success: false,
      message: `Sincronización de Oura falló: ${errorMessage}`,
      recordsSync: 0,
      error: errorMessage,
    };
  }
}

/**
 * Sincroniza datos de Oura para todos los usuarios conectados
 */
export async function syncAllOuraData(): Promise<{
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}> {
  const errors: Array<{ userId: string; error: string }> = [];
  let successful = 0;
  let failed = 0;

  try {
    const connections = await db.getAllWearableConnections('oura');

    for (const connection of connections) {
      try {
        const result = await syncOuraData(
          connection.userId,
          connection.id,
          connection.accessToken,
          connection.refreshToken,
          connection.expiresAt
        );

        if (result.success) {
          successful++;
          console.log(`✓ Oura sync successful for user ${connection.userId}: ${result.message}`);
        } else {
          failed++;
          errors.push({
            userId: connection.userId,
            error: result.error || result.message,
          });
          console.error(`✗ Oura sync failed for user ${connection.userId}: ${result.message}`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ userId: connection.userId, error: errorMessage });
        console.error(`✗ Oura sync error for user ${connection.userId}:`, errorMessage);
      }
    }

    return {
      total: connections.length,
      successful,
      failed,
      errors,
    };
  } catch (error) {
    console.error('Error syncing all Oura data:', error);
    throw error;
  }
}
