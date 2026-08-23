import { parseDocument } from "yaml"

export function parseYamlValue(text: string): unknown {
  const document = parseDocument(text)
  const yamlError = document.errors[0]
  if (yamlError !== undefined) {
    throw yamlError
  }
  const value: unknown = document.toJS()
  return value
}
