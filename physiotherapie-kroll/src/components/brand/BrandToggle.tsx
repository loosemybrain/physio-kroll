"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { BrandKey } from "@/components/brand/brandAssets"
import { SpinnerIndicator } from "@/components/ui/SpinnerIndicator"
import {
  readSpinnerConfigForBrand,
  spinnerOverlayClass,
  type SpinnerConfig,
  type SpinnerBrandKey,
} from "@/lib/ui/spinnerPresets"

interface BrandToggleProps {
  value: BrandKey
  variant?: "pill" | "segmented"
  className?: string
  showToggle?: boolean
}

/**
 * BrandToggle Component
 * 
 * Theme-aware brand selection toggle.
 * Navigates between "/" (physiotherapy) and "/konzept" (physio-konzept).
 * 
 * Uses token-based styling (no hardcoded colors):
 * - Container: border-border bg-card/90 text-card-foreground shadow-sm backdrop-blur
 * - Active: bg-primary text-primary-foreground
 * - Inactive: bg-transparent text-foreground hover:bg-muted/60
 * 
 * Hydration-safe: rendered as overlay, not injected post-DOM.
 */
export function BrandToggle({
  value,
  variant = "pill",
  className,
  showToggle = true,
}: BrandToggleProps) {
  const router = useRouter()
  const [switching, setSwitching] = React.useState(false)
  const [globalSwitching, setGlobalSwitching] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [spinnerConfig, setSpinnerConfig] = React.useState<SpinnerConfig>({
    preset: "modern",
    speed: "normal",
    overlayStrength: "medium",
  })
  const overlayClass = spinnerOverlayClass(spinnerConfig.overlayStrength)
  const pendingRef = React.useRef(false)
  const fallbackTimerRef = React.useRef<number | null>(null)


  React.useEffect(() => {
    setMounted(true)
    const brand = value === "physio-konzept" ? "physio-konzept" : "physiotherapy"
    setSpinnerConfig(readSpinnerConfigForBrand(brand as SpinnerBrandKey))
  }, [value])

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement

    const sync = () => {
      const active = root.getAttribute("data-brand-switching") === "true"
      setGlobalSwitching(active)
      setSwitching(active)
      if (!active) pendingRef.current = false
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["data-brand-switching"] })
    return () => {
      observer.disconnect()
      if (fallbackTimerRef.current != null) {
        window.clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [])

  const applyThemeBeforeNavigation = React.useCallback(async (brand: BrandKey) => {
    if (typeof document === "undefined") return
    const res = await fetch(`/api/theme?brand=${encodeURIComponent(brand)}`)
    if (!res.ok) return
    const data = (await res.json()) as { brand: BrandKey; vars: Record<string, string> }
    if (!data?.vars) return

    const root = document.documentElement
    Object.entries(data.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    root.dataset.brand = data.brand
    if (data.brand === "physio-konzept") root.classList.add("physio-konzept")
    else root.classList.remove("physio-konzept")
  }, [])

  const waitForVisualStability = React.useCallback(async () => {
    if (typeof document === "undefined") return
    // Ensure CSS vars are committed and painted before route transition.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    // Optional: give font subsystem a short chance to settle (prevents tiny flash on some devices).
    const fontsApi = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
    if (fontsApi?.ready) {
      await Promise.race([
        fontsApi.ready.then(() => undefined).catch(() => undefined),
        new Promise<void>((resolve) => window.setTimeout(resolve, 350)),
      ])
    }
  }, [])

  const handleNavigate = React.useCallback(
    async (brand: BrandKey) => {
      if (pendingRef.current) return
      const targetPath = brand === "physiotherapy" ? "/" : "/konzept"
      if ((value === "physiotherapy" && targetPath === "/") || (value === "physio-konzept" && targetPath === "/konzept")) {
        return
      }

      pendingRef.current = true
      setSwitching(true)
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      if (typeof document !== "undefined") {
        const root = document.documentElement
        root.setAttribute("data-brand-switching", "true")
        root.setAttribute("data-brand-switch-target", brand)
        root.setAttribute("data-brand-switch-token", token)
        if (fallbackTimerRef.current != null) window.clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = window.setTimeout(() => {
          const r = document.documentElement
          if (r.getAttribute("data-brand-switch-token") === token) {
            r.removeAttribute("data-brand-switching")
            r.removeAttribute("data-brand-switch-target")
            r.removeAttribute("data-brand-switch-token")
          }
        }, 10000)
      }
      try {
        router.prefetch(targetPath)
        await applyThemeBeforeNavigation(brand)
        await waitForVisualStability()
      } catch {
        // Fallback: navigate even if theme fetch fails.
      }
      router.push(targetPath)
    },
    [applyThemeBeforeNavigation, router, value, waitForVisualStability]
  )

  if (!showToggle) {
    return null
  }

  const isPhysiotherapy = value === "physiotherapy"

  return (
    <>
      <nav
        className={cn(
          "flex items-center gap-1 sm:gap-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300",
          "border border-border bg-card/95 text-card-foreground",
          "w-full max-w-xs sm:max-w-none",
          variant === "pill" && "p-1",
          variant === "segmented" && "p-1",
          className
        )}
        aria-label="Brand selection"
        aria-busy={switching ? true : undefined}
      >
        <button
          type="button"
          aria-pressed={isPhysiotherapy}
          aria-label="Wechsel zu Physiotherapie"
          disabled={switching}
          className={cn(
            // On mobile: no shrink, grow to content; On desktop: flex-1 min-w-0
            "shrink-0 sm:flex-1 sm:min-w-0 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "px-2.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm",
            "whitespace-nowrap",
            isPhysiotherapy
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-transparent text-card-foreground hover:bg-muted/60",
            switching && "opacity-70 cursor-wait"
          )}
          onClick={() => handleNavigate("physiotherapy")}
        >
          Physiotherapie
        </button>
        <button
          type="button"
          aria-pressed={!isPhysiotherapy}
          aria-label="Wechsel zu PhysioKonzept"
          disabled={switching}
          className={cn(
            "shrink-0 sm:flex-1 sm:min-w-0 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "px-2.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm",
            "whitespace-nowrap",
            !isPhysiotherapy
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-transparent text-card-foreground hover:bg-muted/60",
            switching && "opacity-70 cursor-wait"
          )}
          onClick={() => handleNavigate("physio-konzept")}
        >
          <span className="sm:hidden">PhysioKonzept</span>
          <span className="hidden sm:inline">PhysioKonzept</span>
        </button>
      </nav>
      {mounted && globalSwitching
        ? createPortal(
            <div className={`fixed inset-0 z-1000001 flex items-center justify-center ${overlayClass} backdrop-blur-sm`} aria-hidden>
              <SpinnerIndicator preset={spinnerConfig.preset} speed={spinnerConfig.speed} size="lg" />
            </div>,
            document.body
          )
        : null}
    </>
  )
}
