"use client"

import { cn } from "@/lib/utils"
import type { LegalSectionBlock } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LegalSectionProps extends Omit<LegalSectionBlock, "type" | "id"> {
  id?: string
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Class Maps                                                         */
/* ------------------------------------------------------------------ */

const headingSizeMap: Record<string, string> = {
  h2: "text-2xl md:text-3xl",
  h3: "text-xl md:text-2xl",
  h4: "text-lg md:text-xl",
}

const alignMap: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  justify: "text-justify hyphens-auto",
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

export function LegalSection({
  id,
  anchorId,
  headline,
  headlineSize = "h2",
  subheadline,
  content,
  textAlign = "left",
  showNumber,
  numberValue,
  highlight = false,
  headlineColor,
  textColor,
  backgroundColor,
  spacingTop = "md",
  spacingBottom = "md",
  className,
}: LegalSectionProps) {
  const HeadingTag = headlineSize as keyof JSX.IntrinsicElements

  return (
    <section
      id={anchorId || id}
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
        className,
      )}
    >
      <div
        className={cn(
          "rounded-2xl transition-colors",
          highlight && "border border-primary/20 bg-primary/[0.03] p-6 md:p-8",
          !highlight && backgroundColor && "p-6 md:p-8",
        )}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        {/* Headline */}
        <div className={cn("mb-4 flex items-baseline gap-3", alignMap[textAlign])}>
          {showNumber && numberValue !== undefined && (
            <span className="flex-shrink-0 text-lg font-semibold text-primary">
              {numberValue}.
            </span>
          )}
          <HeadingTag
            className={cn(
              "font-semibold tracking-tight text-foreground",
              headingSizeMap[headlineSize],
            )}
            style={headlineColor ? { color: headlineColor } : undefined}
          >
            {headline}
          </HeadingTag>
        </div>

        {/* Subheadline */}
        {subheadline && (
          <p
            className={cn(
              "mb-4 text-base font-medium text-muted-foreground",
              alignMap[textAlign],
            )}
          >
            {subheadline}
          </p>
        )}

        {/* Content */}
        <div
          className={cn(
            "prose prose-neutral dark:prose-invert max-w-none",
            "prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "prose-li:text-muted-foreground prose-li:marker:text-primary",
            alignMap[textAlign],
          )}
          style={textColor ? { color: textColor } : undefined}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  )
}
