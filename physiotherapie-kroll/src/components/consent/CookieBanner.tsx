"use client"

import { useCookieConsent } from "./CookieProvider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

/**
 * Brand-aware cookie banner
 * Only shows if user hasn't consented yet
 */
export function CookieBanner() {
  const { hasUserConsented, acceptAll, rejectAll, openSettings } = useCookieConsent()
  const pathname = usePathname()

  // Don't show on admin pages
  if (pathname?.startsWith("/admin")) {
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
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-lg",
        isKonzept && "border-border"
      )}
      role="banner"
      aria-label="Cookie-Einstellungen"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            <p>
              Wir verwenden notwendige Cookies für den Betrieb der Website. Optionale funktionelle Inhalte (z.B.
              Karten/Videos) werden nur mit Ihrer Zustimmung geladen. Sie können Ihre Auswahl jederzeit unter{" "}
              <button
                onClick={openSettings}
                className="text-primary underline hover:text-primary/80"
                type="button"
              >
                Cookie-Einstellungen
              </button>{" "}
              ändern.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {/* Reject button - equally prominent as Accept */}
            <Button
              variant="outline"
              size="sm"
              onClick={rejectAll}
              className="min-w-[140px]"
              type="button"
            >
              Alle ablehnen
            </Button>
            {/* Settings button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openSettings}
              className="min-w-[140px]"
              type="button"
            >
              Einstellungen
            </Button>
            {/* Accept button - equally prominent as Reject */}
            <Button
              variant="default"
              size="sm"
              onClick={acceptAll}
              className="min-w-[140px]"
              type="button"
            >
              Alle akzeptieren
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
