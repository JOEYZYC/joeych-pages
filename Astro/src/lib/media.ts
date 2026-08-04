import { stat } from "node:fs/promises"

import { type PublicMediaPath, publicMediaFilePath } from "./profile-paths"

export class MissingPublicMediaError extends Error {
  override readonly name = "MissingPublicMediaError"

  constructor(
    readonly publicPath: PublicMediaPath,
    options?: ErrorOptions,
  ) {
    super(`Missing public media: ${publicPath}`, options)
  }
}

async function assertPublicMediaFile(publicPath: PublicMediaPath): Promise<void> {
  try {
    const mediaStat = await stat(publicMediaFilePath(publicPath))
    if (!mediaStat.isFile()) {
      throw new MissingPublicMediaError(publicPath)
    }
  } catch (error) {
    if (error instanceof MissingPublicMediaError) {
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
