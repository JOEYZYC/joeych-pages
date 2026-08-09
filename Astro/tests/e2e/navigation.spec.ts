import { expect, test } from "@playwright/test"

const basePath = "/joeych-pages"
const projectFragment = "#resgatnet"

test.describe("navigation state synchronization", () => {
  test("keeps the locale counterpart ready for a direct project fragment load", async ({ page }) => {
    await page.goto(`projects/${projectFragment}`)
    const languageLink = page.locator("a.language-link")

    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/${projectFragment}`)
    await expect(languageLink).toHaveAttribute("data-language-counterpart", `${basePath}/en/projects/`)
  })

  test("updates and clears the locale counterpart when the project fragment changes", async ({ page }) => {
    await page.goto("projects/")
    const languageLink = page.locator("a.language-link")

    await page.evaluate((fragment) => {
      window.location.hash = fragment
    }, projectFragment)
    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/${projectFragment}`)

    await page.evaluate(() => {
      window.history.replaceState(null, "", window.location.pathname)
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    })
    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/`)
  })

  test("synchronizes the project navigator, visible state labels, and scrolling without history writes", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto("en/projects/")
    const navigator = page.locator("[data-project-navigator]")
    const historyLength = await page.evaluate(() => window.history.length)

    await navigator.selectOption("resgatnet")

    await expect(navigator).toHaveValue("resgatnet")
    await expect(page.locator('[data-project-tile][data-project-id="resgatnet"]')).toHaveAttribute(
      "aria-current",
      "location",
    )
    await expect(page.locator('[data-project-tile][data-project-id="resgatnet"] [data-project-current-label]')).toBeVisible()
    await expect(page.locator("#resgatnet [data-project-current-label]")).toBeVisible()
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength)
    await expect(page).toHaveURL(/\/en\/projects\/$/)

    await page.locator("#traffic-sign-recognition").evaluate((element) => element.scrollIntoView({ block: "start" }))
    await expect(navigator).toHaveValue("traffic-sign-recognition")
    await expect(page.locator('[data-project-tile][aria-current="location"]')).toHaveAttribute(
      "data-project-id",
      "traffic-sign-recognition",
    )
  })

  test("a browser hash change updates navigator state and focuses the stable record title", async ({ page }) => {
    await page.goto("en/projects/")

    await page.evaluate(() => {
      window.location.hash = "#resgatnet"
    })

    await expect(page.locator("[data-project-navigator]")).toHaveValue("resgatnet")
    await expect(page.locator("#resgatnet")).toHaveAttribute("data-active", "true")
    await expect(page.locator("#resgatnet [data-project-record-title]")).toBeFocused()
    await expect(page.locator("a.language-link")).toHaveAttribute(
      "href",
      `${basePath}/projects/#resgatnet`,
    )
  })

  test("dismisses the compact menu only for outside pointers and restores focus with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("")
    const toggle = page.locator("[data-menu-toggle]")
    const navigation = page.locator("#primary-navigation")

    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(navigation.getByRole("link").first()).toBeFocused()

    await navigation.dispatchEvent("pointerdown")
    await expect(toggle).toHaveAttribute("aria-expanded", "true")

    await page.locator("main").dispatchEvent("pointerdown")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    await toggle.click()
    await page.keyboard.press("Escape")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(toggle).toBeFocused()
  })
})
