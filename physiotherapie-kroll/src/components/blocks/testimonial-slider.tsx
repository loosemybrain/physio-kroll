"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { BrandKey } from "@/components/brand/brandAssets"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface TestimonialSliderItem {
  id?: string
  quote: string
  name: string
  role?: string
  image?: string
  rating?: string
}

export interface TestimonialSliderBlockData {
  // CMS keys (preferred)
  headline?: string
  subheadline?: string

  // legacy / V0 keys (optional fallback)
  title?: string
  subtitle?: string

  background?: "none" | "muted" | "gradient"

  items?: TestimonialSliderItem[]

  autoplay?: boolean
  interval?: number
  showArrows?: boolean
  showDots?: boolean
}

export const testimonialSliderDefaults: TestimonialSliderBlockData = {
  headline: "",
  subheadline: "",
  background: "none",
  items: [],
  autoplay: false,
  interval: 6000,
  showArrows: true,
  showDots: true,
}

type InlineEditFn = (blockId: string, fieldPath: string, rect?: DOMRect) => void

type Props = {
  data: TestimonialSliderBlockData
  brand?: BrandKey | string
  editable?: boolean

  // required for inline edit
  blockId?: string
  onEditField?: InlineEditFn

  // optional (not needed for inline edit, but consistent with other blocks)
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
  
  // Shadow/Element Props
  elements?: Record<string, any>
}

function getRect(el: EventTarget | null): DOMRect | undefined {
  if (!el) return undefined
  const node = el as HTMLElement
  if (!node?.getBoundingClientRect) return undefined
  return node.getBoundingClientRect()
}

