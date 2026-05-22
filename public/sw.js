/**
 * MyCrewFest — Service Worker
 *
 * Strategy:
 * - Cache First  : static assets (JS, CSS, fonts, images)
 * - Network First: API calls — falls back to cache if offline
 * - Offline page : /festevent/[id]/offline for navigation requests
 */

const CACHE_VERSION = "mcf-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  "/",
  "/catalogue",
  "/offline",
];

// ---------------------------------------------------------------------------
// Install — pre-cache static assets
// ---------------------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {
        // Non-fatal: assets may not all be available at install time
      }),
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — clean up old caches
// ---------------------------------------------------------------------------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch — routing logic
// ---------------------------------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // API calls: Network First with cache fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Static assets (JS, CSS, images, fonts): Cache First
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)$/)
  ) {
    event.respondWith(cacheFirstWithNetwork(request));
    return;
  }

  // Navigation requests: Network First, fallback to cached page or offline page
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }
});

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "Vous êtes hors-ligne." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return new Response("Asset non disponible hors-ligne.", { status: 503 });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    // Try to return cached version of the exact page
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fall back to offline page if it exists in cache
    const offlinePage = await caches.match("/offline");
    if (offlinePage) return offlinePage;

    return new Response(
      "<!DOCTYPE html><html><body><h1>Hors-ligne</h1><p>Aucune page en cache.</p></body></html>",
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  }
}
