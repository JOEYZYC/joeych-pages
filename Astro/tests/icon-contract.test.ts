import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { icon } from "@fortawesome/fontawesome-svg-core"
import { describe, expect, it } from "vitest"

import { UI } from "../src/i18n/ui"
import { ICONS, type IconName } from "../src/lib/icons"

const APPROVED_ICON_NAMES = [
  "house",
  "bars",
  "language",
  "envelope",
  "sun",
  "moon",
  "xmark",
  "chevron-left",
  "chevron-right",
  "certificate",
  "trophy",
  "graduation-cap",
  "book-open",
  "lightbulb",
  "file-lines",
  "microchip",
  "link",
  "arrow-right",
  "external",
  "github",
  "google-scholar",
  "orcid",
] as const satisfies readonly IconName[]

const iconMapUrl = new URL("../src/lib/icons.ts", import.meta.url)
const iconComponentUrl = new URL("../src/components/Icon.astro", import.meta.url)
const componentsDirectory = fileURLToPath(new URL("../src/components/", import.meta.url))
const forbiddenPatterns = [
  /\bfas\b/,
  /\bfab\b/,
  /library\.add/,
  /dom\.watch/,
  /fontawesome-free/,
  /free-regular/,
  /pro-/,
  /kit\.fontawesome/,
  /use\.fontawesome/,
] as const

describe("localized route and build-time icon contract", () => {
  it("provides exact UI-owned route summaries without duplicating the Profile-backed home summary", () => {
    // Given: the route copy approved for the shared UI manifest
    const expected = {
      zh: {
        experience: "按时间查看教育经历与校园实践。",
        awards: "按年份查阅竞赛荣誉、出版成果、专利与毕业论文。",
        projects: "按项目类别与项目名称筛选，查看完整的工程实践、贡献与图文证据。",
        "tech-stack": "按技能领域查看对应组件、能力语境与项目证据。",
      },
      en: {
        experience: "Review education and campus experience in chronological order.",
        awards: "Review awards, publications, patents, and thesis evidence by year.",
        projects: "Filter by project category and name to inspect complete engineering work, contributions, and supporting figures.",
        "tech-stack": "Browse technical capabilities by domain with their components, context, and project evidence.",
      },
    } as const

    // When: route summaries are selected for each locale
    const actual = {
      zh: {
        experience: UI.zh.routeIntros.experience.summary,
        awards: UI.zh.routeIntros.awards.summary,
        projects: UI.zh.routeIntros.projects.summary,
        "tech-stack": UI.zh.routeIntros["tech-stack"].summary,
      },
      en: {
        experience: UI.en.routeIntros.experience.summary,
        awards: UI.en.routeIntros.awards.summary,
        projects: UI.en.routeIntros.projects.summary,
        "tech-stack": UI.en.routeIntros["tech-stack"].summary,
      },
    }

    // Then: exact copy remains localized and Home remains source-backed
    expect(actual).toEqual(expected)
    expect("summary" in UI.zh.routeIntros.home).toBe(false)
    expect("summary" in UI.en.routeIntros.home).toBe(false)
  })

  it("defines the closed Font Awesome vocabulary as local decorative SVG", async () => {
    // Given: every approved icon name
    const names = APPROVED_ICON_NAMES

    // When: SVG Core renders the mapped definitions at build time
    const rendered = names.map((name) => ({
      name,
      html: icon(ICONS[name], { attributes: { "aria-hidden": "true", focusable: "false" } }).html.join(""),
    }))

    // Then: each local SVG is nonempty, currentColor, and semantically decorative
    expect(Object.keys(ICONS)).toEqual(names)
    for (const { name, html } of rendered) {
      expect(html).toContain("<svg")
      expect(html).toContain(`data-icon="${ICONS[name].iconName}"`)
      expect(html).toContain("currentColor")
      expect(html).toContain('aria-hidden="true"')
      expect(html).toContain('focusable="false"')
    }

  })

  it("uses direct definitions and a build-time-only SVG component", async () => {
    // Given: the icon map and Astro component sources
    const [iconMap, iconComponent] = await Promise.all([
      readFile(iconMapUrl, "utf8"),
      readFile(iconComponentUrl, "utf8"),
    ])

    // When: implementation policy is inspected
    const implementation = `${iconMap}\n${iconComponent}`

    // Then: no registry, whole style, client injection, or unapproved API is present
    expect(iconMap).toContain('from "@fortawesome/free-solid-svg-icons"')
    expect(iconMap).toContain('from "@fortawesome/free-brands-svg-icons"')
    expect(iconComponent).toContain('import { icon } from "@fortawesome/fontawesome-svg-core"')
    expect(iconComponent).toContain("<Fragment set:html={svg} />")
    for (const pattern of forbiddenPatterns) expect(implementation).not.toMatch(pattern)
  })

  it("keeps every component on the closed icon-name boundary", async () => {
    // Given: every Astro component source file
    const [iconComponent, componentEntries] = await Promise.all([
      readFile(iconComponentUrl, "utf8"),
      readdir(componentsDirectory, { recursive: true }),
    ])
    const componentPaths = componentEntries
      .filter((path) => path.endsWith(".astro"))
      .map((path) => join(componentsDirectory, path))
    const componentSources = await Promise.all(componentPaths.map(async (path) => ({ path, source: await readFile(path, "utf8") })))

    // When: component interfaces and Icon calls are inspected
    const allSources = componentSources.map(({ source }) => source).join("\n")

    // Then: raw definitions cannot cross from a consumer into Icon
    expect(iconComponent).toMatch(/readonly name: IconName/)
    expect(iconComponent).not.toMatch(/\bdefinition\b/)
    expect(iconComponent).not.toMatch(/\bIconDefinition\b/)
    expect(allSources).not.toMatch(/<Icon\s+definition=/)
    for (const { path, source } of componentSources) {
      if (path === fileURLToPath(iconComponentUrl)) continue
      expect(source).not.toMatch(/@fortawesome\/free-(solid|brands)-svg-icons/)
      expect(source).not.toMatch(/\bIconDefinition\b/)
    }
  })
})
