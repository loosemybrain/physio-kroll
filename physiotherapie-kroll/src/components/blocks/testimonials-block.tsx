"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { Carousel, CarouselDots, CarouselNextButton, CarouselPrevButton, CarouselSlide, CarouselTrack } from "@/components/ui/carousel"

export interface TestimonialsBlockProps {
  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string
  quoteColor?: string
  nameColor?: string
  roleColor?: string
  items: Array<{
    id: string
    quote: string
    quoteColor?: string
    name: string
    nameColor?: string
    role?: string
    roleColor?: string
    rating?: 1 | 2 | 3 | 4 | 5
  }>
  columns?: 1 | 2 | 3
  variant?: "grid" | "slider"
  background?: "none" | "muted" | "gradient"
  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
}

const columnsMap: Record<NonNullable<TestimonialsBlockProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}

const backgroundMap: Record<NonNullable<TestimonialsBlockProps["background"]>, string> = {
  none: "",
  muted: "bg-muted/50",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

function coerceColumns(value: TestimonialsBlockProps["columns"]): 1 | 2 | 3 {
  if (value === 1 || value === 2 || value === 3) return value
  const n = typeof value === "string" ? Number(value) : Number.NaN
  if (n === 1 || n === 2 || n === 3) return n
  return 3
}

export function TestimonialsBlock({
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  quoteColor,
  nameColor,
  roleColor,
  items,
  columns = 3,
  variant = "grid",
  background = "none",
  editable = false,
  blockId,
  onEditField,
}: TestimonialsBlockProps) {
  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  const resolvedColumns = coerceColumns(columns)

  return (
    <section className={cn("py-16 px-4", backgroundMap[background])} aria-label={headline || "Testimonials"}>
      <div className="container mx-auto">
        {(headline || subheadline) && (
          <header className="mb-12 text-center">
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
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
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        {variant === "slider" ? (
          <div className="relative">
            <Carousel itemsCount={items.length} loop ariaLabel={headline || "Testimonials"} draggable pauseOnHover>
              <CarouselTrack className="items-stretch">
                {items.map((t, index) => (
                  <CarouselSlide key={t.id} index={index} className="basis-full">
                    <Card className="h-full">
                      <CardContent className="p-6">
                        {typeof t.rating === "number" && t.rating >= 1 && t.rating <= 5 && (() => {
                          const rating = t.rating
                          return (
                          <div className="mb-3 flex items-center gap-1" aria-label={`Bewertung: ${rating} von 5`}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < rating ? "fill-primary text-primary" : "text-muted-foreground/40",
                                )}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                          )
                        })()}

                        <blockquote
                          onClick={(e) => handleInlineEdit(e, `items.${index}.quote`)}
                          className={cn(
                            "text-foreground leading-relaxed",
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                          )}
                          style={(t.quoteColor || quoteColor) ? ({ color: (t.quoteColor || quoteColor) } as React.CSSProperties) : undefined}
                        >
                          <span className="sr-only">Zitat:</span>
                          <span>“{t.quote || "Zitat eingeben…"}”</span>
                        </blockquote>

                        <div className="mt-5">
                          <div
                            onClick={(e) => handleInlineEdit(e, `items.${index}.name`)}
                            className={cn(
                              "font-semibold text-foreground",
                              editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                            )}
                            style={(t.nameColor || nameColor) ? ({ color: (t.nameColor || nameColor) } as React.CSSProperties) : undefined}
                          >
                            {t.name || "Name…"}
                          </div>
                          {typeof t.role !== "undefined" && (
                            <div
                              onClick={(e) => handleInlineEdit(e, `items.${index}.role`)}
                              className={cn(
                                "text-sm text-muted-foreground",
                                editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                              )}
                              style={(t.roleColor || roleColor) ? ({ color: (t.roleColor || roleColor) } as React.CSSProperties) : undefined}
                            >
                              {t.role || "Rolle…"}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselSlide>
                ))}
              </CarouselTrack>
              <div className="mt-6 flex items-center justify-center gap-3">
                <CarouselPrevButton className="h-9 w-9" />
                <CarouselDots />
                <CarouselNextButton className="h-9 w-9" />
              </div>
            </Carousel>
          </div>
        ) : (
          <div className={cn("grid gap-6", columnsMap[resolvedColumns] || columnsMap[3])}>
            {items.map((t, index) => (
              <Card key={t.id} className="h-full">
                <CardContent className="p-6">
                  {typeof t.rating === "number" && t.rating >= 1 && t.rating <= 5 && (() => {
                    const rating = t.rating
                    return (
                    <div className="mb-3 flex items-center gap-1" aria-label={`Bewertung: ${rating} von 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < rating ? "fill-primary text-primary" : "text-muted-foreground/40",
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    )
                  })()}

                  <blockquote
                    onClick={(e) => handleInlineEdit(e, `items.${index}.quote`)}
                    className={cn(
                      "text-foreground leading-relaxed",
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                    )}
                    style={(t.quoteColor || quoteColor) ? ({ color: (t.quoteColor || quoteColor) } as React.CSSProperties) : undefined}
                  >
                    <span className="sr-only">Zitat:</span>
                    <span>“{t.quote || "Zitat eingeben…"}”</span>
                  </blockquote>

                  <div className="mt-5">
                    <div
                      onClick={(e) => handleInlineEdit(e, `items.${index}.name`)}
                      className={cn(
                        "font-semibold text-foreground",
                        editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                      )}
                      style={(t.nameColor || nameColor) ? ({ color: (t.nameColor || nameColor) } as React.CSSProperties) : undefined}
                    >
                      {t.name || "Name…"}
                    </div>
                    {typeof t.role !== "undefined" && (
                      <div
                        onClick={(e) => handleInlineEdit(e, `items.${index}.role`)}
                        className={cn(
                          "text-sm text-muted-foreground",
                          editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                        )}
                        style={(t.roleColor || roleColor) ? ({ color: (t.roleColor || roleColor) } as React.CSSProperties) : undefined}
                      >
                        {t.role || "Rolle…"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

