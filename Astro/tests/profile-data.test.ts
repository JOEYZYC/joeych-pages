import { readFile } from "node:fs/promises"

import { describe, expect, it } from "vitest"
import { parse } from "yaml"

import { localMediaFileSchema, projectIdSchema } from "../src/content/schema-fields"
import { loadProfileData } from "../src/lib/profile-data"
import { publicMediaFilePath } from "../src/lib/profile-paths"

const indexUrl = new URL("../../Profile/projects/index.yml", import.meta.url)

describe("Profile content bundles", () => {
  it("loads page-owned content bundles and indexed projects in authored order", async () => {
    const [data, indexText] = await Promise.all([loadProfileData(), readFile(indexUrl, "utf8")])
    const projectIds = parse(indexText) as string[]

    expect(data.projects.map(({ id }) => id)).toEqual(projectIds)
    expect(data.site.favicon).toBe("/site/favicon.svg")
    expect(data.home.portrait).toBe("/home/portrait-b1-cutout-workshirt-upright-transparent.png")
    expect(data.home.hero_background).toEqual({
      light: "/home/hero-circuit-background-light.png",
      dark: "/home/hero-circuit-background.png",
    })
    expect(data.home.page.title).toEqual({ zh: "首页", en: "Home" })
    expect(data.about.page.title).toEqual({ zh: "自我介绍", en: "About" })
    expect(data.projectPage.page.title).toEqual({ zh: "项目与成果", en: "Projects & Achievements" })
    expect(data.techStack.page.title).toEqual({ zh: "技术栈", en: "Tech Stack" })
    await expect(readFile(publicMediaFilePath(data.site.favicon))).resolves.toBeInstanceOf(Buffer)
  })

  it("embeds only the approved outcomes in their owning projects", async () => {
    const { about, projects, techStack } = await loadProfileData()
    const awards = projects.flatMap(({ awards }) => awards)
    const publications = projects.flatMap(({ publications }) => publications)
    const patents = projects.flatMap(({ patents }) => patents)

    expect(awards.map(({ id }) => id)).toEqual([
      "outstanding-thesis-third-2026",
      "renesas-east-first-national-third-2024",
      "embedded-chip-third-2024",
      "ti-first-2024",
      "raicom-first-national-second-2024",
      "smart-car-east-third-2024",
      "ican-national-first-2023",
      "raicom-jiangsu-third-2023",
    ])
    expect(awards.flatMap(({ certificates }) => certificates)).toHaveLength(10)
    expect(publications).toHaveLength(6)
    expect(publications.flatMap(({ certificates }) => certificates)).toHaveLength(2)
    expect(patents).toEqual([])
    expect(projects.find(({ id }) => id === "2025-Paper-ResGatNetBridgingEfficiencyAndPrecisionInLowSNRWirelessPerception")?.publications.map(({ id }) => id)).toEqual(["resgatnet"])
    expect(projects.filter(({ category }) => category.en === "Publication")).toHaveLength(4)
    expect(about.statistics.map(({ value }) => value)).toEqual(["5/71", 6, 4, "10+"])
    expect(about.education).toHaveLength(1)
    expect(about.campus_experience).toHaveLength(4)
    expect(techStack.skills).toHaveLength(4)
  })

  it.each(["../image.png", "other/image.png", "other\\image.png", "%2e%2e.png", "%ZZ.png"])(
    "rejects non-local media filename %s",
    (value) => expect(localMediaFileSchema.safeParse(value).success).toBe(false),
  )

  it.each(["../project", "Project", "project/name", "project_name", "%2e%2e"])(
    "rejects unsafe project ID %s",
    (value) => expect(projectIdSchema.safeParse(value).success).toBe(false),
  )
})
