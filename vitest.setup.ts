import "@testing-library/jest-dom/vitest";

// Node 26 exposes an incomplete localStorage global unless it is started with a
// persistence file. Give jsdom tests an isolated browser-compatible store.
const localStorageItems = new Map<string, string>();
const testLocalStorage: Storage = {
  get length() {
    return localStorageItems.size;
  },
  clear() {
    localStorageItems.clear();
  },
  getItem(key) {
    return localStorageItems.get(String(key)) ?? null;
  },
  key(index) {
    return [...localStorageItems.keys()][index] ?? null;
  },
  removeItem(key) {
    localStorageItems.delete(String(key));
  },
  setItem(key, value) {
    localStorageItems.set(String(key), String(value));
  },
};

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: testLocalStorage,
});
