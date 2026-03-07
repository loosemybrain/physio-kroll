"use client"

import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import type { LegalContactCardBlock } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LegalContactCardProps
  extends Omit<LegalContactCardBlock, "type" | "id"> {
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

export function LegalContactCard({
  headline = "Verantwortliche Stelle",
  lines,
  spacingTop = "md",
  spacingBottom = "md",
  className,
}: LegalContactCardProps) {
  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
        className,
      )}
    >
      <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{headline}</h3>
        </div>

        {/* Lines */}
        <dl className="space-y-3">
          {lines.map((line) => (
            <div key={line.id} className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="flex-shrink-0 text-sm font-medium text-muted-foreground sm:w-32">
                {line.label}
              </dt>
              <dd className="text-sm text-foreground">
                {line.href ? (
                  <a
                    href={line.href}
                    className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {line.value}
                  </a>
                ) : (
                  line.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
