import { describe, expect, it } from "vitest"

import { getProfileData } from "../src/lib/profile-data"
import { buildPersonJsonLd, getSeoUrls, serializeJsonLd } from "../src/lib/seo"

describe("SEO helpers", () => {
  it("builds a truthful Person graph from public Profile identity and contact fields", async () => {
    // Given: the public canonical Profile record
    const { profile } = await getProfileData()

    // When: the English Person graph is built
    const actual = buildPersonJsonLd({ locale: "en", profile })

    // Then: it carries only public name, role, email, and approved identity links
    expect(actual).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name.en,
      jobTitle: profile.role.en,
      email: profile.contact.email,
      sameAs: [profile.contact.github, profile.contact.scholar, profile.contact.orcid],
    })
  })

  it("serializes Person JSON-LD without executable script delimiters or line separators", () => {
    // Given: public-like text containing script-sensitive characters
    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "<script>\u2028\u2029",
      jobTitle: "Engineer",
      email: "person@example.com",
      sameAs: [],
    } as const

    // When: the graph is serialized for an HTML script element
    const actual = serializeJsonLd(person)

    // Then: unsafe characters are escaped while JSON content remains present
    expect(actual).toContain("\\u003cscript>")
    expect(actual).toContain("\\u2028")
    expect(actual).toContain("\\u2029")
    expect(actual).not.toContain("<script>")
  })

  it("keeps canonical, alternate, and x-default URLs base-aware", () => {
    // Given: an English project route under the approved publication base
    const options = {
      base: "/joeych-pages/",
      locale: "en" as const,
      routeId: "projects" as const,
      siteOrigin: "https://joeyzyc.github.io",
    }

    // When: the complete SEO URL contract is built
    const actual = getSeoUrls(options)

    // Then: canonical and alternates retain their exact static route pair
    expect(actual).toEqual({
      canonical: "https://joeyzyc.github.io/joeych-pages/en/projects/",
      alternates: {
        zh: "https://joeyzyc.github.io/joeych-pages/projects/",
        en: "https://joeyzyc.github.io/joeych-pages/en/projects/",
      },
      xDefault: "https://joeyzyc.github.io/joeych-pages/projects/",
    })
  })
})
