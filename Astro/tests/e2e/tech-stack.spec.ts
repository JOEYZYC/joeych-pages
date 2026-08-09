import { expect, test } from "@playwright/test"

import { UI } from "../../src/i18n/ui"
import { getProfileData } from "../../src/lib/profile-data"
import { getRoutePath } from "../../src/lib/routes"

const routes = [
  { locale: "zh", path: "tech-stack/", language: "zh-CN" },
  { locale: "en", path: "en/tech-stack/", language: "en" },
] as const

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const

test.describe("tech stack", () => {
  for (const route of routes) {
    test(`renders canonical ${route.locale} skill evidence and exact project destinations`, async ({ page }) => {
      const data = await getProfileData()
      const projectTitles = new Map(data.projects.map((project) => [project.id, project.title[route.locale]]))

      await page.goto(route.path)

      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page.locator('[aria-current="page"]')).toHaveText(
        route.locale === "zh" ? "技术栈" : "Tech Stack",
      )
      expect(await page.locator("[data-skill-group]").evaluateAll(
        (groups) => groups.map((group) => group.getAttribute("data-skill-group")),
      )).toEqual(data.profile.skills.map((group) => group.id))

      for (const group of data.profile.skills) {
        const groupLocator = page.locator(`[data-skill-group="${group.id}"]`)
        await expect(groupLocator.getByRole("heading", { level: 2 })).toHaveText(group.title[route.locale])
        expect(await groupLocator.locator("[data-skill-tag]").evaluateAll(
          (tags) => tags.map((tag) => tag.getAttribute("data-skill-tag")),
        )).toEqual(group.tags.map((tag) => tag.id))

        for (const tag of group.tags) {
          const tagLocator = groupLocator.locator(`[data-skill-tag="${tag.id}"]`)
          await expect(tagLocator.getByRole("heading", { level: 3 })).toHaveText(tag[route.locale])
          expect(await tagLocator.locator("[data-skill-component]").evaluateAll(
            (components) => components.map((component) => component.getAttribute("data-skill-component")),
          )).toEqual(tag.components.map((component) => component.id))
          await expect(tagLocator.locator("[data-skill-evidence]")).toHaveCount(tag.evidence.length)

          for (const evidence of tag.evidence) {
            const projectIdentity = evidence.type === "project"
              ? `[data-project-id="${evidence.project_id}"]`
              : ""
            const evidenceLocator = tagLocator.locator(
              `[data-skill-evidence="${evidence.type}"][data-supports="${evidence.supports.join(" ")}"]${projectIdentity}`,
            )
            await expect(evidenceLocator).toHaveCount(1)

            if (evidence.type === "project") {
              const expectedTitle = projectTitles.get(evidence.project_id)
              expect(expectedTitle).toBeDefined()
              await expect(evidenceLocator.locator(".skill-evidence-type")).toHaveText(UI[route.locale].evidence.project)
              await expect(evidenceLocator.getByRole("link")).toHaveText(expectedTitle ?? "")
              await expect(evidenceLocator.getByRole("link")).toHaveAttribute(
                "href",
                `${getRoutePath("projects", route.locale, "/joeych-pages/")}?skill=${encodeURIComponent(tag.id)}#${evidence.project_id}`,
              )
            }
            if (evidence.type === "credential") {
              await expect(evidenceLocator).toContainText(UI[route.locale].evidence.credential)
            }
            if (evidence.type === "general-ability") {
              await expect(evidenceLocator).toHaveAttribute("data-evidence-level", evidence.level)
              await expect(evidenceLocator).toContainText(UI[route.locale].evidence.levels[evidence.level])
            }
          }
        }
      }
    })
  }

  test("following a project evidence link reaches the record with visible provenance", async ({ page }) => {
    await page.goto("en/tech-stack/")
    const evidence = page.locator('[data-skill-tag="vision-halcon-opencv"] [data-project-id="intelligent-reconnaissance-2024"]')

    await evidence.getByRole("link").click()

    await expect(page).toHaveURL(
      /\/en\/projects\/\?skill=vision-halcon-opencv#intelligent-reconnaissance-2024$/,
    )
    await expect(page.locator("#intelligent-reconnaissance-2024")).toHaveAttribute(
      "data-evidence-origin",
      "true",
    )
    await expect(page.locator("#intelligent-reconnaissance-2024 [data-project-origin-label]")).toHaveText(
      "From skill evidence: Halcon / OpenCV image processing & vision",
    )
  })

  test("JavaScript-disabled evidence links still resolve their stable project hash", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4321/joeych-pages/",
      javaScriptEnabled: false,
    })
    const page = await context.newPage()
    await page.goto("en/tech-stack/")

    await page.locator('[data-skill-evidence="project"] a').first().click()

    await expect(page).toHaveURL(/\/en\/projects\/\?skill=[^#]+#[a-z0-9-]+$/)
    const hash = await page.evaluate(() => window.location.hash)
    await expect(page.locator(hash)).toBeVisible()
    await expect(page.locator(`${hash} [data-project-current-label]`)).toBeVisible()

    await context.close()
  })

  for (const viewport of viewports) {
    test(`reflows the bilingual evidence ledger at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      for (const route of routes) {
        await page.goto(route.path)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }
})
