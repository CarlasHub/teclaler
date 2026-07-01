export function registerServiceWorker(): void {
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}
