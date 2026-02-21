"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  blockId?: string
  headline?: string
  subheadline?: string

  headlineColor?: string
  subheadlineColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string

  slides: SlideItem[]

  variant?: "classic" | "progress" | "thumbnails" | "hero" | "cards"
  aspect?: "video" | "square" | "portrait" | "auto"
  peek?: boolean
  loop?: boolean
  autoplay?: boolean
  autoplayDelayMs?: number
  pauseOnHover?: boolean

  slidesPerView?: { base?: number; md?: number; lg?: number }

  controls?: {
    showArrows?: boolean
    showDots?: boolean
    showProgress?: boolean
    showThumbnails?: boolean
  }

  background?: "none" | "muted" | "gradient"
  containerBackgroundMode?: "solid" | "gradient" | "transparent"
  containerBackgroundGradientPreset?: "soft" | "brand"
  containerShadow?: "none" | "sm" | "md" | "lg"
  containerBorder?: boolean

  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, unknown>
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const aspectMap = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  auto: "",
}

const bgMap = {
  none: "",
  muted: "bg-muted/50",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

function resolveContainerBg(mode?: string, preset?: string) {
  if (!mode || mode === "transparent") return ""
  if (mode === "solid") return "bg-card/70 backdrop-blur-sm"
  if (mode === "gradient") {
    if (preset === "brand") return "bg-gradient-to-br from-primary/8 via-card/80 to-card/60 backdrop-blur-sm"
    return "bg-gradient-to-br from-muted/60 via-card/70 to-card/50 backdrop-blur-sm"
  }
  return ""
}

function resolveBoxShadow(level?: string) {
  if (!level || level === "none") return undefined
  const shadows: Record<string, string> = {
    sm: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
    md: "0 4px 12px rgba(0,0,0,.06), 0 1px 4px rgba(0,0,0,.04)",
    lg: "0 8px 24px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04)",
  }
  return shadows[level]
}

/* ------------------------------------------------------------------ */
/*  Internal: Autoplay hook (no external dep)                          */
/* ------------------------------------------------------------------ */

function useAutoplay(
  api: CarouselApi | undefined,
  enabled: boolean,
  delayMs: number,
  pauseOnHover: boolean,
) {
  const [isPlaying, setIsPlaying] = React.useState(enabled)
  const [isHovered, setIsHovered] = React.useState(false)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const prefersReduced = React.useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  const effectivelyPlaying = isPlaying && !prefersReduced && !(pauseOnHover && isHovered)

  React.useEffect(() => {
    if (!api || !effectivelyPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }
    intervalRef.current = setInterval(() => {
      api.scrollNext()
    }, delayMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [api, effectivelyPlaying, delayMs])

  const toggle = React.useCallback(() => setIsPlaying((p) => !p), [])

  return { isPlaying, toggle, setIsHovered, prefersReduced }
}

/* ------------------------------------------------------------------ */
/*  Internal: Slide tracker                                            */
/* ------------------------------------------------------------------ */

function useSlideTracker(api: CarouselApi | undefined) {
  const [current, setCurrent] = React.useState(0)
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on("select", onSelect)
    api.on("reInit", () => {
      setCount(api.scrollSnapList().length)
      onSelect()
    })
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return { current, count }
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SliderArrowButton({
  direction,
  onClick,
  disabled,
  size = "default",
  className,
}: {
  direction: "prev" | "next"
  onClick: () => void
  disabled?: boolean
  size?: "default" | "sm"
  className?: string
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight
  const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Vorheriger Slide" : "Nächster Slide"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border/60 bg-card/80 backdrop-blur-sm transition-all",
        "hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        sizeClasses,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </button>
  )
}

function SliderDots({
  count,
  current,
  onSelect,
}: {
  count: number
  current: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="tablist">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === current}
          aria-label={`Gehe zu Slide ${i + 1} von ${count}`}
          aria-current={i === current ? "true" : undefined}
          onClick={() => onSelect(i)}
          className={cn(
            "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            i === current
              ? "h-2.5 w-6 bg-primary"
              : "h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
          )}
        />
      ))}
    </div>
  )
}

