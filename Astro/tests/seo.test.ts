import { readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"

import { getProfileData } from "../src/lib/profile-data"
import {
  buildPersonJsonLd,
  buildProjectItemListJsonLd,
  buildWebsiteJsonLd,
  getSeoUrls,
  serializeJsonLd,
} from "../src/lib/seo"

describe("SEO helpers", () => {
  it("builds a truthful Person graph from public Profile identity and contact fields", async () => {
    // Given: the public canonical Profile record
    const { site } = await getProfileData()

    // When: the English Person graph is built
    const actual = buildPersonJsonLd({
      locale: "en",
      site,
      url: "https://joeyzyc.github.io/joeych-pages/en/",
      image: "https://joeyzyc.github.io/joeych-pages/site/social-card.png",
    })

    // Then: it carries only public name, role, email, and approved identity links
    expect(actual).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Joey Zhang",
      alternateName: "JOEYCH",
      jobTitle: site.role.en,
      email: site.contact.email,
      url: "https://joeyzyc.github.io/joeych-pages/en/",
      image: "https://joeyzyc.github.io/joeych-pages/site/social-card.png",
      sameAs: [site.contact.github, site.contact.scholar, site.contact.orcid],
    })
  })

  it("builds website and ordered project collection graphs", async () => {
    const { projects, site } = await getProfileData()
    const website = buildWebsiteJsonLd({
      locale: "zh",
      site,
      url: "https://joeyzyc.github.io/joeych-pages/",
    })
    const itemList = buildProjectItemListJsonLd({
      canonical: "https://joeyzyc.github.io/joeych-pages/projects/",
      locale: "zh",
      projects,
    })

    expect(website).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "JOEYCH",
      url: "https://joeyzyc.github.io/joeych-pages/",
      inLanguage: "zh-CN",
    })
    expect(itemList.itemListElement).toHaveLength(projects.length)
    expect(itemList.itemListElement[0]).toMatchObject({
      position: 1,
      item: {
        name: projects[0]?.title.zh,
        url: `https://joeyzyc.github.io/joeych-pages/projects/#${projects[0]?.id}`,
      },
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

  it("ships the declared 1200 by 630 social card", async () => {
    const image = await readFile(new URL("../../Profile/site/social-card.png", import.meta.url))

    expect(image.readUInt32BE(16)).toBe(1200)
    expect(image.readUInt32BE(20)).toBe(630)
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
