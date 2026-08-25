import { lstat, readdir, readFile, stat } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "@playwright/test"

import { CANONICAL_ROUTES } from "./support/site-matrix"

const distPath = fileURLToPath(new URL("../../dist/", import.meta.url))
const basePath = "/joeych-pages/"
const emittedFontLimit = 42 * 1024 * 1024
const protectedMarkers = [["Profile", "private"], ["Astro", "Demo"], ["Astro", "research"], ["Jeklly"], ["TOOLS"]]
  .map((segments) => `${segments.join("/")}/`)
const forbiddenRuntimeMarkers = ["ClientRouter", "astro:transitions", "transition:persist", "serviceWorker", "navigator.serviceWorker"]
const expectedHtml = ["about/index.html", "en/about/index.html", "en/index.html", "en/projects/index.html", "en/tech-stack/index.html", "index.html", "projects/index.html", "tech-stack/index.html"]
const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".svg", ".text", ".xml"])

async function files(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? files(path) : entry.isFile() ? [path] : []
  }))
  return nested.flat()
}

function auditText(path: string, source: string): readonly string[] {
  return [
    ...protectedMarkers.filter((marker) => source.includes(marker)).map((marker) => `${path}:protected:${marker}`),
    ...forbiddenRuntimeMarkers.filter((marker) => source.includes(marker)).map((marker) => `${path}:runtime:${marker}`),
    ...[...source.matchAll(/(?:href|src)=["'](\/[^"']+)/g)]
      .filter((match) => match[1] !== undefined && !match[1].startsWith(basePath))
      .map((match) => `${path}:root-relative:${match[1]}`),
    ...[...source.matchAll(/https?:\/\/[^"'\s)]+/g)]
      .filter((match) => /fonts\.googleapis|fonts\.gstatic|typekit|fontawesome/i.test(match[0]))
      .map((match) => `${path}:remote-font:${match[0]}`),
  ]
}

function isTextArtifact(path: string): boolean {
  return textExtensions.has(extname(path).toLowerCase())
}

test.describe("fresh static artifact audit", () => {
  test.describe.configure({ mode: "serial" })

  test("audits the fresh dist manifest, routes, and native CSS transition contract", async ({ page: _page }, testInfo) => {
    // Given: the production dist produced by this Playwright lifecycle
    const artifactFiles = await files(distPath)
    const html = artifactFiles.filter((path) => path.endsWith(".html"))
    const relativeHtml = html.map((path) => relative(distPath, path).split(sep).join("/")).sort()
    const textArtifacts = artifactFiles.filter(isTextArtifact)
    const binaryArtifacts = await Promise.all(artifactFiles
      .filter((path) => !isTextArtifact(path))
      .map(async (path) => ({
        bytes: (await stat(path)).size,
        path: relative(distPath, path).split(sep).join("/"),
      })))
    const sources = await Promise.all(textArtifacts.map(async (path) => ({ path, source: await readFile(path, "utf8") })))

    // When: route, content, and real filesystem boundaries are audited
    const sitemap = await readFile(join(distPath, "sitemap-0.xml"), "utf8")
    const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap((match) => match[1] === undefined ? [] : [match[1]]).sort()
    const violations = sources.flatMap(({ path, source }) => auditText(relative(distPath, path), source)).sort()
    const symlinks = await Promise.all(artifactFiles.map(async (path) => ({ path, stat: await lstat(path) })))
    const fontFiles = artifactFiles.filter((path) => path.endsWith(".woff2"))
    const fontBytes = (await Promise.all(fontFiles.map(async (path) => (await stat(path)).size))).reduce((total, bytes) => total + bytes, 0)

    // Then: exactly eight base-aware static documents remain free of alternate runtimes and protected inputs
    expect(relativeHtml).toHaveLength(CANONICAL_ROUTES.length)
    expect(relativeHtml).toContain("index.html")
    expect(relativeHtml).toEqual(expectedHtml)
    expect(sitemapUrls).toEqual(CANONICAL_ROUTES.map((route) => route.canonical).sort())
    expect(violations).toEqual([])
    expect(symlinks.some(({ stat }) => stat.isSymbolicLink())).toBe(false)
    expect(fontBytes).toBeLessThanOrEqual(emittedFontLimit)
    expect(sources.some(({ source }) => source.includes("@view-transition{navigation:auto}"))).toBe(true)
    expect(sources.some(({ source }) => source.includes("prefers-reduced-motion:reduce"))).toBe(true)
    await testInfo.attach("artifact-manifest.json", {
      body: JSON.stringify({ binaryArtifacts, files: relativeHtml, fontBytes, sitemapUrls, textArtifacts, violations }, null, 2),
      contentType: "application/json",
    })
  })

  test("decodes only known text artifact extensions", () => {
    // Given: emitted text, binary, and unrecognized artifact paths
    const artifacts = [
      ["index.html", true],
      ["assets/site.css", true],
      ["assets/site.js", true],
      ["assets/site.mjs", true],
      ["manifest.json", true],
      ["sitemap-0.xml", true],
      ["assets/icon.svg", true],
      ["notes.text", true],
      ["assets/font.woff2", false],
      ["assets/portrait.webp", false],
      ["assets/archive.zip", false],
      ["assets/opaque.bin", false],
    ] as const

    // When: the audit classifies filesystem artifacts before decoding them
    const classifications = artifacts.map(([path]) => [path, isTextArtifact(path)] as const)

    // Then: only explicit text formats receive UTF-8 decoding
    expect(classifications).toEqual(artifacts)
  })

  test("rejects in-memory forbidden artifact sensitivity fixtures", () => {
    // Given: test-owned artifact text representing every forbidden publication case
    const fixtures = [
      '<link href="https://fonts.googleapis.com/css2?family=Fixture">',
      '<script src="/assets/fixture.js"></script>',
      `${protectedMarkers[0]}fixture`,
      "ClientRouter",
    ]

    // When: the artifact scanner evaluates memory-only content
    const violations = fixtures.flatMap((source, index) => auditText(`fixture-${index}.html`, source))
    const eleventhRoute = [...expectedHtml, "fixture/index.html"].sort()

    // Then: all fixture classes fail without creating an eleventh route or protected file
    expect(violations).toHaveLength(fixtures.length)
    expect(eleventhRoute).not.toEqual(expectedHtml)
  })
})
