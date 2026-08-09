import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

import { expect, test } from "@playwright/test"

const basePath = "/joeych-pages"
const siteOrigin = "https://joeyzyc.github.io"
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const
const routes = [
  { path: "", locale: "zh", counterpart: "/en/", canonical: `${siteOrigin}${basePath}/` },
  { path: "en/", locale: "en", counterpart: "/", canonical: `${siteOrigin}${basePath}/en/` },
  { path: "experience/", locale: "zh", counterpart: "/en/experience/", canonical: `${siteOrigin}${basePath}/experience/` },
  { path: "en/experience/", locale: "en", counterpart: "/experience/", canonical: `${siteOrigin}${basePath}/en/experience/` },
  { path: "awards/", locale: "zh", counterpart: "/en/awards/", canonical: `${siteOrigin}${basePath}/awards/` },
  { path: "en/awards/", locale: "en", counterpart: "/awards/", canonical: `${siteOrigin}${basePath}/en/awards/` },
  { path: "projects/", locale: "zh", counterpart: "/en/projects/", canonical: `${siteOrigin}${basePath}/projects/` },
  { path: "en/projects/", locale: "en", counterpart: "/projects/", canonical: `${siteOrigin}${basePath}/en/projects/` },
  { path: "tech-stack/", locale: "zh", counterpart: "/en/tech-stack/", canonical: `${siteOrigin}${basePath}/tech-stack/` },
  { path: "en/tech-stack/", locale: "en", counterpart: "/tech-stack/", canonical: `${siteOrigin}${basePath}/en/tech-stack/` },
] as const

async function htmlFiles(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory()
      ? htmlFiles(path)
      : entry.isFile() && entry.name.endsWith(".html") ? [path] : []
  }))
  return files.flat()
}

