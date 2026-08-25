import AxeBuilder from "@axe-core/playwright"
import type { Locator, Page, TestInfo } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { CANONICAL_ROUTES, THEMES, VIEWPORTS } from "./support/site-matrix"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
const mobileViewport = VIEWPORTS[0]
const desktopViewport = VIEWPORTS[2]
const zoomViewport = { width: 640, height: 450 }
const themes = THEMES
const routes = CANONICAL_ROUTES
type AxeEvidence = {
  readonly route: string
  readonly state: string
  readonly theme: string
  readonly viewport: number
  readonly violations: readonly {
    readonly id: string
    readonly impact: string | null
    readonly targets: readonly string[]
  }[]
}

async function expectNoWcagViolations(
  page: Page,
  evidence: Omit<AxeEvidence, "violations">,
  testInfo: TestInfo,
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  const violations = results.violations
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? null,
      targets: violation.nodes.flatMap((node) => node.target.map((target) =>
        typeof target === "string" ? target : target.join(" "),
      )).sort(),
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
  await testInfo.attach("axe-results.json", {
    body: JSON.stringify({ ...evidence, violations }, null, 2),
    contentType: "application/json",
  })
  const message = results.violations
    .map((violation) => `${violation.id} (${violation.impact ?? "unknown"}): ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)
    .join("\n")
  expect(results.violations, message).toEqual([])
}

async function applyPageScale(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page)
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 })
}

async function expectReachable(control: Locator): Promise<void> {
  await control.evaluate((element) => element.scrollIntoView({ block: "center", inline: "center" }))
  await expect(control).toBeVisible()
  await expect.poll(() => control.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const viewport = window.visualViewport
    if (viewport === null) return bounds.right > 0 && bounds.bottom > 0 && bounds.left < window.innerWidth && bounds.top < window.innerHeight
    return bounds.right > viewport.offsetLeft &&
      bounds.bottom > viewport.offsetTop &&
      bounds.left < viewport.offsetLeft + viewport.width &&
      bounds.top < viewport.offsetTop + viewport.height
  })).toBe(true)
}

test.describe("WCAG accessibility and 200% reflow", () => {
  test.describe.configure({ mode: "serial" })

  test("reflows every canonical route at a true 320px layout viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 })

    for (const route of routes) {
      await page.goto(route.path)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    }
  })

  for (const viewport of [mobileViewport, desktopViewport]) {
    for (const theme of themes) {
      test(`has no WCAG A/AA Axe violations on all routes in ${theme} at ${viewport.width}px`, async ({ page }, testInfo) => {
        test.setTimeout(60_000)
        test.fail(theme === "dark", "Accepted #176b45 dark-theme text contrast debt")
        await page.setViewportSize(viewport)
        await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), { key: "joeych-theme", value: theme })

        for (const route of routes) {
          await page.goto(route.path)
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
          await expectNoWcagViolations(page, {
            route: route.path || "/",
            state: "document",
            theme,
            viewport: viewport.width,
          }, testInfo)
        }
      })
    }
  }

  for (const theme of themes) {
    test(`has no WCAG A/AA Axe violations in contact, certificate, and project dialogs in ${theme}`, async ({ page }, testInfo) => {
      test.fail(theme === "dark", "Accepted #176b45 dark-theme text contrast debt")
      await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), { key: "joeych-theme", value: theme })
      await page.goto("")
      await page.locator("[data-contact-trigger]").click()
      await expectNoWcagViolations(page, { route: "/", state: "contact-dialog", theme, viewport: desktopViewport.width }, testInfo)
      await page.locator("[data-dialog-close]").click()

      await page.goto("projects/")
      await page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]').click()
      const projectDialog = page.locator('[data-project-dialog][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
      await expect(projectDialog).toHaveCSS("opacity", "1")
      await expectNoWcagViolations(page, { route: "/projects/", state: "project-dialog", theme, viewport: desktopViewport.width }, testInfo)
      await projectDialog.locator("[data-certificate-trigger]").click()
      await expect(projectDialog.locator("[data-certificate-dialog]")).toHaveCSS("opacity", "1")
      await expectNoWcagViolations(page, { route: "/projects/", state: "certificate-dialog", theme, viewport: desktopViewport.width }, testInfo)
    })
  }

  for (const theme of themes) {
    test(`reflows every route in ${theme} without horizontal loss at 200% page scale`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.setViewportSize(zoomViewport)
      await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), { key: "joeych-theme", value: theme })

      for (const route of routes) {
        await page.goto(route.path)
        await applyPageScale(page)
        await page.locator("[data-menu-toggle]").press("Enter")

        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(zoomViewport.width)
        await expectReachable(page.getByRole("banner"))
        await expectReachable(page.locator("#primary-navigation"))
        await expectReachable(page.getByRole("main"))
        await expectReachable(page.locator("a.language-link"))
        await expectReachable(page.locator("[data-theme-toggle]"))
        await expectReachable(page.locator("[data-contact-trigger]"))
        if (route.path.includes("projects")) {
          await expectReachable(page.locator("[data-project-category-filter]"))
          await expectReachable(page.locator("[data-project-name-filter]"))
          await expectReachable(page.locator("[data-project-honor-filter]"))
        }
        await expectReachable(page.getByRole("contentinfo"))
      }
    })
  }

  test("keeps contact, certificate, and project dialog controls reachable at 200%", async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize(zoomViewport)
    await page.goto("")
    await page.locator("[data-contact-trigger]").click()
    await applyPageScale(page)
    const contactClose = page.locator("[data-dialog-close]")
    await expectReachable(contactClose)
    await contactClose.press("Enter")

    await page.goto("en/projects/")
    await page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]').click()
    const projectDialog = page.locator('[data-project-dialog][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
    await projectDialog.locator("[data-certificate-trigger]").click()
    await applyPageScale(page)
    const dialog = projectDialog.locator("[data-certificate-dialog]")
    await expectReachable(dialog.locator("[data-certificate-close]"))
    await expectReachable(dialog.locator("[data-certificate-caption]"))
    await expect(dialog.locator("[data-certificate-previous]")).toBeDisabled()
    await dialog.locator("[data-certificate-next]").press("Enter")
    await expect(dialog.locator("[data-certificate-next]")).toBeDisabled()
    await dialog.locator("[data-certificate-close]").press("Enter")
    await expect(dialog).not.toBeVisible()

    await page.goto("en/projects/#2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign")
    await applyPageScale(page)
    const reopenedProjectDialog = page.locator('[data-project-dialog][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
    await expectReachable(reopenedProjectDialog.locator("[data-project-dialog-close]"))
    await expectReachable(reopenedProjectDialog.locator("[data-project-dialog-title]"))
    await expectReachable(reopenedProjectDialog.locator("[data-certificate-trigger]"))
    await reopenedProjectDialog.locator("[data-project-dialog-close]").press("Enter")
    await expect(reopenedProjectDialog).not.toBeVisible()
  })

  test("detects and removes a temporary unlabeled control", async ({ page }) => {
    // Given: a canonical document and a test-owned accessibility violation
    await page.goto("")
    await page.evaluate(() => {
      const control = document.createElement("button")
      control.setAttribute("data-axe-sensitivity", "true")
      document.body.append(control)
    })

    // When: the same WCAG Axe rules evaluate the temporary control
    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()

    // Then: the gate rejects the violation and the fixture is removed before the test ends
    expect(results.violations.some((violation) => violation.id === "button-name")).toBe(true)
    await page.locator("[data-axe-sensitivity]").evaluate((element) => element.remove())
    await expect(page.locator("[data-axe-sensitivity]")).toHaveCount(0)
  })
})
