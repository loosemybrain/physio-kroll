"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { createScrollSpyObserver } from "@/lib/navigation/scrollSpy"

const DEFAULT_HEADER_OFFSET = 80

type ScrollSpyContextValue = {
  activeAnchor: string | null
  headerOffsetPx: number
}

const ScrollSpyContext = createContext<ScrollSpyContextValue | undefined>(undefined)

export function useScrollSpy(): ScrollSpyContextValue {
  const ctx = useContext(ScrollSpyContext)
  return ctx ?? { activeAnchor: null, headerOffsetPx: DEFAULT_HEADER_OFFSET }
}

interface ScrollSpyProviderProps {
  children: ReactNode
  /** Sticky-Header-Höhe in px für rootMargin (Standard 80). */
  headerOffsetPx?: number
}

/**
 * Ein zentraler ScrollSpy: ein IntersectionObserver für alle Block-Anchors (id="block-*").
 * Setzt activeAnchor auf die Block-ID der aktuell sichtbaren Section.
 * Bei Seitenwechsel (pathname) wird der Observer neu aufgesetzt (neue DOM-Elemente).
 */
export function ScrollSpyProvider({
  children,
  headerOffsetPx = DEFAULT_HEADER_OFFSET,
}: ScrollSpyProviderProps) {
  const pathname = usePathname()
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const handleActive = useCallback((blockId: string | null) => {
    setActiveAnchor((prev) => (prev === blockId ? prev : blockId))
  }, [])

  useEffect(() => {
    const cleanup = createScrollSpyObserver(
      handleActive,
      {
        headerOffsetPx,
        bottomMarginPercent: 60,
        threshold: 0.2,
      }
    )
    return cleanup
  }, [pathname, headerOffsetPx, handleActive])

  const value = useMemo<ScrollSpyContextValue>(
    () => ({ activeAnchor, headerOffsetPx }),
    [activeAnchor, headerOffsetPx]
  )

  return (
    <ScrollSpyContext.Provider value={value}>
      {children}
    </ScrollSpyContext.Provider>
  )
}
