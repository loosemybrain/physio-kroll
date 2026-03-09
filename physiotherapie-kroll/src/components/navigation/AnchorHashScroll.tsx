"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { scrollToAnchorFromHash } from "@/lib/navigation/scrollToAnchor"

const HEADER_OFFSET = 80

/**
 * Führt beim Laden der Seite und bei Hash-Änderung einen Scroll zum Block-Anker aus
 * (z. B. /start#block-xyz). Scrollspy kann später dieselbe Logik erweitern.
 */
export function AnchorHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    scrollToAnchorFromHash(HEADER_OFFSET)
  }, [pathname])

  useEffect(() => {
    const onHashChange = () => scrollToAnchorFromHash(HEADER_OFFSET)
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  return null
}
