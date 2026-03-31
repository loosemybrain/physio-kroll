"use client"

import { GoogleMapsEmbed } from "@/components/embeds/GoogleMapsEmbed"
import { FacebookEmbed } from "@/components/embeds/FacebookEmbed"
import type { CmsExternalEmbedProvider } from "@/types/cms"

export interface CmsExternalEmbedRendererProps {
  provider: CmsExternalEmbedProvider
  embedUrl: string
  title?: string
}

/**
 * Zentraler CMS-Pfad für externe Embeds: nur strukturierte Daten, keine rohen HTML-Snippets.
 * Routing zu den provider-spezifischen Komponenten (jeweils mit ExternalMediaGate).
 */
export function CmsExternalEmbedRenderer({ provider, embedUrl, title }: CmsExternalEmbedRendererProps) {
  if (provider === "google_maps") {
    return <GoogleMapsEmbed embedSrc={embedUrl} title={title?.trim() || "Karte"} frameClassName="aspect-video" />
  }
  return <FacebookEmbed embedSrc={embedUrl} title={title?.trim() || "Facebook"} frameClassName="aspect-video" />
}
