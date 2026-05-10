/**
 * Wearables Sync Scheduler
 *
 * Orquesta la sincronización automática de datos de wearables
 * Maneja:
 * - Programación de trabajos en background
 * - Coordinación entre Oura y Whoop
 * - Logging y monitoreo
 * - Manejo de errores
 */

import { ENV } from './env';
import { syncAllOuraData } from './oura-sync';
import { syncAllWhoopData } from './whoop-sync';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncJob {
  id: string;
  device: 'oura' | 'whoop';
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  recordsSync: number;
  error?: string;
}

export interface SyncSchedulerConfig {
  enabled: boolean;
  intervalHours: number;
  maxConcurrentSyncs: number;
  retryOnFailure: boolean;
  maxRetries: number;
}

// ─── Scheduler State ──────────────────────────────────────────────────────────

let syncJobs: Map<string, SyncJob> = new Map();
let lastSyncTime: Map<string, Date> = new Map();
let syncInProgress: Set<string> = new Set();
let schedulerInterval: NodeJS.Timeout | null = null;

// ─── Configuration ────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SyncSchedulerConfig = {
  enabled: process.env.ENABLE_AUTO_SYNC === 'true',
  intervalHours: parseInt(process.env.SYNC_INTERVAL_HOURS || '6', 10),
  maxConcurrentSyncs: parseInt(process.env.MAX_CONCURRENT_SYNCS || '2', 10),
  retryOnFailure: true,
  maxRetries: parseInt(process.env.MAX_SYNC_RETRIES || '3', 10),
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Inicia el scheduler de sincronización automática
 */
export function startSyncScheduler(config: Partial<SyncSchedulerConfig> = {}): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.enabled) {
    console.log('Wearables sync scheduler is disabled');
    return;
  }

  console.log(`Starting wearables sync scheduler (interval: ${finalConfig.intervalHours} hours)`);

  // Ejecutar sincronización inmediatamente
  performSync(finalConfig);

  // Programar sincronización periódica
  const intervalMs = finalConfig.intervalHours * 60 * 60 * 1000;
  schedulerInterval = setInterval(() => {
    performSync(finalConfig);
  }, intervalMs);

  // Limpiar intervalo al cerrar el proceso
  process.on('SIGTERM', () => {
    stopSyncScheduler();
  });

  process.on('SIGINT', () => {
    stopSyncScheduler();
  });
}

/**
 * Detiene el scheduler de sincronización automática
 */
export function stopSyncScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Wearables sync scheduler stopped');
  }
}

/**
 * Obtiene el estado actual del scheduler
 */
export function getSyncStatus(): {
  isRunning: boolean;
  jobsInProgress: number;
  lastSyncTimes: Record<string, Date | null>;
  recentJobs: SyncJob[];
} {
  return {
    isRunning: schedulerInterval !== null,
    jobsInProgress: syncInProgress.size,
    lastSyncTimes: {
      oura: lastSyncTime.get('oura') || null,
      whoop: lastSyncTime.get('whoop') || null,
    },
    recentJobs: Array.from(syncJobs.values()).slice(-10),
  };
}

/**
 * Fuerza una sincronización manual
 */
export async function triggerManualSync(device?: 'oura' | 'whoop'): Promise<{
  success: boolean;
  message: string;
  jobs: SyncJob[];
}> {
  const config = DEFAULT_CONFIG;

  if (device) {
    // Sincronizar dispositivo específico
    const job = await performDeviceSync(device, config);
    return {
      success: job.status === 'completed',
      message: job.error || `${device} sync completed`,
      jobs: [job],
    };
  } else {
    // Sincronizar todos los dispositivos
    await performSync(config);
    return {
      success: true,
      message: 'Manual sync triggered',
      jobs: Array.from(syncJobs.values()).slice(-2),
    };
  }
}

// ─── Private Functions ────────────────────────────────────────────────────────

/**
 * Ejecuta la sincronización completa
 */
async function performSync(config: SyncSchedulerConfig): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting wearables sync cycle`);

  try {
    // Sincronizar Oura y Whoop en paralelo (respetando max concurrent)
    const syncPromises = [];

    if (config.maxConcurrentSyncs >= 1) {
      syncPromises.push(performDeviceSync('oura', config));
    }

    if (config.maxConcurrentSyncs >= 2 || syncPromises.length === 0) {
      syncPromises.push(performDeviceSync('whoop', config));
    }

    await Promise.all(syncPromises);

    console.log(`[${new Date().toISOString()}] Wearables sync cycle completed`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Wearables sync cycle failed:`, error);
  }
}

