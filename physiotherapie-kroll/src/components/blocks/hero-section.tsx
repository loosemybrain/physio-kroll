"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HeroDecoration } from "@/components/decorations/HeroDecoration"
import { ArrowRight, Play, Heart, Zap } from "lucide-react"
import { Editable } from "@/components/editor/Editable"
import { getTypographyClassName } from "@/lib/typography"
import type { TypographySettings } from "@/lib/typography"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"

import type { HeroBlock, MediaValue, CommonBlockProps } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { useElementShadowStyle } from "@/lib/shadow"
import { resolveDynamicElementId } from "@/lib/editableElements"
import { BrandToggle } from "@/components/brand/BrandToggle"

// No instrumentation in production

function resolveMediaUrl(mediaValue?: MediaValue, fallbackUrl?: string): string | undefined {
  if (!mediaValue) return fallbackUrl
  if ("url" in mediaValue) return mediaValue.url
  if ("mediaId" in mediaValue) {
    return fallbackUrl
  }
  return fallbackUrl
}

function getHeroImageAspectClasses(variant: "landscape" | "portrait" = "landscape"): string {
  if (variant === "portrait") {
    return "aspect-[3/4] max-h-[60vh] sm:max-h-[70vh]"
  }
  return "aspect-video max-h-[55vh] sm:max-h-[60vh]"
}

function getImageFocusClass(focus: "center" | "top" | "bottom" = "center"): string {
  const focusMap: Record<"center" | "top" | "bottom", string> = {
    center: "object-center",
    top: "object-top",
    bottom: "object-bottom",
  }
  return focusMap[focus]
}

function getImageFitClass(fit: "cover" | "contain" = "cover"): string {
  const fitMap: Record<"cover" | "contain", string> = {
    cover: "object-cover",
    contain: "object-contain",
  }
  return fitMap[fit]
}

function normalizeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[]
  if (typeof v === "string") return [v]
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>
    const numericKeys = Object.keys(rec).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length > 0) {
      return numericKeys
        .map((k) => rec[k])
        .filter((x) => typeof x === "string") as string[]
    }
  }
  return []
}

interface HeroSectionProps extends CommonBlockProps {
  headline?: string
  subheadline?: string
  minHeightVh?: "50" | "60" | "70" | "80" | "90" | "100"
  ctaText?: string
  ctaHref?: string
  showMedia?: boolean
  mediaType?: "image" | "video"
  mediaUrl?: string
  onCtaClick?: () => void
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  typography?: Record<string, TypographySettings>
  badgeText?: string
  playText?: string
  trustItems?: string[]
  floatingTitle?: string
  floatingValue?: string
  floatingLabel?: string
  props?: HeroBlock["props"]
  showBrandToggle?: boolean
  brandToggleValue?: BrandKey
}

