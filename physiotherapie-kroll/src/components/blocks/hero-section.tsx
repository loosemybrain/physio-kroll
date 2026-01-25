"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HeroDecoration } from "@/components/decorations/HeroDecoration"
import { ArrowRight, Play, Heart, Zap } from "lucide-react"
import { Editable } from "@/components/editor/Editable"
import { getTypographyClassName } from "@/lib/typography"
import type { TypographySettings } from "@/lib/typography"
import Image from "next/image"

import type { BrandKey } from "@/components/brand/brandAssets";
import type { HeroBlock, MediaValue } from "@/types/cms";
import { useBrandOptional } from "@/components/brand/BrandProvider";

export type HeroMood = BrandKey;

/**
 * Helper to resolve media URL from MediaValue
 * For now, we use the URL directly. In the future, we could resolve mediaId from the media table.
 */
function resolveMediaUrl(mediaValue?: MediaValue, fallbackUrl?: string): string | undefined {
  if (!mediaValue) return fallbackUrl
  if ("url" in mediaValue) return mediaValue.url
  if ("mediaId" in mediaValue) {
    // TODO: Resolve mediaId from media table
    // For now, return undefined to use fallback
    return fallbackUrl
  }
  return fallbackUrl
}

/**
 * Maps image variant to Tailwind CSS classes for aspect ratio and responsive behavior
 * Build-safe: only uses fixed Tailwind classes, no dynamic string interpolation
 */
function getHeroImageAspectClasses(variant: "landscape" | "portrait" = "landscape"): string {
  if (variant === "portrait") {
    return "aspect-[3/4] max-h-[60vh] sm:max-h-[70vh]"
  }
  // landscape (default)
  return "aspect-video max-h-[55vh] sm:max-h-[60vh]"
}

/**
 * Maps image focus to Tailwind object-position classes
 */
function getImageFocusClass(focus: "center" | "top" | "bottom" = "center"): string {
  const focusMap: Record<"center" | "top" | "bottom", string> = {
    center: "object-center",
    top: "object-top",
    bottom: "object-bottom",
  }
  return focusMap[focus]
}

/**
 * Maps image fit to Tailwind object-fit classes
 */
function getImageFitClass(fit: "cover" | "contain" = "cover"): string {
  const fitMap: Record<"cover" | "contain", string> = {
    cover: "object-cover",
    contain: "object-contain",
  }
  return fitMap[fit]
}

/**
 * Gets grid column span for image based on variant and fit
 */
function getImageGridSpan(variant: "landscape" | "portrait" = "landscape", fit: "cover" | "contain" = "cover"): string {
  if (variant === "portrait") {
    return "lg:col-span-6"
  }
  // Landscape: wider for cover, standard for contain
  if (fit === "cover") {
    return "lg:col-span-7"
  }
  return "lg:col-span-6"
}

/**
 * Helper to extract brand-specific content from Hero props
 * Supports both legacy flat structure and new brandContent structure
 */
