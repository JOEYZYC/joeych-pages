import type { Locator, Page } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { chipProbe, motionFrames } from "./support/chip-probe"

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

test.describe("filled-shape five-scene production overview", () => {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 375, height: 667 }, { width: 375, height: 812 }]) test(`shows independent painted motion and layered settling at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    test.setTimeout(60000)
    await page.setViewportSize(viewport)
    for (const [route, theme, input] of [["", "light", "next"], ["en/", "dark", "wheel"]] as const) {
      await page.addInitScript(value => localStorage.setItem("joeych-theme", value), theme)
      await page.goto(route)
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})))
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      })
      await page.locator("#chapter-0").focus()
      const recording = page.evaluate(motionFrames)
      if (input === "next") await page.locator("[data-chapter-next]").click()
      else await page.locator("#chapter-0").evaluate(element => element.dispatchEvent(new WheelEvent("wheel", { deltaY: 240, bubbles: true, cancelable: true })))
      const samples = await recording
      await expectScene(page, 1)
      await expect(page.locator("#chip-overlay")).toHaveAttribute("data-animating", "false")
      await expect.poll(() => page.locator("#chapter-1").evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
      const spacing = await page.locator("#chapter-1").evaluate(element => {
        const heading = element.querySelector("h2")?.getBoundingClientRect()
        const list = element.querySelector(".chapter-project-list")?.getBoundingClientRect()
        const media = element.querySelector(".hero-art-link")?.getBoundingClientRect()
        if (!heading || !list || !media) throw new Error("Missing making composition")
        const links = [...element.querySelectorAll<HTMLAnchorElement>(".chapter-project")]
        const linksExposed = links.length === 3 && links.every(link => {
          const bounds = link.getBoundingClientRect()
          const hit = document.elementFromPoint((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2)
          return bounds.top >= 0 && bounds.bottom <= innerHeight - 55 && hit?.closest("a") === link
        })
        return { headingClear: heading.bottom <= list.top + 1, mediaClear: list.bottom <= media.top + 1 || list.right <= media.left + 1, linksExposed }
      })
      expect(spacing).toEqual({ headingClear: true, mediaClear: true, linksExposed: true })
      expect(samples.length).toBeGreaterThan(20)
      expect(Math.min(...samples.map(sample => sample.visible))).toBeGreaterThan(.98)
      expect(samples.filter(sample => sample.collisions.length), JSON.stringify(samples.filter(sample => sample.collisions.length))).toEqual([])
      expect(Math.min(...samples.map(sample => sample.diameter))).toBeGreaterThanOrEqual(viewport.width < 600 ? 47.5 : 63.5)
      expect(new Set(samples.map(sample => sample.diameter.toFixed(1))).size).toBeGreaterThan(8)
      expect(new Set(samples.map(sample => sample.fill)).size).toBeGreaterThan(8)
      const motion = samples.filter(sample => sample.x > 2 && sample.x < viewport.width - 2)
      expect(motion.length).toBeGreaterThan(8)
      expect(motion.every(sample => Math.abs(sample.diameter - (viewport.width < 600 ? 48 : 64)) < .5)).toBe(true)
      expect(samples.some(sample => sample.x >= viewport.width - 1 && sample.media !== "none" && sample.media !== "0px")).toBe(true)
      expect(samples.some(sample => sample.title !== sample.media && sample.title !== "none")).toBe(true)
      await testInfo.attach(`${viewport.height}-${theme}-${input}-frames.json`, { body: JSON.stringify(samples), contentType: "application/json" })
      await testInfo.attach(`${viewport.height}-${theme}-${input}-settled.png`, { body: await page.screenshot(), contentType: "image/png" })
    }
  })

  test("fresh entrance preserves first Tab and does not replay on hash, Back, or reader return", async ({ page }) => {
    await page.goto("")
    await expect(page.locator("html")).toHaveAttribute("data-home-entrance", "played")
    await page.keyboard.press("Tab")
    await expect(page.locator(".skip-link")).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.locator(".chapter-hello h1 > span").first()).toHaveCSS("translate", "none")
    await page.goto("#chapter-4")
    expect(await page.locator(".chapter-rail").evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
    await page.reload()
    await expect(page.locator("html")).not.toHaveAttribute("data-home-entrance", "played")
    await page.locator("#chapter-4 .large-text-link").click()
    await page.goBack()
    await expectScene(page, 4)
    await expect(page.locator(".chapter-hello h1 > span").first()).toHaveCSS("translate", "none")
  })

  test("reverses interrupted input and resets layers on focus, resize and reduced motion", async ({ page }) => {
    await page.goto("#chapter-0")
    await page.locator("[data-chapter-next]").click()
    await page.waitForTimeout(450)
    await page.locator("#chapter-0").focus()
    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(420)
    await page.keyboard.press("ArrowLeft")
    await expectScene(page, 0)
    await page.keyboard.press("ArrowRight")
    await page.locator("[data-menu-toggle]").focus()
    await page.waitForTimeout(1250)
    await expect(page.locator("[data-menu-toggle]")).toBeFocused()
    await expectScene(page, 1)
    await page.locator("[data-chapter-next]").click()
    await page.waitForTimeout(400)
    await page.setViewportSize({ width: 375, height: 812 })
    await expect(page.locator("#chip-overlay")).toHaveAttribute("data-animating", "false")
    await expectScene(page, 1)
    await page.locator("[data-chapter-next]").click()
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect(page.locator("#chip-overlay")).toHaveAttribute("data-animating", "false")
    expect(await page.locator(".chapter-rail").evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
  })

  test("keeps focus and final content stable with late or blocked fonts", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Focused browser checks require a base URL")
    for (const blocked of [false, true]) {
      const context = await browser.newContext({ baseURL, viewport: { width: 375, height: 667 } })
      await context.route(/\.woff2?(?:\?|$)/, async route => {
        if (blocked) await route.abort()
        else { await new Promise(resolve => setTimeout(resolve, 350)); await route.continue() }
      })
      const page = await context.newPage()
      await page.goto("en/#chapter-1", { waitUntil: "domcontentloaded" })
      const link = page.locator("#chapter-1 .chapter-project").last()
      await link.focus()
      await page.evaluate(() => document.fonts.ready)
      await expectFocusedBounds(link)
      await expectScene(page, 1)
      await expect(page.locator("#chip-overlay")).toHaveAttribute("data-animating", "false")
      expect(await page.locator("#chapter-1 h2").evaluate(element => getComputedStyle(element).visibility)).toBe("visible")
      await context.close()
    }
  })

  test("reconciles blank-area gesture cancellation without requiring focus or scroll events", async ({ page }, testInfo) => {
    const evidence = []
    for (const width of [1366, 375]) for (const gesture of ["pointerdown", "touchstart"]) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 768 })
      await page.goto("#chapter-3")
      await page.evaluate(() => document.fonts.ready)
      const chapter = page.locator("#chapter-3")
      await chapter.focus()
      const initial = await page.evaluate(chipProbe)
      await page.keyboard.press("ArrowRight")
      await page.waitForTimeout(220)
      await expect(page.locator("[data-chapter-next]")).toBeDisabled()
      const transit = await page.evaluate(chipProbe)
      await chapter.evaluate((element, type) => element.dispatchEvent(type === "pointerdown" ? new PointerEvent(type, { bubbles: true, pointerId: 1 }) : new Event(type, { bubbles: true })), gesture)
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      await expect(chapter).toBeFocused()
      await expectScene(page, 3)
      await expect(page.locator("[data-chapter-next]")).toBeEnabled()
      await expect(page.locator("#chip-overlay")).toHaveAttribute("data-animating", "false")
      const cancelled = await page.evaluate(chipProbe)
      expect(cancelled.x).toBe(initial.x)
      expect(cancelled.diameter).toBeCloseTo(initial.diameter, 1)
      expect(cancelled.paint.left).toBeCloseTo(initial.paint.left, 1)
      expect(cancelled.paint.top).toBeCloseTo(initial.paint.top, 1)
      expect(await page.locator(".chapter-rail").evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0)
      evidence.push({ width, gesture, initial, transit, cancelled })
    }
    await testInfo.attach("gesture-cancellation-geometry.json", { body: JSON.stringify(evidence), contentType: "application/json" })
  })

  test("keeps inline theme initialization and readable source order when the actual controller bundle is blocked", async ({ browser, baseURL, request }) => {
    if (!baseURL) throw new Error("Focused browser checks require a base URL")
    const html = await (await request.get(baseURL)).text()
    const source = /<script[^>]+src="([^"]*BaseLayout[^" ]+\.js)"/.exec(html)?.[1]
    if (!source) throw new Error("Missing built site controller URL")
    const controller = new URL(source, baseURL).href
    expect(await (await request.get(controller)).text()).toContain("data-chapter-rail")
    for (const height of [667, 812]) for (const route of ["", "en/"]) {
      const context = await browser.newContext({ baseURL, viewport: { width: 375, height }, colorScheme: height === 667 ? "light" : "dark" })
      let blocked = 0
      await context.route(controller, async route => { blocked++; await route.abort() })
      const page = await context.newPage()
      await page.goto(route)
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})))
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      })
      expect(blocked).toBe(1)
      await expect(page.locator("html")).toHaveAttribute("data-js", "true")
      await expect(page.locator("html")).toHaveAttribute("data-theme", height === 667 ? "light" : "dark")
      await expect(page.locator("#chip-overlay")).toBeHidden()
      expect(await page.locator(".chapter-shape").evaluate(element => element.getClientRects().length)).toBe(0)
      await expect(page.locator("[data-overview-controls]")).toBeHidden()
      const tops = await page.locator("section[data-chapter]").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top))
      expect(tops.length).toBe(5)
      expect(tops.every((top, index) => index === 0 || top > (tops[index - 1] ?? Infinity))).toBe(true)
      for (const heading of await page.locator(".chapter h1,.chapter h2").all()) {
        await heading.scrollIntoViewIfNeeded()
        await expect(heading).toBeInViewport()
        expect(await heading.evaluate(element => getComputedStyle(element).visibility)).toBe("visible")
      }
      const action = page.locator(".hello-actions a").first()
      await action.scrollIntoViewIfNeeded()
      expect(await action.evaluate(element => {
        const rect = element.getBoundingClientRect()
        return document.elementFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2)?.closest("a") === element
      })).toBe(true)
      await action.click()
      await expect(page.locator("#chapter-1 h2")).toBeInViewport()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
      await context.close()
    }
  })
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
