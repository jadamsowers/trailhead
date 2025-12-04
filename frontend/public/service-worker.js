// Basic service worker for offline support
// Increment version number on each deployment to force cache refresh
const CACHE_NAME = "trailhead-cache-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon/icon-large-bordered.png",
  "/icon/icon-small-bordered.png",
  "/icon/favicon.ico",
  "/icon/favicon-32x32.png",
  "/icon/favicon-16x16.png",
  "/icon/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Never cache hashed assets (JS/CSS) - always fetch fresh
  // These have cache-busting hashes and should be fetched from network
  if (event.request.url.includes("/assets/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For other resources, use cache-first strategy
  event.respondWith(
    caches
      .match(event.request)
      .then(
        (response) =>
          response || fetch(event.request).catch(() => caches.match("/"))
      )
  );
});
