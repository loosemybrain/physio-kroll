import type React from "react"
import type { BrandKey } from "@/components/brand/brandAssets"
import { getThemePresetInlineVars } from "@/lib/theme/themePresetCss.server"

const LEGAL_SLUGS = new Set(["impressum", "datenschutz", "cookies", "privacy", "imprint"])

export default async function KonzeptSlugLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ slug: string }>
}>) {
  const { slug } = await params
  if (!LEGAL_SLUGS.has(slug)) return <>{children}</>

  // Force physiotherapy theme tokens on legal pages, even under /konzept/*.
  const brand: BrandKey = "physiotherapy"
  const preset = await getThemePresetInlineVars(brand).catch(() => ({
    brand,
    presetId: null,
    presetName: null,
    vars: {} as Record<string, string>,
  }))

  const hasTokens = Object.keys(preset.vars).length > 0
  const cssVarsText = hasTokens
    ? `:root{${Object.entries(preset.vars)
        .map(([k, v]) => `${k}:${String(v).replace(/;/g, "")}`)
        .join(";")};}`
    : ""

  return (
    <>
      {hasTokens ? <style dangerouslySetInnerHTML={{ __html: cssVarsText }} /> : null}
      {children}
    </>
  )
}
