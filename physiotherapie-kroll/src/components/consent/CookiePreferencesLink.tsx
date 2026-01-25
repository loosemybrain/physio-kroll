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
 * Footer link to open cookie settings
 * Can be used as a link or button
 */
export function CookiePreferencesLink({ className, variant = "link", children }: CookiePreferencesLinkProps) {
  const { openSettings } = useCookieConsent()

  if (variant === "button") {
    return (
      <Button variant="ghost" size="sm" onClick={openSettings} className={className} type="button">
        {children || "Cookie-Einstellungen"}
      </Button>
    )
  }

  return (
    <button
      onClick={openSettings}
      className={cn("text-primary underline hover:text-primary/80 text-sm", className)}
      type="button"
    >
      {children || "Cookie-Einstellungen"}
    </button>
  )
}
