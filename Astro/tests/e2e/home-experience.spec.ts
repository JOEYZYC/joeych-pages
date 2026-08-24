import type { Locator } from "@playwright/test"
import { expect, test } from "@playwright/test"

import { VIEWPORTS } from "./support/site-matrix"

const viewports = VIEWPORTS

const pages = [
  { path: "", locale: "zh", heading: "你好，我叫张易成", counterpart: /\/en\/$/ },
  { path: "en/", locale: "en", heading: "Hi, I'm Joey.", counterpart: /\/joeych-pages\/$/ },
  { path: "experience/", locale: "zh", heading: "个人经历", counterpart: /\/en\/experience\/$/ },
  { path: "en/experience/", locale: "en", heading: "Experience", counterpart: /\/experience\/$/ },
] as const

const homeRoutes = [
  {
    path: "",
    locale: "zh",
    heading: "你好，我叫张易成",
    portraitName: "张易成",
    summary: "我是一名电子信息工程专业学生，关注嵌入式系统、无线感知与智能硬件。我喜欢把想法落实为可以运行、可以验证的软硬件作品。",
    experienceAction: "查看经历",
    projectsAction: "探索项目",
  },
  {
    path: "en/",
    locale: "en",
    heading: "Hi, I'm Joey.",
    portraitName: "JOEYCH",
    summary: "I study Electronic & Information Engineering, with interests in embedded systems, wireless perception, and intelligent hardware. I enjoy turning ideas into practical hardware-software projects.",
    experienceAction: "View experience",
    projectsAction: "Explore projects",
  },
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
    test(`keeps ${route.locale} Home actions without duplicate preview sections`, async ({ page }) => {
      // Given: the localized Home document
      await page.goto(route.path)

      // When: the Home composition is inspected
      const home = page.locator("[data-home-grid]")

      // Then: the two route actions remain and removed preview sections leave no empty wrappers
      const actionIcons = home.locator(".home-action svg[data-icon='arrow-right']")
      await expect(actionIcons).toHaveCount(2)
      for (const actionIcon of await actionIcons.all()) {
        const actionIconBox = await box(actionIcon)
        expect(actionIconBox.width).toBeGreaterThan(0)
        expect(actionIconBox.height).toBeGreaterThan(0)
      }
      await expect(home.locator("[data-home-facts], [data-home-education], .home-featured")).toHaveCount(0)
    })

    test(`switches ${route.locale} Home artwork with the explicit theme`, async ({ page }) => {
      await page.goto(route.path)
      const root = page.locator("html")
      const background = page.locator(".home-background")

      await root.evaluate((element) => element.setAttribute("data-theme", "light"))
      await expect(background).toHaveCSS("background-image", /hero-circuit-background-light\.png/)

      await root.evaluate((element) => element.setAttribute("data-theme", "dark"))
      await expect(background).toHaveCSS("background-image", /hero-circuit-background\.png/)
    })

    test(`keeps ${route.locale} Home source order and responsive layered hero geometry`, async ({ page }) => {
      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto(route.path)
        await page.evaluate(async () => document.fonts.ready)

        const hero = page.locator("[data-home-grid][data-home-hero]")
        const copy = hero.locator("[data-home-copy]")
        const portrait = hero.locator("[data-home-portrait]")
        const portraitImage = portrait.getByRole("img", { name: route.portraitName })
        const background = hero.locator(".home-background")

        expect(await hero.evaluate((element) => [...element.children].map((child) => {
          if (child.matches("[data-home-copy]")) return "copy"
          if (child.matches("[data-home-portrait]")) return "portrait"
          if (child.matches(".home-background")) return "background"
          return child.className
        }))).toEqual(["copy", "portrait", "background"])
        await expect(copy.getByRole("heading", { level: 1, name: route.heading })).toBeVisible()
        await expect(copy.locator(".home-summary")).toHaveText(route.summary)
        await expect(copy.getByRole("link", { name: route.experienceAction })).toHaveAttribute(
          "href",
          `/joeych-pages/${route.locale === "en" ? "en/" : ""}experience/`,
        )
        await expect(copy.getByRole("link", { name: route.projectsAction })).toHaveAttribute(
          "href",
          `/joeych-pages/${route.locale === "en" ? "en/" : ""}projects/`,
        )
        await expect(portraitImage).toHaveCSS("object-fit", "contain")
        await expect(background).toHaveAttribute("aria-hidden", "true")
        await expect(background).toHaveCSS("background-size", "cover")

        const heroBox = await box(hero)
        const copyBox = await box(copy)
        const portraitBox = await box(portrait)
        const portraitImageBox = await box(portraitImage)

        if (viewport.name === "mobile") {
          expect(copyBox.y).toBeLessThan(portraitBox.y)
        } else {
          expect(copyBox.x).toBeLessThan(portraitBox.x)
        }
        expectAligned(portraitImageBox.y + portraitImageBox.height, heroBox.y + heroBox.height)

        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }

  for (const route of experienceRoutes) {
    test(`uses the approved ${route.locale} Experience summary and section-level chronology orientation`, async ({ page }) => {
      // Given: the localized Experience document
      await page.goto(route.path)

      // When: the route introduction and chronology headings are inspected
      const headings = page.locator("[data-experience-heading]")

      // Then: the UI-owned summary and restrained section icon clarify the source-backed chronology
      await expect(page.locator(".intro > p").last()).toHaveText(
        route.locale === "zh"
          ? "按时间查看教育经历与校园实践。"
          : "Review education and campus experience in chronological order.",
      )
      await expect(headings).toHaveCount(2)
      await expect(headings.locator("svg[data-icon='graduation-cap']")).toHaveCount(1)
      await expect(page.locator("[data-experience-record] svg")).toHaveCount(0)
    })

    test(`keeps ${route.locale} Experience source order and campus spans`, async ({ page }) => {
      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto(route.path)
        const records = page.locator("[data-experience-record]")

        await expect(records).toHaveCount(5)
        const firstPadding = await records.first().evaluate((element) => {
          const style = getComputedStyle(element)
          return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]
        })
        expect(new Set(firstPadding).size).toBe(1)
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
