import { lstat } from "node:fs/promises"
import path from "node:path"

import {
  PROFILE_DIRECTORY,
  type PublicMediaPath,
  publicMediaFilePath,
} from "./profile-paths"

export class MissingPublicMediaError extends Error {
  override readonly name = "MissingPublicMediaError"

  constructor(
    readonly publicPath: PublicMediaPath,
    options?: ErrorOptions,
  ) {
    super(`Missing public media: ${publicPath}`, options)
  }
}

export class UnsafePublicMediaError extends Error {
  override readonly name = "UnsafePublicMediaError"

  constructor(readonly publicPath: PublicMediaPath) {
    super(`Public media path contains a symbolic link: ${publicPath}`)
  }
}

async function assertPublicMediaFile(publicPath: PublicMediaPath): Promise<void> {
  try {
    const filePath = publicMediaFilePath(publicPath)
    const relativePath = path.relative(PROFILE_DIRECTORY, filePath)
    let currentPath = PROFILE_DIRECTORY
    let mediaStat = await lstat(currentPath)
    if (mediaStat.isSymbolicLink()) {
      throw new UnsafePublicMediaError(publicPath)
    }
    for (const segment of relativePath.split(path.sep)) {
      currentPath = path.join(currentPath, segment)
      mediaStat = await lstat(currentPath)
      if (mediaStat.isSymbolicLink()) {
        throw new UnsafePublicMediaError(publicPath)
      }
    }
    if (!mediaStat.isFile()) {
      throw new MissingPublicMediaError(publicPath)
    }
  } catch (error) {
    if (error instanceof MissingPublicMediaError || error instanceof UnsafePublicMediaError) {
      throw error
    }
    if (error instanceof Error) {
      throw new MissingPublicMediaError(publicPath, { cause: error })
    }
    throw error
  }
}

export async function assertPublicMediaExists(
  publicPaths: readonly PublicMediaPath[],
): Promise<void> {
  await Promise.all([...new Set(publicPaths)].map(assertPublicMediaFile))
}
