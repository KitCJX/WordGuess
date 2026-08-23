const CACHE_PREFIX = "wordguess-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const SCOPE_URL = new URL("./", self.location.href);
const APP_SHELL_PATHS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/game.js",
  "./src/ui.js",
  "./src/api.js",
  "./src/audio.js",
  "./wordBank.txt",
  "./allowedGuesses.txt",
  "./icons/icon-32.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];
const APP_SHELL_URLS = APP_SHELL_PATHS.map(path => new URL(path, SCOPE_URL).href);
const OFFLINE_DOCUMENT_URL = new URL("./index.html", SCOPE_URL).href;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, documentFallback = false) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = documentFallback ? OFFLINE_DOCUMENT_URL : request;
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    if (documentFallback) {
      const offlineDocument = await caches.match(OFFLINE_DOCUMENT_URL);
      if (offlineDocument) return offlineDocument;
    }

    throw error;
  }
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, true));
    return;
  }

  event.respondWith(networkFirst(request));
});
