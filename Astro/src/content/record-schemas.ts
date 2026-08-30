import { z } from "astro/zod"

import {
  certificateSchema,
  hasUniqueIds,
  linkSchema,
  localizedSchema,
  localMediaFileSchema,
  projectIdSchema,
  recordIdSchema,
  textSchema,
} from "./schema-fields"

const projectFigureSchema = z
  .object({
    id: recordIdSchema,
    src: localMediaFileSchema.optional(),
    zh: textSchema,
    en: textSchema,
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
  featured: z.boolean(),
  title: localizedSchema,
  authors: localizedSchema,
  tags: z.array(textSchema).readonly(),
  links: z.array(linkSchema).readonly(),
  certificates: z.array(certificateSchema).readonly(),
} as const

export const publicationSchema = z
  .object({ ...authoredRecordShape, year: z.number().int(), image: localMediaFileSchema.nullable(), venue: localizedSchema })
  .strict()
  .readonly()
export const patentSchema = z.object({ ...authoredRecordShape, year: z.number().int().optional() }).strict().readonly()

export const projectSchema = z
  .object({
    id: projectIdSchema,
    year: z.number().int(),
    featured: z.boolean(),
    image: localMediaFileSchema.nullable(),
    title: localizedSchema,
    claim: localizedSchema,
    category: localizedSchema,
    summary: localizedSchema,
    contribution: localizedSchema,
    tags: z.array(localizedSchema).readonly(),
    figures: z.array(projectFigureSchema).refine(hasUniqueIds, "duplicate project figure ID").readonly(),
    links: z.array(linkSchema).readonly(),
    awards: z.array(awardSchema).refine(hasUniqueIds, "duplicate award ID").readonly(),
    publications: z.array(publicationSchema).refine(hasUniqueIds, "duplicate publication ID").readonly(),
    patents: z.array(patentSchema).refine(hasUniqueIds, "duplicate patent ID").readonly(),
  })
  .strict()
  .readonly()

export const projectsIndexSchema = z.array(projectIdSchema).refine(
  (ids) => new Set(ids).size === ids.length,
  "duplicate project ID",
).readonly()
