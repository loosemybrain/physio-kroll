"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PublicPopup } from "@/types/popups"
import { Button } from "@/components/ui/button"
import { isImagePreloaded } from "@/lib/media/preloadImage"

type Props = {
  popup: PublicPopup
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When true, don't perform any persistence/dismiss logic here (caller owns it). */
  previewMode?: boolean
}

function overlayStyle(opacity: number | null | undefined): React.CSSProperties | undefined {
  if (opacity === null || opacity === undefined) return undefined
  const clamped = Math.max(0, Math.min(1, opacity))
  return { backgroundColor: `rgba(0,0,0,${clamped})` }
}

function clampDuration(value: number | null | undefined, fallback: number, min: number, max: number) {
  const raw = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.max(min, Math.min(max, Math.trunc(raw)))
}

function contentClasses(p: PublicPopup) {
  const size =
    // align with v0 sizing (sm/md/lg -> md=2xl, lg=4xl)
    p.size === "small" ? "max-w-md" : p.size === "large" ? "max-w-4xl" : "max-w-2xl"

  const position =
    p.position === "top_center"
      ? "sm:top-10 sm:translate-y-0"
      : p.position === "bottom_center"
        ? "sm:bottom-10 sm:top-auto sm:translate-y-0"
        : "sm:top-1/2 sm:-translate-y-1/2"

  // Mobile: bottom sheet (v0 direction), Desktop: respect position/size
  return cn(
    "fixed z-50 outline-none",
    // bottom sheet base
    "inset-x-0 bottom-0 w-full rounded-t-3xl border border-border/50 bg-card shadow-2xl",
    "max-h-[85vh] overflow-y-auto",
    // Desktop centering: avoid inset-x-auto overriding left
    "sm:left-1/2 sm:right-auto sm:bottom-auto sm:w-[92vw] sm:-translate-x-1/2",
    "sm:rounded-2xl sm:border sm:border-border/50 sm:bg-card",
    position,
    size
  )
}

/** Stabiler Bildbereich: feste Container-Fläche, kein Layout-Sprung; Skeleton bis Pixel da sind. */
function PopupCoverImage({
  src,
  containerClassName,
  imageClassName,
}: {
  src: string
  containerClassName: string
  imageClassName: string
}) {
  const [visible, setVisible] = React.useState(() => isImagePreloaded(src))
  React.useEffect(() => {
    if (isImagePreloaded(src)) {
      setVisible(true)
      return
    }
    setVisible(false)
  }, [src])
  return (
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      {!visible ? (
        <div className="absolute inset-0 z-0 animate-pulse bg-muted" aria-hidden />
      ) : null}
      <img
        src={src}
        alt=""
        className={cn(imageClassName, "relative z-1", visible ? "opacity-100" : "opacity-0")}
        loading="lazy"
        decoding="async"
        onLoad={() => setVisible(true)}
        onError={() => setVisible(true)}
      />
    </div>
  )
}

function shadowClass(preset: string | null) {
  if (!preset) return "shadow-lg"
  if (preset === "none") return "shadow-none"
  if (preset === "sm") return "shadow-sm"
  if (preset === "md") return "shadow-md"
  if (preset === "lg") return "shadow-lg"
  if (preset === "xl") return "shadow-xl"
  return "shadow-lg"
}

