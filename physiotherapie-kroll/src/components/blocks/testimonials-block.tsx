"use client"

import * as React from "react"
import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselPrevButton,
  CarouselNextButton,
  useCarousel,
} from "@/components/ui/carousel"
import type { MediaValue } from "@/types/cms"
import { resolveMediaClient } from "@/lib/cms/resolveMediaClient"

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
    avatar?: MediaValue
    /** Avatar gradient preset: "auto" | "g1"..."g10" (default: "auto") */
    avatarGradient?: "auto" | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8" | "g9" | "g10"
  }>
  columns?: 1 | 2 | 3 | 4
  variant?: "grid" | "slider"
  background?: "none" | "muted" | "gradient"
  autoplay?: boolean
  interval?: number
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  elements?: Record<string, unknown>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const columnsMap: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

/** Central avatar gradient mapping (10 predefined + auto fallback) */
export const AVATAR_GRADIENTS = {
  auto: "from-primary/80 to-primary/50", // Fallback/default
  g1: "from-primary/80 to-primary/50",
  g2: "from-accent/80 to-accent/50",
  g3: "from-chart-1/80 to-chart-1/50",
  g4: "from-chart-2/80 to-chart-2/50",
  g5: "from-chart-3/80 to-chart-3/50",
  g6: "from-blue-500/80 to-blue-400/50",
  g7: "from-purple-500/80 to-purple-400/50",
  g8: "from-green-500/80 to-green-400/50",
  g9: "from-rose-500/80 to-rose-400/50",
  g10: "from-amber-500/80 to-amber-400/50",
} as const

export type AvatarGradientKey = keyof typeof AVATAR_GRADIENTS

/** Fallback palette for backwards compatibility (legacy items without avatarGradient) */
const avatarPalette = [
  "from-primary/80 to-primary/50",
  "from-accent/80 to-accent/50",
  "from-chart-1/80 to-chart-1/50",
  "from-chart-2/80 to-chart-2/50",
  "from-chart-3/80 to-chart-3/50",
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

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
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  )
}

function Avatar({ name, avatar, gradient }: { name: string; avatar?: MediaValue; gradient?: AvatarGradientKey }) {
  const initials = getInitials(name)
  const url = resolveMediaClient(avatar)

  // Priority: 1. Image, 2. Selected gradient from mapping, 3. Auto/fallback
  if (url) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-border/60 ring-offset-2 ring-offset-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="h-full w-full object-cover" />
      </div>
    )
  }

  // Resolve gradient from mapping
  const gradientClass = gradient && gradient in AVATAR_GRADIENTS 
    ? AVATAR_GRADIENTS[gradient]
    : AVATAR_GRADIENTS.auto

  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br font-semibold text-primary-foreground ring-2 ring-border/60 ring-offset-2 ring-offset-background",
        gradientClass
      )}
    >
      <span className="text-sm">{initials}</span>
    </div>
  )
}

