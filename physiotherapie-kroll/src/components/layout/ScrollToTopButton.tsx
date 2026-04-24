"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronUp } from "lucide-react"
import { useFooterInView } from "@/hooks/useFooterInView"

const SCROLL_THRESHOLD = 400

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const footerInView = useFooterInView({ rootMargin: "0px 0px -10% 0px", threshold: 0 })

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

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-1000 transition-all duration-300",
        footerInView ? "opacity-0 translate-y-6 pointer-events-none" : "opacity-100 translate-y-0 pointer-events-auto"
      )}
    >
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
}