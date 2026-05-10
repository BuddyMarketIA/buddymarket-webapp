/**
 * Health Hub Sync Router
 *
 * Endpoints tRPC para monitoreo y control de sincronización
 */

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  getSyncStatus,
  triggerManualSync,
  getSyncStats,
  getSyncHistory,
  checkSchedulerHealth,
} from '../_core/wearables-sync-scheduler';

export const healthHubSyncRouter = router({
  /**
   * Obtiene el estado actual de sincronización
   */
  getStatus: protectedProcedure.query(() => {
    try {
      const status = getSyncStatus();
      return {
        isRunning: status.isRunning,
        jobsInProgress: status.jobsInProgress,
        lastSyncTimes: {
          oura: status.lastSyncTimes.oura?.toISOString() || null,
          whoop: status.lastSyncTimes.whoop?.toISOString() || null,
        },
        recentJobs: status.recentJobs.map((job) => ({
          id: job.id,
          device: job.device,
          status: job.status,
          recordsSync: job.recordsSync,
          startedAt: job.startedAt.toISOString(),
          completedAt: job.completedAt?.toISOString() || null,
          error: job.error || null,
        })),
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get sync status',
      });
    }
  }),

  /**
   * Obtiene estadísticas de sincronización
   */
  getStats: protectedProcedure.query(() => {
    try {
      const stats = getSyncStats();
      return {
        totalJobs: stats.totalJobs,
        completedJobs: stats.completedJobs,
        failedJobs: stats.failedJobs,
        averageRecordsPerSync: stats.averageRecordsPerSync,
        successRate: stats.successRate.toFixed(1),
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get sync stats',
      });
    }
  }),

  /**
   * Obtiene el historial de sincronización
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        device: z.enum(['oura', 'whoop']).optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(({ input }) => {
      try {
        const history = getSyncHistory(input.device, input.limit);
        return history.map((job) => ({
          id: job.id,
          device: job.device,
          status: job.status,
          recordsSync: job.recordsSync,
          startedAt: job.startedAt.toISOString(),
          completedAt: job.completedAt?.toISOString() || null,
          error: job.error || null,
          duration: job.completedAt
            ? Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 1000)
            : null,
        }));
      } catch (error) {
        console.error('Error getting sync history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get sync history',
        });
      }
    }),

  /**
   * Fuerza una sincronización manual
   */
  triggerSync: protectedProcedure
    .input(
      z.object({
        device: z.enum(['oura', 'whoop']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await triggerManualSync(input.device);
        return {
          success: result.success,
          message: result.message,
          jobs: result.jobs.map((job) => ({
            id: job.id,
            device: job.device,
            status: job.status,
            recordsSync: job.recordsSync,
            startedAt: job.startedAt.toISOString(),
            completedAt: job.completedAt?.toISOString() || null,
            error: job.error || null,
          })),
        };
      } catch (error) {
        console.error('Error triggering manual sync:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger sync',
        });
      }
    }),

  /**
   * Verifica la salud del scheduler
   */
  checkHealth: publicProcedure.query(() => {
    try {
      const health = checkSchedulerHealth();
      return {
        healthy: health.healthy,
        issues: health.issues,
        lastSyncAges: health.lastSyncAges,
      };
    } catch (error) {
      console.error('Error checking scheduler health:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check scheduler health',
      });
    }
  }),
});
