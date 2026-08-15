import { fileURLToPath } from "node:url"

import { defineConfig } from "@playwright/test"

const outputDir = fileURLToPath(new URL("../.omo/evidence/playwright/", import.meta.url))

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir,
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}",
  projects: [
    {
      name: "chrome",
      use: { browserName: "chromium", channel: "chrome" },
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:4321/joeych-pages/",
  },
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
    },
  },
  webServer: {
    command: "pnpm run build && pnpm run preview",
    url: "http://127.0.0.1:4321/joeych-pages/",
    reuseExistingServer: false,
  },
})
