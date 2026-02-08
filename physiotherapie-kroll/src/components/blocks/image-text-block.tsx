"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AnimatedBlock } from "@/components/blocks/AnimatedBlock"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"
import { Editable } from "@/components/editor/Editable"
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

  const mediaShadow = useElementShadowStyle({
    elementId: "media",
    elementConfig: (elements ?? {})["media"],
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
  
  // Map our props to the v0 visual structure while keeping CMS editing behavior
  const isSoft = background === "muted"

  // Respect reduced motion preference (RevealOnScroll/AnimatedBlock handle animation)

  return (
    <AnimatedBlock config={section?.animation}>
      <section
        className={cn(
          "w-full",
          bgClass // uses muted/gradient/background
        )}
        style={sectionStyle} // use backgroundColor when set
        data-block-id={dataBlockId}
        data-editable={dataEditable}
        aria-labelledby={blockId ? `${blockId}-headline` : undefined}
      >
        <div className={cn("mx-auto px-4 py-16 md:py-24", "max-w-5xl")}>
          <div
            className={cn(
              "grid gap-10 md:grid-cols-2 md:gap-12 lg:gap-20",
              "items-center"
            )}
          >
            {/* Spaltenreihenfolge nach imagePosition */}
            {/* Mobil bleibt Reihenfolge, auf md: switchen */}
            {/* Order: Bild links (default), Text rechts. Wenn imagePosition = right: Text links, Bild rechts. */}
            {/*
              Bild-Spalte mit Shadow-Style und Inspector-Hooks
            */}
            {(() => {
              // Shadow für Image-Container aus Inspector holen
              const imageShadow = useElementShadowStyle({
                elementId: "image",
                elementConfig: (elements ?? {})["image"],
              });
              return (
                <figure
                  className={cn(
                    "relative overflow-hidden rounded-2xl",
                    isImageLeft ? "order-1" : "order-2",
                    "md:order-1", // Default auf md: Bild links
                    !isImageLeft && "md:order-2" // Wenn Bild rechts, auf md:+ rechts
                  )}
                  data-element-id="image"
                  style={imageShadow}
                  onClick={() => onElementClick?.(blockId || "", "image")}
                >
                  <div className="relative aspect-4/3 w-full">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={imageAlt ?? headline ?? ""}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      priority={false}
                    />
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
                </figure>
              );
            })()}

            <div
              className={cn(
                "flex flex-col justify-center gap-6",
                isImageLeft ? "order-2" : "order-1",
                "md:order-2", // Text default rechts
                !isImageLeft && "md:order-1" // Aber wenn Bild rechts → Text links
              )}
            >
              {eyebrow && (
                <Editable
                  blockId={blockId || ""}
                  elementId="eyebrow"
                  editable={editable}
                  onElementClick={onElementClick}
                  isSelected={selectedElementId === "eyebrow"}
                  as="span"
                  className="inline-block text-xs font-medium uppercase tracking-wider text-primary"
                >
                  <span
                    onClick={
                      canInlineEdit
                        ? (e) => handleInlineEdit(e, FP.eyebrow)
                        : undefined
                    }
                  >
                    {eyebrow}
                  </span>
                </Editable>
              )}

              {headline && (
                <Editable
                  blockId={blockId || ""}
                  elementId="headline"
                  editable={editable}
                  onElementClick={onElementClick}
                  isSelected={selectedElementId === "headline"}
                  as="h2"
                  className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl"
                  style={{
                    ...headlineShadow,
                    ...(headlineColor ? { color: headlineColor } : {}),
                  }}
                >
                  <span
                    id={blockId ? `${blockId}-headline` : undefined}
                    onClick={
                      canInlineEdit
                        ? (e) =>
                            handleInlineEdit(e, FP.headline, "headline")
                        : undefined
                    }
                  >
                    {headline}
                  </span>
                </Editable>
              )}

              <Editable
                blockId={blockId || ""}
                elementId="content"
                editable={editable}
                onElementClick={onElementClick}
                isSelected={selectedElementId === "content"}
                as="div"
                className="prose prose-neutral dark:prose-invert max-w-none text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8"
                style={{
                  ...contentShadow,
                  ...(contentColor ? { color: contentColor } : {}),
                }}
              >
                <div
                  onClick={
                    canInlineEdit
                      ? (e) => handleInlineEdit(e, FP.content, "content")
                      : undefined
                  }
                  className="whitespace-pre-line"
                >
                  {content}
                </div>
              </Editable>

              {(ctaText || canInlineEdit) && (
                <div
                  className={cn("pt-2", "flex", "gap-3", "items-center")}
                  // could move ctaShadow/style here if full area should be styled on click/inspection,
                  // but usually Button only below
                >
                  {canInlineEdit ? (
                    <Button
                      size="lg"
                      className="group gap-2 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5"
                      type="button"
                      onClick={(e) =>
                        handleInlineEdit(e, FP.ctaText, "cta")
                      }
                      style={{
                        ...ctaShadow,
                        ...ctaStyle,
                      }}
                    >
                      <Editable
                        blockId={blockId || ""}
                        elementId="cta"
                        editable={editable}
                        onElementClick={onElementClick}
                        isSelected={selectedElementId === "cta"}
                        as="span"
                      >
                        {ctaText || "CTA"}
                      </Editable>
                      <ArrowRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Button>
                  ) : ctaHref ? (
                    <Button
                      size="lg"
                      asChild
                      className="group gap-2 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        ...ctaShadow,
                        ...ctaStyle,
                      }}
                    >
                      <a href={ctaHref}>
                        {ctaText}
                        <ArrowRight
                          className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="group gap-2 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        ...ctaShadow,
                        ...ctaStyle,
                      }}
                    >
                      {ctaText}
                      <ArrowRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Button>
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
