import { z } from "astro/zod"
import { parseDocument } from "yaml"

const yamlMappingSchema = z.record(z.string(), z.unknown())
const yamlCollectionSchema = z.array(yamlMappingSchema)
const thesisMappingSchema = z.object({ id: z.string().min(1) }).catchall(z.unknown())

function preserveFlowMappingCommas(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const match = line.match(/^(.*\{\s*zh:\s*[^{}]+,\s*en:\s*)([^{}]+)(\s*\}.*)$/)
      if (match === null) {
        return line
      }
      const [, prefix, english, suffix] = match
      if (prefix === undefined || english === undefined || suffix === undefined) {
        return line
      }
      const trimmedEnglish = english.trim()
      if (
        !trimmedEnglish.includes(",") ||
        trimmedEnglish.startsWith("'") ||
        trimmedEnglish.startsWith('"')
      ) {
        return line
      }
      return `${prefix}${JSON.stringify(trimmedEnglish)}${suffix}`
    })
    .join("\n")
}

export function parseYamlValue(text: string): unknown {
  const document = parseDocument(preserveFlowMappingCommas(text))
  const yamlError = document.errors[0]
  if (yamlError !== undefined) {
    throw yamlError
  }
  const value: unknown = document.toJS()
  return value
}

function parseYamlMapping(text: string): Readonly<Record<string, unknown>> {
  return yamlMappingSchema.parse(parseYamlValue(text))
}

export function parseProfileCollection(
  text: string,
): Readonly<Record<string, Record<string, unknown>>> {
  return { profile: parseYamlMapping(text) }
}

export function parseThesisCollection(
  text: string,
): Readonly<Record<string, Record<string, unknown>>> {
  const thesis = thesisMappingSchema.parse(parseYamlValue(text))
  return { [thesis.id]: thesis }
}

export function parseRecordCollection(text: string): Readonly<Record<string, unknown>>[] {
  return yamlCollectionSchema.parse(parseYamlValue(text))
}
