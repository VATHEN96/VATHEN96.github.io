/**
 * WowzaRush Service Worker - PWA Support
 * 
 * This service worker enables offline capabilities and faster loading
 * with special handling for blockchain content
 */

// Cache name (update version when deploying new version)
const CACHE_NAME = 'wowzarush-cache-v2'; 

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/hero-logo.svg',
  '/offline.html',
  // Icons
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

// URLs that should bypass the cache
// Important for web3 content that needs to be fresh
const BYPASS_CACHE_URLS = [
  // API endpoints
  /\/api\/campaigns/,
  /\/api\/profile/,
  // Web3 endpoints that should never be cached
  /infura\.io/,
  /alchemyapi\.io/,
];

// Install event - cache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline resources');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Pre-cache error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated successfully');
      return self.clients.claim();
    })
  );
});

// Handle fetch events - network-first strategy for API/web3 endpoints
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) &&
      !event.request.url.includes('infura.io') &&
      !event.request.url.includes('alchemyapi.io')) {
    return;
  }
  
  // Special handling for web3/API requests that should not be cached
  const shouldBypassCache = BYPASS_CACHE_URLS.some(pattern => 
    pattern.test(event.request.url)
  );
  
  if (shouldBypassCache) {
    // Network-only strategy for web3 endpoints
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, show generic offline page
          return caches.match('/offline.html');
        })
    );
    return;
  }
  
  // Network-first approach for regular content
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache, show offline page
            return caches.match('/offline.html');
          });
      })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

// Helper function to sync pending transactions
async function syncPendingTransactions() {
  // In a real implementation, you would get pending transactions from IndexedDB
  // and submit them to the blockchain
  console.log('[Service Worker] Syncing pending transactions');
  
  // Example implementation:
  // 1. Get pending transactions from IndexedDB
  // 2. For each transaction, submit to the blockchain
  // 3. Update transaction status in IndexedDB
  
  // For this example, we'll just log a message
  return Promise.resolve();
}

// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from WowzaRush',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: data.url || '/',
      },
      actions: data.actions || [],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'WowzaRush', options)
    );
  } catch (error) {
    console.error('[Service Worker] Push notification error:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.openWindow(url)
  );
}); 