function getBrandContent(
  props: HeroBlock["props"],
  activeBrand: BrandKey
): {
  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string
  ctaText?: string
  ctaHref?: string
  ctaColor?: string
  ctaBgColor?: string
  ctaHoverBgColor?: string
  ctaBorderColor?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  badgeText?: string
  badgeColor?: string
  badgeBgColor?: string
  playText?: string
  playTextColor?: string
  playBorderColor?: string
  playBgColor?: string
  playHoverBgColor?: string
  trustItems?: string[]
  trustItemsColor?: string
  trustDotColor?: string
  floatingTitle?: string
  floatingTitleColor?: string
  floatingValue?: string
  floatingValueColor?: string
  floatingLabel?: string
  floatingLabelColor?: string
  imageUrl?: string
  imageAlt?: string
  imageVariant?: "landscape" | "portrait"
  imageFit?: "cover" | "contain"
  imageFocus?: "center" | "top" | "bottom"
  containBackground?: "none" | "blur"
} {
  // If brandContent exists, use it
  if (props.brandContent?.[activeBrand]) {
    const brandContent = props.brandContent[activeBrand]
    return {
      headline: brandContent.headline,
      subheadline: brandContent.subheadline,
      headlineColor: brandContent.headlineColor,
      subheadlineColor: brandContent.subheadlineColor,
      ctaText: brandContent.ctaText,
      ctaHref: brandContent.ctaHref,
      ctaColor: brandContent.ctaColor,
      ctaBgColor: (brandContent as Record<string, unknown>).ctaBgColor as string | undefined,
      ctaHoverBgColor: (brandContent as Record<string, unknown>).ctaHoverBgColor as string | undefined,
      ctaBorderColor: (brandContent as Record<string, unknown>).ctaBorderColor as string | undefined,
      secondaryCtaText: brandContent.secondaryCtaText,
      secondaryCtaHref: brandContent.secondaryCtaHref,
      badgeText: brandContent.badgeText,
      badgeColor: brandContent.badgeColor,
      badgeBgColor: (brandContent as Record<string, unknown>).badgeBgColor as string | undefined,
      playText: brandContent.playText,
      playTextColor: brandContent.playTextColor,
      playBorderColor: (brandContent as Record<string, unknown>).playBorderColor as string | undefined,
      playBgColor: (brandContent as Record<string, unknown>).playBgColor as string | undefined,
      playHoverBgColor: (brandContent as Record<string, unknown>).playHoverBgColor as string | undefined,
      trustItems: brandContent.trustItems,
      trustItemsColor: brandContent.trustItemsColor,
      trustDotColor: (brandContent as Record<string, unknown>).trustDotColor as string | undefined,
      floatingTitle: brandContent.floatingTitle,
      floatingValue: brandContent.floatingValue,
      floatingLabel: brandContent.floatingLabel,
      floatingTitleColor: brandContent.floatingTitleColor,
      floatingValueColor: brandContent.floatingValueColor,
      floatingLabelColor: brandContent.floatingLabelColor,
      imageUrl: resolveMediaUrl(brandContent.image, "/placeholder.svg"),
      imageAlt: brandContent.imageAlt,
      imageVariant: brandContent.imageVariant ?? "landscape",
      imageFit: brandContent.imageFit ?? "cover",
      imageFocus: brandContent.imageFocus ?? "center",
      containBackground: brandContent.containBackground ?? "blur",
    }
  }

  // Fallback to legacy flat structure
  return {
    headline: props.headline,
    subheadline: props.subheadline,
    ctaText: props.ctaText,
    ctaHref: props.ctaHref,
    badgeText: props.badgeText,
    playText: props.playText,
    trustItems: props.trustItems,
    floatingTitle: props.floatingTitle,
    floatingValue: props.floatingValue,
    floatingLabel: props.floatingLabel,
    imageUrl: props.mediaUrl || "/placeholder.svg",
    imageAlt: undefined,
    imageVariant: "landscape",
    imageFit: "cover",
    imageFocus: "center",
    containBackground: "blur",
  }
}

interface HeroSectionProps {
  mood?: HeroMood
  // Legacy props (for backward compatibility)
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaHref?: string
  showMedia?: boolean
  mediaType?: "image" | "video"
  mediaUrl?: string
  onCtaClick?: () => void
  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  // Typography per element
  typography?: Record<string, TypographySettings>
  // Legacy CMS-editable props
  badgeText?: string
  playText?: string
  trustItems?: string[]
  floatingTitle?: string
  floatingValue?: string
  floatingLabel?: string
  // New: Full props for brandContent support
  props?: HeroBlock["props"]
  // Brand toggle (for homepage)
  showBrandToggle?: boolean
  onBrandChange?: (brand: BrandKey) => void
  // Editor: active brand from inspector tab
  activeBrand?: BrandKey
}

