import { execFile } from "node:child_process"
import { randomUUID } from "node:crypto"
import { readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { getProfileData } from "../src/lib/profile-data"

const SAFE_EXTERNAL_URL = "https://evidence.example/archive/award-2025" as const
const execFileAsync = promisify(execFile)
const fixtureRoot = fileURLToPath(new URL("./fixtures/archive-links/", import.meta.url))
const fixtureGeneratedRoot = join(fixtureRoot, ".astro")
const fixtureGeneratedRoots = [
  fixtureGeneratedRoot,
  join(fixtureRoot, "node_modules", ".astro"),
  join(fixtureRoot, "node_modules", ".vite"),
] as const
const astroCli = fileURLToPath(new URL("../node_modules/astro/bin/astro.mjs", import.meta.url))
const outputRoot = join(tmpdir(), `archive-link-rendering-${process.pid}-${randomUUID()}`)
let renderedHtml = ""

function renderedCase(name: string): string {
  const startMarker = `<!-- case:${name}:start -->`
  const endMarker = `<!-- case:${name}:end -->`
  const start = renderedHtml.indexOf(startMarker)
  const end = renderedHtml.indexOf(endMarker)
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return renderedHtml.slice(start + startMarker.length, end)
}

beforeAll(async () => {
  await execFileAsync(process.execPath, [astroCli, "build", "--root", fixtureRoot], {
    env: { ...process.env, ARCHIVE_LINK_TEST_OUT_DIR: outputRoot },
  })
  renderedHtml = await readFile(join(outputRoot, "index.html"), "utf8")
})

afterAll(async () => {
  await Promise.all([
    rm(outputRoot, { recursive: true, force: true }),
    ...fixtureGeneratedRoots.map((path) => rm(path, { recursive: true, force: true })),
  ])
})

describe("award archive-link rendering", () => {
  it("preserves truthful link absence in the canonical Awards and Research sources", async () => {
    // Given: the current schema-parsed canonical Awards and Research records
    const data = await getProfileData()

    // When: every authored source-link collection is inspected
    const links = [
      ...data.awards.flatMap(({ links: awardLinks }) => awardLinks),
      ...data.publications.flatMap(({ links: publicationLinks }) => publicationLinks),
      ...data.patents.flatMap(({ links: patentLinks }) => patentLinks),
      ...data.thesis.links,
    ]

    // Then: the canonical source truth remains absence rather than a fabricated URL or null placeholder
    expect(links).toEqual([])
  })

  it.each([
    { name: "zh-null", locale: "zh", expected: "来源档案 — 链接暂不可用" },
    { name: "en-null", locale: "en", expected: "Source archive — Link unavailable" },
  ] as const)("renders localized unavailable text without an anchor in $locale", ({ name, expected }) => {
    // Given: a schema-parsed award whose authored archive URL is null

    // When: the test-owned static build renders the production ledger
    const html = renderedCase(name)

    // Then: the source label remains visible and no destination is fabricated
    expect(html).toContain(`<span class="unavailable-link">${expected}</span>`)
    expect(html).not.toContain("<a class=\"archive-link\"")
  })

  it("renders the exact safe external anchor when the URL is present", () => {
    // Given: a schema-parsed award with a known HTTPS evidence URL

    // When: the test-owned static build renders the production ledger
    const html = renderedCase("en-external")

    // Then: href and external-link protections are preserved exactly
    expect(html).toContain(
      `<a class="archive-link" href="${SAFE_EXTERNAL_URL}" target="_blank" rel="noopener noreferrer">Source archive</a>`,
    )
    expect(html).not.toContain("unavailable-link")
  })

  it("rejects a malformed archive-link fixture at the schema boundary", () => {
    // Given: the fixture page includes a malformed non-URL record probe

    // When: the production schema evaluates the fixture during the static build
    const html = renderedCase("malformed")

    // Then: malformed test data is rejected before rendering
    expect(html).toContain("fixture-rejected")
    expect(html).not.toContain("malformed-archive-link")
  })
})
