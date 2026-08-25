import { readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"

import { BASE_PATH, CANONICAL_ROUTES, SITE_ORIGIN, THEMES, VIEWPORTS } from "./e2e/support/site-matrix"

const ASTRO_ROOT = new URL("../", import.meta.url)

describe("Playwright visual infrastructure", () => {
  it("defines the deterministic route matrix and screenshot policy", async () => {
    // Given: the checked-in Playwright configuration and E2E support boundary
    const config = await readFile(new URL("playwright.config.ts", ASTRO_ROOT), "utf8")
    const packageJson = await readFile(new URL("package.json", ASTRO_ROOT), "utf8")

    // When: visual infrastructure is inspected without starting a browser
    const supportFiles = await Promise.all([
      readFile(new URL("tests/e2e/support/site-matrix.ts", ASTRO_ROOT), "utf8"),
      readFile(new URL("tests/e2e/support/test-helpers.ts", ASTRO_ROOT), "utf8"),
    ])

    // Then: route, capture, and artifact policies remain explicit and deterministic
    expect(CANONICAL_ROUTES).toEqual([
      { path: "", locale: "zh", counterpart: "/en/", canonical: "https://joeyzyc.github.io/joeych-pages/" },
      { path: "en/", locale: "en", counterpart: "/", canonical: "https://joeyzyc.github.io/joeych-pages/en/" },
      { path: "about/", locale: "zh", counterpart: "/en/about/", canonical: "https://joeyzyc.github.io/joeych-pages/about/" },
      { path: "en/about/", locale: "en", counterpart: "/about/", canonical: "https://joeyzyc.github.io/joeych-pages/en/about/" },
      { path: "projects/", locale: "zh", counterpart: "/en/projects/", canonical: "https://joeyzyc.github.io/joeych-pages/projects/" },
      { path: "en/projects/", locale: "en", counterpart: "/projects/", canonical: "https://joeyzyc.github.io/joeych-pages/en/projects/" },
      { path: "tech-stack/", locale: "zh", counterpart: "/en/tech-stack/", canonical: "https://joeyzyc.github.io/joeych-pages/tech-stack/" },
      { path: "en/tech-stack/", locale: "en", counterpart: "/tech-stack/", canonical: "https://joeyzyc.github.io/joeych-pages/en/tech-stack/" },
    ])
    expect({ BASE_PATH, SITE_ORIGIN, THEMES, VIEWPORTS }).toEqual({
      BASE_PATH: "/joeych-pages",
      SITE_ORIGIN: "https://joeyzyc.github.io",
      THEMES: ["light", "dark"],
      VIEWPORTS: [
        { name: "mobile", width: 375, height: 812 },
        { name: "tablet", width: 768, height: 1024 },
        { name: "desktop", width: 1280, height: 900 },
      ],
    })
    expect(supportFiles.join("\n")).toContain("document.fonts.ready")
    expect(config).toContain(".omo/evidence/playwright")
    expect(config).toContain("__screenshots__")
    expect(config).toContain("{projectName}-{platform}")
    expect(config).toContain("animations: \"disabled\"")
    expect(config).toContain("caret: \"hide\"")
    expect(config).toContain("maxDiffPixelRatio: 0.005")
    expect(packageJson).toContain('"test:e2e:visual": "playwright test tests/e2e/visual.spec.ts"')
  })

  it("keeps permanent tests free of task-specific evidence paths", async () => {
    // Given: permanent test sources and the retired task-evidence path segment
    const taskEvidenceSegment = ["astro", "visual", "modernization"].join("-")
    const testFiles = [
      "tests/icon-contract.test.ts",
      "tests/e2e/accessibility.spec.ts",
      "tests/e2e/font-network.spec.ts",
      "tests/e2e/artifact-audit.spec.ts",
    ]

    // When: permanent test sources are inspected for task-bound output paths
    const sources = await Promise.all(testFiles.map(async (path) => ({
      path,
      source: await readFile(new URL(path, ASTRO_ROOT), "utf8"),
    })))

    // Then: no checked-in test can write evidence into a completed task directory
    expect(sources.filter(({ source }) => source.includes(taskEvidenceSegment)).map(({ path }) => path)).toEqual([])
  })
})
