"use client"

import { useEffect, useState } from "react"
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const assist = Boolean(previewAssistEditing && mounted)
  return <LegalRichContentRenderer {...rest} previewAssistEditing={assist} />
}
