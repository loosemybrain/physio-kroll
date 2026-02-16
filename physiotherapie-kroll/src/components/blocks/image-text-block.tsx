"use client"

import * as React from "react"
import Image from "next/image"
import { motion, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { CardSurface } from "@/components/ui/card"
import { useElementShadowStyle } from "@/lib/shadow"
import { resolveButtonPresetStyles } from "@/lib/buttonPresets"
import { Editable } from "@/components/editor/Editable"
import type { ImageTextStyle } from "@/types/cms"

interface ImageTextBlockProps {
  section?: unknown
  typography?: unknown

  // Content
  eyebrow?: string
  headline?: string
  content: string

  // Image
  imageUrl: string
  imageAlt: string
  imagePosition?: "left" | "right"

  // CTA
  ctaText?: string
  ctaHref?: string

  // Styling
  background?: "none" | "muted" | "gradient"
  backgroundColor?: string
  eyebrowColor?: string
  headlineColor?: string
  contentColor?: string
  ctaTextColor?: string
  ctaBgColor?: string
  ctaHoverBgColor?: string
  ctaBorderColor?: string

  // Design System
  designPreset?: string
  style?: ImageTextStyle

  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null

  buttonPreset?: string
}

// ============================================================================
// Constants
// ============================================================================

const maxWidthClasses: Record<string, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
}

const paddingYClasses: Record<string, string> = {
  none: "py-0",
  sm: "py-8 md:py-10",
  md: "py-10 md:py-14 lg:py-16",
  lg: "py-14 md:py-20 lg:py-24",
  xl: "py-20 md:py-28 lg:py-32",
}

const paddingXClasses: Record<string, string> = {
  sm: "px-4",
  md: "px-4 sm:px-6",
  lg: "px-6 sm:px-8",
}

const verticalAlignClasses: Record<string, string> = {
  top: "items-start",
  center: "items-center",
}

const textAlignClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
}

const aspectRatioClasses: Record<string, string> = {
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-video",
  "1/1": "aspect-square",
  "3/2": "aspect-[3/2]",
}

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
}

// ============================================================================
// Design Presets
// ============================================================================

const designPresets: Record<string, { style: ImageTextStyle; background?: "none" | "muted" | "gradient"; imagePosition?: "left" | "right" }> = {
  standard: {
    style: { variant: "default", verticalAlign: "center", textAlign: "left", maxWidth: "lg", paddingY: "md", paddingX: "md" },
    background: "none",
    imagePosition: "left",
  },
  soft: {
    style: { variant: "soft", verticalAlign: "center", textAlign: "left", maxWidth: "lg", paddingY: "md", paddingX: "md" },
    background: "muted",
    imagePosition: "left",
  },
  softCentered: {
    style: { variant: "soft", verticalAlign: "center", textAlign: "center", maxWidth: "lg", paddingY: "md", paddingX: "md" },
    background: "muted",
    imagePosition: "left",
  },
  imageRight: {
    style: { variant: "default", verticalAlign: "center", textAlign: "left", maxWidth: "lg", paddingY: "md", paddingX: "md" },
    background: "none",
    imagePosition: "right",
  },
  imageRightCentered: {
    style: { variant: "default", verticalAlign: "center", textAlign: "center", maxWidth: "lg", paddingY: "md", paddingX: "md" },
    background: "none",
    imagePosition: "right",
  },
  topAligned: {
    style: { variant: "default", verticalAlign: "top", textAlign: "left", maxWidth: "lg", paddingY: "md", paddingX: "md" },
    background: "none",
    imagePosition: "left",
  },
}

// ============================================================================
// Helpers
// ============================================================================

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getElementConfig(elementId: string, canonical: string, elements: Record<string, any> | undefined) {
  return elements?.[canonical] ?? elements?.[elementId]
}

