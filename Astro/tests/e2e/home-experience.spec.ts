import { expect, test } from "@playwright/test"

import { getProfileData } from "../../src/lib/profile-data"

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const

const pages = [
  { path: "", locale: "zh", heading: "张易成", counterpart: /\/en\/$/ },
  { path: "en/", locale: "en", heading: "JOEYCH", counterpart: /\/joeych-pages\/$/ },
  { path: "experience/", locale: "zh", heading: "个人经历", counterpart: /\/en\/experience\/$/ },
  { path: "en/experience/", locale: "en", heading: "Experience", counterpart: /\/experience\/$/ },
] as const

test.describe("home and experience routes", () => {
  for (const route of pages) {
    test(`renders ${route.path || "root"} with its localized document shell`, async ({ page }) => {
      // Given: the canonical localized route
      await page.goto(route.path)

      // When: the static page is rendered
      const currentRoute = page.locator('[aria-current="page"]')

      // Then: its landmark, locale, metadata, and counterpart are complete
      await expect(page.locator("html")).toHaveAttribute("lang", route.locale === "zh" ? "zh-CN" : "en")
      await expect(page.getByRole("main")).toBeVisible()
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toHaveCount(1)
      await expect(currentRoute).toHaveCount(1)
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1)
      await expect(page.locator("a.language-link")).toHaveAttribute("href", route.counterpart)
    })
  }

  test("renders the Chinese home identity and featured evidence in source order", async ({ page }) => {
    // Given: the default-locale home route
    const { portrait } = (await getProfileData()).profile
    await page.goto("")

    // When: its Profile-backed content is available
    const featuredLinks = page.locator(".featured-projects a")

    // Then: identity, portrait, statistics, education, CTA, and feature order remain source-backed
    await expect(page.getByText("电子信息工程", { exact: true })).toBeVisible()
    await expect(page.getByText("嵌入式系统 / 无线感知 / 超表面与太赫兹", { exact: true })).toBeVisible()
    await expect(page.getByRole("img", { name: "张易成" })).toHaveAttribute(
      "src",
      new RegExp(`${portrait.replace(".", "\\.")}$`),
    )
    await expect(page.locator(".profile-statistics > div")).toHaveCount(4)
    await expect(page.locator("#education-suzhou-institute-of-technology")).toBeVisible()
    await expect(page.locator('main a[href$="/experience/"]')).toBeVisible()
    await expect(featuredLinks).toHaveCount(3)
    await expect(featuredLinks.nth(0)).toHaveAttribute("href", /projects\/#power-print-recognition$/)
    await expect(featuredLinks.nth(1)).toHaveAttribute("href", /projects\/#dual-light-fusion$/)
    await expect(featuredLinks.nth(2)).toHaveAttribute("href", /projects\/#resgatnet$/)
  })

  test("renders education before all campus records in source order", async ({ page }) => {
    // Given: the English experience route
    await page.goto("en/experience/")

    // When: chronology records are rendered
    const records = page.locator(".experience-record")

    // Then: stable record IDs preserve the Profile array ordering across both sections
    await expect(records).toHaveCount(5)
    await expect(records.nth(0)).toHaveAttribute("id", "education-suzhou-institute-of-technology")
    await expect(records.nth(1)).toHaveAttribute("id", "campus-aeromodelling-club")
    await expect(records.nth(2)).toHaveAttribute("id", "campus-media-center")
    await expect(records.nth(3)).toHaveAttribute("id", "campus-party-branch")
    await expect(records.nth(4)).toHaveAttribute("id", "campus-class-officer")
  })

  for (const viewport of viewports) {
    test(`keeps all four routes within the ${viewport.name} viewport`, async ({ page }) => {
      // Given: a required responsive viewport
      await page.setViewportSize(viewport)

      // When: each localized route is loaded
      for (const route of pages) {
        await page.goto(route.path)

        // Then: its editorial document has no horizontal overflow
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(viewport.width)
      }
    })
  }
})