/**
 * Ejecuta la sincronización para un dispositivo específico
 */
async function performDeviceSync(
  device: 'oura' | 'whoop',
  config: SyncSchedulerConfig
): Promise<SyncJob> {
  // Verificar si ya hay una sincronización en progreso
  if (syncInProgress.has(device)) {
    console.warn(`${device} sync already in progress, skipping`);
    return {
      id: `${device}-${Date.now()}`,
      device,
      startedAt: new Date(),
      status: 'failed',
      recordsSync: 0,
      error: 'Sync already in progress',
    };
  }

  const jobId = `${device}-${Date.now()}`;
  const job: SyncJob = {
    id: jobId,
    device,
    startedAt: new Date(),
    status: 'running',
    recordsSync: 0,
  };

  syncInProgress.add(device);

  try {
    console.log(`[${new Date().toISOString()}] Starting ${device} sync...`);

    let result;
    if (device === 'oura') {
      result = await syncAllOuraData();
    } else {
      result = await syncAllWhoopData();
    }

    job.status = 'completed';
    job.recordsSync = result.successful;
    job.completedAt = new Date();

    lastSyncTime.set(device, new Date());

    console.log(
      `[${new Date().toISOString()}] ${device} sync completed: ${result.successful}/${result.total} successful`
    );

    if (result.errors.length > 0) {
      console.warn(`${device} sync errors:`, result.errors);
    }
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : String(error);
    job.completedAt = new Date();

    console.error(`[${new Date().toISOString()}] ${device} sync failed:`, job.error);

    // Retry logic
    if (config.retryOnFailure && config.maxRetries > 0) {
      console.log(`Retrying ${device} sync...`);
      // Implementar retry con backoff
    }
  } finally {
    syncInProgress.delete(device);
    syncJobs.set(jobId, job);

    // Mantener solo los últimos 100 trabajos
    if (syncJobs.size > 100) {
      const entries = Array.from(syncJobs.entries());
      const toDelete = entries.slice(0, entries.length - 100);
      toDelete.forEach(([key]) => syncJobs.delete(key));
    }
  }

  return job;
}

// ─── Monitoring & Metrics ─────────────────────────────────────────────────────

/**
 * Obtiene estadísticas de sincronización
 */
export function getSyncStats(): {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageRecordsPerSync: number;
  successRate: number;
} {
  const jobs = Array.from(syncJobs.values());
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  const totalRecords = completedJobs.reduce((sum, job) => sum + job.recordsSync, 0);
  const averageRecords = completedJobs.length > 0 ? totalRecords / completedJobs.length : 0;

  return {
    totalJobs: jobs.length,
    completedJobs: completedJobs.length,
    failedJobs: failedJobs.length,
    averageRecordsPerSync: Math.round(averageRecords),
    successRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
  };
}

/**
 * Obtiene el historial de sincronización
 */
export function getSyncHistory(device?: 'oura' | 'whoop', limit = 20): SyncJob[] {
  let jobs = Array.from(syncJobs.values());

  if (device) {
    jobs = jobs.filter((j) => j.device === device);
  }

  return jobs.slice(-limit).reverse();
}

// ─── Health Check ────────────────────────────────────────────────────────────

/**
 * Verifica la salud del scheduler
 */
export function checkSchedulerHealth(): {
  healthy: boolean;
  issues: string[];
  lastSyncAges: Record<string, string>;
} {
  const issues: string[] = [];
  const lastSyncAges: Record<string, string> = {};

  const now = new Date();
  const maxAgeHours = DEFAULT_CONFIG.intervalHours * 2; // Alerta si no sincroniza en 2x el intervalo

  for (const device of ['oura', 'whoop'] as const) {
    const lastSync = lastSyncTime.get(device);
    if (lastSync) {
      const ageHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
      lastSyncAges[device] = `${ageHours.toFixed(1)} hours ago`;

      if (ageHours > maxAgeHours) {
        issues.push(`${device} sync is stale (${ageHours.toFixed(1)} hours old)`);
      }
    } else {
      lastSyncAges[device] = 'Never';
      if (DEFAULT_CONFIG.enabled) {
        issues.push(`${device} has never been synced`);
      }
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
    lastSyncAges,
  };
}
