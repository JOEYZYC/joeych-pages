import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { getProfileData } from "../../src/lib/profile-data"
import { CANONICAL_ROUTES } from "./support/site-matrix"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

test.describe("unified chip readers", () => {
  test("keeps all eight canonical documents and every source-ordered project accessible", async ({ page }) => {
    const data = await getProfileData()
    for (const route of CANONICAL_ROUTES) {
      await page.goto(route.path)
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", route.canonical)
      await expect(page.locator("[data-shared-chip] svg")).toHaveCount(1)
      await expect(page.locator("[data-menu-toggle]")).toBeVisible()
      await expect(page.locator("#primary-navigation")).toBeHidden()
      await page.locator("[data-menu-toggle]").click()
      await expect(page.locator("[data-header-route]")).toHaveCount(4)
      await page.keyboard.press("Escape")
      await expect(page.locator("[data-menu-toggle]")).toBeFocused()
      if (route.path.includes("projects/")) {
        expect(await page.locator("[data-project-card]").evaluateAll(elements => elements.map(element => element.getAttribute("data-project-id")))).toEqual(data.projects.map(project => project.id))
        await expect(page.locator("[data-project-record]")).toHaveCount(20)
        await expect(page.locator("template[data-project-dialog-template]")).toHaveCount(20)
      }
    }
    for (const locale of ["zh", "en"] as const) {
      await page.goto(locale === "zh" ? "projects/" : "en/projects/")
      for (const project of data.projects) {
        await page.evaluate(id => { location.hash = id }, project.id)
        const dialog = page.locator("[data-project-dialog][open]")
        await expect(dialog.locator("[data-project-dialog-title]")).toHaveText(project.title[locale])
        await expect(dialog.locator("[data-project-dialog-title]")).toBeFocused()
        await expect(dialog.locator("[data-shared-chip] svg")).toHaveCount(1)
        await expect(dialog.locator(".project-record-contribution p")).toHaveText(project.contribution[locale])
        if (project.status) await expect(dialog.locator(".project-record-status")).toHaveText(project.status[locale])
      }
    }
  })

  for (const viewport of [{ width: 375, height: 667 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }]) test(`keeps reader content, toolbar and WCAG contrast usable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    test.setTimeout(60000)
    await page.setViewportSize(viewport)
    const evidence = []
    for (const theme of ["light", "dark"]) {
      await page.addInitScript(value => localStorage.setItem("joeych-theme", value), theme)
      for (const path of ["", "en/", "about/", "en/tech-stack/", "projects/#2026-Project-EFlyDroneLowCostModularDroneHardwarePlatform"]) {
        await page.goto(path)
        await page.evaluate(() => document.fonts.ready)
        if (path === "" || path === "en/") {
          for (let chapter = 0; chapter < 5; chapter++) {
            await page.locator(`[data-chapter="${chapter}"]`).focus()
            const badBounds = await page.locator(`[data-chapter="${chapter}"]`).evaluate(element => [...element.querySelectorAll("h1,h2,h3,p,a,figcaption,img")].flatMap(child => {
              if (!child.getClientRects().length || child.matches(".hero-art-link,.research-art-link")) return []
              const rect = child.getBoundingClientRect()
              return rect.top < -1 || rect.bottom > innerHeight - 55 || rect.left < -1 || rect.right > innerWidth + 1 ? [{ tag: child.tagName, text: child.textContent?.slice(0, 60), bounds: rect.toJSON() }] : []
            }))
            expect(badBounds, JSON.stringify({ path, theme, chapter, badBounds })).toEqual([])
          }
        }
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
        const projectDialog = page.locator("[data-project-dialog][open]")
        if (await projectDialog.count()) {
          await expect(projectDialog).toHaveCSS("opacity", "1")
          expect(await projectDialog.evaluate(element => Math.abs(element.getBoundingClientRect().width - innerWidth))).toBeLessThan(1)
          const close = projectDialog.locator("[data-project-dialog-close]")
          const before = await close.boundingBox()
          await projectDialog.locator("[data-project-dialog-content]").evaluate(element => { element.scrollTop = element.scrollHeight })
          const after = await close.boundingBox()
          expect(after?.y).toBeCloseTo(before?.y ?? 0, 0)
          await expect(close).toBeInViewport()
        }
        const axe = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
        evidence.push({ path, theme, violations: axe.violations })
        expect(axe.violations, JSON.stringify({ path, theme, violations: axe.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) })) })).toEqual([])
      }
    }
    await testInfo.attach("reader-axe-bounds.json", { body: JSON.stringify(evidence), contentType: "application/json" })
  })

  test("keeps the full record source readable without JS in both locales and themes", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Focused browser checks require a base URL")
    for (const colorScheme of ["light", "dark"] as const) {
      const context = await browser.newContext({ baseURL, javaScriptEnabled: false, colorScheme, viewport: { width: 375, height: 812 } })
      const page = await context.newPage()
      for (const path of ["projects/", "en/projects/"]) {
        await page.goto(path)
        await expect(page.locator("[data-project-record]")).toHaveCount(20)
        await expect(page.locator("[data-project-record]").last()).toBeVisible()
        await expect(page.locator("[data-noscript-header-routes] a")).toHaveCount(4)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
      }
      await context.close()
    }
  })
})