test.describe("formal site shell", () => {
  for (const route of routes) {
    test(`renders the complete localized shell for ${route.path || "root"}`, async ({ page }) => {
      await page.goto(route.path)
      const personJsonLd = await page.locator('script[type="application/ld+json"]').textContent()

      await expect(page.locator("html")).toHaveAttribute("lang", route.locale === "zh" ? "zh-CN" : "en")
      await expect(page.locator("html")).toHaveAttribute("data-js", "true")
      await expect(page.getByRole("banner")).toBeVisible()
      await expect(page.locator("#primary-navigation")).toBeVisible()
      await expect(page.getByRole("main")).toBeVisible()
      await expect(page.getByRole("contentinfo")).toBeVisible()
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page.locator('[aria-current="page"]')).toHaveCount(1)
      await expect(page.locator("[data-theme-toggle]")).toBeVisible()
      await expect(page.locator("[data-contact-trigger]")).toBeVisible()
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", route.canonical)
      await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveAttribute(
        "href",
        route.locale === "zh" ? route.canonical : `${siteOrigin}${basePath}${route.counterpart}`,
      )
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
        "href",
        route.locale === "en" ? route.canonical : `${siteOrigin}${basePath}${route.counterpart}`,
      )
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
        "href",
        route.locale === "zh" ? route.canonical : `${siteOrigin}${basePath}${route.counterpart}`,
      )
      await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
        "href",
        `${basePath}/favicon.svg`,
      )
      expect(personJsonLd).not.toBeNull()
      expect(() => JSON.parse(personJsonLd ?? "")).not.toThrow()
      expect(personJsonLd).toContain('"@type":"Person"')
      await expect(page.locator("a.language-link")).toHaveAttribute("href", `${basePath}${route.counterpart}`)
    })
  }

  test("serves the Profile-backed SVG favicon", async ({ page }) => {
    const favicon = await page.request.get(`${basePath}/favicon.svg`)
    expect(favicon.status()).toBe(200)
  })

  test("opens contact by keyboard and restores focus after every close path", async ({ page }) => {
    await page.goto("")
    const trigger = page.locator("[data-contact-trigger]")
    const dialog = page.locator("[data-contact-dialog]")

    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()

    await trigger.click()
    await dialog.dispatchEvent("click")
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
  })

  test("compact navigation focuses its first route and closes on route, outside, and Escape", async ({ page }) => {
    await page.setViewportSize(viewports[0])
    await page.goto("")
    const toggle = page.locator("[data-menu-toggle]")
    const navigation = page.locator("#primary-navigation")
    const firstRoute = navigation.getByRole("link").first()

    await toggle.click()
    await expect(firstRoute).toBeFocused()
    await firstRoute.evaluate((element) => element.addEventListener("click", (event) => event.preventDefault(), { once: true }))
    await firstRoute.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    await toggle.click()
    await page.locator("main").dispatchEvent("pointerdown")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    await toggle.click()
    await page.keyboard.press("Escape")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(toggle).toBeFocused()
  })

  test("JavaScript-disabled shell expands navigation and exposes real contact fallback anchors", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4321/joeych-pages/",
      javaScriptEnabled: false,
    })
    const page = await context.newPage()
    await page.setViewportSize(viewports[0])
    await page.goto("en/")

    await expect(page.locator("html")).toHaveAttribute("data-js", "false")
    await expect(page.locator("[data-menu-toggle]")).toBeHidden()
    await expect(page.locator("#primary-navigation")).toBeVisible()
    await expect(page.locator("#primary-navigation a")).toHaveCount(5)
    await expect(page.locator("[data-theme-toggle]")).toBeHidden()
    await expect(page.locator("[data-contact-trigger]")).toBeHidden()
    await expect(page.locator("[data-contact-fallback]")).toBeVisible()
    await expect(page.locator("[data-contact-fallback]")).toHaveAttribute("href", /^mailto:/)

    await context.close()
  })

  test("native View Transition support enhances but never owns route navigation", async ({ page }) => {
    await page.setViewportSize(viewports[2])
    await page.goto("")
    const hasViewTransitionRule = await page.evaluate(() => [...document.styleSheets].some((sheet) => {
      try {
        return [...sheet.cssRules].some((rule) => rule.cssText.startsWith("@view-transition"))
      } catch {
        return false
      }
    }))
    expect(hasViewTransitionRule).toBe(true)

    await page.locator("#primary-navigation").getByRole("link", { name: "个人经历" }).click()
    await expect(page).toHaveURL(/\/experience\/$/)

    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, "startViewTransition", {
        configurable: true,
        value: undefined,
      })
    })
    await page.goto("")
    await page.locator("#primary-navigation").getByRole("link", { name: "获奖证书" }).click()
    await expect(page).toHaveURL(/\/awards\/$/)
  })

  test("reduced motion makes project and view-transition durations instantaneous", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize(viewports[2])
    await page.goto("en/projects/")
    const tile = page.locator("[data-project-tile]").first()

    expect(await tile.evaluate((element) => getComputedStyle(element).transitionDuration.split(", ").every((value) => value === "0s"))).toBe(true)
    const reducedViewTransitions = await page.evaluate(() => {
      const oldRoot = getComputedStyle(document.documentElement, "::view-transition-old(root)")
      const newRoot = getComputedStyle(document.documentElement, "::view-transition-new(root)")
      return [oldRoot, newRoot].every((style) =>
        style.animationName === "none" || style.animationDuration.split(", ").every((value) => value === "0s")
      )
    })
    expect(reducedViewTransitions).toBe(true)
    await expect(page.locator("[data-project-filter-controls]")).toBeVisible()
  })

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

  test("builds only approved HTML documents and their canonical sitemap URLs", async () => {
    const dist = join(process.cwd(), "dist")
    const html = await htmlFiles(dist)
    const sitemap = await readFile(join(dist, "sitemap-0.xml"), "utf8")
    const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

    expect(html).toHaveLength(routes.length)
    expect([...sitemapUrls].sort()).toEqual(routes.map((route) => route.canonical).sort())
  })
})
