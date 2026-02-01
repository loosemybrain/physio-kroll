"use client"

import { useCookieConsent } from "./CookieProvider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { consentCategoryLabels, type ConsentCategory } from "@/lib/consent/types"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useEffect, useState, useCallback } from "react"
import { ChevronLeft } from "lucide-react"

/**
 * Cookie settings dialog with granular category controls
 * V0 design with animations
 * Features:
 * - ESC does NOT close (must be explicit via back or save)
 * - "Save Selection" button to confirm changes
 * - Back button to return to main banner view
 * - Draft mode: changes aren't saved until "Save" is clicked
 */
export function CookieSettingsDialog() {
  const { isSettingsOpen, closeSettings, consent, setCategory, acceptAll, rejectAll } = useCookieConsent()
  const pathname = usePathname()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [draftConsent, setDraftConsent] = useState(consent)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setPrefersReducedMotion(
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  // Sync draft with current consent when dialog opens
  useEffect(() => {
    if (isSettingsOpen && consent) {
      setDraftConsent(consent)
    }
  }, [isSettingsOpen, consent])

  const handleCategoryChange = useCallback((category: ConsentCategory, value: boolean) => {
    setDraftConsent((prev) => {
      if (!prev) return prev
      return { ...prev, [category]: value }
    })
  }, [])

  const handleSave = useCallback(() => {
    if (draftConsent) {
      // Always persist the draft state exactly as-is
      // This ensures consistency between what's shown and what's stored
      setCategory("functional", draftConsent.functional ?? false)
      setCategory("analytics", draftConsent.analytics ?? false)
      setCategory("marketing", draftConsent.marketing ?? false)
      setCategory("externalMedia", draftConsent.externalMedia ?? false)
      // Close dialog after all updates
      setTimeout(() => closeSettings(), 0)
    }
  }, [draftConsent, setCategory, closeSettings])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // User tried to close via ESC or clicking outside
        // Close without saving draft
        closeSettings()
      }
    },
    [closeSettings]
  )

  const isKonzept = pathname === "/konzept" || pathname?.startsWith("/konzept/")

  if (!consent || !draftConsent) return null

  // Only render Dialog on client to avoid hydration issues with Radix ID generation
  if (!isMounted) {
    return null
  }

  // Categories to show in settings dialog
  const categories: Array<{ key: ConsentCategory; show: boolean }> = [
    { key: "necessary", show: true },
    { key: "analytics", show: true },
    { key: "marketing", show: true },
    { key: "externalMedia", show: true },
    { key: "functional", show: false }, // Hidden: replaced by externalMedia
  ]

  return (
    <Dialog open={isSettingsOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "min-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl",
          prefersReducedMotion ? "" : "animate-in fade-in zoom-in-[0.98] duration-300"
        )}
        suppressHydrationWarning
      >
        <DialogHeader className="space-y-0 pb-4">
          <div className="flex items-center gap-3 pb-4">
            <button
              type="button"
              onClick={closeSettings}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Zurück zur Übersicht"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-foreground">Einstellungen anpassen</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Wählen Sie aus, welche Cookies Sie zulassen möchten. Sie können Ihre Auswahl jederzeit ändern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-0 border-t border-border/50">
          {categories
            .filter((cat) => cat.show)
            .map(({ key }, index) => {
              const isNecessary = key === "necessary"
              const label = consentCategoryLabels[key]
              const isEnabled = draftConsent[key]

              return (
                <div key={key}>
                  <div
                    className={cn(
                      "flex items-start justify-between gap-4 px-0 py-4",
                      prefersReducedMotion ? "" : "animate-in fade-in slide-in-from-bottom-2 duration-300",
                    )}
                    style={prefersReducedMotion ? {} : { animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`cookie-${key}`}
                          className={cn(
                            "text-sm font-medium leading-none",
                            isNecessary ? "text-muted-foreground" : "text-foreground cursor-pointer"
                          )}
                        >
                          {label.label}
                        </label>
                        {isNecessary && (
                          <span className="text-xs font-medium text-muted-foreground">(Immer aktiv)</span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{label.description}</p>
                    </div>
                    <Switch
                      id={`cookie-${key}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleCategoryChange(key, checked)}
                      disabled={isNecessary}
                      aria-label={`${label.label} ${isEnabled ? "aktivieren" : "deaktivieren"}`}
                      className="shrink-0"
                    />
                  </div>
                  {categories.filter((c) => c.show).length > index + 1 && (
                    <Separator className="bg-border/30" />
                  )}
                </div>
              )
            })}
        </div>

        <div className="flex flex-col gap-2.5 pt-6 border-t border-border/50">
          {/* Three button row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            {/* Reject all button */}
            <Button
              variant="outline"
              onClick={rejectAll}
              className="rounded-full px-6 font-medium"
              size="sm"
              type="button"
            >
              Alle ablehnen
            </Button>
            {/* Save selection button */}
            <Button
              variant="default"
              onClick={handleSave}
              className="flex-1 rounded-full px-6 font-medium"
              size="sm"
              type="button"
            >
              Auswahl speichern
            </Button>
            {/* Accept all button */}
            <Button
              variant="default"
              onClick={acceptAll}
              className="rounded-full px-6 font-medium"
              size="sm"
              type="button"
            >
              Alle akzeptieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
