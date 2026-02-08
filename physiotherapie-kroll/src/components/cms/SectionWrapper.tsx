"use client"

import * as React from "react"
import type { BlockSectionProps, SectionBackground, SectionLayout } from "@/types/cms"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useResponsiveParallax } from "@/lib/parallax/useResponsiveParallax"

const mediaUrlCache = new Map<string, string | null>()

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function defaultSection(): BlockSectionProps {
  return {
    layout: { width: "contained", paddingY: "lg" },
    background: { type: "none", parallax: false },
  }
}

function withDefaults(section: BlockSectionProps | undefined): BlockSectionProps {
  const d = defaultSection()
  if (!section) return d
  return {
    layout: {
      width: section.layout?.width ?? d.layout.width,
      paddingY: section.layout?.paddingY ?? d.layout.paddingY,
      paddingX: section.layout?.paddingX,
      minHeight: section.layout?.minHeight,
    },
    background: {
      ...d.background,
      ...section.background,
    } as SectionBackground,
  }
}

function useMediaUrl(mediaId: string | null | undefined) {
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!mediaId) {
      setUrl(null)
      return
    }
    const cached = mediaUrlCache.get(mediaId)
    if (cached !== undefined) {
      setUrl(cached)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        // Query media_assets (nicht "media") um object_key zu bekommen
        const { data, error } = await supabase
          .from("media_assets")
          .select("object_key")
          .eq("id", mediaId)
          .single()

        if (error || !data?.object_key) {
          mediaUrlCache.set(mediaId, null)
          if (!cancelled) setUrl(null)
          return
        }

        // Generiere Public URL aus object_key
        const { data: urlData } = supabase.storage.from("media").getPublicUrl(data.object_key)
        const publicUrl = urlData?.publicUrl ?? null
        mediaUrlCache.set(mediaId, publicUrl)
        if (!cancelled) setUrl(publicUrl)
      } catch {
        mediaUrlCache.set(mediaId, null)
        if (!cancelled) setUrl(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [mediaId])

  return url
}

type ParallaxItem = {
  container: HTMLElement
  target: HTMLElement
  factor: number
  maxShift: number
}

const parallaxActive = new Set<ParallaxItem>()
let parallaxRaf = 0
let parallaxListenersAttached = false

function scheduleParallaxUpdate() {
  if (parallaxRaf) return
  parallaxRaf = window.requestAnimationFrame(() => {
    parallaxRaf = 0
    const vh = window.innerHeight || 0
    for (const item of parallaxActive) {
      const rect = item.container.getBoundingClientRect()
      if (rect.bottom < -200 || rect.top > vh + 200) continue
      const center = rect.top + rect.height / 2
      const dist = center - vh / 2
      const y = clamp(-dist * item.factor, -item.maxShift, item.maxShift)
      item.target.style.setProperty("--section-parallax-y", `${y.toFixed(1)}px`)
    }
  })
}

function ensureParallaxListeners() {
  if (parallaxListenersAttached) return
  parallaxListenersAttached = true
  window.addEventListener("scroll", scheduleParallaxUpdate, { passive: true })
  window.addEventListener("resize", scheduleParallaxUpdate)
}

function shouldDisableParallax() {
  if (typeof window === "undefined") return true
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return true
  if (window.matchMedia?.("(hover: none)")?.matches) return true
  if (window.innerWidth < 768) return true
  return false
}

function useParallax(opts: {
  enabled: boolean
  containerRef: React.RefObject<HTMLElement | null>
  targetRef: React.RefObject<HTMLElement | null>
}) {
  React.useEffect(() => {
    if (!opts.enabled) return
    if (shouldDisableParallax()) return
    const container = opts.containerRef.current
    const target = opts.targetRef.current
    if (!container || !target) return

    ensureParallaxListeners()
    target.style.setProperty("--section-parallax-y", "0px")

    const item: ParallaxItem = { container, target, factor: 0.15, maxShift: 48 }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting) {
          parallaxActive.add(item)
          scheduleParallaxUpdate()
        } else {
          parallaxActive.delete(item)
          target.style.setProperty("--section-parallax-y", "0px")
        }
      },
      { root: null, threshold: 0 }
    )

    observer.observe(container)
    parallaxActive.add(item)
    scheduleParallaxUpdate()

    return () => {
      observer.disconnect()
      parallaxActive.delete(item)
      target.style.removeProperty("--section-parallax-y")
    }
  }, [opts.enabled, opts.containerRef, opts.targetRef])
}

