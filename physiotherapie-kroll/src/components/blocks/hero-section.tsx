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
import { usePathname, useRouter } from "next/navigation"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"

import type { HeroBlock, MediaValue, CommonBlockProps } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { useElementShadowStyle } from "@/lib/shadow"

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
}

export function HeroSection({
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
  elements,
  props: heroProps,
  showBrandToggle = false,
  ...restProps
}: HeroSectionProps) {
  const [ctaHovered, setCtaHovered] = useState(false)
  const [playHovered, setPlayHovered] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Element shadows
  const heroHeadlineShadow = useElementShadowStyle({
    elementId: "headline",
    elementConfig: (elements ?? {})["headline"],
  })
  const heroSubheadlineShadow = useElementShadowStyle({
    elementId: "subheadline",
    elementConfig: (elements ?? {})["subheadline"],
  })
  const heroPrimaryCtaShadow = useElementShadowStyle({
    elementId: "primaryCta",
    elementConfig: (elements ?? {})["primaryCta"],
  })
  const heroSecondaryCtaShadow = useElementShadowStyle({
    elementId: "secondaryCta",
    elementConfig: (elements ?? {})["secondaryCta"],
  })

  const showBrandToggleNav = showBrandToggle && (pathname === "/" || pathname === "/konzept")
  
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
        "relative min-h-[90vh] w-full overflow-hidden",
        !isCalm && "physio-konzept"
      )}
      aria-labelledby="hero-headline"
      style={{ 
        background: resolvedHeroBgColor || "var(--hero-background, var(--background))",
        "--hero-bg": resolvedHeroBgColor || undefined,
      } as React.CSSProperties}

    >
      {/* Background Layer */}
      <div 
        className="absolute inset-0 -z-10" 
        aria-hidden="true"
        style={{ background: "var(--hero-background, var(--background))" } as React.CSSProperties}

      >
        <HeroDecoration brand={isCalm ? "physiotherapy" : "physio-konzept"} />
      </div>

      <div className="container mx-auto flex min-h-[90vh] flex-col items-center justify-center gap-8 px-4 py-16 lg:flex-row lg:gap-12 lg:py-24">
        {showBrandToggleNav && (
          <nav
            className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
            aria-label="Brand selection"
          >
            <button
              type="button"
              aria-pressed={isCalm}
              aria-label="Wechsel zu Physiotherapie"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none",
                isCalm
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-primary hover:bg-muted/60"
              )}
              onClick={() => {
                if (!isCalm) router.push("/");
              }}
            >
              Physiotherapie
            </button>
            <button
              type="button"
              aria-pressed={!isCalm}
              aria-label="Wechsel zu Physio-Konzept"
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none",
                !isCalm
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-transparent text-primary hover:bg-muted/60"
              )}
              onClick={() => {
                if (isCalm) router.push("/konzept");
              }}
            >
              Physio-Konzept
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
              "bg-primary/10 text-primary"
            )}
            style={
              resolvedBadgeBgColor
                ? ({ backgroundColor: resolvedBadgeBgColor } as React.CSSProperties)
                : undefined
            }
          >
            {isCalm ? (
              <>
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span
                  onClick={(e) => handleInlineEdit(e, "badgeText")}
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
                  onClick={(e) => handleInlineEdit(e, "badgeText")}
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
          </div>

          {/* Headline */}
          <Editable
            blockId={blockId || ""}
            elementId="hero-headline"
            typography={headlineTypography}
            editable={editable}
            onElementClick={onElementClick}
            isSelected={selectedElementId === "hero-headline"}
            as="h1"
            className={cn(
              "hero-headline text-balance animate-fade-in-up animate-delay-200 text-foreground",
              isCalm
                ? "font-serif text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl"
                : "font-sans text-4xl font-bold uppercase tracking-tight md:text-5xl lg:text-7xl"
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
            elementId="hero-subheadline"
            typography={subheadlineTypography}
            editable={editable}
            onElementClick={onElementClick}
            isSelected={selectedElementId === "hero-subheadline"}
            as="p"
            className={cn(
              "hero-subheadline max-w-xl text-pretty leading-relaxed animate-fade-in-up animate-delay-300",
              "text-lg md:text-xl text-muted-foreground" // Standard über Klasse
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

          {/* CTA */}
          <div className="hero-cta mt-4 flex flex-wrap items-center gap-4 animate-fade-in-up animate-delay-400">
            <Editable
              blockId={blockId || ""}
              elementId="hero-primary-cta"
              typography={ctaTypography}
              editable={editable}
              onElementClick={onElementClick}
              isSelected={selectedElementId === "hero-primary-cta"}
              data-element-id="primaryCta"
            >
              <Button
                size="lg"
                className={cn(
                  "group gap-2 text-base font-semibold",
                  isCalm ? "rounded-full px-8" : "rounded-md px-8 uppercase tracking-wide",
                )}
                style={{
                  ...heroPrimaryCtaShadow,
                  ...(resolvedCtaColor ||
                  resolvedCtaBgColor ||
                  resolvedCtaBorderColor ||
                  (ctaHovered && resolvedCtaHoverBgColor)
                    ? {
                        ...(resolvedCtaColor ? { color: resolvedCtaColor } : {}),
                        ...(resolvedCtaBgColor || (ctaHovered && resolvedCtaHoverBgColor)
                          ? {
                              backgroundColor:
                                (ctaHovered && resolvedCtaHoverBgColor) ? resolvedCtaHoverBgColor : resolvedCtaBgColor
                            }
                          : {}),
                        ...(resolvedCtaBorderColor
                          ? { borderColor: resolvedCtaBorderColor }
                          : {}),
                      }
                    : {}),
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
              <Editable
                blockId={blockId || ""}
                elementId="hero-secondary-cta"
                typography={playTypography}
                editable={editable}
                onElementClick={onElementClick}
                isSelected={selectedElementId === "hero-secondary-cta"}
                data-element-id="secondaryCta"
                as="div"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="group gap-2 rounded-md border-border/50 bg-transparent text-base uppercase tracking-wide text-foreground hover:bg-secondary hover:text-secondary-foreground"
                  style={{
                    ...heroSecondaryCtaShadow,
                    ...(resolvedPlayTextColor ||
                    resolvedPlayBgColor ||
                    resolvedPlayBorderColor ||
                    (playHovered && resolvedPlayHoverBgColor)
                      ? {
                          ...(resolvedPlayTextColor ? { color: resolvedPlayTextColor } : {}),
                          ...(resolvedPlayBgColor || (playHovered && resolvedPlayHoverBgColor)
                            ? {
                                backgroundColor:
                                  (playHovered && resolvedPlayHoverBgColor)
                                    ? resolvedPlayHoverBgColor
                                    : resolvedPlayBgColor
                              }
                            : {}),
                          ...(resolvedPlayBorderColor
                            ? { borderColor: resolvedPlayBorderColor }
                            : {}),
                        }
                      : {}),
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
            </Editable>
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
    </AnimatedBlock>
  )
}
