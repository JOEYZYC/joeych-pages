import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { z } from "astro/zod"

export const PROFILE_DATA_FILES = {
  profile: "profile.yml",
  projects: "projects.yml",
  awards: "awards.yml",
  publications: "publications.yml",
  patents: "patents.yml",
  thesis: "thesis.yml",
} as const

function resolveProfileRoot(): URL {
  const candidates = [
    fileURLToPath(new URL("../../../Profile/", import.meta.url)),
    fileURLToPath(new URL("../../../../Profile/", import.meta.url)),
    path.resolve(process.cwd(), "../Profile"),
    path.resolve(process.cwd(), "Profile"),
  ]
  const root = candidates.find(
    (candidate) => existsSync(path.join(candidate, "data")) && existsSync(path.join(candidate, "media")),
  )
  if (root === undefined) {
    throw new Error("Unable to locate the public Profile package")
  }
  return pathToFileURL(`${root}${path.sep}`)
}

const PROFILE_ROOT = resolveProfileRoot()
const PROFILE_DATA_ROOT = new URL("data/", PROFILE_ROOT)
const PROFILE_MEDIA_ROOT = new URL("media/", PROFILE_ROOT)
export const PROFILE_MEDIA_DIRECTORY = fileURLToPath(PROFILE_MEDIA_ROOT)

export const PROFILE_DATA_URLS = {
  profile: new URL(PROFILE_DATA_FILES.profile, PROFILE_DATA_ROOT),
  projects: new URL(PROFILE_DATA_FILES.projects, PROFILE_DATA_ROOT),
  awards: new URL(PROFILE_DATA_FILES.awards, PROFILE_DATA_ROOT),
  publications: new URL(PROFILE_DATA_FILES.publications, PROFILE_DATA_ROOT),
  patents: new URL(PROFILE_DATA_FILES.patents, PROFILE_DATA_ROOT),
  thesis: new URL(PROFILE_DATA_FILES.thesis, PROFILE_DATA_ROOT),
} as const

export class ProfilePathError extends Error {
  override readonly name = "ProfilePathError"

  constructor(
    readonly sourcePath: string,
    readonly pathKind: "media",
  ) {
    super(`Invalid ${pathKind} path: ${sourcePath}`)
  }
}

function normalizeRelativePath(sourcePath: string, pathKind: "media"): string {
  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(sourcePath)
  } catch {
    throw new ProfilePathError(sourcePath, pathKind)
  }
  const normalized = path.posix.normalize(sourcePath)
  const segments = sourcePath.split("/")
  const hasUnsafeSegment = segments.some(
    (segment) => segment === "" || segment === "." || segment === "..",
  )

  if (
    sourcePath.includes("\\") ||
    decodedPath !== sourcePath ||
    path.posix.isAbsolute(sourcePath) ||
    normalized !== sourcePath ||
    hasUnsafeSegment
  ) {
    throw new ProfilePathError(sourcePath, pathKind)
  }

  return sourcePath
}

export function normalizeMediaPath(sourcePath: string): string {
  return `/${normalizeRelativePath(sourcePath, "media")}`
}

export const publicMediaPathSchema = z
  .string()
  .min(1)
  .transform(normalizeMediaPath)
  .brand("PublicMediaPath")
export const PROJECT_PLACEHOLDER_MEDIA_PATH = publicMediaPathSchema.parse("projects/project-placeholder.png")

export type PublicMediaPath = z.infer<typeof publicMediaPathSchema>

export function publicMediaFilePath(publicPath: PublicMediaPath): string {
  const filePath = path.resolve(PROFILE_MEDIA_DIRECTORY, publicPath.slice(1))
  const relativePath = path.relative(PROFILE_MEDIA_DIRECTORY, filePath)
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new ProfilePathError(publicPath, "media")
  }
  return filePath
}
