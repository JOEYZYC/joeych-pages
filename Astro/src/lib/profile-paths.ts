import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { z } from "astro/zod"

function resolveProfileRoot(): string {
  const candidates = [
    fileURLToPath(new URL("../../../Profile/", import.meta.url)),
    fileURLToPath(new URL("../../../../Profile/", import.meta.url)),
    path.resolve(process.cwd(), "../Profile"),
    path.resolve(process.cwd(), "Profile"),
  ]
  const root = candidates.find((candidate) =>
    existsSync(path.join(candidate, "site", "site.yml")) &&
    existsSync(path.join(candidate, "home", "home.yml")) &&
    existsSync(path.join(candidate, "about", "about.yml")) &&
    existsSync(path.join(candidate, "projects", "index.yml")) &&
    existsSync(path.join(candidate, "projects", "page.yml")) &&
    existsSync(path.join(candidate, "tech-stack", "tech-stack.yml")))
  if (root === undefined) throw new Error("Unable to locate the public Profile package")
  return root
}

export const PROFILE_DIRECTORY = resolveProfileRoot()
export const PROFILE_URL = pathToFileURL(`${PROFILE_DIRECTORY}${path.sep}`)
export const SITE_DOCUMENT_URL = new URL("site/site.yml", PROFILE_URL)
export const HOME_DOCUMENT_URL = new URL("home/home.yml", PROFILE_URL)
export const ABOUT_DOCUMENT_URL = new URL("about/about.yml", PROFILE_URL)
export const PROJECT_PAGE_DOCUMENT_URL = new URL("projects/page.yml", PROFILE_URL)
export const PROJECTS_INDEX_URL = new URL("projects/index.yml", PROFILE_URL)
export const TECH_STACK_DOCUMENT_URL = new URL("tech-stack/tech-stack.yml", PROFILE_URL)
export const PROJECTS_DIRECTORY = path.join(PROFILE_DIRECTORY, "projects")

export class ProfilePathError extends Error {
  override readonly name = "ProfilePathError"

  constructor(readonly sourcePath: string) {
    super(`Invalid public path: ${sourcePath}`)
  }
}

function publicPath(...segments: readonly string[]): PublicMediaPath {
  const value = `/${segments.join("/")}`
  if (segments.some((segment) => segment.length === 0 || segment.includes("/") || segment.includes("\\"))) {
    throw new ProfilePathError(value)
  }
  return value
}

export const publicMediaPathSchema = z.string().startsWith("/")
export type PublicMediaPath = z.infer<typeof publicMediaPathSchema>

export function siteMediaPath(filename: string): PublicMediaPath {
  return publicPath("site", filename)
}

export function homeMediaPath(filename: string): PublicMediaPath {
  return publicPath("home", filename)
}

export function projectMediaPath(projectId: string, filename: string): PublicMediaPath {
  return publicPath("projects", projectId, filename)
}

export function projectDocumentUrl(projectId: string): URL {
  return new URL(`projects/${projectId}/project.yml`, PROFILE_URL)
}

export function publicMediaFilePath(publicPathValue: PublicMediaPath): string {
  const filePath = path.resolve(PROFILE_DIRECTORY, publicPathValue.slice(1))
  const relativePath = path.relative(PROFILE_DIRECTORY, filePath)
  if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new ProfilePathError(publicPathValue)
  }
  return filePath
}
