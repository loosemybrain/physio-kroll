"use client"

import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SectionBlockProps {
  blockId?: string
  editable?: boolean
  onEditField?: (
    blockId: string,
    fieldPath: string,
    anchorRect?: DOMRect,
  ) => void

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

  /** Secondary CTA (kept for backward compat) */
  primaryCtaText?: string
  primaryCtaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
}

/* ------------------------------------------------------------------ */
/*  Class maps                                                         */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Paragraph splitter                                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Framer-motion variants                                             */
/* ------------------------------------------------------------------ */

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
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SectionBlock({
  blockId,
  editable = false,
  onEditField,
  eyebrow,
  headline,
  subheadline,
  content,
  align = "left",
  justifyBias = "readable",
  maxWidth = "lg",
  background = "none",
  showDivider = false,
  enableGlow = true,
  enableHoverElevation = true,
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
}: SectionBlockProps) {
  const prefersReducedMotion = useReducedMotion()
  const isCentered = align === "center"
  const isJustified = align === "justify"

  // Resolve backward-compat CTA props
  const resolvedPrimaryText = ctaText || primaryCtaText
  const resolvedPrimaryHref = ctaHref || primaryCtaHref

  const [primaryHovered, setPrimaryHovered] = useState(false)
  const [surfaceHovered, setSurfaceHovered] = useState(false)

  const paragraphs = splitParagraphs(content)

  const handleInlineEdit = (
    e: React.MouseEvent,
    fieldPath: string,
  ) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  const hasCta =
    (resolvedPrimaryText && resolvedPrimaryHref) ||
    (secondaryCtaText && secondaryCtaHref)

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
        "relative overflow-hidden py-20 md:py-28 lg:py-32",
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
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
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
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
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
      {enableGlow && (background === "gradient-soft" || background === "gradient-brand") && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className={cn(
              "absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]",
              background === "gradient-brand"
                ? "bg-primary/[0.06]"
                : "bg-accent/[0.04]",
            )}
          />
        </div>
      )}

      {/* ---- Inner surface ---- */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            // Inner card surface with layered shadow system
            "rounded-3xl px-8 py-14 md:px-14 md:py-20",
            // Soft outer shadow with blue tint for brand
            background === "gradient-brand"
              ? "shadow-[0_4px_24px_-4px_oklch(0.45_0.12_160_/_0.06),0_12px_48px_-12px_oklch(0.45_0.12_160_/_0.08)]"
              : "shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04),0_12px_48px_-12px_rgba(0,0,0,0.06)]",
            // Background & border
            background === "muted"
              ? "border border-border/20 bg-card/80 backdrop-blur-md"
              : background === "gradient-soft" || background === "gradient-brand"
                ? "border border-border/15 bg-card/60 backdrop-blur-md"
                : "border border-transparent bg-transparent shadow-none",
            // Hover elevation
            enableHoverElevation &&
              background !== "none" &&
              "transition-all duration-500 ease-out",
            enableHoverElevation &&
              background !== "none" &&
              surfaceHovered &&
              (background === "gradient-brand"
                ? "scale-[1.008] shadow-[0_8px_32px_-4px_oklch(0.45_0.12_160_/_0.1),0_20px_64px_-16px_oklch(0.45_0.12_160_/_0.12)]"
                : "scale-[1.008] shadow-[0_8px_32px_-4px_rgba(0,0,0,0.06),0_20px_64px_-16px_rgba(0,0,0,0.1)]"),
          )}
          onMouseEnter={() => setSurfaceHovered(true)}
          onMouseLeave={() => setSurfaceHovered(false)}
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
                  className="h-px w-10 bg-gradient-to-r from-transparent via-primary/40 to-primary/60"
                  aria-hidden="true"
                />
                <span
                  onClick={(e) => handleInlineEdit(e, "eyebrow")}
                  data-element-id="section.eyebrow"
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.2em] text-primary/80",
                    editable &&
                      blockId &&
                      onEditField &&
                      "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                  )}
                  style={
                    eyebrowColor ? { color: eyebrowColor } : undefined
                  }
                >
                  {eyebrow}
                </span>
                {isCentered && (
                  <div
                    className="h-px w-10 bg-gradient-to-l from-transparent via-primary/40 to-primary/60"
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            )}

            {/* ---- Headline ---- */}
            <motion.h2
              variants={prefersReducedMotion ? undefined : itemVariants}
              onClick={(e) => handleInlineEdit(e, "headline")}
              data-element-id="section.headline"
              className={cn(
                "text-4xl font-semibold tracking-tight text-foreground md:text-5xl",
                isCentered && "text-balance",
                editable &&
                  blockId &&
                  onEditField &&
                  "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
              )}
              style={
                headlineColor ? { color: headlineColor } : undefined
              }
            >
              {headline}
            </motion.h2>

            {/* ---- Subheadline ---- */}
            {subheadline && (
              <motion.p
                variants={prefersReducedMotion ? undefined : itemVariants}
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                data-element-id="section.subheadline"
                className={cn(
                  "mt-4 text-lg text-muted-foreground/80 md:text-xl",
                  isCentered && "mx-auto max-w-2xl text-balance",
                  editable &&
                    blockId &&
                    onEditField &&
                    "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={
                  subheadlineColor
                    ? { color: subheadlineColor }
                    : undefined
                }
              >
                {subheadline}
              </motion.p>
            )}

            {/* ---- Divider ---- */}
            {showDivider && (
              <motion.div
                variants={prefersReducedMotion ? undefined : itemVariants}
                className={cn("my-8 flex", isCentered && "justify-center")}
              >
                <div
                  className={cn(
                    "h-px w-24",
                    background === "gradient-brand"
                      ? "bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10"
                      : "bg-gradient-to-r from-border/20 via-border/60 to-border/20",
                  )}
                  aria-hidden="true"
                />
              </motion.div>
            )}

            {/* ---- Content paragraphs ---- */}
            <motion.div
              variants={prefersReducedMotion ? undefined : itemVariants}
              onClick={(e) => handleInlineEdit(e, "content")}
              data-element-id="section.content"
              className={cn(
                showDivider ? "mt-2" : "mt-8",
                "space-y-5 text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8",
                alignTextMap[align],
                isJustified && justifyBiasMap[justifyBias],
                isCentered && "mx-auto max-w-2xl",
                editable &&
                  blockId &&
                  onEditField &&
                  "cursor-pointer rounded px-2 transition-colors hover:bg-primary/5",
              )}
              style={
                contentColor ? { color: contentColor } : undefined
              }
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
                  <div data-element-id="section.ctaPrimary">
                    {editable && blockId && onEditField ? (
                      <Button
                        size="lg"
                        className={cn(
                          "gap-2 rounded-xl px-8 text-base shadow-lg transition-all duration-300",
                          "hover:-translate-y-0.5 hover:shadow-xl",
                          background === "gradient-brand"
                            ? "hover:shadow-primary/25"
                            : "hover:shadow-primary/15",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        style={{
                          color: ctaTextColor || undefined,
                          backgroundColor: ctaBgColor
                            ? primaryHovered && ctaHoverBgColor
                              ? ctaHoverBgColor
                              : ctaBgColor
                            : undefined,
                          borderColor: ctaBorderColor || undefined,
                        }}
                        onMouseEnter={() => setPrimaryHovered(true)}
                        onMouseLeave={() => setPrimaryHovered(false)}
                        onClick={(e) =>
                          handleInlineEdit(e, "primaryCtaText")
                        }
                      >
                        {resolvedPrimaryText}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className={cn(
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
                  <div data-element-id="section.ctaSecondary">
                    {editable && blockId && onEditField ? (
                      <Button
                        size="lg"
                        variant="outline"
                        className={cn(
                          "gap-2 rounded-xl border-2 bg-transparent px-8 text-base transition-all duration-300",
                          "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        onClick={(e) =>
                          handleInlineEdit(e, "secondaryCtaText")
                        }
                      >
                        {secondaryCtaText}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant="outline"
                        className={cn(
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
