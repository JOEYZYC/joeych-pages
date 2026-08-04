import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import astroConfig from "../astro.config"

describe("Astro configuration", () => {
  it("uses the approved static publication contract", () => {
    // Given: the checked-in Astro configuration
    const expectedPublicDir = fileURLToPath(new URL("../../Profile/media/", import.meta.url))

    // When: Vitest loads the configuration module
    const config = astroConfig

    // Then: Astro builds the approved project URL from shared public media
    expect(config).toMatchObject({
      output: "static",
      site: "https://joeyzyc.github.io",
      base: "/joeych-pages",
      trailingSlash: "always",
      publicDir: expectedPublicDir,
    })
  })
})
