"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronUp } from "lucide-react"

const SCROLL_THRESHOLD = 400

/** Path is under /konzept → theme vars live on .physio-konzept, not on html. */
function useKonzeptThemeHost(): HTMLElement | null {
  const pathname = usePathname()
  const [host, setHost] = useState<HTMLElement | null>(null)
  const isKonzept = pathname === "/konzept" || pathname?.startsWith("/konzept/")

  useEffect(() => {
    if (!isKonzept) {
      setHost(null)
      return
    }
    const el = document.querySelector(".physio-konzept") as HTMLElement | null
    setHost(el ?? null)
  }, [isKonzept, pathname])

  return host
}

/**
 * Floating scroll-to-top button.
 *
 * Styling comes from the active brand theme (design tokens / CSS variables).
 * On /konzept the theme is applied by the segment layout on .physio-konzept,
 * so we portal the button into that element so it inherits physio-konzept colors.
 * Otherwise the button inherits from <html> (physiotherapy theme).
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const konzeptHost = useKonzeptThemeHost()

  useEffect(() => {
    setPrefersReducedMotion(
      typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }

  if (!visible) return null

  const buttonContent = (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        onClick={scrollToTop}
        className={cn(
          "group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
          "border border-border bg-card/90 backdrop-blur-sm",
          "shadow-[0_0_0_1px_var(--border),0_4px_14px_rgba(0,0,0,0.06)]",
          "hover:bg-primary hover:text-primary-foreground hover:border-primary/50 hover:shadow-[0_0_0_1px_var(--primary),0_8px_24px_-4px_rgba(0,0,0,0.1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          prefersReducedMotion ? "" : "hover:scale-105 active:scale-95"
        )}
        aria-label="Nach oben scrollen"
      >
        <ChevronUp
          className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary-foreground"
          aria-hidden="true"
        />
      </button>
    </div>
  )

  if (typeof document !== "undefined" && konzeptHost) {
    return createPortal(buttonContent, konzeptHost)
  }

  return buttonContent
}
