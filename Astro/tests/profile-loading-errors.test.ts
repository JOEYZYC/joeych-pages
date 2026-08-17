import { describe, expect, it, vi } from "vitest"

const readFile = vi.hoisted(() => vi.fn())
const lstat = vi.hoisted(() => vi.fn())

vi.mock("node:fs/promises", () => ({ lstat, readFile }))

import { loadProfileData, type ProfileContentError } from "../src/lib/profile-data"

describe("Profile document loading failures", () => {
  it("identifies the source document and preserves the filesystem cause", async () => {
    const cause = new Error("access denied")
    readFile.mockRejectedValue(cause)

    const result = loadProfileData()

    await expect(result).rejects.toMatchObject({
      name: "ProfileContentError",
      issue: { source: "profile.yml", detail: "access denied" },
      cause,
    } satisfies Partial<ProfileContentError>)
  })
})
