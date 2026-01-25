"use client"

import * as React from "react"
import type { BrandKey } from "@/components/brand/brandAssets"
import { filterThemeTokens } from "@/lib/theme/themePresetTokens"
import { cn } from "@/lib/utils"

interface LivePreviewThemeProps {
  brand: BrandKey
  children: React.ReactNode
  className?: string
}

/**
 * Wraps the Live Preview and applies theme preset tokens for the current page.brand.
 * Loads tokens via API and applies them as inline CSS vars on the wrapper.
 */
export function LivePreviewTheme({ brand, children, className }: LivePreviewThemeProps) {
  const [vars, setVars] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    const loadTokens = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/theme-presets?brand=${encodeURIComponent(brand)}`, {
          cache: "no-store",
        })
        if (!res.ok) {
          if (!cancelled) setVars({})
          return
        }

        const body = await res.json().catch(() => ({}))
        const activePresetId = body?.activeThemePresetId ?? null
        const presets = (body?.presets ?? []) as Array<{ id: string; tokens: unknown }>

        if (!activePresetId || cancelled) {
          if (!cancelled) setVars({})
          return
        }

        const activePreset = presets.find((p) => p.id === activePresetId)
        if (!activePreset || cancelled) {
          if (!cancelled) setVars({})
          return
        }

        const filtered = filterThemeTokens(activePreset.tokens)
        const nextVars = Object.fromEntries(Object.entries(filtered)) as Record<string, string>

        if (!cancelled) {
          setVars(nextVars)
          if (process.env.NODE_ENV === "development") {
            console.log("[LivePreviewTheme]", {
              brand,
              presetId: activePresetId,
              tokensSet: Object.keys(nextVars).length,
            })
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[LivePreviewTheme] Failed to load tokens:", e)
          setVars({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTokens()

    return () => {
      cancelled = true
    }
  }, [brand])

  return (
    <div
      className={cn(
        brand === "physio-konzept" && "physio-konzept",
        className,
      )}
      style={vars as unknown as React.CSSProperties}
    >
      {children}
    </div>
  )
}