function ProgressBar({
  current,
  count,
  showCounter,
}: {
  current: number
  count: number
  showCounter?: boolean
}) {
  const pct = count > 0 ? ((current + 1) / count) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>
      {showCounter && (
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {current + 1} / {count}
        </span>
      )}
    </div>
  )
}

function ThumbnailStrip({
  slides,
  current,
  onSelect,
  aspect,
}: {
  slides: SlideItem[]
  current: number
  onSelect: (i: number) => void
  aspect: string
}) {
  const stripRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!stripRef.current) return
    const active = stripRef.current.children[current] as HTMLElement | undefined
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [current])

  return (
    <div
      ref={stripRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
      role="tablist"
      aria-label="Slide-Vorschau"
    >
      {slides.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={i === current}
          aria-current={i === current ? "true" : undefined}
          aria-label={`Gehe zu Slide ${i + 1} von ${slides.length}`}
          onClick={() => onSelect(i)}
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            aspect === "square" ? "h-16 w-16" : aspect === "portrait" ? "h-20 w-14" : "h-14 w-20",
            i === current
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100"
              : "opacity-50 hover:opacity-80",
          )}
        >
          <Image
            src={s.url}
            alt={s.alt || `Slide ${i + 1}`}
            fill
            sizes="80px"
            className="object-cover"
          />
        </button>
      ))}
    </div>
  )
}

