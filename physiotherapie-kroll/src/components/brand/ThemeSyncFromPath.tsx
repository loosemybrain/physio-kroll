"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import type { BrandKey } from "./brandAssets"
import { writeLastPublicHome, type PublicHomePath } from "@/lib/publicHomePreference"

function brandFromPath(pathname: string): BrandKey {
  const segments = pathname.split("/").filter(Boolean)
  const isKonzept = segments[0] === "konzept"
  const slug = isKonzept ? segments[1] : segments[0]
  const legalSlugs = new Set(["impressum", "datenschutz", "cookies", "privacy", "imprint"])
  if (slug && legalSlugs.has(slug)) {
    // Legal pages always use the physiotherapy color/brand scheme.
    return "physiotherapy"
  }
  if (pathname === "/konzept" || pathname?.startsWith("/konzept/")) {
    return "physio-konzept"
  }
  return "physiotherapy"
}

/**
 * When the user navigates client-side (e.g. BrandToggle from /konzept to /),
 * the root layout's html style is not re-applied, so the document keeps the
 * previous brand's theme. This component fetches the correct theme for the
 * current path and applies it to <html>, so the design stays in sync.
 */
export function ThemeSyncFromPath() {
  const pathname = usePathname()
  const brand = brandFromPath(pathname ?? "/")
  const appliedBrandRef = useRef<BrandKey | null>(null)

  useEffect(() => {
    const p = pathname ?? "/"
    if (p === "/" || p === "/konzept") {
      writeLastPublicHome(p as PublicHomePath)
    }
  }, [pathname])

  useEffect(() => {
    if (typeof document === "undefined") return

    const root = document.documentElement

    const apply = (vars: Record<string, string>, targetBrand: BrandKey) => {
      Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
      root.dataset.brand = targetBrand
      if (targetBrand === "physio-konzept") {
        root.classList.add("physio-konzept")
      } else {
        root.classList.remove("physio-konzept")
      }
      appliedBrandRef.current = targetBrand
      // End global transition overlay after theme vars are painted on target route.
      window.requestAnimationFrame(() => {
        root.removeAttribute("data-brand-switching")
      })
    }

    if (appliedBrandRef.current === brand) return

    const ac = new AbortController()
    let cancelled = false

    fetch(`/api/theme?brand=${encodeURIComponent(brand)}`, { signal: ac.signal })
      .then((res) => {
        if (!res.ok || cancelled) return null
        return res.json()
      })
      .then((data: { brand: BrandKey; vars: Record<string, string> } | null) => {
        if (!cancelled && data?.vars) apply(data.vars, data.brand)
      })
      .catch(() => {
        // aborted or network error — ignore
      })

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [brand])

  return null
}
