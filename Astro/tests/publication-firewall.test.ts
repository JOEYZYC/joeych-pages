import { execFileSync } from "node:child_process"
import { readdir, readFile, stat } from "node:fs/promises"
import { extname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url))
const astroRoot = fileURLToPath(new URL("..", import.meta.url))
const firewallTestPath = "tests/publication-firewall.test.ts"
const localOnlyPrefixes = [
  "Astro/Demo/",
  "Astro/research/",
  "Profile/private/",
  "Jeklly/archive/local/",
  "Jeklly/_data/",
  "Jeklly/assets/img/",
  "Jeklly/.generated/",
  ".tmp-build/",
] as const
const protectedReferencePrefixes = [...localOnlyPrefixes, "TOOLS/"] as const
const approvedToolPaths = ["TOOLS/Push-AstroDeployment.ps1", "TOOLS/Start-AstroPreview.ps1"] as const
const approvedWorkflowExclusions = ['"!Astro/Demo/**",', '"!Astro/research/**",'] as const
const sourceExtensions = new Set([".astro", ".css", ".js", ".json", ".mjs", ".ts", ".tsx"])
const configPaths = ["astro.config.ts", "biome.json", "package.json", "playwright.config.ts", "tsconfig.json", "vitest.config.ts"] as const

type SourceFile = {
  readonly path: string
  readonly source: string
}

function normalizePath(path: string): string {
  return path.split(sep).join("/")
}

function findProtectedTrackedPaths(trackedPaths: readonly string[]): readonly string[] {
  return trackedPaths.filter((path) => {
    const normalizedPath = normalizePath(path)
    if (approvedToolPaths.some((approvedPath) => approvedPath === normalizedPath)) return false
    return protectedReferencePrefixes.some((prefix) => normalizedPath.startsWith(prefix))
  })
}

function findProtectedReferences(files: readonly SourceFile[]): readonly string[] {
  return files.flatMap(({ path, source }) =>
    source.split(/\r?\n/).flatMap((line, index) => {
      const normalizedLine = line.split("\\").join("/")
      if (
        path === "tests/deployment-workflow.test.ts" &&
        approvedWorkflowExclusions.some((exclusion) => exclusion === normalizedLine.trim())
      ) {
        return []
      }
      return protectedReferencePrefixes.flatMap((prefix) =>
        normalizedLine.includes(prefix) ? [`${path}:${index + 1}:${prefix}`] : [],
      )
    }),
  )
}

async function loadAstroPublicationSources(): Promise<readonly SourceFile[]> {
  const entries = await Promise.all(
    ["src", "tests"].map(async (directory) => {
      const paths = await readdir(join(astroRoot, directory), { recursive: true })
      const sourcePaths = paths
        .filter((path) => sourceExtensions.has(extname(path)))
        .map((path) => join(astroRoot, directory, path))
      const sourceStats = await Promise.all(sourcePaths.map(async (path) => ({ path, stats: await stat(path) })))
      return sourceStats.filter(({ stats }) => stats.isFile()).map(({ path }) => path)
    }),
  )
  const paths = [...entries.flat(), ...configPaths.map((path) => join(astroRoot, path))]
  return Promise.all(
    paths.map(async (path) => ({
      path: normalizePath(relative(astroRoot, path)),
      source: await readFile(path, "utf8"),
    })),
  )
}

describe("publication firewall", () => {
  it("ignores every required local-only tree", () => {
    // Given: representative paths inside every local-only tree
    const localOnlyPaths = localOnlyPrefixes.map((prefix) => `${prefix}example`)

    // When: Git evaluates the repository ignore rules without consulting the index
    const ignoredPaths = execFileSync("git", ["check-ignore", "--no-index", ...localOnlyPaths], {
      cwd: repositoryRoot,
      encoding: "utf8",
    })
      .trim()
      .split(/\r?\n/)

    // Then: all and only the required local-only paths are ignored
    expect(ignoredPaths).toEqual(localOnlyPaths)
  })

  it("rejects protected tracked paths in test-owned sensitivity fixtures", () => {
    // Given: one in-memory tracked path under every protected boundary
    const trackedFixtures = [...protectedReferencePrefixes.map((prefix) => `${prefix}sensitive`)]

    // When: the tracked publication surface is audited
    const violations = findProtectedTrackedPaths(trackedFixtures)

    // Then: every fixture is rejected without touching a protected directory
    expect(violations).toEqual(trackedFixtures)
  })

  it("keeps protected trees out of the tracked publication surface", () => {
    // Given: every path in the repository index
    const trackedPaths = execFileSync("git", ["ls-files", "-z"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    })
      .split("\0")
      .filter(Boolean)

    // When: protected paths and unapproved TOOLS entries are selected
    const violations = findProtectedTrackedPaths(trackedPaths)
    const trackedToolPaths = trackedPaths.filter((path) => normalizePath(path).startsWith("TOOLS/"))

    // Then: only the two approved guarded TOOLS scripts cross the index boundary
    expect(violations).toEqual([])
    expect(trackedToolPaths).toEqual(approvedToolPaths)
  })

  it("rejects protected source references in test-owned sensitivity fixtures", () => {
    // Given: in-memory source files that reference every protected boundary
    const fixtures = protectedReferencePrefixes.map((prefix) => ({
      path: `fixture-${prefix.replaceAll("/", "-")}.ts`,
      source: `const protectedPath = "${prefix}sensitive"`,
    }))

    // When: the source publication surface is audited
    const violations = findProtectedReferences(fixtures)

    // Then: every fixture is rejected without creating protected content
    expect(violations).toHaveLength(fixtures.length)
  })

  it("keeps Astro source, tests, and configuration free of protected references", async () => {
    // Given: Astro source, test, and configuration text outside this fixture-owning test
    const sources = (await loadAstroPublicationSources()).filter(({ path }) => path !== firewallTestPath)

    // When: references to protected repository boundaries are selected
    const violations = findProtectedReferences(sources)

    // Then: no protected or local-only tree can enter Astro's publication inputs
    expect(violations).toEqual([])
  })
})
