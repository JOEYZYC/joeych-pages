import { z } from "astro/zod"

import { certificatePathSchema } from "../lib/profile-paths"

export const textSchema = z.string().trim().min(1)
export const recordIdSchema = textSchema.brand("RecordId")
export const projectIdSchema = textSchema.brand("ProjectId")
export const componentIdSchema = textSchema.brand("ComponentId")
export const localizedSchema = z.object({ zh: textSchema, en: textSchema }).strict().readonly()
export const httpsUrlSchema = z.url().refine(
  (value) => {
    try {
      return new URL(value).protocol === "https:"
    } catch {
      return false
    }
  },
  "URL must use HTTPS",
)
export const linkSchema = z
  .object({
    type: textSchema,
    url: httpsUrlSchema.nullable(),
    label: localizedSchema,
  })
  .strict()
  .readonly()
export const certificateSchema = z
  .object({
    src: certificatePathSchema,
    zh: textSchema,
    en: textSchema,
  })
  .strict()
  .readonly()

export function hasUniqueIds(items: readonly { readonly id: string }[]): boolean {
  return new Set(items.map(({ id }) => id)).size === items.length
}
