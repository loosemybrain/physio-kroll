/**
 * Logo size mapping for build-safe Tailwind classes
 * Maps logoSize config values to Tailwind classes
 */
export type LogoSize = "sm" | "md" | "lg"

export interface LogoSizeClasses {
  height: string
  maxWidth: string
  width: string
}

/**
 * Get Tailwind classes for logo size
 * Build-safe: Only uses fixed Tailwind classes, no string interpolation
 */
export function getLogoSizeClasses(size: LogoSize = "md"): LogoSizeClasses {
  switch (size) {
    case "sm":
      return {
        height: "h-9", // 36px
        maxWidth: "max-w-[140px]",
        width: "w-auto",
      }
    case "md":
      return {
        height: "h-12", // 48px
        maxWidth: "max-w-[180px]",
        width: "w-auto",
      }
    case "lg":
      return {
        height: "h-14", // 56px
        maxWidth: "max-w-[220px]",
        width: "w-auto",
      }
    default:
      return {
        height: "h-12", // Default to md
        maxWidth: "max-w-[180px]",
        width: "w-auto",
      }
  }
}

/**
 * Get Next/Image width and height for logo size
 * Used when using width/height props instead of fill
 */
export function getLogoImageDimensions(size: LogoSize = "md"): { width: number; height: number } {
  switch (size) {
    case "sm":
      return { width: 140, height: 36 }
    case "md":
      return { width: 180, height: 48 }
    case "lg":
      return { width: 220, height: 56 }
    default:
      return { width: 180, height: 48 }
  }
}
