import type { Locator } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { getProfileData } from "../../src/lib/profile-data"

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const

const pages = [
  { path: "", locale: "zh", heading: "张易成", counterpart: /\/en\/$/ },
  { path: "en/", locale: "en", heading: "JOEYCH", counterpart: /\/joeych-pages\/$/ },
  { path: "experience/", locale: "zh", heading: "个人经历", counterpart: /\/en\/experience\/$/ },
  { path: "en/experience/", locale: "en", heading: "Experience", counterpart: /\/experience\/$/ },
] as const

const homeRoutes = [
  { path: "", locale: "zh", name: "张易成", experienceAction: "查看经历", projectsAction: "探索项目" },
  { path: "en/", locale: "en", name: "JOEYCH", experienceAction: "View experience", projectsAction: "Explore projects" },
] as const

const experienceRoutes = [
  { path: "experience/", locale: "zh" },
  { path: "en/experience/", locale: "en" },
] as const

type ElementBox = { readonly x: number; readonly y: number; readonly width: number; readonly height: number }

async function box(locator: Locator): Promise<ElementBox> {
  const value = await locator.boundingBox()
  expect(value).not.toBeNull()
  return value as ElementBox
}

function expectAligned(left: number, right: number): void {
  expect(Math.abs(left - right)).toBeLessThanOrEqual(2)
}

test.describe("home and experience routes", () => {
  for (const route of pages) {
    test(`renders ${route.path || "root"} with its localized document shell`, async ({ page }) => {
      await page.goto(route.path)

      await expect(page.locator("html")).toHaveAttribute("lang", route.locale === "zh" ? "zh-CN" : "en")
      await expect(page.getByRole("main")).toBeVisible()
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toHaveCount(1)
      await expect(page.locator('[aria-current="page"]')).toHaveCount(1)
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="zh-CN"]')).toHaveCount(1)
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1)
      await expect(page.locator("a.language-link")).toHaveAttribute("href", route.counterpart)
    })
  }

  for (const route of homeRoutes) {
    test(`keeps ${route.locale} Home source order and responsive Bento geometry`, async ({ page }) => {
      const data = await getProfileData()

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto(route.path)
        await page.evaluate(async () => document.fonts.ready)

        const grid = page.locator("[data-home-grid]")
        const hero = grid.locator("[data-home-hero]")
        const portrait = grid.locator("[data-home-portrait]")
        const facts = grid.locator("[data-home-facts]")
        const education = grid.locator("[data-home-education]")
        const tiles = grid.locator("[data-project-tile]")

        expect(await grid.locator(":scope > *").evaluateAll((elements) => elements.map((element) => {
          if (element.matches("[data-home-hero]")) return "hero"
          if (element.matches("[data-home-portrait]")) return "portrait"
          if (element.matches("[data-home-facts]")) return "facts"
          if (element.matches("[data-home-education]")) return "education"
          return element.className
        }))).toEqual(["hero", "portrait", "facts", "education", "home-featured"])
        await expect(hero.getByRole("heading", { level: 1, name: route.name })).toBeVisible()
        await expect(hero.getByRole("link", { name: route.experienceAction })).toBeVisible()
        await expect(hero.getByRole("link", { name: route.projectsAction })).toBeVisible()
        await expect(portrait.getByRole("img", { name: route.name })).toHaveCSS("object-fit", "contain")
        await expect(facts.locator("dl > div")).toHaveCount(4)
        await expect(education).toHaveAttribute("id", `education-${data.profile.education[0]?.id}`)
        await expect(tiles).toHaveCount(3)
        expect(await tiles.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-project-id")))).toEqual([
          "power-print-recognition",
          "dual-light-fusion",
          "resgatnet",
        ])
        await expect(tiles.first()).toHaveCSS("display", "grid")
        const arrowBox = await box(tiles.first().locator(".project-tile-arrow svg"))
        expect(arrowBox.width).toBeLessThanOrEqual(24)
        expect(arrowBox.height).toBeLessThanOrEqual(24)
        const firstMediaBox = await box(tiles.first().locator(".project-media"))
        const firstBodyBox = await box(tiles.first().locator(".project-tile-body"))
        expectAligned(firstMediaBox.y + firstMediaBox.height, firstBodyBox.y)

        const heroBox = await box(hero)
        const portraitBox = await box(portrait)
        const factsBox = await box(facts)
        const educationBox = await box(education)
        const firstTileBox = await box(tiles.first())

        if (viewport.name === "mobile") {
          expectAligned(heroBox.x, portraitBox.x)
          expectAligned(heroBox.width, portraitBox.width)
          expectAligned(heroBox.width, factsBox.width)
          expectAligned(heroBox.width, educationBox.width)
          expect(heroBox.y).toBeLessThan(portraitBox.y)
          expect(portraitBox.y).toBeLessThan(factsBox.y)
          expect(factsBox.y).toBeLessThan(educationBox.y)
          expect(educationBox.y).toBeLessThan(firstTileBox.y)
        } else {
          expectAligned(heroBox.y, portraitBox.y)
          expectAligned(factsBox.y, educationBox.y)
          expect(heroBox.x).toBeLessThan(portraitBox.x)
          expect(factsBox.x).toBeLessThan(educationBox.x)
          expect(heroBox.width).toBeGreaterThan(portraitBox.width)
          if (viewport.name === "tablet") expect(educationBox.width).toBeGreaterThan(factsBox.width)
          if (viewport.name === "desktop") expect(factsBox.width).toBeGreaterThan(educationBox.width)
        }

        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }

  for (const route of experienceRoutes) {
    test(`keeps ${route.locale} Experience source order and campus spans`, async ({ page }) => {
      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto(route.path)
        const records = page.locator("[data-experience-record]")

        await expect(records).toHaveCount(5)
        expect(await records.evaluateAll((elements) => elements.map((element) => ({
          id: element.id,
          kind: element.getAttribute("data-experience-kind"),
        })))).toEqual([
          { id: "education-suzhou-institute-of-technology", kind: "education" },
          { id: "campus-aeromodelling-club", kind: "campus" },
          { id: "campus-media-center", kind: "campus" },
          { id: "campus-party-branch", kind: "campus" },
          { id: "campus-class-officer", kind: "campus" },
        ])

        const boxes = await Promise.all(await records.all().then((items) => items.map(box)))
        if (viewport.name === "mobile") {
          const [firstBox, ...remainingBoxes] = boxes
          if (firstBox === undefined) throw new Error("Expected at least one Experience record")
          for (const current of remainingBoxes) expectAligned(current.width, firstBox.width)
          for (let index = 1; index < boxes.length; index += 1) expect(boxes[index - 1]?.y).toBeLessThan(boxes[index]?.y ?? 0)
        } else {
          expectAligned(boxes[1]?.y ?? 0, boxes[2]?.y ?? 0)
          expectAligned(boxes[3]?.y ?? 0, boxes[4]?.y ?? 0)
          expect(boxes[1]?.width ?? 0).toBeLessThan(boxes[2]?.width ?? 0)
          expect(boxes[3]?.width ?? 0).toBeGreaterThan(boxes[4]?.width ?? 0)
        }

        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }
})
