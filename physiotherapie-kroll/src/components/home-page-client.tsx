"use client"

import { useState, useMemo } from "react"
import { CMSRenderer } from "@/components/cms/BlockRenderer"
import type { CMSBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { useBrand } from "@/components/brand/BrandProvider"

interface HomePageClientProps {
  blocks: CMSBlock[]
  initialBrand: BrandKey
  showBrandToggle?: boolean
}

export function HomePageClient({
  blocks,
  initialBrand,
  showBrandToggle = false,
}: HomePageClientProps) {
  const { setBrand: setSelectedBrand } = useBrand()

  // Track user-driven brand override (only set by explicit user action)
  const [brandOverride, setBrandOverride] = useState<BrandKey | null>(null)

  // Effective brand: user override takes precedence, otherwise initial (from server)
  const effectiveBrand = brandOverride ?? initialBrand

  // Handle brand change (called from BrandToggle)
  const handleBrandChange = (newBrand: BrandKey) => {
    setBrandOverride(newBrand)
    setSelectedBrand(newBrand)
  }

  // Update hero blocks with the effective brand/mood and toggle props
  // This ONLY changes when user explicitly toggles, not on hydration
  const blocksWithBrand = useMemo(() => {
    return blocks.map((block) => {
      if (block.type === "hero") {
        return {
          ...block,
          props: {
            ...block.props,
            mood: effectiveBrand,
            // Inject toggle into Hero props for floating overlay rendering
            showBrandToggle,
            brandToggleValue: effectiveBrand,
          },
        }
      }
      return block
    })
  }, [blocks, effectiveBrand, showBrandToggle])

  return (
    <main>
      {/* CMS Blocks - Hero will render BrandToggle as floating overlay */}
      <CMSRenderer blocks={blocksWithBrand} />
    </main>
  )
}
