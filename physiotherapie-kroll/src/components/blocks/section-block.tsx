"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useElementShadowStyle } from "@/lib/shadow"

interface SectionBlockProps {
  section?: unknown
  typography?: unknown
  eyebrow?: string
  headline: string
  content: string
  align?: "left" | "center"
  maxWidth?: "md" | "lg" | "xl"
  primaryCtaText?: string
  primaryCtaHref?: string
  variant?: "default" | "soft"
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

const maxWidthMap = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
}

const backgroundMap = {
  none: "",
  muted: "bg-muted/50",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

export function SectionBlock({
  section,
  eyebrow,
  headline,
  content,
  align = "left",
  maxWidth = "lg",
  primaryCtaText,
  primaryCtaHref,
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
  editable = false,
  blockId,
  onEditField,
  elements,
  onElementClick,
  selectedElementId,
}: SectionBlockProps) {
  const isCentered = align === "center"
  const isSoft = variant === "soft"
  const [ctaHovered, setCtaHovered] = useState(false)

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
    elementId: "primaryCta",
    elementConfig: (elements ?? {})["primaryCta"],
  })

  // ✅ Full Background Flag (defensiv, da section unknown ist)
  const fullBackground = Boolean((section as any)?.fullBackground)

  // Inline edit helper
  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string, elementId?: string) => {
    if (!editable || !blockId || !onEditField) return
    if (elementId && onElementClick) {
      onElementClick(blockId, elementId)
    }
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  return (
    <section
      className={cn(
        // base vertical spacing
        variant === "soft" ? "py-20" : "py-16",

        // background preset
        backgroundMap[background],

        // ✅ only apply outer horizontal padding when NOT full-bleed
        !fullBackground && "px-4",

        // ✅ full-bleed escape (works even inside a container wrapper)
        fullBackground && "relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw]"
      )}
      style={backgroundColor ? ({ backgroundColor } as React.CSSProperties) : undefined}
    >
      {/* 
        IMPORTANT:
        - If fullBackground: this inner container defines the "normal block width"
        - If not fullBackground: behaves similar to before, but still consistent
      */}
      <div className={cn(fullBackground ? "mx-auto w-full max-w-7xl px-4" : "container mx-auto")}>
        <div
          className={cn(
            "mx-auto",
            maxWidthMap[maxWidth],
            isCentered && "text-center"
          )}
        >
          {/* Eyebrow */}
          {eyebrow && (
            <p
              onClick={(e) => handleInlineEdit(e, "eyebrow")}
              className={cn(
                "text-sm font-medium uppercase tracking-wider text-primary mb-4",
                editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
              )}
              style={eyebrowColor ? ({ color: eyebrowColor } as React.CSSProperties) : undefined}
            >
              {eyebrow}
            </p>
          )}

          {/* Headline */}
          <h2
            onClick={(e) => handleInlineEdit(e, "headline", "headline")}
            className={cn(
              "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
              isCentered && "mx-auto",
              editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
            )}
            style={{
              ...headlineShadow,
              ...(headlineColor ? { color: headlineColor } : {}),
            }}
            data-element-id="headline"
          >
            {headline}
          </h2>

          {/* Content */}
          <div
            onClick={(e) => handleInlineEdit(e, "content", "content")}
            className={cn(
              "mt-6 text-lg leading-relaxed text-muted-foreground",
              isCentered && "mx-auto",
              editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
            )}
            style={{
              ...contentShadow,
              ...(contentColor ? { color: contentColor } : {}),
            }}
            data-element-id="content"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* CTA Button */}
          {primaryCtaText && primaryCtaHref && (
            <div className={cn("mt-8", isCentered && "flex justify-center")} data-element-id="primaryCta" style={ctaShadow as any}>
              <Button
                size="lg"
                className="gap-2"
                style={{
                  color: ctaTextColor || undefined,
                  backgroundColor: ctaBgColor
                    ? (ctaHovered && ctaHoverBgColor ? ctaHoverBgColor : ctaBgColor)
                    : undefined,
                  borderColor: ctaBorderColor || undefined,
                }}
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
                onClick={editable && blockId && onEditField ? (e) => handleInlineEdit(e, "primaryCtaText", "primaryCta") : undefined}
                asChild={!editable && !!primaryCtaHref}
              >
                {!editable && primaryCtaHref ? (
                  <a href={primaryCtaHref}>
                    {primaryCtaText}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <>
                    <span
                      onClick={(e) => {
                        if (editable && blockId && onEditField) {
                          e.stopPropagation()
                          handleInlineEdit(e, "primaryCtaText")
                        }
                      }}
                      className={cn(editable && blockId && onEditField && "cursor-pointer")}
                    >
                      {primaryCtaText}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
