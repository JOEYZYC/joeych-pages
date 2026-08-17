import { beforeEach, describe, expect, it, vi } from "vitest"

const lstat = vi.hoisted(() => vi.fn())

vi.mock("node:fs/promises", () => ({ lstat }))

import { assertPublicMediaExists, UnsafePublicMediaError } from "../src/lib/media"
import { PROJECT_PLACEHOLDER_MEDIA_PATH } from "../src/lib/profile-paths"

describe("public media filesystem boundary", () => {
  beforeEach(() => {
    lstat.mockReset()
  })

  it("rejects a symbolic link in a public media path", async () => {
    lstat
      .mockResolvedValueOnce({ isFile: () => false, isSymbolicLink: () => false })
      .mockResolvedValueOnce({ isFile: () => false, isSymbolicLink: () => true })

    await expect(assertPublicMediaExists([PROJECT_PLACEHOLDER_MEDIA_PATH])).rejects.toBeInstanceOf(
      UnsafePublicMediaError,
    )
  })
})
