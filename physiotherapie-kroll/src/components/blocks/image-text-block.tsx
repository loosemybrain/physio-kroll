"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
import type { BlockSectionProps } from "@/types/cms"
import { useElementShadowStyle } from "@/lib/shadow"

interface ImageTextBlockProps {
  section?: BlockSectionProps
  typography?: unknown

  // Content
  eyebrow?: string
  headline?: string
  content: string

  // Image
  imageUrl: string
  imageAlt: string
  imagePosition?: "left" | "right"

  // CTA (⚠️ falls eure Keys anders heißen: unten bei FIELD PATHS anpassen)
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

  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

export function ImageTextBlock(props: ImageTextBlockProps) {
  const {
    section,
    eyebrow,
    headline,
    content,

    imageUrl,
    imageAlt,
    imagePosition = "left",

    ctaText,
    ctaHref,

    background = "none",
    backgroundColor,
    eyebrowColor,
    headlineColor,
    contentColor,
    ctaTextColor,
    ctaBgColor,
    ctaHoverBgColor,
    ctaBorderColor,

    editable = false,
    blockId,
    onEditField,
    elements,
    onElementClick,
    selectedElementId,
  } = props

  // Element shadows
  const headlineShadow = useElementShadowStyle({
    elementId: "headline",
    elementConfig: (elements ?? {})["headline"],
  })
  const contentShadow = useElementShadowStyle({
    elementId: "content",
    elementConfig: (elements ?? {})["content"],
  })
  const ctaShadow = useElementShadowStyle({
    elementId: "cta",
    elementConfig: (elements ?? {})["cta"],
  })

  const canInlineEdit = Boolean(editable && blockId && onEditField)
  const isImageLeft = imagePosition === "left"
  const [ctaHovered, setCtaHovered] = React.useState(false)

  // FIELD PATHS (nur hier anpassen, falls eure ImageText-Keys anders heißen)
  const FP = {
    eyebrow: "eyebrow",
    headline: "headline",
    content: "content",
    ctaText: "ctaText", // <- ggf. auf "primaryCtaText" oder "buttonText" etc. ändern
    ctaHref: "ctaHref", // <- ggf. auf "primaryCtaHref" oder "buttonHref" etc. ändern
  } as const

  function handleInlineEdit(e: React.SyntheticEvent, fieldPath: string, elementId?: string) {
    if (!canInlineEdit || !blockId || !onEditField) return

    if (elementId && onElementClick) {
      onElementClick(blockId, elementId)
    }

    e.preventDefault()
    e.stopPropagation()

    const el = e.currentTarget as HTMLElement | null
    const rect = el?.getBoundingClientRect?.()
    onEditField(blockId, fieldPath, rect)
  }

  const bgClass =
    background === "muted"
      ? "bg-muted/30"
      : background === "gradient"
        ? "bg-gradient-to-b from-muted/20 to-background"
        : ""

  const sectionStyle: React.CSSProperties | undefined = backgroundColor
    ? { backgroundColor }
    : undefined

  const ctaStyle: React.CSSProperties = {
    color: ctaTextColor || undefined,
    backgroundColor: ctaBgColor
      ? ctaHovered && ctaHoverBgColor
        ? ctaHoverBgColor
        : ctaBgColor
      : undefined,
    borderColor: ctaBorderColor || undefined,
  }

  const dataBlockId = editable ? (blockId ?? undefined) : undefined
  const dataEditable = editable ? "true" : undefined
  
    return (
      <AnimatedBlock config={section?.animation}>
        <section
        className={cn("py-16 px-4", bgClass)}
        style={sectionStyle}
        data-block-id={dataBlockId}
        data-editable={dataEditable}
      >
      <div className="container mx-auto">
        <div
          className={cn(
            "flex flex-col gap-10 items-center",
            "lg:flex-row lg:gap-12",
            !isImageLeft && "lg:flex-row-reverse"
          )}
        >
          {/* Image */}
          <div className="flex-1 w-full">
            <div className="relative aspect-video lg:aspect-square overflow-hidden rounded-2xl shadow-lg">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={false}
              />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 flex flex-col gap-6">
            {eyebrow && (
              <div
                className={cn(
                  "text-sm font-medium tracking-wide uppercase text-muted-foreground",
                  canInlineEdit && "cursor-pointer"
                )}
                style={eyebrowColor ? ({ color: eyebrowColor } as React.CSSProperties) : undefined}
                onClick={canInlineEdit ? (e) => handleInlineEdit(e, FP.eyebrow) : undefined}
              >
                {eyebrow}
              </div>
            )}

            {headline && (
              <h2
                className={cn(
                  "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
                  canInlineEdit && "cursor-pointer"
                )}
                style={{
                  ...headlineShadow,
                  ...(headlineColor ? { color: headlineColor } : {}),
                }}
                data-element-id="headline"
                onClick={canInlineEdit ? (e) => handleInlineEdit(e, FP.headline, "headline") : undefined}
              >
                {headline}
              </h2>
            )}

            {/* Content clickable wrapper (wichtig für Live Preview Selection) */}
            <div
              className={cn(canInlineEdit && "cursor-pointer")}
              style={contentShadow as any}
              data-element-id="content"
              onClick={canInlineEdit ? (e) => handleInlineEdit(e, FP.content, "content") : undefined}
            >
              <div
                className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground"
                style={contentColor ? ({ color: contentColor } as React.CSSProperties) : undefined}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>

            {/* CTA */}
            {(ctaText || canInlineEdit) && (
              <div className="flex items-center gap-3" data-element-id="cta" style={ctaShadow as any}>
                {/* Admin Preview: Button darf nicht navigieren, sondern Inline-Edit öffnen */}
                {canInlineEdit ? (
                  <Button
                    type="button"
                    size="lg"
                    className="gap-2"
                    style={ctaStyle}
                    onMouseEnter={() => setCtaHovered(true)}
                    onMouseLeave={() => setCtaHovered(false)}
                    onClick={(e) => handleInlineEdit(e, FP.ctaText, "cta")}
                  >
                    {ctaText || "CTA"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  // Public: normales Link-Verhalten
                  ctaText &&
                  ctaHref && (
                    <Button
                      asChild
                      size="lg"
                      className="gap-2"
                      style={ctaStyle}
                      onMouseEnter={() => setCtaHovered(true)}
                      onMouseLeave={() => setCtaHovered(false)}
                    >
                      <a href={ctaHref}>
                        {ctaText}
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </Button>
                  )
                )}

                {/* Optional: Link separat editierbar machen (nur Preview) */}
                {canInlineEdit && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={(e) => handleInlineEdit(e, FP.ctaHref)}
                  >
                    Link bearbeiten
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </section>
      </AnimatedBlock>
    )
  }
