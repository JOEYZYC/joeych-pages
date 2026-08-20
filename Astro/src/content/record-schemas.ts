import { z } from "astro/zod"

import { publicMediaPathSchema } from "../lib/profile-paths"
import {
  certificateSchema,
  hasUniqueIds,
  linkSchema,
  localizedSchema,
  projectIdSchema,
  recordIdSchema,
  textSchema,
} from "./schema-fields"

const projectFigureSchema = z
  .object({
    id: recordIdSchema,
    src: publicMediaPathSchema.optional(),
    zh: textSchema,
    en: textSchema,
  })
  .strict()
  .readonly()

const relatedAchievementSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("award"), id: recordIdSchema }).strict().readonly(),
    z.object({ kind: z.literal("publication"), id: recordIdSchema }).strict().readonly(),
  ])
  .readonly()

function hasUniqueRelatedAchievements(
  achievements: readonly { readonly kind: string; readonly id: string }[],
): boolean {
  return new Set(achievements.map(({ kind, id }) => `${kind}:${id}`)).size === achievements.length
}

export const projectSchema = z
  .object({
    id: projectIdSchema,
    year: z.number().int(),
    featured: z.boolean(),
    image: publicMediaPathSchema.nullable(),
    title: localizedSchema,
    claim: localizedSchema,
    category: localizedSchema,
    summary: localizedSchema,
    contribution: localizedSchema,
    tags: z.array(localizedSchema).readonly(),
    figures: z
      .array(projectFigureSchema)
      .refine(hasUniqueIds, "duplicate project figure ID")
      .readonly(),
    links: z.array(linkSchema).readonly(),
    related_achievements: z
      .array(relatedAchievementSchema)
      .refine(hasUniqueRelatedAchievements, "duplicate related achievement")
      .readonly(),
  })
  .strict()
  .readonly()

export const awardSchema = z
  .object({
    id: recordIdSchema,
    year: z.number().int(),
    featured: z.boolean(),
    title: localizedSchema,
    prizes: z
      .array(z.object({ level: textSchema, zh: textSchema, en: textSchema }).strict().readonly())
      .readonly(),
    tags: z.array(textSchema).readonly(),
    links: z.array(linkSchema).readonly(),
    certificates: z.array(certificateSchema).readonly(),
  })
  .strict()
  .readonly()

const authoredRecordShape = {
  id: recordIdSchema,
  year: z.number().int(),
  featured: z.boolean(),
  title: localizedSchema,
  authors: localizedSchema,
  tags: z.array(textSchema).readonly(),
  links: z.array(linkSchema).readonly(),
  certificates: z.array(certificateSchema).readonly(),
} as const

export const publicationSchema = z
  .object({ ...authoredRecordShape, venue: localizedSchema })
  .strict()
  .readonly()
export const patentSchema = z.object(authoredRecordShape).strict().readonly()
export const thesisSchema = z
  .object({
    id: recordIdSchema,
    year: z.number().int(),
    featured: z.boolean(),
    image: publicMediaPathSchema.nullable(),
    title: localizedSchema,
    award: localizedSchema,
    tags: z.array(textSchema).readonly(),
    links: z.array(linkSchema).readonly(),
  })
  .strict()
  .readonly()

export const projectsSchema = z
  .array(projectSchema)
  .refine(hasUniqueIds, "duplicate project ID")
  .readonly()
export const awardsSchema = z
  .array(awardSchema)
  .refine(hasUniqueIds, "duplicate award ID")
  .readonly()
export const publicationsSchema = z
  .array(publicationSchema)
  .refine(hasUniqueIds, "duplicate publication ID")
  .readonly()
export const patentsSchema = z
  .array(patentSchema)
  .refine(hasUniqueIds, "duplicate patent ID")
  .readonly()