/** Dots via your carousel context */
function SliderDots({ items }: { items: TestimonialsBlockProps["items"] }) {
  const { itemsCount, index, goTo } = useCarousel()
  if (itemsCount <= 1) return null

  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length: itemsCount }).map((_, i) => (
        <button
          key={items[i]?.id ?? i}
          type="button"
          aria-label={`Gehe zu Testimonial ${i + 1}`}
          aria-current={i === index ? "true" : undefined}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            goTo(i)
          }}
          className={cn(
            "rounded-full transition-all duration-300",
            i === index
              ? "h-3 w-8 bg-primary shadow-[0_0_12px_rgba(var(--primary),0.4)]"
              : "h-3 w-3 bg-muted-foreground/20 hover:bg-muted-foreground/40"
          )}
        />
      ))}
    </div>
  )
}

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
    Number.isInteger(item.rating) && item.rating! >= 1 && item.rating! <= 5 ? item.rating! : null

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]",
        !isSlider && [
          "transition-all duration-500 ease-out",
          "hover:-translate-y-2 hover:border-primary/30",
          "hover:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_20px_48px_-12px_rgba(0,0,0,0.15)]",
        ],
        isSlider && "border-border/40"
      )}
    >
      <div className="h-1 w-full bg-linear-to-r from-primary/60 via-primary/30 to-transparent" />

      <CardContent className={cn("flex flex-1 flex-col", isSlider ? "p-8 md:p-10 lg:p-12" : "p-7")}>
        <div className="mb-5 flex items-start justify-between">
          <Quote className={cn("h-10 w-10 -scale-x-100 text-primary/15", isSlider && "h-12 w-12")} strokeWidth={1.5} />
          {rating && <RatingStars rating={rating} />}
        </div>

        <blockquote
          onClick={(e) => onInlineEdit(e, `items.${index}.quote`)}
          className={cn(
            "flex-1 text-pretty leading-relaxed text-card-foreground/85",
            isSlider ? "text-lg leading-8 md:text-xl md:leading-9" : "text-base leading-7"
          )}
          style={item.quoteColor || quoteColor ? { color: item.quoteColor || quoteColor } : undefined}
        >
          {item.quote}
        </blockquote>

        <div className="my-6 h-px bg-linear-to-r from-border via-border/50 to-transparent" />

        <footer className="flex items-center gap-4">
          <Avatar name={item.name} avatar={item.avatar} gradient={item.avatarGradient} />
          <div className="min-w-0">
            <div
              onClick={(e) => onInlineEdit(e, `items.${index}.name`)}
              className="truncate font-semibold tracking-tight text-card-foreground"
              style={item.nameColor || nameColor ? { color: item.nameColor || nameColor } : undefined}
            >
              {item.name}
            </div>

            {item.role && (
              <div
                onClick={(e) => onInlineEdit(e, `items.${index}.role`)}
                className="truncate text-sm text-muted-foreground"
                style={item.roleColor || roleColor ? { color: item.roleColor || roleColor } : undefined}
              >
                {item.role}
              </div>
            )}
          </div>
        </footer>
      </CardContent>
    </Card>
  )
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
  autoplay = false,
  interval = 6000,
  editable = false,
  blockId,
  onEditField,
}: TestimonialsBlockProps) {
  const handleInlineEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable || !blockId || !onEditField) return
      e.preventDefault()
      e.stopPropagation()
      onEditField(blockId, fieldPath, (e.currentTarget as HTMLElement).getBoundingClientRect())
    },
    [editable, blockId, onEditField]
  )

  return (
    <section
      className={cn(
        "relative overflow-hidden py-20 md:py-28",
        background === "none" && "bg-background",
        background === "muted" && "bg-muted/30",
        background === "gradient" && "bg-muted/20"
      )}
      aria-label={headline || "Testimonials"}
    >
      {background === "gradient" && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-3xl" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {(headline || subheadline) && (
          <header className="mb-16 text-center">
            {subheadline && (
              <div className="mb-5 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-linear-to-r from-transparent to-primary/40" />
                <span
                  onClick={(e) => handleInlineEdit(e, "subheadline")}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                  style={subheadlineColor ? { color: subheadlineColor } : undefined}
                >
                  {subheadline}
                </span>
                <div className="h-px w-12 bg-linear-to-l from-transparent to-primary/40" />
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

        {variant === "slider" ? (
          <Carousel itemsCount={items.length} loop draggable pauseOnHover autoplay={autoplay && items.length > 1} autoplayDelayMs={Math.max(1500, Number(interval) || 6000)}>
            <CarouselTrack className="-ml-6 items-stretch">
              {items.map((t, i) => (
                <CarouselSlide key={t.id} index={i} className="basis-full pl-6 md:basis-4/5 lg:basis-3/5">
                  <TestimonialCard
                    item={t}
                    index={i}
                    isSlider
                    quoteColor={quoteColor}
                    nameColor={nameColor}
                    roleColor={roleColor}
                    onInlineEdit={handleInlineEdit}
                  />
                </CarouselSlide>
              ))}
            </CarouselTrack>

            {items.length > 1 && (
              <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
                <CarouselPrevButton
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
                  aria-label="Vorheriges Testimonial"
                >
                  <ChevronLeft className="h-5 w-5" />
                </CarouselPrevButton>

                <SliderDots items={items} />

                <CarouselNextButton
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
                  aria-label="Nächstes Testimonial"
                >
                  <ChevronRight className="h-5 w-5" />
                </CarouselNextButton>
              </div>
            )}
          </Carousel>
        ) : (
          <div className={cn("grid gap-6 lg:gap-8", columnsMap[columns])}>
            {items.map((t, i) => (
              <TestimonialCard
                key={t.id}
                item={t}
                index={i}
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
