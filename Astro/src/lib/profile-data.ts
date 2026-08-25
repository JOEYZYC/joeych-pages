import { lstat, readdir, readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import type { z } from "astro/zod"

import { parseYamlValue } from "../content/loaders"
import {
  type About,
  aboutSchema,
  type Home,
  homeSchema,
  type Project,
  type ProjectPage,
  projectPageSchema,
  projectSchema,
  projectsIndexSchema,
  type Site,
  siteSchema,
  type TechStack,
  techStackSchema,
} from "../content/schemas"
import { assertPublicMediaExists, MissingPublicMediaError, UnsafePublicMediaError } from "./media"
import {
  ABOUT_DOCUMENT_URL,
  HOME_DOCUMENT_URL,
  homeMediaPath,
  PROJECT_PAGE_DOCUMENT_URL,
  PROJECTS_DIRECTORY,
  PROJECTS_INDEX_URL,
  ProfilePathError,
  type PublicMediaPath,
  projectDocumentUrl,
  projectMediaPath,
  SITE_DOCUMENT_URL,
  siteMediaPath,
  TECH_STACK_DOCUMENT_URL,
} from "./profile-paths"

export type ProfileData = {
  readonly site: Site
  readonly home: Home
  readonly about: About
  readonly projectPage: ProjectPage
  readonly projects: readonly Project[]
  readonly techStack: TechStack
}

type ProfileContentIssue = { readonly source: string; readonly detail: string }

export class ProfileContentError extends Error {
  override readonly name = "ProfileContentError"

  constructor(readonly issue: ProfileContentIssue, options?: ErrorOptions) {
    super(`${issue.source}: ${issue.detail}`, options)
  }
}

async function readProfileDocument(source: string, url: URL): Promise<unknown> {
  try {
    const [directoryStat, fileStat] = await Promise.all([
      lstat(fileURLToPath(new URL("./", url))),
      lstat(fileURLToPath(url)),
    ])
    if (directoryStat.isSymbolicLink() || fileStat.isSymbolicLink() || !fileStat.isFile()) {
      throw new Error("document path must be a regular file without symbolic links")
    }
    return parseYamlValue(await readFile(url, "utf8"))
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown document loading failure"
    throw new ProfileContentError({ source, detail }, { cause: error })
  }
}

function parseSchema<T>(source: string, schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    const detail = result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ")
    throw new ProfileContentError({ source, detail })
  }
  return result.data
}

function validateEvidence(techStack: TechStack, projects: readonly Project[]): void {
  const projectIds = new Set(projects.map(({ id }) => id))
  for (const skill of techStack.skills) {
    for (const tag of skill.tags) {
      for (const evidence of tag.evidence) {
        if (evidence.type === "project" && !projectIds.has(evidence.project_id)) {
          throw new ProfileContentError({
            source: "tech-stack/tech-stack.yml",
            detail: `skill evidence references unknown project ${evidence.project_id}`,
          })
        }
      }
    }
  }
}

function validateOutcomeIds(projects: readonly Project[]): void {
  for (const key of ["awards", "publications", "patents"] as const) {
    const ids = projects.flatMap((project) => project[key].map(({ id }) => id))
    if (new Set(ids).size !== ids.length) {
      throw new ProfileContentError({ source: "projects", detail: `duplicate embedded ${key} ID` })
    }
  }
}

function resolveSite(site: Site): Site {
  return { ...site, favicon: siteMediaPath(site.favicon) }
}

function resolveHome(home: Home): Home {
  return {
    ...home,
    portrait: homeMediaPath(home.portrait),
    hero_background: {
      light: homeMediaPath(home.hero_background.light),
      dark: homeMediaPath(home.hero_background.dark),
    },
  }
}

function resolveProject(project: Project): Project {
  const resolveCertificates = <T extends { readonly certificates: readonly { readonly src: string }[] }>(record: T): T => ({
    ...record,
    certificates: record.certificates.map((certificate) => ({
      ...certificate,
      src: projectMediaPath(project.id, certificate.src),
    })),
  })
  return {
    ...project,
    image: project.image === null ? null : projectMediaPath(project.id, project.image),
    figures: project.figures.map((figure) => ({
      ...figure,
      ...(figure.src === undefined ? {} : { src: projectMediaPath(project.id, figure.src) }),
    })),
    awards: project.awards.map(resolveCertificates),
    publications: project.publications.map((publication) => ({
      ...resolveCertificates(publication),
      image: publication.image === null ? null : projectMediaPath(project.id, publication.image),
    })),
    patents: project.patents.map(resolveCertificates),
  }
}

