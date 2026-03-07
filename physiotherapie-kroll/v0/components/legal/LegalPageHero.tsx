"use client"

import { cn } from "@/lib/utils"
import { FileText, Cookie, Building2, type LucideIcon } from "lucide-react"
import type { LegalPageType } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LegalPageHeroProps {
  type: LegalPageType
  title: string
  subtitle?: string
  introText?: string
  updatedAt?: string
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Icon Map                                                           */
/* ------------------------------------------------------------------ */

const iconMap: Record<LegalPageType, LucideIcon> = {
  datenschutz: FileText,
  cookies: Cookie,
  impressum: Building2,
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LegalPageHero({
  type,
  title,
  subtitle,
  introText,
  updatedAt,
  className,
}: LegalPageHeroProps) {
  const Icon = iconMap[type]

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border bg-secondary/50 py-16 md:py-20 lg:py-24",
        className,
      )}
    >
      {/* Decorative background glow */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        {/* Icon badge */}
        <div className="mb-6 flex justify-center md:justify-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-balance text-center text-3xl font-semibold tracking-tight text-foreground md:text-left md:text-4xl lg:text-5xl">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-3 text-center text-lg text-muted-foreground md:text-left md:text-xl">
            {subtitle}
          </p>
        )}

        {/* Intro text */}
        {introText && (
          <p className="mt-6 max-w-2xl text-center text-base leading-relaxed text-muted-foreground md:text-left">
            {introText}
          </p>
        )}

        {/* Last updated */}
        {updatedAt && (
          <p className="mt-6 text-center text-sm text-muted-foreground/70 md:text-left">
            Zuletzt aktualisiert:{" "}
            <time dateTime={updatedAt}>
              {new Date(updatedAt).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </p>
        )}
      </div>
    </section>
  )
}
