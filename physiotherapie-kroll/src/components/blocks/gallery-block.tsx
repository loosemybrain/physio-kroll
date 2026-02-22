"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, useReducedMotion, cubicBezier } from "framer-motion"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import { resolveSectionBg } from "@/lib/theme/resolveSectionBg"
import { resolveContainerBg } from "@/lib/theme/resolveContainerBg"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import { mergeTypographyClasses } from "@/lib/typography"
import type { BlockSectionProps, ElementShadow } from "@/types/cms"

/* ------------------------------------------------------------------ */
/*  Types (productive CMS props)                                      */
/* ------------------------------------------------------------------ */

export interface GalleryImageItem {
  id: string
  url: string
  alt: string
  caption?: string
  captionColor?: string
  link?: string
}

export interface GalleryBlockProps {
  blockId?: string
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, Record<string, unknown>>
  typography?: Record<string, unknown>

  section?: BlockSectionProps
  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string
  captionColor?: string

  images: GalleryImageItem[]
  layout?: "grid" | "masonry" | "carousel" | "stack" | "highlight-first"
  variant?: "grid" | "slider"
  columns?: 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg"
  imageRadius?: "none" | "sm" | "md" | "lg" | "xl"
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape"
  imageFit?: "cover" | "contain"
  hoverEffect?: "none" | "zoom" | "lift" | "fade"
  lightbox?: boolean
  showCaptions?: boolean
  captionStyle?: "below" | "overlay"
  showCounter?: boolean
  enableMotion?: boolean
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
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const gapMap: Record<string, string> = { sm: "gap-2", md: "gap-4", lg: "gap-6" }
const maxWidthCls = "max-w-6xl"

const sectionBgFallback: Record<string, string> = {
  none: "",
  muted: "bg-muted/30",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
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

function resolveImageSrc(item: GalleryImageItem): string {
  return item.url || "/placeholder.svg"
}

function resolveAlt(item: GalleryImageItem): string {
  return item.alt || item.caption || "Praxisfoto"
}

/* ------------------------------------------------------------------ */
/*  Motion                                                             */
/* ------------------------------------------------------------------ */

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: cubicBezier(0.22, 1, 0.36, 1) } },
}

/* ------------------------------------------------------------------ */
/*  Lightbox                                                           */
/* ------------------------------------------------------------------ */

