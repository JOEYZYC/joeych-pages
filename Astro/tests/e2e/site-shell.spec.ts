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
      // Given: an approved public route
      await page.goto(route.path)

      // When: the static document becomes available
      const personJsonLd = await page.locator('script[type="application/ld+json"]').textContent()

      // Then: localization, landmarks, navigation, and truthful metadata are complete
      await expect(page.locator("html")).toHaveAttribute("lang", route.locale === "zh" ? "zh-CN" : "en")
      await expect(page.getByRole("banner")).toBeVisible()
      await expect(page.getByRole("navigation")).toBeVisible()
      await expect(page.getByRole("main")).toBeVisible()
      await expect(page.getByRole("contentinfo")).toBeVisible()
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page.locator('[aria-current="page"]')).toHaveCount(1)
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
    // Given: the base-aware public favicon path
    const favicon = await page.request.get(`${basePath}/favicon.svg`)

    // When: the static preview serves the public media asset

    // Then: browsers receive the favicon without an implicit icon fallback
    expect(favicon.status()).toBe(200)
  })

  test("opens the contact dialog by keyboard and restores focus after Escape", async ({ page }) => {
    // Given: a formal Chinese home page contact trigger
    await page.goto("")
    const trigger = page.locator('[aria-haspopup="dialog"]')

    // When: keyboard opens the dialog and then dismisses it
    await trigger.focus()
    await page.keyboard.press("Enter")
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")

    // Then: native modal closing returns focus to the originating control
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
  })

  test("closes the compact menu with Escape and restores focus", async ({ page }) => {
    // Given: the mobile formal home header
    await page.setViewportSize(viewports[0])
    await page.goto("")
    const toggle = page.locator("[data-menu-toggle]")

    // When: the compact navigation opens and Escape is pressed
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("Escape")

    // Then: navigation closes and focus returns to its control
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(toggle).toBeFocused()
  })

  test("honors reduced motion and moves the formal project rail vertically", async ({ page }) => {
    // Given: a motion-sensitive desktop visitor on the formal projects route
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize(viewports[2])
    await page.goto("projects/")
    const group = page.locator('[data-signal-rail-axis="vertical"]')
    const rail = group.locator("[data-signal-rail]")
    const projects = group.locator("[data-signal-target]")

    // When: keyboard focus moves between project index items
    await projects.nth(0).focus()
    const firstTransform = await rail.evaluate((element) => element.style.transform)
    await projects.nth(1).focus()
    const secondTransform = await rail.evaluate((element) => element.style.transform)

    // Then: the shared rail moves vertically without transition motion
    await expect(rail).toHaveCSS("transition-duration", "0s")
    expect(secondTransform).not.toBe(firstTransform)
    expect(secondTransform).toMatch(/^translateY\(/)
  })

  test("keeps the current project fragment when changing locales", async ({ page }) => {
    // Given: a Chinese project record addressed by its stable fragment
    await page.goto("projects/#resgatnet")

    // When: the language counterpart is selected
    await page.locator("a.language-link").click()

    // Then: the English mirror retains the current project record
    await expect(page).toHaveURL(/\/en\/projects\/#resgatnet$/)
  })

  test("keeps every visible enabled link and button at the required pointer size", async ({ page }) => {
    // Given: every approved route at the required mobile viewport
    await page.setViewportSize(viewports[0])

    // When: each visible enabled link and button is measured
    for (const route of routes) {
      await page.goto(route.path)
      const controls = page.locator("a[href]:visible, button:visible:not([disabled])")

      // Then: touch targets meet the 44px minimum in both dimensions
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
      // Given: a required responsive viewport
      await page.setViewportSize(viewport)

      // When: every approved public route renders
      for (const route of routes) {
        await page.goto(route.path)

        // Then: no formal page introduces document-level horizontal overflow
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }

  test("builds only approved HTML documents and their canonical sitemap URLs", async () => {
    // Given: Playwright's production build output
    const dist = join(process.cwd(), "dist")

    // When: generated HTML and sitemap URLs are enumerated
    const html = await htmlFiles(dist)
    const sitemap = await readFile(join(dist, "sitemap-0.xml"), "utf8")
    const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])

    // Then: exactly the approved ten documents and canonical URLs are published
    expect(html).toHaveLength(routes.length)
    expect([...sitemapUrls].sort()).toEqual(routes.map((route) => route.canonical).sort())
  })
})
