/**
 * Ecosystem Sync Service
 * Handles automatic background synchronization between BuddyOne and other ecosystem apps
 */

import { EventEmitter } from "events";
import * as db from "../db";

interface SyncJob {
  id: string;
  userId: number;
  app: "buddycoach" | "buddyshop" | "buddycare";
  status: "pending" | "syncing" | "success" | "failed";
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  recordsCount: number;
}

interface SyncConfig {
  interval: number; // milliseconds
  maxConcurrentSyncs: number;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  timeout: number; // milliseconds
}

class EcosystemSyncService extends EventEmitter {
  private config: SyncConfig;
  private syncJobs: Map<string, SyncJob> = new Map();
  private activeSyncs: Set<string> = new Set();
  private syncInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(config?: Partial<SyncConfig>) {
    super();
    this.config = {
      interval: 2 * 60 * 60 * 1000, // 2 hours
      maxConcurrentSyncs: 5,
      retryAttempts: 3,
      retryDelay: 5 * 60 * 1000, // 5 minutes
      timeout: 30 * 60 * 1000, // 30 minutes
      ...config,
    };
  }

  /**
   * Start the automatic sync service
   */
  start(): void {
    if (this.isRunning) {
      console.warn("[EcosystemSync] Service already running");
      return;
    }

    this.isRunning = true;
    console.log("[EcosystemSync] Service started");
    this.emit("started");

    // Initial sync after 1 minute
    setTimeout(() => this.triggerSync(), 60 * 1000);

    // Schedule recurring syncs
    this.syncInterval = setInterval(() => {
      this.triggerSync();
    }, this.config.interval);
  }

  /**
   * Stop the automatic sync service
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn("[EcosystemSync] Service not running");
      return;
    }

    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log("[EcosystemSync] Service stopped");
    this.emit("stopped");
  }

  /**
   * Trigger synchronization for all connected apps
   */
  private async triggerSync(): Promise<void> {
    try {
      console.log("[EcosystemSync] Triggering sync cycle");

      // Get all users with active connections
      const connectedUsers = await this.getConnectedUsers();

      for (const userId of connectedUsers) {
        // Get apps connected for this user
        const apps = await this.getUserConnectedApps(userId);

        for (const app of apps) {
          // Check if we can add another sync
          if (this.activeSyncs.size >= this.config.maxConcurrentSyncs) {
            console.log("[EcosystemSync] Max concurrent syncs reached, queuing");
            // Queue will be processed in next cycle
            continue;
          }

          // Start sync without waiting
          this.syncUserApp(userId, app).catch((error) => {
            console.error(`[EcosystemSync] Error syncing user ${userId} with ${app}:`, error);
          });
        }
      }
    } catch (error) {
      console.error("[EcosystemSync] Error in sync cycle:", error);
      this.emit("error", error);
    }
  }

  /**
   * Sync a specific user with an app
   */
  private async syncUserApp(
    userId: number,
    app: "buddycoach" | "buddyshop" | "buddycare"
  ): Promise<void> {
    const syncId = `sync_${userId}_${app}_${Date.now()}`;

    // Check if already syncing
    if (this.activeSyncs.has(syncId)) {
      console.log(`[EcosystemSync] Sync already in progress: ${syncId}`);
      return;
    }

    this.activeSyncs.add(syncId);

    const job: SyncJob = {
      id: syncId,
      userId,
      app,
      status: "syncing",
      startedAt: new Date(),
      recordsCount: 0,
    };

    this.syncJobs.set(syncId, job);
    this.emit("sync:started", job);

    try {
      // Set timeout for sync operation
      const syncPromise = this.performSync(userId, app);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Sync timeout")),
          this.config.timeout
        )
      );

      const result = await Promise.race([syncPromise, timeoutPromise]);

      job.status = "success";
      job.completedAt = new Date();
      job.recordsCount = result.recordsCount || 0;

