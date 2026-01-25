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
import { CookieSettingsDialog } from "@/components/consent/CookieSettingsDialog"
import { getThemePresetInlineVars } from "@/lib/theme/themePresetCss.server"
import type { BrandKey } from "@/components/brand/brandAssets"
import { headers } from "next/headers"
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

  // Only apply style if there are actual tokens (prevents empty style attribute from affecting admin)
  const hasTokens = Object.keys(preset.vars).length > 0
  const htmlStyle = hasTokens ? (preset.vars as unknown as React.CSSProperties) : undefined

  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={brand === "physio-konzept" ? "physio-konzept" : undefined}
      data-brand={brand}
      style={htmlStyle}
    >
      <head>
        {/* Set brand class immediately to prevent hydration mismatch */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var pathname = window.location.pathname;
                var root = document.documentElement;
                // Prefer SSR-provided brand (middleware -> x-brand -> data-brand on <html>)
                var brand = root.dataset.brand || (
                  pathname === "/konzept" || pathname.startsWith("/konzept/") 
                    ? "physio-konzept" 
                    : "physiotherapy"
                );
                // Remove dark mode class to ensure light theme
                root.classList.remove("dark");
                // Apply brand class for token-based theming (e.g. .physio-konzept { --background: ... })
                root.classList.toggle("physio-konzept", brand === "physio-konzept");
                root.dataset.brand = brand;
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
            <CookieSettingsDialog />
            <Toaster />
          </CookieProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

