const CACHE_NAME = 'trimo-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './IconTrimo.png',
  './HeaderTrimo.png',
  './HeaderTrimo2.png',
  './assets/index.css',
  './assets/index.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // If we have a cached response, return it
          if (cachedResponse) {
            return cachedResponse;
          }

          // Otherwise, fetch from the network
          return fetch(event.request).then(
            networkResponse => {
              // A response is a stream and can only be consumed once.
              // We need to clone it to put one copy in the cache and send one to the browser.
              const responseToCache = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  // Cache the response. For cross-origin resources, this will be an 'opaque' response.
                  cache.put(event.request, responseToCache);
                });

              return networkResponse;
            }
          ).catch(error => {
              console.error('Service Worker fetch failed:', error);
              // In a real-world app, you might want to return a fallback offline page here.
              throw error;
          });
        })
    );
});