"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Carousel, CarouselDots, CarouselNextButton, CarouselPrevButton, CarouselSlide, CarouselTrack } from "@/components/ui/carousel"

export interface ImageSliderBlockProps {
  section?: unknown
  typography?: unknown
  headline?: string
  subheadline?: string

  headlineColor?: string
  subheadlineColor?: string
  cardBgColor?: string
  cardBorderColor?: string
  slideTitleColor?: string
  slideTextColor?: string

  slides: Array<{
    id: string
    url: string
    alt: string
    title?: string
    text?: string
    titleColor?: string
    textColor?: string
    cardBgColor?: string
    cardBorderColor?: string
  }>

  loop?: boolean
  autoplay?: boolean
  autoplayDelayMs?: number
  pauseOnHover?: boolean
  peek?: boolean

  background?: "none" | "muted" | "gradient"
}

const backgroundMap: Record<NonNullable<ImageSliderBlockProps["background"]>, string> = {
  none: "",
  muted: "bg-muted/50",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

export function ImageSliderBlock({
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  cardBgColor,
  cardBorderColor,
  slideTitleColor,
  slideTextColor,
  slides,
  loop = true,
  autoplay = false,
  autoplayDelayMs = 5000,
  pauseOnHover = true,
  peek = true,
  background = "none",
}: ImageSliderBlockProps) {
  return (
    <section className={cn("py-16 px-4", backgroundMap[background])} aria-label={headline || "Slider"}>
      <div className="container mx-auto">
        {(headline || subheadline) && (
          <header className="mb-10 text-center">
            {headline && (
              <h2
                className="text-3xl font-bold tracking-tight text-foreground md:text-4xl"
                style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        <div className="relative">
          <Carousel
            itemsCount={slides.length}
            loop={loop}
            autoplay={autoplay}
            autoplayDelayMs={autoplayDelayMs}
            pauseOnHover={pauseOnHover}
            peek={peek}
            ariaLabel={headline || "Bild-Slider"}
            draggable
          >
            <CarouselTrack className="items-stretch">
              {slides.map((s, index) => (
                <CarouselSlide key={s.id} index={index}>
                  <div
                    className="overflow-hidden rounded-xl border border-border bg-card"
                    style={{
                      backgroundColor: s.cardBgColor || cardBgColor || undefined,
                      borderColor: s.cardBorderColor || cardBorderColor || undefined,
                    }}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={s.url}
                        alt={s.alt || ""}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {(typeof s.title !== "undefined" || typeof s.text !== "undefined") && (
                      <div className="px-5 py-4">
                        {typeof s.title !== "undefined" && (
                          <div
                            className="text-base font-semibold text-foreground"
                            style={((s.titleColor || slideTitleColor) ? ({ color: (s.titleColor || slideTitleColor) } as React.CSSProperties) : undefined)}
                          >
                            {s.title || "Headline…"}
                          </div>
                        )}
                        {typeof s.text !== "undefined" && (
                          <div
                            className="mt-1 text-sm text-muted-foreground"
                            style={((s.textColor || slideTextColor) ? ({ color: (s.textColor || slideTextColor) } as React.CSSProperties) : undefined)}
                          >
                            {s.text || "Text…"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CarouselSlide>
              ))}
            </CarouselTrack>
            <div className="mt-6 flex items-center justify-center gap-3">
              <CarouselPrevButton className="h-9 w-9" />
              <CarouselDots />
              <CarouselNextButton className="h-9 w-9" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  )
}

