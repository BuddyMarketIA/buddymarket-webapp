// BuddyMarket Service Worker v7 — CLEANUP & UNREGISTER
// Este SW elimina todas las cachés antiguas y se auto-desregistra
// para resolver definitivamente el problema de respuestas HTML cacheadas

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Eliminar TODAS las cachés sin excepción
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // Tomar control de todos los clientes
      await self.clients.claim();

      // Notificar a todos los clientes que recarguen
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        client.postMessage({ type: 'SW_CLEANUP_DONE' });
      });

      // Auto-desregistrar este SW para que no interfiera más
      await self.registration.unregister();
    })()
  );
});

// Pasar todas las peticiones directamente a la red sin cachear
self.addEventListener('fetch', () => {
  // Sin interceptación — todo va directamente al servidor
});
