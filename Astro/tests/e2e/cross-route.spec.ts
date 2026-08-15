import { expect, test } from "@playwright/test"

import { BASE_PATH, CANONICAL_ROUTES, THEMES } from "./support/site-matrix"
import { capturePageErrors, configureVisualEnvironment } from "./support/test-helpers"

const routes = CANONICAL_ROUTES
const themes = THEMES

test.describe.configure({ mode: "serial" })

for (const theme of themes) {
  for (const route of routes) {
    test(`renders ${route.path || "root"} with explicit ${theme} theme`, async ({ page }) => {
      // Given: an explicit stored theme before the document scripts execute
      const errors = capturePageErrors(page)
      await configureVisualEnvironment(page, { theme })

      // When: the canonical route loads under the deployment base path
      await page.goto(route.path)

      // Then: the localized, visible shell has loaded its local fonts without runtime errors
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      await expect(page.locator("html")).toHaveAttribute("lang", route.locale === "zh" ? "zh-CN" : "en")
      await expect(page.locator("h1")).toHaveCount(1)
      await expect(page.locator("main")).toBeVisible()
      expect(new URL(page.url()).pathname).toBe(`${BASE_PATH}/${route.path}`)
      expect(
        await page.evaluate(async () => {
          await document.fonts.ready
          return document.fonts.status === "loaded"
        }),
      ).toBe(true)
      expect(errors.pageErrors).toEqual([])
      expect(errors.consoleErrors).toEqual([])
    })
  }
}
