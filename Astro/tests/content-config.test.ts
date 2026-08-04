import { describe, expect, it } from "vitest"

import { PROFILE_CONTENT_PATHS, PROFILE_DATA_FILES } from "../src/lib/profile-paths"

describe("Astro Profile content collections", () => {
  it("registers exactly the six canonical Profile documents", () => {
    // Given: the Astro Content Layer configuration
    const expectedCollections = [
      "profile",
      "projects",
      "awards",
      "publications",
      "patents",
      "thesis",
    ]

    // When: collection and source allowlists are inspected
    const actualCollections = Object.keys(PROFILE_CONTENT_PATHS)

    // Then: no private, research, demo, mirror, or caller-selected source is reachable
    expect(actualCollections).toEqual(expectedCollections)
    expect(Object.values(PROFILE_DATA_FILES)).toEqual(
      expectedCollections.map((name) => `${name}.yml`),
    )
    expect(Object.values(PROFILE_CONTENT_PATHS)).toEqual(
      expectedCollections.map((name) => `../Profile/data/${name}.yml`),
    )
  })
})
