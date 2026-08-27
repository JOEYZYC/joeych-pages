import { describe, expect, it } from "vitest"

import { getProfileData } from "../src/lib/profile-data"
import { getProjectMediaDimensions } from "../src/lib/project-media"

describe("project media dimensions", () => {
  it("covers every rendered project image and certificate", async () => {
    const { projects } = await getProfileData()
    const mediaPaths = projects.flatMap((project) => [
      ...(project.image === null ? [] : [project.image]),
      ...project.figures.flatMap(({ src }) => src === undefined ? [] : [src]),
      ...project.awards.flatMap(({ certificates }) => certificates.map(({ src }) => src)),
      ...project.publications.flatMap(({ certificates }) => certificates.map(({ src }) => src)),
      ...project.patents.flatMap(({ certificates }) => certificates.map(({ src }) => src)),
    ])

    expect([...new Set(mediaPaths)].filter((path) => getProjectMediaDimensions(path) === undefined)).toEqual([])
  })
})
