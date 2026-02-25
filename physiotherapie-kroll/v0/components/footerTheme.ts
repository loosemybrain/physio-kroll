import type { BrandKey } from "@/types/navigation"
import type { FooterDesign, FooterSpacing } from "@/types/footer"

/* ------------------------------------------------------------------ */
/*  Footer Theme structure                                             */
/* ------------------------------------------------------------------ */

export interface FooterTheme {
  bg: string
  text: string
  border: string
  link: string
  linkHover: string
  focus: string
  heading: string
  mutedText: string
  spacing: string
  divider: string
  dividerEnabled: boolean
}

/* ------------------------------------------------------------------ */
/*  Static maps (Tailwind-safe, no dynamic concatenation)              */
/* ------------------------------------------------------------------ */

const spacingMap: Record<FooterSpacing, string> = {
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
}

/* ------------------------------------------------------------------ */
/*  Brand default themes                                               */
/* ------------------------------------------------------------------ */

const physiotherapyTheme: FooterTheme = {
  bg: "bg-secondary",
  text: "text-foreground",
  border: "border-border",
  link: "text-muted-foreground",
  linkHover: "hover:text-foreground hover:bg-muted",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  heading: "text-foreground",
  mutedText: "text-muted-foreground",
  spacing: "py-16",
  divider: "border-border",
  dividerEnabled: true,
}

const physioKonzeptTheme: FooterTheme = {
  bg: "bg-background",
  text: "text-foreground",
  border: "border-border",
  link: "text-muted-foreground",
  linkHover: "hover:text-primary hover:bg-secondary",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  heading: "text-foreground",
  mutedText: "text-muted-foreground",
  spacing: "py-16",
  divider: "border-border",
  dividerEnabled: true,
}

/* ------------------------------------------------------------------ */
/*  Design presets (whitelisted, selectable from admin UI)              */
/* ------------------------------------------------------------------ */

export interface DesignPreset {
  label: string
  value: string
  design: FooterDesign
}

export const DESIGN_PRESETS: DesignPreset[] = [
  {
    label: "Brand Default",
    value: "brand-default",
    design: {}, // empty = no overrides
  },
  {
    label: "Hell",
    value: "light",
    design: {
      bgMode: "solid-light",
      bgClass: "bg-secondary",
      textClass: "text-foreground",
      borderClass: "border-border",
      linkClass: "text-muted-foreground",
      linkHoverClass: "hover:text-foreground hover:bg-muted",
    },
  },
  {
    label: "Dunkel",
    value: "dark",
    design: {
      bgMode: "solid-dark",
      bgClass: "bg-background",
      textClass: "text-foreground",
      borderClass: "border-border",
      linkClass: "text-muted-foreground",
      linkHoverClass: "hover:text-foreground hover:bg-secondary",
    },
  },
  {
    label: "Konzept Accent",
    value: "konzept-accent",
    design: {
      bgMode: "solid-dark",
      bgClass: "bg-background",
      textClass: "text-foreground",
      borderClass: "border-border",
      linkClass: "text-muted-foreground",
      linkHoverClass: "hover:text-primary hover:bg-secondary",
    },
  },
]

/* ------------------------------------------------------------------ */
/*  Spacing options for admin select                                   */
/* ------------------------------------------------------------------ */

export const SPACING_OPTIONS: { label: string; value: FooterSpacing }[] = [
  { label: "Klein (py-8)", value: "sm" },
  { label: "Mittel (py-12)", value: "md" },
  { label: "Groß (py-16)", value: "lg" },
]

/* ------------------------------------------------------------------ */
/*  Divider class options                                              */
/* ------------------------------------------------------------------ */

export const DIVIDER_CLASS_OPTIONS: { label: string; value: string }[] = [
  { label: "Standard", value: "border-inherit" },
  { label: "Subtil", value: "border-border/50" },
  { label: "Dunkel", value: "border-border" },
  { label: "Accent", value: "border-primary/30" },
]

/* ------------------------------------------------------------------ */
/*  Resolution: brand defaults + optional design overrides             */
/* ------------------------------------------------------------------ */

export function getFooterTheme(
  brand: BrandKey,
  designOverrides?: FooterDesign
): FooterTheme {
  const base: FooterTheme =
    brand === "physio-konzept"
      ? { ...physioKonzeptTheme }
      : { ...physiotherapyTheme }

  if (!designOverrides) return base

  // Apply field-level overrides only when the field is explicitly set
  if (designOverrides.bgClass) base.bg = designOverrides.bgClass
  if (designOverrides.textClass) {
    base.text = designOverrides.textClass
    base.heading = designOverrides.textClass
  }
  if (designOverrides.borderClass) {
    base.border = designOverrides.borderClass
    base.divider = designOverrides.borderClass
  }
  if (designOverrides.linkClass) base.link = designOverrides.linkClass
  if (designOverrides.linkHoverClass) base.linkHover = designOverrides.linkHoverClass
  if (designOverrides.spacing?.py) base.spacing = spacingMap[designOverrides.spacing.py]
  if (designOverrides.bottomBar?.dividerEnabled !== undefined) {
    base.dividerEnabled = designOverrides.bottomBar.dividerEnabled
  }
  if (designOverrides.bottomBar?.dividerClass) {
    base.divider = designOverrides.bottomBar.dividerClass
  }

  return base
}
