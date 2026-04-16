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
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import type { BlockSectionProps, ElementConfig, ElementShadow } from "@/types/cms"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import { preloadImage } from "@/lib/media/preloadImage"
import type { GradientPresetValue } from "@/lib/theme/gradientPresets"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
import { ElementAnimated } from "@/components/blocks/ElementAnimated"

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
  shadow?: ElementShadow
}

export interface ImageSliderBlockProps {
  section?: BlockSectionProps
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
  viewportHeight?: "auto" | "50vh" | "60vh" | "70vh" | "80vh" | "90vh"
  headerToSliderSpacing?: "none" | "sm" | "md" | "lg" | "xl" | "custom"
  headerToSliderSpacingCustomPx?: number
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
  /** Cards (Multi-View): öffnet Lightbox bei Klick auf ein Bild */
  cardsLightbox?: boolean
  /** Cards (Multi-View): Hintergrundfarbe der Lightbox (z.B. #000000cc) */
  cardsLightboxBackdropColor?: string
  /** Cards (Multi-View): Backdrop-Preset für Lightbox */
  cardsLightboxBackdropPreset?: "soft-dark" | "dark" | "darker" | "black"
  /** @deprecated legacy key, wird auf cardsLightbox gemappt */
  cardsFirstImageLightbox?: boolean
  background?: "none" | "muted" | "gradient"

  containerBackgroundMode?: "transparent" | "color" | "gradient"
  containerBackgroundColor?: string
  containerBackgroundGradientPreset?: GradientPresetValue
  containerGradientFrom?: string
  containerGradientVia?: string
  containerGradientTo?: string
  containerGradientAngle?: number
  containerShadow?: ElementShadow
  containerBorder?: boolean
  containerBorderColor?: string

  ariaLabel?: string

  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, unknown>
  /** Admin Live-Preview: Klick auf Slide öffnet zugehörige Inspector-Card */
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
}

