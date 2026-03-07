"use client"

import { cn } from "@/lib/utils"
import type { LegalDividerBlock } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LegalDividerProps extends Omit<LegalDividerBlock, "type" | "id"> {
  className?: string
}

const spacingTopMap: Record<string, string> = {
  none: "pt-0",
  sm: "pt-4",
  md: "pt-8",
  lg: "pt-12",
}

const spacingBottomMap: Record<string, string> = {
  none: "pb-0",
  sm: "pb-4",
  md: "pb-8",
  lg: "pb-12",
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LegalDivider({
  variant = "line",
  spacingTop = "md",
  spacingBottom = "md",
  className,
}: LegalDividerProps) {
  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
        className,
      )}
      role="separator"
      aria-hidden="true"
    >
      {variant === "line" && (
        <hr className="border-t border-border" />
      )}

      {variant === "gradient" && (
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--color-border) 20%, var(--color-border) 80%, transparent)",
          }}
        />
      )}

      {variant === "dots" && (
        <div className="flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
        </div>
      )}
    </div>
  )
}