function Lightbox({
  images,
  initialIndex,
  showCounter,
  onClose,
}: {
  images: GalleryImageItem[]
  initialIndex: number
  showCounter: boolean
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  const ref = useRef<HTMLDivElement>(null)
  const prev = useCallback(() => setIdx((i) => (i <= 0 ? images.length - 1 : i - 1)), [images.length])
  const next = useCallback(() => setIdx((i) => (i >= images.length - 1 ? 0 : i + 1)), [images.length])

  useEffect(() => {
    ref.current?.focus()
  }, [])

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
    return () => {
      document.body.style.overflow = p
    }
  }, [])

  const cur = images[idx]
  if (!cur) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`Bild ${idx + 1} von ${images.length}`}
        tabIndex={-1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/90 backdrop-blur-md outline-none"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Lightbox schließen"
          className="absolute right-4 top-4 z-10 rounded-full bg-card/20 p-2.5 text-card backdrop-blur-sm transition-colors hover:bg-card/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </button>
        {showCounter && (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-card/20 px-3.5 py-1.5 text-sm font-medium text-card backdrop-blur-sm">
            {idx + 1} / {images.length}
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              aria-label="Vorheriges Bild"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/15 p-3 text-card backdrop-blur-sm transition-all hover:bg-card/30 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              aria-label="Nächstes Bild"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card/15 p-3 text-card backdrop-blur-sm transition-all hover:bg-card/30 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        <motion.div
          key={cur.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-h-[85vh] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={resolveImageSrc(cur)}
            alt={resolveAlt(cur)}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
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
  lightboxEnabled: boolean
  onLightboxOpen: (i: number) => void
  enableMotion: boolean
  blockId?: string
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
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
  lightboxEnabled,
  onLightboxOpen,
  enableMotion,
  blockId,
  editable,
  onEditField,
}: TileSharedProps & { img: GalleryImageItem; index: number }) {
  const reduced = useReducedMotion()
  const noMotion = reduced || !enableMotion

  const hoverCls = cn(
    hover === "zoom" && "group-hover:scale-[1.04]",
    hover === "lift" && "group-hover:-translate-y-1",
    hover === "fade" && "group-hover:opacity-80",
    hover !== "none" && "transition-all duration-500 ease-out"
  )
  const src = resolveImageSrc(img)
  const alt = resolveAlt(img)
  const captColor = img.captionColor || globalCaptionColor

  const handleEdit = (e: React.MouseEvent, path: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    onEditField(blockId, path, (e.currentTarget as HTMLElement).getBoundingClientRect())
  }

  const figure = (
    <figure
      className={cn(
        "group relative overflow-hidden bg-muted/20 border border-border/30 transition-shadow duration-500",
        radiusMap[radius] || radiusMap.lg,
        lightboxEnabled && "cursor-zoom-in",
        hover === "lift" && "hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]"
      )}
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
            hoverCls
          )}
          draggable={false}
        />
        {lightboxEnabled && (
          <div
            className="absolute right-2.5 top-2.5 rounded-lg bg-foreground/40 p-1.5 text-card opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          >
            <ZoomIn className="h-4 w-4" />
          </div>
        )}
        {captionsOn && img.caption && captionStyle === "overlay" && (
          <figcaption
            data-cms-field={blockId ? `images.${img.id}.caption` : undefined}
            onClick={(e) => handleEdit(e, `images.${index}.caption`)}
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 via-foreground/30 to-transparent px-4 pb-3 pt-8 text-sm text-card translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
              editable && blockId && onEditField && "cursor-pointer"
            )}
            style={captColor ? { color: captColor } : undefined}
          >
            {img.caption}
          </figcaption>
        )}
      </div>
      {captionsOn && img.caption && captionStyle === "below" && (
        <figcaption
          data-cms-field={blockId ? `images.${img.id}.caption` : undefined}
          onClick={(e) => handleEdit(e, `images.${index}.caption`)}
          className={cn(
            "border-t border-border/20 px-4 py-3 text-sm text-muted-foreground",
            editable && blockId && onEditField && "cursor-pointer hover:bg-primary/10"
          )}
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
      aria-label={lightboxEnabled ? `Bild vergrößern: ${alt}` : undefined}
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
      className={cn(lightboxEnabled && "rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2")}
    >
      {figure}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Layouts                                                            */
/* ------------------------------------------------------------------ */

function GridLayout({
  images,
  columns,
  gap,
  tp,
}: {
  images: GalleryImageItem[]
  columns: number
  gap: string
  tp: TileSharedProps
}) {
  const cols = Math.min(Math.max(columns, 2), 6) as 2 | 3 | 4 | 5 | 6
  return (
    <div className={cn("grid", gapMap[gap], colsGrid[cols] || colsGrid[3])}>
      {images.map((img, i) => (
        <GalleryTile key={img.id} img={img} index={i} {...tp} />
      ))}
    </div>
  )
}

function MasonryLayout({
  images,
  columns,
  gap,
  tp,
}: {
  images: GalleryImageItem[]
  columns: number
  gap: string
  tp: TileSharedProps
}) {
  const cols = Math.min(Math.max(columns, 2), 6) as 2 | 3 | 4 | 5 | 6
  return (
    <div className={cn(colsMasonry[cols] || colsMasonry[3], gapMap[gap])}>
      {images.map((img, i) => (
        <div key={img.id} className="mb-4 break-inside-avoid">
          <GalleryTile img={img} index={i} {...tp} aspect="" />
        </div>
      ))}
    </div>
  )
}

function CarouselLayout({
  images,
  gap,
  tp,
}: {
  images: GalleryImageItem[]
  gap: string
  tp: TileSharedProps
}) {
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
  const gapPx = { sm: 8, md: 16, lg: 24 }[gap] ?? 16

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ gap: gapPx }}
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
              "flex h-11 w-11 items-center justify-center rounded-full border-2 border-border/60 bg-card/60 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring",
              !canPrev && "pointer-events-none opacity-30"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="Nächstes Bild"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border-2 border-border/60 bg-card/60 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:bg-card hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring",
              !canNext && "pointer-events-none opacity-30"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}

