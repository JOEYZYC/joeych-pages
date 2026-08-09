import AxeBuilder from "@axe-core/playwright"
import type { Locator, Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
const mobileViewport = { width: 375, height: 812 }
const desktopViewport = { width: 1280, height: 900 }
const zoomViewport = { width: 640, height: 450 }
const themes = ["light", "dark"] as const
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

async function expectNoWcagViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
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
  for (const viewport of [mobileViewport, desktopViewport]) {
    for (const theme of themes) {
      test(`has no WCAG A/AA Axe violations on all routes in ${theme} at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), { key: "joeych-theme", value: theme })

        for (const route of routes) {
          await page.goto(route.path)
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
          await expectNoWcagViolations(page)
        }
      })
    }
  }

  for (const theme of themes) {
    test(`has no WCAG A/AA Axe violations in contact and certificate dialogs in ${theme}`, async ({ page }) => {
      await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), { key: "joeych-theme", value: theme })
      await page.goto("")
      await page.locator("[data-contact-trigger]").click()
      await expectNoWcagViolations(page)
      await page.locator("[data-dialog-close]").click()

      await page.goto("awards/")
      await page.locator("#awards-award-renesas-east-first-national-third-2024-trigger").click()
      await expectNoWcagViolations(page)
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
          await expectReachable(page.locator("[data-project-tag-filter]"))
          await expectReachable(page.locator("[data-project-navigator]"))
        }
        await expectReachable(page.getByRole("contentinfo"))
      }
    })
  }

  test("keeps contact and certificate close controls, captions, and boundaries reachable at 200%", async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize(zoomViewport)
    await page.goto("")
    await page.locator("[data-contact-trigger]").click()
    await applyPageScale(page)
    const contactClose = page.locator("[data-dialog-close]")
    await expectReachable(contactClose)
    await contactClose.press("Enter")

    await page.goto("en/awards/")
    await page.locator("#awards-award-renesas-east-first-national-third-2024-trigger").click()
    await applyPageScale(page)
    const dialog = page.locator("#awards-award-renesas-east-first-national-third-2024-dialog")
    await expectReachable(dialog.locator("[data-certificate-close]"))
    await expectReachable(dialog.locator("[data-certificate-caption]"))
    await expect(dialog.locator("[data-certificate-previous]")).toBeDisabled()
    await dialog.locator("[data-certificate-next]").press("Enter")
    await expect(dialog.locator("[data-certificate-next]")).toBeDisabled()
    await dialog.locator("[data-certificate-close]").press("Enter")
    await expect(dialog).not.toBeVisible()
  })
})
