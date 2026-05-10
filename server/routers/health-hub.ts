/**
 * Health Hub Router
 *
 * Endpoints tRPC para gestionar conexiones de wearables,
 * sincronización de datos e insights
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  generateOuraAuthUrl,
  generateWhoopAuthUrl,
  generateState,
} from '../_core/wearables-oauth';
import * as db from '../db';

export const healthHubRouter = router({
  /**
   * Obtiene todas las conexiones de wearables del usuario
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    try {
      const connections = await db.getWearableConnections(ctx.user.id);
      return connections.map((conn) => ({
        device: conn.device,
        isConnected: true,
        lastSync: conn.lastSyncAt,
        externalId: conn.externalId,
      }));
    } catch (error) {
      console.error('Error fetching wearable connections:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch connections',
      });
    }
  }),

  /**
   * Obtiene la URL de autorización para Oura
   */
  connectOura: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const state = generateState();
      // Guardar state en sesión para validar en callback
      // (En producción, guardar en BD con TTL)
      const authUrl = generateOuraAuthUrl(state);

      return {
        authUrl,
        state,
      };
    } catch (error) {
      console.error('Error generating Oura auth URL:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate Oura auth URL',
      });
    }
  }),

  /**
   * Obtiene la URL de autorización para Whoop
   */
  connectWhoop: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const state = generateState();
      // Guardar state en sesión para validar en callback
      const authUrl = generateWhoopAuthUrl(state);

      return {
        authUrl,
        state,
      };
    } catch (error) {
      console.error('Error generating Whoop auth URL:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate Whoop auth URL',
      });
    }
  }),

  /**
   * Desconecta un dispositivo wearable
   */
  disconnectWearable: protectedProcedure
    .input(
      z.object({
        device: z.enum(['oura', 'whoop']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.deleteWearableConnection(ctx.user.id, input.device);
        return {
          message: `${input.device} desconectado exitosamente`,
        };
      } catch (error) {
        console.error('Error disconnecting wearable:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to disconnect wearable',
        });
      }
    }),

  /**
   * Obtiene las métricas de salud del usuario
   */
  getMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        source: z.enum(['oura', 'whoop', 'all']).optional().default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const metrics = await db.getHealthMetrics(
          ctx.user.id,
          input.startDate,
          input.endDate,
          input.source === 'all' ? undefined : input.source
        );

        return metrics.map((metric) => ({
          date: metric.date.toISOString().split('T')[0],
          sleep_duration: metric.sleepDuration,
          recovery_score: metric.recoveryScore,
          strain_score: metric.strainScore,
          calories_burned: metric.caloriesBurned,
          steps: metric.steps,
          resting_heart_rate: metric.restingHeartRate,
        }));
      } catch (error) {
        console.error('Error fetching health metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch metrics',
        });
      }
    }),

  /**
   * Obtiene los insights personalizados del usuario
   */
  getInsights: protectedProcedure.query(async ({ ctx }) => {
    try {
      const insights = await db.getHealthInsights(ctx.user.id);

      return insights.map((insight) => ({
        id: insight.id,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        recommendation: insight.recommendation,
        metric: insight.metric
          ? {
              label: insight.metric.label,
              value: insight.metric.value,
              unit: insight.metric.unit,
              trend: insight.metric.trend,
            }
          : undefined,
      }));
    } catch (error) {
      console.error('Error fetching health insights:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch insights',
      });
    }
  }),

  /**
   * Obtiene el estado de sincronización de los dispositivos
   */
  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const connections = await db.getWearableConnections(ctx.user.id);

      return connections.map((conn) => ({
        device: conn.device,
        status: conn.lastSyncAt
          ? new Date(conn.lastSyncAt).getTime() > Date.now() - 6 * 60 * 60 * 1000
            ? 'synced'
            : 'pending'
          : 'pending',
        lastSync: conn.lastSyncAt,
        nextSync: new Date(
          (conn.lastSyncAt?.getTime() || Date.now()) + 6 * 60 * 60 * 1000
        ),
      }));
    } catch (error) {
      console.error('Error fetching sync status:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch sync status',
      });
    }
  }),

  /**
   * Sincroniza datos de un dispositivo específico
   */
  syncNow: protectedProcedure
    .input(
      z.object({
        device: z.enum(['oura', 'whoop']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Obtener conexión del dispositivo
        const connection = await db.getWearableConnection(ctx.user.id, input.device);

        if (!connection) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `${input.device} no está conectado`,
          });
        }

        // Aquí iría la lógica de sincronización real
        // Por ahora, solo actualizamos el timestamp
        await db.updateWearableConnectionLastSync(connection.id);

        return {
          message: `${input.device} sincronizado exitosamente`,
        };
      } catch (error) {
        console.error('Error syncing wearable data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync wearable data',
        });
      }
    }),

  /**
   * Obtiene datos detallados de Oura
   */
  getOuraData: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const data = await db.getOuraData(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );

        return data;
      } catch (error) {
        console.error('Error fetching Oura data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Oura data',
        });
      }
    }),

  /**
   * Obtiene datos detallados de Whoop
   */
  getWhoopData: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const data = await db.getWhoopData(
          ctx.user.id,
          new Date(input.startDate),
          new Date(input.endDate)
        );

        return data;
      } catch (error) {
        console.error('Error fetching Whoop data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Whoop data',
        });
      }
    }),
});
