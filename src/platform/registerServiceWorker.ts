import { getPublicBasePath, resolvePublicAssetPath } from "./publicPath";

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (import.meta.env.DEV) {
    unregisterDevelopmentServiceWorkers();
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(resolvePublicAssetPath("/sw.js"), {
      scope: getPublicBasePath(),
    });
  });
}

function unregisterDevelopmentServiceWorkers(): void {
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      );

    if ("caches" in window) {
      void caches
        .keys()
        .then((cacheNames) =>
          Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))),
        );
    }
  });
}
