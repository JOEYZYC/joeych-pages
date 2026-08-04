import { describe, expect, it } from "vitest"

import { LOCALES } from "../src/i18n/locales"
import { UI } from "../src/i18n/ui"
import { getCorrespondingLocalePath, getRoutePath, ROUTE_IDS, ROUTES } from "../src/lib/routes"

const EXPECTED_ROUTES = {
  home: { zh: "/", en: "/en/" },
  experience: { zh: "/experience/", en: "/en/experience/" },
  awards: { zh: "/awards/", en: "/en/awards/" },
  projects: { zh: "/projects/", en: "/en/projects/" },
  "tech-stack": { zh: "/tech-stack/", en: "/en/tech-stack/" },
} as const

describe("locale and route manifests", () => {
  it("defines only the approved locales and route IDs", () => {
    // Given: the closed locale and route manifests
    const expectedLocales = ["zh", "en"]
    const expectedRouteIds = ["home", "experience", "awards", "projects", "tech-stack"]

    // When: consumers enumerate the manifests
    const actual = { locales: LOCALES, routeIds: ROUTE_IDS }

    // Then: no unsupported locale or public route is exposed
    expect(actual).toEqual({ locales: expectedLocales, routeIds: expectedRouteIds })
  })

  it("maps every Chinese route to its exact English mirror", () => {
    // Given: all five approved route concepts
    const expected = EXPECTED_ROUTES

    // When: the route manifest is read
    const actual = ROUTES

    // Then: each route has the exact Chinese-root and English-prefix pair
    expect(actual).toEqual(expected)
  })

  it("builds every route pair with the supplied publication base", () => {
    // Given: the GitHub Pages publication base
    const base = "/joeych-pages/"

    // When: every route is built for both locales
    const actual = ROUTE_IDS.map((routeId) => ({
      routeId,
      zh: getRoutePath(routeId, "zh", base),
      en: getRoutePath(routeId, "en", base),
    }))

    // Then: all paths are base-aware and retain trailing slashes
    expect(actual).toEqual([
      { routeId: "home", zh: "/joeych-pages/", en: "/joeych-pages/en/" },
      {
        routeId: "experience",
        zh: "/joeych-pages/experience/",
        en: "/joeych-pages/en/experience/",
      },
      { routeId: "awards", zh: "/joeych-pages/awards/", en: "/joeych-pages/en/awards/" },
      {
        routeId: "projects",
        zh: "/joeych-pages/projects/",
        en: "/joeych-pages/en/projects/",
      },
      {
        routeId: "tech-stack",
        zh: "/joeych-pages/tech-stack/",
        en: "/joeych-pages/en/tech-stack/",
      },
    ])
  })

  it("links every route in both directions while preserving the current fragment", () => {
    // Given: all route concepts and a Unicode record fragment
    const fragment = "#record-智能车"

    // When: both locale counterparts are requested for every route
    const actual = ROUTE_IDS.map((routeId) => ({
      routeId,
      en: getCorrespondingLocalePath(routeId, "zh", fragment, "/joeych-pages/"),
      zh: getCorrespondingLocalePath(routeId, "en", fragment, "/joeych-pages/"),
    }))

    // Then: every counterpart is exact and keeps the fragment
    expect(actual).toEqual([
      {
        routeId: "home",
        en: "/joeych-pages/en/#record-智能车",
        zh: "/joeych-pages/#record-智能车",
      },
      {
        routeId: "experience",
        en: "/joeych-pages/en/experience/#record-智能车",
        zh: "/joeych-pages/experience/#record-智能车",
      },
      {
        routeId: "awards",
        en: "/joeych-pages/en/awards/#record-智能车",
        zh: "/joeych-pages/awards/#record-智能车",
      },
      {
        routeId: "projects",
        en: "/joeych-pages/en/projects/#record-智能车",
        zh: "/joeych-pages/projects/#record-智能车",
      },
      {
        routeId: "tech-stack",
        en: "/joeych-pages/en/tech-stack/#record-智能车",
        zh: "/joeych-pages/tech-stack/#record-智能车",
      },
    ])
  })

  it("provides typed UI groups and route intro entries for both locales", () => {
    // Given: the bilingual UI manifest
    const expectedRouteKeys = ROUTE_IDS

    // When: consumers enumerate navigation and route-intro keys
    const actual = LOCALES.map((locale) => ({
      locale,
      navigation: Object.keys(UI[locale].navigation),
      routeIntros: Object.keys(UI[locale].routeIntros),
      groups: Object.keys(UI[locale]).sort(),
    }))

    // Then: labels cover only the approved UI surfaces and routes
    expect(actual).toEqual([
      {
        locale: "zh",
        navigation: expectedRouteKeys,
        routeIntros: expectedRouteKeys,
        groups: [
          "certificate",
          "contact",
          "evidence",
          "language",
          "links",
          "mainNavigation",
          "menu",
          "navigation",
          "routeIntros",
          "sections",
          "unavailable",
        ],
      },
      {
        locale: "en",
        navigation: expectedRouteKeys,
        routeIntros: expectedRouteKeys,
        groups: [
          "certificate",
          "contact",
          "evidence",
          "language",
          "links",
          "mainNavigation",
          "menu",
          "navigation",
          "routeIntros",
          "sections",
          "unavailable",
        ],
      },
    ])
  })

  it("provides visible general-ability evidence levels in both locales", () => {
    // Given: self-described evidence levels from the Profile schema
    const expected = {
      zh: { working: "工作使用", exposure: "接触了解" },
      en: { working: "Working knowledge", exposure: "Exposure" },
    }

    // When: Tech Stack rendering reads its localized level labels
    const actual = {
      zh: UI.zh.evidence.levels,
      en: UI.en.evidence.levels,
    }

    // Then: working and exposure remain distinct, complete presentation labels
    expect(actual).toEqual(expected)
  })
})
