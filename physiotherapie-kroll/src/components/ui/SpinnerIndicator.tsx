"use client"

import { cn } from "@/lib/utils"
import type { SpinnerPresetKey, SpinnerSpeedKey } from "@/lib/ui/spinnerPresets"

const PRESET_CLASS: Record<SpinnerPresetKey, string> = {
  modern: "border-foreground/20 border-t-primary",
  minimal: "border-muted-foreground/25 border-t-foreground",
  duotone: "border-primary/25 border-t-primary border-r-accent",
  dots: "",
  glass: "border-primary/20 border-t-primary/85 border-r-primary/40 shadow-[0_0_0_6px_color-mix(in_oklch,var(--background)_78%,transparent)]",
  wave: "",
  "yin-yang": "",
  progress: "",
  orbital: "",
}

const SIZE_CLASS = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-[3px]",
  lg: "h-12 w-12 border-[3px]",
} as const

const SPEED_DURATION: Record<SpinnerSpeedKey, string> = {
  slow: "1.2s",
  normal: "0.8s",
  fast: "0.55s",
}

export function SpinnerIndicator({
  preset = "modern",
  speed = "normal",
  size = "md",
  className,
}: {
  preset?: SpinnerPresetKey
  speed?: SpinnerSpeedKey
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  if (preset === "yin-yang") {
    return (
      <div className={cn("spinner-yin-yang", className)} aria-hidden>
        <span className="spinner-yin-yang-dot spinner-yin-yang-dot-left" />
        <span className="spinner-yin-yang-dot spinner-yin-yang-dot-right" />
      </div>
    )
  }

  if (preset === "wave") {
    return (
      <div className={cn("spinner-wave", className)} aria-hidden>
        <span className="spinner-wave-layer spinner-wave-layer-1" />
        <span className="spinner-wave-layer spinner-wave-layer-2" />
      </div>
    )
  }

  if (preset === "progress") {
    return (
      <div
        className={cn("spinner-progress", className)}
        style={{ ["--spinner-progress-duration" as string]: speed === "slow" ? "8s" : speed === "fast" ? "4s" : "6s" }}
        aria-hidden
      >
        <span className="spinner-progress-bar" />
      </div>
    )
  }

  if (preset === "orbital") {
    return (
      <div className={cn("spinner-orbital", className)} aria-hidden>
        <span className="spinner-orbital-ring spinner-orbital-ring-x" />
        <span className="spinner-orbital-ring spinner-orbital-ring-y" />
      </div>
    )
  }

  if (preset === "dots") {
    return (
      <div className={cn("flex items-center gap-1.5", className)} aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.2s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.1s]" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/60 animate-bounce" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-full animate-spin",
        SIZE_CLASS[size],
        PRESET_CLASS[preset],
        className
      )}
      style={{ animationDuration: SPEED_DURATION[speed] }}
      aria-hidden
    />
  )
}

