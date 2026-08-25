import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { VIEWPORTS } from "./support/site-matrix"

const projectIds = [
  "2026-Project-EFlyDroneLowCostModularDroneHardwarePlatform",
  "2026-Project-DesignOfAGrapheneBasedTerahertzLinearToCircularPolarizationConversionMetasurface",
  "2025-Paper-DesignOfADualBandPolarizationConverterBasedOnAChiralMetasurface",
  "2025-Project-ZhangYichengPersonalAcademicPortfolioWebsite",
  "2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign",
  "2024-Competition-DualLightFusionSmartThermalImager",
  "2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception",
  "2024-Project-PerformanceStudyOfARigidLinearCircularDualPolarizationConversionMetasurface",
  "2024-Competition-SinglePhasePowerAnalyzer",
  "2024-Competition-IntelligentConnectedTrafficSignRecognitionSystemBasedOnLightweightTensorFlow",
  "2024-Competition-IntelligentReconnaissanceSystem",
  "2024-Competition-SmartCarModelGroupTeamDevelopmentArchive",
  "2024-Paper-BifunctionalFlexibleMetasurfaceBasedOnGrapheneAndVanadiumDioxideForPolarizationConversionAndAbsorption",
  "2024-Paper-DesignAndTheoreticalAnalysisOfATunableBifunctionalMetasurfaceAbsorberBasedOnVanadiumDioxideAndPhotoconductiveSilicon",
  "2024-Paper-DualBroadbandFlexibleMetasurfaceBasedOnTheStaggeredTriangularCheckerboardLayoutForRCSReduction",
  "2023-Paper-SimulationStudyOfADualBandFlexiblePolarizationConversionMetasurface",
  "2024-Paper-ATriBandMetasurfaceAbsorber",
  "2023-Competition-SmartHarvestingRobot",
  "2023-Competition-IntelligentReconnaissanceCompetitionProject",
] as const

const addedPaperImages = [
  ["2023-Paper-SimulationStudyOfADualBandFlexiblePolarizationConversionMetasurface", "/projects/2023-Paper-SimulationStudyOfADualBandFlexiblePolarizationConversionMetasurface/modelpic.png"],
  ["2024-Paper-DesignAndTheoreticalAnalysisOfATunableBifunctionalMetasurfaceAbsorberBasedOnVanadiumDioxideAndPhotoconductiveSilicon", "/projects/2024-Paper-DesignAndTheoreticalAnalysisOfATunableBifunctionalMetasurfaceAbsorberBasedOnVanadiumDioxideAndPhotoconductiveSilicon/modelpic.png"],
  ["2025-Paper-DesignOfADualBandPolarizationConverterBasedOnAChiralMetasurface", "/projects/2025-Paper-DesignOfADualBandPolarizationConverterBasedOnAChiralMetasurface/modelpic.png"],
] as const

const locales = [
  { path: "projects/", htmlLanguage: "zh-CN", navigation: "项目与成果", title: "项目与成果", summary: "按项目浏览工程实践、论文、竞赛荣誉与图文证据。", pending: "项目图片待补充" },
  { path: "en/projects/", htmlLanguage: "en", navigation: "Projects & Achievements", title: "Projects & Achievements", summary: "Browse engineering work, publications, honors, and supporting evidence by project.", pending: "Project image pending" },
] as const

async function visibleCardIds(page: Page): Promise<string[]> {
  return page.locator("[data-project-card]").evaluateAll((cards) => cards
    .filter((card) => !(card as HTMLElement).hidden)
    .map((card) => card.getAttribute("data-project-id") ?? ""))
}

