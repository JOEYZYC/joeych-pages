import { createHash } from "node:crypto"
import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "@playwright/test"

import { CANONICAL_ROUTES } from "./support/site-matrix"

const distPath = fileURLToPath(new URL("../../dist/", import.meta.url))
const siteOrigin = "http://127.0.0.1:4321"
const basePath = "/joeych-pages/"
const coldTransferLimit = 6 * 1024 * 1024
const googleSansCodeLimit = 256 * 1024
const googleSansCodeSource = "@fontsource-variable/google-sans-code/files/google-sans-code-latin-wght-normal.woff2"
const forbiddenHosts = ["fonts.googleapis.com", "fonts.gstatic.com", "use.typekit.net", "kit.fontawesome.com", "use.fontawesome.com"]

type FontRequest = {
  readonly cacheControl: string | null
  readonly bytes: number
  readonly status: number
  readonly url: string
}

type GoogleSansCodeSelection = {
  readonly assets: readonly FontRequest[]
  readonly sha256: string
  readonly source: string
  readonly totalBytes: number
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex")
}

function assertGoogleSansCodeBudget(assets: readonly Pick<FontRequest, "bytes">[]): void {
  expect(assets).toHaveLength(1)
  expect(assets.reduce((total, asset) => total + asset.bytes, 0)).toBeLessThanOrEqual(googleSansCodeLimit)
}

async function selectGoogleSansCode(fonts: readonly FontRequest[]): Promise<GoogleSansCodeSelection> {
  const sourcePath = join(process.cwd(), "node_modules", googleSansCodeSource)
  const sourceDigest = sha256(await readFile(sourcePath))
  const candidates = await Promise.all(fonts.map(async (font) => {
    const pathname = new URL(font.url).pathname
    const assetPath = pathname.slice(basePath.length)
    return { font, sha256: sha256(await readFile(join(distPath, assetPath))) }
  }))
  const assets = candidates
    .filter((candidate) => candidate.sha256 === sourceDigest)
    .map((candidate) => candidate.font)
  return {
    assets,
    sha256: sourceDigest,
    source: googleSansCodeSource,
    totalBytes: assets.reduce((total, asset) => total + asset.bytes, 0),
  }
}

test.describe("local font and icon network budgets", () => {
  test.describe.configure({ mode: "serial" })

  test("records local WOFF2 transfer details across Chinese and English routes", async ({ page }, testInfo) => {
    // Given: a cold browser page observing every route resource
    const fontResponses = new Map<string, Omit<FontRequest, "bytes">>()
    const remoteRequests: string[] = []
    page.on("response", (response) => {
      const url = response.url()
      if (new URL(url).origin !== siteOrigin) remoteRequests.push(url)
      const contentType = response.headers()["content-type"] ?? ""
      if ((contentType.includes("font") || url.endsWith(".woff2")) && response.status() === 200) {
        fontResponses.set(url, {
          url,
          status: response.status(),
          cacheControl: response.headers()["cache-control"] ?? null,
        })
      }
    })

    // When: Chinese and English route families load with their local font faces
    for (const route of CANONICAL_ROUTES) {
      await page.goto(route.path, { waitUntil: "load" })
      await page.evaluate(async () => document.fonts.ready)
    }

    // Then: fonts and icons stay local, base-aware, and below the approved limits
    const orderedFonts = (await Promise.all([...fontResponses.values()].map(async (font) => {
      const pathname = new URL(font.url).pathname
      const assetPath = pathname.slice(basePath.length)
      return { ...font, bytes: (await stat(join(distPath, assetPath))).size }
    }))).sort((left, right) => left.url.localeCompare(right.url))
    const transferBytes = orderedFonts.reduce((total, font) => total + font.bytes, 0)
    const astroConfigSource = await readFile(new URL("../../astro.config.ts", import.meta.url), "utf8")
    const googleSansCode = await selectGoogleSansCode(orderedFonts)
    expect(orderedFonts).not.toHaveLength(0)
    expect(orderedFonts.every((font) => font.status === 200 && font.url.startsWith(`${siteOrigin}${basePath}`))).toBe(true)
    expect(remoteRequests).toEqual([])
    expect(orderedFonts.every((font) => !forbiddenHosts.some((host) => font.url.includes(host)))).toBe(true)
    expect(astroConfigSource).toContain(googleSansCode.source)
    assertGoogleSansCodeBudget(googleSansCode.assets)
    expect(transferBytes).toBeLessThanOrEqual(coldTransferLimit)
    await testInfo.attach("font-budget.json", {
      body: JSON.stringify({ fonts: orderedFonts, googleSansCode, transferBytes }, null, 2),
      contentType: "application/json",
    })
  })

  test("rejects a test-owned remote font host without routing it", () => {
    // Given: a remote font request fixture that never enters the page or product routes
    const fixture = "https://fonts.googleapis.com/css2?family=Fixture"

    // When: the network policy evaluates its URL
    const isAllowed = new URL(fixture).origin === siteOrigin && fixture.startsWith(`${siteOrigin}${basePath}`)

    // Then: the forbidden host is rejected without adding a request listener or route
    expect(isAllowed).toBe(false)
    expect(forbiddenHosts.some((host) => fixture.includes(host))).toBe(true)
  })

  test("rejects empty and oversized Google Sans Code selections", () => {
    // Given: test-owned selections that violate the configured face budget
    const emptySelection: readonly Pick<FontRequest, "bytes">[] = []
    const oversizedSelection = [{ bytes: googleSansCodeLimit + 1 }] as const

    // When: the same budget assertion evaluates each invalid selection

    // Then: neither a vacuous selection nor an oversized selected face can pass
    expect(() => assertGoogleSansCodeBudget(emptySelection)).toThrow()
    expect(() => assertGoogleSansCodeBudget(oversizedSelection)).toThrow()
  })
})
