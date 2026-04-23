/**
 * useOfflineSync — BuddyMarket offline queue
 *
 * Stores pending mutations in IndexedDB when the user is offline.
 * When the connection is restored, replays them in order via direct fetch to tRPC.
 *
 * Supported operations:
 *   - mealLogs.add                  → register a meal in the diary
 *   - mealLogs.delete               → delete a meal from the diary
 *   - metrics.add                   → log daily weight
 *   - menuOrganizer.confirmDayPart  → confirm a menu meal slot
 */

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OfflineOpType =
  | "mealLogs.add"
  | "mealLogs.delete"
  | "metrics.add"
  | "menuOrganizer.confirmDayPart";

export interface OfflineOp {
  id: string;        // crypto.randomUUID()
  type: OfflineOpType;
  payload: unknown;
  createdAt: number; // UTC ms
  attempts: number;
}

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  /** Enqueue an operation for later sync when offline */
  enqueue: (type: OfflineOpType, payload: unknown) => Promise<string>;
  /** Manually trigger sync of all pending ops */
  triggerSync: () => void;
  /** Force-clear the tRPC API cache (used after successful sync) */
  clearApiCache: () => void;
}

// ─── UUID polyfill (crypto.randomUUID not available on iOS < 15.4) ──────────────
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 UUID using Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME = "buddymarket-offline";
const STORE   = "pending-ops";
const DB_VER  = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbGetAll(): Promise<OfflineOp[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve((req.result as OfflineOp[]).sort((a, b) => a.createdAt - b.createdAt));
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(op: OfflineOp): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(op);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOfflineSync(): OfflineSyncState {
  const [isOnline,     setIsOnline]     = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [lastSyncAt,   setLastSyncAt]   = useState<Date | null>(null);
  const syncingRef = useRef(false);

  // Refresh pending count from IndexedDB
  const refreshCount = useCallback(async () => {
    try {
      const ops = await idbGetAll();
      setPendingCount(ops.length);
    } catch (_) {}
  }, []);

  // Enqueue an operation for later sync
  const enqueue = useCallback(async (type: OfflineOpType, payload: unknown): Promise<string> => {
    const op: OfflineOp = {
      id:        generateId(),
      type,
      payload,
      createdAt: Date.now(),
      attempts:  0,
    };
    await idbPut(op);
    await refreshCount();
    return op.id;
  }, [refreshCount]);

  // Replay all pending ops via tRPC POST
  const doSync = useCallback(async () => {
    if (syncingRef.current) return;
    const ops = await idbGetAll();
    if (ops.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    for (const op of ops) {
      try {
        const res = await fetch(`/api/trpc/${op.type}`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ json: op.payload }),
          credentials: "include",
        });
        if (res.ok || res.status === 400) {
          // 400 = validation error — discard (not retryable)
          await idbDelete(op.id);
        } else {
          // Server error — increment attempts, discard after 3
          const updated = { ...op, attempts: op.attempts + 1 };
          if (updated.attempts >= 3) {
            await idbDelete(op.id);
          } else {
            await idbPut(updated);
          }
        }
      } catch (_err) {
        // Network error — stop and retry later
        break;
      }
    }

    syncingRef.current = false;
    setIsSyncing(false);
    setLastSyncAt(new Date());
    await refreshCount();
  }, [refreshCount]);

  const triggerSync = useCallback(() => {
    if (!isOnline) return;
    doSync();
    // Also ask the SW to replay its background-sync queue
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if ("sync" in reg) {
          (reg as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
            .sync.register("bm-offline-mutations").catch(() => {});
        }
      });
    }
  }, [isOnline, doSync]);

  const clearApiCache = useCallback(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_API_CACHE" });
    }
  }, []);

  // Online/offline listeners
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  setTimeout(triggerSync, 800); };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);

    // Listen for SW sync-complete message
    const onSWMessage = (e: MessageEvent) => {
      if (e.data?.type === "BM_SYNC_COMPLETE" || e.data?.type === "SYNC_COMPLETE") {
        setLastSyncAt(new Date());
        refreshCount();
      }
      if (e.data?.type === "PENDING_COUNT") {
        setPendingCount(e.data.count ?? 0);
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onSWMessage);
    }

    refreshCount();

    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onSWMessage);
      }
    };
  }, [triggerSync, refreshCount]);

  return { isOnline, pendingCount, isSyncing, lastSyncAt, enqueue, triggerSync, clearApiCache };
}
