"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

interface ImageTextBlockProps {
  section?: unknown
  typography?: unknown
  imageUrl: string
  imageAlt: string
  imagePosition?: "left" | "right"
  headline?: string
  content: string
  ctaText?: string
  ctaHref?: string
  headlineColor?: string
  contentColor?: string
  ctaTextColor?: string
  ctaBgColor?: string
  ctaHoverBgColor?: string
  ctaBorderColor?: string
}

export function ImageTextBlock({
  imageUrl,
  imageAlt,
  imagePosition = "left",
  headline,
  content,
  ctaText,
  ctaHref,
  headlineColor,
  contentColor,
  ctaTextColor,
  ctaBgColor,
  ctaHoverBgColor,
  ctaBorderColor,
}: ImageTextBlockProps) {
  const isImageLeft = imagePosition === "left"
  const [ctaHovered, setCtaHovered] = useState(false)

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div
          className={cn(
            "flex flex-col gap-8 items-center",
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
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col gap-6">
            {headline && (
              <h2
                className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground"
              style={
                contentColor
                  ? ({
                      ["--tw-prose-body" as unknown as string]: contentColor,
                      color: contentColor,
                    } as React.CSSProperties)
                  : undefined
              }
              dangerouslySetInnerHTML={{ __html: content }}
            />
            {ctaText && ctaHref && (
              <div>
                <Button
                  asChild
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
                >
                  <a href={ctaHref}>
                    {ctaText}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
