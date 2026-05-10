/**
 * Wearables Sync Tests
 *
 * Pruebas para la sincronización automática de datos
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startSyncScheduler,
  stopSyncScheduler,
  getSyncStatus,
  triggerManualSync,
  getSyncStats,
  getSyncHistory,
  checkSchedulerHealth,
} from './server/_core/wearables-sync-scheduler';

describe('Wearables Sync Scheduler', () => {
  // ─── Setup & Teardown ─────────────────────────────────────────────────────

  afterEach(() => {
    stopSyncScheduler();
  });

  // ─── Scheduler Lifecycle ──────────────────────────────────────────────────

  describe('Scheduler Lifecycle', () => {
    it('should start scheduler', () => {
      startSyncScheduler({ enabled: true, intervalHours: 1 });
      const status = getSyncStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should stop scheduler', () => {
      startSyncScheduler({ enabled: true, intervalHours: 1 });
      stopSyncScheduler();
      const status = getSyncStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should not start if disabled', () => {
      startSyncScheduler({ enabled: false });
      const status = getSyncStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  // ─── Sync Status ──────────────────────────────────────────────────────────

  describe('Sync Status', () => {
    it('should return initial sync status', () => {
      const status = getSyncStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('jobsInProgress');
      expect(status).toHaveProperty('lastSyncTimes');
      expect(status).toHaveProperty('recentJobs');
    });

    it('should track jobs in progress', () => {
      const status = getSyncStatus();
      expect(typeof status.jobsInProgress).toBe('number');
      expect(status.jobsInProgress).toBeGreaterThanOrEqual(0);
    });

    it('should track last sync times', () => {
      const status = getSyncStatus();
      expect(status.lastSyncTimes).toHaveProperty('oura');
      expect(status.lastSyncTimes).toHaveProperty('whoop');
    });
  });

  // ─── Sync Statistics ──────────────────────────────────────────────────────

  describe('Sync Statistics', () => {
    it('should return sync stats', () => {
      const stats = getSyncStats();
      expect(stats).toHaveProperty('totalJobs');
      expect(stats).toHaveProperty('completedJobs');
      expect(stats).toHaveProperty('failedJobs');
      expect(stats).toHaveProperty('averageRecordsPerSync');
      expect(stats).toHaveProperty('successRate');
    });

    it('should calculate success rate', () => {
      const stats = getSyncStats();
      const successRate = parseFloat(stats.successRate);
      expect(successRate).toBeGreaterThanOrEqual(0);
      expect(successRate).toBeLessThanOrEqual(100);
    });

    it('should handle empty job history', () => {
      const stats = getSyncStats();
      expect(stats.totalJobs).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Sync History ────────────────────────────────────────────────────────

  describe('Sync History', () => {
    it('should return sync history', () => {
      const history = getSyncHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should filter history by device', () => {
      const ouraHistory = getSyncHistory('oura');
      const whoopHistory = getSyncHistory('whoop');

      ouraHistory.forEach((job) => {
        expect(job.device).toBe('oura');
      });

      whoopHistory.forEach((job) => {
        expect(job.device).toBe('whoop');
      });
    });

    it('should respect limit parameter', () => {
      const history = getSyncHistory(undefined, 5);
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it('should return most recent jobs first', () => {
      const history = getSyncHistory(undefined, 10);
      if (history.length > 1) {
        for (let i = 0; i < history.length - 1; i++) {
          const current = new Date(history[i].startedAt).getTime();
          const next = new Date(history[i + 1].startedAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  // ─── Scheduler Health ─────────────────────────────────────────────────────

  describe('Scheduler Health', () => {
    it('should check scheduler health', () => {
      const health = checkSchedulerHealth();
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('issues');
      expect(health).toHaveProperty('lastSyncAges');
    });

    it('should have boolean healthy status', () => {
      const health = checkSchedulerHealth();
      expect(typeof health.healthy).toBe('boolean');
    });

    it('should track last sync ages', () => {
      const health = checkSchedulerHealth();
      expect(health.lastSyncAges).toHaveProperty('oura');
      expect(health.lastSyncAges).toHaveProperty('whoop');
    });

    it('should report issues as array', () => {
      const health = checkSchedulerHealth();
      expect(Array.isArray(health.issues)).toBe(true);
    });
  });

  // ─── Configuration ───────────────────────────────────────────────────────

  describe('Scheduler Configuration', () => {
    it('should accept custom configuration', () => {
      startSyncScheduler({
        enabled: true,
        intervalHours: 2,
        maxConcurrentSyncs: 1,
      });

      const status = getSyncStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should use default configuration', () => {
      startSyncScheduler();
      // Should not throw
      const status = getSyncStatus();
      expect(status).toBeDefined();
    });
  });

  // ─── Error Handling ───────────────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      expect(() => {
        startSyncScheduler({});
      }).not.toThrow();
    });

    it('should handle scheduler stop when not running', () => {
      expect(() => {
        stopSyncScheduler();
      }).not.toThrow();
    });

    it('should handle multiple stop calls', () => {
      startSyncScheduler({ enabled: true, intervalHours: 1 });
      stopSyncScheduler();
      expect(() => {
        stopSyncScheduler();
      }).not.toThrow();
    });
  });

  // ─── Concurrent Operations ────────────────────────────────────────────────

  describe('Concurrent Operations', () => {
    it('should handle concurrent status checks', async () => {
      startSyncScheduler({ enabled: true, intervalHours: 1 });

      const results = await Promise.all([
        Promise.resolve(getSyncStatus()),
        Promise.resolve(getSyncStatus()),
        Promise.resolve(getSyncStatus()),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty('isRunning');
      });
    });

    it('should handle concurrent stats queries', async () => {
      const results = await Promise.all([
        Promise.resolve(getSyncStats()),
        Promise.resolve(getSyncStats()),
      ]);

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result).toHaveProperty('totalJobs');
      });
    });
  });

  // ─── Data Integrity ───────────────────────────────────────────────────────

  describe('Data Integrity', () => {
    it('should maintain consistent state', () => {
      const status1 = getSyncStatus();
      const status2 = getSyncStatus();

      expect(status1.jobsInProgress).toBe(status2.jobsInProgress);
    });

    it('should preserve job history', () => {
      const history1 = getSyncHistory();
      const history2 = getSyncHistory();

      expect(history1.length).toBe(history2.length);
    });
  });
});
