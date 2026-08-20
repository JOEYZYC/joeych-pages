import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { VIEWPORTS } from "./support/site-matrix"

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

const viewports = VIEWPORTS

const locales = [
  {
    path: "projects/",
    htmlLanguage: "zh-CN",
    navigation: "项目介绍",
    title: "项目介绍",
    summary: "按项目类别与项目名称筛选，查看完整的工程实践、贡献与图文证据。",
    pending: "项目图片待补充",
  },
  {
    path: "en/projects/",
    htmlLanguage: "en",
    navigation: "Projects",
    title: "Projects",
    summary: "Filter by project category and name to inspect complete engineering work, contributions, and supporting figures.",
    pending: "Project image pending",
  },
] as const

async function visibleIds(page: Page): Promise<string[]> {
  return page.locator("[data-project-record]").evaluateAll((records) => records
    .filter((record) => !(record as HTMLElement).hidden)
    .map((record) => record.id))
}

async function replaceEvidencePayloadBeforeEnhancement(page: Page, payload: string): Promise<void> {
  await page.addInitScript((replacement) => {
    const replacePayload = (node: Node) => {
      if (node instanceof HTMLScriptElement && node.matches("[data-project-skill-evidence]")) {
        node.textContent = replacement
      }
      if (node instanceof Element) {
        for (const script of node.querySelectorAll<HTMLScriptElement>("[data-project-skill-evidence]")) {
          script.textContent = replacement
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) replacePayload(node)
      }
    })
    observer.observe(document, { childList: true, subtree: true })
  }, payload)
}

