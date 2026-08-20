import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { VIEWPORTS } from "./support/site-matrix"

const projectIds = [
  "eflydrone-boards",
  "joeych-pages",
  "power-print-recognition",
  "dual-light-fusion",
  "resgatnet",
  "rigid-dual-polarization-metasurface",
  "single-phase-power-analyzer",
  "traffic-sign-recognition",
  "intelligent-reconnaissance-2024",
  "full-model-smart-car",
  "digikey-dual-light-thermal-imager-2024",
  "publication-bifunctional-flexible-metasurface",
  "publication-tunable-bifunctional-metasurface-absorber",
  "publication-dual-broadband-flexible-metasurface",
  "publication-dual-band-polarization-conversion",
  "publication-tri-band-metasurface-absorber",
  "flexible-bifunctional-metasurface",
  "smart-harvesting-robot",
  "intelligent-reconnaissance-2023",
] as const

const locales = [
  { path: "projects/", htmlLanguage: "zh-CN", navigation: "项目介绍", title: "项目介绍", summary: "按项目类别、项目名称与荣誉筛选，查看工程实践、论文与图文证据。", pending: "项目图片待补充" },
  { path: "en/projects/", htmlLanguage: "en", navigation: "Projects", title: "Projects", summary: "Filter by project category, name, and honor to inspect engineering work, publications, and supporting figures.", pending: "Project image pending" },
] as const

async function visibleCardIds(page: Page): Promise<string[]> {
  return page.locator("[data-project-card]").evaluateAll((cards) => cards
    .filter((card) => !(card as HTMLElement).hidden)
    .map((card) => card.getAttribute("data-project-id") ?? ""))
}

async function replaceEvidencePayloadBeforeEnhancement(page: Page, payload: string): Promise<void> {
  await page.addInitScript((replacement) => {
    const replacePayload = (node: Node) => {
      if (node instanceof HTMLScriptElement && node.matches("[data-project-skill-evidence]")) node.textContent = replacement
      if (node instanceof Element) {
        for (const script of node.querySelectorAll<HTMLScriptElement>("[data-project-skill-evidence]")) script.textContent = replacement
      }
    }
    new MutationObserver((mutations) => {
      for (const mutation of mutations) for (const node of mutation.addedNodes) replacePayload(node)
    }).observe(document, { childList: true, subtree: true })
  }, payload)
}

