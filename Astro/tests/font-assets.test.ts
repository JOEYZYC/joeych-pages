import { access, readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"

import astroConfig from "../astro.config"

const packageUrl = new URL("../package.json", import.meta.url)
const fontStylesUrl = new URL("../src/styles/fonts.css", import.meta.url)
const baseLayoutUrl = new URL("../src/layouts/BaseLayout.astro", import.meta.url)
const fontAttributionUrl = new URL("../THIRD_PARTY_FONTS.md", import.meta.url)
const iconAttributionUrl = new URL("../THIRD_PARTY_ICONS.md", import.meta.url)

const requiredPackages = {
  "@free-fonts/jigmo-sc": "1.0.1",
  "@fontsource-variable/google-sans-code": "5.3.0",
  "@fortawesome/fontawesome-svg-core": "7.3.1",
  "@fortawesome/free-solid-svg-icons": "7.3.1",
  "@fortawesome/free-brands-svg-icons": "7.3.1",
} as const

describe("local typography and icon asset contract", () => {
  it("bundles the approved local font and icon assets with their attribution", async () => {
    // Given: the approved static typography and icon asset policy
    const packageManifest: unknown = JSON.parse(await readFile(packageUrl, "utf8"))

    // When: the build inputs and local provenance records are inspected
    const [fontStyles, baseLayout, fontAttribution, iconAttribution] = await Promise.all([
      readFile(fontStylesUrl, "utf8"),
      readFile(baseLayoutUrl, "utf8"),
      readFile(fontAttributionUrl, "utf8"),
      readFile(iconAttributionUrl, "utf8"),
    ])

    // Then: static output has only the approved local font source and credited icon packages
    expect(packageManifest).toMatchObject({ dependencies: requiredPackages })
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
    expect(fontStyles).toContain("@free-fonts/jigmo-sc")
    expect(baseLayout).toContain('<Font cssVariable="--font-google-sans-code" preload />')
    expect(fontAttribution).toContain("Source Han Serif")
    expect(iconAttribution).toContain("Font Awesome Free")
  })

  it("keeps the local attribution records present", async () => {
    // Given: the required repository-local provenance documents
    const attributionFiles = [fontAttributionUrl, iconAttributionUrl]

    // When: the static asset documentation is resolved
    const availability = await Promise.all(attributionFiles.map((file) => access(file)))

    // Then: every dependency role can be audited from the repository
    expect(availability).toHaveLength(2)
  })
})
