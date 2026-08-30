import { expect, test } from "@playwright/test"

import { BASE_PATH, CANONICAL_ROUTES, SITE_ORIGIN, VIEWPORTS } from "./support/site-matrix"

const basePath = BASE_PATH
const siteOrigin = SITE_ORIGIN
const routes = CANONICAL_ROUTES
const viewports = VIEWPORTS

test.describe("formal site shell", () => {
  test("offers a localized keyboard shortcut to the main content", async ({ page }) => {
    await page.goto("en/")

    await page.keyboard.press("Tab")
    const skipLink = page.getByRole("link", { name: "Skip to main content" })
    await expect(skipLink).toBeVisible()
    await expect(skipLink).toBeFocused()
    await page.keyboard.press("Enter")

    await expect(page.getByRole("main")).toBeFocused()
  })

  for (const route of routes) {
    test(`renders the complete localized shell for ${route.path || "root"}`, async ({ page }) => {
      await page.goto(route.path)
      const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((value) => JSON.parse(value) as { readonly "@type"?: string; readonly name?: string })

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
        `${basePath}/site/favicon.svg`,
      )
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", route.path.includes("projects") || route.path.includes("tech-stack") ? "website" : "profile")
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "JOEYCH")
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${siteOrigin}${basePath}/site/social-card.png`)
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200")
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630")
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image")
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", `${siteOrigin}${basePath}/site/social-card.png`)
      expect(jsonLd.some((value) => value["@type"] === "Person" && value.name === (route.locale === "zh" ? "张易成" : "Joey Zhang"))).toBe(true)
      expect(jsonLd.some((value) => value["@type"] === "WebSite" && value.name === "JOEYCH")).toBe(true)
      expect(jsonLd.some((value) => value["@type"] === "ItemList")).toBe(route.path.includes("projects"))
      await expect(page.locator("a.language-link")).toHaveAttribute("href", `${basePath}${route.counterpart}`)
    })
  }

  test("serves the Profile-backed SVG favicon", async ({ page }) => {
    const favicon = await page.request.get(`${basePath}/site/favicon.svg`)
    expect(favicon.status()).toBe(200)
    const socialCard = await page.request.get(`${basePath}/site/social-card.png`)
    expect(socialCard.status()).toBe(200)
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
    await expect(page.locator("[data-noscript-header-fallback]")).toBeVisible()
    await expect(page.locator("[data-noscript-header-routes] a")).toHaveCount(4)
    await expect(page.locator("[data-noscript-language-counterpart]")).toHaveAttribute("href", `${basePath}/`)
    await expect(page.locator("[data-noscript-contact-links] a")).toHaveCount(5)
    for (const link of await page.locator("[data-noscript-contact-links] a").all()) {
      await expect(link).toHaveAttribute("href", /^(mailto:|tel:|https:)/)
    }
    await expect(page.locator("#primary-navigation")).toBeHidden()
    await expect(page.locator("[data-theme-toggle]")).toBeHidden()
    await expect(page.locator("[data-contact-trigger]")).toBeHidden()
    await expect(page.locator("[data-contact-fallback]")).toBeHidden()

    await context.close()
  })

  test("footer keeps readable Profile destinations with service-matched icons", async ({ page }) => {
    await page.goto("en/")

    const footer = page.getByRole("contentinfo")
    const expected = [
      { href: "mailto:szjoeych@gmail.com", icon: "envelope", name: "szjoeych@gmail.com" },
      { href: "https://github.com/JOEYZYC", icon: "github", name: "GitHub" },
      { href: "https://scholar.google.com/citations?user=R_3hg2gAAAAJ", icon: "google-scholar", name: "Google Scholar" },
      { href: "https://orcid.org/0009-0009-0202-8772", icon: "orcid", name: "ORCID" },
    ] as const

    for (const destination of expected) {
      const link = footer.getByRole("link", { name: destination.name })
      await expect(link).toHaveAttribute("href", destination.href)
      await expect(link.locator(`svg[data-icon="${destination.icon}"]`)).toHaveCount(1)
    }
    for (const link of await footer.locator('a[target="_blank"]').all()) {
      await expect(link).toHaveAttribute("rel", "noopener noreferrer")
      await expect(link.locator('svg[data-icon="arrow-up-right-from-square"]')).toHaveCount(1)
    }
  })

})
