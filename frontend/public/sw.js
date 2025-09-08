// Service Worker for Tamil Language Society
// Provides offline functionality and caching

const CACHE_VERSION = "v10.0";
const CACHE_NAME = `tamil-society-${CACHE_VERSION}`;
const STATIC_CACHE = `tamil-society-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `tamil-society-dynamic-${CACHE_VERSION}`;
const ALLOWED_CACHES = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];

const staticAssets = [
  "/",
  "/index.html",
  "/about.html",
  "/books.html",
  "/ebooks.html",
  "/projects.html",
  "/contact.html",
  "/donate.html",
  "/notifications.html",
  "/login.html",
  "/signup.html",
  "/forgot-password.html",
  "/reset-password.html",
  "/404.html",
  "/error.html",
  "/detail.html",
  "/css/style.css",
  "/css/responsive.css",
  "/css/animations.css",
  "/css/slideshow.css",
  "/js/main.js",
  "/js/notifications.js",
  "/js/api-integration.js",
  "/js/modal-sidebar-manager.js",
  "/js/content-manager.js",
  "/js/auth.js",
  "/js/auth-utils.js",
  "/js/slideshow.js",
  // '/js/mock-api.js', // Removed - using real backend API
  "/assets/logo.png"
];

// Assets that should never be cached
const noCachePatterns = [
  "/api/",
  "/admin.js",
  
  "admin.html"
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log("Opened static cache");
        return cache.addAll(staticAssets);
      })
      .catch((error) => {
        console.log("Cache installation failed:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!ALLOWED_CACHES.includes(cacheName)) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - serve cached content when offline
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and non-HTTP(S) requests
  if (event.request.method !== "GET" || 
      !event.request.url.startsWith("http") ||
      event.request.url.startsWith("chrome-extension://") ||
      event.request.url.startsWith("moz-extension://") ||
      event.request.url.startsWith("safari-extension://") ||
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Check if request should never be cached
  const shouldNotCache = noCachePatterns.some(pattern => 
    event.request.url.includes(pattern)
  );

  if (shouldNotCache) {
    // Network-only for dynamic content with better error handling
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.error("Network fetch failed for:", event.request.url, error);
        // For JavaScript files, try to serve from cache as fallback
        if (event.request.url.includes(".js")) {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log("Serving JS file from cache after network failure:", event.request.url);
              return cachedResponse;
            }
            // If no cache available, return a basic error response
            return new Response("// File temporarily unavailable", {
              status: 200,
              statusText: "OK",
              headers: { "Content-Type": "application/javascript" }
            });
          });
        }
        throw error;
      })
    );
    return;
  }

  // For static assets, use cache-first strategy
  const isStaticAsset = staticAssets.some(asset => 
    event.request.url.endsWith(asset) || event.request.url.includes(asset)
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log("Serving static asset from cache:", event.request.url);
            return response;
          }
          return fetch(event.request).then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.error("Static cache put error:", error);
                });
            }
            return response;
          });
        })
    );
  } else {
    // For other content, use network-first strategy
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.error("Dynamic cache put error:", error);
              });
          }
          return response;
        })
        .catch((error) => {
          console.log("Network failed, trying cache for:", event.request.url);
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                console.log("Serving from cache after network failure:", event.request.url);
                return response;
              }
              // If both cache and network fail, show offline page for documents
              if (event.request.destination === "document") {
                return caches.match("/index.html");
              }
              throw error;
            });
        })
    );
  }
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Background sync triggered");
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline form submissions when back online
  try {
    const cache = await caches.open("offline-forms");
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
          console.log("Offline form submitted successfully");
        }
      } catch (error) {
        console.log("Failed to submit offline form:", error);
      }
    }
  } catch (error) {
    console.log("Background sync failed:", error);
  }
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("Push notification received");
  
  const options = {
    body: event.data ? event.data.text() : "New notification from Tamil Language Society",
    icon: "/assets/logo.png",
    badge: "/assets/logo.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: "explore",
        title: "Explore",
        icon: "/assets/logo.png"
      },
      {
        action: "close",
        title: "Close",
        icon: "/assets/logo.png"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification("Tamil Language Society", options)
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked");
  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});

// Message handling from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  // Handle cache clearing requests
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!ALLOWED_CACHES.includes(cacheName)) {
              console.log("Clearing old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
  
  // Handle force cache refresh
  if (event.data && event.data.type === "FORCE_REFRESH") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Force clearing cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // Notify all clients to reload
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "CACHE_CLEARED" });
          });
        });
      })
    );
  }
});

console.log("Service Worker loaded successfully");