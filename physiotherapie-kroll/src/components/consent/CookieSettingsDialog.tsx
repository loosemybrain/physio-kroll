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

/**
 * Cookie settings dialog with granular category controls
 */
export function CookieSettingsDialog() {
  const { isSettingsOpen, closeSettings, consent, setCategory, acceptAll, rejectAll } = useCookieConsent()
  const pathname = usePathname()
  const isKonzept = pathname === "/konzept" || pathname?.startsWith("/konzept/")

  if (!consent) return null

  // Categories to show (hide analytics/marketing if not used)
  const categories: Array<{ key: ConsentCategory; show: boolean }> = [
    { key: "necessary", show: true },
    { key: "functional", show: true },
    { key: "analytics", show: false }, // Currently not used, hide for now
    { key: "marketing", show: false }, // Currently not used, hide for now
  ]

  return (
    <Dialog open={isSettingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie-Einstellungen</DialogTitle>
          <DialogDescription>
            Wählen Sie aus, welche Cookies Sie zulassen möchten. Sie können Ihre Auswahl jederzeit ändern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {categories
            .filter((cat) => cat.show)
            .map(({ key }) => {
              const isNecessary = key === "necessary"
              const label = consentCategoryLabels[key]
              const isEnabled = consent[key]

              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`cookie-${key}`} className="text-base font-medium">
                          {label.label}
                        </Label>
                        {isNecessary && (
                          <span className="text-xs text-muted-foreground">(Immer aktiv)</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{label.description}</p>
                    </div>
                    <Switch
                      id={`cookie-${key}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => setCategory(key, checked)}
                      disabled={isNecessary}
                      aria-label={`${label.label} ${isEnabled ? "aktivieren" : "deaktivieren"}`}
                    />
                  </div>
                  {!isNecessary && <Separator />}
                </div>
              )
            })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t">
          {/* Reject button - equally prominent */}
          <Button variant="outline" onClick={rejectAll} className="min-w-[140px]" type="button">
            Alle ablehnen
          </Button>
          {/* Save selection */}
          <Button variant="default" onClick={closeSettings} className="min-w-[140px]" type="button">
            Auswahl speichern
          </Button>
          {/* Accept all button - equally prominent */}
          <Button variant="default" onClick={acceptAll} className="min-w-[140px]" type="button">
            Alle akzeptieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
