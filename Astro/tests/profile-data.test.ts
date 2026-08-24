import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { parseYamlValue } from "../src/content/loaders"
import { httpsUrlSchema, localizedSchema } from "../src/content/schema-fields"
import {
  loadProfileData,
  ProfileContentError,
  type ProfileDocuments,
  parseProfileDocuments,
} from "../src/lib/profile-data"
import {
  PROJECT_PLACEHOLDER_MEDIA_PATH,
  publicMediaFilePath,
} from "../src/lib/profile-paths"

const DATA_ROOT = new URL("../../Profile/data/", import.meta.url)

type CanonicalTexts = {
  readonly profile: string
  readonly projects: string
  readonly awards: string
  readonly publications: string
  readonly patents: string
  readonly thesis: string
}

async function readCanonicalTexts(): Promise<CanonicalTexts> {
  const [profile, projects, awards, publications, patents, thesis] = await Promise.all([
    readFile(new URL("profile.yml", DATA_ROOT), "utf8"),
    readFile(new URL("projects.yml", DATA_ROOT), "utf8"),
    readFile(new URL("awards.yml", DATA_ROOT), "utf8"),
    readFile(new URL("publications.yml", DATA_ROOT), "utf8"),
    readFile(new URL("patents.yml", DATA_ROOT), "utf8"),
    readFile(new URL("thesis.yml", DATA_ROOT), "utf8"),
  ])

  return { profile, projects, awards, publications, patents, thesis }
}

function parseYaml(text: string): unknown {
  return parseYamlValue(text)
}

function documentsFrom(texts: CanonicalTexts): ProfileDocuments {
  return {
    profile: parseYaml(texts.profile),
    projects: parseYaml(texts.projects),
    awards: parseYaml(texts.awards),
    publications: parseYaml(texts.publications),
    patents: parseYaml(texts.patents),
    thesis: parseYaml(texts.thesis),
  }
}