function gradientCss(bg: SectionBackground): string | null {
  if (bg.type !== "gradient") return null
  const g = bg.gradient
  if (!g) return null
  const stops = (g.stops ?? [])
    .filter((s) => typeof s?.color === "string" && typeof s?.pos === "number")
    .map((s) => `${s.color} ${clamp(s.pos, 0, 100)}%`)
  if (stops.length < 2) return null

  if (g.kind === "radial") return `radial-gradient(circle, ${stops.join(", ")})`
  if (g.kind === "conic") return `conic-gradient(from 0deg, ${stops.join(", ")})`
  const dir = g.direction ?? "to bottom"
  return `linear-gradient(${dir}, ${stops.join(", ")})`
}

function overlayStyle(overlay: { value: string; opacity: number } | undefined) {
  if (!overlay) return null
  return {
    backgroundColor: overlay.value,
    opacity: clamp(overlay.opacity, 0, 100) / 100,
  } as React.CSSProperties
}

function paddingYClass(v: SectionLayout["paddingY"]) {
  switch (v) {
    case "none":
      return { pt: "pt-0", pb: "pb-0" }
    case "sm":
      return { pt: "pt-6", pb: "pb-6" }
    case "md":
      return { pt: "pt-10", pb: "pb-10" }
    case "lg":
      return { pt: "pt-14", pb: "pb-14" }
    case "xl":
      return { pt: "pt-20", pb: "pb-20" }
    default:
      return { pt: "pt-14", pb: "pb-14" }
  }
}

function paddingXClass(v: SectionLayout["paddingX"] | undefined, layoutWidth: SectionLayout["width"]) {
  // For full width: default to px-4 if not set, to match existing layouts.
  if (!v) return layoutWidth === "full" ? "px-4" : ""
  switch (v) {
    case "none":
      return "px-0"
    case "sm":
      return "px-3"
    case "md":
      return "px-4"
    case "lg":
      return "px-6"
    default:
      return ""
  }
}

function minHeightClass(v: SectionLayout["minHeight"] | undefined) {
  switch (v) {
    case "sm":
      return "min-h-[320px]"
    case "md":
      return "min-h-[480px]"
    case "lg":
      return "min-h-[640px]"
    case "screen":
      return "min-h-screen"
    default:
      return ""
  }
}

