const CACHE_NAME = "__TECLALER_CACHE_VERSION__";
const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/u, "");
const withScope = (path) => `${scopePath}${path === "/" ? "/" : path}`;
const APP_SHELL = __TECLALER_PRECACHE_PATHS__.map(withScope);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (let index = 0; index < APP_SHELL.length; index += 16) {
        await cache.addAll(APP_SHELL.slice(index, index + 16));
      }
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key.startsWith("teclaler-"))
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

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(withScope("/index.html"))),
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
