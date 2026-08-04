import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  projects: [
    {
      name: "chrome",
      use: { browserName: "chromium", channel: "chrome" },
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:4321/joeych-pages/",
  },
  webServer: {
    command: "pnpm run build && pnpm run preview",
    url: "http://127.0.0.1:4321/joeych-pages/",
    reuseExistingServer: false,
  },
})
