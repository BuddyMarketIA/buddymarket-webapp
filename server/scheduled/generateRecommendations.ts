import { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import {
  generateRecommendationsJob,
  cleanupExpiredRecommendations,
  refreshProductCache,
} from "../jobs/generateRecommendations";

export async function generateRecommendationsHandler(
  req: Request,
  res: Response
) {
  try {
    // Authenticate as cron job
    const user = await sdk.authenticateRequest(req);

    // Verify this is a cron request
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    console.log(
      `[Handler] Generating recommendations for cron task: ${user.taskUid}`
    );

    // Run the main recommendation generation job
    const result = await generateRecommendationsJob({
      batchSize: 20,
      maxUsersPerRun: 500,
    });

    // Also run cleanup and cache refresh
    await Promise.all([
      cleanupExpiredRecommendations(),
      refreshProductCache(),
    ]);

    console.log("[Handler] Recommendation generation completed successfully");

    return res.json({
      ok: true,
      taskUid: user.taskUid,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Handler] Error in recommendation generation:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return res.status(500).json({
      error: errorMessage,
      stack,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req).catch(() => ({})))
          .taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function cleanupRecommendationsHandler(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);

    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    console.log("[Handler] Starting recommendations cleanup");

    const result = await cleanupExpiredRecommendations();

    return res.json({
      ok: true,
      taskUid: user.taskUid,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Handler] Error in cleanup:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return res.status(500).json({
      error: errorMessage,
      stack,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req).catch(() => ({})))
          .taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export async function refreshProductCacheHandler(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);

    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    console.log("[Handler] Starting product cache refresh");

    const result = await refreshProductCache();

    return res.json({
      ok: true,
      taskUid: user.taskUid,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Handler] Error refreshing cache:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return res.status(500).json({
      error: errorMessage,
      stack,
      context: {
        url: req.url,
        taskUid: (await sdk.authenticateRequest(req).catch(() => ({})))
          .taskUid,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