describe("Profile content boundary", () => {
  it("loads current canonical content with stable order and normalized public paths", async () => {
    // Given: the six canonical Profile YAML documents and fixed public media root
    await readCanonicalTexts()

    // When: the documents cross the typed Astro boundary
    const content = await loadProfileData()

    // Then: source ordering, nullability, mixed values, and public paths are preserved
    expect(content.projects.map(({ id }) => id)).toEqual([
      "power-print-recognition",
      "dual-light-fusion",
      "resgatnet",
      "flexible-bifunctional-metasurface",
      "rigid-dual-polarization-metasurface",
      "single-phase-power-analyzer",
      "traffic-sign-recognition",
      "intelligent-reconnaissance-2024",
      "full-model-smart-car",
      "smart-harvesting-robot",
      "intelligent-reconnaissance-2023",
      "digikey-dual-light-thermal-imager-2024",
      "joeych-pages",
      "eflydrone-boards",
    ])
    expect(content.profile.statistics.map(({ value }) => typeof value)).toEqual([
      "string",
      "number",
      "number",
      "string",
    ])
    expect(content.profile.contact.hometown.en).toBe("Suzhou, Jiangsu")
    expect(content.profile.role).toEqual({
      zh: "电子信息工程本科毕业生",
      en: "Electronic & Information Engineering Graduate",
    })
    expect(content.profile.home_heading).toEqual({ zh: "你好，我叫张易成", en: "Hi, I'm Joey." })
    expect(content.profile.portrait).toBe("/profile/portrait-b1-cutout-workshirt-upright-transparent.png")
    expect(content.profile.hero_background).toEqual({
      light: "/profile/hero-circuit-background-light.png",
      dark: "/profile/hero-circuit-background.png",
    })
    expect(content.profile.favicon).toBe("/profile/favicon.svg")
    expect(PROJECT_PLACEHOLDER_MEDIA_PATH).toBe("/projects/project-placeholder.png")
    expect(publicMediaFilePath(PROJECT_PLACEHOLDER_MEDIA_PATH)).toBe(
      fileURLToPath(new URL("../../Profile/media/projects/project-placeholder.png", import.meta.url)),
    )
    await expect(readFile(publicMediaFilePath(PROJECT_PLACEHOLDER_MEDIA_PATH))).resolves.toBeInstanceOf(
      Buffer,
    )
    expect(content.projects.find(({ id }) => id === "resgatnet")).toMatchObject({
      image: null,
      contribution: { zh: expect.any(String), en: expect.any(String) },
      figures: [{ id: "resgatnet-architecture" }],
      links: [
        { type: "paper", url: null },
        { type: "source", url: null },
      ],
    })
    expect(content.projects[0]?.image).toBe(
      "/projects/power-print-recognition/power-print-architecture.jpg",
    )
    expect(content.projects.find(({ id }) => id === "power-print-recognition")?.related_achievements).toEqual([
      { kind: "award", id: "renesas-east-first-national-third-2024" },
    ])
    expect(content.projects.find(({ id }) => id === "flexible-bifunctional-metasurface")?.related_achievements).toEqual([])
    const websiteProject = content.projects.find(({ id }) => id === "joeych-pages")
    expect(websiteProject?.claim).toEqual({
      zh: "由统一公开数据源驱动的中英双语静态学术与工程作品集网站。",
      en: "A bilingual static academic and engineering portfolio driven by a single public data source.",
    })
    expect(websiteProject?.tags.map(({ en }) => en)).toEqual([
      "Astro",
      "TypeScript",
      "YAML",
      "Static Site Generation",
      "Bilingual Static Routes",
      "Playwright E2E Testing",
    ])
    expect(content.publications.every(({ image }) => image === null)).toBe(true)
    expect(fileURLToPath(DATA_ROOT)).not.toContain("private")
  })

  it("rejects a localized field with a missing locale", async () => {
    // Given: profile copy without its English locale
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      profile: texts.profile.replace("  en: JOEYCH\n", ""),
    })

    // When: the incomplete document crosses the boundary
    const result = parseProfileDocuments(documents)

    // Then: boundary parsing rejects the missing locale
    await expect(result).rejects.toBeInstanceOf(ProfileContentError)
  })

  it("rejects duplicate stable record IDs", async () => {
    // Given: two project records with the same stable ID
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      projects: texts.projects.replace("- id: dual-light-fusion", "- id: power-print-recognition"),
    })

    // When: the duplicate projects cross the boundary
    const result = parseProfileDocuments(documents)

    // Then: ID uniqueness is enforced before pages can consume the records
    await expect(result).rejects.toThrow(/duplicate/i)
  })

  it("rejects skill evidence for an unknown project", async () => {
    // Given: project evidence pointing outside the canonical project IDs
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      profile: texts.profile.replace(
        "project_id: single-phase-power-analyzer",
        "project_id: missing-project",
      ),
    })

    // When: cross-record evidence is validated
    const result = parseProfileDocuments(documents)

    // Then: unsupported project evidence is rejected
    await expect(result).rejects.toThrow(/missing-project/)
  })

  it("rejects skill evidence for an unsupported component", async () => {
    // Given: evidence naming a component outside its owning skill tag
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      profile: texts.profile.replace("supports: [circuit-design]", "supports: [unknown-component]"),
    })

    // When: component associations cross the boundary
    const result = parseProfileDocuments(documents)

    // Then: evidence cannot claim a component the tag does not define
    await expect(result).rejects.toThrow(/unknown-component/)
  })

  it("rejects unknown project achievement references", async () => {
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      projects: texts.projects.replace(
        "renesas-east-first-national-third-2024",
        "missing-award",
      ),
    })

    await expect(parseProfileDocuments(documents)).rejects.toThrow(/missing-award/)
  })

  it("rejects duplicate project achievement references", async () => {
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      projects: texts.projects.replace(
        "related_achievements:\n    - { kind: award, id: renesas-east-first-national-third-2024 }",
        "related_achievements:\n    - { kind: award, id: renesas-east-first-national-third-2024 }\n    - { kind: award, id: renesas-east-first-national-third-2024 }",
      ),
    })

    await expect(parseProfileDocuments(documents)).rejects.toThrow(/duplicate related achievement/i)
  })

  it("rejects media traversal outside Profile media", async () => {
    // Given: a project image attempting to traverse to private material
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      projects: texts.projects.replace(
        "projects/power-print-recognition/power-print-architecture.jpg",
        "../private/avatar.jpg",
      ),
    })

    // When: the media path is normalized
    const result = parseProfileDocuments(documents)

    // Then: traversal is structurally rejected
    await expect(result).rejects.toThrow(/media path/i)
  })

  it.each(["%2e%2e/private/avatar.jpg", "%2E%2E/private/avatar.jpg", "projects%2f..%2fprivate/avatar.jpg"])(
    "rejects encoded media traversal %s",
    async (unsafePath) => {
      const texts = await readCanonicalTexts()
      const documents = documentsFrom({
        ...texts,
        projects: texts.projects.replace(
          "projects/power-print-recognition/power-print-architecture.jpg",
          `'${unsafePath}'`,
        ),
      })

      await expect(parseProfileDocuments(documents)).rejects.toThrow(/media path/i)
    },
  )

  it.each(["javascript:alert(1)", "data:text/html,unsafe", "file:///C:/private.txt", "http://example.com"])(
    "rejects non-HTTPS external URL %s",
    (unsafeUrl) => {
      expect(httpsUrlSchema.safeParse(unsafeUrl).success).toBe(false)
    },
  )

  it("accepts an HTTPS external URL", () => {
    expect(httpsUrlSchema.parse("https://example.com/evidence")).toBe("https://example.com/evidence")
  })

  it("rejects certificate media traversal outside Profile media", async () => {
    // Given: a certificate whose src attempts to traverse to private material
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      awards: texts.awards.replace(
        "awards/ic-vocational-national-third-2025/集成电路国三.jpg",
        "../private/cert.jpg",
      ),
    })

    // When: the certificate src is normalized as public media
    const result = parseProfileDocuments(documents)

    // Then: traversal is structurally rejected
    await expect(result).rejects.toThrow(/media path/i)
  })

  it("rejects an associated public media file that does not exist", async () => {
    // Given: a valid relative media path with no matching public file
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      projects: texts.projects.replace("power-print-hardware.png", "missing-public-media.jpg"),
    })

    // When: media associations are checked against fixed Profile media
    const result = parseProfileDocuments(documents)

    // Then: missing associated media fails the boundary
    await expect(result).rejects.toThrow(/missing public media/i)
  })

  it("rejects a portrait association whose public media file does not exist", async () => {
    // Given: a valid relative portrait path with no matching public file
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      profile: texts.profile.replace(
        "portrait: profile/portrait-b1-cutout-workshirt-upright-transparent.png",
        "portrait: profile/missing-profile-portrait.png",
      ),
    })

    // When: the profile portrait association crosses the boundary
    const result = parseProfileDocuments(documents)

    // Then: missing portrait media fails the boundary
    await expect(result).rejects.toThrow(/missing public media/i)
  })

  it("rejects a Home hero background association whose public media file does not exist", async () => {
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      profile: texts.profile.replace(
        "light: profile/hero-circuit-background-light.png",
        "light: profile/missing-hero-background.png",
      ),
    })

    const result = parseProfileDocuments(documents)

    await expect(result).rejects.toThrow(/missing public media/i)
  })

  it("rejects a favicon association whose public media file does not exist", async () => {
    // Given: a valid relative favicon path with no matching public file
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      profile: texts.profile.replace("favicon: profile/favicon.svg", "favicon: profile/missing-favicon.svg"),
    })

    // When: the profile favicon association crosses the boundary
    const result = parseProfileDocuments(documents)

    // Then: missing favicon media fails the boundary
    await expect(result).rejects.toThrow(/missing public media/i)
  })

  it("rejects a thesis image whose public media file does not exist", async () => {
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      thesis: texts.thesis.replace("image: null", "image: thesis/missing-image.png"),
    })

    await expect(parseProfileDocuments(documents)).rejects.toThrow(/missing public media/i)
  })

  it("rejects a publication image whose public media file does not exist", async () => {
    const texts = await readCanonicalTexts()
    const documents = documentsFrom({
      ...texts,
      publications: texts.publications.replace("image: null", "image: publications/resgatnet/missing-image.png"),
    })

    await expect(parseProfileDocuments(documents)).rejects.toThrow(/missing public media/i)
  })

  it("parses quoted flow values without rewriting authored YAML", () => {
    const parsed = parseYamlValue("value: { zh: 江苏苏州, en: 'Suzhou, Jiangsu' }") as {
      readonly value: unknown
    }

    expect(localizedSchema.parse(parsed.value)).toEqual({ zh: "江苏苏州", en: "Suzhou, Jiangsu" })
  })

  it("does not absorb unknown flow-mapping keys into localized text", () => {
    const parsed = parseYamlValue("value: { zh: 测试, en: English, unexpected: value }") as {
      readonly value: unknown
    }

    expect(localizedSchema.safeParse(parsed.value).success).toBe(false)
  })

  it("preserves YAML syntax failures", () => {
    expect(() => parseYamlValue("value: [unterminated")).toThrow()
  })
})
