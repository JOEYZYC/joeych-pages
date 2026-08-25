import { expect, test } from "@playwright/test"

import { getProfileData } from "../../src/lib/profile-data"
import { VIEWPORTS } from "./support/site-matrix"

const homeRoutes = [
  { path: "", locale: "zh", language: "zh-CN", navigation: "首页", action: "查看自我介绍" },
  { path: "en/", locale: "en", language: "en", navigation: "Home", action: "Read about me" },
] as const
const aboutRoutes = [
  { path: "about/", locale: "zh", language: "zh-CN", navigation: "自我介绍" },
  { path: "en/about/", locale: "en", language: "en", navigation: "About" },
] as const

test.describe("home and about routes", () => {
  for (const route of homeRoutes) {
    test(`renders the ${route.locale} Home bundle and routes to About`, async ({ page }) => {
      const data = await getProfileData()
      await page.goto(route.path)

      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(data.home.heading[route.locale])
      await expect(page.locator(".home-summary")).toHaveText(data.home.page.summary[route.locale])
      await expect(page.getByRole("navigation").getByRole("link", { name: route.navigation })).toHaveAttribute("aria-current", "page")
      await expect(page.locator(".home-portrait img")).toHaveAttribute("src", /\/joeych-pages\/home\/portrait-/)
      const aboutAction = page.getByRole("link", { name: new RegExp(route.action) })
      await expect(aboutAction).toHaveAttribute("href", route.locale === "zh" ? "/joeych-pages/about/" : "/joeych-pages/en/about/")
    })
  }

  test("switches Home artwork with the explicit theme", async ({ page }) => {
    await page.goto("")
    const background = page.locator(".home-background")
    await expect(background).toHaveCSS("background-image", /hero-circuit-background-light\.png/)
    await page.locator("[data-theme-toggle]").click()
    await expect(background).toHaveCSS("background-image", /hero-circuit-background\.png/)
  })

  for (const route of aboutRoutes) {
    test(`renders the ${route.locale} About bundle with all profile sections`, async ({ page }) => {
      const data = await getProfileData()
      const { about, site } = data
      await page.goto(route.path)

      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(about.page.title[route.locale])
      await expect(page.locator(".intro > p:not(.eyebrow)")).toHaveText(about.page.summary[route.locale])
      await expect(page.getByRole("navigation").getByRole("link", { name: route.navigation })).toHaveAttribute("aria-current", "page")
      await expect(page.locator(".about-overview > p:not(.eyebrow)")).toHaveText(about.overview.map((paragraph) => paragraph[route.locale]))
      await expect(page.locator(".about-facts dd")).toHaveText([
        site.name[route.locale],
        site.role[route.locale],
        about.hometown[route.locale],
        about.political[route.locale],
        about.tagline[route.locale],
      ])
      await expect(page.locator("[data-about-statistic]")).toHaveCount(about.statistics.length)
      await expect(page.locator(".about-interest-list li")).toHaveText(about.interests.map((interest) => interest[route.locale]))
      await expect(page.locator(".about-goal p")).toHaveText(about.goal[route.locale])
      await expect(page.locator('[data-about-kind="education"]')).toHaveCount(about.education.length)
      await expect(page.locator('[data-about-kind="campus"]')).toHaveCount(about.campus_experience.length)
    })
  }

  test("keeps the retired experience routes deleted", async ({ page }) => {
    expect((await page.goto("experience/"))?.status()).toBe(404)
    expect((await page.goto("en/experience/"))?.status()).toBe(404)
  })

  for (const viewport of VIEWPORTS) {
    test(`keeps Home and About within the ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport)
      for (const path of ["", "en/", "about/", "en/about/"]) {
        await page.goto(path)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    })
  }
})
