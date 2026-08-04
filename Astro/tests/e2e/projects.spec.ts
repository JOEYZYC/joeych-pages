import { expect, test } from "@playwright/test"

const projectIds = [
  "power-print-recognition",
  "dual-light-fusion",
  "resgatnet",
  "flexible-bifunctional-metasurface",
  "rigid-dual-polarization-metasurface",
  "single-phase-power-analyzer",
  "traffic-sign-recognition",
  "intelligent-reconnaissance-2024",
  "full-model-smart-car",
  "smart-harvesting-robot",
  "intelligent-reconnaissance-2023",
  "digikey-dual-light-thermal-imager-2024",
  "joeych-pages",
  "eflydrone-boards",
] as const

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const

test.describe("projects archive", () => {
  for (const locale of [
    {
      path: "projects/",
      htmlLanguage: "zh-CN",
      navigation: "项目介绍",
      title: "项目介绍",
      unavailable: "链接暂不可用",
    },
    {
      path: "en/projects/",
      htmlLanguage: "en",
      navigation: "Projects",
      title: "Projects",
      unavailable: "Link unavailable",
    },
  ] as const) {
    test(`renders the ${locale.path} archive in canonical source order`, async ({ page }) => {
      // Given: a localized canonical project route
      await page.goto(locale.path)

      // When: the static archive is available
      const index = page.locator("[data-project-index]")
      const records = page.locator("[data-project-record]")

      // Then: the route exposes one localized document heading and all source-backed records
      await expect(page.getByRole("heading", { level: 1, name: locale.title })).toHaveCount(1)
      await expect(page.locator("html")).toHaveAttribute("lang", locale.htmlLanguage)
      await expect(page.getByRole("navigation").getByRole("link", { name: locale.navigation })).toHaveAttribute(
        "aria-current",
        "page",
      )
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${locale.path}$`))
      await expect(index.locator("a[data-signal-target]")).toHaveCount(projectIds.length)
      await expect(records).toHaveCount(projectIds.length)
      const indexLinks = await index
        .locator("a[data-signal-target]")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href")))
      const recordIds = await records.evaluateAll((items) => items.map((item) => item.id))
      expect(indexLinks).toEqual(projectIds.map((id) => `#${id}`))
      expect(recordIds).toEqual(projectIds)
    })

    test(`preserves absent media and links on ${locale.path}`, async ({ page }) => {
      // Given: the record whose source data contains null media and links
      await page.goto(locale.path)
      const record = page.locator("#resgatnet")

      // When: its evidence record is rendered
      const unavailableLinks = record.getByText(locale.unavailable)

      // Then: source-backed text remains, while absent evidence has no fabricated image or anchor
      await expect(record).toContainText("ResGatNet")
      await expect(record.locator("img")).toHaveCount(0)
      await expect(record.locator("figure")).toHaveCount(0)
      await expect(unavailableLinks).toHaveCount(2)
      await expect(record.locator("a")).toHaveCount(0)
    })
  }

  test("renders a restrained target record for its stable fragment", async ({ page }) => {
    // Given: a direct link to a source-backed project anchor
    await page.goto("projects/#resgatnet")

    // When: the target record becomes the active reading location
    const record = page.locator("#resgatnet")

    // Then: it is preserved as a semantic project record without fabricated media
    await expect(record).toBeVisible()
    await expect(record).toHaveCSS("background-color", "rgb(243, 246, 248)")
    await expect(record.locator("img")).toHaveCount(0)
  })

  for (const viewport of viewports) {
    test(`fits the project archive at ${viewport.name} width`, async ({ page }) => {
      // Given: the required viewport
      await page.setViewportSize(viewport)
      await page.goto("projects/")

      // When: the full source-backed archive is rendered
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)

      // Then: the editorial record surface remains within the viewport
      expect(documentWidth).toBeLessThanOrEqual(viewport.width)
    })
  }
})
