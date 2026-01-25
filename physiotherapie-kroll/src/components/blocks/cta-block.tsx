"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface CtaBlockProps {
  section?: unknown
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
}

export function CtaBlock({
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
}: CtaBlockProps) {
  const isCentered = variant === "centered"
  const isSplit = variant === "split"
  const [primaryHover, setPrimaryHover] = useState(false)
  const [secondaryHover, setSecondaryHover] = useState(false)

  return (
    <section
      className="py-16 px-4 bg-muted/50"
      style={backgroundColor ? ({ backgroundColor } as React.CSSProperties) : undefined}
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
              className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
              style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
            >
              {headline}
            </h2>
            {subheadline && (
              <p
                className="mt-4 text-lg text-muted-foreground"
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
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
            {secondaryCtaText && secondaryCtaHref && (
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
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
