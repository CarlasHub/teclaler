import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./qa",
  use: {
    baseURL: "http://127.0.0.1:4176/teclaler/",
    browserName: "chromium",
    channel: process.platform === "win32" ? "msedge" : undefined,
    headless: true,
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4176",
    url: "http://127.0.0.1:4176/teclaler/",
    env: { VITE_BASE_PATH: "/teclaler/" },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
