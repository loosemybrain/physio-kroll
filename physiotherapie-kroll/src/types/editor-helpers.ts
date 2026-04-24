import type * as React from "react"

export type JsonObject = Record<string, unknown>
export type UnknownRecord = Record<string, unknown>
export type StringRecord = Record<string, string>

export type EditableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonObject
  | unknown[]

export type FieldPath = string
export type ElementId = string

export type InlineEditHandler = (
  event: React.MouseEvent<HTMLElement>,
  fieldPath: string
) => void

export type ElementClickHandler = (
  event: React.MouseEvent<HTMLElement>,
  elementId: string
) => void

export type UpdateFieldHandler = (fieldPath: string, value: EditableValue) => void
export type UpdatePropsHandler = (patch: JsonObject) => void

export type InspectorPropsBase = {
  selectedBlock?: unknown
  selectedProps?: JsonObject
  updateSelectedProps?: UpdatePropsHandler
  updateField?: UpdateFieldHandler
}
