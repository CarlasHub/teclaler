const CACHE_NAME = "teclaler-app-shell-v4";
const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/u, "");
const withScope = (path) => `${scopePath}${path === "/" ? "/" : path}`;
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/images/icon.svg",
  "/images/house-simple.svg",
  "/images/bag-simple.svg",
  "/images/duck-simple.svg",
  "/images/toad-simple.svg",
  "/images/ball-simple.svg",
].map(withScope);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
