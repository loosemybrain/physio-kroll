"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useCookieConsent } from "./cookie-context"
import { Cookie } from "lucide-react"

export function FloatingCookieButton() {
  const { hasConsented, openSettings, isLoading } = useCookieConsent()
  const [isHovered, setIsHovered] = useState(false)

  // Respect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Only show after user has consented
  if (isLoading || !hasConsented) return null

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <button
        type="button"
        onClick={openSettings}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className={cn(
          "group relative flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-card hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          prefersReducedMotion ? "" : "hover:scale-105 active:scale-95"
        )}
        aria-label="Cookie-Einstellungen öffnen"
      >
        <Cookie
          className={cn(
            "h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground",
            prefersReducedMotion ? "" : "group-hover:rotate-12 transition-transform duration-200"
          )}
          aria-hidden="true"
        />

        {/* Tooltip */}
        <span
          role="tooltip"
          className={cn(
            "absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background shadow-lg transition-all duration-200",
            isHovered
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1 pointer-events-none"
          )}
        >
          Cookie-Einstellungen
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-foreground"
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
  )
}
