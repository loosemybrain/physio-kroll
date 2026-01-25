"use client"

import { useEffect } from "react"
import type { BrandKey } from "@/components/brand/brandAssets"
import { useBrand } from "@/components/brand/BrandProvider"

/**
 * Ensures preview pages render with the correct brand context (header/nav styling).
 * BrandProvider defaults to pathname-based brand ("/konzept"…), which doesn't apply
 * to preview routes, so we override it here.
 */
export function PreviewBrandSetter({ brand }: { brand: BrandKey }) {
  const { setBrand } = useBrand()

  useEffect(() => {
    setBrand(brand)
  }, [brand, setBrand])

  return null
}

