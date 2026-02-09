"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

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

  /** Visual variant */
  variant?: "default" | "soft" | "glass"

  /** Background style */
  background?: "none" | "muted" | "gradient"

  /** Color overrides */
  backgroundColor?: string
  eyebrowColor?: string
  headlineColor?: string
  contentColor?: string
  ctaTextColor?: string
  ctaBgColor?: string
  ctaHoverBgColor?: string
  ctaBorderColor?: string

  /** Primary CTA */
  primaryCtaText?: string
  primaryCtaHref?: string

  /** Secondary CTA */
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
  // Convert single \n within a paragraph to <br />
  const parts = text.split(/\n/)
  return (
    <p key={index}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </p>
  )
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
  content,
  align = "left",
  justifyBias = "readable",
  maxWidth = "lg",
  variant = "default",
  background = "none",
  backgroundColor,
  eyebrowColor,
  headlineColor,
  contentColor,
  ctaTextColor,
  ctaBgColor,
  ctaHoverBgColor,
  ctaBorderColor,
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
}: SectionBlockProps) {
  const isCentered = align === "center"
  const isJustified = align === "justify"
  const isGlass = variant === "glass"
  const isSoft = variant === "soft"

  const [revealed, setRevealed] = useState(false)
  const [ctaHovered, setPrimaryHovered] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // CSS-only-like reveal on mount via IntersectionObserver
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (prefersReduced) {
      setRevealed(true)
      return
    }

    const el = sectionRef.current
    if (!el) {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

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

  const hasCta = (primaryCtaText && primaryCtaHref) || (secondaryCtaText && secondaryCtaHref)

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative overflow-hidden",
        isSoft ? "py-20 md:py-28" : "py-16 md:py-24",
        background === "muted" && "bg-muted/10",
        background === "gradient" &&
          "bg-gradient-to-br from-primary/5 via-background to-background",
        background === "none" && "bg-background",
        // Reveal animation
        "transition-all duration-700 ease-out",
        revealed
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0",
      )}
      style={
        backgroundColor
          ? ({ backgroundColor } as React.CSSProperties)
          : undefined
      }
      aria-label={headline}
    >
      {/* Decorative background orbs for gradient variant */}
      {background === "gradient" && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-accent/[0.03] blur-3xl" />
        </div>
      )}

      {/* Glass wrapper or plain wrapper */}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className={cn(
            isGlass && [
              "rounded-3xl border border-border/30 bg-card/60 px-8 py-12 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] backdrop-blur-md md:px-14 md:py-16",
            ],
          )}
        >
          <div
            className={cn(
              maxWidthMap[maxWidth],
              alignContainerMap[align],
            )}
          >
            {/* ---- Eyebrow ---- */}
            {eyebrow && (
              <div
                className={cn(
                  "mb-5 flex items-center gap-3",
                  isCentered && "justify-center",
                )}
              >
                {/* Accent marker */}
                <div
                  className={cn(
                    "h-px w-8 bg-primary/50",
                    isCentered && "block",
                  )}
                  aria-hidden="true"
                />
                <span
                  onClick={(e) => handleInlineEdit(e, "eyebrow")}
                  data-element-id="section.eyebrow"
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.2em] text-primary",
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
                    className="h-px w-8 bg-primary/50"
                    aria-hidden="true"
                  />
                )}
              </div>
            )}

            {/* ---- Headline ---- */}
            <h2
              onClick={(e) => handleInlineEdit(e, "headline")}
              data-element-id="section.headline"
              className={cn(
                "text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
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
            </h2>

            {/* ---- Content paragraphs ---- */}
            <div
              onClick={(e) => handleInlineEdit(e, "content")}
              data-element-id="section.content"
              className={cn(
                "mt-8 space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8",
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
            </div>

            {/* ---- CTAs ---- */}
            {hasCta && (
              <div
                className={cn(
                  "mt-10 flex flex-wrap gap-4",
                  isCentered && "justify-center",
                )}
              >
                {/* Primary CTA */}
                {primaryCtaText && primaryCtaHref && (
                  <div data-element-id="section.ctaPrimary">
                    {editable && blockId && onEditField ? (
                      <Button
                        size="lg"
                        className={cn(
                          "gap-2 shadow-lg transition-all duration-300",
                          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        style={{
                          color: ctaTextColor || undefined,
                          backgroundColor: ctaBgColor
                            ? ctaHovered && ctaHoverBgColor
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
                        {primaryCtaText}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        className={cn(
                          "gap-2 shadow-lg transition-all duration-300",
                          "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        )}
                        style={{
                          color: ctaTextColor || undefined,
                          backgroundColor: ctaBgColor || undefined,
                          borderColor: ctaBorderColor || undefined,
                        }}
                        asChild
                      >
                        <a href={primaryCtaHref}>
                          {primaryCtaText}
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
                          "gap-2 border-2 bg-transparent transition-all duration-300",
                          "hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5",
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
                          "gap-2 border-2 bg-transparent transition-all duration-300",
                          "hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5",
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
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
