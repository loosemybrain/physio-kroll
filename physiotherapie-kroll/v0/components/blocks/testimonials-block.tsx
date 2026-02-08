"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

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
    avatar?: string
  }>
  columns?: 1 | 2 | 3 | 4
  variant?: "grid" | "slider"
  background?: "none" | "muted" | "gradient"
  editable?: boolean
  blockId?: string
  onEditField?: (
    blockId: string,
    fieldPath: string,
    anchorRect?: DOMRect,
  ) => void
  elements?: Record<string, unknown>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

/* ------------------------------------------------------------------ */
/*  Palette: derive initials color from name hash                      */
/* ------------------------------------------------------------------ */

const avatarPalette = [
  "from-primary/80 to-primary/50",
  "from-accent/80 to-accent/50",
  "from-chart-1/80 to-chart-1/50",
  "from-chart-2/80 to-chart-2/50",
  "from-chart-3/80 to-chart-3/50",
]

function hashName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* ------------------------------------------------------------------ */
/*  Mappings                                                           */
/* ------------------------------------------------------------------ */

const columnsMap: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

/* ------------------------------------------------------------------ */
/*  Slider controls                                                    */
/* ------------------------------------------------------------------ */

function SliderDots({ count }: { count: number }) {
  const { api } = useCarousel()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    setSelected(api.selectedScrollSnap())
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  if (count <= 1) return null

  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Gehe zu Testimonial ${i + 1}`}
          aria-current={i === selected ? "true" : undefined}
          onClick={() => api?.scrollTo(i)}
          className={cn(
            "rounded-full transition-all duration-300",
            i === selected
              ? "h-3 w-8 bg-primary shadow-[0_0_12px_rgba(var(--primary),0.4)]"
              : "h-3 w-3 bg-muted-foreground/20 hover:bg-muted-foreground/40",
          )}
        />
      ))}
    </div>
  )
}

function SliderNav({ count }: { count: number }) {
  const { scrollPrev, scrollNext } = useCarousel()

  return (
    <div className="mt-10 flex items-center justify-center gap-8">
      <Button
        variant="outline"
        size="icon"
        onClick={scrollPrev}
        aria-label="Vorheriges Testimonial"
        className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <SliderDots count={count} />

      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        aria-label="Nächstes Testimonial"
        className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Rating stars                                                       */
/* ------------------------------------------------------------------ */

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-5 w-5 transition-colors",
            i < rating
              ? "fill-primary text-primary drop-shadow-[0_0_6px_rgba(var(--primary),0.35)]"
              : "fill-muted text-muted",
          )}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  const idx = hashName(name) % avatarPalette.length
  const initials = getInitials(name)

  if (avatar) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-border/60 ring-offset-2 ring-offset-background">
        <img src={avatar || "/placeholder.svg"} alt={name} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-primary-foreground ring-2 ring-border/60 ring-offset-2 ring-offset-background",
        avatarPalette[idx],
      )}
    >
      <span className="text-sm">{initials}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Testimonial card                                                   */
/* ------------------------------------------------------------------ */

function TestimonialCard({
  item,
  index,
  isSlider,
  quoteColor,
  nameColor,
  roleColor,
  onInlineEdit,
}: {
  item: TestimonialsBlockProps["items"][number]
  index: number
  isSlider: boolean
  quoteColor?: string
  nameColor?: string
  roleColor?: string
  onInlineEdit: (e: React.MouseEvent, fieldPath: string) => void
}) {
  const rating =
    Number.isInteger(item.rating) && item.rating! >= 1 && item.rating! <= 5
      ? item.rating!
      : null

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card",
        // Layered shadow for depth
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]",
        // Hover effects for grid cards
        !isSlider && [
          "transition-all duration-500 ease-out",
          "hover:-translate-y-2 hover:border-primary/30",
          "hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(0,0,0,0.15)]",
        ],
        // Slider cards get more padding
        isSlider && "border-border/40",
      )}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />

      <div className={cn("flex flex-1 flex-col", isSlider ? "p-8 md:p-10 lg:p-12" : "p-7")}>
        {/* Large decorative quote */}
        <div className="mb-5 flex items-start justify-between">
          <Quote
            className={cn(
              "h-10 w-10 -scale-x-100 text-primary/15",
              isSlider && "h-12 w-12",
            )}
            strokeWidth={1.5}
          />
          {rating && <RatingStars rating={rating} />}
        </div>

        {/* Quote text */}
        <blockquote
          onClick={(e) => onInlineEdit(e, `items.${index}.quote`)}
          className={cn(
            "flex-1 text-pretty leading-relaxed text-card-foreground/85",
            isSlider
              ? "text-lg leading-8 md:text-xl md:leading-9"
              : "text-base leading-7",
          )}
          style={
            item.quoteColor || quoteColor
              ? { color: item.quoteColor || quoteColor }
              : undefined
          }
        >
          {item.quote}
        </blockquote>

        {/* Divider */}
        <div className="my-6 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />

        {/* Author */}
        <footer className="flex items-center gap-4">
          <Avatar name={item.name} avatar={item.avatar} />

          <div className="min-w-0">
            <div
              onClick={(e) => onInlineEdit(e, `items.${index}.name`)}
              className="truncate font-semibold tracking-tight text-card-foreground"
              style={
                item.nameColor || nameColor
                  ? { color: item.nameColor || nameColor }
                  : undefined
              }
            >
              {item.name}
            </div>

            {item.role && (
              <div
                onClick={(e) => onInlineEdit(e, `items.${index}.role`)}
                className="truncate text-sm text-muted-foreground"
                style={
                  item.roleColor || roleColor
                    ? { color: item.roleColor || roleColor }
                    : undefined
                }
              >
                {item.role}
              </div>
            )}
          </div>
        </footer>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

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
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable || !blockId || !onEditField) return
      e.preventDefault()
      e.stopPropagation()
      onEditField(
        blockId,
        fieldPath,
        (e.currentTarget as HTMLElement).getBoundingClientRect(),
      )
    },
    [editable, blockId, onEditField],
  )

  return (
    <section
      className={cn(
        "relative overflow-hidden py-20 md:py-28",
        background === "none" && "bg-background",
        background === "muted" && "bg-muted/30",
        background === "gradient" && "bg-muted/20",
      )}
      aria-label={headline || "Testimonials"}
    >
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Large radial glow */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
        {/* Bottom right accent */}
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/[0.03] blur-3xl" />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* ---- Header ---- */}
        {(headline || subheadline) && (
          <header className="mb-16 text-center">
            {subheadline && (
              <div className="mb-5 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
                <span
                  onClick={(e) => handleInlineEdit(e, "subheadline")}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                  style={
                    subheadlineColor ? { color: subheadlineColor } : undefined
                  }
                >
                  {subheadline}
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
              </div>
            )}

            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
                style={headlineColor ? { color: headlineColor } : undefined}
              >
                {headline}
              </h2>
            )}
          </header>
        )}

        {/* ---- Slider variant ---- */}
        {variant === "slider" ? (
          <Carousel opts={{ loop: true, align: "center" }}>
            <CarouselContent className="-ml-6 items-stretch">
              {items.map((t, index) => (
                <CarouselItem key={t.id} className="basis-full pl-6 md:basis-4/5 lg:basis-3/5">
                  <TestimonialCard
                    item={t}
                    index={index}
                    isSlider
                    quoteColor={quoteColor}
                    nameColor={nameColor}
                    roleColor={roleColor}
                    onInlineEdit={handleInlineEdit}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {items.length > 1 && <SliderNav count={items.length} />}
          </Carousel>
        ) : (
          /* ---- Grid variant ---- */
          <div className={cn("grid gap-6 lg:gap-8", columnsMap[columns])}>
            {items.map((t, index) => (
              <TestimonialCard
                key={t.id}
                item={t}
                index={index}
                isSlider={false}
                quoteColor={quoteColor}
                nameColor={nameColor}
                roleColor={roleColor}
                onInlineEdit={handleInlineEdit}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
