import { expect, test } from "@playwright/test"

import { BASE_PATH, CANONICAL_ROUTES } from "./support/site-matrix"

const systemSchemes = ["light", "dark"] as const
const languages = {
  zh: "zh-CN",
  en: "en",
} as const
const headerJavaScriptTriggerSelectors = [
  "[data-menu-toggle]",
  "[data-theme-toggle]",
  "[data-contact-trigger]",
] as const

test.describe("JavaScript-disabled canonical routes", () => {
  for (const systemScheme of systemSchemes) {
    test(`keeps all canonical routes reachable in the ${systemScheme} system scheme`, async ({ browser }) => {
      const context = await browser.newContext({
        baseURL: "http://127.0.0.1:4321/joeych-pages/",
        colorScheme: systemScheme,
        javaScriptEnabled: false,
      })
      const page = await context.newPage()

      for (const route of CANONICAL_ROUTES) {
        await page.goto(`${BASE_PATH}/${route.path}`)

        const root = page.locator("html")
        const noScriptRoutes = page.locator("[data-noscript-header-routes] a")
        const expectedRouteHrefs = CANONICAL_ROUTES
          .filter((candidate) => candidate.locale === route.locale)
          .map((candidate) => `${BASE_PATH}/${candidate.path}`)
        const contactHrefs = await page.locator("[data-noscript-contact-links] a").evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")),
        )

        await expect(root).toHaveAttribute("data-js", "false")
        await expect(root).toHaveAttribute("lang", languages[route.locale])
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1)
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await expect(page.getByRole("main")).toBeVisible()
        expect(await root.evaluate((element) => getComputedStyle(element).colorScheme)).toContain(systemScheme)
        for (const selector of headerJavaScriptTriggerSelectors) await expect(page.locator(selector)).toBeHidden()
        expect(
          await page.locator("[data-certificate-trigger]").evaluateAll((triggers) =>
            triggers.every((trigger) => trigger.hasAttribute("hidden")),
          ),
        ).toBe(true)
        await expect(page.locator("[data-noscript-header-fallback]")).toBeVisible()
        await expect(noScriptRoutes).toHaveCount(4)
        expect(await noScriptRoutes.evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(
          expectedRouteHrefs,
        )
        await expect(page.locator("[data-noscript-language-counterpart]")).toHaveAttribute(
          "href",
          `${BASE_PATH}${route.counterpart}`,
        )
        expect(contactHrefs).toEqual([
          expect.stringMatching(/^mailto:/),
          expect.stringMatching(/^tel:/),
          expect.stringMatching(/^https:/),
          expect.stringMatching(/^https:/),
          expect.stringMatching(/^https:/),
        ])

        if (route.path.includes("projects/")) {
          const firstCertificate = page.locator("[data-certificate-fallback]").first()

          await expect(firstCertificate).toBeVisible()
          await expect(firstCertificate).toHaveAttribute("href", new RegExp(`^${BASE_PATH}/projects/`))
          await firstCertificate.click()
          await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/projects/`))
        }
      }

      await context.close()
    })
  }

})
