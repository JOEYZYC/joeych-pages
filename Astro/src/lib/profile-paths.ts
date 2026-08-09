import path, { resolve } from "node:path"
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

export const PROFILE_CONTENT_PATHS = {
  profile: "../Profile/data/profile.yml",
  projects: "../Profile/data/projects.yml",
  awards: "../Profile/data/awards.yml",
  publications: "../Profile/data/publications.yml",
  patents: "../Profile/data/patents.yml",
  thesis: "../Profile/data/thesis.yml",
} as const

const PROFILE_ROOT = pathToFileURL(`${resolve(process.cwd(), "../Profile")}/`)
const PROFILE_DATA_ROOT = new URL("data/", PROFILE_ROOT)
const PROFILE_MEDIA_ROOT = new URL("media/", PROFILE_ROOT)
const CERTIFICATE_PREFIX = "assets/img/certificates/"

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
    readonly pathKind: "media" | "certificate",
  ) {
    super(`Invalid ${pathKind} path: ${sourcePath}`)
  }
}

function normalizeRelativePath(sourcePath: string, pathKind: "media" | "certificate"): string {
  const normalized = path.posix.normalize(sourcePath)
  const segments = sourcePath.split("/")
  const hasUnsafeSegment = segments.some(
    (segment) => segment === "" || segment === "." || segment === "..",
  )

  if (
    sourcePath.includes("\\") ||
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

export function normalizeCertificatePath(sourcePath: string): string {
  if (!sourcePath.startsWith(CERTIFICATE_PREFIX)) {
    throw new ProfilePathError(sourcePath, "certificate")
  }

  const certificatePath = sourcePath.slice(CERTIFICATE_PREFIX.length)
  return `/certificates/${normalizeRelativePath(certificatePath, "certificate")}`
}

export const publicMediaPathSchema = z
  .string()
  .min(1)
  .transform(normalizeMediaPath)
  .brand("PublicMediaPath")
export const PROJECT_PLACEHOLDER_MEDIA_PATH = publicMediaPathSchema.parse("profile-photo.jpg")

export const certificatePathSchema = z
  .string()
  .min(1)
  .transform(normalizeCertificatePath)
  .brand("PublicMediaPath")

export type PublicMediaPath = z.infer<typeof publicMediaPathSchema>

export function publicMediaFilePath(publicPath: PublicMediaPath): string {
  return fileURLToPath(new URL(`.${publicPath}`, PROFILE_MEDIA_ROOT))
}
