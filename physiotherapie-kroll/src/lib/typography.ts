import { z } from "zod"
import { cn } from "@/lib/utils"

/**
 * Typography settings that can be applied to any block
 */
export type TypographySettings = {
  fontFamily?: "sans" | "serif"
  fontWeight?: 300 | 400 | 500 | 600 | 700
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
  lineHeight?: "tight" | "snug" | "normal" | "relaxed" | "loose"
  letterSpacing?: "tighter" | "tight" | "normal" | "wide" | "wider"
  italic?: boolean
}

/**
 * Zod schema for typography settings
 */
export const typographySchema = z.object({
  fontFamily: z.enum(["sans", "serif"]).optional(),
  fontWeight: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.union([z.literal(300), z.literal(400), z.literal(500), z.literal(600), z.literal(700)])
  ).optional(),
  fontSize: z.enum(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]).optional(),
  lineHeight: z.enum(["tight", "snug", "normal", "relaxed", "loose"]).optional(),
  letterSpacing: z.enum(["tighter", "tight", "normal", "wide", "wider"]).optional(),
  italic: z.boolean().optional(),
}).optional()

/**
 * Typography settings per element (key = elementId, value = TypographySettings)
 */
export const elementTypographySchema = z.record(z.string(), typographySchema).optional()

/**
 * Removes conflicting typography classes from a className string
 * Only removes classes that conflict with the ACTUALLY SET typography properties
 */
function removeConflictingTypographyClasses(
  className: string,
  typography: TypographySettings
): string {
  if (!className) return className
  
  const classes = className.split(/\s+/)
  const filtered: string[] = []
  
  for (const cls of classes) {
    // Check each typography property independently
    // Only remove classes that conflict with EXPLICITLY SET typography properties
    
    // Remove font-size classes ONLY if typography.fontSize is set
    if (typography.fontSize !== undefined) {
      if (/^(sm|md|lg|xl|2xl):text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/.test(cls) ||
          /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/.test(cls)) {
        continue // Skip this class
      }
    }
    
    // Remove font-family classes ONLY if typography.fontFamily is set
    if (typography.fontFamily !== undefined && /^font-(sans|serif|mono)$/.test(cls)) {
      continue // Skip this class
    }
    
    // Remove font-weight classes ONLY if typography.fontWeight is set
    if (typography.fontWeight !== undefined && /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(cls)) {
      continue // Skip this class
    }
    
    // Remove line-height classes ONLY if typography.lineHeight is set
    if (typography.lineHeight !== undefined && /^leading-(tight|snug|normal|relaxed|loose)$/.test(cls)) {
      continue // Skip this class
    }
    
    // Remove letter-spacing classes ONLY if typography.letterSpacing is set
    if (typography.letterSpacing !== undefined && /^tracking-(tighter|tight|normal|wide|wider)$/.test(cls)) {
      continue // Skip this class
    }
    
    // Remove italic classes ONLY if typography.italic is set
    if (typography.italic !== undefined) {
      if (cls === "italic" || (typography.italic === true && cls === "not-italic")) {
        continue // Skip this class
      }
    }
    
    // If we reach here, keep the class
    filtered.push(cls)
  }
  
  return filtered.join(" ")
}

/**
 * Maps font weight to Tailwind classes
 */
function getFontWeightClass(weight?: 300 | 400 | 500 | 600 | 700): string {
  switch (weight) {
    case 300:
      return "font-light"
    case 400:
      return "font-normal"
    case 500:
      return "font-medium"
    case 600:
      return "font-semibold"
    case 700:
      return "font-bold"
    default:
      return ""
  }
}

/**
 * Maps font size to Tailwind classes
 */
function getFontSizeClass(size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl"): string {
  switch (size) {
    case "xs":
      return "text-xs"
    case "sm":
      return "text-sm"
    case "base":
      return "text-base"
    case "lg":
      return "text-lg"
    case "xl":
      return "text-xl"
    case "2xl":
      return "text-2xl"
    case "3xl":
      return "text-3xl"
    case "4xl":
      return "text-4xl"
    default:
      return ""
  }
}

/**
 * Maps line height to Tailwind classes
 */
function getLineHeightClass(height?: "tight" | "snug" | "normal" | "relaxed" | "loose"): string {
  switch (height) {
    case "tight":
      return "leading-tight"
    case "snug":
      return "leading-snug"
    case "normal":
      return "leading-normal"
    case "relaxed":
      return "leading-relaxed"
    case "loose":
      return "leading-loose"
    default:
      return ""
  }
}

/**
 * Maps letter spacing to Tailwind classes
 */
function getLetterSpacingClass(spacing?: "tighter" | "tight" | "normal" | "wide" | "wider"): string {
  switch (spacing) {
    case "tighter":
      return "tracking-tighter"
    case "tight":
      return "tracking-tight"
    case "normal":
      return "tracking-normal"
    case "wide":
      return "tracking-wide"
    case "wider":
      return "tracking-wider"
    default:
      return ""
  }
}

/**
 * Converts typography settings to Tailwind CSS classes
 * Returns a space-separated string of classes that can be applied to a block wrapper
 */
export function getTypographyClassName(typography?: TypographySettings | null): string {
  if (!typography) {
    return ""
  }

  const classes: string[] = []

  // Font family
  if (typography.fontFamily === "sans") {
    classes.push("font-sans")
  } else if (typography.fontFamily === "serif") {
    classes.push("font-serif")
  }

  // Font weight
  const weightClass = getFontWeightClass(typography.fontWeight)
  if (weightClass) {
    classes.push(weightClass)
  }

  // Font size
  const sizeClass = getFontSizeClass(typography.fontSize)
  if (sizeClass) {
    classes.push(sizeClass)
  }

  // Line height
  const lineHeightClass = getLineHeightClass(typography.lineHeight)
  if (lineHeightClass) {
    classes.push(lineHeightClass)
  }

  // Letter spacing
  const letterSpacingClass = getLetterSpacingClass(typography.letterSpacing)
  if (letterSpacingClass) {
    classes.push(letterSpacingClass)
  }

  // Italic
  if (typography.italic === true) {
    classes.push("italic")
  }

  return cn(...classes)
}

/**
 * Merges base classes with typography classes, removing conflicting classes
 * when typography is set. Only removes classes that conflict with ACTUALLY SET typography properties.
 * 
 * This ensures that:
 * - If only fontSize is set, only font-size classes are removed/overridden
 * - If only fontWeight is set, only font-weight classes are removed/overridden
 * - Other base classes (like font-semibold, tracking-tight) remain untouched
 */
export function mergeTypographyClasses(
  baseClasses: string,
  typography?: TypographySettings | null
): string {
  if (!typography) {
    return baseClasses
  }

  // Remove conflicting typography classes from base classes
  // Only removes classes that conflict with EXPLICITLY SET typography properties
  const cleanedBaseClasses = removeConflictingTypographyClasses(baseClasses, typography)

  // Get typography classes (only for explicitly set properties)
  const typographyClasses = getTypographyClassName(typography)

  // Merge with typography classes (twMerge will handle any remaining conflicts)
  return cn(cleanedBaseClasses, typographyClasses)
}
