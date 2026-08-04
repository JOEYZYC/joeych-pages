import type { Profile } from "../content/schemas"
import type { Locale } from "../i18n/locales"
import type { RouteId } from "./routes"
import { type AbsoluteUrlOptions, getAlternateUrls, getCanonicalUrl } from "./urls"

export type PersonJsonLd = {
  readonly "@context": "https://schema.org"
  readonly "@type": "Person"
  readonly name: string
  readonly jobTitle: string
  readonly email: string
  readonly sameAs: readonly string[]
}

type PersonJsonLdOptions = {
  readonly locale: Locale
  readonly profile: Profile
}

type SeoUrlOptions = AbsoluteUrlOptions & {
  readonly locale: Locale
  readonly routeId: RouteId
}

export function buildPersonJsonLd({ locale, profile }: PersonJsonLdOptions): PersonJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name[locale],
    jobTitle: profile.role[locale],
    email: profile.contact.email,
    sameAs: [profile.contact.github, profile.contact.scholar, profile.contact.orcid],
  }
}

export function serializeJsonLd(person: PersonJsonLd): string {
  return JSON.stringify(person)
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
