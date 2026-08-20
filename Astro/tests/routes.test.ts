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
          "actions",
          "archive",
          "certificate",
          "contact",
          "evidence",
          "language",
          "links",
          "mainNavigation",
          "menu",
          "menuClose",
          "menuOpen",
          "navigation",
          "projectExplorer",
          "routeIntros",
          "sections",
          "skipToContent",
          "theme",
          "tooltips",
          "unavailable",
        ],
      },
      {
        locale: "en",
        navigation: expectedRouteKeys,
        routeIntros: expectedRouteKeys,
        groups: [
          "actions",
          "archive",
          "certificate",
          "contact",
          "evidence",
          "language",
          "links",
          "mainNavigation",
          "menu",
          "menuClose",
          "menuOpen",
          "navigation",
          "projectExplorer",
          "routeIntros",
          "sections",
          "skipToContent",
          "theme",
          "tooltips",
          "unavailable",
        ],
      },
    ])
  })

  it("exposes the complete redesign labels in both locales", () => {
    // Given: every new interactive and archive label required by the redesign
    const expected = {
      zh: {
        theme: { light: "浅色", dark: "深色", toLight: "切换至浅色主题", toDark: "切换至深色主题" },
        tooltips: { menu: "打开导航菜单", language: "切换语言", contact: "打开联系方式", theme: "切换主题" },
        actions: { experience: "查看经历", projects: "探索项目" },
        projectExplorer: {
          category: "项目类别",
          name: "项目名称",
          allCategories: "全部类别",
          allProjects: "全部项目",
          honor: "荣誉",
          allHonors: "全部荣誉",
          open: "查看项目详情",
          close: "关闭项目详情",
          pending: "请补充",
          emptySource: "暂无项目资料。",
          current: "当前项目",
          skillOrigin: "来自技能证据",
          imagePending: "项目图片待补充",
          imagePendingAlt: "项目占位图片；项目图片待补充",
        },
        archive: { ledgerOverline: "获奖档案", researchOverline: "研究档案" },
        menuOpen: "打开菜单",
        menuClose: "关闭菜单",
      },
      en: {
        theme: { light: "Light", dark: "Dark", toLight: "Switch to light theme", toDark: "Switch to dark theme" },
        tooltips: { menu: "Open navigation menu", language: "Change language", contact: "Open contact details", theme: "Change theme" },
        actions: { experience: "View experience", projects: "Explore projects" },
        projectExplorer: {
          category: "Project category",
          name: "Project name",
          allCategories: "All categories",
          allProjects: "All projects",
          honor: "Honor",
          allHonors: "All honors",
          open: "Open project details",
          close: "Close project details",
          pending: "To be completed",
          emptySource: "No project records available.",
          current: "Current project",
          skillOrigin: "From skill evidence",
          imagePending: "Project image pending",
          imagePendingAlt: "Project placeholder image; project image pending",
        },
        archive: { ledgerOverline: "Achievement ledger", researchOverline: "Research archive" },
        menuOpen: "Open menu",
        menuClose: "Close menu",
      },
    }

    // When: both locale objects expose their redesign groups
    const actual = {
      zh: {
        theme: UI.zh.theme,
        tooltips: UI.zh.tooltips,
        actions: UI.zh.actions,
        projectExplorer: UI.zh.projectExplorer,
        archive: UI.zh.archive,
        menuOpen: UI.zh.menuOpen,
        menuClose: UI.zh.menuClose,
      },
      en: {
        theme: UI.en.theme,
        tooltips: UI.en.tooltips,
        actions: UI.en.actions,
        projectExplorer: UI.en.projectExplorer,
        archive: UI.en.archive,
        menuOpen: UI.en.menuOpen,
        menuClose: UI.en.menuClose,
      },
    }

    // Then: visible text, accessible destinations, and archive overlines stay exact
    expect(actual).toEqual(expected)
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
