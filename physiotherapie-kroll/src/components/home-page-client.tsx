"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { CMSRenderer } from "@/components/cms/BlockRenderer"
import { cn } from "@/lib/utils"
import type { CMSBlock } from "@/types/cms"
import { useBrand } from "@/components/brand/BrandProvider"

interface HomePageClientProps {
  blocks: CMSBlock[]
}

export function HomePageClient({ blocks }: HomePageClientProps) {
  const { brand: selectedBrand, setBrand: setSelectedBrand } = useBrand()

  // Don't set brand class on document root - it affects the entire page background
  // Instead, let individual components handle their own brand styling

  // Update hero blocks with the selected brand/mood
  const blocksWithBrand = useMemo(() => {
    return blocks.map((block) => {
      if (block.type === "hero") {
        return {
          ...block,
          props: {
            ...block.props,
            mood: selectedBrand,
          },
        }
      }
      return block
    })
  }, [blocks, selectedBrand])

  // Find the first hero block and add toggle props
  const blocksWithToggle = useMemo(() => {
    let firstHeroFound = false
    return blocksWithBrand.map((block) => {
      if (block.type === "hero" && !firstHeroFound) {
        firstHeroFound = true
        return {
          ...block,
          props: {
            ...block.props,
            showBrandToggle: true,
            onBrandChange: setSelectedBrand,
          } as any,
        }
      }
      return block
    })
  }, [blocksWithBrand, setSelectedBrand])

  return (
    <>
      {/* CMS Blocks */}
      <main>
        <CMSRenderer blocks={blocksWithToggle} />
      </main>
    </>
  )
}
