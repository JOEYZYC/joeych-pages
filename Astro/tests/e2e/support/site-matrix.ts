export const BASE_PATH = "/joeych-pages" as const
export const SITE_ORIGIN = "https://joeyzyc.github.io" as const

export type SiteLocale = "zh" | "en"

export type CanonicalRoute = {
  readonly path: string
  readonly locale: SiteLocale
  readonly counterpart: string
  readonly canonical: string
}

export const CANONICAL_ROUTES = [
  { path: "", locale: "zh", counterpart: "/en/", canonical: "https://joeyzyc.github.io/joeych-pages/" },
  { path: "en/", locale: "en", counterpart: "/", canonical: "https://joeyzyc.github.io/joeych-pages/en/" },
  { path: "about/", locale: "zh", counterpart: "/en/about/", canonical: "https://joeyzyc.github.io/joeych-pages/about/" },
  { path: "en/about/", locale: "en", counterpart: "/about/", canonical: "https://joeyzyc.github.io/joeych-pages/en/about/" },
  { path: "projects/", locale: "zh", counterpart: "/en/projects/", canonical: "https://joeyzyc.github.io/joeych-pages/projects/" },
  { path: "en/projects/", locale: "en", counterpart: "/projects/", canonical: "https://joeyzyc.github.io/joeych-pages/en/projects/" },
  { path: "tech-stack/", locale: "zh", counterpart: "/en/tech-stack/", canonical: "https://joeyzyc.github.io/joeych-pages/tech-stack/" },
  { path: "en/tech-stack/", locale: "en", counterpart: "/tech-stack/", canonical: "https://joeyzyc.github.io/joeych-pages/en/tech-stack/" },
] as const satisfies readonly CanonicalRoute[]

export type SiteViewport = {
  readonly name: "mobile" | "tablet" | "desktop"
  readonly width: number
  readonly height: number
}

export const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
] as const satisfies readonly SiteViewport[]

export const THEMES = ["light", "dark"] as const
export type Theme = (typeof THEMES)[number]
