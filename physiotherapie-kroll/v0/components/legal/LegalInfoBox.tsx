"use client"

import { cn } from "@/lib/utils"
import { Info, AlertTriangle, CheckCircle2, FileText } from "lucide-react"
import type { LegalInfoBoxBlock } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LegalInfoBoxProps extends Omit<LegalInfoBoxBlock, "type" | "id"> {
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Variant Config                                                     */
/* ------------------------------------------------------------------ */

const variantConfig = {
  info: {
    icon: Info,
    container: "border-primary/30 bg-primary/5",
    iconColor: "text-primary",
    headlineColor: "text-primary",
  },
  warning: {
    icon: AlertTriangle,
    container: "border-amber-500/30 bg-amber-500/5",
    iconColor: "text-amber-600 dark:text-amber-500",
    headlineColor: "text-amber-700 dark:text-amber-500",
  },
  success: {
    icon: CheckCircle2,
    container: "border-emerald-500/30 bg-emerald-500/5",
    iconColor: "text-emerald-600 dark:text-emerald-500",
    headlineColor: "text-emerald-700 dark:text-emerald-500",
  },
  neutral: {
    icon: FileText,
    container: "border-border bg-muted/50",
    iconColor: "text-muted-foreground",
    headlineColor: "text-foreground",
  },
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

export function LegalInfoBox({
  variant = "info",
  icon = true,
  headline,
  content,
  spacingTop = "sm",
  spacingBottom = "sm",
  className,
}: LegalInfoBoxProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
        className,
      )}
    >
      <div
        className={cn(
          "flex gap-4 rounded-xl border p-4 md:p-5",
          config.container,
        )}
        role="note"
      >
        {/* Icon */}
        {icon && (
          <div className="flex-shrink-0 pt-0.5">
            <Icon className={cn("h-5 w-5", config.iconColor)} aria-hidden="true" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {headline && (
            <p className={cn("mb-1 font-semibold", config.headlineColor)}>
              {headline}
            </p>
          )}
          <div
            className="prose prose-sm prose-neutral dark:prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </div>
  )
}