export function ImageTextBlock(props: ImageTextBlockProps) {
  const {
    eyebrow,
    headline,
    content,
    imageUrl,
    imageAlt,
    imagePosition: imagePosOverride,
    ctaText,
    ctaHref,
    background: bgOverride,
    backgroundColor,
    eyebrowColor,
    headlineColor,
    contentColor,
    ctaTextColor,
    ctaBgColor,
    ctaHoverBgColor,
    ctaBorderColor,
    designPreset,
    style: styleOverride,
    editable = false,
    blockId,
    onEditField,
    elements,
    onElementClick,
    selectedElementId,
    buttonPreset,
  } = props

  const ctaPreset = resolveButtonPresetStyles(buttonPreset, undefined, undefined)

  // Resolve effective design from preset or overrides
  const preset = (designPreset && designPresets[designPreset]) || designPresets.standard
  const effectiveStyle: ImageTextStyle = styleOverride || preset.style
  const effectiveBackground = bgOverride || preset.background || "none"
  const effectiveImagePosition = imagePosOverride || preset.imagePosition || "left"

  // Element shadows with fallback (canonical key OR legacy key)
  const surfaceShadow = useElementShadowStyle({
    elementId: "imageText.surface",
    elementConfig: getElementConfig("imageText.surface", "imageText.surface", elements),
  })
  const imageShadow = useElementShadowStyle({
    elementId: "imageText.image",
    elementConfig: getElementConfig("imageText.image", "image", elements),
  })
  const eyebrowShadow = useElementShadowStyle({
    elementId: "imageText.eyebrow",
    elementConfig: getElementConfig("imageText.eyebrow", "eyebrow", elements),
  })
  const headlineShadow = useElementShadowStyle({
    elementId: "imageText.headline",
    elementConfig: getElementConfig("imageText.headline", "headline", elements),
  })
  const contentShadow = useElementShadowStyle({
    elementId: "imageText.content",
    elementConfig: getElementConfig("imageText.content", "content", elements),
  })
  const ctaShadow = useElementShadowStyle({
    elementId: "imageText.cta",
    elementConfig: getElementConfig("imageText.cta", "cta", elements),
  })

  const canInlineEdit = Boolean(editable && blockId && onEditField)
  const isImageLeft = effectiveImagePosition === "left"
  const [ctaHovered, setCtaHovered] = React.useState(false)
  const prefersNoMotion = prefersReducedMotion()

  const motionProps = prefersNoMotion
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, margin: "-60px" },
        variants: containerVariants,
      }

  const isSoft = effectiveStyle.variant === "soft"
  const bgClass =
    effectiveBackground === "muted"
      ? "bg-muted/30"
      : effectiveBackground === "gradient"
        ? "bg-gradient-to-b from-muted/20 to-background"
        : ""

  const ctaStyle: React.CSSProperties = {
    color: ctaTextColor || undefined,
    backgroundColor: ctaBgColor
      ? ctaHovered && ctaHoverBgColor
        ? ctaHoverBgColor
        : ctaBgColor
      : undefined,
    borderColor: ctaBorderColor || undefined,
  }

  function handleInlineEdit(e: React.MouseEvent, fieldPath: string, elementId?: string) {
    if (!canInlineEdit) return
    if (elementId && onElementClick) {
      onElementClick(blockId || "", elementId)
    }
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField?.(blockId || "", fieldPath, rect)
  }

  const verticalAlignClass = verticalAlignClasses[effectiveStyle.verticalAlign || "center"] || "items-center"
  const textAlignClass = textAlignClasses[effectiveStyle.textAlign || "left"] || "text-left"
  const maxWidthClass = maxWidthClasses[effectiveStyle.maxWidth || "lg"] || maxWidthClasses.lg
  const aspectRatioClass = aspectRatioClasses[effectiveStyle.imageAspectRatio || "4/3"] || aspectRatioClasses["4/3"]
  const paddingYClass = paddingYClasses[effectiveStyle.paddingY || "md"] || paddingYClasses.md
  const paddingXClass = paddingXClasses[effectiveStyle.paddingX || "md"] || paddingXClasses.md

  return (
    <Editable
      blockId={blockId || ""}
      elementId="imageText.surface"
      editable={editable}
      onElementClick={onElementClick}
      isSelected={selectedElementId === "imageText.surface"}
      className="w-full"
      as="div"
    >
      <CardSurface
        className={cn(
          "w-full bg-transparent border-0 shadow-none p-0"
          // bgClass removed; always transparent
        )}
      >
        <div
          className={cn(
            "rounded-3xl border border-border/50 overflow-hidden",
            bgClass
          )}
          style={{
            ...(backgroundColor ? { backgroundColor } : {}),
            ...(surfaceShadow as any),
          }}
        >
          <motion.div
            {...motionProps}
            className={cn(
              "mx-auto",
              paddingXClass,
              paddingYClass,
              maxWidthClass
            )}
          >
            <div
              className={cn(
                "grid gap-10 md:gap-12 lg:gap-20",
                isImageLeft
                  ? "md:grid-cols-[1.15fr_0.85fr]"
                  : "md:grid-cols-[0.85fr_1.15fr]",
                verticalAlignClass
              )}
            >
            {/* Image Column */}
            <motion.figure
              variants={prefersNoMotion ? undefined : imageVariants}
              className={cn(
                "relative overflow-hidden",
                // note: removed rounded-2xl, since .rounded-3xl and overflow-hidden are now on the panel
                isImageLeft ? "order-1 md:order-1" : "order-2 md:order-2",
                selectedElementId === "imageText.image" && "ring-2 ring-primary/30"
              )}
              data-block-id={blockId}
              data-element-id="imageText.image"
              style={imageShadow}
              onClick={(e) => {
                onElementClick?.(blockId || "", "imageText.image")
              }}
            >
              <div className={cn("relative w-full", aspectRatioClass, "min-h-[240px] md:min-h-[320px]")}>
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt={imageAlt ?? headline ?? ""}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={false}
                />
                {/* Subtle overlay for depth */}
                <div
                  className={cn(
                    "absolute inset-0",
                    isSoft
                      ? "bg-linear-to-t from-muted/20 to-transparent"
                      : "bg-linear-to-t from-background/10 to-transparent"
                  )}
                  aria-hidden="true"
                />
              </div>
            </motion.figure>

            {/* Text Column */}
            <div
              className={cn(
                "flex flex-col justify-center gap-6",
                isImageLeft ? "order-2 md:order-2" : "order-1 md:order-1",
                textAlignClass
              )}
            >
              {/* Eyebrow */}
              {eyebrow && (
                <motion.div variants={prefersNoMotion ? undefined : itemVariants}>
                  <Editable
                    blockId={blockId || ""}
                    elementId="imageText.eyebrow"
                    editable={editable}
                    onElementClick={onElementClick}
                    isSelected={selectedElementId === "imageText.eyebrow"}
                    className={cn(
                      "inline-block text-xs font-medium uppercase tracking-wider text-primary"
                    )}
                    as="span"
                    style={eyebrowShadow}
                  >
                    {eyebrow}
                  </Editable>
                </motion.div>
              )}

              {/* Headline */}
              {headline && (
                <motion.div variants={prefersNoMotion ? undefined : itemVariants}>
                  <Editable
                    blockId={blockId || ""}
                    elementId="imageText.headline"
                    editable={editable}
                    onElementClick={onElementClick}
                    isSelected={selectedElementId === "imageText.headline"}
                    className={cn(
                      "text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
                    )}
                    as="h2"
                    style={{
                      ...headlineShadow,
                      ...(headlineColor ? { color: headlineColor } : {}),
                    }}
                  >
                    {headline}
                  </Editable>
                </motion.div>
              )}

              {/* Content */}
              <motion.div variants={prefersNoMotion ? undefined : itemVariants}>
                <Editable
                  blockId={blockId || ""}
                  elementId="imageText.content"
                  editable={editable}
                  onElementClick={onElementClick}
                  isSelected={selectedElementId === "imageText.content"}
                  className={cn(
                    "prose prose-neutral dark:prose-invert max-w-none text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8"
                  )}
                  as="div"
                  style={{
                    ...contentShadow,
                    ...(contentColor ? { color: contentColor } : {}),
                  }}
                >
                  {content}
                </Editable>
              </motion.div>

              {/* CTA */}
              {(ctaText || canInlineEdit) && (
                <motion.div
                  variants={prefersNoMotion ? undefined : itemVariants}
                  className={cn(
                    "pt-2",
                    effectiveStyle.textAlign === "center" && "flex justify-center"
                  )}
                >
                  <Editable
                    blockId={blockId || ""}
                    elementId="imageText.cta"
                    editable={editable}
                    onElementClick={onElementClick}
                    isSelected={selectedElementId === "imageText.cta"}
                    className={cn(
                      "inline-block"
                    )}
                    as="div"
                    style={ctaShadow}
                  >
                    <Button
                      variant={ctaPreset.variant}
                      size="lg"
                      className={cn(
                        ctaPreset.className,
                        "group gap-2 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5"
                      )}
                      asChild={!canInlineEdit && !!ctaHref}
                      onClick={canInlineEdit ? (e) => {
                        e.stopPropagation()
                        handleInlineEdit(e, "ctaText", "imageText.cta")
                      } : undefined}
                      onMouseEnter={() => setCtaHovered(true)}
                      onMouseLeave={() => setCtaHovered(false)}
                      style={{
                        ...ctaStyle,
                        backgroundColor:
                          ctaHovered && ctaHoverBgColor
                            ? ctaHoverBgColor
                            : ctaBgColor || undefined,
                      }}
                    >
                      {!canInlineEdit && ctaHref ? (
                        <a href={ctaHref}>
                          <span
                            data-element-id="imageText.cta"
                          >
                            {ctaText || "Button"}
                          </span>
                          <ArrowRight
                            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <>
                          <span
                            data-element-id="imageText.cta"
                          >
                            {ctaText || "CTA"}
                          </span>
                          <ArrowRight
                            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </Button>
                  </Editable>
                </motion.div>
              )}
            </div>
          </div>
          </motion.div>
        </div>
      </CardSurface>
    </Editable>
  )
}
