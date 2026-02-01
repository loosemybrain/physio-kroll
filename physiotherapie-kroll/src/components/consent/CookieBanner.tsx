"use client"

import { useCookieConsent } from "./CookieProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useCallback, useState } from "react"
import { Shield } from "lucide-react"

/**
 * Brand-aware cookie banner with V0 design
 * Modal presentation with focus trap and animations
 * Only shows if user hasn't consented yet
 */
export function CookieBanner() {
  const { hasUserConsented, acceptAll, rejectAll, openSettings, isLoading } = useCookieConsent()
  const pathname = usePathname()
  const bannerRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)
  const lastFocusableRef = useRef<HTMLButtonElement>(null)

  // Respect prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    setPrefersReducedMotion(
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  // Focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (hasUserConsented) return

      if (e.key === "Escape") {
        return
      }

      if (e.key === "Tab") {
        const focusableElements = bannerRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    },
    [hasUserConsented]
  )

  useEffect(() => {
    if (!hasUserConsented) {
      document.addEventListener("keydown", handleKeyDown)
      setTimeout(() => {
        firstFocusableRef.current?.focus()
      }, 100)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hasUserConsented, handleKeyDown])

  // Don't show on admin pages
  if (pathname?.startsWith("/admin")) {
    return null
  }

  // Don't show if still loading
  if (isLoading) {
    return null
  }

  // Don't show if user has already consented
  if (hasUserConsented) {
    return null
  }

  // Determine brand from pathname
  const isKonzept = pathname === "/konzept" || pathname?.startsWith("/konzept/")

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-background/60 backdrop-blur-sm",
          prefersReducedMotion ? "" : "animate-in fade-in duration-300"
        )}
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        ref={bannerRef}
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-md",
          prefersReducedMotion
            ? ""
            : "animate-in slide-in-from-bottom-4 fade-in zoom-in-[0.98] duration-400 ease-out"
        )}
      >
        {/* Decorative gradient */}
        <div
          className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative p-6">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 space-y-1">
                <h2
                  id="cookie-banner-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Ihre Privatsphäre ist uns wichtig
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. Sie können selbst entscheiden, welche Kategorien Sie zulassen möchten.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                ref={firstFocusableRef}
                onClick={acceptAll}
                className="flex-1 rounded-xl px-6 font-medium"
                size="lg"
              >
                Alle akzeptieren
              </Button>
              <Button
                onClick={rejectAll}
                variant="outline"
                className="flex-1 rounded-xl bg-transparent px-6 font-medium"
                size="lg"
              >
                Nur notwendige
              </Button>
            </div>

            {/* Settings Link */}
            <div className="flex justify-center">
              <button
                ref={lastFocusableRef}
                type="button"
                onClick={openSettings}
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Einstellungen anpassen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
