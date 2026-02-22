"use client"

import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { BrandKey } from "@/components/brand/brandAssets"

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

  if (!showToggle) {
    return null
  }

  const isPhysiotherapy = value === "physiotherapy"

  const handleNavigate = (brand: BrandKey) => {
    if (brand === "physiotherapy") {
      router.push("/")
    } else {
      router.push("/konzept")
    }
  }

  return (
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
    >
      <button
        type="button"
        aria-pressed={isPhysiotherapy}
        aria-label="Wechsel zu Physiotherapie"
        className={cn(
          // On mobile: no shrink, grow to content; On desktop: flex-1 min-w-0
          "shrink-0 sm:flex-1 sm:min-w-0 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "px-2.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm",
          "whitespace-nowrap",
          isPhysiotherapy
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-transparent text-card-foreground hover:bg-muted/60"
        )}
        onClick={() => handleNavigate("physiotherapy")}
      >
        Physiotherapie
      </button>
      <button
        type="button"
        aria-pressed={!isPhysiotherapy}
        aria-label="Wechsel zu PhysioKonzept"
        className={cn(
          "shrink-0 sm:flex-1 sm:min-w-0 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "px-2.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm",
          "whitespace-nowrap",
          !isPhysiotherapy
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-transparent text-card-foreground hover:bg-muted/60"
        )}
        onClick={() => handleNavigate("physio-konzept")}
      >
        <span className="sm:hidden">Konzept</span>
        <span className="hidden sm:inline">PhysioKonzept</span>
      </button>
    </nav>
  )
}
