"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselDots,
  CarouselNextButton,
  CarouselPrevButton,
  CarouselSlide,
  CarouselTrack,
  useCarousel,
} from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReducedMotion } from "framer-motion"
import type { ElementShadow } from "@/types/cms"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface SlideItem {
  id: string
  url: string
  alt: string
  title?: string
  text?: string
  link?: string
  focalPoint?: { x: number; y: number }
  titleColor?: string
  textColor?: string
  cardBgColor?: string
  cardBorderColor?: string
}

export interface ImageSliderBlockProps {
  section?: unknown
  typography?: unknown

  blockId?: string
  eyebrow?: string
  headline?: string
  subheadline?: string
  eyebrowColor?: string
  headlineColor?: string
  subheadlineColor?: string

  slides: SlideItem[]

  variant?: "classic" | "progress" | "thumbnails" | "hero" | "cards"
  aspect?: "video" | "square" | "portrait" | "auto"
  slidesPerView?: { base?: number; md?: number; lg?: number }

  controls?: {
    showArrows?: boolean
    showDots?: boolean
    showProgress?: boolean
    showThumbnails?: boolean
  }

  loop?: boolean
  autoplay?: boolean
  autoplayDelayMs?: number
  pauseOnHover?: boolean
  peek?: boolean

  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  background?: "none" | "muted" | "gradient"

  containerBackgroundMode?: "transparent" | "color" | "gradient"
  containerBackgroundColor?: string
  containerBackgroundGradientPreset?: "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none"
  containerGradientFrom?: string
  containerGradientVia?: string
  containerGradientTo?: string
  containerGradientAngle?: number
  containerShadow?: ElementShadow
  containerBorder?: boolean

  ariaLabel?: string

  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, unknown>
}

/* ================================================================ */
/*  Aspect & Background Maps                                        */
/* ================================================================ */

const aspectMap: Record<NonNullable<ImageSliderBlockProps["aspect"]>, string> = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  auto: "",
}

