import AxeBuilder from "@axe-core/playwright"
import type { Locator, Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
const mobileViewport = { width: 375, height: 812 }
const desktopViewport = { width: 1280, height: 900 }
const zoomViewport = { width: 640, height: 450 }
const routes = [
  { path: "", label: "Chinese home" },
  { path: "en/", label: "English home" },
  { path: "experience/", label: "Chinese experience" },
  { path: "en/experience/", label: "English experience" },
  { path: "awards/", label: "Chinese awards" },
  { path: "en/awards/", label: "English awards" },
  { path: "projects/", label: "Chinese projects" },
  { path: "en/projects/", label: "English projects" },
  { path: "tech-stack/", label: "Chinese tech stack" },
  { path: "en/tech-stack/", label: "English tech stack" },
] as const

function formatViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string {
  return violations
    .map((violation) => `${violation.id} (${violation.impact ?? "unknown"}): ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)
    .join("\n")
}

async function expectNoWcagViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  expect(results.violations, formatViolations(results.violations)).toEqual([])
}

async function applyPageScale(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page)
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 })
}

async function expectReachable(control: Locator): Promise<void> {
  await control.scrollIntoViewIfNeeded()
  await expect(control).toBeVisible()
  await expect(control).toBeInViewport()
}

test.describe("WCAG accessibility and 200% reflow", () => {
  for (const viewport of [mobileViewport, desktopViewport]) {
    for (const route of routes) {
      test(`has no WCAG A/AA Axe violations on ${route.label} at ${viewport.width}px`, async ({ page }) => {
        // Given: an approved route at a supported viewport
        await page.setViewportSize(viewport)
        await page.goto(route.path)

        // When: Axe evaluates the complete rendered document
        await expectNoWcagViolations(page)

        // Then: every WCAG A/AA rule passes with rule and target details on failure
      })
    }
  }

  test("has no WCAG A/AA Axe violations with the home contact dialog open", async ({ page }) => {
    // Given: the Chinese home contact trigger
    await page.goto("")
    await page.locator("[data-contact-dialog-root] [aria-haspopup='dialog']").click()

    // When: Axe evaluates the open native dialog
    await expectNoWcagViolations(page)

    // Then: the dialog state has no WCAG A/AA violations
  })

  test("has no WCAG A/AA Axe violations with an awards certificate dialog open", async ({ page }) => {
    // Given: an awards certificate trigger
    await page.goto("awards/")
    await page.locator("#awards-award-renesas-east-first-national-third-2024-trigger").click()

    // When: Axe evaluates the open certificate dialog
    await expectNoWcagViolations(page)

    // Then: the dialog state has no WCAG A/AA violations
  })

  for (const route of routes) {
    test(`reflows ${route.label} without horizontal overflow at 200% page scale`, async ({ page }) => {
      // Given: a stable Chrome viewport at 200% page scale
      await page.setViewportSize(zoomViewport)
      await page.goto(route.path)
      await page.locator("[data-menu-toggle]").click()
      await applyPageScale(page)

      // When: every shell landmark and control is brought into the visual viewport
      const header = page.getByRole("banner")
      const navigation = page.getByRole("navigation")
      const main = page.getByRole("main")
      const footer = page.getByRole("contentinfo")
      const language = page.locator("a.language-link")
      const contact = page.locator("[data-contact-dialog-root] [aria-haspopup='dialog']")

      // Then: the page reflows and its essential shell remains reachable
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(zoomViewport.width)
      await expectReachable(header)
      await expectReachable(navigation)
      await expectReachable(main)
      await expectReachable(language)
      await expectReachable(contact)
      await expectReachable(footer)
    })
  }

  test("keeps contact and certificate close controls reachable at 200% page scale", async ({ page }) => {
    // Given: the home contact and awards certificate dialogs at 200% page scale
    await page.setViewportSize(zoomViewport)
    await page.goto("")
    await page.locator("[data-contact-dialog-root] [aria-haspopup='dialog']").click()
    await applyPageScale(page)
    const contactClose = page.locator("[data-dialog-close]")

    // When: each dialog close control is used
    await expectReachable(contactClose)
    await contactClose.press("Enter")
    await page.goto("awards/")
    await page.locator("#awards-award-renesas-east-first-national-third-2024-trigger").click()
    await applyPageScale(page)
    const certificateClose = page.locator("#awards-award-renesas-east-first-national-third-2024-dialog [data-certificate-close]")

    // Then: both close controls remain visible and operable
    await expectReachable(certificateClose)
    await certificateClose.press("Enter")
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })
})
