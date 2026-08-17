import { z } from "astro/zod"
import { parseDocument } from "yaml"

const yamlMappingSchema = z.record(z.string(), z.unknown())
const yamlCollectionSchema = z.array(yamlMappingSchema)
const thesisMappingSchema = z.object({ id: z.string().min(1) }).catchall(z.unknown())

export function parseYamlValue(text: string): unknown {
  const document = parseDocument(text)
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
