"use client"

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from "lucide-react"
import type { MediaValue } from "@/types/cms"

/* ------------------------------------------------------------------ */
/*  Theme resolver stubs (match repo patterns)                         */
/* ------------------------------------------------------------------ */

const gradientPresets: Record<string, { from: string; via?: string; to: string; angle?: number }> = {
  soft:    { from: "hsl(var(--primary) / 0.06)", via: "transparent", to: "hsl(var(--muted) / 0.3)" },
  aurora:  { from: "hsl(var(--primary) / 0.08)", via: "hsl(var(--accent) / 0.04)", to: "transparent" },
  ocean:   { from: "hsl(210 60% 95%)", via: "hsl(200 50% 97%)", to: "transparent" },
  sunset:  { from: "hsl(20 80% 96%)", via: "hsl(340 40% 97%)", to: "transparent" },
  hero:    { from: "hsl(var(--primary) / 0.1)", via: "hsl(var(--primary) / 0.03)", to: "transparent" },
  none:    { from: "transparent", to: "transparent" },
}

function resolveContainerBg(props: {
  containerBackgroundMode?: string
  containerBackgroundColor?: string
  containerBackgroundGradientPreset?: string
  containerGradientFrom?: string
  containerGradientVia?: string
  containerGradientTo?: string
  containerGradientAngle?: number
}): React.CSSProperties {
  const mode = props.containerBackgroundMode ?? "transparent"
  if (mode === "transparent") return {}
  if (mode === "color" && props.containerBackgroundColor) {
    return { backgroundColor: props.containerBackgroundColor }
  }
  if (mode === "gradient") {
    const preset = gradientPresets[props.containerBackgroundGradientPreset ?? "none"]
    const from = props.containerGradientFrom ?? preset?.from ?? "transparent"
    const via = props.containerGradientVia ?? preset?.via
    const to = props.containerGradientTo ?? preset?.to ?? "transparent"
    const angle = props.containerGradientAngle ?? 135
    const stops = via
      ? `${from}, ${via}, ${to}`
      : `${from}, ${to}`
    return { background: `linear-gradient(${angle}deg, ${stops})` }
  }
  return {}
}

function resolveBoxShadow(shadow?: string): string | undefined {
  if (!shadow) return undefined
  const map: Record<string, string> = {
    none: "none",
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
    md: "0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 6px -2px rgb(0 0 0 / 0.04)",
    lg: "0 8px 30px -6px rgb(0 0 0 / 0.08), 0 4px 12px -4px rgb(0 0 0 / 0.05)",
    xl: "0 16px 50px -10px rgb(0 0 0 / 0.1), 0 8px 20px -8px rgb(0 0 0 / 0.06)",
    glow: "0 8px 40px -8px hsl(var(--primary) / 0.12)",
  }
  return map[shadow] ?? shadow
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GalleryImage {
  id: string
  image: MediaValue | string
  alt?: string
  caption?: string
  captionColor?: string
  link?: string
}

export interface GalleryBlockProps {
  blockId?: string
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, value?: unknown, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, Record<string, unknown>>
  typography?: Record<string, unknown>
  section?: unknown

  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string

  images: GalleryImage[]

  layout?: "grid" | "masonry" | "carousel" | "stack" | "highlight-first"
  columns?: 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg"
  maxWidth?: "full" | "xl" | "2xl" | "6xl" | "7xl"
  imageRadius?: "none" | "sm" | "md" | "lg" | "xl"
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape"
  imageFit?: "cover" | "contain"
  hoverEffect?: "none" | "zoom" | "lift" | "fade"
  lightbox?: boolean
  showCaptions?: boolean
  captionStyle?: "overlay" | "below"
  captionColor?: string
  showCounter?: boolean
  lazyLoad?: boolean
  quality?: number
  enableMotion?: boolean
  treatment?: "none" | "warm" | "neutral"

  /* Container panel (repo pattern) */
  containerBackgroundMode?: "transparent" | "color" | "gradient"
  containerBackgroundColor?: string
  containerBackgroundGradientPreset?: "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none"
  containerGradientFrom?: string
  containerGradientVia?: string
  containerGradientTo?: string
  containerGradientAngle?: number
  containerShadow?: string
  containerBorder?: boolean

  /* Backward compat */
  background?: "transparent" | "muted" | "gradient"
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveImageSrc(image: MediaValue | string): string {
  if (typeof image === "string") return image || "/placeholder.svg"
  return image?.src || "/placeholder.svg"
}

function resolveAlt(img: GalleryImage): string {
  return img.alt || img.caption || "Praxisfoto"
}

const gapMap: Record<string, string> = { sm: "gap-2", md: "gap-4", lg: "gap-6" }

const maxWidthMap: Record<string, string> = {
  full: "max-w-full",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
}

const radiusMap: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
}

const aspectMap: Record<string, string> = {
  auto: "",
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[4/3]",
}

const colsGrid: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
}

