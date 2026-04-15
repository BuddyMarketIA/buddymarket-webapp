// BuddyMarket Service Worker — v6.0
// BREAKING CHANGE v6: Cleared all caches (v5 had stale HTML responses cached for API routes)
// Strategies:
//   Shell (cache-first)                     → HTML shell, manifest, icons
//   Static assets (stale-while-revalidate)  → JS/CSS bundles, fonts
//   Images (cache-first + CDN)              → recipe/menu images, CDN assets
//   API data (network-first + offline fallback) → tRPC calls for recipes, menus, catalog
//   Auth routes (NEVER cached)              → login, register, me, logout, SSO
//   Offline queue (IndexedDB)               → mutations queued while offline, replayed on reconnect

const SHELL_CACHE   = 'buddymarket-shell-v6';
const STATIC_CACHE  = 'buddymarket-static-v6';
const API_CACHE     = 'buddymarket-api-v6';
const IMAGE_CACHE   = 'buddymarket-images-v6';
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, API_CACHE, IMAGE_CACHE];

// Auth-related patterns that must NEVER be cached
const AUTH_PATTERNS = [
  'auth.login',
  'auth.register',
  'auth.logout',
  'auth.me',
  'auth.sendOTP',
  'auth.verifyOTP',
  'auth.forgotPassword',
  'auth.resetPassword',
  'auth.acceptTerms',
  '/api/auth/',
  '/api/oauth/',
];

// API endpoints that should be cached for offline use (non-auth only)
const CACHEABLE_API_PATTERNS = [
  'contentSync.getRecipeCatalog',
  'contentSync.getMenuCatalog',
  'contentSync.getSyncManifest',
  'catalogs.allergies',
  'catalogs.dietRestrictions',
  'catalogs.foodCategories',
  'recipes.list',
  'recipes.detail',
  'menus.list',
  'menus.detail',
  'household.menus',
];

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
];

// ─── IndexedDB helpers for offline queue ─────────────────────────────────────

