import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url))
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
const protectedPrefixes = [...localOnlyPrefixes, "TOOLS/"] as const
const approvedToolPaths = ["TOOLS/Push-AstroDeployment.ps1", "TOOLS/Start-AstroPreview.ps1"] as const

function findProtectedTrackedPaths(trackedPaths: readonly string[]): readonly string[] {
  return trackedPaths.filter((path) => {
    const normalized = path.replaceAll("\\", "/")
    if (approvedToolPaths.some((approvedPath) => approvedPath === normalized)) return false
    return protectedPrefixes.some((prefix) => normalized.startsWith(prefix))
  })
}

describe("publication firewall", () => {
  it("ignores every required local-only tree", () => {
    const localOnlyPaths = localOnlyPrefixes.map((prefix) => `${prefix}example`)
    const ignoredPaths = execFileSync("git", ["check-ignore", "--no-index", ...localOnlyPaths], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).trim().split(/\r?\n/)

    expect(ignoredPaths).toEqual(localOnlyPaths)
  })

  it("rejects protected tracked paths", () => {
    const fixtures = protectedPrefixes.map((prefix) => `${prefix}sensitive`)
    expect(findProtectedTrackedPaths(fixtures)).toEqual(fixtures)
  })

  it("keeps protected trees out of the Git publication surface", () => {
    const trackedPaths = execFileSync("git", ["ls-files", "-z"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    }).split("\0").filter(Boolean)
    const trackedToolPaths = trackedPaths.filter((path) => path.startsWith("TOOLS/"))

    expect(findProtectedTrackedPaths(trackedPaths)).toEqual([])
    expect(trackedToolPaths).toEqual(approvedToolPaths)
  })
})
