"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Heart, Zap } from "lucide-react"

export type HeroMood = "physiotherapy" | "physio-konzept"

interface HeroSectionProps {
  mood?: HeroMood
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaHref?: string
  showMedia?: boolean
  mediaType?: "image" | "video"
  mediaUrl?: string
  onCtaClick?: () => void
}

const defaultContent: Record<HeroMood, { headline: string; subheadline: string; ctaText: string }> = {
  physiotherapy: {
    headline: "Ihre Gesundheit in besten Händen",
    subheadline:
      "Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualität.",
    ctaText: "Termin vereinbaren",
  },
  "physio-konzept": {
    headline: "Push Your Limits",
    subheadline:
      "Erreiche dein volles Potenzial mit individueller Trainingsbetreuung und sportphysiotherapeutischer Expertise.",
    ctaText: "Jetzt starten",
  },
}

export function HeroSection({
  mood = "physiotherapy",
  headline,
  subheadline,
  ctaText,
  ctaHref = "#contact",
  showMedia = true,
  mediaType = "image",
  mediaUrl,
  onCtaClick,
}: HeroSectionProps) {
  const content = defaultContent[mood]
  const isCalm = mood === "physiotherapy"

  return (
    <section
      className={cn("relative min-h-[90vh] w-full overflow-hidden", isCalm ? "" : "physio-konzept")}
      aria-labelledby="hero-headline"
    >
      {/* Background Layer */}
      <div className={cn("absolute inset-0 -z-10", isCalm ? "bg-hero-bg" : "bg-hero-bg")} aria-hidden="true">
        {/* Decorative elements - prepared for Framer Motion */}
        {isCalm ? (
          <div className="hero-decoration-calm absolute inset-0 opacity-30">
            <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-hero-accent/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-hero-highlight blur-2xl" />
          </div>
        ) : (
          <div className="hero-decoration-energetic absolute inset-0">
            <div className="absolute -right-20 top-20 h-[500px] w-[500px] rounded-full bg-hero-accent/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-[300px] w-[600px] rounded-full bg-hero-accent/10 blur-2xl" />
          </div>
        )}
      </div>

      <div className="container mx-auto flex min-h-[90vh] flex-col items-center justify-center gap-8 px-4 py-16 lg:flex-row lg:gap-12 lg:py-24">
        {/* Content */}
        <header
          className={cn(
            "hero-content flex max-w-2xl flex-1 flex-col gap-6",
            isCalm ? "items-start text-left" : "items-center text-center lg:items-start lg:text-left",
          )}
        >
          {/* Badge */}
          <div
            className={cn(
              "hero-badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              isCalm ? "bg-primary/10 text-primary" : "bg-primary/20 text-primary",
            )}
          >
            {isCalm ? (
              <>
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span>Vertrauen & Fürsorge</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" aria-hidden="true" />
                <span>Performance & Erfolg</span>
              </>
            )}
          </div>

          {/* Headline */}
          <h1
            id="hero-headline"
            className={cn(
              "hero-headline text-balance",
              isCalm
                ? "font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl"
                : "font-sans text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl lg:text-7xl",
            )}
          >
            {headline || content.headline}
          </h1>

          {/* Subheadline */}
          <p
            className={cn(
              "hero-subheadline max-w-xl text-pretty leading-relaxed",
              isCalm ? "text-lg text-muted-foreground md:text-xl" : "text-lg text-muted-foreground md:text-xl",
            )}
          >
            {subheadline || content.subheadline}
          </p>

          {/* CTA */}
          <div className="hero-cta mt-4 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className={cn(
                "group gap-2 text-base font-semibold",
                isCalm ? "rounded-full px-8" : "rounded-md px-8 uppercase tracking-wide",
              )}
              onClick={onCtaClick}
              asChild={!!ctaHref}
            >
              {ctaHref ? (
                <a href={ctaHref}>
                  {ctaText || content.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              ) : (
                <>
                  {ctaText || content.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </>
              )}
            </Button>

            {!isCalm && (
              <Button
                variant="outline"
                size="lg"
                className="group gap-2 rounded-md border-border/50 bg-transparent text-base uppercase tracking-wide text-foreground hover:bg-secondary hover:text-secondary-foreground"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Video ansehen
              </Button>
            )}
          </div>

          {/* Trust indicators for calm mood */}
          {isCalm && (
            <div className="hero-trust mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <span>Über 15 Jahre Erfahrung</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <span>Alle Kassen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <span>Modernste Therapien</span>
              </div>
            </div>
          )}
        </header>

        {/* Media Section */}
        {showMedia && (
          <figure className={cn("hero-media relative flex-1", isCalm ? "max-w-lg" : "max-w-xl")}>
            {mediaType === "video" && mediaUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl">
                <video
                  src={mediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                  aria-label="Physiotherapy treatment video"
                />
              </div>
            ) : (
              <div
                className={cn(
                  "relative overflow-hidden shadow-2xl",
                  isCalm ? "aspect-[4/5] rounded-3xl" : "aspect-[3/4] rounded-2xl",
                )}
              >
                <img
                  src={
                    mediaUrl ||
                    (isCalm
                      ? "/placeholder.svg?height=800&width=640&query=calm physiotherapy treatment massage wellness"
                      : "/placeholder.svg?height=800&width=600&query=athletic sports training fitness workout")
                  }
                  alt={
                    isCalm
                      ? "Professional physiotherapy treatment in a calm, welcoming environment"
                      : "Athlete training with focused determination and energy"
                  }
                  className="h-full w-full object-cover"
                  loading="eager"
                />

                {/* Overlay decorations */}
                {isCalm ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                )}

                {/* Floating card for PhysioKonzept */}
                {!isCalm && (
                  <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-card/90 p-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold uppercase tracking-wide text-card-foreground">
                      Nächstes Training
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">Heute, 18:00</p>
                  </div>
                )}
              </div>
            )}

            {/* Decorative floating element for calm mood */}
            {isCalm && (
              <div className="absolute -bottom-4 -right-4 rounded-2xl bg-card p-6 shadow-lg md:-bottom-6 md:-right-6">
                <p className="text-3xl font-bold text-primary">98%</p>
                <p className="text-sm text-muted-foreground">Patientenzufriedenheit</p>
              </div>
            )}
          </figure>
        )}
      </div>

      {/* Bottom scroll indicator */}
      <div className="hero-scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
        <div className={cn("h-12 w-6 rounded-full border-2", isCalm ? "border-primary/30" : "border-primary/50")}>
          <div
            className={cn("mx-auto mt-2 h-2 w-1 animate-bounce rounded-full", isCalm ? "bg-primary/50" : "bg-primary")}
          />
        </div>
      </div>
    </section>
  )
}
