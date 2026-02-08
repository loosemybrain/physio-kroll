"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

export type TestimonialMood = "physiotherapy" | "physio-konzept"

interface Testimonial {
  id: string
  quote: string
  author: string
  role: string
  image?: string
}

interface TestimonialSliderProps {
  mood?: TestimonialMood
  testimonials?: Testimonial[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
}

const defaultTestimonials: Record<TestimonialMood, Testimonial[]> = {
  physiotherapy: [
    {
      id: "1",
      quote: "Nach meiner Knie-OP war ich hier in den besten Händen. Die einfühlsame Betreuung und professionelle Therapie haben mir geholfen, schneller wieder auf die Beine zu kommen.",
      author: "Maria Schneider",
      role: "Patientin seit 2022",
    },
    {
      id: "2",
      quote: "Die ganzheitliche Herangehensweise hat mir bei meinen chronischen Rückenschmerzen endlich Linderung gebracht. Ich bin sehr dankbar für das kompetente Team.",
      author: "Thomas Weber",
      role: "Patient seit 2021",
    },
    {
      id: "3",
      quote: "Vertrauensvoll, professionell und menschlich. Genau das, was man sich von einer Physiotherapie-Praxis wünscht.",
      author: "Anna Müller",
      role: "Patientin seit 2023",
    },
  ],
  "physio-konzept": [
    {
      id: "1",
      quote: "Dank PhysioKonzept habe ich meine Bestzeit im Marathon um 12 Minuten verbessert. Das individuelle Trainingskonzept ist unschlagbar!",
      author: "Markus Hoffmann",
      role: "Marathonläufer",
    },
    {
      id: "2",
      quote: "Nach meiner Sportverletzung bin ich stärker zurückgekommen als zuvor. Das Team versteht, was Athleten brauchen.",
      author: "Lisa Berger",
      role: "Triathletin",
    },
    {
      id: "3",
      quote: "Professionelles Training auf höchstem Niveau. Hier wird man gefordert und gefördert zugleich.",
      author: "Felix Kramer",
      role: "Crossfit Athlet",
    },
  ],
}

export function TestimonialSlider({
  mood = "physiotherapy",
  testimonials,
  autoPlay = true,
  autoPlayInterval = 5000,
  className,
}: TestimonialSliderProps) {
  const items = testimonials || defaultTestimonials[mood]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const isCalm = mood === "physiotherapy"

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }, [items.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  useEffect(() => {
    if (!autoPlay || isHovered) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, goToNext, isHovered])

  const currentTestimonial = items[currentIndex]

  return (
    <section
      className={cn(
        "testimonial-section relative w-full overflow-hidden py-16 md:py-24",
        isCalm ? "" : "physio-konzept",
        className
      )}
      aria-label="Kundenstimmen"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background */}
      <div className={cn("absolute inset-0 -z-10", isCalm ? "bg-muted/50" : "bg-background")} aria-hidden="true">
        {isCalm ? (
          <div className="absolute left-1/4 top-0 h-[300px] w-[300px] rounded-full bg-hero-accent/5 blur-3xl" />
        ) : (
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-hero-accent/10 blur-3xl" />
        )}
      </div>

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <header className={cn("mb-12 text-center", isCalm ? "" : "")}>
          <p
            className={cn(
              "testimonial-label mb-3 text-sm font-medium tracking-wide",
              isCalm ? "text-primary" : "uppercase text-primary"
            )}
          >
            {isCalm ? "Das sagen unsere Patienten" : "Erfolgsgeschichten"}
          </p>
          <h2
            className={cn(
              "testimonial-headline text-balance",
              isCalm
                ? "font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
                : "font-sans text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl"
            )}
          >
            {isCalm ? "Vertrauen, das man spürt" : "Resultate sprechen für sich"}
          </h2>
        </header>

        {/* Testimonial Card */}
        <div className="relative mx-auto max-w-3xl">
          <div
            className={cn(
              "testimonial-card relative overflow-hidden p-8 transition-all duration-300 md:p-12",
              isCalm
                ? "rounded-3xl bg-card shadow-lg"
                : "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm"
            )}
          >
            {/* Quote Icon */}
            <div
              className={cn(
                "testimonial-quote-icon mb-6 inline-flex items-center justify-center rounded-full p-3",
                isCalm ? "bg-primary/10" : "bg-primary/20"
              )}
              aria-hidden="true"
            >
              <Quote className={cn("h-6 w-6", isCalm ? "text-primary" : "text-primary")} />
            </div>

            {/* Quote Text */}
            <blockquote>
              <p
                className={cn(
                  "testimonial-quote mb-8 text-pretty leading-relaxed",
                  isCalm
                    ? "text-lg text-foreground md:text-xl"
                    : "text-lg font-medium text-foreground md:text-xl"
                )}
              >
                "{currentTestimonial.quote}"
              </p>

              {/* Author */}
              <footer className="testimonial-author flex items-center gap-4">
                {currentTestimonial.image ? (
                  <img
                    src={currentTestimonial.image || "/placeholder.svg"}
                    alt={currentTestimonial.author}
                    className={cn(
                      "h-12 w-12 object-cover",
                      isCalm ? "rounded-full" : "rounded-lg"
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center text-lg font-semibold",
                      isCalm
                        ? "rounded-full bg-primary/10 text-primary"
                        : "rounded-lg bg-primary/20 text-primary"
                    )}
                    aria-hidden="true"
                  >
                    {currentTestimonial.author.charAt(0)}
                  </div>
                )}
                <div>
                  <cite
                    className={cn(
                      "not-italic",
                      isCalm
                        ? "text-base font-semibold text-foreground"
                        : "text-base font-bold uppercase tracking-wide text-foreground"
                    )}
                  >
                    {currentTestimonial.author}
                  </cite>
                  <p className="text-sm text-muted-foreground">{currentTestimonial.role}</p>
                </div>
              </footer>
            </blockquote>
          </div>

          {/* Navigation Arrows */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              className={cn(
                "testimonial-nav-btn transition-all duration-200",
                isCalm
                  ? "rounded-full border-border/50 bg-card hover:bg-primary hover:text-primary-foreground"
                  : "rounded-lg border-border/50 bg-transparent hover:bg-primary hover:text-primary-foreground"
              )}
              aria-label="Vorheriges Testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial Navigation">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`Testimonial ${index + 1}`}
                  className={cn(
                    "testimonial-dot h-2 transition-all duration-300",
                    index === currentIndex
                      ? cn("w-6 bg-primary", isCalm ? "rounded-full" : "rounded-sm")
                      : cn(
                          "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                          isCalm ? "rounded-full" : "rounded-sm"
                        )
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              className={cn(
                "testimonial-nav-btn transition-all duration-200",
                isCalm
                  ? "rounded-full border-border/50 bg-card hover:bg-primary hover:text-primary-foreground"
                  : "rounded-lg border-border/50 bg-transparent hover:bg-primary hover:text-primary-foreground"
              )}
              aria-label="Nächstes Testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
