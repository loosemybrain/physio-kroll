"use client"

import { cn } from "@/lib/utils"
import { CardSurface } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import * as LucideIcons from "lucide-react"

interface ServicesGridBlockProps {
  section?: unknown
  typography?: unknown
  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string
  columns?: 2 | 3 | 4
  cards: Array<{
    id: string
    icon: string
    title: string
    text: string
    ctaText?: string
    ctaHref?: string
    iconColor?: string
    iconBgColor?: string
    titleColor?: string
    textColor?: string
    ctaColor?: string
    cardBgColor?: string
    cardBorderColor?: string
  }>
  background?: "none" | "muted" | "gradient"
  iconColor?: string
  iconBgColor?: string
  titleColor?: string
  textColor?: string
  ctaColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const columnsMap = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

const backgroundMap = {
  none: "bg-background",
  muted: "bg-muted/10",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

function getIconComponent(iconName: string) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[iconName]
  return IconComponent || LucideIcons.Circle
}

export function ServicesGridBlock({
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  columns = 3,
  cards,
  background = "none",
  iconColor,
  iconBgColor,
  titleColor,
  textColor,
  ctaColor,
  cardBgColor,
  cardBorderColor,
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: ServicesGridBlockProps) {
  // Inline edit helper
  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  return (
    <section
      className={cn(
        "relative py-20 md:py-28",
        backgroundMap[background]
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Headline & Subheadline */}
        {(headline || subheadline) && (
          <header className="mb-16 text-center">
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  "mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
          </header>
        )}

        {/* Cards Grid */}
        <div className={cn("grid gap-6 lg:gap-8", columnsMap[columns])}>
          {cards.map((card, index) => {
            // 1) Icon Badge Defaults
            const IconComponent = getIconComponent(card.icon)
            const resolvedIconBg = card.iconBgColor ?? iconBgColor
            const resolvedIconColor = card.iconColor ?? iconColor
            const elementId = `card:${index}`
            const isSelected = selectedElementId === elementId
            const isPadded = columns === 2 || columns === 4

            return (
              <CardSurface
                key={card.id}
                onClick={(e) => {
                  // 2) Editor Click Handling
                  if (editable && blockId && onElementClick) {
                    e.stopPropagation()
                    onElementClick(blockId, elementId)
                  }
                }}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card",
                  "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_18px_50px_-20px_rgba(0,0,0,0.18)]",
                  "transition-shadow duration-300 ease-out",
                  "hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_28px_60px_-16px_rgba(0,0,0,0.22)]",
                  editable && blockId && onElementClick && "cursor-pointer",
                  isSelected && "ring-2 ring-primary/60"
                )}
                style={{
                  backgroundColor: card.cardBgColor || cardBgColor || undefined,
                  borderColor: card.cardBorderColor || cardBorderColor || undefined,
                }}
              >
                {/* Top Accent Bar */}
                <div className="h-1 w-full bg-linear-to-r from-primary/60 via-primary/30 to-transparent" />

                {/* Card Body */}
                <div className={cn(
                  "relative flex flex-1 flex-col",
                  isPadded ? "p-8 md:p-10" : "p-7"
                )}>
                  {/* Icon Badge */}
                  <div
                    className={cn(
                      "mb-5 flex h-14 w-14 items-center justify-center rounded-xl transition-transform duration-300",
                      "group-hover:scale-110",
                      !resolvedIconBg && "bg-primary/10"
                    )}
                    style={{
                      ...(resolvedIconColor ? { color: resolvedIconColor } : {}),
                      ...(resolvedIconBg ? { backgroundColor: resolvedIconBg } : {}),
                    }}
                  >
                    <IconComponent className={cn("h-7 w-7", !resolvedIconColor && "text-primary")} />
                  </div>

                  {/* Title */}
                  <h3
                    onClick={(e) => {
                      e.stopPropagation()
                      handleInlineEdit(e, `cards.${index}.title`)
                    }}
                    className={cn(
                      "mb-3 text-lg font-semibold tracking-tight text-card-foreground",
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={{ color: card.titleColor || titleColor || undefined }}
                  >
                    {card.title}
                  </h3>

                  {/* Text */}
                  <p
                    onClick={(e) => {
                      e.stopPropagation()
                      handleInlineEdit(e, `cards.${index}.text`)
                    }}
                    className={cn(
                      "flex-1 text-base leading-relaxed text-muted-foreground",
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={{ color: card.textColor || textColor || undefined }}
                  >
                    {card.text}
                  </p>

                  {/* CTA Section */}
                  {card.ctaText && card.ctaHref && (
                    <div className="mt-6 border-t border-border/40 pt-5">
                      {editable ? (
                        <button
                          type="button"
                          className="group/cta inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                          style={{ color: card.ctaColor || ctaColor || undefined }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInlineEdit(e, `cards.${index}.ctaText`)
                          }}
                        >
                          <span>{card.ctaText}</span>
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                        </button>
                      ) : (
                        <a
                          href={card.ctaHref}
                          className="group/cta inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                          style={{ color: card.ctaColor || ctaColor || undefined }}
                        >
                          <span>{card.ctaText}</span>
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </CardSurface>
            )
          })}
        </div>
      </div>
    </section>
  )
}