const colsMasonry: Record<number, string> = {
  2: "columns-1 sm:columns-2",
  3: "columns-1 sm:columns-2 lg:columns-3",
  4: "columns-1 sm:columns-2 lg:columns-4",
  5: "columns-2 sm:columns-3 lg:columns-5",
  6: "columns-2 sm:columns-3 lg:columns-6",
}

const treatmentFilter: Record<string, string | undefined> = {
  none: undefined,
  warm: "brightness(1.02) saturate(1.08) sepia(0.06)",
  neutral: "brightness(1.01) saturate(0.92) contrast(1.03)",
}

const sectionBgFallback: Record<string, string> = {
  transparent: "",
  muted: "bg-muted/30",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

/* ------------------------------------------------------------------ */
/*  Motion                                                             */
/* ------------------------------------------------------------------ */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

/* ------------------------------------------------------------------ */
/*  Lightbox                                                           */
/* ------------------------------------------------------------------ */

function Lightbox({
  images,
  initialIndex,
  showCounter,
  onClose,
  treatment,
  enableMotion,
}: {
  images: GalleryImage[]
  initialIndex: number
  showCounter: boolean
  onClose: () => void
  treatment: string
  enableMotion: boolean
}) {
  const [idx, setIdx] = useState(initialIndex)
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const noMotion = reduced || !enableMotion

  const prev = useCallback(() => setIdx((i) => (i <= 0 ? images.length - 1 : i - 1)), [images.length])
  const next = useCallback(() => setIdx((i) => (i >= images.length - 1 ? 0 : i + 1)), [images.length])

  useEffect(() => { ref.current?.focus() }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose, prev, next])

  useEffect(() => {
    const p = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = p }
  }, [])

  const cur = images[idx]
  const filter = treatmentFilter[treatment]

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`Bild ${idx + 1} von ${images.length}`}
        tabIndex={-1}
        initial={noMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/90 backdrop-blur-md outline-none"
        onClick={onClose}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Lightbox schlie\u00dfen"
          className="absolute right-4 top-4 z-10 rounded-full bg-card/20 p-2.5 text-card backdrop-blur-sm transition-colors hover:bg-card/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Counter */}
        {showCounter && (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-card/20 px-3.5 py-1.5 text-sm font-medium text-card backdrop-blur-sm">
            {idx + 1} / {images.length}
          </div>
        )}

        {/* Nav */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Vorheriges Bild"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/15 p-3 text-card backdrop-blur-sm transition-all hover:bg-card/30 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="N\u00e4chstes Bild"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/15 p-3 text-card backdrop-blur-sm transition-all hover:bg-card/30 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image */}
        <motion.div
          key={cur.id}
          initial={noMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-h-[85vh] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={resolveImageSrc(cur.image)}
            alt={resolveAlt(cur)}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            style={{ filter }}
            draggable={false}
          />
          {cur.caption && (
            <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-foreground/60 px-4 py-3 text-sm text-card backdrop-blur-sm">
              {cur.caption}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Gallery Tile                                                       */
/* ------------------------------------------------------------------ */

interface TileSharedProps {
  radius: string
  aspect: string
  fit: string
  hover: string
  captionsOn: boolean
  captionStyle: string
  globalCaptionColor?: string
  filterStyle?: string
  lightboxEnabled: boolean
  onLightboxOpen: (i: number) => void
  enableMotion: boolean
  blockId?: string
  elements?: Record<string, Record<string, unknown>>
}

function GalleryTile({
  img,
  index,
  radius,
  aspect,
  fit,
  hover,
  captionsOn,
  captionStyle,
  globalCaptionColor,
  filterStyle,
  lightboxEnabled,
  onLightboxOpen,
  enableMotion,
  blockId,
  elements,
}: TileSharedProps & { img: GalleryImage; index: number }) {
  const reduced = useReducedMotion()
  const noMotion = reduced || !enableMotion

  const elementId = `gallery.tile.${img.id}`
  const tileShadow = elements?.[elementId]?.shadow as string | undefined

  const hoverCls = cn(
    hover === "zoom" && "group-hover:scale-[1.04]",
    hover === "lift" && "group-hover:-translate-y-1",
    hover === "fade" && "group-hover:opacity-80",
    hover !== "none" && "transition-all duration-500 ease-out",
  )

  const src = resolveImageSrc(img.image)
  const alt = resolveAlt(img)
  const captColor = img.captionColor || globalCaptionColor

  const figure = (
    <figure
      className={cn(
        "group relative overflow-hidden bg-muted/20",
        radiusMap[radius],
        "border border-border/30",
        "transition-shadow duration-500",
        lightboxEnabled && "cursor-zoom-in",
        hover === "lift" && "hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]",
      )}
      data-element-id={blockId ? elementId : undefined}
      style={{ boxShadow: resolveBoxShadow(tileShadow) }}
    >
      <div className={cn("relative w-full overflow-hidden", aspect || "aspect-[4/3]")}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          quality={80}
          className={cn(
            "h-full w-full object-cover",
            fit === "contain" && "object-contain",
            hoverCls,
          )}
          style={filterStyle ? { filter: filterStyle } : undefined}
          draggable={false}
        />

        {/* Lightbox hint */}
        {lightboxEnabled && (
          <div
            className="absolute right-2.5 top-2.5 rounded-lg bg-foreground/40 p-1.5 text-card opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          >
            <ZoomIn className="h-4 w-4" />
          </div>
        )}

        {/* Overlay caption */}
        {captionsOn && img.caption && captionStyle === "overlay" && (
          <figcaption
            data-cms-field={blockId ? `images.${img.id}.caption` : undefined}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent px-4 pb-3 pt-8 text-sm text-card translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            style={captColor ? { color: captColor } : undefined}
          >
            {img.caption}
          </figcaption>
        )}
      </div>

      {/* Below caption */}
      {captionsOn && img.caption && captionStyle === "below" && (
        <figcaption
          data-cms-field={blockId ? `images.${img.id}.caption` : undefined}
          className="border-t border-border/20 px-4 py-3 text-sm text-muted-foreground"
          style={captColor ? { color: captColor } : undefined}
        >
          {img.caption}
        </figcaption>
      )}
    </figure>
  )

  const motionProps = noMotion ? {} : { variants: fadeUp }

  const handleClick = () => {
    if (lightboxEnabled) onLightboxOpen(index)
  }

  if (img.link && !lightboxEnabled) {
    return (
      <motion.div {...motionProps}>
        <Link
          href={img.link}
          className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {figure}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      {...motionProps}
      onClick={handleClick}
      role={lightboxEnabled ? "button" : undefined}
      tabIndex={lightboxEnabled ? 0 : undefined}
      aria-label={lightboxEnabled ? `Bild vergr\u00f6\u00dfern: ${alt}` : undefined}
      onKeyDown={
        lightboxEnabled
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onLightboxOpen(index)
              }
            }
          : undefined
      }
      className={cn(
        lightboxEnabled && "rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      {figure}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Layout renderers                                                   */
/* ------------------------------------------------------------------ */

function GridLayout({ images, columns, gap, tp }: { images: GalleryImage[]; columns: number; gap: string; tp: TileSharedProps }) {
  return (
    <div className={cn("grid", gapMap[gap], colsGrid[columns] || colsGrid[3])}>
      {images.map((img, i) => <GalleryTile key={img.id} img={img} index={i} {...tp} />)}
    </div>
  )
}

function MasonryLayout({ images, columns, gap, tp }: { images: GalleryImage[]; columns: number; gap: string; tp: TileSharedProps }) {
  return (
    <div className={cn(colsMasonry[columns] || colsMasonry[3], gapMap[gap])}>
      {images.map((img, i) => (
        <div key={img.id} className="mb-4 break-inside-avoid">
          <GalleryTile img={img} index={i} {...tp} aspect="" />
        </div>
      ))}
    </div>
  )
}

function CarouselLayout({ images, gap, tp }: { images: GalleryImage[]; gap: string; tp: TileSharedProps }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const updateNav = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateNav()
    el.addEventListener("scroll", updateNav, { passive: true })
    return () => el.removeEventListener("scroll", updateNav)
  }, [updateNav])

  const scroll = (dir: "prev" | "next") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "next" ? el.clientWidth * 0.75 : -el.clientWidth * 0.75, behavior: "smooth" })
  }

  const gapPxMap: Record<string, number> = { sm: 8, md: 16, lg: 24 }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ gap: gapPxMap[gap] || 16 }}
        role="region"
        aria-label="Bildergalerie"
        tabIndex={0}
      >
        {images.map((img, i) => (
          <div key={img.id} className="w-[80%] flex-shrink-0 snap-center sm:w-[60%] lg:w-[45%]">
            <GalleryTile img={img} index={i} {...tp} />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="Vorheriges Bild"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border-2 border-border/60 bg-card/60 shadow-md backdrop-blur-sm transition-all duration-300",
              "hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-lg",
              "focus-visible:ring-2 focus-visible:ring-ring",
              !canPrev && "pointer-events-none opacity-30",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="N\u00e4chstes Bild"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border-2 border-border/60 bg-card/60 shadow-md backdrop-blur-sm transition-all duration-300",
              "hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-lg",
              "focus-visible:ring-2 focus-visible:ring-ring",
              !canNext && "pointer-events-none opacity-30",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

function StackLayout({ images, gap, tp }: { images: GalleryImage[]; gap: string; tp: TileSharedProps }) {
  const stackGap: Record<string, string> = { sm: "gap-8", md: "gap-12", lg: "gap-16" }
  return (
    <div className={cn("flex flex-col", stackGap[gap] || stackGap.md)}>
      {images.map((img, i) => (
        <div key={img.id} className="mx-auto w-full max-w-4xl">
          <GalleryTile img={img} index={i} {...tp} aspect="" />
        </div>
      ))}
    </div>
  )
}

function HighlightFirstLayout({ images, columns, gap, tp }: { images: GalleryImage[]; columns: number; gap: string; tp: TileSharedProps }) {
  const [first, ...rest] = images
  if (!first) return null
  return (
    <div className={cn("flex flex-col", gapMap[gap])}>
      <div className="w-full">
        <GalleryTile img={first} index={0} {...tp} aspect="aspect-[21/9]" />
      </div>
      {rest.length > 0 && (
        <div className={cn("grid", gapMap[gap], colsGrid[columns] || colsGrid[3])}>
          {rest.map((img, i) => <GalleryTile key={img.id} img={img} index={i + 1} {...tp} />)}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function GalleryBlock({
  blockId,
  editable = false,
  onEditField,
  onElementClick,
  selectedElementId,
  elements,
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  images,
  layout = "grid",
  columns = 3,
  gap = "md",
  maxWidth = "6xl",
  imageRadius = "lg",
  aspectRatio = "landscape",
  imageFit = "cover",
  hoverEffect = "zoom",
  lightbox = true,
  showCaptions = true,
  captionStyle = "overlay",
  captionColor,
  showCounter = true,
  enableMotion = true,
  treatment = "none",
  /* Container panel props */
  containerBackgroundMode,
  containerBackgroundColor,
  containerBackgroundGradientPreset,
  containerGradientFrom,
  containerGradientVia,
  containerGradientTo,
  containerGradientAngle,
  containerShadow,
  containerBorder,
  /* Backward compat */
  background = "transparent",
}: GalleryBlockProps) {
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)
  const reduced = useReducedMotion()
  const noMotion = reduced || !enableMotion

  const openLb = useCallback((i: number) => { setLbIdx(i); setLbOpen(true) }, [])

  const filterStyle = treatmentFilter[treatment]

  const tp: TileSharedProps = useMemo(() => ({
    radius: imageRadius,
    aspect: aspectMap[aspectRatio] || "",
    fit: imageFit,
    hover: hoverEffect,
    captionsOn: showCaptions,
    captionStyle,
    globalCaptionColor: captionColor,
    filterStyle,
    lightboxEnabled: lightbox,
    onLightboxOpen: openLb,
    enableMotion,
    blockId,
    elements,
  }), [imageRadius, aspectRatio, imageFit, hoverEffect, showCaptions, captionStyle, captionColor, filterStyle, lightbox, openLb, enableMotion, blockId, elements])

  if (!images || images.length === 0) return null

  /* Determine outer section bg */
  const usesContainerPanel = containerBackgroundMode && containerBackgroundMode !== "transparent"
  const sectionBg = !usesContainerPanel ? sectionBgFallback[background] : ""

  /* Container panel style */
  const containerStyle: React.CSSProperties = usesContainerPanel
    ? {
        ...resolveContainerBg({
          containerBackgroundMode,
          containerBackgroundColor,
          containerBackgroundGradientPreset,
          containerGradientFrom,
          containerGradientVia,
          containerGradientTo,
          containerGradientAngle,
        }),
        boxShadow: resolveBoxShadow(containerShadow),
      }
    : {}

  const containerCls = usesContainerPanel
    ? cn(
        "rounded-3xl p-6 md:p-10",
        containerBackgroundMode === "gradient" && "backdrop-blur-sm",
        containerBorder && containerBackgroundMode !== "transparent" && "border border-border/40",
      )
    : ""

  return (
    <>
      <section
        className={cn("relative overflow-hidden py-20 md:py-28", sectionBg)}
        aria-label={headline || "Galerie"}
      >
        {/* Subtle decorative orb */}
        {(background !== "transparent" || usesContainerPanel) && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/[0.025] blur-3xl" />
          </div>
        )}

        <div className={cn("relative mx-auto px-4 sm:px-6", maxWidthMap[maxWidth])}>
          {/* Header */}
          {(headline || subheadline) && (
            <motion.header
              initial={noMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-14 text-center"
            >
              {subheadline && (
                <div className="mb-5 flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" aria-hidden="true" />
                  <span
                    data-cms-field={blockId ? "subheadline" : undefined}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
                    style={subheadlineColor ? { color: subheadlineColor } : undefined}
                  >
                    {subheadline}
                  </span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" aria-hidden="true" />
                </div>
              )}

              {headline && (
                <h2
                  data-cms-field={blockId ? "headline" : undefined}
                  className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
                  style={headlineColor ? { color: headlineColor } : undefined}
                >
                  {headline}
                </h2>
              )}

              <div className="mx-auto mt-6 flex justify-center" aria-hidden="true">
                <div className="h-px w-24 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10" />
              </div>
            </motion.header>
          )}

          {/* Container panel (optional) */}
          <div
            className={containerCls || undefined}
            style={usesContainerPanel ? containerStyle : undefined}
            data-element-id={blockId ? "gallery.container" : undefined}
          >
            <motion.div
              variants={noMotion ? undefined : stagger}
              initial={noMotion ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {layout === "grid" && <GridLayout images={images} columns={columns} gap={gap} tp={tp} />}
              {layout === "masonry" && <MasonryLayout images={images} columns={columns} gap={gap} tp={tp} />}
              {layout === "carousel" && <CarouselLayout images={images} gap={gap} tp={tp} />}
              {layout === "stack" && <StackLayout images={images} gap={gap} tp={tp} />}
              {layout === "highlight-first" && <HighlightFirstLayout images={images} columns={columns} gap={gap} tp={tp} />}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && lbOpen && (
        <Lightbox
          images={images}
          initialIndex={lbIdx}
          showCounter={showCounter}
          onClose={() => setLbOpen(false)}
          treatment={treatment}
          enableMotion={enableMotion}
        />
      )}
    </>
  )
}
