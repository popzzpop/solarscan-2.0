// SolarScan Malta - Service Worker for PWA
// Provides offline support and caching for better performance

const CACHE_NAME = 'solarscan-malta-v2.1-zoom19';
const STATIC_CACHE = 'solarscan-static-v2.1-zoom19';
const DYNAMIC_CACHE = 'solarscan-dynamic-v2.1-zoom19';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  // Core app shell - these will be available in build
  '/_app/immutable/entry/start.js',
  '/_app/immutable/entry/app.js',
  '/_app/immutable/chunks/scheduler.js',
  '/_app/immutable/chunks/index.js',
  // Fonts and external resources
  'https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker v2-mobile: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        // Cache core files, but don't fail if some are missing
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => 
            cache.add(asset).catch(err => 
              console.warn(`Failed to cache ${asset}:`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('Service Worker v2-mobile: Static assets cached');
        return self.skipWaiting(); // Activate immediately - forces update
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker v2-mobile: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker v2-mobile: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker v2-mobile: Activated - forcing page reload');
        // Force all clients to reload to get new version
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.navigate(client.url);
          });
        });
      })
      .then(() => {
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle different types of requests
  if (url.origin === location.origin) {
    // Same origin - use cache first for static assets
    event.respondWith(handleStaticAssets(request));
  } else if (url.hostname === 'maps.googleapis.com' || 
             url.hostname === 'maps.gstatic.com') {
    // Google Maps - cache tiles for offline viewing
    event.respondWith(handleMapAssets(request));
  } else if (url.hostname === 'solar.googleapis.com') {
    // Solar API - network first (always fresh data)
    event.respondWith(handleSolarAPI(request));
  } else {
    // External resources - network first
    event.respondWith(handleExternalResources(request));
  }
});

// Handle static assets (cache first)
async function handleStaticAssets(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Static asset fetch failed:', error);
    
    // If it's the main page and we're offline, serve cached version
    if (request.url.includes('solarscan') || request.url === location.origin + '/') {
      const cachedResponse = await caches.match('/');
      if (cachedResponse) return cachedResponse;
    }
    
    throw error;
  }
}

// Handle Google Maps assets (cache first for tiles)
async function handleMapAssets(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache map tiles and static resources
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Map asset fetch failed:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

// Handle Solar API (network first - always fresh data)
async function handleSolarAPI(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful API responses for offline fallback
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Service Worker: Solar API fetch failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

// Handle external resources (network first)
async function handleExternalResources(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache fonts and other external resources
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

// Background sync for analytics or data collection
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks here
      console.log('Service Worker: Background sync triggered')
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'explore',
          title: 'View Analysis',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});