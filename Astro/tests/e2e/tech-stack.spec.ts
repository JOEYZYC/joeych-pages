import type { Locator } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { UI } from "../../src/i18n/ui"
import { getProfileData } from "../../src/lib/profile-data"
import { getRoutePath } from "../../src/lib/routes"

import { VIEWPORTS } from "./support/site-matrix"

const routes = [
  { locale: "zh", path: "tech-stack/", language: "zh-CN" },
  { locale: "en", path: "en/tech-stack/", language: "en" },
] as const

const viewports = VIEWPORTS

async function phraseLineCount(locator: Locator, phrase: string): Promise<number> {
  return locator.evaluate((element, expectedPhrase) => {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let text = ""
    let node = walker.nextNode()

    while (node) {
      if (node instanceof Text) {
        textNodes.push(node)
        text += node.data
      }
      node = walker.nextNode()
    }

    const start = text.indexOf(expectedPhrase)
    if (start === -1) return 0

    let offset = 0
    const range = document.createRange()
    for (const textNode of textNodes) {
      const nextOffset = offset + textNode.length
      if (start >= offset && start < nextOffset) range.setStart(textNode, start - offset)
      if (start + expectedPhrase.length > offset && start + expectedPhrase.length <= nextOffset) {
        range.setEnd(textNode, start + expectedPhrase.length - offset)
        break
      }
      offset = nextOffset
    }

    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size
  }, phrase)
}

test.describe("tech stack", () => {
  for (const route of routes) {
    test(`renders canonical ${route.locale} skill evidence and exact project destinations`, async ({ page }) => {
      const data = await getProfileData()
      const projectTitles = new Map(data.projects.map((project) => [project.id, project.title[route.locale]]))

      await page.goto(route.path)

      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
      await expect(page.locator(".intro > p:not(.eyebrow)")).toHaveText(data.techStack.page.summary[route.locale])
      await expect(page.locator('[aria-current="page"]')).toHaveText(
        route.locale === "zh" ? "技术栈" : "Tech Stack",
      )
      expect(await page.locator("[data-skill-group]").evaluateAll(
        (groups) => groups.map((group) => group.getAttribute("data-skill-group")),
      )).toEqual(data.techStack.skills.map((group) => group.id))

      for (const group of data.techStack.skills) {
        const groupLocator = page.locator(`[data-skill-group="${group.id}"]`)
        await expect(groupLocator.getByRole("heading", { level: 2 })).toHaveText(group.title[route.locale])
        await expect(groupLocator.locator(".skill-group-heading > svg[data-icon=\"microchip\"]")).toHaveCount(1)
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
              await expect(evidenceLocator.locator('.skill-evidence-type > svg[data-icon="link"]')).toHaveCount(1)
              await expect(evidenceLocator.getByRole("link")).toHaveText(expectedTitle ?? "")
              await expect(evidenceLocator.getByRole("link")).toHaveAttribute(
                "href",
                `${getRoutePath("projects", route.locale, "/joeych-pages/")}?skill=${encodeURIComponent(tag.id)}#${evidence.project_id}`,
              )
            }
            if (evidence.type === "credential") {
              await expect(evidenceLocator).toContainText(UI[route.locale].evidence.credential)
              await expect(evidenceLocator.locator('.skill-evidence-type > svg[data-icon="file-lines"]')).toHaveCount(1)
            }
            if (evidence.type === "general-ability") {
              await expect(evidenceLocator).toHaveAttribute("data-evidence-level", evidence.level)
              await expect(evidenceLocator).toContainText(UI[route.locale].evidence.levels[evidence.level])
              await expect(evidenceLocator.locator('.skill-evidence-type > svg[data-icon="file-lines"]')).toHaveCount(1)
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
    const dialog = page.locator('[data-project-dialog][data-project-id="intelligent-reconnaissance-2024"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute(
      "data-evidence-origin",
      "true",
    )
    await expect(page.locator("[data-project-name-filter]")).toHaveValue("intelligent-reconnaissance-2024")
    await expect(dialog.locator("[data-project-origin-label]")).toHaveText(
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

  for (const theme of ["light", "dark"] as const) {
    test(`keeps Chinese semantic phrases and labels intact at 375px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("joeych-theme", selectedTheme)
      }, theme)
      await page.goto("tech-stack/")
      const data = await getProfileData()

      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      await expect(page.locator(".intro > p:not(.eyebrow)")).toHaveText(
        data.techStack.page.summary.zh,
      )
      await expect(page.getByRole("heading", { level: 3, name: /焊接调试/ })).toHaveCount(1)
      expect(await phraseLineCount(page.locator(".intro > p:not(.eyebrow)"), "项目证据")).toBe(1)
      expect(await phraseLineCount(page.getByRole("heading", { level: 3, name: /焊接调试/ }), "焊接调试")).toBe(1)
      expect(await page.locator(".skill-evidence-type > span").evaluateAll((labels) => labels.every((label) => {
        const range = document.createRange()
        range.selectNodeContents(label)
        return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size === 1
      }))).toBe(true)
      expect(await page.locator(".skill-evidence-type > span").evaluateAll((labels) => labels.every((label) => {
        const { left, right } = label.getBoundingClientRect()
        return left >= 0 && right <= window.innerWidth
      }))).toBe(true)
    })
  }

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
