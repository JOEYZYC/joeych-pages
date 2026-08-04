import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url))

describe("publication firewall", () => {
  it("ignores every required local-only tree", () => {
    // Given: representative paths inside every local-only tree
    const localOnlyPaths = [
      "Astro/Demo/example",
      "Astro/research/example",
      "Profile/private/example",
    ] as const

    // When: Git evaluates the repository ignore rules without consulting the index
    const ignoredPaths = execFileSync(
      "git",
      ["check-ignore", "--no-index", ...localOnlyPaths],
      { cwd: repositoryRoot, encoding: "utf8" },
    )
      .trim()
      .split(/\r?\n/)

    // Then: all and only the required local-only paths are ignored
    expect(ignoredPaths).toEqual(localOnlyPaths)
  })

  it("keeps Astro Demo snapshots out of the tracked publication surface", () => {
    // Given: the repository publication surface
    const trackedDemoPathspec = "Astro/Demo/**"

    // When: Git lists tracked files under the Demo tree
    const trackedDemoFiles = execFileSync("git", ["ls-files", "--", trackedDemoPathspec], {
      cwd: repositoryRoot,
      encoding: "utf8",
    })

    // Then: no Demo snapshot is tracked
    expect(trackedDemoFiles).toBe("")
  })
})
