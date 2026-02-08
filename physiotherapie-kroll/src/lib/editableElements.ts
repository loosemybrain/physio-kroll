/**
 * Definition of an editable element within a block
 */
export interface EditableElementDef {
  /** Stable ID for the element (e.g. "title", "body", "quote") */
  id: string
  /** Human-readable label for the Inspector */
  label: string
  /** Optional group/section name (e.g. "Inhalt", "Typografie", "Abstände") */
  group?: string
  /** Path in block props (e.g. "title", "content.body", "cta.text") */
  path: string
  /** Whether this element supports typography settings */
  supportsTypography?: boolean
  /** Whether this element supports shadow settings */
  supportsShadow?: boolean
  /** Whether this element is dynamic (generated per array item) */
  dynamic?: boolean
  /** Template for generating element IDs for array items (e.g. "trustItems.{index}") */
  idTemplate?: string
  /** Template for generating labels for array items (e.g. "Trust Item {index+1}") */
  labelTemplate?: string
  /** Path to the array in block props to determine count (e.g. "trustItems") */
  itemCountPath?: string
}

/**
 * Resolves a dynamic element ID template to actual IDs.
 * E.g., idTemplate="trustItems.{index}" with index=0 → "trustItems.0"
 */
export function resolveDynamicElementId(idTemplate: string | undefined, index: number): string {
  if (!idTemplate) return ""
  return idTemplate.replace("{index}", String(index))
}

/**
 * Resolves a dynamic element label template to actual labels.
 * E.g., labelTemplate="Trust Item {index+1}" with index=0 → "Trust Item 1"
 */
export function resolveDynamicElementLabel(labelTemplate: string | undefined, index: number): string {
  if (!labelTemplate) return ""
  return labelTemplate.replace("{index+1}", String(index + 1)).replace("{index}", String(index))
}

/**
 * Checks if an element ID is dynamic (contains array index pattern).
 * E.g., "trustItems.0" matches, "headline" does not.
 */
export function isDynamicElementId(elementId: string): boolean {
  return /\.\d+$/.test(elementId)
}

/**
 * Extracts the base template and index from a dynamic element ID.
 * E.g., "trustItems.0" → { template: "trustItems", index: 0 }
 */
export function parseDynamicElementId(elementId: string): { template: string; index: number } | null {
  const match = elementId.match(/^(.+)\.(\d+)$/)
  if (!match) return null
  return {
    template: match[1],
    index: parseInt(match[2], 10),
  }
}
