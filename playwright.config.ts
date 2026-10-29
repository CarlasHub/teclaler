import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel: process.platform === "win32" ? "msedge" : undefined,
      },
    },
    ...(process.env.QA_ALL_BROWSERS === "1"
      ? [{ name: "webkit", use: { browserName: "webkit" as const } }]
      : []),
  ],
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
