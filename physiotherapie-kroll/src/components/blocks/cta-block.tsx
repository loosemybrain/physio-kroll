"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
import type { BlockSectionProps } from "@/types/cms"

interface CtaBlockProps {
  section?: BlockSectionProps
  typography?: unknown
  headline: string
  subheadline?: string
  primaryCtaText: string
  primaryCtaHref: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  variant?: "default" | "centered" | "split"
  backgroundColor?: string
  headlineColor?: string
  subheadlineColor?: string
  primaryCtaTextColor?: string
  primaryCtaBgColor?: string
  primaryCtaHoverBgColor?: string
  primaryCtaBorderColor?: string
  secondaryCtaTextColor?: string
  secondaryCtaBgColor?: string
  secondaryCtaHoverBgColor?: string
  secondaryCtaBorderColor?: string
  
  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
}

export function CtaBlock({
  section,
  typography,
  headline,
  subheadline,
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  variant = "centered",
  backgroundColor,
  headlineColor,
  subheadlineColor,
  primaryCtaTextColor,
  primaryCtaBgColor,
  primaryCtaHoverBgColor,
  primaryCtaBorderColor,
  secondaryCtaTextColor,
  secondaryCtaBgColor,
  secondaryCtaHoverBgColor,
  secondaryCtaBorderColor,
  
  editable = false,
  blockId,
  onEditField,
}: CtaBlockProps) {
  const isCentered = variant === "centered"
  const isSplit = variant === "split"
  const [primaryHover, setPrimaryHover] = React.useState(false)
  const [secondaryHover, setSecondaryHover] = React.useState(false)
  
  const canInlineEdit = Boolean(editable && blockId && onEditField)
  
  // FIELD PATHS
  const FP = {
    headline: "headline",
    subheadline: "subheadline",
    primaryCtaText: "primaryCtaText",
    primaryCtaHref: "primaryCtaHref",
    secondaryCtaText: "secondaryCtaText",
    secondaryCtaHref: "secondaryCtaHref",
  } as const
  
  function handleInlineEdit(e: React.SyntheticEvent, fieldPath: string) {
    if (!canInlineEdit || !blockId || !onEditField) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const el = e.currentTarget as HTMLElement | null
    const rect = el?.getBoundingClientRect?.()
    onEditField(blockId, fieldPath, rect)
  }
  
  const dataBlockId = editable ? (blockId ?? undefined) : undefined
  const dataEditable = editable ? "true" : undefined

  return (
    <AnimatedBlock config={section?.animation}>
      <section
      className="py-16 px-4 bg-muted/50"
      style={backgroundColor ? ({ backgroundColor } as React.CSSProperties) : undefined}
      data-block-id={dataBlockId}
      data-editable={dataEditable}
    >
      <div className="container mx-auto">
        <div
          className={cn(
            "flex flex-col gap-6",
            isCentered && "items-center text-center max-w-2xl mx-auto",
            isSplit && "lg:flex-row lg:items-center lg:justify-between"
          )}
        >
          <div className={cn("flex-1", isSplit && "lg:max-w-xl")}>
            <h2
              className={cn(
                "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
                canInlineEdit && "cursor-pointer"
              )}
              style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              onClick={canInlineEdit ? (e) => handleInlineEdit(e, FP.headline) : undefined}
            >
              {headline}
            </h2>
            {(subheadline || canInlineEdit) && (
              <p
                className={cn(
                  "mt-4 text-lg text-muted-foreground",
                  canInlineEdit && "cursor-pointer"
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
                onClick={canInlineEdit ? (e) => handleInlineEdit(e, FP.subheadline) : undefined}
              >
                {subheadline || "(Subheadline)"}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex flex-wrap gap-4",
              isCentered && "justify-center",
              isSplit && "lg:shrink-0"
            )}
          >
            {/* Primary CTA */}
            {canInlineEdit ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="gap-2"
                  style={{
                    color: primaryCtaTextColor || undefined,
                    backgroundColor: primaryCtaBgColor
                      ? (primaryHover && primaryCtaHoverBgColor ? primaryCtaHoverBgColor : primaryCtaBgColor)
                      : undefined,
                    borderColor: primaryCtaBorderColor || undefined,
                  }}
                  onMouseEnter={() => setPrimaryHover(true)}
                  onMouseLeave={() => setPrimaryHover(false)}
                  onClick={(e) => handleInlineEdit(e, FP.primaryCtaText)}
                >
                  {primaryCtaText}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  onClick={(e) => handleInlineEdit(e, FP.primaryCtaHref)}
                >
                  Link
                </button>
              </div>
            ) : (
              <Button
                asChild
                size="lg"
                className="gap-2"
                style={{
                  color: primaryCtaTextColor || undefined,
                  backgroundColor: primaryCtaBgColor
                    ? (primaryHover && primaryCtaHoverBgColor ? primaryCtaHoverBgColor : primaryCtaBgColor)
                    : undefined,
                  borderColor: primaryCtaBorderColor || undefined,
                }}
                onMouseEnter={() => setPrimaryHover(true)}
                onMouseLeave={() => setPrimaryHover(false)}
              >
                <a href={primaryCtaHref}>
                  {primaryCtaText}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            )}
            
            {/* Secondary CTA */}
            {(secondaryCtaText || canInlineEdit) && (
              canInlineEdit ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    style={{
                      color: secondaryCtaTextColor || undefined,
                      backgroundColor: secondaryCtaBgColor
                        ? (secondaryHover && secondaryCtaHoverBgColor ? secondaryCtaHoverBgColor : secondaryCtaBgColor)
                        : undefined,
                      borderColor: secondaryCtaBorderColor || undefined,
                    }}
                    onMouseEnter={() => setSecondaryHover(true)}
                    onMouseLeave={() => setSecondaryHover(false)}
                    onClick={(e) => handleInlineEdit(e, FP.secondaryCtaText)}
                  >
                    {secondaryCtaText || "Secondary CTA"}
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={(e) => handleInlineEdit(e, FP.secondaryCtaHref)}
                  >
                    Link
                  </button>
                </div>
              ) : (
                secondaryCtaText &&
                secondaryCtaHref && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    style={{
                      color: secondaryCtaTextColor || undefined,
                      backgroundColor: secondaryCtaBgColor
                        ? (secondaryHover && secondaryCtaHoverBgColor ? secondaryCtaHoverBgColor : secondaryCtaBgColor)
                        : undefined,
                      borderColor: secondaryCtaBorderColor || undefined,
                    }}
                    onMouseEnter={() => setSecondaryHover(true)}
                    onMouseLeave={() => setSecondaryHover(false)}
                  >
                    <a href={secondaryCtaHref}>{secondaryCtaText}</a>
                  </Button>
                )
              )
            )}
          </div>
        </div>
      </div>
      </section>
    </AnimatedBlock>
  )
}
