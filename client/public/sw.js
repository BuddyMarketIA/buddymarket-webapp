// BuddyMarket Service Worker v9 — KILL SWITCH
// Se desregistra en el mismo momento de instalarse.
// No intercepta ninguna petición (sin fetch handler).

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      // Desregistrarse definitivamente — nunca más habrá un SW activo
      await self.registration.unregister();
    })()
  );
});

// SIN fetch handler — ninguna petición es interceptada bajo ninguna circunstancia
