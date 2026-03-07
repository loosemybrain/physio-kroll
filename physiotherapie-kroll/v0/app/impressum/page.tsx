"use client"

import { useState, useMemo } from "react"
import { HeaderClient } from "@/components/header/HeaderClient"
import { FooterClient } from "@/components/layout/FooterClient"
import { LegalPageRenderer } from "@/components/legal/LegalPageRenderer"
import { DEFAULT_NAV_CONFIG } from "@/types/navigation"
import { DEFAULT_FOOTER_CONFIG } from "@/types/footer"
import { IMPRESSUM_CONFIG } from "@/lib/legal-demo-data"
import { Button } from "@/components/ui/button"
import type { BrandKey } from "@/types/navigation"

export default function ImpressumPage() {
  const [brand, setBrand] = useState<BrandKey>("physiotherapy")

  const navConfig = useMemo(
    () => ({
      ...DEFAULT_NAV_CONFIG,
      headerLayoutColumns: 4 as const,
      headerFontPreset: "brand" as const,
    }),
    [],
  )

  return (
    <div className={brand === "physio-konzept" ? "physio-konzept" : ""}>
      {/* Header */}
      <HeaderClient brand={brand} navConfig={navConfig} />

      {/* Theme Switcher for Demo */}
      <nav
        className="fixed left-1/2 top-4 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm"
        aria-label="Theme selection"
      >
        <Button
          size="sm"
          variant={brand === "physiotherapy" ? "default" : "ghost"}
          onClick={() => setBrand("physiotherapy")}
          className="rounded-full px-4"
        >
          Physiotherapie
        </Button>
        <Button
          size="sm"
          variant={brand === "physio-konzept" ? "default" : "ghost"}
          onClick={() => setBrand("physio-konzept")}
          className="rounded-full px-4"
        >
          PhysioKonzept
        </Button>
      </nav>

      {/* Legal Page Content */}
      <LegalPageRenderer config={IMPRESSUM_CONFIG} />

      {/* Footer */}
      <FooterClient brand={brand} footerConfig={DEFAULT_FOOTER_CONFIG} />
    </div>
  )
}
