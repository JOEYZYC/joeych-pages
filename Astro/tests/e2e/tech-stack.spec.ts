import { expect, test } from "@playwright/test"

import { getProfileData } from "../../src/lib/profile-data"

import { VIEWPORTS } from "./support/site-matrix"

const routes = [
  { locale: "zh", path: "tech-stack/", language: "zh-CN" },
  { locale: "en", path: "en/tech-stack/", language: "en" },
] as const

test.describe("tech stack capability tree", () => {
  for (const route of routes) {
    test(`renders the complete ${route.locale} bottom-up capability tree`, async ({ page }) => {
      const { techStack } = await getProfileData()
      const capabilities = techStack.skills.flatMap(({ tags }) => tags)

      await page.goto(route.path)

      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(techStack.page.title[route.locale])
      await expect(page.locator(".intro")).toHaveCount(0)
      await expect(page.locator("[data-capability-tree]")).toBeVisible()
      await expect(page.locator(".capability-tree-label")).toHaveText(techStack.map.title[route.locale])
      await expect(page.locator(".capability-tree-root")).toHaveText(techStack.map.center[route.locale])
      await expect(page.locator("[data-capability-branch]")).toHaveCount(techStack.skills.length)
      await expect(page.locator("[data-capability-leaf]")).toHaveCount(capabilities.length)
      await expect(page.locator(".tech-stack-ledger, .skill-evidence, .skill-components")).toHaveCount(0)

      for (const group of techStack.skills) {
        const branch = page.locator(`[data-capability-branch="${group.id}"]`)
        await expect(branch.locator(".capability-tree-branch-node")).toHaveText(group.title[route.locale])
        expect(await branch.locator("[data-capability-leaf]").evaluateAll(
          (leaves) => leaves.map((leaf) => leaf.getAttribute("data-capability-leaf")),
        )).toEqual(group.tags.map(({ id }) => id))

        for (const tag of group.tags) {
          const leaf = branch.locator(`[data-capability-leaf="${tag.id}"]`)
          await expect(leaf.getByRole("heading", { level: 2 })).toHaveText(tag[route.locale])
          await expect(leaf.locator("p")).toHaveText(tag.description[route.locale])
        }
      }
    })
  }

  for (const route of routes) {
    test(`places ${route.locale} leaves above branches and the root at the bottom`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(route.path)

      expect(await page.locator("[data-capability-tree]").evaluate((tree) => {
        const root = tree.querySelector<HTMLElement>(".capability-tree-root")
        const branches = [...tree.querySelectorAll<HTMLElement>("[data-capability-branch]")]
        if (!root || branches.length === 0) return false
        const rootTop = root.getBoundingClientRect().top

        return branches.every((branch) => {
          const branchNode = branch.querySelector<HTMLElement>(".capability-tree-branch-node")
          const leaves = [...branch.querySelectorAll<HTMLElement>("[data-capability-leaf]")]
          if (!branchNode || leaves.length === 0) return false
          const branchRect = branchNode.getBoundingClientRect()
          return branchRect.bottom < rootTop
            && leaves.every((leaf) => leaf.getBoundingClientRect().bottom < branchRect.top)
        })
      })).toBe(true)
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