export function TestimonialSliderBlock({
  data,
  brand = "physiotherapy",
  editable = false,
  blockId,
  onEditField,
}: Props) {
  const isCalm = brand === "physiotherapy" || brand === "calm"

  const items = React.useMemo(() => {
    const raw = Array.isArray(data?.items) ? data.items : []
    // Filter very broken items, but keep empty strings editable if user wants
    return raw.filter((it) => typeof it === "object" && it !== null) as TestimonialSliderItem[]
  }, [data?.items])

  const headline =
    data?.headline ??
    data?.title ??
    (isCalm ? "Vertrauen, das man spürt" : "Resultate sprechen für sich")

  const subheadline =
    data?.subheadline ??
    data?.subtitle ??
    (isCalm ? "Das sagen unsere Patient:innen" : "Erfolgsgeschichten")

  const bg = data?.background ?? "none"
  const bgClass =
    bg === "muted"
      ? "bg-muted/30"
      : bg === "gradient"
        ? "bg-gradient-to-b from-muted/20 to-background"
        : ""

  const autoplay = Boolean(data?.autoplay ?? true)
  const interval = Number(data?.interval ?? 5500)
  const showArrows = Boolean(data?.showArrows ?? true)
  const showDots = Boolean(data?.showDots ?? true)

  const [index, setIndex] = React.useState(0)

  // keep index safe if items change
  React.useEffect(() => {
    if (items.length === 0) {
      setIndex(0)
      return
    }
    setIndex((prev) => Math.max(0, Math.min(prev, items.length - 1)))
  }, [items.length])

  React.useEffect(() => {
    if (!autoplay) return
    if (items.length <= 1) return
    const t = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, Math.max(1500, interval))
    return () => window.clearInterval(t)
  }, [autoplay, interval, items.length])

  const goPrev = React.useCallback(() => {
    if (items.length <= 1) return
    setIndex((prev) => (prev - 1 + items.length) % items.length)
  }, [items.length])

  const goNext = React.useCallback(() => {
    if (items.length <= 1) return
    setIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  const handleInlineEdit = React.useCallback(
    (e: React.MouseEvent, fieldPath: string) => {
      if (!editable) return
      if (!blockId) return
      if (!onEditField) return
      e.preventDefault()
      e.stopPropagation()
      onEditField(blockId, fieldPath, getRect(e.currentTarget))
    },
    [editable, blockId, onEditField]
  )

  const current = items[index]

  const ArrowButton = React.useCallback(
    ({
      dir,
      onClick,
      disabled,
    }: {
      dir: "prev" | "next"
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
      disabled?: boolean
    }) => {
      const Icon = dir === "prev" ? ChevronLeft : ChevronRight
      return (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={dir === "prev" ? "Vorheriges Testimonial" : "Nächstes Testimonial"}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm transition",
            "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30",
            "disabled:opacity-40 disabled:hover:bg-background"
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      )
    },
    []
  )

  return (
    <section className={cn("w-full px-6 py-16 md:px-10", bgClass || "bg-muted/30")}>
      <div className="mx-auto max-w-5xl">
        {/* Top label + headline */}
        <div className="mb-12 text-center">
          <p
            className={cn("mb-3 text-sm font-medium tracking-wide text-primary")}
            onClick={(e) => handleInlineEdit(e, "subheadline")}
            role={editable ? "button" : undefined}
            tabIndex={editable ? 0 : undefined}
          >
            {subheadline}
          </p>

          <h2
            className={cn(
              "text-balance",
              isCalm
                ? "font-serif text-3xl font-semibold tracking-tight text-foreground md:text-5xl"
                : "font-sans text-3xl font-bold tracking-tight text-foreground md:text-5xl"
            )}
            onClick={(e) => handleInlineEdit(e, "headline")}
            role={editable ? "button" : undefined}
            tabIndex={editable ? 0 : undefined}
          >
            {headline}
          </h2>
        </div>

        {/* Slider Card */}
        <div className="relative rounded-3xl bg-background p-8 shadow-xl ring-1 ring-border/10 md:p-12">
          {items.length === 0 || !current ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              Keine Testimonials vorhanden. Bitte im Inspector unter „Items“ mindestens eins hinzufügen.
            </div>
          ) : (
            <div className="space-y-7">
              {/* Quote badge */}
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className={cn(isCalm ? "font-serif" : "font-sans", "text-2xl leading-none")}>❝</span>
              </div>

              {/* Quote */}
              <div
                className={cn(
                  "text-lg leading-relaxed text-foreground/80 md:text-xl",
                  isCalm ? "font-serif" : "font-sans"
                )}
                onClick={(e) => handleInlineEdit(e, `items.${index}.quote`)}
                role={editable ? "button" : undefined}
                tabIndex={editable ? 0 : undefined}
              >
                {current.quote}
              </div>

              {/* Person */}
              <div className="flex items-center gap-4 pt-2">
                {/* Avatar (optional) */}
                {current.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.image}
                    alt={current.name || "Testimonial"}
                    className="h-12 w-12 rounded-full object-cover ring-1 ring-border"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {(current.name?.trim()?.[0] ?? "•").toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="min-w-0 text-left">
                  <div
                    className="truncate text-base font-semibold text-foreground"
                    onClick={(e) => handleInlineEdit(e, `items.${index}.name`)}
                    role={editable ? "button" : undefined}
                    tabIndex={editable ? 0 : undefined}
                  >
                    {current.name}
                  </div>

                  {typeof current.role !== "undefined" && (
                    <div
                      className="truncate text-sm text-muted-foreground"
                      onClick={(e) => handleInlineEdit(e, `items.${index}.role`)}
                      role={editable ? "button" : undefined}
                      tabIndex={editable ? 0 : undefined}
                    >
                      {current.role || " "}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls BELOW card (Bild 2 Look) */}
        {(showArrows || showDots) && items.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-6">
            {showArrows ? (
              <ArrowButton
                dir="prev"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goPrev()
                }}
              />
            ) : null}

            {showDots ? (
              <div className="flex items-center gap-2">
                {items.map((_, i) => (
                  <button
                    key={items[i]?.id ?? i}
                    type="button"
                    aria-label={`Testimonial ${i + 1}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIndex(i)
                    }}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full transition",
                      i === index ? "bg-primary" : "bg-muted ring-1 ring-border/20"
                    )}
                  />
                ))}
              </div>
            ) : null}

            {showArrows ? (
              <ArrowButton
                dir="next"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goNext()
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
