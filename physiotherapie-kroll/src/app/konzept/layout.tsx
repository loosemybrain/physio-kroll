import type React from "react"
import type { BrandKey } from "@/components/brand/brandAssets"
import { getThemePresetInlineVars } from "@/lib/theme/themePresetCss.server"

/**
 * Segment-spezifisches Layout für /konzept.
 * 
 * Zweck: Garantiert dass bei Navigation nach /konzept die Brand und Presets neu geladen
 * und auf dem HTML-Element gesetzt werden. Dies löst die RootLayout-Persistierung auf
 * Client-Navigation und ThemeProvider Light-Default Übersteuerung.
 * 
 * Segment Tree Re-Render: Wenn der Router von / nach /konzept navigiert, wird dieses Layout
 * erstellt und wirft sich über RootLayout, wodurch die serverseitigen Variablen korrekt sind.
 */

export default async function KonzeptLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fest: physio-konzept für diesen Segment
  const brand: BrandKey = "physio-konzept"

  // Lade Preset-Tokens serverseitig (analog zu RootLayout, aber segment-spezifisch)
  const preset = await getThemePresetInlineVars(brand).catch(() => ({
    brand,
    presetId: null,
    presetName: null,
    vars: {} as Record<string, string>,
  }))

  if (process.env.NODE_ENV === "development") {
    console.log("[konzept/layout]", {
      brand,
      presetId: preset.presetId,
      tokensSet: Object.keys(preset.vars).length,
    })
  }

  const hasTokens = Object.keys(preset.vars).length > 0
  const htmlStyle = hasTokens ? (preset.vars as unknown as React.CSSProperties) : undefined

  // Wrapper mit brand-spezifischen Attributen
  // Warum: Segment layout kann HTML direkt nicht verändern (das bleibt Root),
  // also wrappen wir mit Top-Level Div der die brand/style Attribute trägt.
  // CSS in globals.css nutzt diese Klasse/Attribute um Tokens zu scopieren.
  return (
    <div
      className="physio-konzept"
      data-brand={brand}
      style={htmlStyle}
    >
      {children}
    </div>
  )
}
