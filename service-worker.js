const CACHE_NAME = 'apartments-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/search.html',
  '/stats.html',
  '/quiz.html',
  '/favorites.html',
  '/compare.html',
  '/css/images/icon-192x192.png',
  '/css/images/icon-512x512.png',
  '/css/images/apartment.png',
  '/css/style.css',
  '/js/app.js',
  '/js/search.js',
  '/js/stats.js',
  '/js/quiz.js',
  '/js/favorites.js',
  '/js/compare.js',
  '/js/utils.js',
  '/js/data.js',
  '/js/config.js',
  '/data/rental_data.json',

  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});