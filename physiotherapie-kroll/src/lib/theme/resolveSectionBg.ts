import type { BlockSectionProps } from "@/types/cms"
import { cn } from "@/lib/utils"

export interface SectionBgResult {
  className: string
  style?: React.CSSProperties
  hasDecorativeOverlay?: boolean
}

/**
 * Resolves section background props to className + styles
 * Handles: transparent, solid color, gradients, images, videos
 * 
 * Rules:
 * - transparent → no bg class, empty style
 * - color → backgroundColor style
 * - gradient → className (from preset) OR style.backgroundImage (custom)
 * - image/video → backgroundImage style
 * - Always safe for no-overflow (caller adds overflow-x-hidden if needed)
 */
export function resolveSectionBg(section?: BlockSectionProps): SectionBgResult {
  if (!section || !section.background) {
    return {
      className: "",
      style: undefined,
    }
  }

  const bg = section.background
  const style: React.CSSProperties = {}

  // Handle background type
  switch (bg.type) {
    case "none":
      return {
        className: "",
        style: undefined,
      }

    case "color":
      if (bg.color?.value) {
        style.backgroundColor = bg.color.value
        // Add overlay if specified
        if (bg.color.overlay) {
          const overlayColor = bg.color.overlay.value
          const overlayOpacity = (bg.color.overlay.opacity ?? 100) / 100
          style.backgroundImage = `linear-gradient(${overlayColor}${overlayOpacity >= 1 ? "" : Math.round(overlayOpacity * 255).toString(16).padStart(2, "0")}, ${overlayColor}${overlayOpacity >= 1 ? "" : Math.round(overlayOpacity * 255).toString(16).padStart(2, "0")}), `
        }
      }
      break

    case "gradient":
      if (bg.gradient) {
        const { kind, direction = "to right", stops } = bg.gradient
        
        // Build gradient CSS
        const gradientStops = stops
          .sort((a, b) => a.pos - b.pos)
          .map((stop) => `${stop.color} ${stop.pos}%`)
          .join(", ")

        let gradientValue = ""
        if (kind === "linear") {
          gradientValue = `linear-gradient(${direction}, ${gradientStops})`
        } else if (kind === "radial") {
          gradientValue = `radial-gradient(circle, ${gradientStops})`
        } else if (kind === "conic") {
          gradientValue = `conic-gradient(${gradientStops})`
        }

        if (gradientValue) {
          style.backgroundImage = gradientValue
          style.backgroundSize = "cover"
          style.backgroundPosition = "center"
        }
      }
      break

    case "image":
      if (bg.image?.mediaId) {
        // Image handling would require media resolution
        // For now, we skip and let caller handle media resolution
        const bgSize = bg.image.fit === "contain" ? "contain" : "cover"
        const bgPos = bg.image.position || "center"
        
        style.backgroundSize = bgSize
        style.backgroundPosition = bgPos
        
        // Add blur if specified
        if (bg.image.blur) {
          style.filter = `blur(${bg.image.blur}px)`
        }
        
        // Add overlay if specified
        if (bg.image.overlay) {
          const overlayColor = bg.image.overlay.value
          const overlayOpacity = (bg.image.overlay.opacity ?? 100) / 100
          style.backgroundBlendMode = "multiply"
          style.backgroundColor = `rgba(0, 0, 0, ${overlayOpacity})`
        }
      }
      break

    case "video":
      // Video handling would require media resolution
      // Similar to image, skip for now
      if (bg.video?.overlay) {
        const overlayColor = bg.video.overlay.value
        const overlayOpacity = (bg.video.overlay.opacity ?? 100) / 100
        style.backgroundColor = `rgba(0, 0, 0, ${overlayOpacity})`
      }
      break
  }

  return {
    className: "",
    style: Object.keys(style).length > 0 ? style : undefined,
    hasDecorativeOverlay: bg.type === "gradient" || bg.type === "image" || bg.type === "video",
  }
}

/**
 * Helper: Get section wrapper classes
 * Always includes overflow-x-hidden to prevent glows/decorations from causing horizontal scroll
 */
export function getSectionWrapperClasses(section?: BlockSectionProps, additional?: string): string {
  const layoutClasses = section?.layout
    ? cn(
        "relative overflow-x-hidden",
        section.layout.width === "full" ? "w-full" : "mx-auto max-w-6xl px-4 sm:px-6",
        section.layout.paddingY === "none"
          ? ""
          : section.layout.paddingY === "sm"
            ? "py-8 md:py-12"
            : section.layout.paddingY === "md"
              ? "py-12 md:py-16"
              : section.layout.paddingY === "lg"
                ? "py-16 md:py-24"
                : "py-20 md:py-32",
        additional
      )
    : cn("relative overflow-x-hidden", additional)

  return layoutClasses
}
