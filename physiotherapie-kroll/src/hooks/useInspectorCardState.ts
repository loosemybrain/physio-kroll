"use client"

import { useState, useCallback } from "react"

export type InspectorCardListMode = "single" | "multiple"

/**
 * Hook für einklappbare Inspector-Card-Listen.
 * Unterstützt Single-Open (nur eine Card offen) und Multi-Open.
 * Robust bei Add/Delete/Reorder: expanded-State wird bei Löschung bereinigt.
 */
export function useInspectorCardState(mode: InspectorCardListMode = "single") {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const isExpanded = useCallback(
    (id: string) => (mode === "single" ? expandedId === id : expandedIds.has(id)),
    [mode, expandedId, expandedIds]
  )

  const toggle = useCallback(
    (id: string) => {
      if (mode === "single") {
        setExpandedId((prev) => (prev === id ? null : id))
      } else {
        setExpandedIds((prev) => {
          const next = new Set(prev)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return next
        })
      }
    },
    [mode]
  )

  const expand = useCallback(
    (id: string) => {
      if (mode === "single") {
        setExpandedId(id)
      } else {
        setExpandedIds((prev) => new Set(prev).add(id))
      }
    },
    [mode]
  )

  const collapse = useCallback(
    (id: string) => {
      if (mode === "single") {
        setExpandedId((prev) => (prev === id ? null : prev))
      } else {
        setExpandedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [mode]
  )

  const collapseAll = useCallback(() => {
    setExpandedId(null)
    setExpandedIds(new Set())
  }, [])

  /**
   * Nach Löschen aufrufen: bereinigt expanded-State, wenn die gelöschte ID offen war.
   * Optional: fallbackId (z. B. nächstes Item) als neue expandedId setzen.
   */
  const handleDelete = useCallback(
    (deletedId: string, fallbackId?: string | null) => {
      if (mode === "single") {
        setExpandedId((prev) => {
          if (prev !== deletedId) return prev
          return fallbackId ?? null
        })
      } else {
        setExpandedIds((prev) => {
          const next = new Set(prev)
          next.delete(deletedId)
          if (fallbackId) next.add(fallbackId)
          return next
        })
      }
    },
    [mode]
  )

  return {
    expandedId,
    expandedIds,
    isExpanded,
    toggle,
    expand,
    collapse,
    collapseAll,
    handleDelete,
    setExpandedId,
    setExpandedIds,
  }
}

