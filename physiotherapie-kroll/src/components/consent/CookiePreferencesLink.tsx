"use client"

import { useCookieConsent } from "./CookieProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CookiePreferencesLinkProps {
  className?: string
  variant?: "link" | "button"
  children?: React.ReactNode
}

/**
 * Footer link to open cookie settings (V0 design)
 * Can be used as a link or button
 * Fully accessible with keyboard navigation
 */
export function CookiePreferencesLink({ className, variant = "link", children }: CookiePreferencesLinkProps) {
  const { openSettings } = useCookieConsent()

  if (variant === "button") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={openSettings}
        className={cn("rounded-lg px-4 transition-colors", className)}
        type="button"
      >
        {children || "Cookie-Einstellungen"}
      </Button>
    )
  }

  return (
    <button
      onClick={openSettings}
      className={cn(
        "text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      type="button"
    >
      {children || "Cookie-Einstellungen"}
    </button>
  )
}
