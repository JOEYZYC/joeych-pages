import type { Project, Site } from "../content/schemas"
import type { Locale } from "../i18n/locales"
import type { RouteId } from "./routes"
import { type AbsoluteUrlOptions, getAlternateUrls, getCanonicalUrl } from "./urls"

export type PersonJsonLd = {
  readonly "@context": "https://schema.org"
  readonly "@type": "Person"
  readonly name: string
  readonly alternateName: string
  readonly jobTitle: string
  readonly email: string
  readonly url: string
  readonly image: string
  readonly sameAs: readonly string[]
}

type PersonJsonLdOptions = {
  readonly locale: Locale
  readonly site: Site
  readonly url: string
  readonly image: string
}

type WebsiteJsonLdOptions = {
  readonly locale: Locale
  readonly site: Site
  readonly url: string
}

type ProjectItemListJsonLdOptions = {
  readonly canonical: string
  readonly locale: Locale
  readonly projects: readonly Project[]
}

type SeoUrlOptions = AbsoluteUrlOptions & {
  readonly locale: Locale
  readonly routeId: RouteId
}

export function buildPersonJsonLd({ locale, site, url, image }: PersonJsonLdOptions): PersonJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.person_name[locale],
    alternateName: site.alternate_name,
    jobTitle: site.role[locale],
    email: site.contact.email,
    url,
    image,
    sameAs: [site.contact.github, site.contact.scholar, site.contact.orcid],
  }
}

export function buildWebsiteJsonLd({ locale, site, url }: WebsiteJsonLdOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.alternate_name,
    url,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
  } as const
}

export function buildProjectItemListJsonLd({ canonical, locale, projects }: ProjectItemListJsonLdOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: project.title[locale],
        description: project.claim[locale],
        url: `${canonical}#${project.id}`,
      },
    })),
  } as const
}

export function serializeJsonLd(value: object): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}

export function getSeoUrls({ locale, routeId, ...options }: SeoUrlOptions) {
  const alternates = getAlternateUrls(routeId, options)

  return {
    canonical: getCanonicalUrl(routeId, locale, options),
    alternates,
    xDefault: alternates.zh,
  }
}