function associatedMedia(site: Site, home: Home, projects: readonly Project[]): readonly PublicMediaPath[] {
  return [
    site.favicon,
    home.portrait,
    home.hero_background.light,
    home.hero_background.dark,
    ...projects.flatMap((project) => [
      ...(project.image === null ? [] : [project.image]),
      ...project.figures.flatMap(({ src }) => src === undefined ? [] : [src]),
      ...project.awards.flatMap(({ certificates }) => certificates.map(({ src }) => src)),
      ...project.publications.flatMap((publication) => [
        ...(publication.image === null ? [] : [publication.image]),
        ...publication.certificates.map(({ src }) => src),
      ]),
      ...project.patents.flatMap(({ certificates }) => certificates.map(({ src }) => src)),
    ]),
  ]
}

async function validateProjectIndex(projectIds: readonly string[]): Promise<void> {
  const indexed = new Set(projectIds)
  const entries = await readdir(PROJECTS_DIRECTORY, { withFileTypes: true })
  const unindexed = entries.filter((entry) => entry.isDirectory() && !indexed.has(entry.name)).map(({ name }) => name)
  if (unindexed.length > 0) {
    throw new ProfileContentError({ source: "projects/index.yml", detail: `unindexed project directories: ${unindexed.join(", ")}` })
  }
}

export async function loadProfileData(): Promise<ProfileData> {
  const [siteValue, homeValue, aboutValue, projectPageValue, indexValue, techStackValue] = await Promise.all([
    readProfileDocument("site/site.yml", SITE_DOCUMENT_URL),
    readProfileDocument("home/home.yml", HOME_DOCUMENT_URL),
    readProfileDocument("about/about.yml", ABOUT_DOCUMENT_URL),
    readProfileDocument("projects/page.yml", PROJECT_PAGE_DOCUMENT_URL),
    readProfileDocument("projects/index.yml", PROJECTS_INDEX_URL),
    readProfileDocument("tech-stack/tech-stack.yml", TECH_STACK_DOCUMENT_URL),
  ])
  const authoredSite = parseSchema("site/site.yml", siteSchema, siteValue)
  const authoredHome = parseSchema("home/home.yml", homeSchema, homeValue)
  const about = parseSchema("about/about.yml", aboutSchema, aboutValue)
  const projectPage = parseSchema("projects/page.yml", projectPageSchema, projectPageValue)
  const projectIds = parseSchema("projects/index.yml", projectsIndexSchema, indexValue)
  const techStack = parseSchema("tech-stack/tech-stack.yml", techStackSchema, techStackValue)
  await validateProjectIndex(projectIds)
  const authoredProjects = await Promise.all(projectIds.map(async (id) => {
    const source = `projects/${id}/project.yml`
    const project = parseSchema(source, projectSchema, await readProfileDocument(source, projectDocumentUrl(id)))
    if (project.id !== id) {
      throw new ProfileContentError({ source, detail: `project ID ${project.id} does not match directory ${id}` })
    }
    return project
  }))
  validateEvidence(techStack, authoredProjects)
  validateOutcomeIds(authoredProjects)
  const site = resolveSite(authoredSite)
  const home = resolveHome(authoredHome)
  const projects = authoredProjects.map(resolveProject)
  try {
    await assertPublicMediaExists(associatedMedia(site, home, projects))
  } catch (error) {
    if (error instanceof MissingPublicMediaError || error instanceof UnsafePublicMediaError || error instanceof ProfilePathError) {
      throw new ProfileContentError({ source: "Profile", detail: error.message }, { cause: error })
    }
    throw error
  }
  return { site, home, about, projectPage, projects, techStack }
}

let profileDataPromise: Promise<ProfileData> | undefined

export function getProfileData(): Promise<ProfileData> {
  profileDataPromise ??= loadProfileData()
  return profileDataPromise
}