export function PopupModal({ popup, open, onOpenChange }: Props) {
  const closeLabel = popup.closeLabel?.trim() || "Schließen"
  const ctaLabel = popup.ctaLabel?.trim() || ""
  const ctaUrl = popup.ctaUrl?.trim() || ""

  const hasImage = popup.layoutVariant !== "no_image" && !!popup.imageUrl
  const layout = popup.layoutVariant

  const bgStyle: React.CSSProperties = popup.bgColor ? { backgroundColor: popup.bgColor } : {}
  const textStyle: React.CSSProperties = popup.textColor ? { color: popup.textColor } : {}
  const radiusStyle: React.CSSProperties = popup.borderRadius ? { borderRadius: popup.borderRadius } : {}
  const fadeInMs = clampDuration(popup.animationFadeInMs, 620, 100, 4000)
  const fadeOutMs = clampDuration(popup.animationFadeOutMs, 220, 80, 3000)
  const [contentVisible, setContentVisible] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setContentVisible(false)
      return
    }
    const raf = window.requestAnimationFrame(() => setContentVisible(true))
    return () => window.cancelAnimationFrame(raf)
  }, [open, popup.id, popup.animationVariant, fadeInMs])

  const innerTransition = `${fadeInMs}ms cubic-bezier(0.16, 1, 0.3, 1)`
  const innerStyle: React.CSSProperties =
    popup.animationVariant === "slide_up"
      ? {
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translate3d(0,0,0)" : "translate3d(0,18px,0)",
          transition: `opacity ${innerTransition}, transform ${innerTransition}`,
          willChange: "opacity, transform",
        }
      : popup.animationVariant === "scale"
        ? {
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "scale(1)" : "scale(0.96)",
            transition: `opacity ${innerTransition}, transform ${innerTransition}`,
            willChange: "opacity, transform",
          }
        : {
            opacity: contentVisible ? 1 : 0,
            transition: `opacity ${innerTransition}`,
            willChange: "opacity",
          }

  const resolveAnchorTarget = React.useCallback((rawHash: string): HTMLElement | null => {
    const hash = rawHash.replace(/^#/, "").trim()
    if (!hash) return null

    const direct = document.getElementById(hash)
    if (direct) return direct

    // Fallbacks for common anchor naming variants
    const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(hash)}"]`)
    if (byName) return byName

    // Contact-specific fallback: if no exact id exists, scroll to first form block
    if (/(contact|kontakt)/i.test(hash)) {
      const form = document.querySelector<HTMLElement>("form")
      if (form) {
        return form.closest("section, article, main, div") ?? form
      }
    }
    return null
  }, [])

  const handleCtaAction = React.useCallback(
    (href: string) => {
      const url = href.trim()
      if (!url) {
        onOpenChange(false)
        return
      }

      // Editorial shortcut values (no hash needed)
      if (/^(contact-form|kontaktformular|kontakt-formular)$/i.test(url)) {
        const target =
          resolveAnchorTarget("kontaktformular") ??
          resolveAnchorTarget("kontakt") ??
          document.querySelector<HTMLElement>("form")
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" })
          onOpenChange(false)
          return
        }
      }

      if (url.startsWith("#")) {
        const target = resolveAnchorTarget(url)
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" })
          onOpenChange(false)
          return
        }
      }

      // Default behavior for non-hash links
      window.open(url, "_blank", "noopener,noreferrer")
      onOpenChange(false)
    },
    [onOpenChange, resolveAnchorTarget]
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm popup-overlay-motion"
          )}
          style={{
            ...overlayStyle(popup.overlayOpacity),
            ["--popup-fade-in-ms" as any]: `${fadeInMs}ms`,
            ["--popup-fade-out-ms" as any]: `${fadeOutMs}ms`,
          }}
        />
        <DialogPrimitive.Content
          className={cn(contentClasses(popup), shadowClass(popup.shadowPreset))}
          style={{
            ...bgStyle,
            ...radiusStyle,
            ["--popup-fade-in-ms" as any]: `${fadeInMs}ms`,
            ["--popup-fade-out-ms" as any]: `${fadeOutMs}ms`,
          }}
          onPointerDownOutside={(e) => {
            if (!popup.closeOnOverlay) e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            if (!popup.closeOnEscape) e.preventDefault()
          }}
        >
          <div style={innerStyle}>
            {/* Mobile handle */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1 w-12 rounded-full bg-muted-foreground/30" />
            </div>

            {popup.showCloseIcon && popup.designVariant !== "promotion" && popup.designVariant !== "announcement" && (
              <DialogPrimitive.Close
                className={cn(
                  "absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg",
                  "opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  "hover:bg-muted"
                )}
              >
                <XIcon className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Schließen</span>
              </DialogPrimitive.Close>
            )}

            {popup.designVariant === "announcement" ? (
              <AnnouncementPopupContent
                popup={popup}
                hasImage={hasImage}
                layout={layout}
                textStyle={textStyle}
                showCloseIcon={popup.showCloseIcon}
                closeLabel={closeLabel}
                ctaLabel={ctaLabel}
                ctaUrl={ctaUrl}
                onCtaAction={handleCtaAction}
              />
            ) : (
              <PromotionPopupContent
                popup={popup}
                hasImage={hasImage}
                layout={layout}
                textStyle={textStyle}
                showCloseIcon={popup.showCloseIcon}
                closeLabel={closeLabel}
                ctaLabel={ctaLabel}
                ctaUrl={ctaUrl}
                onCtaAction={handleCtaAction}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function PopupBody({ popup, headlineClassName, bodyClassName }: { popup: PublicPopup; headlineClassName?: string; bodyClassName?: string }) {
  return (
    <div className="space-y-2">
      {popup.headline ? (
        <DialogPrimitive.Title className={cn("font-semibold leading-snug", headlineClassName)}>{popup.headline}</DialogPrimitive.Title>
      ) : (
        <DialogPrimitive.Title className="sr-only">Popup</DialogPrimitive.Title>
      )}
      {popup.body ? (
        <DialogPrimitive.Description className={cn("whitespace-pre-wrap", bodyClassName)}>
          {popup.body}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  )
}

function normalizeButtonVariant(v: string | null | undefined, fallback: "default" | "secondary" | "outline" | "ghost" | "destructive") {
  if (!v) return fallback
  if (v === "default" || v === "secondary" || v === "outline" || v === "ghost" || v === "destructive") return v
  return fallback
}

function PopupActions({
  closeLabel,
  ctaLabel,
  ctaUrl,
  primaryVariant,
  secondaryVariant,
  compact,
}: {
  closeLabel: string
  ctaLabel: string
  ctaUrl: string
  primaryVariant: "default" | "secondary" | "outline" | "ghost" | "destructive"
  secondaryVariant: "default" | "secondary" | "outline" | "ghost" | "destructive"
  compact?: boolean
}) {
  const hasCta = !!ctaLabel && !!ctaUrl
  const primary = hasCta ? (
    <Button asChild size={compact ? "default" : "lg"} variant={primaryVariant}>
      <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
        {ctaLabel}
      </a>
    </Button>
  ) : null

  const secondary = (
    <DialogPrimitive.Close asChild>
      <Button size={compact ? "default" : "lg"} variant={hasCta ? secondaryVariant : primaryVariant}>
        {closeLabel}
      </Button>
    </DialogPrimitive.Close>
  )

  return (
    <div
      className={cn(
        "mt-6 grid gap-2",
        hasCta ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        "sm:justify-end"
      )}
    >
      {hasCta ? secondary : null}
      {primary ?? secondary}
    </div>
  )
}

function PromotionActions({
  closeLabel,
  ctaLabel,
  ctaUrl,
  primaryVariant,
  onCtaAction,
}: {
  closeLabel: string
  ctaLabel: string
  ctaUrl: string
  primaryVariant: "default" | "secondary" | "outline" | "ghost" | "destructive"
  onCtaAction: (href: string) => void
}) {
  const hasCtaLabel = !!ctaLabel
  const hasCtaUrl = !!ctaUrl
  return (
    <div className="space-y-3 pt-4">
      {hasCtaLabel ? (
        hasCtaUrl ? (
          <Button className="w-full" size="lg" variant={primaryVariant} onClick={() => onCtaAction(ctaUrl)}>
            {ctaLabel}
          </Button>
        ) : (
          <DialogPrimitive.Close asChild>
            <Button className="w-full" size="lg" variant={primaryVariant}>
              {ctaLabel}
            </Button>
          </DialogPrimitive.Close>
        )
      ) : null}
      <DialogPrimitive.Close asChild>
        <Button className="w-full" size="lg" variant={hasCtaLabel ? "outline" : primaryVariant}>
          {closeLabel}
        </Button>
      </DialogPrimitive.Close>
    </div>
  )
}

function PromotionPopupContent({
  popup,
  hasImage,
  layout,
  textStyle,
  showCloseIcon,
  closeLabel,
  ctaLabel,
  ctaUrl,
  onCtaAction,
}: {
  popup: PublicPopup
  hasImage: boolean
  layout: PublicPopup["layoutVariant"]
  textStyle: React.CSSProperties
  showCloseIcon: boolean
  closeLabel: string
  ctaLabel: string
  ctaUrl: string
  onCtaAction: (href: string) => void
}) {
  const primaryVariant = normalizeButtonVariant(popup.buttonVariant, "default")

  const InlineClose = showCloseIcon ? (
    <DialogPrimitive.Close asChild>
      <button
        type="button"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg",
          "text-muted-foreground/90 hover:text-muted-foreground hover:bg-muted transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        )}
        aria-label="Schließen"
      >
        <XIcon className="h-5 w-5" />
      </button>
    </DialogPrimitive.Close>
  ) : null

  if (layout === "image_left") {
    return (
      <div className={cn("p-0")} style={textStyle}>
        <div className="flex flex-col overflow-hidden sm:max-h-96 sm:flex-row">
          {hasImage ? (
            <PopupCoverImage
              src={popup.imageUrl!}
              containerClassName="h-56 w-full sm:h-96 sm:w-64 sm:shrink-0"
              imageClassName="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className={cn("flex flex-col justify-between p-6 sm:p-8", !hasImage && "sm:w-full")}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <PopupBody
                  popup={popup}
                  headlineClassName="text-2xl font-bold sm:text-3xl"
                  bodyClassName="text-sm sm:text-base text-muted-foreground leading-relaxed"
                />
              </div>
              {InlineClose}
            </div>
            <PromotionActions
              closeLabel={closeLabel}
              ctaLabel={ctaLabel}
              ctaUrl={ctaUrl}
              primaryVariant={primaryVariant as any}
              onCtaAction={onCtaAction}
            />
          </div>
        </div>
      </div>
    )
  }

  // image_top or no_image
  return (
    <div className="p-0" style={textStyle}>
      {layout === "image_top" && hasImage ? (
        <div className="overflow-hidden bg-muted">
          <div className="relative h-56 w-full sm:h-80">
            <PopupCoverImage
              src={popup.imageUrl!}
              containerClassName="absolute inset-0"
              imageClassName="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 z-2 bg-linear-to-b from-transparent via-transparent to-card/50 pointer-events-none" />
          </div>
        </div>
      ) : null}
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <PopupBody
              popup={popup}
              headlineClassName="text-2xl font-bold sm:text-3xl"
              bodyClassName="text-sm sm:text-base text-muted-foreground leading-relaxed"
            />
          </div>
          {InlineClose}
        </div>
      </div>
      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
      <PromotionActions
        closeLabel={closeLabel}
        ctaLabel={ctaLabel}
        ctaUrl={ctaUrl}
        primaryVariant={primaryVariant as any}
        onCtaAction={onCtaAction}
      />
      </div>
    </div>
  )
}

function AnnouncementPopupContent({
  popup,
  hasImage,
  layout,
  textStyle,
  showCloseIcon,
  closeLabel,
  ctaLabel,
  ctaUrl,
  onCtaAction,
}: {
  popup: PublicPopup
  hasImage: boolean
  layout: PublicPopup["layoutVariant"]
  textStyle: React.CSSProperties
  showCloseIcon: boolean
  closeLabel: string
  ctaLabel: string
  ctaUrl: string
  onCtaAction: (href: string) => void
}) {
  const primaryVariant = normalizeButtonVariant(popup.buttonVariant, "secondary")

  const InlineClose = showCloseIcon ? (
    <DialogPrimitive.Close asChild>
      <button
        type="button"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-lg",
          "text-muted-foreground hover:bg-muted transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        )}
        aria-label="Schließen"
      >
        <XIcon className="h-5 w-5" />
      </button>
    </DialogPrimitive.Close>
  ) : null

  const hasCtaLabel = !!ctaLabel
  const hasCtaUrl = !!ctaUrl

  const AnnouncementActions = (
    <div className={cn("pt-4 space-y-3")}>
      {hasCtaLabel ? (
        hasCtaUrl ? (
          <Button className="w-full" size="lg" variant={primaryVariant} onClick={() => onCtaAction(ctaUrl)}>
            {ctaLabel}
          </Button>
        ) : (
          <DialogPrimitive.Close asChild>
            <Button className="w-full" size="lg" variant={primaryVariant}>
              {ctaLabel}
            </Button>
          </DialogPrimitive.Close>
        )
      ) : null}
      <DialogPrimitive.Close asChild>
        <Button className="w-full" size="lg" variant={hasCtaLabel ? "outline" : primaryVariant}>
          {closeLabel}
        </Button>
      </DialogPrimitive.Close>
    </div>
  )

  // v0-like split layout for announcement (image-left)
  if (layout === "image_left" && hasImage) {
    return (
      <div className="p-0" style={textStyle}>
        <div className="flex flex-col overflow-hidden sm:max-h-96 sm:flex-row">
          <PopupCoverImage
            src={popup.imageUrl!}
            containerClassName="h-56 w-full sm:h-96 sm:w-64 sm:shrink-0"
            imageClassName="absolute inset-0 h-full w-full object-cover"
          />
          <div className="flex flex-1 flex-col p-6 sm:p-8">
            {/* v0 structure: header row (headline + close) -> body -> actions bottom */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <PopupBody
                  popup={popup}
                  headlineClassName="text-xl font-bold sm:text-2xl"
                  bodyClassName="text-sm text-muted-foreground leading-relaxed"
                />
              </div>
              {InlineClose}
            </div>

            <div className="mt-auto">
              {AnnouncementActions}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-6 sm:p-7")} style={textStyle}>
      {layout === "image_top" && hasImage ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-border/50">
          <PopupCoverImage
            src={popup.imageUrl!}
            containerClassName="h-40 w-full"
            imageClassName="block h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4 text-center sm:text-left">
        <div className="min-w-0 flex-1">
          <PopupBody
            popup={popup}
            headlineClassName="text-lg font-semibold sm:text-xl"
            bodyClassName="text-sm text-muted-foreground leading-relaxed"
          />
        </div>
        {InlineClose}
      </div>

      {AnnouncementActions}
    </div>
  )
}

