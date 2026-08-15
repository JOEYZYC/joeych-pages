import { expect, test } from "@playwright/test"

import { THEMES, VIEWPORTS } from "./support/site-matrix"
import { configureVisualEnvironment } from "./support/test-helpers"

for (const theme of THEMES) {
  test(`projects keep bounded fine-pointer motion, visible keyboard focus, and the resgatnet target state in ${theme}`, async ({ page }) => {
    await configureVisualEnvironment(page, { theme })
    await page.goto("en/projects/#resgatnet")
    const tile = page.locator('[data-project-tile][data-project-id="resgatnet"]')
    const sibling = page.locator('[data-project-tile][data-project-id="flexible-bifunctional-metasurface"]')
    const target = page.locator("#resgatnet")
    const siblingBounds = await sibling.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { height: bounds.height, width: bounds.width, x: bounds.x, y: bounds.y + window.scrollY }
    })
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const staticShadow = await tile.evaluate((element) => getComputedStyle(element).boxShadow)

    await expect(target).toHaveCSS("border-left-width", "4px")
    await expect(target).toHaveCSS("animation-name", "none")
    await tile.hover()
    await expect(tile).toHaveCSS("transform", "matrix(1.015, 0, 0, 1.015, 0, -2)")
    expect(await tile.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(staticShadow)
    await expect(tile).toHaveCSS("transition-property", "transform")
    await expect(tile).toHaveCSS("transition-duration", "0.18s")
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(scrollWidth)
    expect(await sibling.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { height: bounds.height, width: bounds.width, x: bounds.x, y: bounds.y + window.scrollY }
    })).toEqual(siblingBounds)

    await page.mouse.move(0, 0)
    await tile.focus()
    await expect(tile).toBeFocused()
    await expect(tile).toHaveCSS("transform", "matrix(1.01, 0, 0, 1.01, 0, -1)")
    await expect(tile).toHaveCSS("outline-style", "solid")
    await expect(target).toHaveCSS("border-left-width", "4px")
    await expect(target).toHaveCSS("animation-name", "none")
  })

  test(`projects keep coarse touch interactions unscaled in ${theme}`, async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4321/joeych-pages/",
      hasTouch: true,
      isMobile: true,
      viewport: VIEWPORTS[0],
    })
    const page = await context.newPage()
    await configureVisualEnvironment(page, { theme })
    await page.goto("en/projects/#resgatnet")
    const tile = page.locator('[data-project-tile][data-project-id="resgatnet"]')

    expect(await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches)).toBe(false)
    await tile.hover()
    await expect(tile).toHaveCSS("transform", "none")
    await tile.focus()
    await expect(tile).toHaveCSS("transform", "none")
    await expect(tile).toHaveCSS("outline-style", "solid")
    await context.close()
  })

  test(`projects remove transforms and target animation for reduced motion in ${theme}`, async ({ page }) => {
    await configureVisualEnvironment(page, { theme, reducedMotion: "reduce" })
    await page.goto("en/projects/#resgatnet")
    const tile = page.locator('[data-project-tile][data-project-id="resgatnet"]')
    const target = page.locator("#resgatnet")

    await tile.hover()
    await expect(tile).toHaveCSS("transform", "none")
    await expect(tile).toHaveCSS("transition-duration", "0s")
    await tile.focus()
    await expect(tile).toHaveCSS("transform", "none")
    await expect(tile).toHaveCSS("outline-style", "solid")
    await expect(target).toHaveCSS("border-left-width", "4px")
    await expect(target).toHaveCSS("animation-name", "none")
  })
}
