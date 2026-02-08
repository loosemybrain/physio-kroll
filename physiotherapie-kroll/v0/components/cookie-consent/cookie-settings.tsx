"use client"

import { useState } from "react"
import { type CookiePreferences } from "./cookie-types"
import { CookieToggle } from "./cookie-toggle"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface CookieSettingsProps {
  initialPreferences: CookiePreferences
  onSave: (preferences: CookiePreferences) => void
  onBack: () => void
}

const cookieCategories = [
  {
    id: "necessary" as const,
    label: "Notwendige Cookies",
    description:
      "Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.",
    disabled: true,
  },
  {
    id: "analytics" as const,
    label: "Analyse-Cookies",
    description:
      "Helfen uns zu verstehen, wie Besucher mit der Website interagieren, um das Nutzererlebnis zu verbessern.",
    disabled: false,
  },
  {
    id: "marketing" as const,
    label: "Marketing-Cookies",
    description:
      "Werden verwendet, um Werbung relevanter für Sie und Ihre Interessen zu gestalten.",
    disabled: false,
  },
  {
    id: "externalMedia" as const,
    label: "Externe Medien",
    description:
      "Ermöglichen das Einbetten von Inhalten externer Plattformen wie YouTube, Google Maps oder Social Media.",
    disabled: false,
  },
]

export function CookieSettings({ initialPreferences, onSave, onBack }: CookieSettingsProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(initialPreferences)

  const handleToggle = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="cookie-settings space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Zurück zur Übersicht"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-foreground">Einstellungen anpassen</h3>
      </div>

      <div className="divide-y divide-border">
        {cookieCategories.map((category) => (
          <CookieToggle
            key={category.id}
            id={`cookie-${category.id}`}
            checked={preferences[category.id]}
            disabled={category.disabled}
            onChange={(value) => handleToggle(category.id, value)}
            label={category.label}
            description={category.description}
          />
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={() => onSave(preferences)} className="rounded-xl px-6">
          Auswahl speichern
        </Button>
      </div>
    </div>
  )
}