test.describe("projects archive", () => {
  for (const locale of locales) {
    test(`renders the ${locale.path} year-ordered project and publication cards with static detail fallback`, async ({ page }) => {
      await page.goto(locale.path)
      const cards = page.locator("[data-project-card]")
      const records = page.locator("[data-project-record]")

      await expect(page.getByRole("heading", { level: 1, name: locale.title })).toHaveCount(1)
      await expect(page.locator(".intro > p").last()).toHaveText(locale.summary)
      await expect(page.locator("html")).toHaveAttribute("lang", locale.htmlLanguage)
      await expect(page.getByRole("navigation").getByRole("link", { name: locale.navigation })).toHaveAttribute("aria-current", "page")
      await expect(cards).toHaveCount(projectIds.length)
      await expect(records).toHaveCount(projectIds.length)
      expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-project-id")))).toEqual(projectIds)
      expect(await records.evaluateAll((elements) => elements.map((element) => element.id))).toEqual(projectIds)
      expect(await visibleCardIds(page)).toEqual(projectIds)
      await expect(page.locator("[data-project-records]")).toBeHidden()
      await expect(cards.locator('[data-project-media-kind="real"]')).toHaveCount(5)
      await expect(cards.locator('[data-project-media-kind="unavailable"]')).toHaveCount(9)
      await expect(cards.locator('[data-project-media-kind="unavailable"] .project-media-pending')).toHaveText(Array.from({ length: 9 }, () => locale.pending))
    })
  }

  test("opens a complete project dialog with its related award and certificates", async ({ page }) => {
    await page.goto("en/projects/")
    const card = page.locator('[data-project-card][data-project-id="power-print-recognition"]')
    const dialog = page.locator('[data-project-dialog][data-project-id="power-print-recognition"]')

    await card.click()

    await expect(dialog).toBeVisible()
    await expect(dialog.locator("[data-project-dialog-title]")).toBeFocused()
    await expect(dialog.locator('[data-related-achievement-id="renesas-east-first-national-third-2024"]')).toContainText("National Third")
    await expect(dialog.locator('[data-related-achievement-id="renesas-east-first-national-third-2024"] img')).toHaveCount(2)
    await expect(dialog.locator('[data-related-achievement-id="renesas-east-first-national-third-2024"] a.project-related-achievement-link')).toHaveAttribute("href", "/joeych-pages/en/awards/#award-renesas-east-first-national-third-2024")
    await expect(dialog.locator("[data-certificate-dialog]")).toHaveCount(0)
    await dialog.locator("[data-project-dialog-close]").click()
    await expect(card).toBeFocused()
  })

  test("opens a complete project dialog with related publication evidence", async ({ page }) => {
    await page.goto("en/projects/#resgatnet")
    const dialog = page.locator('[data-project-dialog][data-project-id="resgatnet"]')

    await expect(dialog).toBeVisible()
    await expect(dialog.locator('[data-related-achievement-id="resgatnet"]')).toContainText("IEEE Access · 2nd author of 6")
    await expect(dialog.locator('[data-related-achievement-id="resgatnet"] a.project-related-achievement-link')).toHaveAttribute("href", "/joeych-pages/en/awards/#publication-resgatnet")
    await expect(dialog.locator(".project-figure-unavailable")).toContainText("Media unavailable")
    await expect(dialog.locator(".project-link-unavailable")).toHaveCount(2)
  })

  test("renders an unpaired publication as a compact project without duplicating ResGatNet", async ({ page }) => {
    await page.goto("en/projects/")
    const publicationId = "publication-bifunctional-flexible-metasurface"
    const card = page.locator(`[data-project-card][data-project-id="${publicationId}"]`)

    await expect(page.locator('[data-project-card][data-project-id="publication-resgatnet"]')).toHaveCount(0)
    await expect(card).toContainText("Diamond and Related Materials · 3rd author of 8")
    await card.click()

    const dialog = page.locator(`[data-project-dialog][data-project-id="${publicationId}"]`)
    await expect(dialog).toContainText("Publications")
    await expect(dialog.locator(".project-record-contribution")).toHaveCount(0)
    await expect(dialog.locator(".project-related-certificate-grid img")).toHaveCount(1)
  })

  test("keeps the detail template explicit when source fields are absent", async ({ page }) => {
    await page.goto("en/projects/")
    await page.locator('[data-project-card][data-project-id="intelligent-reconnaissance-2023"]').click()
    const dialog = page.locator('[data-project-dialog][data-project-id="intelligent-reconnaissance-2023"]')

    await expect(dialog.locator(".project-related-achievements")).toContainText("To be completed")
    await expect(dialog.locator(".project-record-contribution")).toContainText("To be completed")
    await expect(dialog.locator('[data-project-media-kind="unavailable"] .project-media-pending')).toHaveText("Project image pending")
  })

  test("localizes the visible external-link marker in project dialog", async ({ page }) => {
    await page.goto("projects/")
    await page.locator('[data-project-card][data-project-id="joeych-pages"]').click()
    const dialog = page.locator('[data-project-dialog][data-project-id="joeych-pages"]')

    await expect(dialog.locator("[data-project-link-marker]")).toHaveText("外部链接")
  })

  test("shows unavailable media without substituting the placeholder after a real card image fails", async ({ page }) => {
    await page.goto("en/projects/")
    const media = page.locator('[data-project-card][data-project-id="power-print-recognition"] [data-project-media-kind="real"]')
    const source = await media.getAttribute("data-project-media-source")

    await media.locator("[data-project-media-image]").dispatchEvent("error")

    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-image]")).toBeHidden()
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
    expect(source).not.toBe("/projects/project-placeholder.png")
  })

  test("settles a card image failure that occurs before enhancement", async ({ page }) => {
    await page.route("**/projects/power-print-recognition/power-print-architecture.jpg", (route) => route.abort())
    await page.goto("en/projects/")
    const media = page.locator('[data-project-card][data-project-id="power-print-recognition"] [data-project-media]')

    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
  })

  test("filters cards by category and project name without opening the dialog", async ({ page }) => {
    await page.goto("en/projects/")
    const category = page.locator("[data-project-category-filter]")
    const name = page.locator("[data-project-name-filter]")
    const websiteCategory = await page.locator('[data-project-card][data-project-id="joeych-pages"]').getAttribute("data-project-category")

    await name.selectOption("resgatnet")
    expect(await visibleCardIds(page)).toEqual(["resgatnet"])
    await expect(page.locator('[data-project-dialog][data-project-id="resgatnet"]')).toBeHidden()

    await name.selectOption("")
    await category.selectOption(websiteCategory ?? "")
    await expect(name).toHaveValue("")
    expect(await name.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(["", "joeych-pages"])
    expect(await visibleCardIds(page)).toEqual(["joeych-pages"])
  })

  test("uses pure titles in project-name options and filters standalone publications", async ({ page }) => {
    await page.goto("en/projects/")
    const category = page.locator("[data-project-category-filter]")
    const name = page.locator("[data-project-name-filter]")

    await category.selectOption("publication")
    await expect(name.locator("option").nth(1)).toHaveText("Bifunctional flexible metasurface based on graphene and vanadium dioxide for polarization conversion and absorption")
    expect((await name.locator("option").allTextContents()).some((title) => /^\d{2}\s+—/.test(title))).toBe(false)

    await name.selectOption("publication-dual-band-polarization-conversion")
    expect(await visibleCardIds(page)).toEqual(["publication-dual-band-polarization-conversion"])
  })

  test("filters cards by explicitly linked honor", async ({ page }) => {
    await page.goto("en/projects/")
    const honor = page.locator("[data-project-honor-filter]")

    await honor.selectOption("renesas-east-first-national-third-2024")

    await expect(page.locator("[data-project-category-filter]")).toHaveValue("")
    await expect(page.locator("[data-project-name-filter]")).toHaveValue("")
    expect(await visibleCardIds(page)).toEqual(["power-print-recognition"])
  })

  test("links category, project name, and honor choices", async ({ page }) => {
    await page.goto("en/projects/")
    const category = page.locator("[data-project-category-filter]")
    const name = page.locator("[data-project-name-filter]")
    const honor = page.locator("[data-project-honor-filter]")
    const powerCategory = await page.locator('[data-project-card][data-project-id="power-print-recognition"]').getAttribute("data-project-category")

    await category.selectOption(powerCategory ?? "")
    expect(await honor.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual([
      "",
      "renesas-east-first-national-third-2024",
    ])

    await honor.selectOption("renesas-east-first-national-third-2024")
    await expect(category).toHaveValue(powerCategory ?? "")
    await expect(name).toHaveValue("")
    expect(await name.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(["", "power-print-recognition"])
    expect(await visibleCardIds(page)).toEqual(["power-print-recognition"])

    await honor.selectOption("")
    await expect(category).toHaveValue(powerCategory ?? "")
    await expect(name).toHaveValue("")
    expect(await visibleCardIds(page)).toEqual(["power-print-recognition"])
  })

  test("a hash opens the matching dialog and synchronizes both filters", async ({ page }) => {
    await page.goto("en/projects/")
    const card = page.locator('[data-project-card][data-project-id="resgatnet"]')
    const category = await card.getAttribute("data-project-category")

    await page.evaluate(() => { window.location.hash = "#resgatnet" })

    await expect(page.locator("[data-project-category-filter]")).toHaveValue(category ?? "")
    await expect(page.locator("[data-project-name-filter]")).toHaveValue("resgatnet")
    expect(await visibleCardIds(page)).toEqual(["resgatnet"])
    await expect(page.locator('[data-project-dialog][data-project-id="resgatnet"]')).toBeVisible()
    await expect(page.locator('[data-project-dialog][data-project-id="resgatnet"] [data-project-dialog-title]')).toBeFocused()
  })

  test("valid skill provenance opens the linked dialog while invalid pairs are removed", async ({ page }) => {
    await page.goto("en/projects/?skill=vision-halcon-opencv#intelligent-reconnaissance-2024")
    const dialog = page.locator('[data-project-dialog][data-project-id="intelligent-reconnaissance-2024"]')

    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute("data-evidence-origin", "true")
    await expect(dialog.locator("[data-project-origin-label]")).toHaveText("From skill evidence: Halcon / OpenCV image processing & vision")
    await page.goto("en/projects/?skill=vision-halcon-opencv#resgatnet")
    await expect(page).toHaveURL(/\/en\/projects\/#resgatnet$/)
    await expect(page.locator('[data-evidence-origin="true"]')).toHaveCount(0)
  })

  for (const scenario of [
    { name: "malformed JSON", payload: "{" },
    { name: "a mixed valid and malformed evidence entry", payload: '{"vision-halcon-opencv":{"label":"Vision","projectIds":["intelligent-reconnaissance-2024"]},"broken":{"label":7,"projectIds":[]}}' },
  ] as const) {
    test(`keeps static detail fallback usable when evidence payload contains ${scenario.name}`, async ({ page }) => {
      await replaceEvidencePayloadBeforeEnhancement(page, scenario.payload)
      await page.goto("en/projects/?skill=vision-halcon-opencv#intelligent-reconnaissance-2024")

      await expect(page.locator("[data-project-filter-controls]")).toBeHidden()
      await expect(page.locator("[data-project-card-grid]")).toBeHidden()
      await expect(page.locator("[data-project-records]")).toBeVisible()
      await expect(page.locator("[data-project-record]")).toHaveCount(19)
    })
  }

  test("JavaScript-disabled projects keep static detail fallback and ordinary hash navigation", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: "http://127.0.0.1:4321/joeych-pages/", javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto("en/projects/?skill=vision-halcon-opencv#resgatnet")

    await expect(page.locator("[data-project-filter-controls]")).toBeHidden()
    await expect(page.locator("[data-project-card-grid]")).toBeHidden()
    await expect(page.locator("[data-project-records]")).toBeVisible()
    await expect(page.locator("[data-project-record]")).toHaveCount(19)
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()
    await context.close()
  })

  for (const viewport of VIEWPORTS) {
    test(`keeps project cards within the ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto("en/projects/")
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      await expect(page.locator("[data-project-card-grid]")).toBeVisible()
    })
  }
})
