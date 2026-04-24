"use client"

import { useState, useCallback, useMemo } from "react"

/**
 * Unified Editor Selection Model
 * Replaces scattered selectedBlockId, selectedElementId, activeFieldPath states
 */
export type EditorSelection =
  | { type: "none" }
  | { type: "block"; blockId: string }
  | { type: "field"; blockId: string; fieldPath: string }
  | { type: "element"; blockId: string; elementId: string }

/**
 * Hook to manage editor selection state in a unified way
 * Provides both the selection model and convenient derived properties
 */
export function useEditorSelection() {
  const [selectionState, setSelectionState] = useState<{
    selection: EditorSelection
    previousSelectedBlockId: string | null
  }>({
    selection: { type: "none" },
    previousSelectedBlockId: null,
  })
  const selection = selectionState.selection

  /**
   * Internal setter with validation
   */
  const setSelection = useCallback((next: EditorSelection) => {
    setSelectionState((prev) => {
      const previousBlockId =
        prev.selection.type === "none"
          ? null
          : prev.selection.blockId
      return { selection: next, previousSelectedBlockId: previousBlockId }
    })
  }, [])

  /**
   * Clear selection (reset to "none")
   */
  const clearSelection = useCallback(() => {
    setSelectionState((prev) => {
      const previousBlockId =
        prev.selection.type === "none"
          ? null
          : prev.selection.blockId
      return { selection: { type: "none" }, previousSelectedBlockId: previousBlockId }
    })
  }, [])

  /**
   * Select a block (clears element and field selections)
   */
  const selectBlock = useCallback((blockId: string) => {
    setSelectionState((prev) => {
      const previousBlockId =
        prev.selection.type === "none"
          ? null
          : prev.selection.blockId
      return { selection: { type: "block", blockId }, previousSelectedBlockId: previousBlockId }
    })
  }, [])

  /**
   * Select a field within a block (keeps block selected implicitly)
   */
  const selectField = useCallback((blockId: string, fieldPath: string) => {
    setSelectionState((prev) => {
      const previousBlockId =
        prev.selection.type === "none"
          ? null
          : prev.selection.blockId
      return { selection: { type: "field", blockId, fieldPath }, previousSelectedBlockId: previousBlockId }
    })
  }, [])

  /**
   * Select an element within a block (clears field selection)
   */
  const selectElement = useCallback((blockId: string, elementId: string) => {
    setSelectionState((prev) => {
      const previousBlockId =
        prev.selection.type === "none"
          ? null
          : prev.selection.blockId
      const nextSelection = !elementId ? { type: "block", blockId } as const : { type: "element", blockId, elementId } as const
      return { selection: nextSelection, previousSelectedBlockId: previousBlockId }
    })
  }, [])

  /**
   * Deselect element (go back to block selection)
   */
  const deselectElement = useCallback((blockId: string) => {
    setSelectionState((prev) => {
      const previousBlockId =
        prev.selection.type === "none"
          ? null
          : prev.selection.blockId
      return { selection: { type: "block", blockId }, previousSelectedBlockId: previousBlockId }
    })
  }, [])

  /**
   * Derived: currently selected block ID (if any selection exists)
   */
  const selectedBlockId = useMemo(() => {
    if (selection.type === "none") return null
    if (selection.type === "block") return selection.blockId
    if (selection.type === "field") return selection.blockId
    if (selection.type === "element") return selection.blockId
    return null
  }, [selection])

  /**
   * Derived: currently selected element ID (if element is selected)
   */
  const selectedElementId = useMemo(() => {
    return selection.type === "element" ? selection.elementId : null
  }, [selection])

  /**
   * Derived: currently active field path (if field is selected)
   */
  const activeFieldPath = useMemo(() => {
    return selection.type === "field" ? selection.fieldPath : null
  }, [selection])

  /**
   * Block change detection: previous vs current selected block ID.
   * - previousSelectedBlockId: block ID at end of previous render (from ref)
   * - currentSelectedBlockId: block ID in this render (from selection)
   * - blockIdChanged.changed === true when user actually switched to another block (e.g. A → B).
   * Used by PageEditor for reset logic (accordion, repeater cards) on real block switches.
   */
  const previousSelectedBlockId = selectionState.previousSelectedBlockId
  const currentSelectedBlockId = selectedBlockId
  const blockIdChanged = useMemo(
    () => ({
      changed: previousSelectedBlockId !== currentSelectedBlockId,
      from: previousSelectedBlockId,
      to: currentSelectedBlockId,
    }),
    [previousSelectedBlockId, currentSelectedBlockId]
  )

  /**
   * Helper: check if a specific block is selected
   */
  const isBlockSelected = useCallback(
    (blockId: string): boolean => selectedBlockId === blockId,
    [selectedBlockId]
  )

  /**
   * Helper: check if a specific field is selected
   */
  const isFieldSelected = useCallback(
    (blockId: string, fieldPath: string): boolean =>
      selection.type === "field" && selection.blockId === blockId && selection.fieldPath === fieldPath,
    [selection]
  )

  /**
   * Helper: check if a specific element is selected
   */
  const isElementSelected = useCallback(
    (blockId: string, elementId: string): boolean =>
      selection.type === "element" && selection.blockId === blockId && selection.elementId === elementId,
    [selection]
  )

  /**
   * Helper: check if any selection exists
   */
  const hasSelection = useMemo(() => selection.type !== "none", [selection])

  return {
    // State
    selection,
    setSelection,
    clearSelection,

    // Actions
    selectBlock,
    selectField,
    selectElement,
    deselectElement,

    // Derived properties (for backward compatibility and convenience)
    selectedBlockId,
    selectedElementId,
    activeFieldPath,

    // Block change detection
    blockIdChanged,

    // Helpers
    isBlockSelected,
    isFieldSelected,
    isElementSelected,
    hasSelection,
  }
}

/**
 * Type helper for the hook return value
 */
export type EditorSelectionHook = ReturnType<typeof useEditorSelection>
