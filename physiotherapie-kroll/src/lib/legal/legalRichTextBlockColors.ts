import type * as React from "react"
import { cn } from "@/lib/utils"

/** Blockweite Farben für `legalRichText` (Phase 3A, keine Run-Farben). */
export type LegalRichTextBlockColorProps = {
  headingColor?: string
  textColor?: string
  listColor?: string
  listMarkerColor?: string
  linkColor?: string
  linkHoverColor?: string
  backgroundColor?: string
}

export function trimLegalRichColor(value: string | undefined): string | undefined {
  const t = value?.trim()
  return t || undefined
}

/** CSS-Variablen für den strukturierten Rich-Content-Container (Links, Marker, Listen). */
export function buildLegalRichContentCssVars(colors: LegalRichTextBlockColorProps): React.CSSProperties {
  const t = trimLegalRichColor
  const out: Record<string, string> = {}
  if (t(colors.textColor)) out["--lrt-text"] = t(colors.textColor)!
  if (t(colors.headingColor)) out["--lrt-heading"] = t(colors.headingColor)!
  if (t(colors.listColor)) out["--lrt-list"] = t(colors.listColor)!
  if (t(colors.listMarkerColor)) out["--lrt-marker"] = t(colors.listMarkerColor)!
  if (t(colors.linkColor)) out["--lrt-link"] = t(colors.linkColor)!
  if (t(colors.linkHoverColor)) out["--lrt-link-hover"] = t(colors.linkHoverColor)!
  return out as React.CSSProperties
}

/** Zusätzliche Tailwind-Klassen am Prose-Wrapper (nutzt die Variablen aus `buildLegalRichContentCssVars`). */
export function legalRichContentColorClasses(colors: LegalRichTextBlockColorProps): string {
  const t = trimLegalRichColor
  return cn(
    t(colors.textColor) && "[&_p]:![color:var(--lrt-text)]",
    t(colors.headingColor) && "[&_h3]:![color:var(--lrt-heading)] [&_h4]:![color:var(--lrt-heading)]",
    t(colors.listColor) && "[&_li]:![color:var(--lrt-list)]",
    t(colors.listMarkerColor) &&
      "[&_ul>li::marker]:![color:var(--lrt-marker)] [&_ol>li::marker]:![color:var(--lrt-marker)]",
    t(colors.linkColor) && "[&_a]:![color:var(--lrt-link)]",
    t(colors.linkHoverColor) && "[&_a:hover]:![color:var(--lrt-link-hover)]",
  )
}

export function legalRichHeadlineStyle(headingColor: string | undefined): React.CSSProperties | undefined {
  const c = trimLegalRichColor(headingColor)
  return c ? { color: c } : undefined
}

export function legalRichSectionSurfaceStyle(backgroundColor: string | undefined): React.CSSProperties | undefined {
  const c = trimLegalRichColor(backgroundColor)
  return c ? { backgroundColor: c } : undefined
}
