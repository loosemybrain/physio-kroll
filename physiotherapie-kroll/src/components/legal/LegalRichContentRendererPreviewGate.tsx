"use client"
import {
  LegalRichContentRenderer,
  type LegalRichContentRendererProps,
} from "@/components/legal/LegalRichContentRenderer"

/**
 * Verzögert Preview-Assist-Klassen (cursor/hover) bis nach dem Hydrate,
 * damit SSR-HTML und erster Client-Render identisch sind (kein Mismatch).
 */
export function LegalRichContentRendererPreviewGate(props: LegalRichContentRendererProps) {
  const { previewAssistEditing, ...rest } = props
  return <LegalRichContentRenderer {...rest} previewAssistEditing={Boolean(previewAssistEditing)} />
}
