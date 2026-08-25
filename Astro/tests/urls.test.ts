import { describe, expect, it } from "vitest"

import { getAlternateUrls, getCanonicalUrl, publicMediaUrl, withBase } from "../src/lib/urls"

describe("base-aware URL helpers", () => {
  it.each([
    ["/", "/joeych-pages/"],
    ["", "/joeych-pages/"],
    ["about/", "/joeych-pages/about/"],
    ["/joeych-pages/projects/", "/joeych-pages/projects/"],
    ["/projects/?filter=featured#project-1", "/joeych-pages/projects/?filter=featured#project-1"],
    ["/projects///archive/", "/joeych-pages/projects/archive/"],
  ])("prefixes internal path %s without duplicate slashes", (path, expected) => {
    // Given: an internal path and the configured publication base
    const base = "/joeych-pages/"

    // When: the path is made base-aware
    const actual = withBase(path, base)

    // Then: the base is prefixed exactly once
    expect(actual).toBe(expected)
  })

  it.each([
    ["/", "/"],
    ["", "/"],
    ["/en/", "/en/"],
    ["tech-stack/?view=all", "/tech-stack/?view=all"],
  ])("supports the root publication base for %s", (path, expected) => {
    // Given: a site published at the origin root
    const base = "/"

    // When: the path is made base-aware
    const actual = withBase(path, base)

    // Then: the path remains root-relative without duplicate slashes
    expect(actual).toBe(expected)
  })

  it.each([
    "https://example.com/evidence",
    "http://example.com/evidence",
    "mailto:hello@example.com",
    "//cdn.example.com/file.png",
    "#project-1",
    "?view=compact",
  ])("preserves non-prefixed reference %s", (reference) => {
    // Given: a reference that must not receive the publication base
    const base = "/joeych-pages/"

    // When: it passes through the base helper
    const actual = withBase(reference, base)

    // Then: the reference is unchanged
    expect(actual).toBe(reference)
  })

  it("uses import.meta.env.BASE_URL when no base is supplied", () => {
    // Given: an internal route and the test environment's default root base
    const path = "/projects/"

    // When: no explicit base is supplied
    const actual = withBase(path)

    // Then: the environment base is used
    expect(actual).toBe("/projects/")
  })

  it("builds a Unicode Profile media path without changing the filename", () => {
    // Given: a Profile-owned certificate filename containing Unicode and a space
    const mediaPath = "certificates/全国大学生竞赛 证书.png"

    // When: its public URL is built under the publication base
    const actual = publicMediaUrl(mediaPath, "/joeych-pages/")

    // Then: the base is prefixed and the literal filename is preserved
    expect(actual).toBe("/joeych-pages/certificates/全国大学生竞赛 证书.png")
  })

  it("builds an absolute canonical URL from the site origin and base-aware route", () => {
    // Given: the approved origin, base, route, and locale
    const options = { siteOrigin: "https://joeyzyc.github.io", base: "/joeych-pages/" }

    // When: the canonical URL is built
    const actual = getCanonicalUrl("projects", "en", options)

    // Then: the absolute URL contains both the publication base and locale route
    expect(actual).toBe("https://joeyzyc.github.io/joeych-pages/en/projects/")
  })

  it("builds absolute Chinese and English alternate URLs", () => {
    // Given: the approved origin, base, and route pair
    const options = { siteOrigin: "https://joeyzyc.github.io/", base: "/joeych-pages" }

    // When: locale alternates are built
    const actual = getAlternateUrls("tech-stack", options)

    // Then: both absolute counterparts are available without duplicate slashes
    expect(actual).toEqual({
      zh: "https://joeyzyc.github.io/joeych-pages/tech-stack/",
      en: "https://joeyzyc.github.io/joeych-pages/en/tech-stack/",
    })
  })
})
