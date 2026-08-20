import type { Page } from "@playwright/test"
import { chromium, expect, test } from "@playwright/test"

import { BASE_PATH, CANONICAL_ROUTES, VIEWPORTS } from "./support/site-matrix"

const basePath = BASE_PATH
const projectFragment = "#resgatnet"
const siteBaseUrl = "http://127.0.0.1:4321/joeych-pages/"
const navigationDisabledFeature = "--disable-features=ViewTransitionOnNavigation"
const unloadMarker = "navigation-e2e-beforeunload"

async function expectHeaderRoutes(page: Page, locale: "zh" | "en"): Promise<void> {
  const routes = CANONICAL_ROUTES.filter((route) => route.locale === locale)
  const links = page.locator("[data-header-route]")

  await expect(links).toHaveCount(routes.length)
  for (const [index, route] of routes.entries()) {
    await expect(links.nth(index)).toHaveAttribute("href", `${basePath}/${route.path}`)
  }
}

test.describe("navigation state synchronization", () => {
  test("keeps the locale counterpart ready for a direct project fragment load", async ({ page }) => {
    await page.goto(`projects/${projectFragment}`)
    const languageLink = page.locator("a.language-link")

    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/${projectFragment}`)
    await expect(languageLink).toHaveAttribute("data-language-counterpart", `${basePath}/en/projects/`)
  })

  test("updates and clears the locale counterpart when the project fragment changes", async ({ page }) => {
    await page.goto("projects/")
    const languageLink = page.locator("a.language-link")

    await page.evaluate((fragment) => {
      window.location.hash = fragment
    }, projectFragment)
    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/${projectFragment}`)

    await page.evaluate(() => {
      window.history.replaceState(null, "", window.location.pathname)
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    })
    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/`)
  })

  test("filters a project name, preserves its visible state, and does not write history", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[2])
    await page.goto("en/projects/")
    const nameFilter = page.locator("[data-project-name-filter]")
    const historyLength = await page.evaluate(() => window.history.length)

    await nameFilter.selectOption("resgatnet")

    await expect(nameFilter).toHaveValue("resgatnet")
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()
    await expect(page.locator("[data-project-record]:not([hidden])")).toHaveCount(1)
    const [filterBox, recordBox] = await Promise.all([
      page.locator("[data-project-filter-controls]").boundingBox(),
      page.locator("#resgatnet").boundingBox(),
    ])
    expect(filterBox).not.toBeNull()
    expect(recordBox).not.toBeNull()
    expect(recordBox?.y ?? 0).toBeGreaterThanOrEqual((filterBox?.y ?? 0) + (filterBox?.height ?? 0))
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength)
    await expect(page).toHaveURL(/\/en\/projects\/$/)
  })

  test("a browser hash change synchronizes project filters and focuses the stable record title", async ({ page }) => {
    await page.goto("en/projects/")

    await page.evaluate(() => {
      window.location.hash = "#resgatnet"
    })

    await expect(page.locator("[data-project-name-filter]")).toHaveValue("resgatnet")
    await expect(page.locator("#resgatnet")).toHaveAttribute("data-active", "true")
    await expect(page.locator("#resgatnet [data-project-record-title]")).toBeFocused()
    await expect(page.locator("a.language-link")).toHaveAttribute(
      "href",
      `${basePath}/projects/#resgatnet`,
    )
    await expect(page.locator("#resgatnet")).toHaveCSS("border-left-width", "4px")
  })

  test("dismisses the compact menu only for outside pointers and restores focus with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("")
    const toggle = page.locator("[data-menu-toggle]")
    const navigation = page.locator("#primary-navigation")

    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(navigation.getByRole("link").first()).toBeFocused()

    await navigation.dispatchEvent("pointerdown")
    await expect(toggle).toHaveAttribute("aria-expanded", "true")

    await page.locator("main").dispatchEvent("pointerdown")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    await toggle.click()
    await page.keyboard.press("Escape")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(toggle).toBeFocused()
  })

  test("keeps all locale route concepts as base-aware trailing-slash anchors with native View Transition support", async ({ page }) => {
    await page.goto("")
    expect(await page.evaluate(() => "startViewTransition" in document)).toBe(true)

    for (const route of CANONICAL_ROUTES) {
      await page.goto(route.path)
      await expectHeaderRoutes(page, route.locale)
    }
  })

  test("uses ordinary document navigation when ViewTransitionOnNavigation is disabled in isolated Chrome", async () => {
    const browser = await chromium.launch({
      channel: "chrome",
      args: ["--enable-automation", navigationDisabledFeature],
    })

    try {
      const context = await browser.newContext({ baseURL: siteBaseUrl })
      try {
        const page = await context.newPage()
        const cdp = await browser.newBrowserCDPSession()
        const commandLine = await cdp.send("Browser.getBrowserCommandLine")

        expect(commandLine.arguments).toContain(navigationDisabledFeature)
        await page.addInitScript((marker) => {
          window.addEventListener("beforeunload", () => window.sessionStorage.setItem(marker, "true"))
        }, unloadMarker)

        for (const locale of ["zh", "en"] as const) {
          const routes = CANONICAL_ROUTES.filter((route) => route.locale === locale)
          const homePath = locale === "zh" ? "" : "en/"
          const destinations = routes.slice(1)

          await page.goto(homePath)
          expect(await page.evaluate(() => "startViewTransition" in document)).toBe(true)
          await expectHeaderRoutes(page, locale)

          for (const destination of destinations) {
            await page.evaluate((marker) => window.sessionStorage.removeItem(marker), unloadMarker)
            const link = page.locator(`[data-header-route][href="${basePath}/${destination.path}"]`)

            await Promise.all([
              page.waitForURL(new URL(destination.path, siteBaseUrl).toString()),
              link.click(),
            ])

            await expect(page).toHaveURL(new URL(destination.path, siteBaseUrl).toString())
            await expect.poll(() => page.evaluate((marker) => window.sessionStorage.getItem(marker), unloadMarker)).toBe("true")
          }
        }
      } finally {
        await context.close()
      }
    } finally {
      await browser.close()
    }
  })
})
