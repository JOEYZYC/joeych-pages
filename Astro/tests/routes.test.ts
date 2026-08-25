import { describe, expect, it } from "vitest"

import { LOCALES } from "../src/i18n/locales"
import { UI } from "../src/i18n/ui"
import { getCorrespondingLocalePath, getRoutePath, ROUTE_IDS, ROUTES } from "../src/lib/routes"

const EXPECTED_ROUTES = {
  home: { zh: "/", en: "/en/" },
  about: { zh: "/about/", en: "/en/about/" },
  projects: { zh: "/projects/", en: "/en/projects/" },
  "tech-stack": { zh: "/tech-stack/", en: "/en/tech-stack/" },
} as const

describe("locale and route manifests", () => {
  it("defines the four bilingual route concepts", () => {
    expect(LOCALES).toEqual(["zh", "en"])
    expect(ROUTE_IDS).toEqual(["home", "about", "projects", "tech-stack"])
    expect(ROUTES).toEqual(EXPECTED_ROUTES)
  })

  it("builds every route pair with the publication base", () => {
    expect(ROUTE_IDS.map((routeId) => ({
      routeId,
      zh: getRoutePath(routeId, "zh", "/joeych-pages/"),
      en: getRoutePath(routeId, "en", "/joeych-pages/"),
    }))).toEqual([
      { routeId: "home", zh: "/joeych-pages/", en: "/joeych-pages/en/" },
      { routeId: "about", zh: "/joeych-pages/about/", en: "/joeych-pages/en/about/" },
      { routeId: "projects", zh: "/joeych-pages/projects/", en: "/joeych-pages/en/projects/" },
      { routeId: "tech-stack", zh: "/joeych-pages/tech-stack/", en: "/joeych-pages/en/tech-stack/" },
    ])
  })

  it("preserves fragments when switching locale", () => {
    expect(getCorrespondingLocalePath("projects", "zh", "#resgatnet", "/joeych-pages/")).toBe(
      "/joeych-pages/en/projects/#resgatnet",
    )
  })

  it("keeps navigation and route copy aligned", () => {
    for (const locale of LOCALES) {
      expect(Object.keys(UI[locale].navigation)).toEqual(ROUTE_IDS)
    }
    expect(UI.zh.navigation).toMatchObject({ home: "首页", about: "自我介绍" })
    expect(UI.en.navigation).toMatchObject({ home: "Home", about: "About" })
  })
})
