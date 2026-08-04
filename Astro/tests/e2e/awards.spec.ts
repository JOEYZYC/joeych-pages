import { expect, test } from "@playwright/test"

const routes = [
  { path: "awards/", heading: "获奖证书", language: "zh-CN" },
  { path: "en/awards/", heading: "Awards", language: "en" },
] as const

test.describe("awards archive", () => {
  for (const route of routes) {
    test(`renders the canonical archive in ${route.language}`, async ({ page }) => {
      // Given: the locale-specific awards route
      await page.goto(route.path)

      // When: canonical Profile records are rendered
      const awards = page.locator("[data-award-id]")

      // Then: the route exposes its localized archive and source-order records
      await expect(page.locator("html")).toHaveAttribute("lang", route.language)
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible()
      await expect(awards).toHaveCount(10)
      await expect(awards.first()).toHaveAttribute("data-award-id", "ic-vocational-national-third-2025")
      await expect(page.locator("[data-research-kind='publication']")).toHaveCount(6)
      await expect(page.locator("[data-research-kind='patent']")).toHaveCount(4)
      await expect(page.locator("[data-research-kind='thesis']")).toHaveCount(1)
    })
  }

  test("keeps certificate galleries independent and restores keyboard focus", async ({ page }) => {
    // Given: two records with separate certificate galleries
    await page.goto("awards/")
    const awardTrigger = page.locator("#awards-award-renesas-east-first-national-third-2024-trigger")

    // When: the award certificate dialog opens and closes from the keyboard
    await awardTrigger.focus()
    await page.keyboard.press("Enter")
    const awardDialog = page.locator("#awards-award-renesas-east-first-national-third-2024-dialog")
    await expect(awardDialog).toBeVisible()
    await expect(awardDialog.getByRole("button", { name: "下一张证书" })).toBeEnabled()
    await page.keyboard.press("Escape")

    // Then: focus returns to the source and the publication gallery remains closed
    await expect(awardTrigger).toBeFocused()
    await expect(page.locator("#awards-publication-bifunctional-flexible-metasurface-dialog")).not.toBeVisible()
  })

  test("does not create certificate controls for records without evidence", async ({ page }) => {
    // Given: a source-backed record with an empty certificate collection
    await page.goto("en/awards/")

    // When: the archive is available
    const record = page.locator("[data-research-id='tri-band-metasurface-absorber']")

    // Then: its source content stays visible without an empty control
    await expect(record).toContainText("A Tri-band Metasurface Absorber")
    await expect(record.getByRole("button")).toHaveCount(0)
  })
})