export function HeroSection({
  headline,
  subheadline,
  minHeightVh,
  ctaText,
  ctaHref = "#contact",
  showMedia = true,
  mediaType = "image",
  mediaUrl,
  onCtaClick,
  editable = false,
  blockId,
  onEditField,
  badgeText,
  playText,
  trustItems,
  floatingTitle,
  floatingValue,
  floatingLabel,
  onElementClick,
  selectedElementId,
  typography,
  elements,
  props: heroProps,
  showBrandToggle = false,
  brandToggleValue,
  ...restProps
}: HeroSectionProps) {
  // Hydration-safe mounted flag for micro-enter animations
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Resolve minHeightVh from multiple sources with priority
  const resolvedMinHeightVh = (() => {
    // Priority: heroProps?.section?.minHeightVh > minHeightVh (top-level prop) > default 90
    let value: string | number | undefined = 
      (heroProps?.section as any)?.minHeightVh || 
      (heroProps?.section as any)?.viewportHeight || 
      minHeightVh

    // Convert to number
    if (typeof value === "string") {
      value = parseInt(value, 10)
    }

    // Clamp to 50-100
    if (typeof value === "number") {
      return Math.max(50, Math.min(100, value))
    }

    // Default
    return 90
  })()

  const heroMountedRef = useRef(false)

  const [ctaHovered, setCtaHovered] = useState(false)
  const [playHovered, setPlayHovered] = useState(false)
  const [actionHoveredStates, setActionHoveredStates] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  // Element shadows
  const heroHeadlineShadow = useElementShadowStyle({
    elementId: "headline",
    elementConfig: (elements ?? {})["headline"],
  })
  const heroSubheadlineShadow = useElementShadowStyle({
    elementId: "subheadline",
    elementConfig: (elements ?? {})["subheadline"],
  })
  const heroBadgeShadow = useElementShadowStyle({
    elementId: "badge",
    elementConfig: (elements ?? {})["badge"],
  })
  const heroPrimaryCtaShadow = useElementShadowStyle({
    elementId: "cta",
    elementConfig: (elements ?? {})["cta"],
  })
  const heroSecondaryCtaShadow = useElementShadowStyle({
    elementId: "secondaryCtaText",
    elementConfig: (elements ?? {})["secondaryCtaText"],
  })
  const heroMediaShadow = useElementShadowStyle({
    elementId: "media",
    elementConfig: (elements ?? {})["media"],
  })
  const heroTrustShadow = useElementShadowStyle({
    elementId: "trust",
    elementConfig: (elements ?? {})["trust"],
  })
  // Floating element shadows
  const heroFloatingTitleShadow = useElementShadowStyle({
    elementId: "floatingTitle",
    elementConfig: (elements ?? {})["floatingTitle"],
  })
  const heroFloatingValueShadow = useElementShadowStyle({
    elementId: "floatingValue",
    elementConfig: (elements ?? {})["floatingValue"],
  })
  const heroFloatingLabelShadow = useElementShadowStyle({
    elementId: "floatingLabel",
    elementConfig: (elements ?? {})["floatingLabel"],
  })

  const showBrandToggleNav = false // Toggle moved to HomePageClient/BrandToggle component
  
  // Determine activeBrand: prefer from props (mood), fallback to pathname
  // In Admin, heroProps.mood is set by PageEditor to current.brand
  // On Public, use pathname to detect brand
  let activeBrand: BrandKey = "physiotherapy"
  
  if (heroProps?.mood && (heroProps.mood === "physiotherapy" || heroProps.mood === "physio-konzept")) {
    activeBrand = heroProps.mood
  } else {
    activeBrand = pathname.startsWith("/konzept") ? "physio-konzept" : "physiotherapy"
  }
  
  const isCalm = activeBrand === "physiotherapy"

  const props: HeroBlock["props"] = heroProps || {
    headline,
    subheadline,
    ctaText,
    ctaHref,
    showMedia,
    mediaType,
    mediaUrl,
    badgeText,
    playText,
    trustItems,
    floatingTitle,
    floatingValue,
    floatingLabel,
  }

  const activeBrandContent = props.brandContent?.[activeBrand] ?? {}

  // Helper: Only non-empty string, else undefined
  const opt = (v?: string) => (v && typeof v === "string" && v.trim() ? v.trim() : undefined)

  const resolvedHeadline = activeBrandContent.headline ?? props.headline ?? headline ?? ""
  const resolvedSubheadline = activeBrandContent.subheadline ?? props.subheadline ?? subheadline ?? ""
  const resolvedCtaText = activeBrandContent.ctaText ?? props.ctaText ?? ctaText ?? ""
  const resolvedCtaHref = activeBrandContent.ctaHref ?? props.ctaHref ?? ctaHref ?? "#contact"
  const resolvedBadgeText = activeBrandContent.badgeText ?? props.badgeText ?? badgeText ?? ""
  const resolvedPlayText = activeBrandContent.playText ?? props.playText ?? playText ?? ""
  const resolvedTrustItems = normalizeStringArray(activeBrandContent.trustItems ?? props.trustItems ?? trustItems ?? [])
  const resolvedFloatingTitle = activeBrandContent.floatingTitle ?? props.floatingTitle ?? floatingTitle ?? ""
  const resolvedFloatingValue = activeBrandContent.floatingValue ?? props.floatingValue ?? floatingValue ?? ""
  const resolvedFloatingLabel = activeBrandContent.floatingLabel ?? props.floatingLabel ?? floatingLabel ?? ""
  const resolvedImageUrl = resolveMediaUrl(activeBrandContent.image) ?? props.mediaUrl ?? mediaUrl ?? "/placeholder.svg"
  const resolvedImageAlt = activeBrandContent.imageAlt ?? (isCalm
    ? "Professional physiotherapy treatment in a calm, welcoming environment"
    : "Athlete training with focused determination and energy")
  const resolvedImageVariant = activeBrandContent.imageVariant ?? "landscape"
  const resolvedImageFit: "cover" | "contain" =
    activeBrandContent.imageFit ?? (props as any)?.imageFit ?? "cover"
  const resolvedImageFocus = activeBrandContent.imageFocus ?? "center"
  const resolvedContainBackground = activeBrandContent.containBackground ?? "blur"

  // Resolve actions: prefer brandContent.actions, fallback to props.actions, fallback to legacy props
  const resolvedActions = activeBrandContent.actions ?? props.actions ?? (
    // Backward compatibility: create actions from old ctaText/ctaHref + playText (for physio-konzept)
    (() => {
      const actions: any[] = []
      if (resolvedCtaText && resolvedCtaHref) {
        actions.push({
          id: "primary",
          variant: "primary",
          label: resolvedCtaText,
          href: resolvedCtaHref,
        })
      }
      if (!isCalm && resolvedPlayText) {
        actions.push({
          id: "video",
          variant: "secondary",
          label: resolvedPlayText,
          action: "video",
        })
      }
      return actions
    })()
  )

  // Farben (nur gesetzt falls in brandContent belegt, sonst undefined)
  const resolvedHeadlineColor = opt(activeBrandContent.headlineColor)
  const resolvedSubheadlineColor = opt(activeBrandContent.subheadlineColor)
  const resolvedCtaColor = opt(activeBrandContent.ctaColor)
  const resolvedCtaBgColor = opt(activeBrandContent.ctaBgColor)
  const resolvedCtaHoverBgColor = opt(activeBrandContent.ctaHoverBgColor)
  const resolvedCtaBorderColor = opt(activeBrandContent.ctaBorderColor)
  const resolvedBadgeColor = opt(activeBrandContent.badgeColor)
  const resolvedBadgeBgColor = opt(activeBrandContent.badgeBgColor)
  const resolvedPlayTextColor = opt(activeBrandContent.playTextColor)
  const resolvedPlayBorderColor = opt(activeBrandContent.playBorderColor)
  const resolvedPlayBgColor = opt(activeBrandContent.playBgColor)
  const resolvedPlayHoverBgColor = opt(activeBrandContent.playHoverBgColor)
  const resolvedTrustItemsColor = opt(activeBrandContent.trustItemsColor)
  const resolvedTrustDotColor = opt(activeBrandContent.trustDotColor)
  const resolvedFloatingTitleColor = opt(activeBrandContent.floatingTitleColor)
  const resolvedFloatingValueColor = opt(activeBrandContent.floatingValueColor)
  const resolvedFloatingLabelColor = opt(activeBrandContent.floatingLabelColor)
  const resolvedHeroBgColor = opt(props.heroBgColor)

  const typographyRecord = typography || {}
  const headlineTypography = typographyRecord["headline"]
  const subheadlineTypography = typographyRecord["subheadline"]
  const ctaTypography = typographyRecord["cta"]
  const playTypography = typographyRecord["play"] || typographyRecord["cta"]

  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string, elementId?: string) => {
    if (!editable || !blockId || !onEditField) return
    
    // Trigger element selection first (for shadow inspector)
    if (elementId && onElementClick) {
      onElementClick(blockId, elementId)
    }
    
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  return (
    <AnimatedBlock config={props.section?.animation}>
      <section
        className={cn(
          "relative w-full",
          !isCalm && "physio-konzept"
        )}
        style={{ minHeight: `${resolvedMinHeightVh}vh` }}
        aria-labelledby="hero-headline"
      >
        {/* Background Layer */}
        <div 
          className="absolute inset-0 -z-10 overflow-visible" 
          aria-hidden="true"
        >
          <HeroDecoration brand={isCalm ? "physiotherapy" : "physio-konzept"} />
        </div>

        {/* Brand Toggle - Floating overlay at top center of Hero (responsive positioned) */}
        {showBrandToggle && (
          <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
            <BrandToggle value={brandToggleValue ?? activeBrand} showToggle={true} />
          </div>
        )}

      <div className={cn(
        "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-8 lg:gap-12 items-start lg:items-center",
        "lg:min-h-auto"
      )}>
        {/* Content - Left Column */}
        <header
          className={cn(
            "hero-content flex flex-col gap-6",
            "pt-16 sm:pt-0", // Mobile padding to avoid Toggle collision
            isCalm ? "items-start text-left" : "items-center text-center lg:items-start lg:text-left",
          )}
        >
          {/* Badge */}
          <Editable
            blockId={blockId || ""}
            elementId="badge"
            editable={editable}
            onElementClick={onElementClick}
            isSelected={selectedElementId === "badge"}
            as="div"
            className={cn(
              "hero-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              "bg-primary/10 text-primary cursor-pointer",
              mounted && "animate-fade-in-up"
            )}
            data-element-id="badge"
            style={{
              ...heroBadgeShadow,
              ...(resolvedBadgeBgColor
                ? ({ backgroundColor: resolvedBadgeBgColor } as React.CSSProperties)
                : {}),
            }}
          >
            {isCalm ? (
              <>
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span
                  onClick={(e) => handleInlineEdit(e, "badgeText", "badge")}
                  className={cn(
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/20"
                  )}
                  style={
                    resolvedBadgeColor
                      ? ({ color: resolvedBadgeColor } as React.CSSProperties)
                      : undefined
                  }
                >
                  {resolvedBadgeText}
                </span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span
                  onClick={(e) => handleInlineEdit(e, "badgeText", "badge")}
                  className={cn(
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/20"
                  )}
                  style={
                    resolvedBadgeColor
                      ? ({ color: resolvedBadgeColor } as React.CSSProperties)
                      : undefined
                  }
                >
                  {resolvedBadgeText}
                </span>
              </>
            )}
          </Editable>

          {/* Headline */}
          <Editable
            blockId={blockId || ""}
            elementId="headline"
            typography={headlineTypography}
            editable={editable}
            onElementClick={onElementClick}
            isSelected={selectedElementId === "headline"}
            as="h1"
            className={cn(
              "hero-headline text-balance text-foreground",
              isCalm
                ? "font-serif text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl"
                : "font-sans text-4xl font-bold uppercase tracking-tight md:text-5xl lg:text-7xl",
              mounted && "animate-fade-in-up animate-delay-200"
            )}
            style={{
              ...heroHeadlineShadow,
              ...(resolvedHeadlineColor ? { color: resolvedHeadlineColor } : {}),
            }}
            data-element-id="headline"
          >
            <span onClick={(e) => handleInlineEdit(e, "headline", "headline")}>
              {resolvedHeadline}
            </span>
          </Editable>

          {/* Subheadline */}
          <Editable
            blockId={blockId || ""}
            elementId="subheadline"
            typography={subheadlineTypography}
            editable={editable}
            onElementClick={onElementClick}
            isSelected={selectedElementId === "subheadline"}
            as="p"
            className={cn(
              "hero-subheadline max-w-xl text-pretty leading-relaxed",
              "text-lg md:text-xl text-muted-foreground",
              mounted && "animate-fade-in-up animate-delay-300"
            )}
            style={{
              ...heroSubheadlineShadow,
              ...(resolvedSubheadlineColor ? { color: resolvedSubheadlineColor } : {}),
            }}
            data-element-id="subheadline"
          >
            <span onClick={(e) => handleInlineEdit(e, "subheadline", "subheadline")}>
              {resolvedSubheadline}
            </span>
          </Editable>

          {/* CTA Actions */}
          <div className={cn("hero-cta mt-4 flex flex-wrap items-center gap-4", mounted && "animate-fade-in-up animate-delay-400")}>
            {resolvedActions.map((action, index) => {
              const isVideo = action.action === "video"
              const elementId = `action-${action.id}`
              const actionHovered = actionHoveredStates[action.id] ?? false
              
              // Resolve colors based on variant
              const isSecondary = action.variant === "secondary"
              const shadowStyle = isSecondary ? heroSecondaryCtaShadow : heroPrimaryCtaShadow
              const textColorProp = isSecondary ? resolvedPlayTextColor : resolvedCtaColor
              const bgColorProp = isSecondary ? resolvedPlayBgColor : resolvedCtaBgColor
              const hoverBgColorProp = isSecondary ? resolvedPlayHoverBgColor : resolvedCtaHoverBgColor
              const borderColorProp = isSecondary ? resolvedPlayBorderColor : resolvedCtaBorderColor

              return (
                <Editable
                  key={action.id}
                  blockId={blockId || ""}
                  elementId={elementId}
                  typography={isSecondary ? playTypography : ctaTypography}
                  editable={editable}
                  onElementClick={onElementClick}
                  isSelected={selectedElementId === elementId}
                >
                  <Button
                    size="lg"
                    variant={isSecondary ? "outline" : "default"}
                    className={cn(
                      "group gap-2 text-base font-semibold",
                      isSecondary && "border-border/50 bg-transparent text-foreground hover:bg-secondary hover:text-secondary-foreground rounded-md uppercase tracking-wide",
                      !isSecondary && isCalm && "rounded-full px-8",
                      !isSecondary && !isCalm && "rounded-md px-8 uppercase tracking-wide",
                    )}
                    data-element-id={elementId}
                    style={{
                      ...shadowStyle,
                      ...(textColorProp ||
                      bgColorProp ||
                      borderColorProp ||
                      (actionHovered && hoverBgColorProp)
                        ? {
                            ...(textColorProp ? { color: textColorProp } : {}),
                            ...(bgColorProp || (actionHovered && hoverBgColorProp)
                              ? {
                                  backgroundColor:
                                    (actionHovered && hoverBgColorProp) ? hoverBgColorProp : bgColorProp
                                }
                              : {}),
                            ...(borderColorProp
                              ? { borderColor: borderColorProp }
                              : {}),
                          }
                        : {}),
                    }}
                    onMouseEnter={() => setActionHoveredStates(prev => ({ ...prev, [action.id]: true }))}
                    onMouseLeave={() => setActionHoveredStates(prev => ({ ...prev, [action.id]: false }))}
                    onClick={editable && blockId && onEditField ? (e) => handleInlineEdit(e, `actions.${index}.label`, elementId) : (isVideo ? onCtaClick : undefined)}
                    asChild={!editable && !isVideo && !!action.href}
                  >
                    {!editable && !isVideo && action.href ? (
                      <a href={action.href}>
                        {isVideo && <Play className="h-4 w-4" aria-hidden="true" />}
                        {action.label}
                        {!isVideo && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
                      </a>
                    ) : (
                      <>
                        {isVideo && <Play className="h-4 w-4" aria-hidden="true" />}
                        <span
                          onClick={(e) => {
                            if (editable && blockId && onEditField) {
                              e.stopPropagation()
                              handleInlineEdit(e, `actions.${index}.label`, elementId)
                            }
                          }}
                          className={cn(
                            editable && blockId && onEditField && "cursor-pointer"
                          )}
                        >
                          {action.label}
                        </span>
                        {!isVideo && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
                      </>
                    )}
                  </Button>
                </Editable>
              )
            })}
          </div>

          {/* Trust indicators for calm mood */}
          {isCalm && resolvedTrustItems.length > 0 && (
            <div 
              className={cn("hero-trust mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground", mounted && "animate-fade-in-up animate-delay-500")}
              data-element-id="trust"
              style={heroTrustShadow}
              onClick={() => onElementClick?.(blockId || "", "trust")}
            >
              {resolvedTrustItems.map((item, index) => (
                <HeroTrustItem
                  key={item}
                  item={item}
                  index={index}
                  elements={elements}
                  blockId={blockId}
                  onElementClick={onElementClick}
                  resolvedTrustItemsColor={resolvedTrustItemsColor}
                />
              ))}
            </div>
          )}
        </header>

        {/* Media Section - Right Column */}
          {showMedia && (
            <figure className={cn("hero-media relative", mounted && "animate-scale-in animate-delay-400")}>
            {mediaType === "video" && mediaUrl ? (
              <div
                className={cn(
                  "relative shadow-2xl", // shadow stays here
                  getHeroImageAspectClasses(resolvedImageVariant),
                  isCalm ? "rounded-3xl" : "rounded-2xl"
                )}
                style={heroMediaShadow}
                data-element-id="media"
                onClick={() => onElementClick?.(blockId || "", "media")}
              >
                <div
                  className={cn(
                    "relative overflow-hidden w-full h-full",
                    isCalm ? "rounded-3xl" : "rounded-2xl"
                  )}
                  style={{ width: "100%", height: "100%" }}
                >
                  <div className="relative aspect-video max-h-[60vh] lg:max-h-[70vh] w-full h-full">
                    <video
                      src={mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover object-center"
                      aria-label="Physiotherapy treatment video"
                    />
                  </div>
                  {/* Overlay decorations - only for cover mode */}
                  {resolvedImageFit === "cover" && (
                    <>
                      {isCalm ? (
                        <div className="absolute inset-0 bg-linear-to-t from-primary/10 to-transparent" />
                      ) : (
                        <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent" />
                      )}
                    </>
                  )}

                  {/* Floating card for PhysioKonzept */}
                  {!isCalm && (resolvedFloatingTitle?.trim() || resolvedFloatingValue?.trim()) && (
                    <div className={cn("absolute bottom-6 left-6 right-6 rounded-xl bg-card/90 p-4 backdrop-blur-sm animate-slide-in-left", mounted && "animate-delay-500")}>
                      {resolvedFloatingTitle?.trim() && (
                        <span
                          data-element-id="floatingTitle"
                          className={cn(
                            "block text-sm font-semibold uppercase tracking-wide text-card-foreground",
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                          )}
                          style={{
                            ...(heroFloatingTitleShadow || {}),
                            ...(resolvedFloatingTitleColor
                              ? { color: resolvedFloatingTitleColor }
                              : undefined),
                          }} 
                          onClick={(e) => {
                            if (onElementClick) onElementClick(blockId || "", "floatingTitle");
                            handleInlineEdit(e, "floatingTitle");
                          }}
                        >
                          {resolvedFloatingTitle}
                        </span>
                      )}
                      {resolvedFloatingValue?.trim() && (
                        <span
                          data-element-id="floatingValue"
                          className={cn(
                            "block mt-1 text-2xl font-bold text-primary",
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                          )}
                          style={{
                            ...(heroFloatingValueShadow || {}),
                            ...(resolvedFloatingValueColor
                              ? { color: resolvedFloatingValueColor }
                              : undefined),
                          }}
                          onClick={(e) => {
                            if (onElementClick) onElementClick(blockId || "", "floatingValue");
                            handleInlineEdit(e, "floatingValue");
                          }}
                        >
                          {resolvedFloatingValue}
                        </span>
                      )}
                      {resolvedFloatingLabel && (
                        <span
                          data-element-id="floatingLabel"
                          className={cn(
                            "block mt-1 text-sm text-muted-foreground",
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                          )}
                          style={{
                            ...(heroFloatingLabelShadow || {}),
                            ...(resolvedFloatingLabelColor
                              ? { color: resolvedFloatingLabelColor }
                              : undefined),
                          }}
                          onClick={(e) => {
                            if (onElementClick) onElementClick(blockId || "", "floatingLabel");
                            handleInlineEdit(e, "floatingLabel");
                          }}
                        >
                          {resolvedFloatingLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "relative shadow-nonel overflow-x-clip overflow-y-clip", // outer wrapper: shadow + overflow handling
                  getHeroImageAspectClasses(resolvedImageVariant)
                )}
                style={heroMediaShadow}
                data-element-id="media"
                onClick={() => onElementClick?.(blockId || "", "media")}
              >
                {/* Blurred background placed outside inner clip wrapper to avoid being clipped */}
                {resolvedImageFit === "contain" && resolvedContainBackground === "blur" && (
                  <div
                    className={
                      isCalm
                        ? "absolute inset-0 -z-10"
                        : "absolute inset-y-0 -inset-x-16 -z-10"
                    }
                  >
                    <Image
                      src={resolvedImageUrl}
                      alt=""
                      fill
                      className={cn(
                        "object-cover blur-2xl scale-110 opacity-70",
                        (() => {
                          const resolvedImageFocus = activeBrandContent.imageFocus;
                          const focusClass = resolvedImageFocus ? getImageFocusClass(resolvedImageFocus) : undefined;
                          const heroObjectPos =
                            (resolvedImageFit as string) === "cover"
                              ? (focusClass ? focusClass : (!isCalm ? "object-[70%_50%]" : "object-center"))
                              : (focusClass ? focusClass : "object-center");
                          return heroObjectPos;
                        })()
                      )}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                      aria-hidden="true"
                    />
                  </div>
                )}

                {/* INNER clip wrapper: rounded + overflow-hidden so main image and overlays are clipped */}
                <div
                  className={cn(
                    "relative overflow-hidden w-full h-full",
                    isCalm ? "rounded-3xl" : "rounded-2xl"
                  )}
                  style={{ width: "100%", height: "100%" }}
                >
                  {(() => {
                    const resolvedImageFocus = activeBrandContent.imageFocus;
                    const focusClass = resolvedImageFocus ? getImageFocusClass(resolvedImageFocus) : undefined;

                    const heroObjectPos =
                      (resolvedImageFit as string) === "cover"
                        ? (focusClass ? focusClass : (!isCalm ? "object-[70%_50%]" : "object-center"))
                        : (focusClass ? focusClass : "object-center");

                    return (
                      <>
                        {/* Main image */}
                        <div className={cn(
                          "relative w-full h-full",
                          resolvedImageFit === "contain" && "p-4 sm:p-6"
                        )}>
                          <Image
                            src={resolvedImageUrl}
                            alt={resolvedImageAlt}
                            fill
                            className={cn(
                              getImageFitClass(resolvedImageFit),
                              heroObjectPos
                            )}
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                            priority
                          />
                        </div>
                      </>
                    );
                  })()}

                  {/* Overlay decorations - only for cover mode */}
                  {resolvedImageFit === "cover" && (
                    <>
                      {isCalm ? (
                        <div className="absolute inset-0 bg-linear-to-t from-primary/10 to-transparent" />
                      ) : (
                        <div className="absolute inset-y-0 -inset-x-12 bg-linear-to-t from-background/60 via-transparent to-transparent" />
                      )}
                    </>
                  )}

                  {/* Floating card for PhysioKonzept */}
                  {!isCalm && (resolvedFloatingTitle?.trim() || resolvedFloatingValue?.trim()) && (
                    <div className={cn("absolute bottom-6 left-6 right-6 rounded-xl bg-card/90 p-4 backdrop-blur-sm animate-slide-in-left", mounted && "animate-delay-500")}>
                      {resolvedFloatingTitle?.trim() && (
                        <p
                          className={cn(
                            "text-sm font-semibold uppercase tracking-wide text-card-foreground",
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                          )}
                          style={resolvedFloatingTitleColor ? ({ color: resolvedFloatingTitleColor } as React.CSSProperties) : undefined}
                          onClick={(e) => handleInlineEdit(e, "floatingTitle")}
                        >
                          {resolvedFloatingTitle}
                        </p>
                      )}
                      {resolvedFloatingValue?.trim() && (
                        <p
                          className={cn(
                            "mt-1 text-2xl font-bold text-primary",
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                          )}
                          style={resolvedFloatingValueColor ? ({ color: resolvedFloatingValueColor } as React.CSSProperties) : undefined}
                          onClick={(e) => handleInlineEdit(e, "floatingValue")}
                        >
                          {resolvedFloatingValue}
                        </p>
                      )}
                      {resolvedFloatingLabel && (
                        <p
                          className={cn(
                            "mt-1 text-sm text-muted-foreground",
                            editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                          )}
                          style={resolvedFloatingLabelColor ? ({ color: resolvedFloatingLabelColor } as React.CSSProperties) : undefined}
                          onClick={(e) => handleInlineEdit(e, "floatingLabel")}
                        >
                          {resolvedFloatingLabel}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decorative floating element for calm mood */}
            {isCalm && (resolvedFloatingTitle?.trim() || resolvedFloatingValue?.trim()) && (
              <div className={cn("absolute -bottom-4 -right-4 rounded-2xl bg-card p-6 shadow-lg md:-bottom-6 md:-right-6 animate-float", mounted && "animate-delay-500")}>
                {resolvedFloatingValue?.trim() && (
                  <p
                    className={cn(
                      "text-3xl font-bold text-primary",
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={resolvedFloatingValueColor ? ({ color: resolvedFloatingValueColor } as React.CSSProperties) : undefined}
                    onClick={(e) => handleInlineEdit(e, "floatingValue")}
                  >
                    {resolvedFloatingValue}
                  </p>
                )}
                {resolvedFloatingTitle?.trim() && (
                  <p
                    className={cn(
                      "text-sm text-muted-foreground",
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={resolvedFloatingTitleColor ? ({ color: resolvedFloatingTitleColor } as React.CSSProperties) : undefined}
                    onClick={(e) => handleInlineEdit(e, "floatingTitle")}
                  >
                    {resolvedFloatingTitle}
                  </p>
                )}
                {resolvedFloatingLabel && (
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mt-1",
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={resolvedFloatingLabelColor ? ({ color: resolvedFloatingLabelColor } as React.CSSProperties) : undefined}
                    onClick={(e) => handleInlineEdit(e, "floatingLabel")}
                  >
                    {resolvedFloatingLabel}
                  </p>
                )}
              </div>
            )}
          </figure>
        )}
      </div>

      {/* Bottom scroll indicator */}
      <div className="hero-scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
        <div className={cn("h-12 w-6 rounded-full border-2", isCalm ? "border-primary/30" : "border-primary/50")}>
          <div
            className={cn("mx-auto mt-2 h-2 w-1 animate-bounce rounded-full", isCalm ? "bg-primary/50" : "bg-primary")}
          />
        </div>
      </div>
      </section>
    </AnimatedBlock>
  )
}

/**
 * HeroTrustItem Component - Extracted to use Hooks properly (not in map)
 */
interface HeroTrustItemProps {
  item: string
  index: number
  questionColor?: string
  answerColor?: string
  elements?: Record<string, any>
  blockId?: string
  onElementClick?: (blockId: string, elementId: string) => void
  resolvedTrustItemsColor?: string
  editable?: boolean
  blockIdValue?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
}

function HeroTrustItem({
  item,
  index,
  elements,
  blockId,
  onElementClick,
  resolvedTrustItemsColor,
}: HeroTrustItemProps) {
  // Hook call is safe here (not in map)
  const trustItemId = `trustItems.${index}`
  const trustItemShadow = useElementShadowStyle({
    elementId: trustItemId,
    elementConfig: (elements ?? {})[trustItemId],
  })

  return (
    <div
      data-element-id={trustItemId}
      className="flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-colors hover:bg-primary/5"
      style={trustItemShadow}
      onClick={() => onElementClick?.(blockId || "", trustItemId)}
    >
      <div
        className="h-2 w-2 rounded-full bg-primary animate-pulse-slow"
        aria-hidden="true"
        style={resolvedTrustItemsColor ? ({ backgroundColor: resolvedTrustItemsColor } as React.CSSProperties) : undefined}
      />
      <span
        style={resolvedTrustItemsColor ? ({ color: resolvedTrustItemsColor } as React.CSSProperties) : undefined}
      >
        {item}
      </span>
    </div>
  )
}
