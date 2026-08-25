import { z } from "astro/zod"

export const textSchema = z.string().trim().min(1)
export const recordIdSchema = textSchema
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Record ID must use lowercase letters, numbers, and hyphens")
  .brand("RecordId")
export const projectIdSchema = textSchema
  .regex(
    /^\d{4}-(?:Paper|Patent|Competition|Project)-[A-Z][A-Za-z0-9]*$/,
    "Project ID must use Year-Type-PascalCaseName",
  )
  .brand("ProjectId")
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
export const localMediaFileSchema = textSchema.refine(
  (value) => {
    try {
      return value === decodeURIComponent(value) && !value.includes("/") && !value.includes("\\") && value !== "." && value !== ".."
    } catch {
      return false
    }
  },
  "media reference must be a local filename",
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
    src: localMediaFileSchema,
    zh: textSchema,
    en: textSchema,
  })
  .strict()
  .readonly()

export function hasUniqueIds(items: readonly { readonly id: string }[]): boolean {
  return new Set(items.map(({ id }) => id)).size === items.length
}
