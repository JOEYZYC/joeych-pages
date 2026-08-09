import { readFile } from "node:fs/promises"

import type { z } from "astro/zod"

import { parseYamlValue } from "../content/loaders"
import {
  type Award,
  awardsSchema,
  type Certificate,
  type Patent,
  type Profile,
  type Project,
  type Publication,
  patentsSchema,
  profileSchema,
  projectsSchema,
  publicationsSchema,
  type Thesis,
  thesisSchema,
} from "../content/schemas"
import { assertPublicMediaExists, MissingPublicMediaError } from "./media"
import {
  PROFILE_DATA_FILES,
  PROFILE_DATA_URLS,
  PROJECT_PLACEHOLDER_MEDIA_PATH,
  ProfilePathError,
  type PublicMediaPath,
} from "./profile-paths"

export type ProfileDocuments = {
  readonly profile: unknown
  readonly projects: unknown
  readonly awards: unknown
  readonly publications: unknown
  readonly patents: unknown
  readonly thesis: unknown
}

export type ProfileData = {
  readonly profile: Profile
  readonly projects: readonly Project[]
  readonly awards: readonly Award[]
  readonly publications: readonly Publication[]
  readonly patents: readonly Patent[]
  readonly thesis: Thesis
  readonly certificates: readonly Certificate[]
}

type ProfileContentIssue = {
  readonly source: string
  readonly detail: string
}

export class ProfileContentError extends Error {
  override readonly name = "ProfileContentError"

  constructor(
    readonly issue: ProfileContentIssue,
    options?: ErrorOptions,
  ) {
    super(`${issue.source}: ${issue.detail}`, options)
  }
}

function parseSchema<T>(source: string, schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ")
    throw new ProfileContentError({ source, detail })
  }
  return result.data
}

function validateEvidence(profile: Profile, projects: readonly Project[]): void {
  const projectIds = new Set(projects.map(({ id }) => id))
  for (const skill of profile.skills) {
    for (const tag of skill.tags) {
      for (const evidence of tag.evidence) {
        if (evidence.type === "project" && !projectIds.has(evidence.project_id)) {
          throw new ProfileContentError({
            source: PROFILE_DATA_FILES.profile,
            detail: `skill evidence references unknown project ${evidence.project_id}`,
          })
        }
      }
    }
  }
}

function validateProjectMedia(projects: readonly Project[]): readonly PublicMediaPath[] {
  const paths: PublicMediaPath[] = []
  for (const project of projects) {
    if (project.image !== null) {
      paths.push(project.image)
    }
    const sourcedFigures = project.figures.filter(
      (figure): figure is typeof figure & { readonly src: PublicMediaPath } =>
        figure.src !== undefined,
    )
    paths.push(...sourcedFigures.map(({ src }) => src))
    const firstFigure = sourcedFigures[0]
    if (project.image !== null && firstFigure !== undefined && project.image !== firstFigure.src) {
      throw new ProfileContentError({
        source: PROFILE_DATA_FILES.projects,
        detail: `project ${project.id} image must match its first sourced figure`,
      })
    }
  }
  return paths
}

export async function parseProfileDocuments(documents: ProfileDocuments): Promise<ProfileData> {
  let profile: Profile
  let projects: readonly Project[]
  let awards: readonly Award[]
  let publications: readonly Publication[]
  let patents: readonly Patent[]
  let thesis: Thesis

  try {
    profile = parseSchema(PROFILE_DATA_FILES.profile, profileSchema, documents.profile)
    projects = parseSchema(PROFILE_DATA_FILES.projects, projectsSchema, documents.projects)
    awards = parseSchema(PROFILE_DATA_FILES.awards, awardsSchema, documents.awards)
    publications = parseSchema(
      PROFILE_DATA_FILES.publications,
      publicationsSchema,
      documents.publications,
    )
    patents = parseSchema(PROFILE_DATA_FILES.patents, patentsSchema, documents.patents)
    thesis = parseSchema(PROFILE_DATA_FILES.thesis, thesisSchema, documents.thesis)
  } catch (error) {
    if (error instanceof ProfilePathError) {
      throw new ProfileContentError(
        { source: error.pathKind, detail: error.message },
        { cause: error },
      )
    }
    throw error
  }

  validateEvidence(profile, projects)
  const certificates = [
    ...awards.flatMap(({ certificates: items }) => items),
    ...publications.flatMap(({ certificates: items }) => items),
    ...patents.flatMap(({ certificates: items }) => items),
  ]
  const associatedMedia = [
    profile.portrait,
    profile.favicon,
    PROJECT_PLACEHOLDER_MEDIA_PATH,
    ...validateProjectMedia(projects),
    ...certificates.map(({ src }) => src),
  ]

  try {
    await assertPublicMediaExists(associatedMedia)
  } catch (error) {
    if (error instanceof MissingPublicMediaError) {
      throw new ProfileContentError(
        { source: "Profile/media", detail: error.message },
        { cause: error },
      )
    }
    throw error
  }

  return { profile, projects, awards, publications, patents, thesis, certificates }
}

export async function loadProfileData(): Promise<ProfileData> {
  const [profile, projects, awards, publications, patents, thesis] = await Promise.all([
    readFile(PROFILE_DATA_URLS.profile, "utf8"),
    readFile(PROFILE_DATA_URLS.projects, "utf8"),
    readFile(PROFILE_DATA_URLS.awards, "utf8"),
    readFile(PROFILE_DATA_URLS.publications, "utf8"),
    readFile(PROFILE_DATA_URLS.patents, "utf8"),
    readFile(PROFILE_DATA_URLS.thesis, "utf8"),
  ])

  return parseProfileDocuments({
    profile: parseYamlValue(profile),
    projects: parseYamlValue(projects),
    awards: parseYamlValue(awards),
    publications: parseYamlValue(publications),
    patents: parseYamlValue(patents),
    thesis: parseYamlValue(thesis),
  })
}

export function getProfileData(): Promise<ProfileData> {
  return loadProfileData()
}
