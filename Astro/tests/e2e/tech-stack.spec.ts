import { expect, test } from "@playwright/test"

import { getProfileData } from "../../src/lib/profile-data"

import { VIEWPORTS } from "./support/site-matrix"

const routes = [
  { locale: "zh", path: "tech-stack/", language: "zh-CN" },
  { locale: "en", path: "en/tech-stack/", language: "en" },
] as const

test.describe("evidence-backed capability ledger", () => {
  for (const route of routes) {
    test(`renders every ${route.locale} capability with its actual evidence`, async ({ page }) => {
      const { techStack } = await getProfileData()
      const capabilities = techStack.skills.flatMap(({ tags }) => tags)

      await page.goto(route.path)

      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(techStack.page.title[route.locale])
      await expect(page.locator(".intro")).toBeVisible()
      await expect(page.locator("[data-capability-tree]")).toBeVisible()
      await expect(page.locator(".intro > p:not(.eyebrow)")).toHaveText(techStack.map.center[route.locale])
      await expect(page.locator("[data-capability-branch]")).toHaveCount(techStack.skills.length)
      await expect(page.locator("[data-capability-leaf]")).toHaveCount(capabilities.length)
      await expect(page.locator(".skill-evidence")).toHaveCount(capabilities.length)

      for (const group of techStack.skills) {
        const branch = page.locator(`[data-capability-branch="${group.id}"]`)
        await expect(branch.getByRole("heading", { level: 2 })).toHaveText(group.title[route.locale])
        expect(await branch.locator("[data-capability-leaf]").evaluateAll(
          (leaves) => leaves.map((leaf) => leaf.getAttribute("data-capability-leaf")),
        )).toEqual(group.tags.map(({ id }) => id))

        for (const tag of group.tags) {
          const leaf = branch.locator(`[data-capability-leaf="${tag.id}"]`)
          await expect(leaf.getByRole("heading", { level: 3 })).toHaveText(tag[route.locale])
          await expect(leaf.locator(".skill-description")).toHaveText(tag.description[route.locale])
          await expect(leaf.locator("[data-skill-evidence-type]")).toHaveCount(tag.evidence.length)
          for (const evidence of tag.evidence) {
            if (evidence.type === "project") {
              await expect(leaf.locator(`a[href$="?skill=${tag.id}#${evidence.project_id}"]`)).toBeVisible()
            } else if (evidence.type === "general-ability") {
              await expect(leaf.locator(`[data-skill-level="${evidence.level}"]`)).toBeVisible()
            }
          }
        }
      }
    })
  }

  for (const route of routes) {
    test(`opens exact ${route.locale} project evidence and retains its skill origin`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(route.path)

      const link = page.locator('.skill-evidence a').first()
      const href = await link.getAttribute("href")
      await link.click()
      await expect(page).toHaveURL(new RegExp(`\\?skill=cst-microwave-antenna#${href?.split("#")[1]}`))
      await expect(page.locator("[data-project-dialog]")).toBeVisible()
      await expect(page.locator("[data-project-dialog]")).toHaveAttribute("data-evidence-origin", "true")
      await expect(page.locator("[data-project-dialog] [data-project-origin-label]")).toContainText(route.locale === "zh" ? "电磁仿真" : "Electromagnetic Simulation")
    })
  }

  test("remains visible without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4321/joeych-pages/",
      javaScriptEnabled: false,
    })
    const page = await context.newPage()

    await page.goto("tech-stack/")

    await expect(page.locator("[data-capability-tree]")).toBeVisible()
    await expect(page.locator("[data-capability-leaf]")).toHaveCount(9)
    await context.close()
  })

  for (const viewport of VIEWPORTS) {
    test(`reflows the bilingual capability tree at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      for (const route of routes) {
        await page.goto(route.path)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }
})