function SliderLightbox({
  slides,
  initialIndex,
  backdropColor,
  onClose,
}: {
  slides: SlideItem[]
  initialIndex: number
  backdropColor?: string
  onClose: () => void
}) {
  const [idx, setIdx] = React.useState(initialIndex)
  const [imageReady, setImageReady] = React.useState(false)
  const prev = React.useCallback(() => setIdx((i) => (i <= 0 ? slides.length - 1 : i - 1)), [slides.length])
  const next = React.useCallback(() => setIdx((i) => (i >= slides.length - 1 ? 0 : i + 1)), [slides.length])

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose, prev, next])

  React.useEffect(() => {
    const p = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = p
    }
  }, [])

  const slide = slides[idx] ?? null
  const currentSrc = slide?.url || ""

  React.useEffect(() => {
    if (!slide || !currentSrc) return
    let cancelled = false
    setImageReady(false)

    void preloadImage(currentSrc, 1400)
      .catch(() => {
        // keep lightbox usable even when preload fails
      })
      .finally(() => {
        if (!cancelled) setImageReady(true)
      })

    if (slides.length > 1) {
      const nextIdx = idx >= slides.length - 1 ? 0 : idx + 1
      const nextSrc = slides[nextIdx]?.url || ""
      if (nextSrc) {
        void preloadImage(nextSrc, 1200).catch(() => {
          // optional warmup
        })
      }
    }

    return () => {
      cancelled = true
    }
  }, [slide, currentSrc, idx, slides])

  if (!slide) return null

  const overlayStyle = backdropColor?.trim()
    ? { backgroundColor: backdropColor }
    : undefined

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-sm"
        style={overlayStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Bild ${idx + 1} von ${slides.length}`}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/35"
          aria-label="Lightbox schließen"
        >
          <X className="h-5 w-5" />
        </button>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/35"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/35"
              aria-label="Nächstes Bild"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        <motion.div
          className="relative max-h-[88vh] max-w-[92vw]"
          onClick={(e) => e.stopPropagation()}
          key={slide.id}
          initial={{ opacity: 0, scale: 0.965, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {!imageReady && (
            <div className="absolute inset-0 rounded-lg bg-white/10 animate-pulse" aria-hidden="true" />
          )}
          <img
            src={currentSrc}
            alt={slide.alt || ""}
            className={cn(
              "max-h-[88vh] max-w-[92vw] rounded-lg object-contain transition-opacity duration-200",
              imageReady ? "opacity-100" : "opacity-0"
            )}
            draggable={false}
            loading="eager"
            decoding="async"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
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

const viewportHeightMap: Record<Exclude<NonNullable<ImageSliderBlockProps["viewportHeight"]>, "auto">, string> = {
  "50vh": "h-[50vh]",
  "60vh": "h-[60vh]",
  "70vh": "h-[70vh]",
  "80vh": "h-[80vh]",
  "90vh": "h-[90vh]",
}

const headerSpacingMap: Record<Exclude<NonNullable<ImageSliderBlockProps["headerToSliderSpacing"]>, "custom">, string> = {
  none: "mb-0",
  sm: "mb-6",
  md: "mb-8",
  lg: "mb-10",
  xl: "mb-14",
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
  viewportHeight = "auto",
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  variant,
}: {
  slide: SlideItem
  aspect: string
  viewportHeight?: NonNullable<ImageSliderBlockProps["viewportHeight"]>
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  variant: string
}) {
  const shadowCss = resolveBoxShadow(slide.shadow)
  
  const viewportCls = viewportHeight !== "auto" ? viewportHeightMap[viewportHeight] : ""
  const mediaWrapperClass = viewportHeight !== "auto" ? cn("relative w-full overflow-hidden bg-muted", viewportCls) : cn("relative w-full overflow-hidden bg-muted", aspect || "aspect-video")

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
        ...(shadowCss ? { boxShadow: shadowCss } : {}),
      }}
    >
      <div className={mediaWrapperClass}>
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
  viewportHeight = "auto",
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
  interactivePreview = false,
  activeItemId = null,
  onItemSelect,
}: {
  slides: SlideItem[]
  aspect: string
  viewportHeight?: NonNullable<ImageSliderBlockProps["viewportHeight"]>
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
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
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
        {slides.map((slide, index) => {
          const isPreviewActive = interactivePreview && activeItemId === slide.id
          const clickable = interactivePreview && !!onItemSelect
          const content = (
            <SlideImage
              slide={slide}
              aspect={aspect}
              viewportHeight={viewportHeight}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              variant="classic"
            />
          )
          return (
            <CarouselSlide key={slide.id} index={index}>
              <div
                data-repeater-field="slides"
                data-repeater-item-id={slide.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? (e) => { e.stopPropagation(); onItemSelect?.(slide.id) } : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemSelect?.(slide.id) } } : undefined}
                className={cn(clickable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl", isPreviewActive && "ring-2 ring-primary/60")}
              >
                {content}
              </div>
            </CarouselSlide>
          )
        })}
      </CarouselTrack>

      {slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>

          {controls?.showDots !== false && <CarouselDots className="gap-2" />}

          {controls?.showArrows !== false && (
            <CarouselNextButton
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
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
  viewportHeight = "auto",
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
  interactivePreview = false,
  activeItemId = null,
  onItemSelect,
}: {
  slides: SlideItem[]
  aspect: string
  viewportHeight?: NonNullable<ImageSliderBlockProps["viewportHeight"]>
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
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
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
        {slides.map((slide, index) => {
          const isPreviewActive = interactivePreview && activeItemId === slide.id
          const clickable = interactivePreview && !!onItemSelect
          const content = (
            <SlideImage
              slide={slide}
              aspect={aspect}
              viewportHeight={viewportHeight}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              variant="progress"
            />
          )
          return (
            <CarouselSlide key={slide.id} index={index}>
              <div
                data-repeater-field="slides"
                data-repeater-item-id={slide.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? (e) => { e.stopPropagation(); onItemSelect?.(slide.id) } : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemSelect?.(slide.id) } } : undefined}
                className={cn(clickable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl", isPreviewActive && "ring-2 ring-primary/60")}
              >
                {content}
              </div>
            </CarouselSlide>
          )
        })}
      </CarouselTrack>

      <ProgressBar />

      {controls?.showArrows !== false && slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>
          {controls?.showProgress !== false && <SlideCounter />}
          <CarouselNextButton
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
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
  viewportHeight = "auto",
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
  interactivePreview = false,
  activeItemId = null,
  onItemSelect,
}: {
  slides: SlideItem[]
  aspect: string
  viewportHeight?: NonNullable<ImageSliderBlockProps["viewportHeight"]>
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
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
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
        {slides.map((slide, index) => {
          const isPreviewActive = interactivePreview && activeItemId === slide.id
          const clickable = interactivePreview && !!onItemSelect
          const content = (
            <SlideImage
              slide={slide}
              aspect={aspect}
              viewportHeight={viewportHeight}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              variant="thumbnails"
            />
          )
          return (
            <CarouselSlide key={slide.id} index={index}>
              <div
                data-repeater-field="slides"
                data-repeater-item-id={slide.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? (e) => { e.stopPropagation(); onItemSelect?.(slide.id) } : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemSelect?.(slide.id) } } : undefined}
                className={cn(clickable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl", isPreviewActive && "ring-2 ring-primary/60")}
              >
                {content}
              </div>
            </CarouselSlide>
          )
        })}
      </CarouselTrack>

      <ThumbnailStrip slides={slides} />

      {controls?.showArrows !== false && slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>
        <CarouselNextButton
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
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
  viewportHeight = "auto",
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
  interactivePreview = false,
  activeItemId = null,
  onItemSelect,
}: {
  slides: SlideItem[]
  viewportHeight?: NonNullable<ImageSliderBlockProps["viewportHeight"]>
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
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
}) {
  const heroMediaViewportCls = viewportHeight !== "auto" ? viewportHeightMap[viewportHeight] : "aspect-video"
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
        {slides.map((slide, index) => {
          const isPreviewActive = interactivePreview && activeItemId === slide.id
          const clickable = interactivePreview && !!onItemSelect
          const inner = (
            <div className={cn("group relative w-full overflow-hidden rounded-2xl", heroMediaViewportCls)}>
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
          )
          return (
            <CarouselSlide key={slide.id} index={index}>
              <div
                data-repeater-field="slides"
                data-repeater-item-id={slide.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? (e) => { e.stopPropagation(); onItemSelect?.(slide.id) } : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemSelect?.(slide.id) } } : undefined}
                className={cn(clickable && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl", isPreviewActive && "ring-2 ring-primary/60")}
              >
                {inner}
              </div>
            </CarouselSlide>
          )
        })}
      </CarouselTrack>

      {controls?.showArrows !== false && slides.length > 1 && (
        <div className="mt-10 flex overflow-visible items-center justify-center gap-8 pb-6">
        <CarouselPrevButton
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
          aria-label="Vorheriges Testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevButton>
          {controls?.showDots !== false && <CarouselDots />}
          <CarouselNextButton
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-2 border-primary/50 bg-card/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-xl text-primary dark:border-primary/50"
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
  viewportHeight = "auto",
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
  interactivePreview = false,
  activeItemId = null,
  onItemSelect,
  cardsLightbox = false,
  onCardsLightboxOpen,
}: {
  slides: SlideItem[]
  aspect: string
  viewportHeight?: NonNullable<ImageSliderBlockProps["viewportHeight"]>
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
  interactivePreview?: boolean
  activeItemId?: string | null
  onItemSelect?: (itemId: string) => void
  cardsLightbox?: boolean
  onCardsLightboxOpen?: (index: number) => void
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
      {slides.map((slide, index) => {
        const isPreviewActive = interactivePreview && activeItemId === slide.id
        const clickable = interactivePreview && !!onItemSelect
        const cardsLightboxEnabled = !interactivePreview && cardsLightbox
        const content = (
          <SlideImage
            slide={slide}
            aspect={aspect}
            viewportHeight={viewportHeight}
            cardBgColor={cardBgColor}
            cardBorderColor={cardBorderColor}
            slideTitleColor={slideTitleColor}
            slideTextColor={slideTextColor}
            variant="cards"
          />
        )
        return (
          <div key={slide.id}>
            {clickable ? (
              <div
                data-repeater-field="slides"
                data-repeater-item-id={slide.id}
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onItemSelect?.(slide.id) }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemSelect?.(slide.id) } }}
                className={cn("cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl", isPreviewActive && "ring-2 ring-primary/60")}
              >
                {content}
              </div>
            ) : cardsLightboxEnabled ? (
              <div
                data-repeater-field="slides"
                data-repeater-item-id={slide.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onCardsLightboxOpen?.(index)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onCardsLightboxOpen?.(index)
                  }
                }}
                className="cursor-zoom-in rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Bild ${index + 1} in Lightbox öffnen`}
              >
                {content}
              </div>
            ) : (
              <div data-repeater-field="slides" data-repeater-item-id={slide.id}>
                {content}
              </div>
            )}
          </div>
        )
      })}
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
  viewportHeight = "auto",
  headerToSliderSpacing = "md",
  headerToSliderSpacingCustomPx = 24,
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
  cardsLightbox,
  cardsLightboxBackdropColor,
  cardsLightboxBackdropPreset = "darker",
  cardsFirstImageLightbox = false,
  background = "none",
  containerBackgroundMode,
  containerBackgroundColor,
  containerBackgroundGradientPreset,
  containerShadow,
  containerBorder,
  containerBorderColor,
  ariaLabel,
  editable,
  onEditField,
  onElementClick,
  selectedElementId,
  elements,
  interactivePreview = false,
  activeItemId = null,
  onItemSelect,
}: ImageSliderBlockProps) {
  if (!slides || slides.length === 0) return null
  const [cardsLightboxOpen, setCardsLightboxOpen] = React.useState(false)
  const [cardsLightboxIndex, setCardsLightboxIndex] = React.useState(0)
  const effectiveCardsLightbox = cardsLightbox ?? cardsFirstImageLightbox ?? false
  const cardsBackdropByPreset: Record<NonNullable<ImageSliderBlockProps["cardsLightboxBackdropPreset"]>, string> = {
    "soft-dark": "rgba(15, 23, 42, 0.78)",
    dark: "rgba(3, 7, 18, 0.86)",
    darker: "rgba(0, 0, 0, 0.90)",
    black: "rgba(0, 0, 0, 0.96)",
  }
  const effectiveCardsBackdropColor =
    cardsLightboxBackdropColor?.trim() || cardsBackdropByPreset[cardsLightboxBackdropPreset]

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

  const mergedElements = React.useMemo((): Record<string, ElementConfig | undefined> | undefined => {
    if (!elements) return undefined
    const el = elements as Record<string, ElementConfig | undefined>
    return {
      ...el,
      "imageSlider.eyebrow": el["imageSlider.eyebrow"] ?? el["eyebrow"],
      "imageSlider.headline": el["imageSlider.headline"] ?? el["headline"],
      "imageSlider.subheadline": el["imageSlider.subheadline"] ?? el["subheadline"],
    }
  }, [elements])

  const aspectClass = aspectMap[aspect] || ""
  
  // Resolve container background styles
  const containerStyle: React.CSSProperties = {}
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
    containerStyle.borderWidth = "1px"
    containerStyle.borderStyle = "solid"
    const hex = containerBorderColor?.trim()
    containerStyle.borderColor = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "var(--border)"
  }

  return (
    <section
      className={cn(backgroundMap[background])}
      aria-label={headline || "Slider"}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {(eyebrow || headline || subheadline) && (
          <header
            className={cn(
              headerToSliderSpacing === "custom" ? undefined : headerSpacingMap[headerToSliderSpacing],
              "text-center"
            )}
            style={
              headerToSliderSpacing === "custom"
                ? { marginBottom: `${Math.min(120, Math.max(0, Math.round(headerToSliderSpacingCustomPx || 0)))}px` }
                : undefined
            }
          >
            {eyebrow && (
              <ElementAnimated elementId="imageSlider.eyebrow" elements={mergedElements}>
              <p
                data-element-id="imageSlider.eyebrow"
                onClick={(e) => handleInlineEdit(e, "eyebrow")}
                className="text-sm font-medium tracking-wide text-primary mb-3 cursor-pointer"
                style={{ color: eyebrowColor || undefined }}
              >
                {eyebrow}
              </p>
              </ElementAnimated>
            )}
            {headline && (
              <ElementAnimated elementId="imageSlider.headline" elements={mergedElements}>
              <h2
                data-element-id="imageSlider.headline"
                onClick={(e) => handleInlineEdit(e, "headline")}
                className="text-3xl font-bold tracking-tight text-foreground md:text-4xl cursor-pointer"
                style={{ color: headlineColor || undefined }}
              >
                {headline}
              </h2>
              </ElementAnimated>
            )}
            {subheadline && (
              <ElementAnimated elementId="imageSlider.subheadline" elements={mergedElements}>
              <p
                data-element-id="imageSlider.subheadline"
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto cursor-pointer"
                style={{ color: subheadlineColor || undefined }}
              >
                {subheadline}
              </p>
              </ElementAnimated>
            )}
          </header>
        )}

        <div
          style={containerStyle}
          className="rounded-3xl p-8 md:p-12"
        >
          <AnimatedBlock config={section?.animation}>
            {variant === "classic" && (
              <ClassicVariant
                slides={slides}
                aspect={aspectClass}
                viewportHeight={viewportHeight}
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
                interactivePreview={interactivePreview}
                activeItemId={activeItemId}
                onItemSelect={onItemSelect}
              />
            )}

            {variant === "progress" && (
              <ProgressVariant
                slides={slides}
                aspect={aspectClass}
                viewportHeight={viewportHeight}
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
                interactivePreview={interactivePreview}
                activeItemId={activeItemId}
                onItemSelect={onItemSelect}
              />
            )}

            {variant === "thumbnails" && (
              <ThumbnailsVariant
                slides={slides}
                aspect={aspectClass}
                viewportHeight={viewportHeight}
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
                interactivePreview={interactivePreview}
                activeItemId={activeItemId}
                onItemSelect={onItemSelect}
              />
            )}

            {variant === "hero" && (
              <HeroVariant
                slides={slides}
                viewportHeight={viewportHeight}
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
                interactivePreview={interactivePreview}
                activeItemId={activeItemId}
                onItemSelect={onItemSelect}
              />
            )}

            {variant === "cards" && (
              <CardsVariant
                slides={slides}
                aspect={aspectClass}
                viewportHeight={viewportHeight}
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
                interactivePreview={interactivePreview}
                activeItemId={activeItemId}
                onItemSelect={onItemSelect}
                cardsLightbox={effectiveCardsLightbox}
                onCardsLightboxOpen={(index) => {
                  setCardsLightboxIndex(index)
                  setCardsLightboxOpen(true)
                }}
              />
            )}
          </AnimatedBlock>
        </div>
      </div>
      {variant === "cards" && effectiveCardsLightbox && cardsLightboxOpen && (
        <SliderLightbox
          slides={slides}
          initialIndex={cardsLightboxIndex}
          backdropColor={effectiveCardsBackdropColor}
          onClose={() => setCardsLightboxOpen(false)}
        />
      )}
    </section>
  )
}
