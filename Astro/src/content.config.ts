import { defineCollection } from "astro:content"
import { file } from "astro/loaders"
import {
  parseProfileCollection,
  parseRecordCollection,
  parseThesisCollection,
} from "./content/loaders"
import {
  awardSchema,
  patentSchema,
  profileSchema,
  projectSchema,
  publicationSchema,
  thesisSchema,
} from "./content/schemas"
import { loadProfileData } from "./lib/profile-data"
import { PROFILE_CONTENT_PATHS } from "./lib/profile-paths"

await loadProfileData()

const profile = defineCollection({
  loader: file(PROFILE_CONTENT_PATHS.profile, { parser: parseProfileCollection }),
  schema: profileSchema,
})
const projects = defineCollection({
  loader: file(PROFILE_CONTENT_PATHS.projects, { parser: parseRecordCollection }),
  schema: projectSchema,
})
const awards = defineCollection({
  loader: file(PROFILE_CONTENT_PATHS.awards, { parser: parseRecordCollection }),
  schema: awardSchema,
})
const publications = defineCollection({
  loader: file(PROFILE_CONTENT_PATHS.publications, { parser: parseRecordCollection }),
  schema: publicationSchema,
})
const patents = defineCollection({
  loader: file(PROFILE_CONTENT_PATHS.patents, { parser: parseRecordCollection }),
  schema: patentSchema,
})
const thesis = defineCollection({
  loader: file(PROFILE_CONTENT_PATHS.thesis, { parser: parseThesisCollection }),
  schema: thesisSchema,
})

export const collections = { profile, projects, awards, publications, patents, thesis } as const
