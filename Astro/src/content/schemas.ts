import type { z } from "astro/zod"
import type {
  aboutSchema,
  homeSchema,
  pageMetaSchema,
  projectPageSchema,
  siteSchema,
  techStackSchema,
} from "./page-schemas"
import type {
  awardSchema,
  patentSchema,
  projectSchema,
  publicationSchema,
} from "./record-schemas"
import type { certificateSchema } from "./schema-fields"

export {
  aboutSchema,
  homeSchema,
  pageMetaSchema,
  projectPageSchema,
  siteSchema,
  techStackSchema,
} from "./page-schemas"
export {
  awardSchema,
  patentSchema,
  projectSchema,
  projectsIndexSchema,
  publicationSchema,
} from "./record-schemas"
export { projectIdSchema } from "./schema-fields"

export type Site = z.infer<typeof siteSchema>
export type Home = z.infer<typeof homeSchema>
export type About = z.infer<typeof aboutSchema>
export type PageMeta = z.infer<typeof pageMetaSchema>
export type ProjectPage = z.infer<typeof projectPageSchema>
export type TechStack = z.infer<typeof techStackSchema>
export type Project = z.infer<typeof projectSchema>
export type Award = z.infer<typeof awardSchema>
export type Publication = z.infer<typeof publicationSchema>
export type Patent = z.infer<typeof patentSchema>
export type Certificate = z.infer<typeof certificateSchema>
