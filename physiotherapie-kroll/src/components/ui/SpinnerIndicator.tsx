"use client"

import { cn } from "@/lib/utils"
import type { SpinnerPresetKey } from "@/lib/ui/spinnerPresets"

const PRESET_CLASS: Record<SpinnerPresetKey, string> = {
  modern: "border-foreground/20 border-t-primary",
  minimal: "border-muted-foreground/25 border-t-foreground",
  duotone: "border-primary/25 border-t-primary border-r-accent",
}

const SIZE_CLASS = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-[3px]",
  lg: "h-12 w-12 border-[3px]",
} as const

export function SpinnerIndicator({
  preset = "modern",
  size = "md",
  className,
}: {
  preset?: SpinnerPresetKey
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-full animate-spin",
        SIZE_CLASS[size],
        PRESET_CLASS[preset],
        className
      )}
      aria-hidden
    />
  )
}

