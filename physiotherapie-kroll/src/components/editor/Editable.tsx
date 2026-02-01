"use client"

import { useCallback, type ElementType } from "react"
import { cn } from "@/lib/utils"
import { mergeTypographyClasses } from "@/lib/typography"
import type { TypographySettings } from "@/lib/typography"

interface EditableProps {
  /** Block ID */
  blockId: string
  /** Element ID (from EditableElementDef) */
  elementId: string
  /** Typography settings for this element */
  typography?: TypographySettings | null
  /** Whether we're in edit mode */
  editable?: boolean
  /** Callback when element is clicked */
  onElementClick?: (blockId: string, elementId: string) => void
  /** Whether this element is currently selected */
  isSelected?: boolean
  /** Additional className */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
  /** Child elements */
  children: React.ReactNode
  /** HTML tag to render as */
  as?: ElementType
}

/**
 * Wrapper component for editable elements in blocks
 * - Sets data attributes for identification
 * - Handles click events (prevents page scroll)
 * - Applies typography classes
 * - Shows visual highlight when selected
 */
export function Editable({
  blockId,
  elementId,
  typography,
  editable = false,
  onElementClick,
  isSelected = false,
  className,
  style,
  children,
  as: Component = "div",
}: EditableProps) {
  // Handle element selection on click (both for editing AND for shadow inspector)
  const handleClickCapture = useCallback(
    (e: React.MouseEvent) => {
      // Always trigger onElementClick if provided (for shadow inspector)
      if (onElementClick) {
        onElementClick(blockId, elementId)
      }
      
      // Prevent default only in edit mode for links
      if (editable) {
        const target = e.target as HTMLElement
        const link = target.closest("a")
        if (link) {
          e.preventDefault()
        }
      }
    },
    [editable, onElementClick, blockId, elementId]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editable && onElementClick) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          e.stopPropagation()
          onElementClick(blockId, elementId)
        }
      }
    },
    [editable, onElementClick, blockId, elementId]
  )

  if (!editable) {
    // In non-editable mode, merge typography classes with base classes
    const mergedClasses = mergeTypographyClasses(className || "", typography)
    return (
      <Component
        className={mergedClasses}
        style={style}
        data-block-id={blockId}
        data-element-id={elementId}
      >
        {children}
      </Component>
    )
  }

  // In editable mode, merge typography classes and add interaction styles
  const mergedClasses = mergeTypographyClasses(className || "", typography)
  
  return (
    <Component
      data-block-id={blockId}
      data-element-id={elementId}
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
      className={cn(
        mergedClasses,
        // Visual highlight when selected
        isSelected &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background outline-none",
        // Hover state for editable elements
        !isSelected &&
          "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10 hover:outline-2 hover:outline-primary/50"
      )}
      style={style}
      role="button"
      tabIndex={0}
    >
      {children}
    </Component>
  )
}
