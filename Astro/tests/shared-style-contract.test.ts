import { readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"

const baseUrl = new URL("../src/styles/base.css", import.meta.url)
const componentsUrl = new URL("../src/styles/components.css", import.meta.url)
const designUrl = new URL("../DESIGN.md", import.meta.url)
const footerUrl = new URL("../src/components/SiteFooter.astro", import.meta.url)
const layoutUrl = new URL("../src/styles/layout.css", import.meta.url)
const homeUrl = new URL("../src/styles/home.css", import.meta.url)
const tokensUrl = new URL("../src/styles/tokens.css", import.meta.url)

function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string): number => {
    const channels = color.slice(1).match(/../g)?.map((value) => Number.parseInt(value, 16))
    if (channels?.length !== 3) throw new TypeError(`Invalid hex color: ${color}`)
    const [red, green, blue] = channels.map((channel) => {
      const normalized = channel / 255
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
    })
    if (red === undefined || green === undefined || blue === undefined) throw new TypeError(`Invalid hex color: ${color}`)
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }
  const [light, dark] = [luminance(foreground), luminance(background)].sort((left, right) => right - left)
  if (light === undefined || dark === undefined) throw new TypeError("Contrast requires two colors")
  return (light + 0.05) / (dark + 0.05)
}

describe("shared visual system contract", () => {
  it("assigns display, prose, and technical typography to their approved roles", async () => {
    // Given: the shared typography sources
    const [base, components, layout, tokens] = await Promise.all([
      readFile(baseUrl, "utf8"),
      readFile(componentsUrl, "utf8"),
      readFile(layoutUrl, "utf8"),
      readFile(tokensUrl, "utf8"),
    ])

    // When: family assignments are inspected
    const styles = `${base}\n${components}\n${layout}\n${tokens}`

    // Then: prose remains sans, headings use the editorial face, and metadata uses the code face
    expect(styles).toMatch(/body\s*\{[\s\S]*font-family: var\(--font-body\)/)
    expect(styles).toMatch(/\.intro h1\s*\{[\s\S]*font-family: var\(--font-display\)/)
    expect(styles).toMatch(/\.section-title\s*\{[\s\S]*font-family: var\(--font-display\)/)
    expect(styles).toMatch(/\.eyebrow\s*\{[\s\S]*font-family: var\(--font-mono\)/)
    expect(tokens).toContain('html[lang="en"]')
    expect(tokens).toContain('var(--font-dm-sans), "DM Sans", system-ui, sans-serif')
    expect(base).toMatch(/html\[lang="en"\] h1,[\s\S]*font-weight: 700/)
  })

  it("uses a single layered Home hero without a dedicated gradient", async () => {
    const [home, tokens] = await Promise.all([readFile(homeUrl, "utf8"), readFile(tokensUrl, "utf8")])

    expect(`${home}\n${tokens}`).not.toContain("--gradient-hero")
    expect(home).toMatch(/\.home-hero\s*\{[\s\S]*background: var\(--color-surface\)/)
    expect(home).toMatch(/\.home-background\s*\{[\s\S]*background-image: var\(--home-background-light\)/)
    expect(home).toMatch(/html\[data-theme="dark"\] \.home-background\s*\{[\s\S]*background-image: var\(--home-background-dark\)/)
    expect(home).toMatch(/\.home-background\s*\{[\s\S]*background-size: cover/)
    expect(home).toMatch(/\.home-portrait img\s*\{[\s\S]*object-fit: contain/)
  })

  it("uses semantic state cues for shared controls without a color-only disabled state", async () => {
    // Given: the shared control stylesheet
    const [base, components] = await Promise.all([readFile(baseUrl, "utf8"), readFile(componentsUrl, "utf8")])

    // When: control state selectors are inspected
    // Then: hover, press, focus, disabled, and unavailable states remain perceivable
    expect(components).toContain("button:enabled:hover")
    expect(components).toContain("button:enabled:active")
    expect(base).toContain("button:disabled")
    expect(base).toContain('[aria-disabled="true"]')
    expect(base).toContain("cursor: not-allowed")
    expect(base).toContain("filter: grayscale(1)")
    expect(base).toContain("border-style: dashed")
    expect(base).toContain("repeating-linear-gradient")
  })

  it("uses surface-appropriate semantic hover tokens with WCAG contrast", async () => {
    // Given: shared control styles and their light-theme semantic palette
    const [components, tokens] = await Promise.all([readFile(componentsUrl, "utf8"), readFile(tokensUrl, "utf8")])

    // When: hover consumers and light-theme values are inspected
    // Then: normal surfaces do not borrow footer foreground tokens and each hover foreground clears AA text contrast
    expect(components).toMatch(/\.header-button:enabled:hover[\s\S]*color: var\(--color-control-hover\)/)
    expect(components).toMatch(/\.footer-link:hover[\s\S]*color: var\(--color-on-strong-hover\)/)
    const controlHover = tokens.match(/--color-control-hover: (#[0-9a-f]{6})/i)?.[1]
    const surface = tokens.match(/--color-surface: (#[0-9a-f]{6})/i)?.[1]
    const mutedSurface = tokens.match(/--color-surface-muted: (#[0-9a-f]{6})/i)?.[1]
    const strongBorder = tokens.match(/--color-border-strong: (#[0-9a-f]{6})/i)?.[1]
    const strongHover = tokens.match(/--color-on-strong-hover: (#[0-9a-f]{6})/i)?.[1]
    const strongSurface = tokens.match(/--color-surface-strong: (#[0-9a-f]{6})/i)?.[1]
    expect(controlHover).toBeDefined()
    expect(surface).toBeDefined()
    expect(mutedSurface).toBeDefined()
    expect(strongBorder).toBeDefined()
    expect(strongHover).toBeDefined()
    expect(strongSurface).toBeDefined()
    if (!controlHover || !surface || !mutedSurface || !strongBorder || !strongHover || !strongSurface) return
    expect(contrastRatio(controlHover, surface)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(controlHover, mutedSurface)).toBeGreaterThanOrEqual(4.5)
    expect(components).toMatch(/\.dialog-close,[\s\S]*background: var\(--color-surface\)/)
    expect(contrastRatio(strongBorder, surface)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(strongHover, strongSurface)).toBeGreaterThanOrEqual(4.5)
  })

  it("keeps native route transitions bounded and disables every shared route pseudo-element under reduced motion", async () => {
    // Given: the global transition stylesheet
    const base = await readFile(baseUrl, "utf8")

    // When: view transition rules are inspected
    // Then: cross-document navigation is CSS-only, opacity/translate-only, and motion-safe
    expect(base).toContain("@view-transition")
    expect(base).toContain("navigation: auto")
    expect(base).toMatch(/::view-transition-old\(root\)[\s\S]*root-view-out/)
    expect(base).toMatch(/::view-transition-new\(root\)[\s\S]*root-view-in/)
    expect(base).toContain("translateY(-0.25rem)")
    expect(base).toContain("translateY(0.25rem)")
    expect(base).not.toMatch(/::view-transition-(?:old|new)\(root\)[\s\S]{0,240}scale\(/)
    expect(base).toMatch(/prefers-reduced-motion: reduce[\s\S]*::view-transition-old\(root\)[\s\S]*animation: none/)
  })

  it("renders approved labelled footer destinations with service-matched decorative icons", async () => {
    // Given: the shared footer source
    const footer = await readFile(footerUrl, "utf8")

    // When: its destination links are inspected
    // Then: every external Profile destination keeps readable text and its approved icon
    expect(footer).toContain('name="envelope"')
    expect(footer).toContain('icon: "github"')
    expect(footer).toContain('icon: "google-scholar"')
    expect(footer).toContain('icon: "orcid"')
    expect(footer).toContain('name="external"')
    expect(footer).toContain("target=\"_blank\"")
    expect(footer).toContain("rel=\"noopener noreferrer\"")
    expect(footer).toContain("{link.label}")
  })

  it("defines complete semantic light, dark, and no-JavaScript surface mappings", async () => {
    // Given: the design-token stylesheet
    const tokens = await readFile(tokensUrl, "utf8")

    // When: theme scopes are inspected
    // Then: each required semantic surface is available in all theme entry paths
    for (const scope of [":root", 'html[data-theme="dark"]', 'html[data-js="false"]'] as const) {
      const start = tokens.indexOf(scope)
      expect(start).toBeGreaterThanOrEqual(0)
      const values = tokens.slice(start, start + 1_500)
      for (const token of ["--color-canvas", "--color-surface", "--color-text", "--color-border", "--color-accent", "--color-focus"]) {
        expect(values).toContain(token)
      }
    }
  })

  it("keeps the shared prose measure within the documented reading range", async () => {
    // Given: the shared prose width token and base body font size
    const tokens = await readFile(tokensUrl, "utf8")

    // When: the maximum prose measure is converted from rem to the default body size
    const proseMax = tokens.match(/--prose-max: (\d+)rem/)?.[1]

    // Then: normal prose remains between 45 and 68 characters at the 1rem body baseline
    expect(proseMax).toBeDefined()
    if (!proseMax) return
    expect(Number.parseInt(proseMax, 10)).toBeGreaterThanOrEqual(45)
    expect(Number.parseInt(proseMax, 10)).toBeLessThanOrEqual(68)
  })

  it("keeps documented theme tokens, font budgets, and navigation breakpoint aligned with the approved contract", async () => {
    // Given: the implementation style sources and their public design contract
    const [design, tokens] = await Promise.all([
      readFile(designUrl, "utf8"),
      readFile(tokensUrl, "utf8"),
    ])

    // When: the approved shared-system values are inspected

    // Then: documented constraints match the tested values for themes, transfer, measure, and navigation
    for (const scope of [":root", 'html[data-theme="dark"]'] as const) {
      const start = tokens.indexOf(scope)
      expect(start).toBeGreaterThanOrEqual(0)
      const values = tokens.slice(start, start + 1_500)
      expect(values).toContain("--color-control-hover")
      expect(values).toContain("--color-on-strong-hover")
    }
    expect(design).toContain("--prose-max: 45rem")
    expect(design).toContain("`--color-control-hover`")
    expect(design).toContain("`--color-on-strong-hover`")
    expect(design).toContain("Google Sans Code")
    expect(design).toContain("42 MiB")
    expect(design).toContain("6 MiB")
    expect(design).toContain("256 KiB")
    expect(design).toContain("Inline primary navigation appears at `>=1024px`.")
  })
})