      console.log(`[EcosystemSync] Sync completed: ${syncId}`);
      this.emit("sync:completed", job);
    } catch (error) {
      job.status = "failed";
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : String(error);

      console.error(`[EcosystemSync] Sync failed: ${syncId}`, error);
      this.emit("sync:failed", job);

      // Retry logic
      await this.retrySync(userId, app);
    } finally {
      this.activeSyncs.delete(syncId);
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(
    userId: number,
    app: "buddycoach" | "buddyshop" | "buddycare"
  ): Promise<{ recordsCount: number }> {
    console.log(`[EcosystemSync] Performing sync for user ${userId} with ${app}`);

    // Simulate different sync operations based on app
    let recordsCount = 0;

    if (app === "buddycoach") {
      // Sync health data and training metrics
      recordsCount = await this.syncHealthData(userId);
      recordsCount += await this.syncTrainingData(userId);
    } else if (app === "buddyshop") {
      // Sync product preferences and purchase history
      recordsCount = await this.syncProductPreferences(userId);
    } else if (app === "buddycare") {
      // Sync health records and consultations
      recordsCount = await this.syncHealthRecords(userId);
    }

    return { recordsCount };
  }

  /**
   * Sync health data (sleep, recovery, HRV, etc.)
   */
  private async syncHealthData(userId: number): Promise<number> {
    try {
      console.log(`[EcosystemSync] Syncing health data for user ${userId}`);

      // Simulated health data sync
      // In production, this would:
      // 1. Fetch health metrics from BuddyOne DB
      // 2. Transform to BuddyCoach format
      // 3. Call BuddyCoach API to push data
      // 4. Handle conflicts and errors

      const healthMetrics = [
        {
          date: new Date(),
          sleepDuration: 7.5,
          sleepQuality: 85,
          recoveryScore: 78,
          hrv: 45,
          stressLevel: 3,
        },
      ];

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return healthMetrics.length;
    } catch (error) {
      console.error(`[EcosystemSync] Error syncing health data:`, error);
      throw error;
    }
  }

  /**
   * Sync training data (workouts, exercises, progress)
   */
  private async syncTrainingData(userId: number): Promise<number> {
    try {
      console.log(`[EcosystemSync] Syncing training data for user ${userId}`);

      // Simulated training data sync
      const trainingData = [
        {
          date: new Date(),
          workoutType: "strength",
          duration: 60,
          intensity: "high",
          caloriesBurned: 450,
          exercises: 5,
        },
      ];

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return trainingData.length;
    } catch (error) {
      console.error(`[EcosystemSync] Error syncing training data:`, error);
      throw error;
    }
  }

  /**
   * Sync product preferences
   */
  private async syncProductPreferences(userId: number): Promise<number> {
    try {
      console.log(`[EcosystemSync] Syncing product preferences for user ${userId}`);

      // Simulated product preferences sync
      const preferences = [
        {
          category: "supplements",
          preference: "organic",
          budget: "medium",
        },
      ];

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      return preferences.length;
    } catch (error) {
      console.error(`[EcosystemSync] Error syncing product preferences:`, error);
      throw error;
    }
  }

  /**
   * Sync health records
   */
  private async syncHealthRecords(userId: number): Promise<number> {
    try {
      console.log(`[EcosystemSync] Syncing health records for user ${userId}`);

      // Simulated health records sync
      const records = [
        {
          type: "consultation",
          date: new Date(),
          professional: "Dr. Smith",
          notes: "General checkup",
        },
      ];

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      return records.length;
    } catch (error) {
      console.error(`[EcosystemSync] Error syncing health records:`, error);
      throw error;
    }
  }

  /**
   * Retry sync with exponential backoff
   */
  private async retrySync(
    userId: number,
    app: "buddycoach" | "buddyshop" | "buddycare",
    attempt: number = 1
  ): Promise<void> {
    if (attempt > this.config.retryAttempts) {
      console.error(
        `[EcosystemSync] Max retry attempts reached for user ${userId} with ${app}`
      );
      return;
    }

    const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
    console.log(
      `[EcosystemSync] Scheduling retry ${attempt} for user ${userId} with ${app} in ${delay}ms`
    );

    setTimeout(() => {
      this.syncUserApp(userId, app).catch((error) => {
        console.error(`[EcosystemSync] Retry ${attempt} failed:`, error);
        this.retrySync(userId, app, attempt + 1);
      });
    }, delay);
  }

  /**
   * Get all users with active ecosystem connections
   */
  private async getConnectedUsers(): Promise<number[]> {
    try {
      // Simulated: In production, query from database
      // SELECT DISTINCT userId FROM ecosystemConnections WHERE isConnected = true
      return [1, 2, 3]; // Mock data
    } catch (error) {
      console.error("[EcosystemSync] Error getting connected users:", error);
      return [];
    }
  }

  /**
   * Get apps connected for a specific user
   */
  private async getUserConnectedApps(
    userId: number
  ): Promise<Array<"buddycoach" | "buddyshop" | "buddycare">> {
    try {
      // Simulated: In production, query from database
      // SELECT app FROM ecosystemConnections WHERE userId = ? AND isConnected = true
      return ["buddycoach"]; // Mock data
    } catch (error) {
      console.error(`[EcosystemSync] Error getting connected apps for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get sync job status
   */
  getSyncJobStatus(syncId: string): SyncJob | undefined {
    return this.syncJobs.get(syncId);
  }

  /**
   * Get all active syncs
   */
  getActiveSyncs(): SyncJob[] {
    return Array.from(this.syncJobs.values()).filter((job) => job.status === "syncing");
  }

  /**
   * Get recent sync history
   */
  getRecentSyncHistory(limit: number = 50): SyncJob[] {
    return Array.from(this.syncJobs.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    activeSyncs: number;
    successRate: number;
  } {
    const jobs = Array.from(this.syncJobs.values());
    const successful = jobs.filter((j) => j.status === "success").length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const active = this.activeSyncs.size;

    return {
      totalSyncs: jobs.length,
      successfulSyncs: successful,
      failedSyncs: failed,
      activeSyncs: active,
      successRate: jobs.length > 0 ? (successful / jobs.length) * 100 : 0,
    };
  }

  /**
   * Clear old sync jobs (older than specified days)
   */
  clearOldJobs(daysOld: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let cleared = 0;

    for (const [key, job] of this.syncJobs.entries()) {
      if (job.completedAt && job.completedAt < cutoffDate) {
        this.syncJobs.delete(key);
        cleared++;
      }
    }

    console.log(`[EcosystemSync] Cleared ${cleared} old sync jobs`);
    return cleared;
  }
}

// Export singleton instance
export const ecosystemSyncService = new EcosystemSyncService();

// Export class for testing
export { EcosystemSyncService };