export function SectionWrapper(props: {
  section: BlockSectionProps | undefined
  editable?: boolean
  className?: string
  /** When true, remove the top gap below navigation for bg.type='none' */
  isFirst?: boolean
  children: React.ReactNode
}) {
  const { layout, background } = withDefaults(props.section)

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const bgLayerRef = React.useRef<HTMLDivElement | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)

  const gradient = gradientCss(background)

  const imageUrl = useMediaUrl(background.type === "image" ? background.image?.mediaId : null)
  const videoUrl = useMediaUrl(background.type === "video" ? background.video?.mediaId : null)
  const posterUrl = useMediaUrl(background.type === "video" ? background.video?.posterMediaId : null)

  const parallaxEnabled = !!background.parallax && (background.type === "image" || background.type === "video")
  
  // Responsive Parallax für Images
  useResponsiveParallax({
    enabled: parallaxEnabled && background.type === "image" && !!imageUrl,
    containerRef,
    targetRef: bgLayerRef,
    strength: background.parallaxStrength,
  })
  
  // Responsive Parallax für Videos (gleiche Logik)
  useResponsiveParallax({
    enabled: parallaxEnabled && background.type === "video" && !!videoUrl,
    containerRef,
    targetRef: videoRef as unknown as React.RefObject<HTMLElement | null>,
    strength: background.parallaxStrength,
  })

  const bgIsFullBleed = layout.width === "full"
  // Background frame:
  // - full: true full-bleed (100vw) without horizontal scroll
  // - contained: background constrained (so it matches "contained")
  const bgFrameClass = cn(
    "absolute inset-y-0 z-0 pointer-events-none",
    bgIsFullBleed ? "" : "mx-auto w-full max-w-7xl"
  )
  const bgFrameStyle: React.CSSProperties = bgIsFullBleed
    ? { left: "calc(50% - 50vw)", width: "100vw" }
    : { left: 0, right: 0 }

  const baseBgStyle: React.CSSProperties = {}
  if (background.type === "color") baseBgStyle.backgroundColor = background.color?.value ?? "transparent"
  if (background.type === "gradient" && gradient) baseBgStyle.backgroundImage = gradient

  if (background.type === "image" && imageUrl) {
    baseBgStyle.backgroundImage = `url(${imageUrl})`
    baseBgStyle.backgroundRepeat = "no-repeat"
    baseBgStyle.backgroundSize = background.image?.fit ?? "cover"
    baseBgStyle.backgroundPosition = background.image?.position ?? "center"
    const blur = clamp(background.image?.blur ?? 0, 0, 20)
    if (blur) {
      baseBgStyle.filter = `blur(${blur}px)`
      baseBgStyle.transform = `${(baseBgStyle.transform as string | undefined) ?? ""} scale(1.05)`.trim()
    }
  }

  // Parallax translate and scale on bg layer (and video element)
  const parallaxTransform = "translate3d(0, var(--section-parallax-y, 0px), 0) scale(var(--section-parallax-scale, 1))"

  const overlay =
    background.type === "color"
      ? background.color?.overlay
      : background.type === "image"
        ? background.image?.overlay
        : background.type === "video"
          ? background.video?.overlay
          : undefined

  const overlayCss = overlayStyle(overlay)

  const pad = paddingYClass(layout.paddingY)
  // If the first block has no background, the default top padding looks like a "margin"
  // under the sticky header. Remove it so the first section starts immediately below nav.
  const removeTopGap = !!props.isFirst && background.type === "none"

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        "bg-background",
        removeTopGap ? "pt-0" : pad.pt,
        pad.pb,
        minHeightClass(layout.minHeight),
        props.className
      )}
    >
      {/* Background layer */}
      {background.type !== "none" && (
        <div
          ref={bgLayerRef}
          className={bgFrameClass}
          style={{
            ...bgFrameStyle,
            ...baseBgStyle,
            transform:
              background.type === "image"
                ? `${parallaxTransform} ${(baseBgStyle.transform as string | undefined) ?? ""}`.trim()
                : (baseBgStyle.transform as string | undefined),
            willChange: "transform",
          }}
        />
      )}

      {/* Video layer */}
      {background.type === "video" && videoUrl && (
        <video
          ref={videoRef}
          className={cn(bgFrameClass, "h-full object-cover")}
          style={{
            ...bgFrameStyle,
            transform: `${parallaxTransform}`,
            willChange: "transform",
          }}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={posterUrl ?? undefined}
        />
      )}

      {/* Fallback placeholders (editor only) */}
      {props.editable && background.type === "image" && background.image?.mediaId && !imageUrl && (
        <div
          className={cn(bgFrameClass, "bg-muted/40 flex items-center justify-center text-xs text-muted-foreground")}
          style={bgFrameStyle}
        >
          Bild nicht gefunden
        </div>
      )}
      {props.editable && background.type === "video" && background.video?.mediaId && !videoUrl && (
        <div
          className={cn(bgFrameClass, "bg-muted/40 flex items-center justify-center text-xs text-muted-foreground")}
          style={bgFrameStyle}
        >
          Video nicht gefunden
        </div>
      )}

      {/* Overlay */}
      {overlayCss && (
        <div className={cn(bgFrameClass, "z-1")} style={{ ...bgFrameStyle, ...overlayCss }} />
      )}

      {/* Content - single source of truth for width & horizontal padding */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        {props.children}
      </div>
    </section>
  )
}

