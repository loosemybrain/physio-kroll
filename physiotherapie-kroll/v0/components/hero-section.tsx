"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Heart, Zap } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

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

const defaultContent: Record<
  HeroMood,
  { headline: string; subheadline: string; ctaText: string }
> = {
  physiotherapy: {
    headline: "Ihre Gesundheit in besten Handen",
    subheadline:
      "Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualitat.",
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
  const prefersReducedMotion = useReducedMotion()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  }

  const fadeUp = {
    hidden: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const fadeScale = {
    hidden: prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 0, scale: 0.96 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section
      className={cn(
        "relative min-h-[92vh] w-full overflow-hidden",
        isCalm ? "" : "physio-konzept",
      )}
      aria-labelledby="hero-headline"
    >
      {/* Background */}
      <div
        className="absolute inset-0 -z-10 bg-hero-bg"
        aria-hidden="true"
      >
        {isCalm ? (
          <>
            <div className="absolute -top-32 right-0 h-[700px] w-[700px] rounded-full bg-primary/[0.06] blur-[120px]" />
            <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-accent/[0.05] blur-[100px]" />
            <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-hero-highlight/50 blur-[80px]" />
          </>
        ) : (
          <>
            <div className="absolute -right-32 top-16 h-[600px] w-[600px] rounded-full bg-primary/[0.12] blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 h-[400px] w-[700px] rounded-full bg-primary/[0.06] blur-[100px]" />
          </>
        )}
      </div>

      <div className="container mx-auto flex min-h-[92vh] flex-col items-center justify-center gap-10 px-4 py-20 lg:flex-row lg:gap-16 lg:py-28">
        {/* Content */}
        <motion.header
          variants={container}
          initial="hidden"
          animate="show"
          className={cn(
            "flex max-w-2xl flex-1 flex-col gap-6",
            isCalm
              ? "items-start text-left"
              : "items-center text-center lg:items-start lg:text-left",
          )}
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm",
                isCalm
                  ? "border-primary/15 bg-primary/[0.06] text-primary"
                  : "border-primary/20 bg-primary/[0.08] text-primary",
              )}
            >
              {isCalm ? (
                <>
                  <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Vertrauen & Fürsorge</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Performance & Erfolg</span>
                </>
              )}
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            id="hero-headline"
            variants={fadeUp}
            className={cn(
              "text-balance",
              isCalm
                ? "font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl"
                : "font-sans text-4xl font-bold uppercase tracking-tight text-foreground md:text-5xl lg:text-7xl xl:text-8xl",
            )}
          >
            {headline || content.headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            className={cn(
              "max-w-xl text-pretty leading-relaxed",
              isCalm
                ? "text-lg text-muted-foreground md:text-xl"
                : "text-lg text-muted-foreground md:text-xl",
            )}
          >
            {subheadline || content.subheadline}
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp} className="mt-2 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className={cn(
                "group gap-2 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30",
                isCalm
                  ? "rounded-full px-8 py-6"
                  : "rounded-xl px-8 py-6 uppercase tracking-wide",
              )}
              onClick={onCtaClick}
              asChild={!!ctaHref}
            >
              {ctaHref ? (
                <a href={ctaHref}>
                  {ctaText || content.ctaText}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </a>
              ) : (
                <>
                  {ctaText || content.ctaText}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>

            {!isCalm && (
              <Button
                variant="outline"
                size="lg"
                className="group gap-2 rounded-xl border-border/50 bg-transparent px-8 py-6 text-base uppercase tracking-wide text-foreground hover:bg-secondary hover:text-secondary-foreground"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Video ansehen
              </Button>
            )}
          </motion.div>

          {/* Trust indicators */}
          {isCalm && (
            <motion.div
              variants={fadeUp}
              className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
            >
              {["Über 15 Jahre Erfahrung", "Alle Kassen", "Modernste Therapien"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </div>
                ),
              )}
            </motion.div>
          )}
        </motion.header>

        {/* Media */}
        {showMedia && (
          <motion.figure
            variants={fadeScale}
            initial="hidden"
            animate="show"
            className={cn(
              "relative flex-1",
              isCalm ? "max-w-lg" : "max-w-xl",
            )}
          >
            {mediaType === "video" && mediaUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-3xl shadow-2xl">
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
                  "relative overflow-hidden",
                  isCalm
                    ? "aspect-[4/5] rounded-[2rem] shadow-[0_8px_60px_-12px_rgba(0,0,0,0.15)]"
                    : "aspect-[3/4] rounded-3xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.25)]",
                )}
              >
                <img
                  src={
                    mediaUrl ||
                    (isCalm
                      ? "/images/hero-physio.jpg"
                      : "/images/hero-sport.jpg")
                  }
                  alt={
                    isCalm
                      ? "Professionelle Physiotherapie in moderner Umgebung"
                      : "Athlet beim intensiven Training"
                  }
                  className="h-full w-full object-cover"
                  loading="eager"
                />

                {/* Overlay */}
                {isCalm ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                )}

                {/* Floating card */}
                {!isCalm && (
                  <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-border/20 bg-card/90 p-5 backdrop-blur-md">
                    <p className="text-sm font-semibold uppercase tracking-wide text-card-foreground">
                      Nächstes Training
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      Heute, 18:00
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stat card */}
            {isCalm && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-5 -right-5 rounded-2xl border border-border/50 bg-card/95 p-6 shadow-xl backdrop-blur-sm md:-bottom-6 md:-right-6"
              >
                <p className="text-3xl font-bold text-primary">98%</p>
                <p className="text-sm text-muted-foreground">
                  Patientenzufriedenheit
                </p>
              </motion.div>
            )}
          </motion.figure>
        )}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div
          className={cn(
            "h-12 w-6 rounded-full border-2",
            isCalm ? "border-primary/20" : "border-primary/40",
          )}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn(
              "mx-auto mt-2 h-2 w-1 rounded-full",
              isCalm ? "bg-primary/40" : "bg-primary/70",
            )}
          />
        </div>
      </div>
    </section>
  )
}
