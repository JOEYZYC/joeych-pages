import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"

const themeKey = "joeych-theme"

async function expectTheme(
  page: Page,
  theme: "light" | "dark",
  destination: { readonly label: string; readonly name: string },
): Promise<void> {
  const root = page.locator("html")
  const toggle = page.locator("[data-theme-toggle]")
  await expect(root).toHaveAttribute("data-js", "true")
  await expect(root).toHaveAttribute("data-theme", theme)
  await expect.poll(() => root.evaluate((element) => element.style.colorScheme)).toBe(theme)
  await expect(toggle).toHaveAttribute("aria-pressed", String(theme === "dark"))
  await expect(toggle).toHaveAttribute("aria-label", destination.name)
  await expect(toggle).toContainText(destination.label)
  await expect(page.getByRole("main")).toBeVisible()
}

test.describe("explicit light and dark themes", () => {
  test("stored light wins over a dark system preference before use", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.addInitScript((key) => window.localStorage.setItem(key, "light"), themeKey)

    await page.goto("")

    await expectTheme(page, "light", { label: "深色", name: "切换至深色主题" })
  })

  test("stored dark wins over a light system preference before use", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.addInitScript((key) => window.localStorage.setItem(key, "dark"), themeKey)

    await page.goto("en/")

    await expectTheme(page, "dark", { label: "Light", name: "Switch to light theme" })
  })

  test("invalid storage follows the system and remains system-responsive", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.addInitScript((key) => window.localStorage.setItem(key, "sepia"), themeKey)
    await page.goto("en/")
    await expectTheme(page, "dark", { label: "Light", name: "Switch to light theme" })

    await page.emulateMedia({ colorScheme: "light" })

    await expectTheme(page, "light", { label: "Dark", name: "Switch to dark theme" })
  })

  test("throwing storage falls back safely and keeps a denied-write override in memory", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.addInitScript(() => {
      Object.defineProperty(Storage.prototype, "getItem", {
        configurable: true,
        value: () => {
          throw new DOMException("Storage denied", "SecurityError")
        },
      })
      Object.defineProperty(Storage.prototype, "setItem", {
        configurable: true,
        value: () => {
          throw new DOMException("Storage denied", "SecurityError")
        },
      })
    })
    await page.goto("en/")
    await expectTheme(page, "dark", { label: "Light", name: "Switch to light theme" })

    await page.locator("[data-theme-toggle]").click()
    await expectTheme(page, "light", { label: "Dark", name: "Switch to dark theme" })

    await page.emulateMedia({ colorScheme: "light" })
    await page.emulateMedia({ colorScheme: "dark" })
    await expectTheme(page, "light", { label: "Dark", name: "Switch to dark theme" })
  })

  test("toggle choices persist across reload", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("en/")
    await page.evaluate((key) => window.localStorage.removeItem(key), themeKey)
    await page.reload()
    await expectTheme(page, "light", { label: "Dark", name: "Switch to dark theme" })

    await page.locator("[data-theme-toggle]").click()
    await expectTheme(page, "dark", { label: "Light", name: "Switch to light theme" })
    await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), themeKey)).toBe("dark")

    await page.reload()
    await expectTheme(page, "dark", { label: "Light", name: "Switch to light theme" })
  })

  test("later system changes are followed while no override exists", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.addInitScript((key) => window.localStorage.removeItem(key), themeKey)
    await page.goto("")
    await expectTheme(page, "light", { label: "深色", name: "切换至深色主题" })

    await page.emulateMedia({ colorScheme: "dark" })
    await expectTheme(page, "dark", { label: "浅色", name: "切换至浅色主题" })

    await page.emulateMedia({ colorScheme: "light" })
    await expectTheme(page, "light", { label: "深色", name: "切换至深色主题" })
  })

  for (const locale of [
    { path: "", label: "深色", name: "切换至深色主题" },
    { path: "en/", label: "Dark", name: "Switch to dark theme" },
  ] as const) {
    test(`exposes the localized destination theme in the ${locale.path || "root"} header`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light" })
      await page.addInitScript((key) => window.localStorage.removeItem(key), themeKey)

      await page.goto(locale.path)

      await expectTheme(page, "light", { label: locale.label, name: locale.name })
    })
  }

  test("JavaScript-disabled dark-system fallback keeps ordinary links usable", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4321/joeych-pages/",
      colorScheme: "dark",
      javaScriptEnabled: false,
    })
    const page = await context.newPage()

    await page.goto("en/")

    const root = page.locator("html")
    await expect(root).toHaveAttribute("data-js", "false")
    await expect(root).not.toHaveAttribute("data-theme", /.+/)
    expect(await root.evaluate((element) => element.style.colorScheme)).toBe("")
    expect(await root.evaluate((element) => getComputedStyle(element).colorScheme)).toContain("dark")
    await expect(page.locator("[data-menu-toggle]")).toBeHidden()
    await expect(page.getByRole("navigation").getByRole("link", { name: "Projects" })).toBeVisible()
    await expect(page.locator("[data-contact-fallback]")).toHaveAttribute("href", /^mailto:/)
    await expect(page.locator("[data-contact-fallback]")).toBeVisible()
    await expect(page.getByRole("main")).toBeVisible()

    await context.close()
  })
})
