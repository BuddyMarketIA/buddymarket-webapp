/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope;

// ─── Core ─────────────────────────────────────────────────────────────────────
clientsClaim();
self.skipWaiting();
cleanupOutdatedCaches();

// Precache all build assets injected by Workbox at build time
precacheAndRoute(self.__WB_MANIFEST);

// ─── Navigation: serve app shell from cache (SPA fallback) ────────────────────
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "bm-pages",
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      ],
    })
  )
);

// ─── Static assets: images, fonts, icons (cache-first, long TTL) ─────────────
registerRoute(
  ({ request }) =>
    request.destination === "image" ||
    request.destination === "font" ||
    request.url.includes("manuscdn.com") ||
    request.url.includes("cloudfront.net"),
  new CacheFirst({
    cacheName: "bm-assets",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// ─── tRPC read queries: stale-while-revalidate (fast + fresh) ─────────────────
// These are GET-like queries (profile, recipes, menus, diary)
const CACHEABLE_TRPC = [
  "profile.get",
  "recipes.list",
  "recipes.getById",
  "menuOrganizer.list",
  "menuOrganizer.getById",
  "mealLogs.list",
  "progress.weightHistory",
  "metrics.getLatest",
  "dayParts.list",
];

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/api/trpc") &&
    request.method === "GET" &&
    CACHEABLE_TRPC.some((key) => url.pathname.includes(key)),
  new StaleWhileRevalidate({
    cacheName: "bm-trpc-queries",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
  })
);

// ─── Background Sync: offline mutations queue ─────────────────────────────────
// BackgroundSync is NOT supported in iOS Safari (throws on registration).
// We use feature detection to avoid crashing the Service Worker on iOS.
const MUTABLE_TRPC = [
  "mealLogs.add",
  "mealLogs.delete",
  "metrics.add",
  "menuOrganizer.confirmDayPart",
];

const supportsBackgroundSync = "SyncManager" in self;

if (supportsBackgroundSync) {
  // Only import and use BackgroundSyncPlugin on browsers that support it
  // (Chrome, Edge, Firefox) — NOT iOS Safari
  import("workbox-background-sync").then(({ BackgroundSyncPlugin }) => {
    const SYNC_QUEUE_NAME = "bm-offline-mutations";
    const bgSyncPlugin = new BackgroundSyncPlugin(SYNC_QUEUE_NAME, {
      maxRetentionTime: 7 * 24 * 60, // 7 days in minutes
      onSync: async ({ queue }) => {
        let entry;
        while ((entry = await queue.shiftRequest())) {
          try {
            await fetch(entry.request.clone());
            // Notify all open tabs that sync completed
            const clients = await self.clients.matchAll({ type: "window" });
            clients.forEach((client) =>
              client.postMessage({ type: "BM_SYNC_COMPLETE" })
            );
          } catch (_err) {
            await queue.unshiftRequest(entry);
            throw _err; // retry later
          }
        }
      },
    });

    registerRoute(
      ({ url, request }) =>
        url.pathname.startsWith("/api/trpc") &&
        request.method === "POST" &&
        MUTABLE_TRPC.some((key) => url.pathname.includes(key)),
      new NetworkFirst({
        cacheName: "bm-trpc-mutations",
        networkTimeoutSeconds: 8,
        plugins: [
          bgSyncPlugin,
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      "POST"
    );
  }).catch(() => {
    // Silently ignore if BackgroundSync fails to load
  });
} else {
  // iOS Safari fallback: use NetworkFirst without BackgroundSync
  registerRoute(
    ({ url, request }) =>
      url.pathname.startsWith("/api/trpc") &&
      request.method === "POST" &&
      MUTABLE_TRPC.some((key) => url.pathname.includes(key)),
    new NetworkFirst({
      cacheName: "bm-trpc-mutations",
      networkTimeoutSeconds: 8,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
    "POST"
  );
}

// ─── Listen for manual sync trigger from the app ──────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "BM_SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title ?? "Buddy One", {
    body: data.body ?? "",
    icon: "/icon-192x192.png",
    badge: "/icon-96x96.png",
    data: { url: data.url ?? "/app/dashboard" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/app/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
