import { cn } from "@/lib/utils"

export type LegalHeroProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  introText?: string
  showUpdatedAt?: boolean
  updatedAtLabel?: string
  updatedAtValue?: string
  alignment?: "left" | "center"
  variant?: "default" | "minimal"
}

const spacingMap = {
  default: "py-16 md:py-20 lg:py-24 border-b border-border bg-muted/30",
  minimal: "py-12 md:py-14 border-b border-border",
}

export function LegalHero({
  eyebrow,
  title,
  subtitle,
  introText,
  showUpdatedAt,
  updatedAtLabel = "Zuletzt aktualisiert",
  updatedAtValue,
  alignment = "left",
  variant = "default",
}: LegalHeroProps) {
  const align = alignment === "center" ? "text-center" : "text-left"
  const alignFlex = alignment === "center" ? "justify-center" : "justify-start"

  return (
    <section className={cn("relative overflow-hidden", spacingMap[variant])}>
      <div className={cn("relative mx-auto max-w-4xl px-4 sm:px-6", align)}>
        {eyebrow != null && (
          <p data-cms-field="eyebrow" className={cn("mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground", align)}>
            {eyebrow}
          </p>
        )}
        <h1 data-cms-field="title" className={cn("text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl", align)}>
          {title}
        </h1>
        {subtitle !== undefined && (
          <p data-cms-field="subtitle" className={cn("mt-3 text-lg text-muted-foreground md:text-xl", align)}>
            {subtitle}
          </p>
        )}
        {introText !== undefined && (
          <p data-cms-field="introText" className={cn("mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground", align)}>
            {introText}
          </p>
        )}
        {showUpdatedAt && updatedAtValue && (
          <p className={cn("mt-6 text-sm text-muted-foreground/80", align)}>
            {updatedAtLabel}:{" "}
            <time dateTime={updatedAtValue}>
              {new Date(updatedAtValue).toLocaleDateString("de-DE", {
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
