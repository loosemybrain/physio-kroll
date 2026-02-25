"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ArrowRight, ChevronLeft, ChevronRight, Circle, Activity, Heart, Brain, Bone, Dumbbell, Stethoscope, Zap, Shield, Users, Clock, Star, Award, Target, TrendingUp, HandHeart, Sparkles, Flame, Wind, Waves, Footprints } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ServiceCard {
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
}

export interface ServicesGridBlockProps {
  section?: unknown
  typography?: unknown
  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string
  columns?: 2 | 3 | 4
  cards: ServiceCard[]
  background?: "none" | "muted" | "gradient"
  variant?: "grid" | "slider"
  autoplay?: boolean
  interval?: number
  sliderAlign?: "center" | "left"
  showControls?: boolean
  iconColor?: string
  iconBgColor?: string
  titleColor?: string
  textColor?: string
  ctaColor?: string
  cardBgColor?: string
  cardBorderColor?: string
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const columnsMap: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  Heart,
  Brain,
  Bone,
  Dumbbell,
  Stethoscope,
  Zap,
  Shield,
  Users,
  Clock,
  Star,
  Award,
  Target,
  TrendingUp,
  HandHeart,
  Sparkles,
  Flame,
  Wind,
  Waves,
  Footprints,
  Circle,
  ArrowRight,
}

