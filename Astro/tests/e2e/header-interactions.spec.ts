import { expect, test } from "@playwright/test"

import { VIEWPORTS } from "./support/site-matrix"

const viewports = VIEWPORTS

test.describe("header interactions", () => {
  test("opens contact by keyboard and restores focus after every close path", async ({ page }) => {
    await page.goto("")
    const trigger = page.locator("[data-contact-trigger]")
    const dialog = page.locator("[data-contact-dialog]")

    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(dialog).toBeVisible()
    await expect(dialog.locator("h2")).toBeFocused()
    await expect(dialog.locator('[data-dialog-close] svg[data-icon="xmark"]')).toHaveCount(1)
    await expect(dialog.locator("[data-dialog-close]")).toHaveAttribute("title", "关闭联系方式")
    await page.keyboard.press("Escape")
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()

    await trigger.click()
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    if (bounds === null) return
    await dialog.dispatchEvent("click", {
      clientX: bounds.x + bounds.width / 2,
      clientY: bounds.y + bounds.height / 2,
    })
    await expect(dialog).toBeVisible()
    await dialog.dispatchEvent("click", {
      clientX: bounds.x - 1,
      clientY: bounds.y - 1,
    })
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
  })

  test("compact navigation focuses its first route and closes on route, outside, and Escape", async ({ page }) => {
    await page.setViewportSize(viewports[0])
    await page.goto("")
    const toggle = page.locator("[data-menu-toggle]")
    const navigation = page.locator("#primary-navigation")
    const firstRoute = navigation.getByRole("link").first()
    const actions = page.locator(".header-actions")

    const [toggleBox, actionsBox] = await Promise.all([toggle.boundingBox(), actions.boundingBox()])
    expect(toggleBox).not.toBeNull()
    expect(actionsBox).not.toBeNull()
    expect(toggleBox?.x ?? 0).toBeLessThan(actionsBox?.x ?? 0)

    await toggle.click()
    await expect(firstRoute).toBeFocused()
    await firstRoute.evaluate((element) => element.addEventListener("click", (event) => event.preventDefault(), { once: true }))
    await firstRoute.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    await toggle.click()
    await page.locator("main").dispatchEvent("pointerdown")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")

    await toggle.click()
    await page.keyboard.press("Escape")
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await expect(toggle).toBeFocused()
  })

  test("header controls use named build-time icons and reveal localized tooltips on focus", async ({ page }) => {
    await page.setViewportSize(viewports[1])
    await page.goto("en/")

    const controls = [
      { trigger: page.locator("[data-menu-toggle]"), tooltip: page.locator("[data-menu-toggle] [data-control-tooltip]") },
      { trigger: page.locator("a.language-link"), tooltip: page.locator("a.language-link [data-control-tooltip]") },
      { trigger: page.locator("[data-theme-toggle]"), tooltip: page.locator("[data-theme-toggle]").locator("xpath=..").locator("[data-control-tooltip]") },
      { trigger: page.locator("[data-contact-trigger]"), tooltip: page.locator("[data-contact-trigger]").locator("xpath=../..").locator("[data-control-tooltip]") },
    ] as const

    for (const { trigger, tooltip } of controls) {
      await expect(trigger).toBeVisible()
      await trigger.focus()
      await expect(tooltip).toBeVisible()
    }

    await expect(page.locator("[data-menu-toggle] [data-menu-open-icon] svg[data-icon]")).toHaveCount(1)
    await expect(page.locator("a.language-link svg[data-icon]")).toHaveCount(1)
    await expect(page.locator("[data-theme-toggle] [data-theme-destination]:not([hidden]) svg[data-icon]")).toHaveCount(1)
    await expect(page.locator('[data-contact-trigger] svg[data-icon="envelope"]')).toHaveCount(1)
  })

  test("native View Transition support enhances but never owns route navigation", async ({ page }) => {
    await page.setViewportSize(viewports[2])
    await page.goto("")
    const hasViewTransitionRule = await page.evaluate(() => [...document.styleSheets].some((sheet) => {
      try {
        return [...sheet.cssRules].some((rule) => rule.cssText.startsWith("@view-transition"))
      } catch {
        return false
      }
    }))
    expect(hasViewTransitionRule).toBe(true)

    await page.locator("#primary-navigation").getByRole("link", { name: "自我介绍" }).click()
    await expect(page).toHaveURL(/\/about\/$/)

    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, "startViewTransition", {
        configurable: true,
        value: undefined,
      })
    })
    await page.goto("")
    await page.locator("#primary-navigation").getByRole("link", { name: "项目与成果" }).click()
    await expect(page).toHaveURL(/\/projects\/$/)
  })

  test("reduced motion makes view-transition durations instantaneous", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize(viewports[2])
    await page.goto("en/projects/")
    const reducedViewTransitions = await page.evaluate(() => {
      const oldRoot = getComputedStyle(document.documentElement, "::view-transition-old(root)")
      const newRoot = getComputedStyle(document.documentElement, "::view-transition-new(root)")
      return [oldRoot, newRoot].every((style) =>
        style.animationName === "none" || style.animationDuration.split(", ").every((value) => value === "0s")
      )
    })
    expect(reducedViewTransitions).toBe(true)
    await expect(page.locator("[data-project-filter-controls]")).toBeVisible()
  })

  test("dialog opening states animate normally and become instantaneous with reduced motion", async ({ page }) => {
    await page.goto("en/projects/")
    await page.locator('[data-project-card][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]').click()
    const projectDialog = page.locator('[data-project-dialog][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"]')
    await projectDialog.locator("[data-certificate-trigger]").click()
    const dialog = projectDialog.locator("[data-certificate-dialog]")
    expect(await dialog.evaluate((element) => getComputedStyle(element).animationName)).toBe("dialog-open")

    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.reload()
    await expect(projectDialog).toBeVisible()
    await page.locator('[data-project-dialog][data-project-id="2024-Competition-PowerPrintRecognitionAndOpenLabNewQualityInteractiveScenarioDesign"] [data-certificate-trigger]').click()
    expect(await dialog.evaluate((element) => {
      const style = getComputedStyle(element)
      return style.animationName === "none" && style.animationDuration.split(", ").every((value) => value === "0s")
    })).toBe(true)
  })

  test("uses compact menu composition at the deliberate 768px breakpoint", async ({ page }) => {
    await page.setViewportSize(viewports[1])
    await page.goto("en/")

    await expect(page.locator("[data-menu-toggle]")).toBeVisible()
    await expect(page.locator("#primary-navigation")).toBeHidden()
    await page.locator("[data-menu-toggle]").click()
    await expect(page.locator("#primary-navigation")).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewports[1].width)
  })

  test("switches from compact to inline navigation at the 1024px boundary in both locales", async ({ page }) => {
    const compactViewport = { width: 1023, height: 900 }
    const fullNavigationViewports = [
      { width: 1024, height: 900 },
      { width: 1025, height: 900 },
    ] as const
    const localePaths = ["", "en/"] as const

    await page.setViewportSize(compactViewport)
    for (const localePath of localePaths) {
      await page.goto(localePath)
      await expect(page.locator("[data-menu-toggle]")).toBeVisible()
      await expect(page.locator("#primary-navigation")).toBeHidden()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(compactViewport.width)
    }

    for (const localePath of localePaths) {
      for (const viewport of fullNavigationViewports) {
        await page.setViewportSize(viewport)
        await page.goto(localePath)

        await expect(page.locator("[data-menu-toggle]")).toBeHidden()
        await expect(page.locator("#primary-navigation")).toBeVisible()
        await expect(page.locator("[data-header-route]")).toHaveCount(4)
        for (const route of await page.locator("[data-header-route]").all()) {
          await expect(route).toBeVisible()
        }
        await expect(page.locator("a.language-link")).toBeVisible()
        await expect(page.locator("[data-theme-toggle]")).toBeVisible()
        await expect(page.locator("[data-contact-trigger]")).toBeVisible()
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
      }
    }
  })
})