const defaultContent: Record<HeroMood, { 
  headline: string
  subheadline: string
  ctaText: string
  badgeText: string
  playText: string
  trustItems: string[]
  floatingTitle: string
  floatingValue: string
  floatingLabel?: string
}> = {
  physiotherapy: {
    headline: "Ihre Gesundheit in besten Händen",
    subheadline:
      "Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualität.",
    ctaText: "Termin vereinbaren",
    badgeText: "Vertrauen & Fürsorge",
    playText: "Video ansehen",
    trustItems: ["Über 15 Jahre Erfahrung", "Alle Kassen", "Modernste Therapien"],
    floatingTitle: "Patientenzufriedenheit",
    floatingValue: "98%",
    floatingLabel: undefined,
  },
  "physio-konzept": {
    headline: "Push Your Limits",
    subheadline:
      "Erreiche dein volles Potenzial mit individueller Trainingsbetreuung und sportphysiotherapeutischer Expertise.",
    ctaText: "Jetzt starten",
    badgeText: "Performance & Erfolg",
    playText: "Video ansehen",
    trustItems: [],
    floatingTitle: "Nächstes Training",
    floatingValue: "Heute, 18:00",
    floatingLabel: undefined,
  },
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

export function HeroSection({
  mood = "physiotherapy",
  // Legacy props (for backward compatibility)
  headline,
  subheadline,
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
  // New: Full props for brandContent support
  props: heroProps,
  showBrandToggle = false,
  onBrandChange,
  activeBrand: editorActiveBrand,
  ...restProps
}: HeroSectionProps) {
  const [ctaHovered, setCtaHovered] = useState(false)
  const [playHovered, setPlayHovered] = useState(false)
  const brandContext = useBrandOptional()
  
  // Priority: editorActiveBrand (from inspector) > brandContext > mood > default
  const activeBrand = editorActiveBrand || brandContext?.brand || mood || "physiotherapy"
  const isCalm = activeBrand === "physiotherapy"
  
  // Handler for brand toggle that updates both context and prop callback
  const handleBrandChange = (newBrand: BrandKey) => {
    // Update context if available
    if (brandContext) {
      brandContext.setBrand(newBrand)
    }
    // Call prop callback if provided
    if (onBrandChange) {
      onBrandChange(newBrand)
    }
  }
  
  // Build props object from legacy props or use heroProps
  const props: HeroBlock["props"] = heroProps || {
    mood: activeBrand,
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

  // Get brand-specific content
  const brandContent = getBrandContent(props, activeBrand)
  const content = defaultContent[activeBrand]
  
  // Resolve props with brand-specific content and fallback to defaults
  const resolvedHeadline = brandContent.headline ?? headline ?? content.headline
  const resolvedSubheadline = brandContent.subheadline ?? subheadline ?? content.subheadline
  const resolvedCtaText = brandContent.ctaText ?? ctaText ?? content.ctaText
  const resolvedCtaHref = brandContent.ctaHref ?? ctaHref ?? "#contact"
  const resolvedBadgeText = brandContent.badgeText ?? badgeText ?? content.badgeText
  const resolvedPlayText = brandContent.playText ?? playText ?? content.playText
  const resolvedTrustItems = normalizeStringArray(
    brandContent.trustItems ?? trustItems ?? content.trustItems
  )
  const resolvedFloatingTitle = brandContent.floatingTitle ?? floatingTitle ?? content.floatingTitle
  const resolvedFloatingValue = brandContent.floatingValue ?? floatingValue ?? content.floatingValue
  const resolvedFloatingLabel = brandContent.floatingLabel ?? floatingLabel ?? content.floatingLabel
  const resolvedImageUrl = brandContent.imageUrl ?? mediaUrl ?? "/placeholder.svg"
  const resolvedImageAlt = brandContent.imageAlt ?? (isCalm
    ? "Professional physiotherapy treatment in a calm, welcoming environment"
    : "Athlete training with focused determination and energy")
  const resolvedImageVariant = brandContent.imageVariant ?? "landscape"
  const resolvedImageFit = brandContent.imageFit ?? "cover"
  const resolvedImageFocus = brandContent.imageFocus ?? "center"
  const resolvedContainBackground = brandContent.containBackground ?? "blur"

  // Brand-specific color overrides (optional)
  const defaultHeadlineColor = !isCalm ? "oklch(0.98 0 0)" : "oklch(0.25 0.02 160)"
  const defaultSubheadlineColor = !isCalm ? "oklch(0.98 0 0)" : "oklch(0.5 0.02 160)"
  const resolvedHeadlineColor = brandContent.headlineColor ?? defaultHeadlineColor
  const resolvedSubheadlineColor = brandContent.subheadlineColor ?? defaultSubheadlineColor
  const resolvedCtaColor = brandContent.ctaColor
  const resolvedCtaBgColor = brandContent.ctaBgColor
  const resolvedCtaHoverBgColor = brandContent.ctaHoverBgColor
  const resolvedCtaBorderColor = brandContent.ctaBorderColor
  const resolvedBadgeColor = brandContent.badgeColor
  const resolvedBadgeBgColor = brandContent.badgeBgColor
  const resolvedPlayTextColor = brandContent.playTextColor
  const resolvedPlayBorderColor = brandContent.playBorderColor
  const resolvedPlayBgColor = brandContent.playBgColor
  const resolvedPlayHoverBgColor = brandContent.playHoverBgColor
  const resolvedTrustItemsColor = brandContent.trustItemsColor
  const resolvedTrustDotColor = brandContent.trustDotColor
  const resolvedFloatingTitleColor = brandContent.floatingTitleColor
  const resolvedFloatingValueColor = brandContent.floatingValueColor
  const resolvedFloatingLabelColor = brandContent.floatingLabelColor

  // Get typography for elements
  const typographyRecord = typography || {}
  const headlineTypography = typographyRecord["headline"]
  const subheadlineTypography = typographyRecord["subheadline"]
  const ctaTypography = typographyRecord["cta"]

  // Inline edit helper
  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  return (
    <section
      className={cn(
        "relative min-h-[90vh] w-full overflow-hidden",
        !isCalm && "physio-konzept"
      )}
      aria-labelledby="hero-headline"
      style={!isCalm ? {
        // Apply Physio-Konzept theme variables directly to section
        backgroundColor: "oklch(0.12 0 0)", // --hero-bg for physio-konzept (black)
      } : {
        // Ensure Physiotherapy has light background
        backgroundColor: "oklch(0.97 0.008 150)", // --hero-bg for physiotherapy (light)
      }}
    >
      {/* Background Layer */}
      <div 
        className="absolute inset-0 -z-10 bg-hero-bg" 
        aria-hidden="true"
        style={!isCalm ? {
          backgroundColor: "oklch(0.12 0 0)", // --hero-bg for physio-konzept
        } : {
          backgroundColor: "oklch(0.97 0.008 150)", // --hero-bg for physiotherapy (light)
        }}
      >
        {/* Decorative elements with animations */}
        {/* Decorative elements */}
        <HeroDecoration brand={mood} />
      </div>

      <div className="container mx-auto flex min-h-[90vh] flex-col items-center justify-center gap-8 px-4 py-16 lg:flex-row lg:gap-12 lg:py-24">
        {/* Brand Toggle Switcher - only shown when showBrandToggle is true */}
        {showBrandToggle && (
          <nav
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
            aria-label="Brand selection"
          >
            <button
              onClick={() => handleBrandChange("physiotherapy")}
              type="button"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isCalm
                  ? "bg-primary text-white shadow-sm"
                  : "bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Physiotherapie
            </button>
            <button
              onClick={() => handleBrandChange("physio-konzept")}
              type="button"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                !isCalm
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              PhysioKonzept
            </button>
          </nav>
        )}

        {/* Content */}
        <header
          className={cn(
            "hero-content flex max-w-2xl flex-1 flex-col gap-6",
            isCalm ? "items-start text-left" : "items-center text-center lg:items-start lg:text-left",
          )}
        >
          {/* Badge */}
          <div
            className={cn(
              "hero-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium animate-fade-in-up",
              isCalm ? "bg-primary/10 text-primary" : "bg-primary/20 text-primary",
            )}
            style={resolvedBadgeBgColor ? ({ backgroundColor: resolvedBadgeBgColor } as React.CSSProperties) : undefined}
          >
            {isCalm ? (
              <>
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span
                  onClick={(e) => handleInlineEdit(e, "badgeText")}
                  className={cn(
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/20"
                  )}
                  style={resolvedBadgeColor ? ({ color: resolvedBadgeColor } as React.CSSProperties) : undefined}
                >
                  {resolvedBadgeText}
                </span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span
                  onClick={(e) => handleInlineEdit(e, "badgeText")}
                  className={cn(
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/20"
                  )}
                  style={resolvedBadgeColor ? ({ color: resolvedBadgeColor } as React.CSSProperties) : undefined}
                >
                  {resolvedBadgeText}
                </span>
              </>
            )}
          </div>

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
              "hero-headline text-balance animate-fade-in-up animate-delay-200",
              // Always keep the base responsive sizing.
              // Typography overrides are applied selectively via mergeTypographyClasses
              // (only the explicitly configured properties remove/replace base classes).
              isCalm
                ? "font-serif text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl"
                : "font-sans text-4xl font-bold uppercase tracking-tight md:text-5xl lg:text-7xl"
            )}
            style={{ color: resolvedHeadlineColor }}
          >
            <span onClick={(e) => handleInlineEdit(e, "headline")}>
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
              "hero-subheadline max-w-xl text-pretty leading-relaxed animate-fade-in-up animate-delay-300",
              isCalm ? "text-lg text-muted-foreground md:text-xl" : "text-lg md:text-xl"
            )}
            style={{ color: resolvedSubheadlineColor }}
          >
            <span onClick={(e) => handleInlineEdit(e, "subheadline")}>
              {resolvedSubheadline}
            </span>
          </Editable>

          {/* CTA */}
          <div className="hero-cta mt-4 flex flex-wrap items-center gap-4 animate-fade-in-up animate-delay-400">
            <Editable
              blockId={blockId || ""}
              elementId="cta"
              typography={ctaTypography}
              editable={editable}
              onElementClick={onElementClick}
              isSelected={selectedElementId === "cta"}
            >
              <Button
                size="lg"
                className={cn(
                  "group gap-2 text-base font-semibold",
                  isCalm ? "rounded-full px-8" : "rounded-md px-8 uppercase tracking-wide",
                )}
                style={{
                  color: resolvedCtaColor || undefined,
                  backgroundColor: resolvedCtaBgColor
                    ? (ctaHovered && resolvedCtaHoverBgColor ? resolvedCtaHoverBgColor : resolvedCtaBgColor)
                    : undefined,
                  borderColor: resolvedCtaBorderColor || undefined,
                }}
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
                onClick={editable && blockId && onEditField ? (e) => handleInlineEdit(e, "ctaText") : onCtaClick}
                asChild={!editable && !!ctaHref}
              >
              {!editable && resolvedCtaHref ? (
                <a href={resolvedCtaHref}>
                  {resolvedCtaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              ) : (
                <>
                  <span
                    onClick={(e) => {
                      if (editable && blockId && onEditField) {
                        e.stopPropagation()
                        handleInlineEdit(e, "ctaText")
                      }
                    }}
                    className={cn(
                      editable && blockId && onEditField && "cursor-pointer"
                    )}
                  >
                    {resolvedCtaText}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </>
              )}
              </Button>
            </Editable>

            {!isCalm && (
              <Button
                variant="outline"
                size="lg"
                className="group gap-2 rounded-md border-border/50 bg-transparent text-base uppercase tracking-wide text-foreground hover:bg-secondary hover:text-secondary-foreground"
                style={{
                  color: resolvedPlayTextColor || undefined,
                  backgroundColor: resolvedPlayBgColor
                    ? (playHovered && resolvedPlayHoverBgColor ? resolvedPlayHoverBgColor : resolvedPlayBgColor)
                    : undefined,
                  borderColor: resolvedPlayBorderColor || undefined,
                }}
                onMouseEnter={() => setPlayHovered(true)}
                onMouseLeave={() => setPlayHovered(false)}
                onClick={editable && blockId && onEditField ? (e) => handleInlineEdit(e, "playText") : undefined}
                asChild={!editable}
              >
                {!editable ? (
                  <a href="#video">
                    <Play className="h-4 w-4" aria-hidden="true" />
                    {resolvedPlayText}
                  </a>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span
                      onClick={(e) => {
                        if (editable && blockId && onEditField) {
                          e.stopPropagation()
                          handleInlineEdit(e, "playText")
                        }
                      }}
                      className={cn(
                        editable && blockId && onEditField && "cursor-pointer"
                      )}
                    >
                      {resolvedPlayText}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Trust indicators for calm mood */}
          {isCalm && resolvedTrustItems.length > 0 && (
            <div className="hero-trust mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground animate-fade-in-up animate-delay-500">
              {resolvedTrustItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 animate-fade-in animate-delay-600"
                >
                  <div
                    className="h-2 w-2 rounded-full bg-primary animate-pulse-slow"
                    aria-hidden="true"
                    style={resolvedTrustDotColor ? ({ backgroundColor: resolvedTrustDotColor } as React.CSSProperties) : undefined}
                  />
                  <span
                    onClick={(e) => handleInlineEdit(e, `trustItems.${index}`)}
                    className={cn(
                      editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                    )}
                    style={resolvedTrustItemsColor ? ({ color: resolvedTrustItemsColor } as React.CSSProperties) : undefined}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Media Section */}
        {showMedia && (
          <figure className={cn("hero-media relative flex-1 animate-scale-in animate-delay-400", isCalm ? "max-w-lg" : "max-w-xl")}>
            {mediaType === "video" && mediaUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl max-h-[60vh] lg:max-h-[70vh]">
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
            ) : (
              <div
                className={cn(
                  "relative overflow-hidden shadow-2xl",
                  getHeroImageAspectClasses(resolvedImageVariant),
                  isCalm ? "rounded-3xl" : "rounded-2xl",
                )}
              >
                {/* Blurred background for contain mode */}
                {resolvedImageFit === "contain" && resolvedContainBackground === "blur" && (
                  <div className="absolute inset-0 -z-10">
                    <Image
                      src={resolvedImageUrl}
                      alt=""
                      fill
                      className="object-cover blur-2xl scale-110 opacity-70"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                      aria-hidden="true"
                    />
                  </div>
                )}

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
                      resolvedImageFit === "cover" ? getImageFocusClass(resolvedImageFocus) : "object-center"
                    )}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    priority
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
                  <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-card/90 p-4 backdrop-blur-sm animate-slide-in-left animate-delay-500">
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
            )}

            {/* Decorative floating element for calm mood */}
            {isCalm && (resolvedFloatingTitle?.trim() || resolvedFloatingValue?.trim()) && (
              <div className="absolute -bottom-4 -right-4 rounded-2xl bg-card p-6 shadow-lg md:-bottom-6 md:-right-6 animate-float animate-delay-500">
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
  )
}
