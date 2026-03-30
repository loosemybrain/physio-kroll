"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { resolveSectionBg } from "@/lib/theme/resolveSectionBg"
import { resolveContainerBg } from "@/lib/theme/resolveContainerBg"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import type { BlockSectionProps, ElementShadow, LegalSpacing } from "@/types/cms"
import { sanitizeCmsHtml } from "@/lib/security/sanitizeCmsHtml"

type LegalSectionProps = {
  section?: BlockSectionProps
  title: string
  content: string
  containerBackground?: string
  containerMode?: "transparent" | "color" | "gradient"
  spacing?: LegalSpacing
  containerShadow?: ElementShadow
}

const spacingMap: Record<LegalSpacing, string> = {
  none: "py-0",
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
}

export function LegalSection({
  section,
  title,
  content,
  containerBackground,
  containerMode = "transparent",
  spacing = "md",
  containerShadow,
}: LegalSectionProps) {
  const headingId = React.useId()
  const sectionBg = resolveSectionBg(section)
  const containerBg = resolveContainerBg({
    mode: containerMode,
    color: containerBackground,
    gradientPreset: undefined,
    gradient: { from: "", via: "", to: "", angle: 135 },
  })
  const containerShadowCss = resolveBoxShadow(containerShadow)

  return (
    <section
      aria-labelledby={headingId}
      className={cn("relative", spacingMap[spacing], sectionBg.className)}
      style={sectionBg.style}
    >
      <div className="mx-auto w-full max-w-4xl">
        <div
          className={cn(
            "rounded-3xl border px-6 py-6 md:px-8 md:py-8",
            containerMode === "transparent" ? "border-border/30 bg-transparent" : "border-border/40",
          )}
          style={{
            ...(containerBg.style ?? {}),
            ...(containerShadowCss ? { boxShadow: containerShadowCss } : {}),
          }}
        >
          <h2 id={headingId} className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
          <div
            className="prose prose-neutral dark:prose-invert mt-5 max-w-prose text-pretty leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content || "") }}
          />
        </div>
      </div>
    </section>
  )
}

