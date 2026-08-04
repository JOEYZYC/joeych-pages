import type { Locale } from "../i18n/locales"
import { getRoutePath, type RouteId, withBase } from "./routes"

export { withBase } from "./routes"

export type AbsoluteUrlOptions = {
  readonly siteOrigin: string
  readonly base?: string
}

export function publicMediaUrl(mediaPath: string, base: string = import.meta.env.BASE_URL): string {
  return withBase(mediaPath, base)
}

export function getCanonicalUrl(
  routeId: RouteId,
  locale: Locale,
  options: AbsoluteUrlOptions,
): string {
  return new URL(getRoutePath(routeId, locale, options.base), options.siteOrigin).toString()
}

export function getAlternateUrls(
  routeId: RouteId,
  options: AbsoluteUrlOptions,
): Readonly<Record<Locale, string>> {
  return {
    zh: getCanonicalUrl(routeId, "zh", options),
    en: getCanonicalUrl(routeId, "en", options),
  }
}
