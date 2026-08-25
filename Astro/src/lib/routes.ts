import { getCorrespondingLocale, type Locale } from "../i18n/locales"

const UNPREFIXED_REFERENCE = /^(?:https?:\/\/|mailto:|\/\/|#|\?)/i

export const ROUTE_IDS = ["home", "about", "projects", "tech-stack"] as const

export type RouteId = (typeof ROUTE_IDS)[number]

type LocalePaths = Readonly<Record<Locale, string>>

export const ROUTES = {
  home: { zh: "/", en: "/en/" },
  about: { zh: "/about/", en: "/en/about/" },
  projects: { zh: "/projects/", en: "/en/projects/" },
  "tech-stack": { zh: "/tech-stack/", en: "/en/tech-stack/" },
} as const satisfies Readonly<Record<RouteId, LocalePaths>>

function normalizedBase(base: string): string {
  const segments = base.split("/").filter(Boolean)
  return segments.length === 0 ? "/" : `/${segments.join("/")}/`
}

export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (UNPREFIXED_REFERENCE.test(path)) {
    return path
  }

  const basePath = normalizedBase(base)
  const suffixStart = path.search(/[?#]/)
  const pathname = suffixStart === -1 ? path : path.slice(0, suffixStart)
  const suffix = suffixStart === -1 ? "" : path.slice(suffixStart)
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return `${basePath}${suffix}`
  }

  const trailingSlash = pathname.endsWith("/") ? "/" : ""
  const normalizedPathname = `/${segments.join("/")}${trailingSlash}`
  const baseWithoutTrailingSlash = basePath.slice(0, -1)

  if (
    basePath !== "/" &&
    (normalizedPathname === baseWithoutTrailingSlash || normalizedPathname.startsWith(basePath))
  ) {
    return `${normalizedPathname}${suffix}`
  }

  return `${basePath}${normalizedPathname.slice(1)}${suffix}`
}

export function getRoutePath(
  routeId: RouteId,
  locale: Locale,
  base: string = import.meta.env.BASE_URL,
): string {
  return withBase(ROUTES[routeId][locale], base)
}

export function getCorrespondingLocalePath(
  routeId: RouteId,
  currentLocale: Locale,
  fragment = "",
  base: string = import.meta.env.BASE_URL,
): string {
  return `${getRoutePath(routeId, getCorrespondingLocale(currentLocale), base)}${fragment}`
}
