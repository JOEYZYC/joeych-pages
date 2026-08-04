import { expect, test } from "@playwright/test"

const basePath = "/joeych-pages"
const projectFragment = "#resgatnet"

test.describe("navigation state synchronization", () => {
  test("keeps the locale counterpart ready for a direct project fragment load", async ({ page }) => {
    // Given: a project archive loaded directly at a stable record fragment
    await page.goto(`projects/${projectFragment}`)

    // When: the document is ready for an immediate locale change
    const languageLink = page.locator("a.language-link")

    // Then: the rendered counterpart route carries the current fragment without a click mutation
    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/${projectFragment}`)
    await expect(languageLink).toHaveAttribute("data-language-counterpart", `${basePath}/en/projects/`)
  })

  test("updates and clears the locale counterpart when the project fragment changes", async ({ page }) => {
    // Given: a localized project archive without a fragment
    await page.goto("projects/")
    const languageLink = page.locator("a.language-link")

    // When: browser history changes the current project fragment
    await page.evaluate((fragment) => {
      window.location.hash = fragment
    }, projectFragment)

    // Then: the server-provided counterpart base keeps the new fragment
    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/${projectFragment}`)

    // Given: the same page after the fragment is cleared
    // When: browser history removes the hash
    await page.evaluate(() => {
      window.history.replaceState(null, "", window.location.pathname)
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    })

    // Then: the counterpart returns exactly to the server-rendered base path
    await expect(languageLink).toHaveAttribute("href", `${basePath}/en/projects/`)
  })

  test("returns the vertical project rail to the current fragment after hover leaves", async ({ page }) => {
    // Given: a desktop project archive addressed by a stable fragment
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`projects/${projectFragment}`)
    const group = page.locator('[data-signal-rail-axis="vertical"]')
    const rail = group.locator("[data-signal-rail]")
    const targets = group.locator("[data-signal-target]")
    const expectedTargetTransform = await page.evaluate(() => {
      const groupElement = document.querySelector<HTMLElement>('[data-signal-rail-axis="vertical"]')
      const target = document.querySelector<HTMLElement>(`[data-signal-target][href="${window.location.hash}"]`)
      if (!groupElement || !target) return ""
      const offset = target.getBoundingClientRect().top - groupElement.getBoundingClientRect().top
      return `translateY(${Math.round(offset * 1000) / 1000}px)`
    })

    // When: a different index item is hovered and the pointer leaves the project index
    await targets.nth(0).hover()
    await expect(rail).not.toHaveAttribute("style", new RegExp(expectedTargetTransform.replace(/[()]/g, "\\$&")))
    await group.hover({ position: { x: 1, y: 1 } })
    await page.mouse.move(1279, 899)

    // Then: the rail rests at the current fragment target rather than a stale captured target
    await expect(rail).toHaveAttribute("style", new RegExp(expectedTargetTransform.replace(/[()]/g, "\\$&")))
  })

  test("updates the vertical project rail when browser history changes its fragment", async ({ page }) => {
    // Given: a desktop project archive with its default rail state
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto("projects/")
    const group = page.locator('[data-signal-rail-axis="vertical"]')
    const rail = group.locator("[data-signal-rail]")

    // When: browser history selects a project record
    await page.evaluate((fragment) => {
      window.location.hash = fragment
    }, projectFragment)

    // Then: the vertical rail follows the URL target
    await expect(rail).toHaveCSS("opacity", "1")
    await expect(rail).toHaveAttribute("style", /translateY\(/)
  })

  test("dismisses the mobile menu only for outside pointers and restores focus with Escape", async ({ page }) => {
    // Given: an open compact menu on the mobile home page
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("")
    const toggle = page.locator("[data-menu-toggle]")
    const navigation = page.locator("#primary-navigation")
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")

    // When: a pointer action starts within the header navigation
    await navigation.dispatchEvent("pointerdown")

    // Then: the menu remains open for its own controls
    await expect(toggle).toHaveAttribute("aria-expanded", "true")

    // When: a pointer action starts outside the header
    await page.mouse.click(374, 811)

    // Then: the menu closes for a real pointer action outside the header
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    // Given: an open menu whose toggle owns keyboard focus
    await toggle.click()
    await toggle.focus()

    // When: an outside pointerdown closes the menu
    await page.locator("main").dispatchEvent("pointerdown")

    // Then: outside dismissal does not redirect focus
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(toggle).toBeFocused()

    // Given: the menu is opened again
    await toggle.click()

    // When: Escape dismisses it
    await page.keyboard.press("Escape")

    // Then: the toggle receives focus after closing
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(toggle).toBeFocused()
  })
})