test.describe("projects archive", () => {
  test("keeps the retired awards routes deleted", async ({ page }) => {
    expect((await page.goto("awards/"))?.status()).toBe(404)
    expect((await page.goto("en/awards/"))?.status()).toBe(404)
  })

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
      await expect(cards.locator('[data-project-media-kind="real"]')).toHaveCount(16)
      await expect(cards.locator('[data-project-media-kind="unavailable"]')).toHaveCount(3)
      await expect(cards.locator('[data-project-media-kind="unavailable"] .project-media-pending')).toHaveText(Array.from({ length: 3 }, () => locale.pending))
      for (const [id, source] of addedPaperImages) {
        await expect(page.locator(`[data-project-card][data-project-id="${id}"] [data-project-media]`)).toHaveAttribute("data-project-media-source", source)
      }
    })
  }

  test("opens a complete project dialog with its related award and certificates", async ({ page }) => {
    await page.goto("en/projects/")
    const card = page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
    const dialog = page.locator('[data-project-dialog][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')

    await card.click()

    await expect(dialog).toBeVisible()
    await expect(dialog.locator("[data-project-dialog-title]")).toBeFocused()
    const media = dialog.locator('[data-project-media-context="record"]')
    const figureControls = dialog.locator("[data-project-figure-select]")
    await expect(figureControls).toHaveCount(3)
    await expect(figureControls.nth(0)).toHaveAttribute("aria-pressed", "true")
    await expect(figureControls.nth(1)).toHaveAttribute("aria-pressed", "false")
    await expect(dialog.locator(".project-figures")).toHaveCount(0)
    await expect(media.locator("[data-project-media-caption]")).toHaveCount(0)

    await figureControls.nth(1).press("Enter")
    await expect(figureControls.nth(1)).toHaveAttribute("aria-pressed", "true")
    await expect(media).toHaveAttribute("data-project-media-source", "/projects/2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign/power-print-hardware.png")
    await expect(media.locator("[data-project-media-image]")).toHaveAttribute("alt", "Hardware Device")

    await figureControls.nth(0).click()
    await expect(figureControls.nth(0)).toHaveAttribute("aria-pressed", "true")
    await media.locator("[data-project-media-image]").dispatchEvent("error")
    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
    const outcome = dialog.locator('[data-project-outcome-id="renesas-east-first-national-third-2024"]')
    await expect(outcome).toContainText("National Third")
    await expect(outcome.locator("[data-certificate-dialog]")).toHaveCount(1)
    await expect(outcome.locator("[data-certificate-items] li")).toHaveCount(2)
    await dialog.locator("[data-project-dialog-close]").click()
    await expect(card).toBeFocused()
  })

  test("keeps the project dialog rounded close control visible while its content scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("en/projects/")
    const card = page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
    const dialog = page.locator('[data-project-dialog][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
    const content = dialog.locator("[data-project-dialog-content]")
    const close = dialog.locator("[data-project-dialog-close]")

    await card.click()
    await expect(dialog).toHaveCSS("overflow", "hidden")
    await expect(content).toHaveCSS("overflow-y", "auto")
    const initialPosition = await close.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { top: bounds.top, right: bounds.right }
    })

    await content.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
    const scrolledPosition = await close.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { top: bounds.top, right: bounds.right }
    })
    expect(scrolledPosition.top).toBeCloseTo(initialPosition.top, 0)
    expect(scrolledPosition.right).toBeCloseTo(initialPosition.right, 0)
    await expect(close).toBeVisible()
    await close.click()
    await expect(card).toBeFocused()

    await card.click()
    await expect(content).toHaveJSProperty("scrollTop", 0)
    await page.keyboard.press("Escape")
    await expect(card).toBeFocused()
  })

  test("opens a complete project dialog with related publication evidence", async ({ page }) => {
    await page.goto("en/projects/#2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception")
    const dialog = page.locator('[data-project-dialog][data-project-id="2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception"]')

    await expect(dialog).toBeVisible()
    await expect(dialog.locator('[data-project-outcome-id="resgatnet"]')).toContainText("IEEE Access · 3rd author of 6")
    await expect(dialog.locator("[data-project-figure-select]")).toHaveCount(1)
    await expect(dialog.locator("[data-project-figure-select]")).toHaveAttribute("aria-pressed", "true")
    await expect(dialog.locator("[data-project-media-caption]")).toHaveCount(0)
    await expect(dialog.locator(".project-figure-unavailable")).toHaveCount(0)
    await expect(dialog.locator(".project-link-unavailable")).toHaveCount(1)
  })

  test("renders a publication in its owning innovation project without duplicating ResGatNet", async ({ page }) => {
    await page.goto("en/projects/")
    const publicationId = "2024-Paper-BifunctionalFlexibleMetasurfaceBasedOnGrapheneAndVanadiumDioxideForPolarizationConversionAndAbsorption"
    const card = page.locator(`[data-project-card][data-project-id="${publicationId}"]`)

    await expect(page.locator('[data-project-card][data-project-id="publication-resgatnet"]')).toHaveCount(0)
    await expect(card).toContainText("Diamond and Related Materials, 3rd author of 9")
    await card.click()

    const dialog = page.locator(`[data-project-dialog][data-project-id="${publicationId}"]`)
    await expect(dialog.locator('[data-project-outcome-kind="publication"]')).toContainText("Diamond and Related Materials")
    await expect(dialog.locator(".project-record-contribution")).toContainText("Led the innovation-training project")
    await expect(dialog.locator('[data-project-media-kind="real"] img')).toHaveCount(1)
    await expect(dialog.locator("[data-certificate-dialog]")).toHaveCount(1)
  })

  test("shows the 2023 reconnaissance image and award while contribution remains pending", async ({ page }) => {
    await page.goto("en/projects/")
    await page.locator('[data-project-card][data-project-id="2023-Competition-IntelligentReconnaissanceCompetitionProject"]').click()
    const dialog = page.locator('[data-project-dialog][data-project-id="2023-Competition-IntelligentReconnaissanceCompetitionProject"]')

    await expect(dialog.locator('[data-project-outcome-id="raicom-jiangsu-third-2023"]')).toContainText("Jiangsu Division Third Prize")
    await expect(dialog.locator(".project-record-contribution")).toContainText("To be completed")
    await expect(dialog.locator('[data-project-media-kind="real"] img')).toHaveCount(1)
  })

  test("localizes the visible external-link marker in project dialog", async ({ page }) => {
    await page.goto("projects/")
    await page.locator('[data-project-card][data-project-id="2025-Project-ZhangYichengPersonalAcademicPortfolioWebsite"]').click()
    const dialog = page.locator('[data-project-dialog][data-project-id="2025-Project-ZhangYichengPersonalAcademicPortfolioWebsite"]')

    await expect(dialog.locator("[data-project-link-marker]")).toHaveText("外部链接")
  })

  test("shows unavailable media without substituting the placeholder after a real card image fails", async ({ page }) => {
    await page.goto("en/projects/")
    const media = page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"] [data-project-media-kind="real"]')
    const source = await media.getAttribute("data-project-media-source")

    await media.locator("[data-project-media-image]").dispatchEvent("error")

    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-image]")).toBeHidden()
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
    expect(source).toBe("/projects/2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign/拓扑图.png")
  })

  test("settles a card image failure that occurs before enhancement", async ({ page }) => {
    await page.route("**/projects/2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign/%E6%8B%93%E6%89%91%E5%9B%BE.png", (route) => route.abort())
    await page.goto("en/projects/")
    const media = page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"] [data-project-media]')

    await expect(media).toHaveAttribute("data-media-error", "true")
    await expect(media.locator("[data-project-media-unavailable]")).toBeVisible()
  })

  test("filters cards by category and project name without opening the dialog", async ({ page }) => {
    await page.goto("en/projects/")
    const category = page.locator("[data-project-category-filter]")
    const name = page.locator("[data-project-name-filter]")
    const websiteCategory = await page.locator('[data-project-card][data-project-id="2025-Project-ZhangYichengPersonalAcademicPortfolioWebsite"]').getAttribute("data-project-category")

    await name.selectOption("2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception")
    expect(await visibleCardIds(page)).toEqual(["2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception"])
    await expect(page.locator('[data-project-dialog][data-project-id="2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception"]')).toBeHidden()

    await name.selectOption("")
    await category.selectOption(websiteCategory ?? "")
    await expect(name).toHaveValue("")
    expect(await name.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(["", "2025-Project-ZhangYichengPersonalAcademicPortfolioWebsite"])
    expect(await visibleCardIds(page)).toEqual(["2025-Project-ZhangYichengPersonalAcademicPortfolioWebsite"])
  })

  test("uses pure titles in project-name options and filters standalone publications", async ({ page }) => {
    await page.goto("en/projects/")
    const category = page.locator("[data-project-category-filter]")
    const name = page.locator("[data-project-name-filter]")

    await category.selectOption("Publication")
    await expect(name.locator("option").nth(1)).toHaveText("Design of a Dual-Band Polarization Converter Based on a Chiral Metasurface")
    expect((await name.locator("option").allTextContents()).some((title) => /^\d{2}\s+—/.test(title))).toBe(false)

    await name.selectOption("2023-Paper-SimulationStudyOfADualBandFlexiblePolarizationConversionMetasurface")
    expect(await visibleCardIds(page)).toEqual(["2023-Paper-SimulationStudyOfADualBandFlexiblePolarizationConversionMetasurface"])
  })

  test("filters cards by explicitly linked honor", async ({ page }) => {
    await page.goto("en/projects/")
    const honor = page.locator("[data-project-honor-filter]")

    await honor.selectOption("renesas-east-first-national-third-2024")

    await expect(page.locator("[data-project-category-filter]")).toHaveValue("")
    await expect(page.locator("[data-project-name-filter]")).toHaveValue("")
    expect(await visibleCardIds(page)).toEqual(["2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"])
  })

  test("links category, project name, and honor choices", async ({ page }) => {
    await page.goto("en/projects/")
    const category = page.locator("[data-project-category-filter]")
    const name = page.locator("[data-project-name-filter]")
    const honor = page.locator("[data-project-honor-filter]")
    const powerCategory = await page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]').getAttribute("data-project-category")

    await category.selectOption(powerCategory ?? "")
    expect(await honor.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual([
      "",
      "renesas-east-first-national-third-2024",
    ])

    await honor.selectOption("renesas-east-first-national-third-2024")
    await expect(category).toHaveValue(powerCategory ?? "")
    await expect(name).toHaveValue("")
    expect(await name.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(["", "2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"])
    expect(await visibleCardIds(page)).toEqual(["2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"])

    await honor.selectOption("")
    await expect(category).toHaveValue(powerCategory ?? "")
    await expect(name).toHaveValue("")
    expect(await visibleCardIds(page)).toEqual(["2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"])
  })

  test("a hash opens the matching dialog and synchronizes both filters", async ({ page }) => {
    await page.goto("en/projects/")
    const card = page.locator('[data-project-card][data-project-id="2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception"]')
    const category = await card.getAttribute("data-project-category")

    await page.evaluate(() => { window.location.hash = "#2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception" })

    await expect(page.locator("[data-project-category-filter]")).toHaveValue(category ?? "")
    await expect(page.locator("[data-project-name-filter]")).toHaveValue("2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception")
    expect(await visibleCardIds(page)).toEqual(["2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception"])
    await expect(page.locator('[data-project-dialog][data-project-id="2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception"]')).toBeVisible()
    await expect(page.locator('[data-project-dialog][data-project-id="2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception"] [data-project-dialog-title]')).toBeFocused()
  })

  test("valid skill provenance opens the linked dialog while invalid pairs are removed", async ({ page }) => {
    await page.goto("en/projects/?skill=vision-halcon-opencv#2024-Competition-IntelligentReconnaissanceSystem")
    const dialog = page.locator('[data-project-dialog][data-project-id="2024-Competition-IntelligentReconnaissanceSystem"]')

    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute("data-evidence-origin", "true")
    await expect(dialog.locator("[data-project-origin-label]")).toHaveText("From skill evidence: Halcon / OpenCV image processing & vision")
    await page.goto("en/projects/?skill=vision-halcon-opencv#2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception")
    await expect(page).toHaveURL(/\/en\/projects\/#2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception$/)
    await expect(page.locator('[data-evidence-origin="true"]')).toHaveCount(0)
  })

  test("JavaScript-disabled projects keep static detail fallback and ordinary hash navigation", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: "http://127.0.0.1:4321/joeych-pages/", javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto("en/projects/#2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign")

    await expect(page.locator("[data-project-filter-controls]")).toBeHidden()
    await expect(page.locator("[data-project-card-grid]")).toBeHidden()
    await expect(page.locator("[data-project-records]")).toBeVisible()
    await expect(page.locator("[data-project-record]")).toHaveCount(projectIds.length)
    const record = page.locator('[id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
    await expect(record.locator("[data-project-current-label]")).toBeVisible()
    await expect(record.locator("[data-project-figure-select]")).toHaveCount(0)
    await expect(record.locator("[data-project-media-image]")).toHaveCount(1)
    await expect(record.locator(".project-figure-grid img")).toHaveCount(2)
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