function StackLayout({
  images,
  gap,
  tp,
}: {
  images: GalleryImageItem[]
  gap: string
  tp: TileSharedProps
}) {
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

function HighlightFirstLayout({
  images,
  columns,
  gap,
  tp,
}: {
  images: GalleryImageItem[]
  columns: number
  gap: string
  tp: TileSharedProps
}) {
  const [first, ...rest] = images
  if (!first) return null
  const cols = Math.min(Math.max(columns, 2), 6) as 2 | 3 | 4 | 5 | 6
  return (
    <div className={cn("flex flex-col", gapMap[gap])}>
      <div className="w-full">
        <GalleryTile img={first} index={0} {...tp} aspect="aspect-[21/9]" />
      </div>
      {rest.length > 0 && (
        <div className={cn("grid", gapMap[gap], colsGrid[cols] || colsGrid[3])}>
          {rest.map((img, i) => (
            <GalleryTile key={img.id} img={img} index={i + 1} {...tp} />
          ))}
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
  section,
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  captionColor,
  images,
  layout: layoutProp,
  variant = "grid",
  columns = 3,
  gap = "md",
  imageRadius = "lg",
  aspectRatio = "landscape",
  imageFit = "cover",
  hoverEffect = "zoom",
  lightbox = true,
  showCaptions = true,
  captionStyle = "overlay",
  showCounter = true,
  enableMotion = true,
  background = "none",
  containerBackgroundMode,
  containerBackgroundColor,
  containerBackgroundGradientPreset,
  containerGradientFrom,
  containerGradientVia,
  containerGradientTo,
  containerGradientAngle,
  containerShadow,
  containerBorder = false,
  typography,
}: GalleryBlockProps) {
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)
  const reduced = useReducedMotion()
  const noMotion = reduced || !enableMotion

  const effectiveLayout = layoutProp ?? (variant === "slider" ? "carousel" : "grid")
  const openLb = useCallback((i: number) => {
    setLbIdx(i)
    setLbOpen(true)
  }, [])

  const sectionBg = resolveSectionBg(section)
  const usesContainerPanel = containerBackgroundMode && containerBackgroundMode !== "transparent"
  const containerBg = resolveContainerBg({
    mode: containerBackgroundMode,
    color: containerBackgroundColor,
    gradientPreset: containerBackgroundGradientPreset,
    gradient: {
      from: containerGradientFrom,
      via: containerGradientVia,
      to: containerGradientTo,
      angle: containerGradientAngle ?? 135,
    },
  })
  const containerShadowCss = resolveBoxShadow(containerShadow as import("@/types/cms").ElementShadow | undefined)

  const handleEdit = useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable || !blockId || !onEditField) return
      e.preventDefault()
      e.stopPropagation()
      onEditField(blockId, fieldPath, (e.currentTarget as HTMLElement).getBoundingClientRect())
    },
    [editable, blockId, onEditField]
  )

  const tp: TileSharedProps = {
    radius: imageRadius,
    aspect: aspectMap[aspectRatio] ?? "",
    fit: imageFit,
    hover: hoverEffect,
    captionsOn: showCaptions,
    captionStyle,
    globalCaptionColor: captionColor,
    lightboxEnabled: lightbox,
    onLightboxOpen: openLb,
    enableMotion,
    blockId,
    editable,
    onEditField,
  }

  if (!images || images.length === 0) return null

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden py-20 md:py-28",
          sectionBg.className,
          !usesContainerPanel && (sectionBgFallback[background] ?? "")
        )}
        style={sectionBg.style}
        aria-label={headline || "Galerie"}
      >
        

        <div className={cn("relative mx-auto px-4 sm:px-6", maxWidthCls)}>
          {(headline || subheadline) && (
            <motion.header
              initial={noMotion ? false : { opacity: 0, y: 16 }}
              whileInView={noMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-14 text-center"
            >
              {subheadline && (
                <div className="mb-5 flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" aria-hidden="true" />
                  <span
                    data-cms-field={blockId ? "subheadline" : undefined}
                    onClick={(e) => handleEdit(e, "subheadline")}
                    className={cn(
                      mergeTypographyClasses(
                        "text-xs font-semibold uppercase tracking-[0.2em] text-primary",
                        (typography ?? {})["gallery.subheadline"] as Parameters<typeof mergeTypographyClasses>[1]
                      ),
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 hover:bg-primary/10"
                    )}
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
                  onClick={(e) => handleEdit(e, "headline")}
                  className={cn(
                    mergeTypographyClasses(
                      "mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
                      (typography ?? {})["gallery.headline"] as Parameters<typeof mergeTypographyClasses>[1]
                    ),
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 hover:bg-primary/10"
                  )}
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

          <div
            className={cn(
              usesContainerPanel && "rounded-3xl p-6 md:p-10",
              usesContainerPanel && containerBackgroundMode === "gradient" && "backdrop-blur-sm",
              usesContainerPanel && containerBorder && "border border-border/40"
            )}
            style={
              usesContainerPanel
                ? { ...containerBg.style, ...(containerShadowCss ? { boxShadow: containerShadowCss } : {}) }
                : undefined
            }
            data-element-id={blockId ? "gallery.container" : undefined}
          >
            <motion.div
              key={effectiveLayout}
              variants={noMotion ? undefined : stagger}
              initial={noMotion ? "visible" : "hidden"}
              animate="visible"
            >
              {effectiveLayout === "grid" && (
                <GridLayout images={images} columns={columns ?? 3} gap={gap} tp={tp} />
              )}
              {effectiveLayout === "masonry" && (
                <MasonryLayout images={images} columns={columns ?? 3} gap={gap} tp={tp} />
              )}
              {effectiveLayout === "carousel" && <CarouselLayout images={images} gap={gap} tp={tp} />}
              {effectiveLayout === "stack" && <StackLayout images={images} gap={gap} tp={tp} />}
              {effectiveLayout === "highlight-first" && (
                <HighlightFirstLayout images={images} columns={columns ?? 3} gap={gap} tp={tp} />
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {lightbox && lbOpen && (
        <Lightbox
          images={images}
          initialIndex={lbIdx}
          showCounter={showCounter}
          onClose={() => setLbOpen(false)}
        />
      )}
    </>
  )
}