test.describe("projects archive", () => {
  for (const locale of locales) {
    test(`renders the ${locale.path} record archive in source order`, async ({ page }) => {
      await page.goto(locale.path)
      const records = page.locator("[data-project-record]")

      await expect(page.getByRole("heading", { level: 1, name: locale.title })).toHaveCount(1)
      await expect(page.locator(".intro > p").last()).toHaveText(locale.summary)
      await expect(page.locator("html")).toHaveAttribute("lang", locale.htmlLanguage)
      await expect(page.getByRole("navigation").getByRole("link", { name: locale.navigation })).toHaveAttribute(
        "aria-current",
        "page",
      )
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${locale.path}$`))
      await expect(page.locator("[data-project-tile]")).toHaveCount(0)
      await expect(records).toHaveCount(projectIds.length)
      expect(await records.evaluateAll((elements) => elements.map((element) => element.id))).toEqual(projectIds)
      await expect(records.locator('[data-project-media-kind="real"]')).toHaveCount(5)
      await expect(records.locator('[data-project-media-kind="unavailable"]')).toHaveCount(9)
      await expect(records.locator('[data-project-media-kind="unavailable"] img')).toHaveCount(0)
      await expect(records.locator('[data-project-media-kind="unavailable"] .project-media-pending')).toHaveText(
        Array.from({ length: 9 }, () => locale.pending),
      )
    })
  }

  test("keeps primary visuals separate from complete figure and link evidence", async ({ page }) => {
    await page.goto("en/projects/#resgatnet")
    const resgatnet = page.locator("#resgatnet")
    const powerPrint = page.locator("#power-print-recognition")

    await expect(resgatnet.locator('[data-project-media-kind="unavailable"] .project-media-pending')).toHaveText(
      "Project image pending",
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
    await expect(page.locator("#joeych-pages .project-links a")).toHaveAttribute(
      "href",
      "https://github.com/JOEYZYC/joeych-pages",
    )
    await expect(page.locator("#joeych-pages [data-project-link-marker]")).toHaveText("External link")
  })

  test("localizes the visible external-link marker on Chinese pages", async ({ page }) => {
    await page.goto("projects/")

    await expect(page.locator("#joeych-pages [data-project-link-marker]")).toHaveText("外部链接")
  })

  test("shows unavailable media without substituting the placeholder after a real image fails", async ({ page }) => {
    await page.goto("en/projects/")
    const media = page.locator('#power-print-recognition [data-project-media-kind="real"]')
    const source = await media.getAttribute("data-project-media-source")

    await media.locator("[data-project-media-image]").dispatchEvent("error")

    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-image]")).toBeHidden()
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
    expect(source).not.toBe("/projects/project-placeholder.png")
    await expect(media).toHaveAttribute("data-project-media-source", source ?? "")
  })

  test("settles an image failure that occurs before enhancement", async ({ page }) => {
    await page.route("**/projects/power-print-recognition/power-print-architecture.jpg", (route) => route.abort())
    await page.goto("en/projects/")
    const media = page.locator('#power-print-recognition [data-project-media]')

    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-image]")).toBeHidden()
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
  })

  test("filters complete records by category and project name", async ({ page }) => {
    await page.goto("en/projects/")
    const category = page.locator("[data-project-category-filter]")
    const name = page.locator("[data-project-name-filter]")
    const website = page.locator("#joeych-pages")
    const websiteCategory = await website.getAttribute("data-project-category")

    expect(await name.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual([
      "",
      ...projectIds,
    ])

    await name.selectOption("resgatnet")
    expect(await visibleIds(page)).toEqual(["resgatnet"])
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()

    await category.selectOption(websiteCategory ?? "")
    await expect(name).toHaveValue("")
    expect(await name.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual([
      "",
      "joeych-pages",
    ])
    expect(await visibleIds(page)).toEqual(["joeych-pages"])

    await name.selectOption("joeych-pages")
    expect(await visibleIds(page)).toEqual(["joeych-pages"])
    await expect(page.locator("#joeych-pages [data-project-current-label]")).toBeVisible()

    await category.selectOption("")
    await expect(name).toHaveValue("")
    expect(await visibleIds(page)).toEqual(projectIds)
  })

  test("a hash change synchronizes both filters and focuses the stable record title", async ({ page }) => {
    await page.goto("en/projects/")
    await page.locator("[data-project-name-filter]").selectOption("joeych-pages")
    const target = page.locator("#resgatnet")
    const targetCategory = await target.getAttribute("data-project-category")

    await page.evaluate(() => {
      window.location.hash = "#resgatnet"
    })

    await expect(page.locator("[data-project-category-filter]")).toHaveValue(targetCategory ?? "")
    await expect(page.locator("[data-project-name-filter]")).toHaveValue("resgatnet")
    expect(await visibleIds(page)).toEqual(["resgatnet"])
    await expect(target.locator("[data-project-record-title]")).toBeFocused()
    await expect(target.locator("[data-project-current-label]")).toBeVisible()
    await expect(page).toHaveURL(/#resgatnet$/)
  })

  test("valid skill provenance stays on the filtered record while invalid pairs are removed", async ({ page }) => {
    await page.goto("en/projects/?skill=vision-halcon-opencv#intelligent-reconnaissance-2024")
    const record = page.locator("#intelligent-reconnaissance-2024")

    await expect(page.locator("[data-project-name-filter]")).toHaveValue("intelligent-reconnaissance-2024")
    expect(await visibleIds(page)).toEqual(["intelligent-reconnaissance-2024"])
    await expect(record).toHaveAttribute("data-evidence-origin", "true")
    await expect(record.locator("[data-project-origin-label]")).toHaveText(
      "From skill evidence: Halcon / OpenCV image processing & vision",
    )
    await expect(page.locator("a.language-link")).toHaveAttribute(
      "href",
      "/joeych-pages/projects/#intelligent-reconnaissance-2024",
    )

    await page.goto("en/projects/?skill=vision-halcon-opencv#resgatnet")
    await expect(page).toHaveURL(/\/en\/projects\/#resgatnet$/)
    await expect(page.locator("[data-project-name-filter]")).toHaveValue("resgatnet")
    await expect(page.locator('[data-evidence-origin="true"]')).toHaveCount(0)
  })

  for (const scenario of [
    { name: "malformed JSON", payload: "{" },
    {
      name: "a mixed valid and malformed evidence entry",
      payload: '{"vision-halcon-opencv":{"label":"Vision","projectIds":["intelligent-reconnaissance-2024"]},"broken":{"label":7,"projectIds":[]}}',
    },
  ] as const) {
    test(`keeps the complete static archive usable when evidence payload contains ${scenario.name}`, async ({ page }) => {
      const pageErrors: string[] = []
      page.on("pageerror", (error) => pageErrors.push(error.message))
      await replaceEvidencePayloadBeforeEnhancement(page, scenario.payload)

      await page.goto("en/projects/?skill=vision-halcon-opencv#intelligent-reconnaissance-2024")

      expect(pageErrors).toEqual([])
      await expect(page.locator("[data-project-filter-controls]")).toBeHidden()
      expect(await visibleIds(page)).toEqual(projectIds)
    })
  }

  test("JavaScript-disabled projects keep all stable records and ordinary hash navigation", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4321/joeych-pages/",
      javaScriptEnabled: false,
    })
    const page = await context.newPage()

    await page.goto("en/projects/?skill=vision-halcon-opencv#resgatnet")

    await expect(page.locator("[data-project-filter-controls]")).toBeHidden()
    await expect(page.locator("[data-project-tile]")).toHaveCount(0)
    await expect(page.locator("[data-project-record]")).toHaveCount(14)
    await expect(page.locator("#resgatnet")).toBeVisible()
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()
    await expect(page).toHaveURL(/\?skill=vision-halcon-opencv#resgatnet$/)

    await context.close()
  })

  for (const viewport of viewports) {
    test(`keeps the record filter within the ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto("en/projects/")

      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      await expect(page.locator("[data-project-category-filter]")).toBeVisible()
      await expect(page.locator("[data-project-name-filter]")).toBeVisible()
    })
  }
})
