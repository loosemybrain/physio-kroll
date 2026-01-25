"use client"

import React, { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface InlineFieldEditorProps {
  open: boolean
  anchorRect: DOMRect | null
  label: string
  value: string
  multiline?: boolean
  onChange: (next: string) => void
  onClose: () => void
}

export function InlineFieldEditor({
  open,
  anchorRect,
  label,
  value,
  multiline = false,
  onChange,
  onClose,
}: InlineFieldEditorProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const [position, setPosition] = React.useState<{ left: number; top: number } | null>(null)
  
  // Close on outside click
  useEffect(() => {
    if (!open) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[role="dialog"]')) {
        onClose()
      }
    }
    
    // Delay to avoid immediate close on open
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose])

  // Calculate position based on anchorRect
  useEffect(() => {
    if (!open || typeof window === "undefined") {
      setPosition(null)
      return
    }

    if (anchorRect) {
      const popoverWidth = 420
      const popoverHeight = multiline ? 200 : 60
      const padding = 12

      const left = Math.max(
        padding,
        Math.min(anchorRect.left, window.innerWidth - popoverWidth - padding)
      )
      const top = anchorRect.bottom + 8

      // Check if popover would go off-screen at bottom
      const bottomSpace = window.innerHeight - top
      if (bottomSpace < popoverHeight) {
        // Position above anchor instead
        setPosition({
          left,
          top: anchorRect.top - popoverHeight - 8,
        })
      } else {
        setPosition({ left, top })
      }
    } else {
      // Fallback: center on screen
      setPosition({
        left: window.innerWidth / 2 - 210,
        top: window.innerHeight / 2 - 100,
      })
    }
  }, [open, anchorRect, multiline])

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "Enter" && !multiline && !e.shiftKey) {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, multiline, onClose])

  if (!open || !position) {
    return null
  }

  return (
    <>
      {/* Backdrop - positioned to not cover inspector panel */}
      <div
        className="fixed z-40 bg-black/20"
        style={{
          left: 0,
          top: 0,
          right: "384px", // Leave space for inspector (w-96 = 384px)
          bottom: 0,
          pointerEvents: "auto",
        }}
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      {/* Popover */}
      <Card
        className={cn(
          "fixed z-50 w-[420px] p-4 shadow-lg",
          "bg-background border-border"
        )}
        style={{
          pointerEvents: "auto",
          left: `${position.left}px`,
          top: `${position.top}px`,
        }}
        role="dialog"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <Label htmlFor="inline-editor-input" className="mb-2 text-sm font-medium">
          {label}
        </Label>
        {multiline ? (
          <Textarea
            id="inline-editor-input"
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="resize-none"
          />
        ) : (
          <Input
            id="inline-editor-input"
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onClose()
              }
            }}
          />
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {multiline ? "Drücke Esc zum Schließen" : "Drücke Enter oder Esc zum Schließen"}
        </p>
      </Card>
    </>
  )
}
