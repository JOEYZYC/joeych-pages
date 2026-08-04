import { expect, test } from "@playwright/test"

import { UI } from "../../src/i18n/ui"
import { getProfileData } from "../../src/lib/profile-data"

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
    test(`renders canonical ${route.locale} skill evidence in source order`, async ({ page }) => {
      // Given: the canonical Profile skill and project records
      const data = await getProfileData()

      // When: the locale-specific Tech Stack route renders
      await page.goto(route.path)

      // Then: its shell, locale, and evidence hierarchy retain Profile ordering
      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page.locator('[aria-current="page"]')).toHaveText(
        route.locale === "zh" ? "技术栈" : "Tech Stack",
      )
      await expect(page.locator(`a[hreflang="${route.locale === "zh" ? "en" : "zh"}"]`)).toBeVisible()

      expect(await page.locator("[data-skill-group]").evaluateAll(
        (groups) => groups.map((group) => group.getAttribute("data-skill-group")),
      )).toEqual(data.profile.skills.map((group) => group.id))

      for (const group of data.profile.skills) {
        const groupLocator = page.locator(`[data-skill-group="${group.id}"]`)
        await expect(groupLocator.getByRole("heading", { level: 2 })).toHaveText(
          group.title[route.locale],
        )
        expect(await groupLocator.locator("[data-skill-tag]").evaluateAll(
          (tags) => tags.map((tag) => tag.getAttribute("data-skill-tag")),
        )).toEqual(group.tags.map((tag) => tag.id))

        for (const tag of group.tags) {
          const tagLocator = groupLocator.locator(`[data-skill-tag="${tag.id}"]`)
          await expect(tagLocator.getByRole("heading", { level: 3 })).toHaveText(
            tag[route.locale],
          )
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
              await expect(evidenceLocator.getByRole("link")).toHaveAttribute(
                "href",
                new RegExp(`/projects/#${evidence.project_id}$`),
              )
            }
            if (evidence.type === "general-ability") {
              await expect(evidenceLocator).toHaveAttribute("data-evidence-level", evidence.level)
              await expect(evidenceLocator).toContainText(
                UI[route.locale].evidence.levels[evidence.level],
              )
            }
          }
        }
      }
    })
  }

  for (const viewport of viewports) {
    test(`reflows the bilingual evidence ledger at ${viewport.name}`, async ({ page }) => {
      // Given: each required review viewport
      await page.setViewportSize(viewport)

      // When: both locale routes receive their longest source-backed labels
      for (const route of routes) {
        await page.goto(route.path)

        // Then: no document-level horizontal overflow is introduced
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        expect(documentWidth).toBeLessThanOrEqual(viewport.width)
      }
    })
  }
})
