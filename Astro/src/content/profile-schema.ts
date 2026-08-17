import { z } from "astro/zod"

import { publicMediaPathSchema } from "../lib/profile-paths"
import {
  componentIdSchema,
  hasUniqueIds,
  httpsUrlSchema,
  localizedSchema,
  projectIdSchema,
  recordIdSchema,
  textSchema,
} from "./schema-fields"

const projectEvidenceSchema = z
  .object({
    type: z.literal("project"),
    project_id: projectIdSchema,
    scope: z.literal("project-record"),
    supports: z.array(componentIdSchema).min(1).readonly(),
  })
  .strict()
  .readonly()
const credentialEvidenceSchema = z
  .object({
    type: z.literal("credential"),
    verification: z.literal("public-profile-claim"),
    supports: z.array(componentIdSchema).min(1).readonly(),
  })
  .strict()
  .readonly()
const generalAbilityEvidenceSchema = z
  .object({
    type: z.literal("general-ability"),
    verification: z.literal("self-described"),
    level: z.union([z.literal("working"), z.literal("exposure")]),
    supports: z.array(componentIdSchema).min(1).readonly(),
  })
  .strict()
  .readonly()
const skillEvidenceSchema = z.discriminatedUnion("type", [
  projectEvidenceSchema,
  credentialEvidenceSchema,
  generalAbilityEvidenceSchema,
])
const skillTagSchema = z
  .object({
    id: recordIdSchema,
    zh: textSchema,
    en: textSchema,
    components: z
      .array(z.object({ id: componentIdSchema }).strict().readonly())
      .min(1)
      .readonly(),
    evidence: z.array(skillEvidenceSchema).min(1).readonly(),
  })
  .strict()
  .superRefine((tag, context) => {
    const componentIds = tag.components.map(({ id }) => id)
    const supportedIds = new Set(tag.evidence.flatMap(({ supports }) => supports))
    if (!hasUniqueIds(tag.components)) {
      context.addIssue({ code: "custom", message: `duplicate component ID in skill tag ${tag.id}` })
    }
    for (const supportedId of supportedIds) {
      if (!componentIds.includes(supportedId)) {
        context.addIssue({ code: "custom", message: `unsupported component ID ${supportedId}` })
      }
    }
    for (const componentId of componentIds) {
      if (!supportedIds.has(componentId)) {
        context.addIssue({ code: "custom", message: `component ${componentId} has no evidence` })
      }
    }
  })
  .readonly()

export const profileSchema = z
  .object({
    name: localizedSchema,
    portrait: publicMediaPathSchema,
    favicon: publicMediaPathSchema,
    role: localizedSchema,
    tagline: localizedSchema,
    summary: localizedSchema,
    statistics: z
      .array(
        z
          .object({
            id: recordIdSchema,
            label: localizedSchema,
            value: z.union([textSchema, z.number()]),
          })
          .strict()
          .readonly(),
      )
      .refine(hasUniqueIds, "duplicate statistic ID")
      .readonly(),
    contact: z
      .object({
        email: z.email(),
        hometown: localizedSchema,
        political: localizedSchema,
        github: httpsUrlSchema,
        scholar: httpsUrlSchema,
        orcid: httpsUrlSchema,
      })
      .strict()
      .readonly(),
    education: z
      .array(
        z
          .object({
            id: recordIdSchema,
            period: textSchema,
            school: localizedSchema,
            degree: localizedSchema,
            highlights: z.array(localizedSchema).readonly(),
          })
          .strict()
          .readonly(),
      )
      .refine(hasUniqueIds, "duplicate education ID")
      .readonly(),
    campus_experience: z
      .array(
        z
          .object({
            id: recordIdSchema,
            period: textSchema,
            organization: localizedSchema,
            role: localizedSchema,
            details: z.array(localizedSchema).readonly(),
          })
          .strict()
          .readonly(),
      )
      .refine(hasUniqueIds, "duplicate campus experience ID")
      .readonly(),
    skills: z
      .array(
        z
          .object({
            id: recordIdSchema,
            title: localizedSchema,
            tags: z
              .array(skillTagSchema)
              .min(1)
              .refine(hasUniqueIds, "duplicate skill tag ID")
              .readonly(),
          })
          .strict()
          .readonly(),
      )
      .refine(hasUniqueIds, "duplicate skill group ID")
      .readonly(),
  })
  .strict()
  .readonly()