function PausePlayButton({
  isPlaying,
  toggle,
}: {
  isPlaying: boolean
  toggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isPlaying ? "Autoplay pausieren" : "Autoplay starten"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card/80 backdrop-blur-sm transition-all",
        "hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Inner carousel component (uses useCarousel context)                */
/* ------------------------------------------------------------------ */

function ImageSliderInner({
  slides,
  variant,
  aspect,
  peek,
  autoplay,
  autoplayDelayMs,
  pauseOnHover,
  slidesPerView,
  controls,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  blockId,
}: {
  slides: SlideItem[]
  variant: NonNullable<ImageSliderBlockProps["variant"]>
  aspect: NonNullable<ImageSliderBlockProps["aspect"]>
  peek: boolean
  autoplay: boolean
  autoplayDelayMs: number
  pauseOnHover: boolean
  slidesPerView: NonNullable<ImageSliderBlockProps["slidesPerView"]>
  controls: NonNullable<ImageSliderBlockProps["controls"]>
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string
  blockId?: string
}) {
  const { api, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()
  const { current, count } = useSlideTracker(api)
  const { isPlaying, toggle, setIsHovered, prefersReduced } = useAutoplay(
    api,
    autoplay,
    autoplayDelayMs,
    pauseOnHover,
  )

  const goTo = React.useCallback(
    (i: number) => api?.scrollTo(i),
    [api],
  )

  const showArrows = controls.showArrows !== false
  const showDots = variant === "classic" ? (controls.showDots !== false) : !!controls.showDots
  const showProgress = variant === "progress" ? true : !!controls.showProgress
  const showThumbs = variant === "thumbnails" ? true : !!controls.showThumbnails

  const isHero = variant === "hero"
  const isCards = variant === "cards"

  const effectiveAspect = isHero ? "aspect-[21/9] md:aspect-[21/9]" : aspectMap[aspect] || "aspect-video"

  // Live region for screen reader announcements
  const currentSlide = slides[current]
  const liveText = currentSlide
    ? `Slide ${current + 1} von ${count}${currentSlide.title ? `: ${currentSlide.title}` : ""}`
    : ""

  // Cards variant: responsive per-view classes
  const cardsItemClass = isCards
    ? cn(
        "min-w-0 shrink-0 grow-0 pl-4",
        slidesPerView.base === 2 ? "basis-1/2" : slidesPerView.base === 3 ? "basis-1/3" : "basis-full",
        slidesPerView.md === 2 ? "md:basis-1/2" : slidesPerView.md === 3 ? "md:basis-1/3" : "md:basis-full",
        slidesPerView.lg === 2 ? "lg:basis-1/2" : slidesPerView.lg === 3 ? "lg:basis-1/3" : "lg:basis-full",
      )
    : undefined

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveText}
      </div>

      {/* Slide track */}
      <CarouselContent className={cn(isCards && "items-stretch")}>
        {slides.map((s, index) => (
          <CarouselItem
            key={s.id}
            className={cn(
              cardsItemClass,
              peek && !isCards && "basis-[85%] md:basis-[90%]",
            )}
            data-element-id={blockId ? `slider.slide.${s.id}` : undefined}
          >
            {isHero ? (
              /* Hero variant: full overlay */
              <div className={cn("relative w-full overflow-hidden rounded-2xl", effectiveAspect)}>
                <Image
                  src={s.url}
                  alt={s.alt || ""}
                  fill
                  sizes="(max-width: 768px) 100vw, 90vw"
                  className="object-cover"
                  style={
                    s.focalPoint
                      ? { objectPosition: `${s.focalPoint.x * 100}% ${s.focalPoint.y * 100}%` }
                      : undefined
                  }
                  priority={index === 0}
                />
                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Overlay text */}
                <div className="absolute inset-x-0 bottom-0 flex items-end p-6 md:p-10">
                  <div className="max-w-xl">
                    {s.title && (
                      <h3
                        className="text-xl font-bold text-white md:text-3xl"
                        style={s.titleColor ? { color: s.titleColor } : undefined}
                      >
                        {s.title}
                      </h3>
                    )}
                    {s.text && (
                      <p
                        className="mt-2 text-sm text-white/80 md:text-base"
                        style={s.textColor ? { color: s.textColor } : undefined}
                      >
                        {s.text}
                      </p>
                    )}
                    {s.link && (
                      <a
                        href={s.link}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        Mehr erfahren <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* All other variants: Card layout */
              <div
                className={cn(
                  "overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow hover:shadow-md",
                  isCards && "flex h-full flex-col",
                )}
                style={{
                  backgroundColor: s.cardBgColor || cardBgColor || undefined,
                  borderColor: s.cardBorderColor || cardBorderColor || undefined,
                }}
              >
                <div className={cn("relative w-full overflow-hidden bg-muted", effectiveAspect)}>
                  <Image
                    src={s.url}
                    alt={s.alt || ""}
                    fill
                    sizes={isCards ? "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" : "(max-width: 768px) 100vw, 90vw"}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={
                      s.focalPoint
                        ? { objectPosition: `${s.focalPoint.x * 100}% ${s.focalPoint.y * 100}%` }
                        : undefined
                    }
                    priority={index === 0}
                  />
                </div>
                {(s.title !== undefined || s.text !== undefined) && (
                  <div className={cn("px-5 py-4", isCards && "flex flex-1 flex-col")}>
                    {s.title !== undefined && (
                      <h3
                        className="text-base font-semibold text-foreground"
                        style={{ color: s.titleColor || slideTitleColor || undefined }}
                      >
                        {s.title || ""}
                      </h3>
                    )}
                    {s.text !== undefined && (
                      <p
                        className={cn(
                          "mt-1 text-sm leading-relaxed text-muted-foreground",
                          isCards && "flex-1",
                        )}
                        style={{ color: s.textColor || slideTextColor || undefined }}
                      >
                        {s.text || ""}
                      </p>
                    )}
                    {s.link && (
                      <a
                        href={s.link}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Mehr erfahren <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Controls area */}
      <div className="mt-6 flex flex-col gap-3">
        {/* Progress bar */}
        {showProgress && (
          <ProgressBar current={current} count={count} showCounter />
        )}

        {/* Navigation row */}
        <div className="flex items-center justify-center gap-3">
          {showArrows && (
            <SliderArrowButton
              direction="prev"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              size={isHero ? "default" : "sm"}
            />
          )}

          {showDots && (
            <SliderDots count={count} current={current} onSelect={goTo} />
          )}

          {autoplay && (
            <PausePlayButton isPlaying={isPlaying && !prefersReduced} toggle={toggle} />
          )}

          {showArrows && (
            <SliderArrowButton
              direction="next"
              onClick={scrollNext}
              disabled={!canScrollNext}
              size={isHero ? "default" : "sm"}
            />
          )}
        </div>

        {/* Thumbnails */}
        {showThumbs && (
          <ThumbnailStrip slides={slides} current={current} onSelect={goTo} aspect={aspect} />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function ImageSliderBlock({
  blockId,
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  slides,
  variant = "classic",
  aspect = "video",
  peek = false,
  loop = true,
  autoplay = false,
  autoplayDelayMs = 5000,
  pauseOnHover = true,
  slidesPerView = { base: 1, md: 2, lg: 3 },
  controls = {},
  background = "none",
  containerBackgroundMode,
  containerBackgroundGradientPreset,
  containerShadow,
  containerBorder,
  editable,
  onEditField,
  onElementClick,
  selectedElementId,
  elements,
}: ImageSliderBlockProps) {
  const sectionBg = bgMap[background ?? "none"]
  const containerBg = resolveContainerBg(containerBackgroundMode, containerBackgroundGradientPreset)
  const boxShadow = resolveBoxShadow(containerShadow)
  const hasContainer = !!containerBackgroundMode && containerBackgroundMode !== "transparent"

  // Embla options
  const isCards = variant === "cards"
  const emblaOpts = React.useMemo(
    () => ({
      loop,
      align: (isCards ? "start" : "center") as "start" | "center",
      slidesToScroll: isCards ? 1 : 1,
      containScroll: "trimSnaps" as const,
    }),
    [loop, isCards],
  )

  return (
    <section
      className={cn("py-16 md:py-20", sectionBg)}
      aria-label={headline || "Bild-Slider"}
      data-element-id={blockId ? `${blockId}.section` : undefined}
    >
      <div className={cn("mx-auto max-w-7xl px-4 md:px-6")}>
        {/* Optional container panel */}
        <div
          className={cn(
            hasContainer && "rounded-3xl px-6 py-10 md:px-10 md:py-14",
            hasContainer && containerBg,
            hasContainer && containerBorder && "border border-border/40",
          )}
          style={hasContainer && boxShadow ? { boxShadow } : undefined}
        >
          {/* Header */}
          {(headline || subheadline) && (
            <header className="mb-10 text-center">
              {subheadline && (
                <div className="mb-3 flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/40" />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest text-primary"
                    style={subheadlineColor ? { color: subheadlineColor } : undefined}
                    data-cms-field={blockId ? `${blockId}.subheadline` : undefined}
                  >
                    {subheadline}
                  </span>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/40" />
                </div>
              )}
              {headline && (
                <h2
                  className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                  style={headlineColor ? { color: headlineColor } : undefined}
                  data-cms-field={blockId ? `${blockId}.headline` : undefined}
                >
                  {headline}
                </h2>
              )}
            </header>
          )}

          {/* Carousel */}
          <Carousel opts={emblaOpts} className="w-full">
            <ImageSliderInner
              slides={slides}
              variant={variant}
              aspect={aspect}
              peek={peek}
              autoplay={autoplay}
              autoplayDelayMs={autoplayDelayMs}
              pauseOnHover={pauseOnHover}
              slidesPerView={slidesPerView}
              controls={controls}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              slideTitleColor={slideTitleColor}
              slideTextColor={slideTextColor}
              blockId={blockId}
            />
          </Carousel>
        </div>
      </div>
    </section>
  )
}
