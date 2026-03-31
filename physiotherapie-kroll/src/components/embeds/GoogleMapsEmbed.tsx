"use client"

import { ExternalMediaGate } from "./ExternalMediaGate"
import { EmbedUrlInvalidNotice } from "./EmbedUrlInvalidNotice"
import { validateGoogleMapsEmbedUrl } from "@/lib/consent/validateExternalEmbedUrl"
import { cn } from "@/lib/utils"

export interface GoogleMapsEmbedProps {
  /** Vollständige Embed-URL (nur nach Consent und nach erfolgreicher Validierung im iframe). */
  embedSrc: string
  title?: string
  className?: string
  /** z. B. aspect-video */
  frameClassName?: string
}

/**
 * Google Maps Embed mit Consent-Gate und URL-Prüfung.
 * Vor Zustimmung zu `externalMedia`: kein iframe, keine Anfrage an Google.
 * Bei ungültiger URL: Hinweis statt iframe (auch nach Zustimmung).
 */
export function GoogleMapsEmbed({
  embedSrc,
  title = "Karte",
  className,
  frameClassName,
}: GoogleMapsEmbedProps) {
  const validation = validateGoogleMapsEmbedUrl(embedSrc)

  return (
    <ExternalMediaGate provider="google_maps" className={className}>
      {validation.ok ? (
        <div className={cn("overflow-hidden rounded-lg border border-border bg-muted/20", frameClassName)}>
          <iframe
            src={validation.href}
            title={title}
            className="h-full min-h-[240px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : (
        <EmbedUrlInvalidNotice message={validation.message} />
      )}
    </ExternalMediaGate>
  )
}
