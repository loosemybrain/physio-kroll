"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { BrandKey } from "./brandAssets"

interface BrandContextValue {
  brand: BrandKey
  setBrand: (brand: BrandKey) => void
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined)

function brandFromPath(pathname: string): BrandKey {
  if (pathname === "/konzept" || pathname.startsWith("/konzept/")) {
    return "physio-konzept"
  }
  return "physiotherapy"
}

/**
 * Brand Provider that manages the current brand state
 * Can be overridden by components (e.g., Hero toggle), but defaults to pathname-based brand
 */
export function BrandProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const pathBrand = brandFromPath(pathname || "/")

  // Optional override (e.g. via Hero toggle). If not set, we follow pathname.
  const [overrideBrand, setOverrideBrand] = useState<BrandKey | null>(null)
  const brand = overrideBrand ?? pathBrand

  const setBrand = useCallback((newBrand: BrandKey) => {
    setOverrideBrand(newBrand)
  }, [])

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

/**
 * Hook to access the current brand and setter
 */
export function useBrand() {
  const context = useContext(BrandContext)
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider")
  }
  return context
}

/**
 * Optional variant that returns null when no provider is mounted.
 * Useful for components that can run both inside and outside of BrandProvider.
 */
export function useBrandOptional(): BrandContextValue | null {
  return useContext(BrandContext) ?? null
}
