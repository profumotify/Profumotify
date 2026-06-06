const CACHE_NAME = 'profumotify-v6';
const urlsToCache = [
  '/Profumotify/',
  '/Profumotify/index.html',
  '/Profumotify/app.js',
  '/Profumotify/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).catch(() => {
          // Fallback per offline
          if (event.request.mode === 'navigate') {
            return caches.match('/Profumotify/index.html');
          }
        });
      })
  );
});
