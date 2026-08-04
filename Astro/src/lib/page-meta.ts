import type { Profile } from "../content/schemas"
import type { Locale } from "../i18n/locales"
import { UI } from "../i18n/ui"
import type { RouteId } from "./routes"

export type PageMeta = {
  readonly title: string
  readonly description: string
}

type PageMetaOptions = {
  readonly locale: Locale
  readonly profile: Profile
  readonly routeId: RouteId
}

export function getPageMeta({ locale, profile, routeId }: PageMetaOptions): PageMeta {
  const pageTitle = UI[locale].routeIntros[routeId].title

  return {
    title: `${pageTitle} | ${profile.name[locale]}`,
    description: `${pageTitle}: ${profile.summary[locale]}`,
  }
}
