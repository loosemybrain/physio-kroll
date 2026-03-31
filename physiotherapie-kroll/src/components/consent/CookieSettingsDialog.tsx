"use client"

import { useCookieConsent } from "./CookieProvider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { consentCategoryLabels, type ConsentCategory } from "@/lib/consent/types"
import { cn } from "@/lib/utils"
import { useEffect, useState, useCallback } from "react"
import { ChevronLeft } from "lucide-react"

/**
 * Cookie-Einstellungen: nur produktive Kategorien `necessary` + `externalMedia`.
 */
export function CookieSettingsDialog() {
  const { isSettingsOpen, closeSettings, consent, setCategory, acceptAll, rejectAll } = useCookieConsent()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [draftConsent, setDraftConsent] = useState(consent)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setPrefersReducedMotion(
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  useEffect(() => {
    if (isSettingsOpen && consent) {
      setDraftConsent(consent)
    }
  }, [isSettingsOpen, consent])

  const handleCategoryChange = useCallback((category: ConsentCategory, value: boolean) => {
    if (category === "necessary") return
    setDraftConsent((prev) => {
      if (!prev) return prev
      return { ...prev, [category]: value }
    })
  }, [])

  const handleSave = useCallback(() => {
    if (draftConsent) {
      setCategory("externalMedia", draftConsent.externalMedia ?? false)
      setTimeout(() => closeSettings(), 0)
    }
  }, [draftConsent, setCategory, closeSettings])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeSettings()
      }
    },
    [closeSettings]
  )

  if (!consent || !draftConsent) return null

  if (!isMounted) {
    return null
  }

  const categories: ConsentCategory[] = ["necessary", "externalMedia"]

  const actionBtnBase =
    "h-11 w-full rounded-xl px-4 text-sm font-semibold sm:w-auto sm:h-10 sm:rounded-full sm:px-6"

  return (
    <Dialog open={isSettingsOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-1rem)] max-w-none sm:w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl",
          "max-h-[85svh] sm:max-h-[90vh]",
          "overflow-hidden rounded-2xl p-0",
          prefersReducedMotion ? "" : "animate-in fade-in zoom-in-[0.98] duration-300"
        )}
        suppressHydrationWarning
      >
        <div className="flex max-h-[85svh] flex-col sm:max-h-[90vh]">
          <DialogHeader className="space-y-0 border-b border-border/50 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeSettings}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Zurück zur Übersicht"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate text-base font-semibold text-foreground sm:text-xl">
                  Einstellungen anpassen
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Wählen Sie aus, welche Cookies Sie zulassen möchten. Sie können Ihre Auswahl jederzeit ändern.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 sm:px-6">
            <div className="space-y-0">
              {categories.map((key, index) => {
                const isNecessary = key === "necessary"
                const label = consentCategoryLabels[key]
                const isEnabled = key === "necessary" ? true : draftConsent.externalMedia

                return (
                  <div key={key}>
                    <div
                      className={cn(
                        "flex items-start justify-between gap-4 py-4",
                        prefersReducedMotion ? "" : "animate-in fade-in slide-in-from-bottom-2 duration-300"
                      )}
                      style={prefersReducedMotion ? {} : { animationDelay: `${index * 50}ms` }}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label
                            htmlFor={`cookie-${key}`}
                            className={cn(
                              "text-sm font-medium leading-none",
                              isNecessary ? "text-muted-foreground" : "text-foreground cursor-pointer"
                            )}
                          >
                            {label.label}
                          </Label>
                          {isNecessary && (
                            <span className="text-xs font-medium text-muted-foreground">(Immer aktiv)</span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground wrap-break-word">
                          {label.description}
                        </p>
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
                    {index < categories.length - 1 && <Separator className="bg-border/30" />}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border/50 bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
              <Button
                variant="outline"
                onClick={rejectAll}
                className={cn(actionBtnBase, "text-foreground")}
                type="button"
              >
                Alle ablehnen
              </Button>

              <Button variant="default" onClick={handleSave} className={cn(actionBtnBase)} type="button">
                Auswahl speichern
              </Button>

              <Button variant="default" onClick={acceptAll} className={cn(actionBtnBase)} type="button">
                Alle akzeptieren
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
