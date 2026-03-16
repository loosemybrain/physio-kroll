"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"

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
  const [selection, setSelectionState] = useState<EditorSelection>({ type: "none" })
  /**
   * Previous selected block ID: value from the end of the last commit.
   * Updated in an effect after render so we can detect real block switches (Block A → Block B).
   */
  const previousSelectedBlockIdRef = useRef<string | null>(null)

  /**
   * Internal setter with validation
   */
  const setSelection = useCallback((next: EditorSelection) => {
    setSelectionState(next)
  }, [])

  /**
   * Clear selection (reset to "none")
   */
  const clearSelection = useCallback(() => {
    setSelectionState({ type: "none" })
  }, [])

  /**
   * Select a block (clears element and field selections)
   */
  const selectBlock = useCallback((blockId: string) => {
    setSelectionState({ type: "block", blockId })
  }, [])

  /**
   * Select a field within a block (keeps block selected implicitly)
   */
  const selectField = useCallback((blockId: string, fieldPath: string) => {
    setSelectionState({ type: "field", blockId, fieldPath })
  }, [])

  /**
   * Select an element within a block (clears field selection)
   */
  const selectElement = useCallback((blockId: string, elementId: string) => {
    if (!elementId) {
      // Empty elementId means deselect
      setSelectionState({ type: "block", blockId })
    } else {
      setSelectionState({ type: "element", blockId, elementId })
    }
  }, [])

  /**
   * Deselect element (go back to block selection)
   */
  const deselectElement = useCallback((blockId: string) => {
    setSelectionState({ type: "block", blockId })
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

  /** After each commit: store current block ID so next render can compare previous vs current */
  useEffect(() => {
    previousSelectedBlockIdRef.current = selectedBlockId
  }, [selectedBlockId])

  /**
   * Block change detection: previous vs current selected block ID.
   * - previousSelectedBlockId: block ID at end of previous render (from ref)
   * - currentSelectedBlockId: block ID in this render (from selection)
   * - blockIdChanged.changed === true when user actually switched to another block (e.g. A → B).
   * Used by PageEditor for reset logic (accordion, repeater cards) on real block switches.
   */
  const previousSelectedBlockId = previousSelectedBlockIdRef.current
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
