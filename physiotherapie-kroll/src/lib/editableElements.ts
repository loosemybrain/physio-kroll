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
}
