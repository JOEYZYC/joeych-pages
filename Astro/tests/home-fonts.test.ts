import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { z } from "astro/zod"
import { describe, expect, it } from "vitest"

const fontRoot = new URL("../src/assets/fonts/home/", import.meta.url)
const inventorySchema = z.object({
  inputHashNormalization: z.literal("utf8-lf"),
  inputs: z.array(z.object({ path: z.string(), sha256: z.string() })),
  characters: z.string(),
})

describe("site-wide derived font contract", () => {
  it("ships actual local WOFF fonts and full license notices without local() dependence", async () => {
    let total = 0
    for (const name of ["home-maple-600.woff", "home-noto-400.woff", "home-noto-600.woff"]) {
      const bytes = await readFile(new URL(name, fontRoot))
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("wOFF")
      total += bytes.length
    }
    expect(total).toBeLessThan(1024 * 1024)
    for (const name of ["maple-OFL.txt", "noto-OFL.txt"]) {
      expect(await readFile(new URL(name, fontRoot), "utf8")).toContain("SIL OPEN FONT LICENSE")
    }
    const [styles, page] = await Promise.all([
      readFile(new URL("../src/styles/chip.css", import.meta.url), "utf8"),
      readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8"),
    ])
    expect(styles).toContain('font-family: "Home Maple Subset"')
    expect(styles).toContain('font-family: "Home Noto Subset"')
    expect(styles).not.toContain("local(")
    expect(styles).not.toMatch(/https?:/)
    for (const name of ["NOTICE.txt", "maple-OFL.txt", "noto-OFL.txt"]) expect(page).toContain(`${name}?raw`)
  })
  it("requires glyph inventory to match the current public input files", async () => {
    const inventory = inventorySchema.parse(JSON.parse(await readFile(new URL("glyphs.json", fontRoot), "utf8")))
    for (const input of inventory.inputs) {
      const source = await readFile(new URL(`../../${input.path}`, import.meta.url), "utf8")
      const normalized = source.replace(/\r\n?/g, "\n")
      expect(createHash("sha256").update(normalized, "utf8").digest("hex"), input.path).toBe(input.sha256)
    }
    for (const character of "充满热情的电子工程师") expect(inventory.characters).toContain(character)
  })
})
