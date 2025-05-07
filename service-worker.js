// service-worker.js
const CACHE_NAME = 'absensi-karyawan-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/assets/logoabsensi.png',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  // Add your CSS and JS files
  '/login',
  '/manifest.json'
];

// Install event - cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip URLs with query parameters
  if (event.request.url.includes('?')) return;
  
  // Skip some specific URLs (like auth)
  if (event.request.url.includes('/api/auth')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseToCache = response.clone();
        
        // Open cache and store response
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
          
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For HTML navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // For API requests, return a friendly error
            if (event.request.url.includes('/api/')) {
              return new Response(
                JSON.stringify({ 
                  error: 'Anda sedang offline. Silakan cek koneksi internet Anda.' 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
          });
      })
  );
});

// Listen for push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/src/assets/logoabsensi.png',
    badge: '/src/assets/logoabsensi.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});