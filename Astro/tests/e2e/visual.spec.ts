import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { CANONICAL_ROUTES, THEMES, VIEWPORTS } from "./support/site-matrix"
import { configureVisualEnvironment, waitForStableScreenshot } from "./support/test-helpers"

const projectRoute = "en/projects/"
const projectId = "resgatnet"

function routeSnapshotName(path: string, viewport: string, theme: string): string {
  const routeName = path === "" ? "home-zh" : path.replaceAll("/", "-").replace(/-$/, "")
  return `route-${routeName}-${viewport}-${theme}.png`
}

async function openSettledProjectPage(
  page: Page,
  theme: (typeof THEMES)[number],
  options: { readonly hash?: boolean; readonly reducedMotion?: "reduce" },
): Promise<void> {
  await page.setViewportSize(VIEWPORTS[2])
  if (options.reducedMotion === undefined) {
    await configureVisualEnvironment(page, { theme })
  } else {
    await configureVisualEnvironment(page, { theme, reducedMotion: options.reducedMotion })
  }
  await page.goto(options.hash ? `${projectRoute}#${projectId}` : projectRoute)
  await expect(page.locator("svg[data-icon]").first()).toBeAttached()
  await waitForStableScreenshot(page)
}

test.describe("deterministic visual baselines", () => {
  test.describe.configure({ mode: "serial" })

  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      for (const route of CANONICAL_ROUTES) {
        test(`captures ${route.path || "root"} at ${viewport.name} in ${theme}`, async ({ page }) => {
          // Given: a canonical route with an explicit stored theme and approved viewport
          await page.setViewportSize(viewport)
          await configureVisualEnvironment(page, { theme })

          // When: the static route and its local assets have settled
          await page.goto(route.path)
          await expect(page.locator("svg[data-icon]").first()).toBeAttached()
          await waitForStableScreenshot(page)

          // Then: the complete route remains visually stable without hiding any content
          const snapshotName = routeSnapshotName(route.path, viewport.name, theme)
          if (route.path.includes("projects")) {
            // Chromium full-page stitching scrolls the observer-driven project navigator. Capture its deterministic initial viewport; state baselines cover its target record.
            await expect(page).toHaveScreenshot(snapshotName)
          } else {
            await expect(page).toHaveScreenshot(snapshotName, { fullPage: true })
          }
        })
      }
    }

    test(`captures project hover in ${theme}`, async ({ page }) => {
      await openSettledProjectPage(page, theme, {})
      const tile = page.locator(`[data-project-tile][data-project-id="${projectId}"]`)

      await tile.hover()
      await expect(tile).toHaveCSS("transform", "matrix(1.015, 0, 0, 1.015, 0, -2)")
      await waitForStableScreenshot(page)

      await expect(tile).toHaveScreenshot(`project-hover-${theme}.png`)
    })

    test(`captures project keyboard focus in ${theme}`, async ({ page }) => {
      await openSettledProjectPage(page, theme, {})
      const tile = page.locator(`[data-project-tile][data-project-id="${projectId}"]`)

      await page.mouse.move(0, 0)
      await tile.focus()
      await expect(tile).toBeFocused()
      await expect(tile).toHaveCSS("transform", "matrix(1.01, 0, 0, 1.01, 0, -1)")
      await waitForStableScreenshot(page)

      await expect(tile).toHaveScreenshot(`project-focus-${theme}.png`)
    })

    test(`captures the resgatnet target in ${theme}`, async ({ page }) => {
      await openSettledProjectPage(page, theme, { hash: true })
      const target = page.locator(`#${projectId}`)

      await expect(target).toHaveCSS("border-left-width", "4px")
      await expect(target).toHaveCSS("animation-name", "none")

      await expect(target).toHaveScreenshot(`project-target-${theme}.png`)
    })

    test(`captures reduced-motion project state in ${theme}`, async ({ page }) => {
      await openSettledProjectPage(page, theme, { hash: true, reducedMotion: "reduce" })
      const tile = page.locator(`[data-project-tile][data-project-id="${projectId}"]`)
      const target = page.locator(`#${projectId}`)

      await tile.hover()
      await expect(tile).toHaveCSS("transform", "none")
      await expect(target).toHaveCSS("border-left-width", "4px")
      await waitForStableScreenshot(page)

      await expect(target).toHaveScreenshot(`project-reduced-motion-${theme}.png`)
    })
  }
})
