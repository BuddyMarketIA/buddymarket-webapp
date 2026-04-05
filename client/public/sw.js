// BuddyMarket Service Worker — v4.0
// Strategies: Shell (cache-first) | Static assets (stale-while-revalidate) | Navigation (network-first)
const SHELL_CACHE = 'buddymarket-shell-v4';
const STATIC_CACHE = 'buddymarket-static-v4';
const CACHE_NAME = SHELL_CACHE; // keep backward-compat reference
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
];

// Install: cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !CURRENT_CACHES.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API calls
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // For navigation requests: network-first, fallback to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/').then((cached) => cached || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // JS/CSS bundles — stale-while-revalidate (serve cached, update in background)
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

  // Images & icons — cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});

// =============================================================================
// HELPERS — build caloric summary body text
// =============================================================================

/**
 * Builds a human-readable body for a meal reminder notification that includes
 * the user's caloric progress for the day.
 *
 * @param {object} summary  - { consumed, goal, percentage, remaining, proteins, carbohydrates, fats }
 * @param {string} mealType - e.g. "desayuno", "almuerzo", "cena"
 * @returns {string}
 */
function buildNotificationBody(summary, mealType) {
  const mealEmojis = {
    desayuno: '🌅',
    almuerzo: '☀️',
    merienda: '🍎',
    cena: '🌙',
    snack: '🥜',
  };
  const emoji = mealEmojis[mealType] || '🍽️';
  const mealLabel = mealType ? `${emoji} Hora de ${mealType}` : '🍽️ Hora de comer';

  if (!summary || summary.goal <= 0) {
    return `${mealLabel} — ¡Recuerda registrar tus comidas!`;
  }

  const { consumed, goal, percentage, remaining, proteins, carbohydrates, fats } = summary;

  // Progress bar using unicode blocks (10 chars wide)
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  if (consumed === 0) {
    return `${mealLabel}\n📊 ${bar} 0%\nAún no has registrado comidas hoy. ¡Empieza ahora!`;
  }

  const lines = [
    `${mealLabel}`,
    `📊 ${bar} ${percentage}%`,
    `🔥 ${consumed} / ${goal} kcal consumidas`,
  ];

  if (remaining > 0) {
    lines.push(`⚡ Te quedan ${remaining} kcal para tu objetivo`);
  } else {
    lines.push(`✅ ¡Has alcanzado tu objetivo calórico!`);
  }

  lines.push(`🥩 P: ${proteins}g  🌾 C: ${carbohydrates}g  🫒 G: ${fats}g`);

  return lines.join('\n');
}

// =============================================================================
// PUSH NOTIFICATIONS
// =============================================================================

// Handle incoming push messages from server
self.addEventListener('push', (event) => {
  let data = {
    title: 'BuddyMarket',
    body: '¡Recuerda registrar tus comidas!',
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

  // If we have a caloric summary, build an enriched body
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
      { action: 'dismiss', title: 'Más tarde' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/meal-log';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle messages from the main thread (schedule local notifications with caloric summary)
self.addEventListener('message', (event) => {
  // SW update: skip waiting when new version is ready
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'SCHEDULE_REMINDER') {
    const { title, mealType, summary, delay } = event.data;

    // Build body with caloric summary if available
    const body = summary
      ? buildNotificationBody(summary, mealType)
      : `¡Es hora de registrar tu ${mealType || 'comida'}!`;

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
          { action: 'dismiss', title: 'Más tarde' },
        ],
      });
    }, delay || 0);
  }
});
