import { expect, test } from "@playwright/test"

import { getProfileData } from "../../src/lib/profile-data"

const routes = [
  {
    path: "awards/",
    locale: "zh",
    heading: "获奖证书",
    language: "zh-CN",
    summary: "按年份查阅竞赛荣誉、出版成果、专利与毕业论文。",
    ledger: "获奖档案",
    research: "研究档案",
  },
  {
    path: "en/awards/",
    locale: "en",
    heading: "Awards",
    language: "en",
    summary: "Review awards, publications, patents, and thesis evidence by year.",
    ledger: "Achievement ledger",
    research: "Research archive",
  },
] as const

test.describe("awards archive", () => {
  for (const route of routes) {
    test(`renders source-order Bento evidence with uniform literal prizes in ${route.language}`, async ({ page }) => {
      const data = await getProfileData()
      await page.goto(route.path)
      const awards = page.locator("[data-award-id]")
      const research = page.locator("[data-research-kind]")

      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible()
      await expect(page.locator(".intro > p:not(.eyebrow)")).toHaveText(route.summary)
      await expect(page.locator(".achievement-ledger .eyebrow")).toHaveText(route.ledger)
      await expect(page.locator(".research-archive .eyebrow")).toHaveText(route.research)
      await expect(page.locator('.achievement-ledger > .archive-heading svg[data-icon="trophy"]')).toHaveCount(1)
      await expect(page.locator('.research-section--publications > header svg[data-icon="book-open"]')).toHaveCount(1)
      await expect(page.locator('.research-section--patents > header svg[data-icon="lightbulb"]')).toHaveCount(1)
      await expect(page.locator('.research-section--thesis > header svg[data-icon="file-lines"]')).toHaveCount(1)
      await expect(awards).toHaveCount(data.awards.length)
      expect(await awards.evaluateAll((elements) => elements.map((element) => element.getAttribute("data-award-id")))).toEqual(
        data.awards.map((award) => award.id),
      )
      expect(await research.evaluateAll((elements) => elements.map((element) => ({
        id: element.getAttribute("data-research-id"),
        kind: element.getAttribute("data-research-kind"),
      })))).toEqual([
        ...data.publications.map((publication) => ({ id: publication.id, kind: "publication" })),
        ...data.patents.map((patent) => ({ id: patent.id, kind: "patent" })),
        { id: data.thesis.id, kind: "thesis" },
      ])

      for (const award of data.awards) {
        const panel = page.locator(`[data-award-id="${award.id}"]`)
        await expect(panel.locator(".award-prize")).toHaveText(award.prizes.map((prize) => prize[route.locale]))
        await expect(panel).toHaveAttribute("data-award-featured", String(award.featured))
      }
      await expect(page.locator(".award-prize--top-tier")).toHaveCount(0)
      expect([
        ...data.awards,
        ...data.publications,
        ...data.patents,
        data.thesis,
      ].every((record) => record.links.length === 0)).toBe(true)
      await expect(page.locator(".archive-link")).toHaveCount(0)
      await expect(page.locator(".unavailable-link")).toHaveCount(0)
    })
  }

  test("certificate galleries expose loading, error, boundaries, and focus restoration", async ({ page }) => {
    await page.goto("en/awards/")
    const trigger = page.locator("#awards-award-renesas-east-first-national-third-2024-trigger")
    const dialog = page.locator("#awards-award-renesas-east-first-national-third-2024-dialog")
    const previous = dialog.locator("[data-certificate-previous]")
    const next = dialog.locator("[data-certificate-next]")
    const caption = dialog.locator("[data-certificate-caption]")
    const announcement = dialog.locator("[data-certificate-announcement]")

    await expect(trigger.locator('svg[data-icon="certificate"]')).toHaveCount(1)
    await expect(trigger).toContainText("View certificate")
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(dialog).toBeVisible()
    await expect(dialog.locator("h2")).toBeFocused()
    await expect(dialog.locator('[data-certificate-close] svg[data-icon="xmark"]')).toHaveCount(1)
    await expect(previous.locator('svg[data-icon="chevron-left"]')).toHaveCount(1)
    await expect(next.locator('svg[data-icon="chevron-right"]')).toHaveCount(1)
    await expect(dialog.locator("[data-certificate-loading]")).toBeHidden()
    await expect(previous).toBeDisabled()
    await expect(next).toBeEnabled()
    await expect(caption).toHaveText("Electronic Design Contest (Renesas) — Eastern-China First")
    await expect(announcement).toHaveText("Electronic Design Contest (Renesas) — Eastern-China First")

    await next.click()
    await expect(previous).toBeEnabled()
    await expect(next).toBeDisabled()
    await expect(caption).toHaveText("Electronic Design Contest (Renesas) — National Third")
    await expect(announcement).toHaveText("Electronic Design Contest (Renesas) — National Third")

    await dialog.locator("[data-certificate-image]").dispatchEvent("error")
    await expect(dialog.locator("[data-certificate-image]")).toBeHidden()
    await expect(dialog.locator("[data-certificate-unavailable]")).toHaveText("Certificate unavailable")
    await expect(dialog.locator("[data-certificate-unavailable]")).toBeVisible()
    await expect(announcement).toHaveText("Certificate unavailable")
    await expect(caption).toHaveText("Electronic Design Contest (Renesas) — National Third")

    await previous.click()
    await expect(dialog.locator("[data-certificate-unavailable]")).toBeHidden()
    await expect(caption).toHaveText("Electronic Design Contest (Renesas) — Eastern-China First")

    await page.keyboard.press("Escape")
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await expect(page.locator("#awards-publication-bifunctional-flexible-metasurface-dialog")).not.toBeVisible()
  })

  test("certificate dialogs close only for clicks outside their visible bounds", async ({ page }) => {
    await page.goto("en/awards/")
    const trigger = page.locator("#awards-award-renesas-east-first-national-third-2024-trigger")
    const dialog = page.locator("#awards-award-renesas-east-first-national-third-2024-dialog")
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

  test("records without certificate evidence expose no trigger or fallback", async ({ page }) => {
    await page.goto("en/awards/")
    const publication = page.locator('[data-research-id="tri-band-metasurface-absorber"]')
    const patent = page.locator('[data-research-id="vo2-broadband-absorber"]')
    const thesis = page.locator('[data-research-kind="thesis"]')

    await expect(publication).toContainText("A Tri-band Metasurface Absorber")
    await expect(publication.locator("[data-certificate-dialog-root]")).toHaveCount(0)
    await expect(patent.locator("[data-certificate-dialog-root]")).toHaveCount(0)
    await expect(thesis.locator("[data-certificate-dialog-root]")).toHaveCount(0)
  })
})
