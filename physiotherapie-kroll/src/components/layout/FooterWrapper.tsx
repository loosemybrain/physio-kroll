"use client"

import { usePathname } from "next/navigation"
import { FooterClient } from "./FooterClient"
import { useBrand } from "@/components/brand/BrandProvider"
import { useState, useEffect } from "react"
import type { FooterConfig } from "@/types/footer"
import { DEFAULT_FOOTER_CONFIG } from "@/lib/supabase/footer.shared"

/**
 * Client component that loads both brand footer configs and switches between them
 */
export function FooterWrapper() {
  const pathname = usePathname()
  const { brand } = useBrand()
  const [footerConfigs, setFooterConfigs] = useState<{
    physiotherapy: FooterConfig
    "physio-konzept": FooterConfig
  } | null>(null)
  const [pagesByBrand, setPagesByBrand] = useState<{
    physiotherapy: { pages: Array<{ slug: string; title: string }>; legalPages: Array<{ slug: string; title: string; page_subtype: string }> }
    "physio-konzept": { pages: Array<{ slug: string; title: string }>; legalPages: Array<{ slug: string; title: string; page_subtype: string }> }
  }>({
    physiotherapy: { pages: [], legalPages: [] },
    "physio-konzept": { pages: [], legalPages: [] },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFooterConfigs = async () => {
      try {
        const [physioResponse, konzeptResponse] = await Promise.all([
          fetch(`/api/footer?brand=physiotherapy`),
          fetch(`/api/footer?brand=physio-konzept`),
        ])

        const physioData = physioResponse.ok
          ? await physioResponse.json()
          : { config: DEFAULT_FOOTER_CONFIG, pages: [], legalPages: [] }
        const konzeptData = konzeptResponse.ok
          ? await konzeptResponse.json()
          : { config: DEFAULT_FOOTER_CONFIG, pages: [], legalPages: [] }

        setFooterConfigs({
          physiotherapy: physioData.config,
          "physio-konzept": konzeptData.config,
        })
        setPagesByBrand({
          physiotherapy: { pages: physioData.pages ?? [], legalPages: physioData.legalPages ?? [] },
          "physio-konzept": { pages: konzeptData.pages ?? [], legalPages: konzeptData.legalPages ?? [] },
        })
      } catch (error) {
        console.error("Error loading footer configs:", error)
        setFooterConfigs({
          physiotherapy: DEFAULT_FOOTER_CONFIG,
          "physio-konzept": DEFAULT_FOOTER_CONFIG,
        })
        setPagesByBrand({
          physiotherapy: { pages: [], legalPages: [] },
          "physio-konzept": { pages: [], legalPages: [] },
        })
      } finally {
        setLoading(false)
      }
    }
    loadFooterConfigs()
  }, [])

  // Don't show footer on admin/auth pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) {
    return null
  }

  if (loading || !footerConfigs) {
    return null
  }

  const footerConfig = footerConfigs[brand]
  const { pages, legalPages } = pagesByBrand[brand]
  const pagesMap = new Map(pages.map((p) => [p.slug, p.title]))

  return (
    <FooterClient
      brand={brand}
      footerConfig={footerConfig}
      pagesMap={pagesMap}
      legalPages={legalPages}
    />
  )
}
