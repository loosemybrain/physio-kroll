import type { BrandKey } from "@/components/brand/brandAssets"
import type { NavStylePresetId } from "@/lib/navigation/nav-style-presets"

/**
 * Navigation theme configuration
 * Build-safe: Only uses fixed Tailwind classes, no string interpolation
 * Aligned with v0 design tokens and behavior
 */
export interface NavTheme {
  wrapper: string
  wrapperScrolled: string
  shadow: string
  shadowScrolled: string
  link: {
    base: string
    hover: string
    active: string
  }
  iconButton: {
    base: string
    hover: string
  }
  cta: {
    default: string
    hover: string
  }
  mobile: {
    container: string
    link: {
      base: string
      hover: string
      active: string
    }
  }
  border: string
  indicator: string
  focus: string
}

/**
 * Navigation theme for physiotherapy (light theme)
 * Parity with v0 behavior: light background regardless of system dark mode
 */
const physiotherapyTheme: NavTheme = {
  wrapper: "bg-white/95 backdrop-blur-md border-b border-zinc-200",
  wrapperScrolled: "bg-white/98 backdrop-blur-xl shadow-lg shadow-primary/5",
  shadow: "shadow-sm",
  shadowScrolled: "shadow-lg shadow-primary/8",
  link: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground",
    active: "text-primary font-semibold",
  },
  iconButton: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground hover:bg-muted",
  },
  cta: {
    default: "bg-primary text-primary-foreground",
    hover: "hover:bg-primary/90",
  },
  mobile: {
    container: "bg-white",
    link: {
      base: "text-foreground",
      hover: "hover:bg-muted",
      active: "bg-primary/10 text-primary font-semibold",
    },
  },
  border: "border-zinc-200",
  indicator: "bg-primary",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
}

/**
 * Navigation theme for physio-konzept (dark theme with accent color)
 * Parity with v0 behavior: dark background regardless of system dark mode
 */
const physioKonzeptTheme: NavTheme = {
  wrapper: "bg-[#0f0f10]/95 backdrop-blur-md border-b border-white/10",
  wrapperScrolled: "bg-[#0f0f10]/98 backdrop-blur-xl shadow-lg shadow-accent/10",
  shadow: "shadow-sm",
  shadowScrolled: "shadow-lg shadow-accent/8",
  link: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground",
    active: "text-accent font-semibold",
  },
  iconButton: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground hover:bg-muted",
  },
  cta: {
    default: "bg-accent text-accent-foreground",
    hover: "hover:bg-accent/90",
  },
  mobile: {
    container: "bg-[#0f0f10]",
    link: {
      base: "text-foreground",
      hover: "hover:bg-muted",
      active: "bg-accent/10 text-accent font-semibold",
    },
  },
  border: "border-white/10",
  indicator: "bg-accent",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
}

/**
 * Get navigation theme for a specific brand and style preset
 * @param brand - The brand key
 * @param stylePreset - Optional style preset ID to apply overrides
 * @returns Navigation theme configuration
 */
export function getNavTheme(
  brand: BrandKey,
  stylePreset?: NavStylePresetId
): NavTheme {
  return brand === "physio-konzept" ? physioKonzeptTheme : physiotherapyTheme
}
