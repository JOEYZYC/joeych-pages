import { describe, expect, it } from "vitest"

import { UI } from "../src/i18n/ui"
import { getPageMeta } from "../src/lib/page-meta"
import { getProfileData } from "../src/lib/profile-data"
import { ROUTE_IDS } from "../src/lib/routes"

describe("page metadata", () => {
  it("derives all approved localized page titles and descriptions from Profile and UI labels", async () => {
    // Given: canonical Profile identity fields and the ten approved locale-route pairs
    const { profile } = await getProfileData()

    // When: each page asks for its typed metadata
    const actual = ROUTE_IDS.flatMap((routeId) => (["zh", "en"] as const).map((locale) => ({
        locale,
        routeId,
        meta: getPageMeta({ locale, profile, routeId }),
      })))

    // Then: every title and description is exhaustive, localized, and source-derived
    expect(actual).toEqual(
      ROUTE_IDS.flatMap((routeId) => (["zh", "en"] as const).map((locale) => ({
          locale,
          routeId,
          meta: {
            title: `${UI[locale].routeIntros[routeId].title} | ${profile.name[locale]}`,
            description: `${UI[locale].routeIntros[routeId].title}: ${profile.summary[locale]}`,
          },
        }))),
    )
  })
})
