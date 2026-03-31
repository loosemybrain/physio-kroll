"use client"

import { ExternalMediaGate } from "./ExternalMediaGate"
import { EmbedUrlInvalidNotice } from "./EmbedUrlInvalidNotice"
import { validateFacebookEmbedUrl } from "@/lib/consent/validateExternalEmbedUrl"
import { cn } from "@/lib/utils"

export interface FacebookEmbedProps {
  /** Plugin-/iframe-URL von Facebook (nur nach Consent und Validierung). */
  embedSrc: string
  title?: string
  className?: string
  frameClassName?: string
}

/**
 * Facebook-Embed mit Consent-Gate und URL-Prüfung.
 * Vor Zustimmung zu `externalMedia`: kein iframe, keine Anfrage an Facebook.
 */
export function FacebookEmbed({
  embedSrc,
  title = "Facebook",
  className,
  frameClassName,
}: FacebookEmbedProps) {
  const validation = validateFacebookEmbedUrl(embedSrc)

  return (
    <ExternalMediaGate provider="facebook" className={className}>
      {validation.ok ? (
        <div className={cn("overflow-hidden rounded-lg border border-border bg-muted/20", frameClassName)}>
          <iframe
            src={validation.href}
            title={title}
            className="h-full min-h-[240px] w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <EmbedUrlInvalidNotice message={validation.message} />
      )}
    </ExternalMediaGate>
  )
}