const backgroundMap: Record<NonNullable<ImageSliderBlockProps["background"]>, string> = {
  none: "",
  muted: "bg-muted/50",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

/* ================================================================ */
/*  Slide Image Component                                           */
/* ================================================================ */

function SlideImage({
  slide,
  aspect,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  variant,
}: {
  slide: SlideItem
  aspect: string
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  variant: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card",
        variant === "hero" && "rounded-none border-none",
        variant === "progress" && "rounded-lg"
      )}
      style={{
        backgroundColor: slide.cardBgColor || cardBgColor || undefined,
        borderColor: slide.cardBorderColor || cardBorderColor || undefined,
      }}
    >
      <div className={cn("relative w-full overflow-hidden bg-muted", aspect || "aspect-video")}>
        <Image
          src={slide.url}
          alt={slide.alt || ""}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw"
          priority={false}
        />
      </div>

      {(slide.title || slide.text) && variant !== "hero" && (
        <div className="px-5 py-4">
          {slide.title && (
            <div
              className="text-base font-semibold text-foreground"
              style={{ color: slide.titleColor || slideTitleColor || undefined }}
            >
              {slide.title}
            </div>
          )}
          {slide.text && (
            <div
              className="mt-1 text-sm text-muted-foreground"
              style={{ color: slide.textColor || slideTextColor || undefined }}
            >
              {slide.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ================================================================ */
/*  Variant: Classic (Arrows + Dots)                                */
/* ================================================================ */

function ClassicVariant({
  slides,
  aspect,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  controls,
  loop,
  autoplay,
  autoplayDelayMs,
  pauseOnHover,
  peek,
  ariaLabel,
  headline,
}: {
  slides: SlideItem[]
  aspect: string
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  controls?: ImageSliderBlockProps["controls"]
  loop: boolean
  autoplay: boolean
  autoplayDelayMs: number
  pauseOnHover: boolean
  peek: boolean
  ariaLabel?: string
  headline?: string
}) {
  return (
    <Carousel
      itemsCount={slides.length}
      loop={loop}
      autoplay={autoplay}
      autoplayDelayMs={autoplayDelayMs}
      pauseOnHover={pauseOnHover}
      peek={peek}
      ariaLabel={ariaLabel || headline || "Bild-Slider"}
      draggable
    >
      <CarouselTrack className="items-stretch">
        {slides.map((slide, index) => (
          <CarouselSlide key={slide.id} index={index}>
            <SlideImage
              slide={slide}
              aspect={aspect}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              variant="classic"
            />
          </CarouselSlide>
        ))}
      </CarouselTrack>

      {slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>

          {controls?.showDots !== false && <CarouselDots className="gap-2" />}

          {controls?.showArrows !== false && (
            <CarouselNextButton
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
            aria-label="Nächstes Testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </CarouselNextButton>
          )}
        </div>
      )}
    </Carousel>
  )
}

/* ================================================================ */
/*  Variant: Progress (Progressbar + Counter)                       */
/* ================================================================ */

function ProgressVariant({
  slides,
  aspect,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  controls,
  loop,
  autoplay,
  autoplayDelayMs,
  pauseOnHover,
  peek,
  ariaLabel,
  headline,
}: {
  slides: SlideItem[]
  aspect: string
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  controls?: ImageSliderBlockProps["controls"]
  loop: boolean
  autoplay: boolean
  autoplayDelayMs: number
  pauseOnHover: boolean
  peek: boolean
  ariaLabel?: string
  headline?: string
}) {
  return (
    <Carousel
      itemsCount={slides.length}
      loop={loop}
      autoplay={autoplay}
      autoplayDelayMs={autoplayDelayMs}
      pauseOnHover={pauseOnHover}
      peek={peek}
      ariaLabel={ariaLabel || headline || "Bild-Slider"}
      draggable
    >
      <CarouselTrack className="items-stretch">
        {slides.map((slide, index) => (
          <CarouselSlide key={slide.id} index={index}>
            <SlideImage
              slide={slide}
              aspect={aspect}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              variant="progress"
            />
          </CarouselSlide>
        ))}
      </CarouselTrack>

      <ProgressBar />

      {controls?.showArrows !== false && slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>
          {controls?.showProgress !== false && <SlideCounter />}
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
  )
}

function ProgressBar() {
  const { index, itemsCount } = useCarousel()
  const progress = itemsCount > 0 ? ((index + 1) / itemsCount) * 100 : 0

  return (
    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  )
}

function SlideCounter() {
  const { index, itemsCount } = useCarousel()
  return (
    <div className="text-sm font-medium text-muted-foreground">
      {Math.min(index + 1, Math.max(1, itemsCount))} / {Math.max(1, itemsCount)}
    </div>
  )
}

/* ================================================================ */
/*  Variant: Thumbnails (Thumbnail Strip + Buttons)                 */
/* ================================================================ */

function ThumbnailsVariant({
  slides,
  aspect,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  controls,
  loop,
  autoplay,
  autoplayDelayMs,
  pauseOnHover,
  peek,
  ariaLabel,
  headline,
}: {
  slides: SlideItem[]
  aspect: string
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  controls?: ImageSliderBlockProps["controls"]
  loop: boolean
  autoplay: boolean
  autoplayDelayMs: number
  pauseOnHover: boolean
  peek: boolean
  ariaLabel?: string
  headline?: string
}) {
  return (
    <Carousel
      itemsCount={slides.length}
      loop={loop}
      autoplay={autoplay}
      autoplayDelayMs={autoplayDelayMs}
      pauseOnHover={pauseOnHover}
      peek={peek}
      ariaLabel={ariaLabel || headline || "Bild-Slider"}
      draggable
    >
      <CarouselTrack className="items-stretch">
        {slides.map((slide, index) => (
          <CarouselSlide key={slide.id} index={index}>
            <SlideImage
              slide={slide}
              aspect={aspect}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              variant="thumbnails"
            />
          </CarouselSlide>
        ))}
      </CarouselTrack>

      <ThumbnailStrip slides={slides} />

      {controls?.showArrows !== false && slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>
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
  )
}

function ThumbnailStrip({ slides }: { slides: SlideItem[] }) {
  const { index, goTo } = useCarousel()
  const thumbRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!thumbRef.current) return
    const activeThumb = thumbRef.current.querySelector('[aria-current="true"]')
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [index])

  return (
    <div className="mt-4 overflow-x-auto">
      <div ref={thumbRef} className="flex gap-2 pb-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Gehe zu Slide ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all",
              i === index ? "border-primary" : "border-border hover:border-muted-foreground/50"
            )}
          >
            <Image
              src={slide.url}
              alt={slide.alt || ""}
              fill
              className="object-cover"
              sizes="96px"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ================================================================ */
/*  Variant: Hero (Overlay Text + Gradient + CTA)                   */
/* ================================================================ */

function HeroVariant({
  slides,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  controls,
  loop,
  autoplay,
  autoplayDelayMs,
  pauseOnHover,
  peek,
  ariaLabel,
  headline,
}: {
  slides: SlideItem[]
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  controls?: ImageSliderBlockProps["controls"]
  loop: boolean
  autoplay: boolean
  autoplayDelayMs: number
  pauseOnHover: boolean
  peek: boolean
  ariaLabel?: string
  headline?: string
}) {
  return (
    <Carousel
      itemsCount={slides.length}
      loop={loop}
      autoplay={autoplay}
      autoplayDelayMs={autoplayDelayMs}
      pauseOnHover={pauseOnHover}
      peek={peek}
      ariaLabel={ariaLabel || headline || "Bild-Slider"}
      draggable
    >
      <CarouselTrack className="items-stretch">
        {slides.map((slide, index) => (
          <CarouselSlide key={slide.id} index={index}>
            <div className="group relative w-full overflow-hidden rounded-2xl aspect-video">
              <Image
                src={slide.url}
                alt={slide.alt || ""}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 90vw"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-linear-to-t from-foreground/80 via-transparent to-transparent" />

              {/* Overlay Content */}
              {(slide.title || slide.text || slide.link) && (
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                  {slide.title && (
                    <h3
                      className="text-2xl sm:text-3xl font-bold text-card mb-2"
                      style={{ color: slide.titleColor || slideTitleColor || undefined }}
                    >
                      {slide.title}
                    </h3>
                  )}
                  {slide.text && (
                    <p
                      className="text-sm sm:text-base text-card/90 mb-4 max-w-lg"
                      style={{ color: slide.textColor || slideTextColor || undefined }}
                    >
                      {slide.text}
                    </p>
                  )}
                  {slide.link && (
                    <Link
                      href={slide.link}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors w-fit"
                    >
                      Erfahren Sie mehr
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </CarouselSlide>
        ))}
      </CarouselTrack>

      {controls?.showArrows !== false && slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-border/80 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>
          {controls?.showDots !== false && <CarouselDots />}
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
  )
}

/* ================================================================ */
/*  Variant: Cards (Multi-view)                                     */
/* ================================================================ */

function CardsVariant({
  slides,
  aspect,
  slidesPerView,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  controls,
  loop,
  autoplay,
  autoplayDelayMs,
  pauseOnHover,
  peek,
  ariaLabel,
  headline,
}: {
  slides: SlideItem[]
  aspect: string
  slidesPerView?: ImageSliderBlockProps["slidesPerView"]
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  controls?: ImageSliderBlockProps["controls"]
  loop: boolean
  autoplay: boolean
  autoplayDelayMs: number
  pauseOnHover: boolean
  peek: boolean
  ariaLabel?: string
  headline?: string
}) {
  const base = slidesPerView?.base ?? 1
  const md = slidesPerView?.md ?? 2
  const lg = slidesPerView?.lg ?? 3

  const gridClass = cn(
    base === 1 && "grid-cols-1",
    base === 2 && "grid-cols-2",
    base === 3 && "grid-cols-3",
    md === 1 && "md:grid-cols-1",
    md === 2 && "md:grid-cols-2",
    md === 3 && "md:grid-cols-3",
    lg === 1 && "lg:grid-cols-1",
    lg === 2 && "lg:grid-cols-2",
    lg === 3 && "lg:grid-cols-3"
  )

  return (
    <div className={cn("grid gap-4 sm:gap-6", gridClass)}>
      {slides.map((slide) => (
        <div key={slide.id}>
          <SlideImage
            slide={slide}
            aspect={aspect}
            cardBgColor={cardBgColor}
            cardBorderColor={cardBorderColor}
            slideTitleColor={slideTitleColor}
            slideTextColor={slideTextColor}
            variant="cards"
          />
        </div>
      ))}
    </div>
  )
}

/* ================================================================ */
/*  Main Component                                                   */
/* ================================================================ */

export function ImageSliderBlock({
  section,
  typography,
  blockId,
  eyebrow,
  headline,
  subheadline,
  eyebrowColor,
  headlineColor,
  subheadlineColor,
  slides,
  variant = "classic",
  aspect = "video",
  slidesPerView,
  controls,
  loop = true,
  autoplay = false,
  autoplayDelayMs = 5000,
  pauseOnHover = true,
  peek = true,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  background = "none",
  containerBackgroundMode,
  containerBackgroundColor,
  containerBackgroundGradientPreset,
  containerShadow,
  containerBorder,
  ariaLabel,
  editable,
  onEditField,
  onElementClick,
  selectedElementId,
  elements,
}: ImageSliderBlockProps) {
  if (!slides || slides.length === 0) return null

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

  const aspectClass = aspectMap[aspect] || ""
  
  // Resolve container background styles
  let containerStyle: React.CSSProperties = {}
  if (containerBackgroundMode === "color" && containerBackgroundColor) {
    containerStyle.backgroundColor = containerBackgroundColor
  } else if (containerBackgroundMode === "gradient" && containerBackgroundGradientPreset) {
    const gradients: Record<string, string> = {
      soft: "linear-gradient(135deg, rgba(244,247,251,0.6) 0%, rgba(248,250,252,0.3) 100%)",
      aurora: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(168,85,247,0.05) 100%)",
      ocean: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(96,165,250,0.05) 100%)",
      sunset: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(251,146,60,0.05) 100%)",
      hero: "linear-gradient(135deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.2) 100%)",
    }
    containerStyle.background = gradients[containerBackgroundGradientPreset] || "transparent"
  }

  // Apply container shadow if needed
  if (containerShadow?.enabled) {
    const shadowStyle = resolveBoxShadow(containerShadow)
    if (shadowStyle) {
      containerStyle.boxShadow = shadowStyle
    }
  }

  if (containerBorder) {
    containerStyle.border = "1px solid var(--border)"
  }

  return (
    <section
      className={cn("py-16 md:py-20", backgroundMap[background])}
      aria-label={headline || "Slider"}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {(eyebrow || headline || subheadline) && (
          <header className="mb-10 text-center">
            {eyebrow && (
              <p
                onClick={(e) => handleInlineEdit(e, "eyebrow")}
                className="text-sm font-medium tracking-wide text-primary mb-3 cursor-pointer"
                style={{ color: eyebrowColor || undefined }}
              >
                {eyebrow}
              </p>
            )}
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className="text-3xl font-bold tracking-tight text-foreground md:text-4xl cursor-pointer"
                style={{ color: headlineColor || undefined }}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto cursor-pointer"
                style={{ color: subheadlineColor || undefined }}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        <div style={containerStyle} className={cn("rounded-3xl p-8 md:p-12", containerBorder && "border border-border")}>
          {variant === "classic" && (
            <ClassicVariant
              slides={slides}
              aspect={aspectClass}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              controls={controls}
              loop={loop}
              autoplay={autoplay}
              autoplayDelayMs={autoplayDelayMs}
              pauseOnHover={pauseOnHover}
              peek={peek}
              ariaLabel={ariaLabel}
              headline={headline}
            />
          )}

          {variant === "progress" && (
            <ProgressVariant
              slides={slides}
              aspect={aspectClass}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              controls={controls}
              loop={loop}
              autoplay={autoplay}
              autoplayDelayMs={autoplayDelayMs}
              pauseOnHover={pauseOnHover}
              peek={peek}
              ariaLabel={ariaLabel}
              headline={headline}
            />
          )}

          {variant === "thumbnails" && (
            <ThumbnailsVariant
              slides={slides}
              aspect={aspectClass}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              controls={controls}
              loop={loop}
              autoplay={autoplay}
              autoplayDelayMs={autoplayDelayMs}
              pauseOnHover={pauseOnHover}
              peek={peek}
              ariaLabel={ariaLabel}
              headline={headline}
            />
          )}

          {variant === "hero" && (
            <HeroVariant
              slides={slides}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              controls={controls}
              loop={loop}
              autoplay={autoplay}
              autoplayDelayMs={autoplayDelayMs}
              pauseOnHover={pauseOnHover}
              peek={peek}
              ariaLabel={ariaLabel}
              headline={headline}
            />
          )}

          {variant === "cards" && (
            <CardsVariant
              slides={slides}
              aspect={aspectClass}
              slidesPerView={slidesPerView}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              controls={controls}
              loop={loop}
              autoplay={autoplay}
              autoplayDelayMs={autoplayDelayMs}
              pauseOnHover={pauseOnHover}
              peek={peek}
              ariaLabel={ariaLabel}
              headline={headline}
            />
          )}
        </div>
      </div>
    </section>
  )
}
