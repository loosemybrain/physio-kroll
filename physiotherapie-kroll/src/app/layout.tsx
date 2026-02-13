import type React from "react"
import { BrandShell } from "@/components/brand/BrandShell"
import { BrandProvider } from "@/components/brand/BrandProvider"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import { HeaderWrapper } from "@/components/navigation/HeaderWrapper"
import { FooterWrapper } from "@/components/layout/FooterWrapper"
import { CookieProvider } from "@/components/consent/CookieProvider"
import { CookieBanner } from "@/components/consent/CookieBanner"
import { CookieFloatingButton } from "@/components/consent/CookieFloatingButton"
import { CookieSettingsDialog } from "@/components/consent/CookieSettingsDialog"
import { getThemePresetInlineVars } from "@/lib/theme/themePresetCss.server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { headers } from "next/headers"
import CustomCursor from "@/components/ui/customCursor"
import { getSansFontPreset } from "@/lib/fonts/storage.server"
import { GOOGLE_FONTS_VARIABLES_CLASSNAMES } from "@/lib/fonts/presets"

import "../styles/globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Physiotherapie & PhysioKonzept",
  description: "Professional physiotherapy services for your health and performance",
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hdrs = await headers()
  const brandHeader = hdrs.get("x-brand")
  const themeScope = hdrs.get("x-theme-scope") ?? "public"
  const brand: BrandKey = brandHeader === "physio-konzept" ? "physio-konzept" : "physiotherapy"

  if (process.env.NODE_ENV === "development") {
    console.log("[layout] x-brand", brandHeader, "x-theme-scope", themeScope)
  }

  const preset =
    themeScope === "public"
      ? await getThemePresetInlineVars(brand).catch(() => ({
          brand,
          presetId: null,
          presetName: null,
          vars: {} as Record<string, string>,
        }))
      : {
          brand,
          presetId: null,
          presetName: null,
          vars: {} as Record<string, string>,
        }

  // Fetch current font preset (SSR-safe, server-side only)
  const fontPreset = await getSansFontPreset()

  // Only apply style if there are actual tokens (prevents empty style attribute from affecting admin)
  const hasTokens = Object.keys(preset.vars).length > 0
  const htmlStyle = hasTokens ? (preset.vars as unknown as React.CSSProperties) : undefined

  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${brand === "physio-konzept" ? "physio-konzept" : ""} ${GOOGLE_FONTS_VARIABLES_CLASSNAMES} font-${fontPreset}`.trim()}
      data-brand={brand}
      style={htmlStyle}
    >
      <head>
        {/* 
          Head-Script für brand-Klasse entfernt.
          Warum: Segment layouts (/konzept/layout.tsx) setzen brand jetzt serverseitig.
          Client-Navigation triggert Segment-Re-Render, wodurch brand konsistent bleibt.
        */}
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* 
          ThemeProvider: Entfernt defaultTheme="light" um Physio-Konzept Presets nicht zu überschreiben.
          Segment layouts (/konzept) setzen korrekte Theme via data-brand/klasse.
        */}
        <ThemeProvider attribute="class" enableSystem={false} storageKey="pk-theme">
          <CookieProvider>
            <BrandShell>
              <BrandProvider>
                <HeaderWrapper>
                  {children}
                </HeaderWrapper>
                <FooterWrapper />
              </BrandProvider>
            </BrandShell>
            <CookieBanner />
            <CookieFloatingButton />
            <CookieSettingsDialog />
            <Toaster />
          </CookieProvider>
        </ThemeProvider>
        {themeScope === "public" ? <CustomCursor /> : null}

      </body>
    </html>
  )
}

