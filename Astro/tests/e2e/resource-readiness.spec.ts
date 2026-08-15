import { expect, test } from "@playwright/test"

import { CANONICAL_ROUTES, VIEWPORTS } from "./support/site-matrix"

const routes = CANONICAL_ROUTES
const viewports = VIEWPORTS

test.describe("resource readiness", () => {
  test("local fonts and build-time icons are ready without failed page resources", async ({ page }) => {
    const pageErrors: string[] = []
    const failedRequests: string[] = []
    page.on("pageerror", (error) => pageErrors.push(error.message))
    page.on("requestfailed", (request) => {
      if (new URL(request.url()).origin === "http://127.0.0.1:4321") failedRequests.push(`${request.method()} ${request.url()}`)
    })

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "load" })
      const readiness = await page.evaluate(async () => {
        await document.fonts.ready
        const icons = [...document.querySelectorAll<SVGElement>("svg[data-icon]")]
        return {
          fontStatus: document.fonts.status,
          iconCount: icons.length,
          invalidIcons: icons.filter((icon) =>
            icon.getAttribute("focusable") !== "false" ||
            icon.getAttribute("aria-hidden") !== "true" ||
            icon.querySelector("path")?.getAttribute("fill") !== "currentColor"
          ).length,
          resourceCount: performance.getEntriesByType("resource").filter((entry) => entry.name.startsWith(window.location.origin)).length,
        }
      })
      expect(readiness.fontStatus).toBe("loaded")
      expect(readiness.iconCount).toBeGreaterThan(0)
      expect(readiness.invalidIcons).toBe(0)
      expect(readiness.resourceCount).toBeGreaterThan(0)
    }

    expect(pageErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test("keeps every visible enabled link, button, and select at the required pointer size", async ({ page }) => {
    await page.setViewportSize(viewports[0])
    for (const route of routes) {
      await page.goto(route.path)
      const controls = page.locator("a[href]:visible, button:visible:not([disabled]), select:visible:not([disabled])")
      for (const control of await controls.all()) {
        const box = await control.boundingBox()
        expect(box).not.toBeNull()
        expect(box?.width).toBeGreaterThanOrEqual(44)
        expect(box?.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  for (const viewport of viewports) {
    test(`keeps all approved routes within the ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      for (const route of routes) {
        await page.goto(route.path)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }
})
