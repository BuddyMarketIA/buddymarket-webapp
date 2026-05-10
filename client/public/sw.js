/**
 * BuddyMarket Service Worker v2.0
 * - Notificaciones push de recordatorios de comidas
 * - Caché offline para assets estáticos
 */

const CACHE_NAME = "buddymarket-v2";

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log("[SW] Installing BuddyMarket SW v2");
  event.waitUntil(self.skipWaiting());
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating BuddyMarket SW v2");
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch (network-first para navegación, cache-first para assets) ───────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/").then((r) => r || fetch(event.request)))
    );
    return;
  }

  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
      )
    );
  }
});

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "BuddyMarket", body: "Tienes una notificación", icon: "/icons/icon-192.png", tag: "buddymarket", url: "/app/dashboard" };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icons/icon-192.png",
      tag: data.tag || "buddymarket",
      data: { url: data.url || "/app/dashboard" },
      vibrate: [200, 100, 200],
    })
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/app/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ─── Message Handler (desde MealNotifications.tsx) ───────────────────────────
let reminderTimers = [];

self.addEventListener("message", (event) => {
  if (!event.data) return;
  const { type, reminders } = event.data;
  if (type === "SCHEDULE_REMINDER") scheduleReminders(reminders || []);
  if (type === "CANCEL_ALL_REMINDERS") cancelAllReminders();
  if (type === "SKIP_WAITING") self.skipWaiting();
});

function cancelAllReminders() {
  reminderTimers.forEach((t) => clearTimeout(t));
  reminderTimers = [];
}

function scheduleReminders(reminders) {
  cancelAllReminders();
  reminders.forEach((reminder) => {
    if (!reminder.enabled) return;
    const now = new Date();
    const [hours, minutes] = reminder.time.split(":").map(Number);
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    const timer = setTimeout(() => {
      const dayBit = 1 << new Date().getDay();
      if (reminder.activeDays & dayBit) {
        self.registration.showNotification("🍽️ " + (reminder.label || "Hora de comer"), {
          body: reminder.message || "Registra tu comida en BuddyMarket",
          icon: "/icons/icon-192.png",
          tag: "meal-reminder-" + reminder.id,
          data: { url: "/app/meal-log" },
          vibrate: [200, 100, 200],
        });
      }
      scheduleReminders([reminder]);
    }, delay);
    reminderTimers.push(timer);
  });
}
