const CACHE_NAME = 'ogsun-v3';
const urlsToCache = ['/', '/index.html', '/shop.html', '/cart.html', '/checkout.html', '/account.html', '/admin-login.html', '/admin.html', '/affiliate-login.html', '/affiliate-dashboard.html', '/logo.png'];

self.addEventListener('install', function(event) {
    event.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(urlsToCache); }));
});

self.addEventListener('fetch', function(event) {
    event.respondWith(caches.match(event.request).then(function(response) { return response || fetch(event.request); }));
});
