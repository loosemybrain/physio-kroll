import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Footer theme configuration per brand
 */
export type FooterTheme = {
  bg: string
  text: string
  border: string
  link: string
  linkHover: string
  accent?: string
}

/**
 * Get footer theme for a brand
 */
export function getFooterTheme(brand: BrandKey): FooterTheme {
  switch (brand) {
    case "physiotherapy":
      return {
        bg: "bg-white",
        text: "text-zinc-900",
        border: "border-zinc-200",
        link: "text-zinc-700",
        linkHover: "hover:text-zinc-900 hover:bg-zinc-100",
      }
    case "physio-konzept":
      return {
        bg: "bg-[#0f0f10]",
        text: "text-zinc-100",
        border: "border-white/10",
        link: "text-zinc-300",
        linkHover: "hover:text-orange-500 hover:text-white",
        accent: "text-orange-500",
      }
    default:
      return getFooterTheme("physiotherapy")
  }
}
