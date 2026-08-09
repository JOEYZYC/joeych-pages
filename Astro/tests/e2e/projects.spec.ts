import type { Page } from "@playwright/test"
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

const locales = [
  {
    path: "projects/",
    htmlLanguage: "zh-CN",
    navigation: "项目介绍",
    title: "项目介绍",
    pending: "项目图片待补充",
    pendingAlt: "临时使用个人证件照；项目图片待补充",
  },
  {
    path: "en/projects/",
    htmlLanguage: "en",
    navigation: "Projects",
    title: "Projects",
    pending: "Project image pending",
    pendingAlt: "Temporary profile photo; project image pending",
  },
] as const

async function visibleIds(page: Page, selector: string): Promise<string[]> {
  return page.locator(selector).evaluateAll((elements) => elements
    .filter((element) => !(element as HTMLElement).hidden)
    .map((element) => element.getAttribute("data-project-id") ?? element.id))
}

test.describe("projects archive", () => {
  for (const locale of locales) {
    test(`renders the ${locale.path} explorer and archive in source order`, async ({ page }) => {
      await page.goto(locale.path)
      const tiles = page.locator("[data-project-tile]")
      const records = page.locator("[data-project-record]")

      await expect(page.getByRole("heading", { level: 1, name: locale.title })).toHaveCount(1)
      await expect(page.locator("html")).toHaveAttribute("lang", locale.htmlLanguage)
      await expect(page.getByRole("navigation").getByRole("link", { name: locale.navigation })).toHaveAttribute(
        "aria-current",
        "page",
      )
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${locale.path}$`))
      await expect(tiles).toHaveCount(projectIds.length)
      await expect(records).toHaveCount(projectIds.length)
      expect(await tiles.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-project-id")))).toEqual(projectIds)
      expect(await records.evaluateAll((elements) => elements.map((element) => element.id))).toEqual(projectIds)
      expect(await tiles.evaluateAll((elements) => elements.map((element) => element.getAttribute("href")))).toEqual(
        projectIds.map((id) => expect.stringMatching(new RegExp(`/projects/#${id}$`))),
      )

      await expect(tiles.locator('[data-project-media-kind="real"]')).toHaveCount(5)
      await expect(tiles.locator('[data-project-media-kind="placeholder"]')).toHaveCount(9)
      await expect(records.locator('[data-project-media-kind="real"]')).toHaveCount(5)
      await expect(records.locator('[data-project-media-kind="placeholder"]')).toHaveCount(9)
      await expect(tiles.locator('[data-project-media-kind="placeholder"] img')).toHaveCount(9)
      for (const image of await tiles.locator('[data-project-media-kind="placeholder"] img').all()) {
        await expect(image).toHaveAttribute("src", /\/joeych-pages\/profile-photo\.jpg$/)
        await expect(image).toHaveAttribute("alt", locale.pendingAlt)
      }
      await expect(tiles.locator('[data-project-media-kind="placeholder"] .project-media-pending')).toHaveText(
        Array.from({ length: 9 }, () => locale.pending),
      )
    })
  }

  test("keeps primary visuals separate from complete figure and link evidence", async ({ page }) => {
    await page.goto("en/projects/#resgatnet")
    const resgatnet = page.locator("#resgatnet")
    const powerPrint = page.locator("#power-print-recognition")

    await expect(resgatnet.locator('[data-project-media-kind="placeholder"] img')).toHaveAttribute(
      "src",
      /\/joeych-pages\/profile-photo\.jpg$/,
    )
    await expect(resgatnet.locator(".project-figure-grid img")).toHaveCount(0)
    await expect(resgatnet.locator(".project-figure-unavailable figcaption")).toHaveText(
      "Fig.7 ResGatNet Architecture",
    )
    await expect(resgatnet.locator(".project-figure-unavailable")).toContainText("Media unavailable")
    await expect(resgatnet.locator(".project-record-contribution")).toHaveCount(1)
    await expect(resgatnet.locator(".project-link-unavailable")).toHaveCount(2)
    await expect(resgatnet.locator(".project-links a")).toHaveCount(0)
    await expect(powerPrint.locator(".project-record-contribution")).toHaveCount(0)
    await expect(powerPrint.locator(".project-figure-grid img")).toHaveCount(2)
    await expect(page.locator(".project-figure-grid img")).toHaveCount(3)
    await expect(page.locator("#joeych-pages .project-links a")).toHaveAttribute(
      "href",
      "https://github.com/JOEYZYC/joeych-pages",
    )
  })

  test("shows unavailable media without substituting the portrait after a real image fails", async ({ page }) => {
    await page.goto("en/projects/")
    const media = page.locator('[data-project-tile] [data-project-media-kind="real"]').first()
    const source = await media.getAttribute("data-project-media-source")

    await media.locator("[data-project-media-image]").dispatchEvent("error")

    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-image]")).toBeHidden()
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
    expect(source).not.toBe("/profile-photo.jpg")
    await expect(media).toHaveAttribute("data-project-media-source", source ?? "")
  })

  test("combines category and tag filters with AND semantics and Clear restores the archive", async ({ page }) => {
    await page.goto("en/projects/")

    await page.selectOption('[data-project-category-filter]', "Personal Website / Front-End Development")
    await page.selectOption('[data-project-tag-filter]', "OpenCV")

    await expect(page.locator("[data-project-filter-results]")).toHaveText("0 / 14")
    await expect(page.locator("[data-project-filter-empty]")).toBeVisible()
    expect(await visibleIds(page, "[data-project-tile]")).toEqual([])
    expect(await visibleIds(page, "[data-project-record]")).toEqual([])
    await expect(page.locator("[data-project-navigator-shell]")).toBeHidden()
    await expect(page.locator("[data-project-filter-clear]")).toBeEnabled()

    await page.locator("[data-project-filter-clear]").click()

    await expect(page.locator("[data-project-filter-results]")).toHaveText("14 / 14")
    await expect(page.locator("[data-project-filter-empty]")).toBeHidden()
    expect(await visibleIds(page, "[data-project-tile]")).toEqual(projectIds)
    expect(await visibleIds(page, "[data-project-record]")).toEqual(projectIds)
    await expect(page.locator("[data-project-navigator] option")).toHaveCount(14)
    await expect(page.locator("[data-project-filter-clear]")).toBeDisabled()
  })

  test("rebuilds navigator and observer state around filtered records", async ({ page }) => {
    await page.setViewportSize(viewports[2])
    await page.goto("en/projects/#resgatnet")

    await page.selectOption('[data-project-tag-filter]', "OpenCV")
    const expectedVisible = [
      "intelligent-reconnaissance-2024",
      "smart-harvesting-robot",
      "intelligent-reconnaissance-2023",
    ]
    expect(await visibleIds(page, "[data-project-tile]")).toEqual(expectedVisible)
    expect(await page.locator("[data-project-navigator] option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(expectedVisible)
    await expect(page).toHaveURL(/\/projects\/$/)

    await page.locator("#smart-harvesting-robot").evaluate((element) => element.scrollIntoView({ block: "start" }))
    await expect(page.locator("[data-project-navigator]")).toHaveValue("smart-harvesting-robot")
    await expect(page.locator('[data-project-tile][data-project-id="smart-harvesting-robot"]')).toHaveAttribute(
      "aria-current",
      "location",
    )

    await page.locator("[data-project-filter-clear]").click()
    await page.locator("#resgatnet").evaluate((element) => element.scrollIntoView({ block: "start" }))
    await expect(page.locator("[data-project-navigator]")).toHaveValue("resgatnet")
    await expect(page.locator("#resgatnet")).toHaveAttribute("data-active", "true")
  })

  test("a hash change to a hidden record clears filters, reveals it, and focuses its title", async ({ page }) => {
    await page.goto("en/projects/")
    await page.selectOption('[data-project-category-filter]', "Personal Website / Front-End Development")
    await expect(page.locator("[data-project-filter-results]")).toHaveText("1 / 14")

    await page.evaluate(() => {
      window.location.hash = "#resgatnet"
    })

    await expect(page.locator('[data-project-category-filter]')).toHaveValue("")
    await expect(page.locator('[data-project-tag-filter]')).toHaveValue("")
    await expect(page.locator("[data-project-filter-results]")).toHaveText("14 / 14")
    await expect(page.locator("#resgatnet")).toBeVisible()
    await expect(page.locator("#resgatnet [data-project-record-title]")).toBeFocused()
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()
    await expect(page).toHaveURL(/#resgatnet$/)
  })

  test("navigator selection synchronizes visible current labels without adding history", async ({ page }) => {
    await page.setViewportSize(viewports[2])
    await page.goto("en/projects/")
    const historyLength = await page.evaluate(() => window.history.length)

    await page.selectOption("[data-project-navigator]", "resgatnet")

    await expect(page.locator('[data-project-tile][data-project-id="resgatnet"]')).toHaveAttribute(
      "aria-current",
      "location",
    )
    await expect(page.locator('[data-project-tile][data-project-id="resgatnet"] [data-project-current-label]')).toBeVisible()
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength)
    await expect(page).toHaveURL(/\/projects\/$/)
  })

  test("valid skill provenance is visible while invalid pairs are removed", async ({ page }) => {
    await page.goto("en/projects/?skill=vision-halcon-opencv#intelligent-reconnaissance-2024")
    const tile = page.locator('[data-project-tile][data-project-id="intelligent-reconnaissance-2024"]')
    const record = page.locator("#intelligent-reconnaissance-2024")

    await expect(tile).toHaveAttribute("data-evidence-origin", "true")
    await expect(record).toHaveAttribute("data-evidence-origin", "true")
    await expect(tile.locator("[data-project-origin-label]")).toHaveText(
      "From skill evidence: Halcon / OpenCV image processing & vision",
    )
    await expect(record.locator("[data-project-origin-label]")).toBeVisible()
    await expect(page.locator("a.language-link")).toHaveAttribute(
      "href",
      "/joeych-pages/projects/#intelligent-reconnaissance-2024",
    )

    await page.goto("en/projects/?skill=vision-halcon-opencv#resgatnet")
    await expect(page).toHaveURL(/\/en\/projects\/#resgatnet$/)
    await expect(page.locator('[data-evidence-origin="true"]')).toHaveCount(0)
  })

  test("JavaScript-disabled projects keep all stable records and ordinary hash navigation", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4321/joeych-pages/",
      javaScriptEnabled: false,
    })
    const page = await context.newPage()

    await page.goto("en/projects/?skill=vision-halcon-opencv#resgatnet")

    await expect(page.locator("[data-project-filter-controls]")).toBeHidden()
    await expect(page.locator("[data-project-navigator-shell]")).toBeHidden()
    await expect(page.locator("[data-project-tile]")).toHaveCount(14)
    await expect(page.locator("[data-project-record]")).toHaveCount(14)
    await expect(page.locator("#resgatnet")).toBeVisible()
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()
    await expect(page).toHaveURL(/\?skill=vision-halcon-opencv#resgatnet$/)

    await context.close()
  })

  for (const viewport of viewports) {
    test(`fits the project explorer at ${viewport.name} width`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto("en/projects/")

      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    })
  }
})
