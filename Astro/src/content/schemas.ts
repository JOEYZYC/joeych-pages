import type { z } from "astro/zod"
import type { profileSchema } from "./profile-schema"
import type {
  awardSchema,
  patentSchema,
  projectSchema,
  publicationSchema,
  thesisSchema,
} from "./record-schemas"
import type { certificateSchema } from "./schema-fields"

export { profileSchema } from "./profile-schema"
export {
  awardSchema,
  awardsSchema,
  patentSchema,
  patentsSchema,
  projectSchema,
  projectsSchema,
  publicationSchema,
  publicationsSchema,
  thesisSchema,
} from "./record-schemas"
export { projectIdSchema } from "./schema-fields"

export type Profile = z.infer<typeof profileSchema>
export type Project = z.infer<typeof projectSchema>
export type Award = z.infer<typeof awardSchema>
export type Publication = z.infer<typeof publicationSchema>
export type Patent = z.infer<typeof patentSchema>
export type Thesis = z.infer<typeof thesisSchema>
export type Certificate = z.infer<typeof certificateSchema>