const DB_NAME = 'buddymarket-offline';
const DB_VERSION = 1;
const STORE_QUEUE = 'sync-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const store = db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function queueMutation(payload) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).add({ ...payload, timestamp: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getPendingMutations() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    const req = tx.objectStore(STORE_QUEUE).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deleteMutation(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    tx.objectStore(STORE_QUEUE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Delete ALL old caches (including v5 which may have stale HTML responses)
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => {
        console.log('[SW v6] Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET — mutations always go directly to network
  if (request.method !== 'GET') return;

  // ── CRITICAL: Never cache auth routes — always go to network ──────────────
  const isAuthRoute = AUTH_PATTERNS.some(
    (p) => url.pathname.includes(p) || url.search.includes(p)
  );
  if (isAuthRoute) return; // Let browser handle directly, no SW interception

  // ── API data: network-first with offline fallback ──────────────────────────
  if (url.pathname.startsWith('/api/trpc/')) {
    const isCacheable = CACHEABLE_API_PATTERNS.some(
      (p) => url.pathname.includes(p) || url.search.includes(p)
    );
    if (!isCacheable) return; // Non-cacheable API calls go directly to network

    event.respondWith(
      fetch(request.clone()).then((response) => {
        // Only cache valid JSON responses, never HTML
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            clone.blob().then((blob) => {
              const headers = new Headers({
                'Content-Type': 'application/json',
                'sw-cached-at': Date.now().toString(),
              });
              cache.put(request, new Response(blob, { status: 200, headers }));
            });
          });
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(
          JSON.stringify({ error: { message: 'Sin conexion y sin datos en cache' } }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Skip other API calls — never intercept /api/* routes
  if (url.pathname.startsWith('/api/')) return;

  // ── Navigation: network-first, fallback to shell ──────────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((cached) => cached || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // ── JS/CSS bundles: stale-while-revalidate ────────────────────────────────
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // ── Images: cache-first (includes CDN images for recipes/menus) ──────────
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    url.hostname.includes('cloudfront') ||
    url.hostname.includes('placehold.co') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => new Response('', { status: 404 }));
        })
      )
    );
    return;
  }
});

// ─── Background Sync: replay queued mutations on reconnect ───────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'replay-mutations') {
    event.waitUntil(replayQueuedMutations());
  }
});

async function replayQueuedMutations() {
  const pending = await getPendingMutations();
  for (const item of pending) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });
      if (response.ok) {
        await deleteMutation(item.id);
      }
    } catch (_) {
      // Will retry on next sync event
    }
  }
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETE' }));
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === 'TRIGGER_SYNC') {
    replayQueuedMutations();
    return;
  }
  if (event.data?.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE).then(() => {
      event.source?.postMessage({ type: 'API_CACHE_CLEARED' });
    });
    return;
  }
  if (event.data?.type === 'GET_PENDING_COUNT') {
    getPendingMutations().then((pending) => {
      event.source?.postMessage({ type: 'PENDING_COUNT', count: pending.length });
    });
    return;
  }
  if (event.data?.type === 'SCHEDULE_REMINDER') {
    const { title, mealType, summary, delay } = event.data;
    const body = summary
      ? buildNotificationBody(summary, mealType)
      : `Es hora de registrar tu ${mealType || 'comida'}!`;
    setTimeout(() => {
      self.registration.showNotification(title || 'BuddyMarket', {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `local-meal-reminder-${mealType || 'generic'}`,
        data: { url: '/meal-log' },
        vibrate: [200, 100, 200],
        actions: [
          { action: 'open', title: 'Registrar ahora' },
          { action: 'dismiss', title: 'Mas tarde' },
        ],
      });
    }, delay || 0);
  }
});

// =============================================================================
// NOTIFICATION HELPERS
// =============================================================================

function buildNotificationBody(summary, mealType) {
  const mealEmojis = {
    desayuno: '🌅',
    almuerzo: '☀️',
    merienda: '🍎',
    cena: '🌙',
    snack: '🥜',
    actividad: '🏃',
  };
  const emoji = mealEmojis[mealType] || '🍽️';
  const isActivity = mealType === 'actividad';
  const mealLabel = isActivity
    ? '🏃 Hora de entrenar!'
    : (mealType ? `${emoji} Hora de ${mealType}` : '🍽️ Hora de comer');
  if (isActivity) {
    return `${mealLabel}\n💪 Registra tu actividad fisica de hoy en BuddyMarket.`;
  }
  if (!summary || summary.goal <= 0) {
    return `${mealLabel} — Recuerda registrar tus comidas!`;
  }
  const { consumed, goal, percentage, remaining, proteins, carbohydrates, fats } = summary;
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  if (consumed === 0) {
    return `${mealLabel}\n📊 ${bar} 0%\nAun no has registrado comidas hoy. Empieza ahora!`;
  }
  const lines = [
    `${mealLabel}`,
    `📊 ${bar} ${percentage}%`,
    `🔥 ${consumed} / ${goal} kcal consumidas`,
  ];
  if (remaining > 0) {
    lines.push(`⚡ Te quedan ${remaining} kcal para tu objetivo`);
  } else {
    lines.push(`✅ Has alcanzado tu objetivo calorico!`);
  }
  lines.push(`🥩 P: ${proteins}g  🌾 C: ${carbohydrates}g  🫒 G: ${fats}g`);
  return lines.join('\n');
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

self.addEventListener('push', (event) => {
  let data = {
    title: 'BuddyMarket',
    body: 'Recuerda registrar tus comidas!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'meal-reminder',
    url: '/meal-log',
    mealType: null,
    summary: null,
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  if (data.summary) {
    data.body = buildNotificationBody(data.summary, data.mealType);
  }
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    tag: data.tag || 'meal-reminder',
    data: { url: data.url || '/meal-log' },
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Registrar ahora' },
      { action: 'dismiss', title: 'Mas tarde' },
    ],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const targetUrl = event.notification.data?.url || '/meal-log';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
