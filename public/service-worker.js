// 4G Tracker Service Worker
const CACHE_NAME = '4g-tracker-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.php',
  '/favicon.ico',
  '/manifest.json'
];

// IndexedDB configuration
const DB_NAME = '4gTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'appData';

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Store data in IndexedDB
const storeData = async (key, value) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({ id: key, value: value });
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error('Error storing data:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to store data:', error);
    return false;
  }
};

// Retrieve data from IndexedDB
const getData = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        if (event.target.result) {
          resolve(event.target.result.value);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving data:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to retrieve data:', error);
    return null;
  }
};

// Delete data from IndexedDB
const deleteData = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error('Error deleting data:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete data:', error);
    return false;
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS)
          .catch(error => {
            console.error('Failed to cache some static assets:', error);
            // Continue installation even if some assets fail to cache
            return Promise.resolve();
          });
      })
      .then(() => {
        console.log('Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
        // Continue installation despite errors
        return self.skipWaiting();
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
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache if available, otherwise fetch and cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and API calls
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('/livewire/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses, non-GET requests, or API responses
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Cache the asset
            caches.open(CACHE_NAME)
              .then((cache) => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.error('Cache put error:', error);
                }
              })
              .catch(error => {
                console.error('Cache open error:', error);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch error:', error);
            // If it's an HTML request and fetch fails, return fallback HTML
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            throw error;
          });
      })
  );
});

// Message event - handle client messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_DATA') {
    event.waitUntil(
      getData(event.data.key).then((value) => {
        // Post the result back to the client
        event.ports[0].postMessage({
          type: 'GET_DATA_RESULT',
          key: event.data.key,
          value: value
        });
      })
    );
  } else if (event.data && event.data.type === 'SET_DATA') {
    event.waitUntil(
      storeData(event.data.key, event.data.value).then((success) => {
        // Post the result back to the client
        event.ports[0].postMessage({
          type: 'SET_DATA_RESULT',
          key: event.data.key,
          success: success
        });
      })
    );
  } else if (event.data && event.data.type === 'DELETE_DATA') {
    event.waitUntil(
      deleteData(event.data.key).then((success) => {
        // Post the result back to the client
        event.ports[0].postMessage({
          type: 'DELETE_DATA_RESULT',
          key: event.data.key,
          success: success
        });
      })
    );
  }
}); 