"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useElementShadowStyle } from "@/lib/shadow"

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
  none: "",
  muted: "bg-muted/50",
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
        "py-16 px-4",
        backgroundMap[background]
      )}
    >
      <div className="container mx-auto">
        {/* Headline & Subheadline */}
        {(headline || subheadline) && (
          <div className="mb-12 text-center">
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  "mt-4 text-lg text-muted-foreground max-w-2xl mx-auto",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
          </div>
        )}

        {/* Cards Grid */}
        <div className={cn("grid gap-6", columnsMap[columns])}>
          {cards.map((card, index) => {
            const IconComponent = getIconComponent(card.icon)
            return (
              <Card
                key={card.id}
                className="h-full flex flex-col"
                style={{
                  backgroundColor: card.cardBgColor || cardBgColor || undefined,
                  borderColor: card.cardBorderColor || cardBorderColor || undefined,
                }}
              >
                <CardHeader>
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    style={{
                      color: card.iconColor || iconColor || undefined,
                      backgroundColor: card.iconBgColor || iconBgColor || undefined,
                    }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <CardTitle
                    onClick={(e) => handleInlineEdit(e, `cards.${index}.title`)}
                    className={cn(
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={{ color: card.titleColor || titleColor || undefined }}
                  >
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p
                    onClick={(e) => handleInlineEdit(e, `cards.${index}.text`)}
                    className={cn(
                      "text-muted-foreground",
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={{ color: card.textColor || textColor || undefined }}
                  >
                    {card.text}
                  </p>
                  {card.ctaText && card.ctaHref && (
                    <div className="mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        style={{ color: card.ctaColor || ctaColor || undefined }}
                        onClick={editable && blockId && onEditField ? (e) => handleInlineEdit(e, `cards.${index}.ctaText`) : undefined}
                        asChild={!editable && !!card.ctaHref}
                      >
                        {!editable && card.ctaHref ? (
                          <a href={card.ctaHref}>
                            {card.ctaText}
                            <ArrowRight className="h-4 w-4" />
                          </a>
                        ) : (
                          <>
                            <span
                              onClick={(e) => {
                                if (editable && blockId && onEditField) {
                                  e.stopPropagation()
                                  handleInlineEdit(e, `cards.${index}.ctaText`)
                                }
                              }}
                              className={cn(
                                editable && blockId && onEditField && "cursor-pointer"
                              )}
                            >
                              {card.ctaText}
                            </span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
