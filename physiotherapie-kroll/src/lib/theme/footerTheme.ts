import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterDesign } from "@/types/footer"

/**
 * Footer theme configuration per brand
 */
export type FooterTheme = {
  bg: string
  text: string
  heading: string
  border: string
  link: string
  linkHover: string
  focus: string
  mutedText: string
  accent?: string
  spacing: {
    py: string
  }
  section: {
    align: string
  }
  typography: {
    body: { size: string; weight: string; font: string }
    heading: { size: string; weight: string; font: string }
  }
  colors: {
    bg: string
    text: string
    heading: string
    accent: string
  }
  bottomBar: {
    enabled: boolean
    class: string
    align: string
  }
}

/**
 * Get footer theme for a brand with design overrides
 */
export function getFooterTheme(brand: BrandKey, designOverrides?: FooterDesign): FooterTheme {
  const brandDefaults = getBrandDefaults(brand)
  
  if (!designOverrides || Object.keys(designOverrides).length === 0) {
    return brandDefaults
  }

  const spacingMap = {
    compact: "py-8",
    normal: "py-12",
    spacious: "py-16",
  } as const

  const sectionAlignMap = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  } as const

  const bottomBarAlignMap = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  } as const

  const fontSizeMap = {
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
  } as const

  const fontWeightMap = {
    normal: "font-normal",
    semibold: "font-semibold",
    bold: "font-bold",
  } as const

  const fontMap = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
    "geist-sans": "font-geist-sans",
    "geist-mono": "font-geist-mono",
  } as const

  return {
    bg: designOverrides.bgClass ?? brandDefaults.bg,
    text: designOverrides.textClass ?? brandDefaults.text,
    heading: designOverrides.headingClass ?? brandDefaults.heading,
    border: designOverrides.borderClass ?? brandDefaults.border,
    link: designOverrides.linkClass ?? brandDefaults.link,
    linkHover: designOverrides.linkHoverClass ?? brandDefaults.linkHover,
    focus: designOverrides.focus ?? brandDefaults.focus,
    mutedText: designOverrides.mutedText ?? brandDefaults.mutedText,
    spacing: {
      py: spacingMap[designOverrides.spacing?.py ?? "normal"],
    },
    section: {
      align: sectionAlignMap[designOverrides.section?.align ?? "left"],
    },
    typography: {
      body: {
        size: fontSizeMap[designOverrides.typography?.bodySize ?? "base"],
        weight: fontWeightMap[designOverrides.typography?.bodyWeight ?? "normal"],
        font: fontMap[designOverrides.typography?.bodyFont ?? "sans"],
      },
      heading: {
        size: fontSizeMap[designOverrides.typography?.headingSize ?? "base"],
        weight: fontWeightMap[designOverrides.typography?.headingWeight ?? "semibold"],
        font: fontMap[designOverrides.typography?.headingFont ?? "sans"],
      },
    },
    colors: {
      bg: designOverrides.colors?.bgCustom ?? brandDefaults.colors.bg,
      text: designOverrides.colors?.textCustom ?? brandDefaults.colors.text,
      heading: designOverrides.colors?.headingCustom ?? brandDefaults.colors.heading,
      accent: designOverrides.colors?.accentCustom ?? brandDefaults.colors.accent,
    },
    bottomBar: {
      enabled: designOverrides.bottomBar?.dividerEnabled ?? brandDefaults.bottomBar.enabled,
      class: designOverrides.bottomBar?.dividerClass ?? brandDefaults.bottomBar.class,
      align: bottomBarAlignMap[designOverrides.bottomBar?.align ?? "left"],
    },
    accent: brandDefaults.accent,
  }
}

function getBrandDefaults(brand: BrandKey): FooterTheme {
  switch (brand) {
    case "physiotherapy":
      return {
        bg: "bg-white",
        text: "text-zinc-900",
        heading: "text-zinc-900",
        border: "border-zinc-200",
        link: "text-zinc-700",
        linkHover: "hover:text-zinc-900 hover:bg-zinc-100",
        focus: "focus-visible:ring-zinc-900",
        mutedText: "text-zinc-500",
        spacing: { py: "py-12" },
        section: { align: "text-left" },
        typography: {
          body: { size: "text-base", weight: "font-normal", font: "font-sans" },
          heading: { size: "text-base", weight: "font-semibold", font: "font-sans" },
        },
        colors: {
          bg: "#ffffff",
          text: "#18181b",
          heading: "#18181b",
          accent: "#f97316",
        },
        bottomBar: { enabled: false, class: "border-zinc-200", align: "justify-start" },
        accent: undefined,
      }
    case "physio-konzept":
      return {
        bg: "bg-[#0f0f10]",
        text: "text-zinc-100",
        heading: "text-white",
        border: "border-white/10",
        link: "text-zinc-300",
        linkHover: "hover:text-orange-500 hover:text-white",
        focus: "focus-visible:ring-orange-500",
        mutedText: "text-zinc-400",
        spacing: { py: "py-12" },
        section: { align: "text-left" },
        typography: {
          body: { size: "text-base", weight: "font-normal", font: "font-sans" },
          heading: { size: "text-base", weight: "font-semibold", font: "font-sans" },
        },
        colors: {
          bg: "#0f0f10",
          text: "#f4f4f5",
          heading: "#ffffff",
          accent: "#f97316",
        },
        bottomBar: { enabled: false, class: "border-white/10", align: "justify-start" },
        accent: "text-orange-500",
      }
    default:
      return getBrandDefaults("physiotherapy")
  }
}
