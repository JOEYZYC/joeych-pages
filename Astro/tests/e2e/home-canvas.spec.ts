import type { Locator, Page } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { chipProbe } from "./support/chip-probe"

async function expectFocusedBounds(control: Locator): Promise<void> {
  await expect(control).toBeFocused()
  await expect.poll(() => control.evaluate((element) => {
    const r = element.getBoundingClientRect()
    return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight - 55
  })).toBe(true)
}
async function expectScene(page: Page, index: number): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-active-chapter", String(index))
  const heading = page.locator(`[data-chapter="${index}"] h1,[data-chapter="${index}"] h2`)
  await expect.poll(() => heading.evaluate((element) => {
    const r = element.getBoundingClientRect()
    return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight - 55
  })).toBe(true)
  await expect.poll(() => page.locator("[data-chapter-rail]").evaluate(element => Math.abs(element.scrollLeft - Number(document.documentElement.getAttribute("data-active-chapter")) * element.clientWidth))).toBeLessThan(2)
}

test.describe("single-chip five-scene production overview", () => {
  for (const width of [1280, 375]) {
    test(`hands focus forward before subsequent Tab at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 375 ? 667 : 900 })
      for (const origin of ["scene", "link"]) for (const key of ["ArrowRight", "PageDown"]) {
        await page.goto("")
        const scenes = page.locator("section[data-chapter]")
        await (origin === "scene" ? scenes.nth(0) : scenes.nth(0).locator("a").first()).focus()
        await page.keyboard.press(key)
        await expect(scenes.nth(1)).toBeFocused()
        await expectScene(page, 1)
        await page.keyboard.press("Tab")
        await expectFocusedBounds(scenes.nth(1).locator("a").first())
        await page.keyboard.press("Shift+Tab")
        await expect(scenes.nth(1)).toBeFocused()
        await expectScene(page, 1)
      }
    })
  }

  for (const route of ["", "en/"]) test(`reveals direct descendant focus, Tab/reverse Tab and resize in ${route || "zh"}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(route)
    await page.evaluate(() => document.fonts.ready)
    const scenes = page.locator("section[data-chapter]")
    for (const index of [0, 4, 1, 2, 3, 0]) {
      const target = scenes.nth(index).locator("a").last()
      await target.focus()
      await expectFocusedBounds(target)
      await expectScene(page, index)
    }
    await scenes.nth(0).focus()
    for (let n = 0; n < 4; n++) await page.keyboard.press("Tab")
    await expectFocusedBounds(scenes.nth(1).locator("a").first())
    await page.keyboard.press("Shift+Tab")
    await expect(scenes.nth(1)).toBeFocused()
    await page.setViewportSize({ width: 375, height: 812 })
    await expectScene(page, 1)
    const descendant = scenes.nth(1).locator("a").last()
    await descendant.focus()
    await page.setViewportSize({ width: 375, height: 667 })
    await expectFocusedBounds(descendant)
    await page.setViewportSize({ width: 1280, height: 720 })
    await expectFocusedBounds(descendant)
    await expectScene(page, 1)
  })

  test("preserves scene hash, origin focus, detail history, refresh and browser Back/Forward", async ({ page }) => {
    await page.goto("#chapter-4")
    await expectScene(page, 4)
    const invoker = page.locator("#chapter-4 .experience-preview a").first()
    await invoker.click()
    await expect(page).toHaveURL(/\/about\/#internship-/)
    await page.goBack()
    await expectScene(page, 4)
    await expectFocusedBounds(invoker)
    await page.reload()
    await expectScene(page, 4)
    await page.goForward()
    await expect(page).toHaveURL(/\/about\/#internship-/)
    await expect(page.locator("#chip-overlay")).toHaveAttribute("data-updates", /\d+/)
    await page.locator("[data-overview-return]").click()
    await expectScene(page, 4)
    await expectFocusedBounds(invoker)
  })

  test("explicit chapter hashes win over an earlier reader origin on reload and locale navigation", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const evidence: { label: string; hash: string; chapter: string | null; focus: string }[] = []
    const record = async (label: string) => evidence.push({ label, ...await page.evaluate(() => ({ hash: location.hash, chapter: document.documentElement.getAttribute("data-active-chapter"), focus: document.activeElement?.outerHTML.slice(0, 220) ?? "" })) })
    await page.goto("#chapter-4")
    await page.locator("#chapter-4 .large-text-link").click()
    await expect(page.locator("#chip-overlay")).toHaveAttribute("data-updates", /\d+/)
    await page.locator("[data-overview-return]").click()
    await expectScene(page, 4)
    await expectFocusedBounds(page.locator("#chapter-4 .large-text-link"))
    await record("reader-return")
    await page.locator('.chapter-dots [data-chapter-go="1"]').click()
    await expect(page).toHaveURL(/#chapter-1$/)
    await record("explicit-chapter-before-reload")
    await page.reload()
    await expectScene(page, 1)
    await expect(page).toHaveURL(/#chapter-1$/)
    await record("explicit-chapter-after-reload")
    await page.locator('.chapter-dots [data-chapter-go="2"]').click()
    await expect(page).toHaveURL(/#chapter-2$/)
    await page.locator("[data-menu-toggle]").click()
    await page.locator("a.language-link").click()
    await expect(page).toHaveURL(/\/en\/#chapter-2$/)
    await expectScene(page, 2)
    await record("explicit-chapter-after-locale")
    await testInfo.attach("origin-intent-regression.json", { body: JSON.stringify(evidence), contentType: "application/json" })
  })

  for (const viewport of [{ width: 320, height: 812 }, { width: 640, height: 450 }]) test(`reflows to ordinary vertical reading at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto("en/")
    await expect(page.locator("html")).toHaveAttribute("data-reflow", "true")
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
    await expect(page.locator("section[data-chapter]")).toHaveCount(5)
    await page.locator("#chapter-4 h2").scrollIntoViewIfNeeded()
    await expect(page.locator("#chapter-4 h2")).toBeInViewport()
  })

  test("keeps enlarged 200% text readable without horizontal loss", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("en/")
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; window.dispatchEvent(new Event("resize")) })
    await expect(page.locator("html")).toHaveAttribute("data-reflow", "true")
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
    for (const scene of await page.locator("section[data-chapter]").all()) {
      await scene.locator("h1,h2").scrollIntoViewIfNeeded()
      expect(await scene.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
  })

  test("retains horizontal topology under reduced motion and source order without JS", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Focused browser checks require a base URL")
    for (const javaScriptEnabled of [true, false]) {
      const context = await browser.newContext({ baseURL, javaScriptEnabled, hasTouch: true, reducedMotion: "reduce", viewport: { width: 375, height: 812 }, colorScheme: "dark" })
      const page = await context.newPage()
      await page.goto("")
      await expect(page.locator("section[data-chapter]")).toHaveCount(5)
      if (javaScriptEnabled) {
        await expect(page.locator("html")).toHaveAttribute("data-reflow", "false")
        await page.locator("[data-chapter-next]").click()
        await expectScene(page, 1)
        await expect(page.locator("#chip-overlay")).toHaveAttribute("data-animating", "false")
      } else {
        await expect(page.locator("[data-overview-controls]")).toBeHidden()
        await page.locator("#chapter-4 h2").scrollIntoViewIfNeeded()
        await expect(page.locator("#chapter-4 h2")).toBeInViewport()
        await expect(page.locator("#chapter-1 .chapter-project")).toHaveCount(3)
      }
      await context.close()
    }
  })

  test("releases wheel at both boundaries, limits keys to canvas, and has no idle RAF", async ({ page }) => {
    await page.goto("")
    await page.locator("#chapter-0").focus()
    expect(await page.locator("#chapter-0").evaluate(element => element.dispatchEvent(new WheelEvent("wheel", { deltaY: -200, bubbles: true, cancelable: true })))).toBe(true)
    await page.locator("#chapter-0").evaluate(element => element.dispatchEvent(new WheelEvent("wheel", { deltaY: 200, bubbles: true, cancelable: true })))
    await expectScene(page, 1)
    await expect(page.locator("#chip-overlay")).toHaveAttribute("data-animating", "false")
    await page.locator("#chapter-4").focus()
    await page.waitForTimeout(750)
    expect(await page.locator("#chapter-4").evaluate(element => element.dispatchEvent(new WheelEvent("wheel", { deltaY: 200, bubbles: true, cancelable: true })))).toBe(true)
    await page.locator("[data-menu-toggle]").focus()
    await page.keyboard.press("ArrowLeft")
    await expectScene(page, 4)
    const paints = await page.locator("#chip-overlay").getAttribute("data-updates")
    await page.waitForTimeout(350)
    expect(await page.locator("#chip-overlay").getAttribute("data-updates")).toBe(paints)
    await page.locator("#chapter-4").focus()
    await page.mouse.move(500, 500)
    await page.mouse.wheel(0, 1600)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
    await page.locator(".site-font-notices summary").click()
    await expect(page.locator(".site-font-notices")).toContainText("SIL OPEN FONT LICENSE")
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded()
    await expect(page.getByRole("contentinfo")).toBeInViewport()
  })

  for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 667 }]) test(`keeps terminal and fractional painted bounds clear at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    const samples = []
    for (const route of ["", "en/"]) for (const theme of ["light", "dark"]) {
      await page.addInitScript(value => localStorage.setItem("joeych-theme", value), theme)
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator("[data-shared-chip] svg")).toHaveCount(1)
      for (let scene = 0; scene < 5; scene++) {
        await page.locator(`[data-chapter="${scene}"]`).focus()
        await expectScene(page, scene)
        const sample = await page.evaluate(chipProbe)
        samples.push({ route, theme, scene, fraction: 0, ...sample })
        expect(sample.collisions, JSON.stringify({ route, theme, scene, sample })).toEqual([])
      }
      await page.locator("[data-chapter-rail]").evaluate(element => { element.style.scrollSnapType = "none" })
      for (let scene = 0; scene < 4; scene++) for (const fraction of [.02, .06, .12, .18, .26, .4, .55, .7, .82, .90, .94, .97]) {
        await page.locator("[data-chapter-rail]").evaluate((element, x) => { element.scrollLeft = x * element.clientWidth; element.dispatchEvent(new Event("scroll")) }, scene + fraction)
        const sample = await page.evaluate(chipProbe)
        samples.push({ route, theme, scene, fraction, ...sample })
        expect(sample.collisions, JSON.stringify({ route, theme, scene, fraction, sample })).toEqual([])
      }
    }
    await testInfo.attach("painted-collision-samples.json", { body: JSON.stringify(samples), contentType: "application/json" })
  })

  test("actually renders the selected CJK webfonts, not installed fallbacks", async ({ page }) => {
    await page.goto("")
    await page.evaluate(() => document.fonts.ready)
    const client = await page.context().newCDPSession(page)
    await client.send("DOM.enable")
    await client.send("CSS.enable")
    const { root } = await client.send("DOM.getDocument")
    for (const [selector, family] of [[".chapter-hello h1 > span", "Home Maple Subset"], [".hello-voice", "Home Noto Subset"]] as const) {
      const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector })
      const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId })
      expect(fonts.some(font => font.familyName === family && font.isCustomFont && font.glyphCount > 0)).toBe(true)
    }
  })
})
