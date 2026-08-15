import { readFile } from "node:fs/promises"

import { z } from "astro/zod"
import { describe, expect, it } from "vitest"

import astroConfig from "../astro.config"

const packageUrl = new URL("../package.json", import.meta.url)
const fontStylesUrl = new URL("../src/styles/fonts.css", import.meta.url)
const baseLayoutUrl = new URL("../src/layouts/BaseLayout.astro", import.meta.url)
const fontAttributionUrl = new URL("../THIRD_PARTY_FONTS.md", import.meta.url)
const iconAttributionUrl = new URL("../THIRD_PARTY_ICONS.md", import.meta.url)
const jigmoCssUrl = new URL("../node_modules/@free-fonts/jigmo-sc/jigmo-sc.css", import.meta.url)

const packageManifestSchema = z.object({ dependencies: z.record(z.string(), z.string()) })

const requiredPackages = {
  "@free-fonts/jigmo-sc": "1.0.1",
  "@fontsource-variable/google-sans-code": "5.3.0",
  "@fortawesome/fontawesome-svg-core": "7.3.1",
  "@fortawesome/free-solid-svg-icons": "7.3.1",
  "@fortawesome/free-brands-svg-icons": "7.3.1",
} as const

const forbiddenPackages = [
  "@fortawesome/fontawesome-free",
  "@fortawesome/free-regular-svg-icons",
  "@fortawesome/pro-duotone-svg-icons",
  "@fortawesome/pro-light-svg-icons",
  "@fortawesome/pro-regular-svg-icons",
  "@fortawesome/pro-sharp-solid-svg-icons",
  "@fortawesome/pro-solid-svg-icons",
  "@fortawesome/pro-thin-svg-icons",
] as const

const forbiddenRuntimeHosts = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "use.typekit.net",
  "kit.fontawesome.com",
  "use.fontawesome.com",
] as const

function getFontFamilies(css: string): readonly string[] {
  return [
    ...new Set(
      [...css.matchAll(/font-family:\s*['"]([^'"]+)['"]/g)].flatMap((match) =>
        match[1] === undefined ? [] : [match[1]],
      ),
    ),
  ].sort()
}

function getDocumentedFamilies(document: string): readonly string[] {
  return [...document.matchAll(/^## Family: (.+)$/gm)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  ).sort()
}

function getCssUrls(css: string): readonly string[] {
  return [...css.matchAll(/url\((?:['"])?([^'")]+)(?:['"])?\)/g)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  )
}

describe("local typography and icon asset contract", () => {
  it("documents every family emitted by the configured local font sources", async () => {
    // Given: the actual package CSS and Astro local-font configuration
    const [jigmoCss, fontAttribution] = await Promise.all([
      readFile(jigmoCssUrl, "utf8"),
      readFile(fontAttributionUrl, "utf8"),
    ])
    const emittedFamilies = [...getFontFamilies(jigmoCss), "Google Sans Code"].sort()

    // When: declared faces are compared with provenance records
    const documentedFamilies = getDocumentedFamilies(fontAttribution)

    // Then: each emitted family has one attributable provenance section
    expect(emittedFamilies).toEqual(["Google Sans Code", "Jigmo SC", "Source Han Serif SC", "Source Serif 4"])
    expect(documentedFamilies).toEqual(emittedFamilies)
  })

  it("pins only approved local font and icon dependencies", async () => {
    // Given: the checked-in dependency manifest
    const packageManifest = packageManifestSchema.parse(JSON.parse(await readFile(packageUrl, "utf8")))

    // When: direct dependencies are inspected
    const dependencies = packageManifest.dependencies

    // Then: exact required packages are present and forbidden icon packages are absent
    expect(dependencies).toMatchObject(requiredPackages)
    for (const packageName of forbiddenPackages) {
      expect(dependencies).not.toHaveProperty(packageName)
    }
  })

  it("uses local font sources and a single preloaded Google Sans Code face", async () => {
    // Given: checked-in style, layout, and Astro configuration sources
    const [fontStyles, baseLayout, jigmoCss] = await Promise.all([
      readFile(fontStylesUrl, "utf8"),
      readFile(baseLayoutUrl, "utf8"),
      readFile(jigmoCssUrl, "utf8"),
    ])

    // When: font URLs and the Astro local provider configuration are inspected
    const configuredSources = `${fontStyles}\n${baseLayout}`
    const localCssUrls = getCssUrls(jigmoCss)

    // Then: no runtime source leaves the local build and only the approved Latin face is preloaded
    expect(fontStyles.trim()).toBe('@import "@free-fonts/jigmo-sc/jigmo-sc.css";')
    expect(localCssUrls).not.toHaveLength(0)
    expect(localCssUrls.every((url) => !/^https?:\/\//.test(url))).toBe(true)
    expect(baseLayout).toContain('<Font cssVariable="--font-google-sans-code" preload />')
    expect(astroConfig.fonts).toEqual([
      expect.objectContaining({
        name: "Google Sans Code",
        cssVariable: "--font-google-sans-code",
        weights: ["300 800"],
        styles: ["normal"],
        display: "swap",
        options: {
          variants: [
            {
              src: ["@fontsource-variable/google-sans-code/files/google-sans-code-latin-wght-normal.woff2"],
              weight: "300 800",
              style: "normal",
            },
          ],
        },
      }),
    ])
    for (const host of forbiddenRuntimeHosts) {
      expect(configuredSources).not.toContain(host)
    }
  })

  it("retains Font Awesome licensing, attribution, and trademark requirements", async () => {
    // Given: the local Font Awesome provenance record
    const iconAttribution = await readFile(iconAttributionUrl, "utf8")

    // When: the icon license contract is inspected

    // Then: core, artwork, immutable provenance, and no-endorsement requirements remain auditable
    expect(iconAttribution).toContain("@fortawesome/fontawesome-svg-core@7.3.1")
    expect(iconAttribution).toContain("@fortawesome/free-solid-svg-icons@7.3.1")
    expect(iconAttribution).toContain("@fortawesome/free-brands-svg-icons@7.3.1")
    expect(iconAttribution).toContain("MIT")
    expect(iconAttribution).toContain("CC BY 4.0")
    expect(iconAttribution).toContain("14c65a3747d0f3b751f15831fc719236aea8729d")
    expect(iconAttribution).toContain("trademarks")
    expect(iconAttribution).toContain("does not claim affiliation")
    expect(iconAttribution).toContain("CDN, Kit, account, token, Pro package")
  })
})
