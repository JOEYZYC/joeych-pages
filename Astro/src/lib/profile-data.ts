import { readFile } from "node:fs/promises"

import type { z } from "astro/zod"

import { parseYamlValue } from "../content/loaders"
import {
  type Award,
  awardsSchema,
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
import {
  assertPublicMediaExists,
  MissingPublicMediaError,
  UnsafePublicMediaError,
} from "./media"
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

async function readProfileDocument(source: string, url: URL): Promise<unknown> {
  try {
    return parseYamlValue(await readFile(url, "utf8"))
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown document loading failure"
    throw new ProfileContentError({ source, detail }, { cause: error })
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

function validateRelatedAchievements(
  projects: readonly Project[],
  awards: readonly Award[],
  publications: readonly Publication[],
): void {
  const awardIds = new Set(awards.map(({ id }) => id))
  const publicationIds = new Set(publications.map(({ id }) => id))

  for (const project of projects) {
    for (const achievement of project.related_achievements) {
      const known = achievement.kind === "award"
        ? awardIds.has(achievement.id)
        : publicationIds.has(achievement.id)
      if (!known) {
        throw new ProfileContentError({
          source: PROFILE_DATA_FILES.projects,
          detail: `project ${project.id} references unknown ${achievement.kind} ${achievement.id}`,
        })
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

function publicationImages(publications: readonly Publication[]): readonly PublicMediaPath[] {
  return publications.flatMap((publication) => publication.image === null ? [] : [publication.image])
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
  validateRelatedAchievements(projects, awards, publications)
  const certificates = [
    ...awards.flatMap(({ certificates: items }) => items),
    ...publications.flatMap(({ certificates: items }) => items),
    ...patents.flatMap(({ certificates: items }) => items),
  ]
  const associatedMedia = [
    profile.portrait,
    profile.hero_background.light,
    profile.hero_background.dark,
    profile.favicon,
    PROJECT_PLACEHOLDER_MEDIA_PATH,
    ...validateProjectMedia(projects),
    ...publicationImages(publications),
    ...certificates.map(({ src }) => src),
    ...(thesis.image === null ? [] : [thesis.image]),
  ]

  try {
    await assertPublicMediaExists(associatedMedia)
  } catch (error) {
    if (error instanceof MissingPublicMediaError || error instanceof UnsafePublicMediaError) {
      throw new ProfileContentError(
        { source: "Profile/media", detail: error.message },
        { cause: error },
      )
    }
    throw error
  }

  return { profile, projects, awards, publications, patents, thesis }
}

export async function loadProfileData(): Promise<ProfileData> {
  const [profile, projects, awards, publications, patents, thesis] = await Promise.all([
    readProfileDocument(PROFILE_DATA_FILES.profile, PROFILE_DATA_URLS.profile),
    readProfileDocument(PROFILE_DATA_FILES.projects, PROFILE_DATA_URLS.projects),
    readProfileDocument(PROFILE_DATA_FILES.awards, PROFILE_DATA_URLS.awards),
    readProfileDocument(PROFILE_DATA_FILES.publications, PROFILE_DATA_URLS.publications),
    readProfileDocument(PROFILE_DATA_FILES.patents, PROFILE_DATA_URLS.patents),
    readProfileDocument(PROFILE_DATA_FILES.thesis, PROFILE_DATA_URLS.thesis),
  ])

  return parseProfileDocuments({ profile, projects, awards, publications, patents, thesis })
}

let profileDataPromise: Promise<ProfileData> | undefined

export function getProfileData(): Promise<ProfileData> {
  profileDataPromise ??= loadProfileData()
  return profileDataPromise
}