function getIconComponent(iconName: string) {
  return iconMap[iconName] || Circle
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
          aria-label={`Gehe zu Service ${i + 1}`}
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
        aria-label="Vorheriger Service"
        className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <SliderDots count={count} />
      <Button
        variant="outline"
        size="icon"
        onClick={scrollNext}
        aria-label="Nächster Service"
        className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Service card                                                       */
/* ------------------------------------------------------------------ */

function ServiceCardItem({
  card,
  index,
  isSlider,
  globalIconColor,
  globalIconBgColor,
  globalTitleColor,
  globalTextColor,
  globalCtaColor,
  globalCardBgColor,
  globalCardBorderColor,
  editable,
  blockId,
  onEditField,
  onElementClick,
  selectedElementId,
}: {
  card: ServiceCard
  index: number
  isSlider: boolean
  globalIconColor?: string
  globalIconBgColor?: string
  globalTitleColor?: string
  globalTextColor?: string
  globalCtaColor?: string
  globalCardBgColor?: string
  globalCardBorderColor?: string
  editable?: boolean
  blockId?: string
  onEditField?: ServicesGridBlockProps["onEditField"]
  onElementClick?: ServicesGridBlockProps["onElementClick"]
  selectedElementId?: string | null
}) {
  const IconComponent = getIconComponent(card.icon)
  const elementId = `card:${index}`

  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    onEditField(
      blockId,
      fieldPath,
      (e.currentTarget as HTMLElement).getBoundingClientRect(),
    )
  }

  const handleElementClick = (e: React.MouseEvent) => {
    if (!onElementClick || !blockId) return
    e.stopPropagation()
    onElementClick(blockId, elementId)
  }

  const resolvedBg = card.cardBgColor || globalCardBgColor
  const resolvedBorder = card.cardBorderColor || globalCardBorderColor
  const resolvedIconColor = card.iconColor || globalIconColor
  const resolvedIconBg = card.iconBgColor || globalIconBgColor
  const resolvedTitleColor = card.titleColor || globalTitleColor
  const resolvedTextColor = card.textColor || globalTextColor
  const resolvedCtaColor = card.ctaColor || globalCtaColor
  const isSelected = selectedElementId === elementId

  return (
    <article
      onClick={onElementClick ? handleElementClick : undefined}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm",
        // Premium layered shadow
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_-16px_rgba(0,0,0,0.12)]",
        // Hover
        !isSlider && [
          "transition-all duration-500 ease-out",
          "hover:border-primary/25 hover:bg-card",
          "hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_56px_-12px_rgba(0,0,0,0.16)]",
          "hover:-translate-y-1",
        ],
        // Border
        resolvedBorder ? "" : "border-border/40",
        // Selection ring
        isSelected && "ring-2 ring-primary/60",
        // Clickable in editor
        onElementClick && "cursor-pointer",
      )}
      style={{
        backgroundColor: resolvedBg || undefined,
        borderColor: resolvedBorder || undefined,
      }}
    >
      {/* Top accent gradient */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/50 via-accent/30 to-transparent" />

      {/* Hover spotlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, oklch(0.48 0.14 220 / 0.06), transparent 55%)",
        }}
        aria-hidden="true"
      />

      {/* Card body */}
      <div className={cn("relative flex flex-1 flex-col", isSlider ? "p-8 md:p-10" : "p-7")}>
        {/* Icon */}
        <div
          className={cn(
            "mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-primary/10",
            !resolvedIconBg && "bg-primary/[0.08]",
          )}
          style={{
            backgroundColor: resolvedIconBg || undefined,
          }}
        >
          <IconComponent
            className={cn("h-7 w-7", !resolvedIconColor && "text-primary")}
            style={{
              color: resolvedIconColor || undefined,
            }}
          />
        </div>

        {/* Title */}
        <h3
          onClick={(e) => handleInlineEdit(e, `cards.${index}.title`)}
          className={cn(
            "mb-3 text-lg font-semibold tracking-tight text-card-foreground",
            editable &&
              blockId &&
              onEditField &&
              "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
          )}
          style={{ color: resolvedTitleColor || undefined }}
        >
          {card.title}
        </h3>

        {/* Text */}
        <p
          onClick={(e) => handleInlineEdit(e, `cards.${index}.text`)}
          className={cn(
            "flex-1 text-pretty text-base leading-relaxed text-muted-foreground",
            editable &&
              blockId &&
              onEditField &&
              "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
          )}
          style={{ color: resolvedTextColor || undefined }}
        >
          {card.text}
        </p>

        {/* CTA */}
        {card.ctaText && card.ctaHref && (
          <div className="mt-6 border-t border-border/40 pt-5">
            {editable && blockId && onEditField ? (
              <button
                type="button"
                onClick={(e) => handleInlineEdit(e, `cards.${index}.ctaText`)}
                className="group/cta inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 rounded px-1 cursor-pointer"
                style={{ color: resolvedCtaColor || undefined }}
              >
                {card.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
              </button>
            ) : (
              <a
                href={card.ctaHref}
                className="group/cta inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                style={{ color: resolvedCtaColor || undefined }}
              >
                {card.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ServicesGridBlock({
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  columns = 3,
  cards,
  background = "none",
  variant = "grid",
  autoplay = false,
  interval = 6000,
  sliderAlign = "center",
  showControls = true,
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
  onElementClick,
  selectedElementId,
}: ServicesGridBlockProps) {
  const clampedInterval = Math.max(1500, interval)

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

  const cardProps = {
    globalIconColor: iconColor,
    globalIconBgColor: iconBgColor,
    globalTitleColor: titleColor,
    globalTextColor: textColor,
    globalCtaColor: ctaColor,
    globalCardBgColor: cardBgColor,
    globalCardBorderColor: cardBorderColor,
    editable,
    blockId,
    onEditField,
    onElementClick,
    selectedElementId,
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden py-20 md:py-28",
        background === "none" && "bg-background",
        background === "muted" && "bg-muted/10",
        background === "gradient" &&
          "bg-gradient-to-br from-primary/5 via-background to-background",
      )}
      aria-label={headline || "Services"}
    >
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-primary/[0.025] blur-3xl" />
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
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.2em] text-primary",
                    editable &&
                      blockId &&
                      onEditField &&
                      "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
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
                className={cn(
                  "mx-auto max-w-3xl text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
                  editable &&
                    blockId &&
                    onEditField &&
                    "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={headlineColor ? { color: headlineColor } : undefined}
              >
                {headline}
              </h2>
            )}
          </header>
        )}

        {/* ---- Slider variant ---- */}
        {variant === "slider" ? (
          <Carousel
            opts={{
              loop: true,
              align: sliderAlign === "left" ? "start" : "center",
            }}
          >
            <CarouselContent className="-ml-6 items-stretch">
              {cards.map((card, index) => (
                <CarouselItem
                  key={card.id}
                  className="basis-full pl-6 md:basis-1/2 lg:basis-1/3"
                >
                  <ServiceCardItem
                    card={card}
                    index={index}
                    isSlider
                    {...cardProps}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {showControls && cards.length > 1 && (
              <SliderNav count={cards.length} />
            )}
          </Carousel>
        ) : (
          /* ---- Grid variant ---- */
          <div className={cn("grid gap-6 lg:gap-8", columnsMap[columns])}>
            {cards.map((card, index) => (
              <ServiceCardItem
                key={card.id}
                card={card}
                index={index}
                isSlider={false}
                {...cardProps}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
