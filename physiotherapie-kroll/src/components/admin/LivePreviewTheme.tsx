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
 * Live Preview:
 * - Keep wrapper inline vars for reliable section/background styling.
 * - Additionally apply tokens to documentElement for Radix portals / root-scoped consumers.
 * - Only apply keys we actually have; never “blank out” the theme.
 */
export function LivePreviewTheme({ brand, children, className }: LivePreviewThemeProps) {
  const [vars, setVars] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(true)

  const appliedKeysRef = React.useRef<string[]>([])
  const prevBrandRef = React.useRef<BrandKey | null>(null)

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

        // Defensive: ensure keys look like CSS vars
        const nextVars = Object.fromEntries(
          Object.entries(filtered).filter(([k, v]) => k.startsWith("--") && typeof v === "string" && v.trim().length > 0)
        ) as Record<string, string>

        if (!cancelled) {
          setVars(nextVars)
          if (process.env.NODE_ENV === "development") {
            console.log("[LivePreviewTheme]", {
              brand,
              presetId: activePresetId,
              tokensSet: Object.keys(nextVars).length,
              hasPrimary: !!nextVars["--primary"],
              hasBackground: !!nextVars["--background"],
              hasForeground: !!nextVars["--foreground"],
              hasCard: !!nextVars["--card"],
              hasCardFg: !!nextVars["--card-foreground"],
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

  React.useEffect(() => {
    const root = document.documentElement

    // Always update brand markers on root (helps any selectors)
    // but do NOT wipe theme when vars are empty.
    root.setAttribute("data-brand", brand)
    if (brand === "physio-konzept") root.classList.add("physio-konzept")
    else root.classList.remove("physio-konzept")
    prevBrandRef.current = brand

    // If we have no vars, do nothing else (keep existing look)
    const entries = Object.entries(vars)
    if (entries.length === 0) return

    // cleanup previously applied keys (only our own)
    for (const k of appliedKeysRef.current) root.style.removeProperty(k)
    appliedKeysRef.current = []

    // Apply only a targeted subset for portal/root consumers.
    // Wrapper still holds the full vars for backgrounds/sections.
    const portalCriticalKeys = new Set([
      "--foreground",
      "--background",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--muted",
      "--muted-foreground",
      "--border",
      "--input",
      "--ring",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
    ])

    for (const [k, v] of entries) {
      if (!portalCriticalKeys.has(k)) continue
      root.style.setProperty(k, String(v))
      appliedKeysRef.current.push(k)
    }

    return () => {
      for (const k of appliedKeysRef.current) root.style.removeProperty(k)
      appliedKeysRef.current = []
      // keep data-brand markers; removing them can flicker admin selectors
    }
  }, [brand, vars])

  return (
    <div
      className={cn(
        "antialiased",
        brand === "physio-konzept" && "physio-konzept dark",   // ✅ wichtig: dark context in preview
        className,
      )}
      data-brand={brand}
      style={{
        ...(vars as unknown as React.CSSProperties),
        ...(brand === "physio-konzept" ? ({ colorScheme: "dark" } as React.CSSProperties) : null),
      }}
    >
      {children}
    </div>

  )
}
