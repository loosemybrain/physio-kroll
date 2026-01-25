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
  const [pagesMap, setPagesMap] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)

  // Load both footer configs once
  useEffect(() => {
    const loadFooterConfigs = async () => {
      try {
        const [physioResponse, konzeptResponse] = await Promise.all([
          fetch(`/api/footer?brand=physiotherapy`),
          fetch(`/api/footer?brand=physio-konzept`),
        ])

        const physioData = physioResponse.ok
          ? await physioResponse.json()
          : { config: DEFAULT_FOOTER_CONFIG, pages: [] }
        const konzeptData = konzeptResponse.ok
          ? await konzeptResponse.json()
          : { config: DEFAULT_FOOTER_CONFIG, pages: [] }

        setFooterConfigs({
          physiotherapy: physioData.config,
          "physio-konzept": konzeptData.config,
        })
        
        // Store pages data (same for both brands)
        setPagesMap(new Map([...physioData.pages, ...konzeptData.pages].map((p) => [p.slug, p.title])))
      } catch (error) {
        console.error("Error loading footer configs:", error)
        setFooterConfigs({
          physiotherapy: DEFAULT_FOOTER_CONFIG,
          "physio-konzept": DEFAULT_FOOTER_CONFIG,
        })
        setPagesMap(new Map())
      } finally {
        setLoading(false)
      }
    }
    loadFooterConfigs()
  }, [])

  // Don't show footer on admin pages
  if (pathname?.startsWith("/admin")) {
    return null
  }

  if (loading || !footerConfigs) {
    return null
  }

  const footerConfig = footerConfigs[brand]

  return <FooterClient brand={brand} footerConfig={footerConfig} pagesMap={pagesMap} />
}
