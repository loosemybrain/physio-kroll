"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion, cubicBezier } from "framer-motion"
import { useElementShadowStyle } from "@/lib/shadow"
import { resolveButtonPresetStyles } from "@/lib/buttonPresets"
import { mergeTypographyClasses } from "@/lib/typography"

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface SectionBlockProps {
  blockId?: string
  editable?: boolean
  onEditField?: (
    blockId: string,
    fieldPath: string,
    anchorRect?: DOMRect,
  ) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  elements?: Record<string, any>
  typography?: Record<string, any>

  eyebrow?: string
  headline: string
  subheadline?: string

  /** Supports paragraphs via \n\n splitting */
  content: string

  /** Text alignment */
  align?: "left" | "center" | "justify"

  /**
   * When align="justify", controls readability:
   * - none: plain text-justify
   * - readable: max-w-prose + hyphens-auto + text-pretty
   * - tight: slightly wider than prose, still hyphenated
   */
  justifyBias?: "none" | "readable" | "tight"

  /** Container width constraint */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full"

  /** Background variant */
  background?: "none" | "muted" | "gradient-soft" | "gradient-brand"

  /** Show decorative gradient divider between headline and content */
  showDivider?: boolean

  /** Enable decorative glow orb */
  enableGlow?: boolean

  /** Enable hover elevation on inner surface */
  enableHoverElevation?: boolean

  showCta?: boolean

  /** Divider custom color */
  dividerColor?: string

  /** Color overrides */
  backgroundColor?: string
  eyebrowColor?: string
  headlineColor?: string
  subheadlineColor?: string
  contentColor?: string
  ctaTextColor?: string
  ctaBgColor?: string
  ctaHoverBgColor?: string
  ctaBorderColor?: string

  /** Primary CTA */
  ctaText?: string
  ctaHref?: string

  /** Backward compat - old prop names */
  primaryCtaText?: string
  primaryCtaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string

  buttonPreset?: string
}

/* ================================================================ */
/*  Class maps                                                       */
/* ================================================================ */

const maxWidthMap: Record<string, string> = {
  sm: "max-w-xl",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-full",
}

const alignContainerMap: Record<string, string> = {
  left: "",
  center: "mx-auto text-center",
  justify: "",
}

const alignTextMap: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  justify: "text-justify",
}

const justifyBiasMap: Record<string, string> = {
  none: "",
  readable: "max-w-prose hyphens-auto break-words text-pretty",
  tight: "max-w-3xl hyphens-auto break-words text-pretty",
}

/* ================================================================ */
/*  Paragraph splitter                                               */
/* ================================================================ */

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function renderParagraph(text: string, index: number) {
  const parts = text.split(/\n/)
  return (
    <p key={index}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && <br />}
        </React.Fragment>
      ))}
    </p>
  )
}

/* ================================================================ */
/*  Framer-motion variants                                           */
/* ================================================================ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: cubicBezier(0.22, 1, 0.36, 1) },
  },
}

/* ================================================================ */
/*  Component                                                        */
/* ================================================================ */

