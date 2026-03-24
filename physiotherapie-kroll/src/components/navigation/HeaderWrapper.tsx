"use client"

import { usePathname } from "next/navigation"
import { HeaderClient } from "./HeaderClient"
import { useBrand } from "@/components/brand/BrandProvider"
import { useState, useEffect } from "react"
import type { NavConfig } from "@/types/navigation"
import { DEFAULT_NAV_CONFIG } from "@/lib/consent/navigation-defaults"

/**
 * Client component that wraps children and adds header
 * Loads both brand configs once and switches between them based on active brand
 * Hides header on legal pages (via API check)
 */
export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { brand } = useBrand()
  const [navConfigs, setNavConfigs] = useState<{
    physiotherapy: NavConfig
    "physio-konzept": NavConfig
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLegalPage, setIsLegalPage] = useState(false)

  // Load both navigation configs once
  useEffect(() => {
    const loadNavConfigs = async () => {
      try {
        const [physioResponse, konzeptResponse] = await Promise.all([
          fetch(`/api/navigation?brand=physiotherapy`),
          fetch(`/api/navigation?brand=physio-konzept`),
        ])

        const physioConfig = physioResponse.ok
          ? await physioResponse.json()
          : DEFAULT_NAV_CONFIG
        const konzeptConfig = konzeptResponse.ok
          ? await konzeptResponse.json()
          : DEFAULT_NAV_CONFIG

        if (process.env.NODE_ENV === "development") {
          console.log("[HeaderWrapper] Loaded configs:", {
            physio: { logo: physioConfig.logo, logoSize: physioConfig.logoSize },
            konzept: { logo: konzeptConfig.logo, logoSize: konzeptConfig.logoSize },
          })
        }

        setNavConfigs({
          physiotherapy: physioConfig,
          "physio-konzept": konzeptConfig,
        })
      } catch (error) {
        console.error("Error loading navigation configs:", error)
        // Fallback to defaults
        setNavConfigs({
          physiotherapy: DEFAULT_NAV_CONFIG,
          "physio-konzept": DEFAULT_NAV_CONFIG,
        })
      } finally {
        setLoading(false)
      }
    }
    loadNavConfigs()
  }, []) // Only load once on mount

  // Check if current page is a legal page
  useEffect(() => {
    const checkIfLegalPage = async () => {
      if (!pathname) return

      // Skip admin/auth pages
      if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) {
        setIsLegalPage(false)
        return
      }

      // Extract slug from pathname (e.g., "/imprint" => "imprint", "/konzept/impressum" => "konzept")
      const segments = pathname.split("/").filter(Boolean)
      if (segments.length === 0) {
        setIsLegalPage(false)
        return
      }

      // Handle /konzept/* pages (physio-konzept brand)
      const isKonzeptPage = segments[0] === "konzept"
      const slug = isKonzeptPage ? segments[1] : segments[0]
      const checkBrand = isKonzeptPage ? "physio-konzept" : "physiotherapy"

      try {
        const response = await fetch(`/api/is-legal-page?slug=${slug}&brand=${checkBrand}`)
        const data = await response.json()
        setIsLegalPage(data.isLegalPage || false)

        if (process.env.NODE_ENV === "development") {
          console.log("[HeaderWrapper] Legal page check:", {
            pathname,
            slug,
            brand: checkBrand,
            isLegalPage: data.isLegalPage,
          })
        }
      } catch (error) {
        console.error("[HeaderWrapper] Error checking if legal page:", error)
        setIsLegalPage(false)
      }
    }
    checkIfLegalPage()
  }, [pathname])

  // Don't show header on admin/auth pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) {
    return <>{children}</>
  }

  // Hide header on legal pages
  if (isLegalPage) {
    return <>{children}</>
  }

  if (loading || !navConfigs) {
    return <>{children}</>
  }

  // Get the config for the current brand
  const navConfig = navConfigs[brand]

  if (process.env.NODE_ENV === "development") {
    console.log("[HeaderWrapper] Rendering with brand:", brand, "Logo:", navConfig.logo)
  }

  return (
    <>
      <HeaderClient brand={brand} navConfig={navConfig} />
      {children}
    </>
  )
}
