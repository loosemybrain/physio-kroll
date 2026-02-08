"use client"

import { cn } from "@/lib/utils"
import { Carousel, CarouselDots, CarouselNextButton, CarouselPrevButton, CarouselSlide, CarouselTrack } from "@/components/ui/carousel"

export interface GalleryBlockProps {
  headline?: string
  subheadline?: string
  headlineColor?: string
  subheadlineColor?: string
  captionColor?: string
  images: Array<{
    id: string
    url: string
    alt: string
    caption?: string
    captionColor?: string
  }>
  columns?: 2 | 3 | 4
  showCaptions?: boolean
  variant?: "grid" | "slider"
  lightbox?: boolean
  background?: "none" | "muted" | "gradient"
  // CMS/Inline Edit Props
  editable?: boolean
  blockId?: string
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  // Shadow/Element Props
  elements?: Record<string, any>
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

const columnsMap: Record<NonNullable<GalleryBlockProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}

const backgroundMap: Record<NonNullable<GalleryBlockProps["background"]>, string> = {
  none: "",
  muted: "bg-muted/50",
  gradient: "bg-gradient-to-br from-primary/5 via-background to-background",
}

function coerceColumns(value: GalleryBlockProps["columns"]): 2 | 3 | 4 {
  if (value === 2 || value === 3 || value === 4) return value
  const n = typeof value === "string" ? Number(value) : Number.NaN
  if (n === 2 || n === 3 || n === 4) return n
  return 3
}

export function GalleryBlock({
  headline,
  subheadline,
  headlineColor,
  subheadlineColor,
  captionColor,
  images,
  columns = 3,
  showCaptions = true,
  variant = "grid",
  lightbox = false,
  background = "none",
  editable = false,
  blockId,
  onEditField,
}: GalleryBlockProps) {
  const handleInlineEdit = (e: React.MouseEvent, fieldPath: string) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  const resolvedColumns = coerceColumns(columns)
  const useSlider = variant === "slider" || lightbox === true

  return (
    <section className={cn("py-16", backgroundMap[background])} aria-label={headline || "Galerie"}>
      <div>
        {(headline || subheadline) && (
          <header className="mb-10 text-center">
            {headline && (
              <h2
                onClick={(e) => handleInlineEdit(e, "headline")}
                className={cn(
                  "text-3xl font-bold tracking-tight text-foreground md:text-4xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={headlineColor ? ({ color: headlineColor } as React.CSSProperties) : undefined}
              >
                {headline}
              </h2>
            )}
            {subheadline && (
              <p
                onClick={(e) => handleInlineEdit(e, "subheadline")}
                className={cn(
                  "mt-4 text-lg text-muted-foreground max-w-2xl mx-auto",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10",
                )}
                style={subheadlineColor ? ({ color: subheadlineColor } as React.CSSProperties) : undefined}
              >
                {subheadline}
              </p>
            )}
          </header>
        )}

        {useSlider ? (
          <div className="relative">
            <Carousel itemsCount={images.length} loop ariaLabel={headline || "Galerie"} draggable pauseOnHover peek>
              <CarouselTrack className="items-stretch">
                {images.map((img, index) => (
                  <CarouselSlide key={img.id} index={index} className="basis-full sm:basis-[85%] lg:basis-[75%]">
                    <figure className="group overflow-hidden rounded-xl border border-border bg-card">
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                        <img
                          src={img.url}
                          alt={img.alt || ""}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </div>
                      {showCaptions && typeof img.caption !== "undefined" && (
                        <figcaption
                          onClick={(e) => handleInlineEdit(e, `images.${index}.caption`)}
                          className={cn(
                            "px-4 py-3 text-sm text-muted-foreground",
                            editable && blockId && onEditField && "cursor-pointer transition-colors hover:bg-primary/10",
                          )}
                          style={(img.captionColor || captionColor) ? ({ color: (img.captionColor || captionColor) } as React.CSSProperties) : undefined}
                        >
                          {img.caption || "Caption…"}
                        </figcaption>
                      )}
                    </figure>
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
        ) : (
          <div className={cn("grid gap-4", columnsMap[resolvedColumns] || columnsMap[3])}>
            {images.map((img, index) => (
              <figure key={img.id} className="group overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                  {/* Use <img> (not next/image) to avoid remote domain config issues */}
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                {showCaptions && typeof img.caption !== "undefined" && (
                  <figcaption
                    onClick={(e) => handleInlineEdit(e, `images.${index}.caption`)}
                    className={cn(
                      "px-4 py-3 text-sm text-muted-foreground",
                      editable && blockId && onEditField && "cursor-pointer transition-colors hover:bg-primary/10",
                    )}
                    style={(img.captionColor || captionColor) ? ({ color: (img.captionColor || captionColor) } as React.CSSProperties) : undefined}
                  >
                    {img.caption || "Caption…"}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

