"use client"

import { useCookieConsent } from "@/components/consent/CookieProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  EXTERNAL_MEDIA_PROVIDERS,
  type ExternalMediaProviderId,
} from "@/lib/consent/externalMediaProviders"
import { type ReactNode, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface ExternalMediaGateProps {
  /** Anbieter für Label und Hinweistext (keine externen URLs). */
  provider: ExternalMediaProviderId
  children: ReactNode
  className?: string
}

/**
 * Rendert Kinder nur bei **persistenter** Zustimmung zu `externalMedia` (Cookie).
 * Vor Zustimmung: kein iframe / keine externen Requests — nur interner Platzhalter.
 *
 * Kein `fallback`-Prop: beliebige React-Knoten könnten externe Inhalte einschleusen.
 * Kein lokales Session-Opt-in: Freigabe nur über `setCategory("externalMedia", true)`.
 */
export function ExternalMediaGate({ provider, children, className }: ExternalMediaGateProps) {
  const { hasConsent, setCategory, openSettings } = useCookieConsent()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setPrefersReducedMotion(
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  const meta = EXTERNAL_MEDIA_PROVIDERS[provider]
  const allowed = hasConsent("externalMedia")

  if (allowed) {
    return <div className={className}>{children}</div>
  }

  const handleAllowExternalMedia = () => {
    setCategory("externalMedia", true)
  }

  return (
    <Card
      className={cn(
        "my-4 border-border bg-muted/30 backdrop-blur-sm",
        prefersReducedMotion ? "" : "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">{meta.label}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{meta.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          onClick={handleAllowExternalMedia}
          variant="default"
          className="rounded-lg px-6 font-medium"
          size="sm"
          type="button"
        >
          Externe Medien zulassen
        </Button>
        <Button onClick={openSettings} variant="ghost" size="sm" className="rounded-lg px-4" type="button">
          Alle Cookie-Einstellungen
        </Button>
      </CardContent>
    </Card>
  )
}