export function SectionBlock({
  blockId,
  editable = false,
  onEditField,
  onElementClick,
  selectedElementId,
  eyebrow,
  headline,
  subheadline,
  content,
  align = "left",
  justifyBias = "readable",
  maxWidth = "lg",
  background = "none",
  showDivider,
  enableGlow = true,
  enableHoverElevation = true,
  showCta = true,
  dividerColor,
  backgroundColor,
  eyebrowColor,
  headlineColor,
  subheadlineColor,
  contentColor,
  ctaTextColor,
  ctaBgColor,
  ctaHoverBgColor,
  ctaBorderColor,
  ctaText,
  ctaHref,
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  buttonPreset,
  typography,
  elements,
  // Backward compat props (not in interface but may come from saved data)
  ...restProps
}: SectionBlockProps & Record<string, any>) {
  const prefersReducedMotion = useReducedMotion()
  const isCentered = align === "center"
  const isJustified = align === "justify"

  // Backward compatibility: resolve dividerColor from old props if not set
  const rawDividerColor =
    dividerColor ??
    restProps?.dividerColor ??
    restProps?.dividerFromColor ??
    restProps?.dividerViaColor ??
    restProps?.dividerToColor

  const resolvedDividerColor =
    typeof rawDividerColor === "string"
      ? rawDividerColor
      : (rawDividerColor?.value ?? rawDividerColor?.hex ?? rawDividerColor?.color)

  const hasDividerColor = Boolean((resolvedDividerColor ?? "").trim())

  // Resolve showDivider: handle string/boolean/missing/fallback
  const rawShowDivider =
    (typeof showDivider === "boolean" || showDivider === "true" || showDivider === "false")
      ? showDivider
      : restProps?.showDivider ?? restProps?.dividerEnabled

  const resolvedShowDivider =
    rawShowDivider === false
      ? false
      : rawShowDivider === true ||
        rawShowDivider === "true" ||
        hasDividerColor

  const primaryPreset = resolveButtonPresetStyles(buttonPreset, undefined, undefined)
  const secondaryPreset = resolveButtonPresetStyles(buttonPreset, "outline", undefined)

  // Resolve backward-compat CTA props - use nullish coalescing
  const resolvedPrimaryText = (ctaText ?? primaryCtaText)?.trim() || ""
  const resolvedPrimaryHref = ctaHref ?? primaryCtaHref
  const resolvedSecondaryText = (secondaryCtaText)?.trim() || ""
  const resolvedSecondaryHref = secondaryCtaHref

  const hasCta =
    showCta &&
    ((resolvedPrimaryText.length > 0 && resolvedPrimaryHref) ||
      (resolvedSecondaryText.length > 0 && resolvedSecondaryHref))

  // Element shadows
  const surfaceShadow = useElementShadowStyle({
    elementId: "section.surface",
    elementConfig: (elements ?? {})["section.surface"],
  })
  const eyebrowShadow = useElementShadowStyle({
    elementId: "section.eyebrow",
    elementConfig: (elements ?? {})["section.eyebrow"],
  })
  const headlineShadow = useElementShadowStyle({
    elementId: "section.headline",
    elementConfig: (elements ?? {})["section.headline"],
  })
  const subheadlineShadow = useElementShadowStyle({
    elementId: "section.subheadline",
    elementConfig: (elements ?? {})["section.subheadline"],
  })
  const dividerShadow = useElementShadowStyle({
    elementId: "section.divider",
    elementConfig: (elements ?? {})["section.divider"],
  })
  const contentShadow = useElementShadowStyle({
    elementId: "section.content",
    elementConfig: (elements ?? {})["section.content"],
  })
  const primaryCtaShadow = useElementShadowStyle({
    elementId: "section.ctaPrimary",
    elementConfig: (elements ?? {})["section.ctaPrimary"],
  })
  const secondaryCtaShadow = useElementShadowStyle({
    elementId: "section.ctaSecondary",
    elementConfig: (elements ?? {})["section.ctaSecondary"],
  })

  const handleInlineEdit = (
    e: React.MouseEvent,
    fieldPath: string,
    elementId?: string,
  ) => {
    if (!editable || !blockId || !onEditField) return
    if (elementId && onElementClick) {
      onElementClick(blockId, elementId)
    }
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  const [primaryHovered, setPrimaryHovered] = useState(false)
  const [surfaceHovered, setSurfaceHovered] = useState(false)

  const paragraphs = splitParagraphs(content)

  /* ---- Background classes ---- */
  const bgClasses = cn(
    background === "none" && "bg-background",
    background === "muted" && "bg-muted/30 backdrop-blur-sm",
    background === "gradient-soft" && "bg-background",
    background === "gradient-brand" && "bg-background",
  )

  return (
    <section
      className={cn(
        "relative rounded-3xl py-10 md:py-14 lg:py-16",
        bgClasses,
      )}
      style={
        backgroundColor
          ? ({ backgroundColor } as React.CSSProperties)
          : undefined
      }
      aria-label={headline}
    >
      {/* ---- Decorative background gradients ---- */}
      {background === "gradient-soft" && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden" aria-hidden="true">
          {/* Large radial glow from top center */}
          <div
            className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-[0.12]"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.55 0.1 160 / 0.5) 0%, transparent 70%)",
            }}
          />
          {/* Secondary subtle bottom-right warmth */}
          <div
            className="absolute bottom-0 right-0 h-[400px] w-[500px] translate-x-1/4 translate-y-1/4 rounded-full opacity-[0.06]"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.7 0.08 80 / 0.4) 0%, transparent 70%)",
            }}
          />
        </div>
      )}

      {background === "gradient-brand" && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden" aria-hidden="true">
          {/* Brand blue glow from top */}
          <div
            className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.15]"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.45 0.12 160 / 0.6) 0%, oklch(0.55 0.1 160 / 0.15) 40%, transparent 70%)",
            }}
          />
          {/* Subtle accent glow bottom-left */}
          <div
            className="absolute bottom-0 left-0 h-[350px] w-[450px] -translate-x-1/4 translate-y-1/4 rounded-full opacity-[0.08]"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.6 0.12 184 / 0.4) 0%, transparent 70%)",
            }}
          />
        </div>
      )}

      {/* ---- Decorative glow orb ---- */}
      {enableGlow && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden" aria-hidden="true">
          <div
            className={cn(
              "absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]",
              background === "gradient-brand"
                ? "bg-primary/6"
                : background === "gradient-soft"
                  ? "bg-accent/4"
                  : "bg-foreground/5"
            )}
          />
        </div>
      )}

      {/* ---- Inner surface ---- */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ---- Glow orb, unconditional, color based on background ---- */}
        {enableGlow && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className={cn(
                "absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]",
                background === "gradient-brand"
                  ? "bg-primary/6"
                  : background === "gradient-soft"
                    ? "bg-accent/4"
                    : "bg-foreground/5"
              )}
            />
          </div>
        )}

        <div
          className={cn(
            // Inner card surface with layered shadow system
            "rounded-3xl px-8 py-8 md:px-14 md:py-10",
            // Check if surface shadow is enabled
            (() => {
              const surfaceShadowEnabled = Boolean(elements?.["section.surface"]?.style?.shadow?.enabled)
              return cn(
                // Soft outer shadow with blue tint for brand
                background === "gradient-brand"
                  ? "shadow-[0_4px_24px_-4px_oklch(0.45_0.12_160_/_0.06),0_12px_48px_-12px_oklch(0.45_0.12_160_/_0.08)]"
                  : "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_12px_48px_-12px_rgba(0,0,0,0.06)]",
                // Background & border
                background === "muted"
                  ? "border border-border/20 bg-card/80 backdrop-blur-md"
                  : background === "gradient-soft" || background === "gradient-brand"
                    ? "border border-border/15 bg-card/60 backdrop-blur-md"
                    : surfaceShadowEnabled
                      ? "border border-border/20 bg-card/20 backdrop-blur-sm"
                      : "border border-transparent bg-transparent shadow-none",
                // Add subtle top border/ring when shadow is enabled for top edge visibility
                surfaceShadowEnabled && "ring-1 ring-inset ring-border/20",
              )
            })(),
            // Hover elevation (immer sichtbar)
            enableHoverElevation && "transition-all duration-500 ease-out",
            enableHoverElevation &&
              surfaceHovered &&
              (
                background === "gradient-brand"
                  ? "scale-[1.006] shadow-[0_8px_32px_-4px_oklch(0.45_0.12_160/0.1),0_20px_64px_-16px_oklch(0.45_0.12_160/0.12)]"
                  : (background === "gradient-soft" || background === "muted")
                    ? "scale-[1.006] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),0_20px_64px_-16px_rgba(0,0,0,0.1)]"
                    // Fallback für background="none"
                    : "scale-[1.006] ring-1 ring-border/25 bg-card/20 shadow-[0_8px_32px_-16px_rgba(0,0,0,0.10)]"
              ),
          )}
          onMouseEnter={() => setSurfaceHovered(true)}
          onMouseLeave={() => setSurfaceHovered(false)}
          data-element-id="section.surface"
          style={surfaceShadow}
          onClick={() => onElementClick?.(blockId || "", "section.surface")}
        >
          <motion.div
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial={prefersReducedMotion ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className={cn(
              maxWidthMap[maxWidth],
              alignContainerMap[align],
            )}
          >
            {/* ---- Eyebrow ---- */}
            {eyebrow && (
              <motion.div
                variants={prefersReducedMotion ? undefined : itemVariants}
                className={cn(
                  "mb-6 flex items-center gap-3",
                  isCentered && "justify-center",
                )}
              >
                <div
                  className="h-px w-10 bg-linear-to-r from-transparent via-primary/40 to-primary/60"
                  aria-hidden="true"
                />
                <span
                  onClick={(e) => handleInlineEdit(e, "eyebrow", "section.eyebrow")}
                  data-element-id="section.eyebrow"
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.2em] text-primary/80",
                    mergeTypographyClasses(
                      "text-xs font-semibold uppercase tracking-[0.2em] text-primary/80",
                      (typography ?? {})["section.eyebrow"]
                    ),
                    editable &&
                      blockId &&
                      onEditField &&
                      "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={{
                    ...eyebrowShadow,
                    ...(eyebrowColor ? { color: eyebrowColor } : {}),
                  }}
                >
                  {eyebrow}
                </span>
                {isCentered && (
                  <div
                    className="h-px w-10 bg-linear-to-l from-transparent via-primary/40 to-primary/60"
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            )}

            {/* ---- Headline ---- */}
            <motion.h2
              variants={prefersReducedMotion ? undefined : itemVariants}
              onClick={(e) => handleInlineEdit(e, "headline", "section.headline")}
              data-element-id="section.headline"
              className={cn(
                mergeTypographyClasses(
                  "text-4xl font-semibold tracking-tight text-foreground md:text-5xl",
                  (typography ?? {})["section.headline"]
                ),
                isCentered && "text-balance",
                editable &&
                  blockId &&
                  onEditField &&
                  "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
              )}
              style={{
                ...headlineShadow,
                ...(headlineColor ? { color: headlineColor } : {}),
              }}
            >
              {headline}
            </motion.h2>

            {/* ---- Subheadline ---- */}
            {subheadline && (
              <motion.p
                variants={prefersReducedMotion ? undefined : itemVariants}
                onClick={(e) => handleInlineEdit(e, "subheadline", "section.subheadline")}
                data-element-id="section.subheadline"
                className={cn(
                  mergeTypographyClasses(
                    "mt-4 text-lg text-muted-foreground/80 md:text-xl",
                    (typography ?? {})["section.subheadline"]
                  ),
                  isCentered && "mx-auto max-w-2xl text-balance",
                  editable &&
                    blockId &&
                    onEditField &&
                    "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={{
                  ...subheadlineShadow,
                  ...(subheadlineColor ? { color: subheadlineColor } : {}),
                }}
              >
                {subheadline}
              </motion.p>
            )}

            {/* ---- Divider ---- */}
            {resolvedShowDivider && (
              <motion.div
                variants={prefersReducedMotion ? undefined : itemVariants}
                className={cn("my-8 flex cursor-pointer", isCentered && "justify-center")}
                data-element-id="section.divider"
                style={dividerShadow}
                onClick={(e) => {
                  if (editable && blockId && onElementClick) {
                    e.preventDefault()
                    e.stopPropagation()
                    onElementClick(blockId, "section.divider")
                  }
                }}
              >
                <div
                  className={cn("h-[2px] w-24 bg-foreground/20")}
                  style={hasDividerColor ? { backgroundColor: resolvedDividerColor } : undefined}
                  aria-hidden="true"
                />
              </motion.div>
            )}

            {/* ---- Content paragraphs ---- */}
            <motion.div
              variants={prefersReducedMotion ? undefined : itemVariants}
              onClick={(e) => handleInlineEdit(e, "content", "section.content")}
              data-element-id="section.content"
              className={cn(
                resolvedShowDivider ? "mt-2" : "mt-8",
                mergeTypographyClasses(
                  "space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8",
                  (typography ?? {})["section.content"]
                ),
                alignTextMap[align],
                isJustified && justifyBiasMap[justifyBias],
                isCentered && "mx-auto max-w-2xl",
                editable &&
                  blockId &&
                  onEditField &&
                  "cursor-pointer rounded px-2 transition-colors hover:bg-primary/5",
              )}
              style={{
                ...contentShadow,
                ...(contentColor ? { color: contentColor } : {}),
              }}
              lang="de"
            >
              {paragraphs.map((p, i) => renderParagraph(p, i))}
            </motion.div>

            {/* ---- CTAs ---- */}
            {hasCta && (
              <motion.div
                variants={prefersReducedMotion ? undefined : itemVariants}
                className={cn(
                  "mt-12 flex flex-wrap gap-4",
                  isCentered && "justify-center",
                )}
              >
                {/* Primary CTA */}
                {resolvedPrimaryText && resolvedPrimaryHref && (
                  <div
                    data-element-id="section.ctaPrimary"
                    style={primaryCtaShadow}
                    onClick={() => onElementClick?.(blockId || "", "section.ctaPrimary")}
                  >
                    {editable && blockId && onEditField ? (
                      <Button
                        variant={primaryPreset.variant}
                        size="lg"
                        className={cn(
                          primaryPreset.className,
                          mergeTypographyClasses(
                            "gap-2 rounded-xl px-8 text-base shadow-lg transition-all duration-300",
                            (typography ?? {})["section.ctaPrimary"]
                          ),
                          "hover:-translate-y-0.5 hover:shadow-xl",
                          background === "gradient-brand"
                            ? "hover:shadow-primary/25"
                            : "hover:shadow-primary/15",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        style={{
                          color: ctaTextColor || undefined,
                          backgroundColor:
                            primaryHovered && ctaHoverBgColor
                              ? ctaHoverBgColor
                              : ctaBgColor || undefined,
                          borderColor: ctaBorderColor || undefined,
                        }}
                        onMouseEnter={() => setPrimaryHovered(true)}
                        onMouseLeave={() => setPrimaryHovered(false)}
                        onClick={(e) =>
                          handleInlineEdit(e, "ctaText", "section.ctaPrimary")
                        }
                      >
                        {resolvedPrimaryText}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant={primaryPreset.variant}
                        size="lg"
                        className={cn(
                          primaryPreset.className,
                          "gap-2 rounded-xl px-8 text-base shadow-lg transition-all duration-300",
                          "hover:-translate-y-0.5 hover:shadow-xl",
                          background === "gradient-brand"
                            ? "hover:shadow-primary/25"
                            : "hover:shadow-primary/15",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        style={{
                          color: ctaTextColor || undefined,
                          backgroundColor: ctaBgColor || undefined,
                          borderColor: ctaBorderColor || undefined,
                        }}
                        asChild
                      >
                        <a href={resolvedPrimaryHref}>
                          {resolvedPrimaryText}
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* Secondary CTA */}
                {secondaryCtaText && secondaryCtaHref && (
                  <div
                    data-element-id="section.ctaSecondary"
                    style={secondaryCtaShadow}
                    onClick={() => onElementClick?.(blockId || "", "section.ctaSecondary")}
                  >
                    {editable && blockId && onEditField ? (
                      <Button
                        size="lg"
                        variant={secondaryPreset.variant}
                        className={cn(
                          secondaryPreset.className,
                          "gap-2 rounded-xl border-2 bg-transparent px-8 text-base transition-all duration-300",
                          "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        onClick={(e) =>
                          handleInlineEdit(e, "secondaryCtaText", "section.ctaSecondary")
                        }
                      >
                        {secondaryCtaText}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant={secondaryPreset.variant}
                        className={cn(
                          secondaryPreset.className,
                          "gap-2 rounded-xl border-2 bg-transparent px-8 text-base transition-all duration-300",
                          "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        asChild
                      >
                        <a href={secondaryCtaHref}>
                          {secondaryCtaText}
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
