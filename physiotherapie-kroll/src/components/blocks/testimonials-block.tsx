"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Carousel,
  CarouselDots,
  CarouselNextButton,
  CarouselPrevButton,
  CarouselSlide,
  CarouselTrack,
  useCarousel
} from "@/components/ui/carousel"

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
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
}

const columnsMap: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}

const backgroundMap = {
  none: "",
  muted: "bg-muted/30",
  gradient: "bg-gradient-to-b from-muted/20 to-background",
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
    onEditField(blockId, fieldPath, (e.currentTarget as HTMLElement).getBoundingClientRect())
  }

  // Slider-like dots (primary active) using Carousel context
  const TestimonialsDots = () => {
    // IMPORTANT: make sure this is exported from your carousel file:
    // export function useCarousel() { ... }
    const { itemsCount, index, goTo } = useCarousel()
    if (itemsCount <= 1) return null

    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: itemsCount }).map((_, i) => {
          const active = i === index
          return (
            <button
              key={items[i]?.id ?? i}
              type="button"
              aria-label={`Gehe zu Testimonial ${i + 1}`}
              aria-current={active ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                goTo(i)
              }}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition",
                active ? "bg-primary" : "bg-muted ring-1 ring-black/10 hover:bg-muted/70"
              )}
            />
          )
        })}
      </div>
    )
  }

  return (
    <section className={cn("py-16 px-4", backgroundMap[background])} aria-label={headline || "Testimonials"}>
      <div className="mx-auto max-w-5xl">
        {(headline || subheadline) && (
          <header className="mb-12 text-center">
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className="mb-3 text-sm font-medium tracking-wide text-primary"
                style={subheadlineColor ? { color: subheadlineColor } : undefined}
              >
                {subheadline}
              </p>
            )}

            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl"
                style={headlineColor ? { color: headlineColor } : undefined}
              >
                {headline}
              </h2>
            )}
          </header>
        )}

        {variant === "slider" ? (
          <Carousel itemsCount={items.length} loop draggable pauseOnHover>
            <CarouselTrack className="items-stretch">
              {items.map((t, index) => {
                const rating =
                  Number.isInteger(t.rating) && t.rating! >= 1 && t.rating! <= 5 ? t.rating! : null

                return (
                  <CarouselSlide key={t.id} index={index} className="basis-full">
                    <Card className="h-full rounded-3xl bg-background shadow-xl ring-1 ring-black/5">
                      <CardContent className="p-8 md:p-12">
                        <div className="space-y-7">
                          {rating && (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i < rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                                  )}
                                />
                              ))}
                            </div>
                          )}

                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="text-2xl leading-none">❝</span>
                          </div>

                          <blockquote
                            onClick={(e) => handleInlineEdit(e, `items.${index}.quote`)}
                            className="text-lg leading-relaxed text-foreground/80 md:text-xl"
                            style={t.quoteColor || quoteColor ? { color: t.quoteColor || quoteColor } : undefined}
                          >
                            “{t.quote}”
                          </blockquote>

                          <div className="pt-2">
                            <div
                              onClick={(e) => handleInlineEdit(e, `items.${index}.name`)}
                              className="font-semibold text-foreground"
                              style={t.nameColor || nameColor ? { color: t.nameColor || nameColor } : undefined}
                            >
                              {t.name}
                            </div>

                            {typeof t.role !== "undefined" && (
                              <div
                                onClick={(e) => handleInlineEdit(e, `items.${index}.role`)}
                                className="mt-1 text-sm text-muted-foreground"
                                style={t.roleColor || roleColor ? { color: t.roleColor || roleColor } : undefined}
                              >
                                {t.role}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselSlide>
                )
              })}
            </CarouselTrack>

            {items.length > 1 && (
              <div className="mt-8 flex items-center justify-center gap-6 pb-2 overflow-visible">
                <CarouselPrevButton
                  variant="ghost"
                  size="icon"
                  className="inline-flex h-10 w-10 rounded-full bg-background p-0 shadow-sm ring-1 ring-black/5 hover:bg-muted/50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </CarouselPrevButton>

                <TestimonialsDots />

                <CarouselNextButton
                  variant="ghost"
                  size="icon"
                  className="inline-flex h-10 w-10 rounded-full bg-background p-0 shadow-sm ring-1 ring-black/5 hover:bg-muted/50"
                >
                  <ChevronRight className="h-5 w-5" />
                </CarouselNextButton>
              </div>
            )}
          </Carousel>
        ) : (
          <div className={cn("grid gap-6", columnsMap[columns])}>
            {items.map((t, index) => {
              const rating =
                Number.isInteger(t.rating) && t.rating! >= 1 && t.rating! <= 5 ? t.rating! : null

              return (
                <Card key={t.id} className="rounded-3xl bg-background shadow-md ring-1 ring-black/5">
                  <CardContent className="p-8 space-y-5">
                    {rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-4 w-4",
                              i < rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                            )}
                          />
                        ))}
                      </div>
                    )}

                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-2xl leading-none">❝</span>
                    </div>

                    <blockquote
                      onClick={(e) => handleInlineEdit(e, `items.${index}.quote`)}
                      className="text-foreground/80 leading-relaxed"
                      style={t.quoteColor || quoteColor ? { color: t.quoteColor || quoteColor } : undefined}
                    >
                      “{t.quote}”
                    </blockquote>

                    <div>
                      <div
                        onClick={(e) => handleInlineEdit(e, `items.${index}.name`)}
                        className="font-semibold text-foreground"
                        style={t.nameColor || nameColor ? { color: t.nameColor || nameColor } : undefined}
                      >
                        {t.name}
                      </div>

                      {typeof t.role !== "undefined" && (
                        <div
                          onClick={(e) => handleInlineEdit(e, `items.${index}.role`)}
                          className="text-sm text-muted-foreground"
                          style={t.roleColor || roleColor ? { color: t.roleColor || roleColor } : undefined}
                        >
                          {t.role}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
