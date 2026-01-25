import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Navigation theme configuration
 * Build-safe: Only uses fixed Tailwind classes, no string interpolation
 */
export interface NavTheme {
  wrapper: string
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
  shadow: string
  focus: string
}

/**
 * Navigation theme for physiotherapy (light theme)
 */
const physiotherapyTheme: NavTheme = {
  wrapper: "bg-white/95 backdrop-blur-sm border-b border-zinc-200",
  link: {
    base: "text-zinc-900",
    hover: "hover:text-zinc-900 hover:bg-zinc-100/70",
    active: "text-zinc-900 border-b-2 border-zinc-900",
  },
  iconButton: {
    base: "text-zinc-700",
    hover: "hover:text-zinc-900 hover:bg-zinc-100/70",
  },
  cta: {
    default: "bg-zinc-900 text-white",
    hover: "hover:bg-zinc-800",
  },
  mobile: {
    container: "bg-white text-zinc-900 border-zinc-200",
    link: {
      base: "text-zinc-900",
      hover: "hover:bg-zinc-100",
      active: "bg-zinc-100 text-zinc-900",
    },
  },
  border: "border-zinc-200",
  shadow: "shadow-sm",
  focus: "focus-visible:ring-zinc-400",
}

/**
 * Navigation theme for physio-konzept (dark theme with orange accents)
 */
const physioKonzeptTheme: NavTheme = {
  wrapper: "bg-[#0f0f10]/90 backdrop-blur-sm border-b border-white/10",
  link: {
    base: "text-zinc-100",
    hover: "hover:text-white hover:bg-white/5",
    active: "text-[#ff7a18] border-b-2 border-[#ff7a18]",
  },
  iconButton: {
    base: "text-zinc-200",
    hover: "hover:text-white hover:bg-white/5",
  },
  cta: {
    default: "bg-[#ff7a18] text-black",
    hover: "hover:bg-[#ff8a33]",
  },
  mobile: {
    container: "bg-[#0f0f10] text-zinc-100 border-white/10",
    link: {
      base: "text-zinc-100",
      hover: "hover:bg-white/5",
      active: "bg-white/5 text-[#ff7a18]",
    },
  },
  border: "border-white/10",
  shadow: "shadow-none",
  focus: "focus-visible:ring-[#ff7a18]",
}

/**
 * Get navigation theme for a specific brand
 * @param brand - The brand key
 * @returns Navigation theme configuration
 */
export function getNavTheme(brand: BrandKey): NavTheme {
  return brand === "physio-konzept" ? physioKonzeptTheme : physiotherapyTheme
}
