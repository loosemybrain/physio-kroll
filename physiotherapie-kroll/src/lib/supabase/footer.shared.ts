import { z } from "zod"
import type { FooterConfig, FooterSection, FooterBlock, FooterBottomBar, FooterDesign, FooterSpacing } from "@/types/footer"
import type { SectionAlign, TypographySize, TypographyWeight } from "@/types/footer"

/**
 * Whitelisted spacing options
 */
export const SPACING_OPTIONS: FooterSpacing[] = ["compact", "normal", "spacious"]

/**
 * Whitelisted section alignment options
 */
export const SECTION_ALIGN_OPTIONS = ["left", "center", "right"] as const

/**
 * Whitelisted typography sizes
 */
export const TYPOGRAPHY_SIZES = ["sm", "base", "lg"] as const

/**
 * Whitelisted typography weights
 */
export const TYPOGRAPHY_WEIGHTS = ["normal", "semibold", "bold"] as const

/**
 * Whitelisted font families
 */
export const FONT_FAMILIES = [
  { id: "sans", label: "Sans (Standard)" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Monospace" },
  { id: "geist-sans", label: "Geist Sans" },
  { id: "geist-mono", label: "Geist Mono" },
] as const

/**
 * Whitelisted divider classes
 */
export const DIVIDER_CLASS_OPTIONS = [
  "border-zinc-200",
  "border-zinc-300",
  "border-zinc-400",
  "border-white/10",
  "border-white/20",
  "border-orange-500/20",
] as const

/**
 * Whitelisted color presets (hex values only)
 */
export const COLOR_PRESETS = {
  backgrounds: [
    { name: "White", value: "#ffffff" },
    { name: "Zinc 50", value: "#fafafa" },
    { name: "Zinc 100", value: "#f4f4f5" },
    { name: "Zinc 900", value: "#18181b" },
    { name: "Zinc 950", value: "#09090b" },
  ],
  text: [
    { name: "White", value: "#ffffff" },
    { name: "Zinc 100", value: "#f4f4f5" },
    { name: "Zinc 300", value: "#d4d4d8" },
    { name: "Zinc 700", value: "#3f3f46" },
    { name: "Zinc 900", value: "#18181b" },
  ],
  headings: [
    { name: "White", value: "#ffffff" },
    { name: "Zinc 100", value: "#f4f4f5" },
    { name: "Zinc 900", value: "#18181b" },
    { name: "Orange 500", value: "#f97316" },
    { name: "Blue 500", value: "#3b82f6" },
  ],
  accents: [
    { name: "Orange 500", value: "#f97316" },
    { name: "Blue 500", value: "#3b82f6" },
    { name: "Green 500", value: "#22c55e" },
    { name: "Slate 500", value: "#64748b" },
  ],
} as const
export const DESIGN_PRESETS = [
  {
    id: "brand-default",
    label: "Brand Default",
    design: {}, // Empty object = use brand defaults from getFooterTheme
  },
  {
    id: "light",
    label: "Hell",
    design: {
      bgClass: "bg-zinc-50",
      textClass: "text-zinc-900",
      headingClass: "text-zinc-900",
      borderClass: "border-zinc-200",
      linkClass: "text-zinc-700",
      linkHoverClass: "hover:text-zinc-900 hover:underline",
      focus: "focus-visible:ring-zinc-900",
      mutedText: "text-zinc-500",
      spacing: { py: "spacious" },
      bottomBar: {
        dividerEnabled: true,
        dividerClass: "border-zinc-200",
      },
    },
  },
  {
    id: "dark",
    label: "Dunkel",
    design: {
      bgClass: "bg-zinc-900",
      textClass: "text-zinc-100",
      headingClass: "text-white",
      borderClass: "border-zinc-700",
      linkClass: "text-zinc-300",
      linkHoverClass: "hover:text-white hover:underline",
      focus: "focus-visible:ring-zinc-100",
      mutedText: "text-zinc-400",
      spacing: { py: "spacious" },
      bottomBar: {
        dividerEnabled: true,
        dividerClass: "border-zinc-700",
      },
    },
  },
  {
    id: "concept-accent",
    label: "Konzept Accent",
    design: {
      bgClass: "bg-zinc-950",
      textClass: "text-zinc-100",
      headingClass: "text-orange-500",
      borderClass: "border-orange-500/20",
      linkClass: "text-orange-400",
      linkHoverClass: "hover:text-orange-300 hover:underline",
      focus: "focus-visible:ring-orange-500",
      mutedText: "text-zinc-400",
      spacing: { py: "normal" },
      bottomBar: {
        dividerEnabled: true,
        dividerClass: "border-orange-500/20",
      },
    },
  },
] as const

/**
 * Footer block schemas
 */
const footerBlockTextSchema = z.object({
  type: z.literal("text"),
  id: z.string(),
  text: z.string(),
})

const footerBlockLinksSchema = z.object({
  type: z.literal("links"),
  id: z.string(),
  title: z.string().optional(),
  links: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      href: z.string(),
      newTab: z.boolean().optional(),
    })
  ),
})

const footerBlockPagesSchema = z.object({
  type: z.literal("pages"),
  id: z.string(),
  title: z.string().optional(),
  pageSlugs: z.array(z.string()),
  showUnpublished: z.boolean().optional(),
})

const footerBlockLogoSchema = z.object({
  type: z.literal("logo"),
  id: z.string(),
  mediaId: z.string().optional(),
  url: z.string().optional(),
  alt: z.string().optional(),
  size: z.enum(["sm", "md", "lg"]).optional(),
  fit: z.enum(["contain", "cover"]).optional(),
  href: z.string().optional(),
})

const footerBlockCopyrightSchema = z.object({
  type: z.literal("copyright"),
  id: z.string(),
  text: z.string(),
})

const footerBlockSchema: z.ZodType<FooterBlock> = z.discriminatedUnion("type", [
  footerBlockTextSchema,
  footerBlockLinksSchema,
  footerBlockPagesSchema,
  footerBlockLogoSchema,
  footerBlockCopyrightSchema,
])

/**
 * Footer section schema
 */
const footerSectionSchema: z.ZodType<FooterSection> = z.object({
  id: z.string(),
  title: z.string().optional(),
  span: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(6)])
  ),
  blocks: z.array(footerBlockSchema),
})

/**
 * Footer design schema (only whitelisted fields)
 */
const footerDesignSchema: z.ZodType<FooterDesign> = z
  .object({
    bgClass: z.string().optional(),
    textClass: z.string().optional(),
    headingClass: z.string().optional(),
    borderClass: z.string().optional(),
    linkClass: z.string().optional(),
    linkHoverClass: z.string().optional(),
    focus: z.string().optional(),
    mutedText: z.string().optional(),
    spacing: z
      .object({
        py: z.enum(["compact", "normal", "spacious"]).optional(),
      })
      .optional(),
    section: z
      .object({
        align: z.enum(["left", "center", "right"]).optional(),
      })
      .optional(),
    typography: z
      .object({
        bodySize: z.enum(["sm", "base", "lg"]).optional(),
        bodyWeight: z.enum(["normal", "semibold", "bold"]).optional(),
        bodyFont: z.enum(["sans", "serif", "mono", "geist-sans", "geist-mono"]).optional(),
        headingSize: z.enum(["sm", "base", "lg"]).optional(),
        headingWeight: z.enum(["normal", "semibold", "bold"]).optional(),
        headingFont: z.enum(["sans", "serif", "mono", "geist-sans", "geist-mono"]).optional(),
      })
      .optional(),
    colors: z
      .object({
        bgCustom: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        textCustom: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        headingCustom: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        accentCustom: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      })
      .optional(),
    bottomBar: z
      .object({
        dividerEnabled: z.boolean().optional(),
        dividerClass: z.enum(DIVIDER_CLASS_OPTIONS).optional(),
        align: z.enum(["left", "center", "right"]).optional(),
      })
      .optional(),
  })
  .strict()

/**
 * Footer footer bottom bar schema
 */
const footerBottomBarSchema: z.ZodType<FooterBottomBar> = z.object({
  enabled: z.boolean(),
  left: footerBlockSchema.optional(),
  right: footerBlockSchema.optional(),
})

/**
 * Footer config schema with validation
 */
export const footerConfigSchema = z
  .object({
    variant: z.enum(["default"]).optional(),
    sections: z.array(footerSectionSchema).min(2).max(5),
    bottomBar: footerBottomBarSchema.optional(),
    design: footerDesignSchema.optional(),
  })
  .refine(
    (data) => {
      const totalSpan = data.sections.reduce((sum, section) => sum + section.span, 0)
      return totalSpan <= 12
    },
    {
      message: "Summe aller Spaltenbreiten darf nicht größer als 12 sein",
      path: ["sections"],
    }
  )

/**
 * Default footer configuration
 */
export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  variant: "default",
  sections: [
    {
      id: "section-1",
      title: "Kontakt",
      span: 6,
      blocks: [
        {
          type: "text",
          id: "text-1",
          text: "Physiotherapie Kroll\nMusterstraße 123\n12345 Musterstadt",
        },
        {
          type: "links",
          id: "links-1",
          title: "Kontakt",
          links: [
            {
              id: "link-1",
              label: "Kontakt",
              href: "/kontakt",
              newTab: false,
            },
          ],
        },
      ],
    },
    {
      id: "section-2",
      title: "Rechtliches",
      span: 6,
      blocks: [
        {
          type: "links",
          id: "links-2",
          title: "Rechtliches",
          links: [
            {
              id: "link-2",
              label: "Impressum",
              href: "/impressum",
              newTab: false,
            },
            {
              id: "link-3",
              label: "Datenschutz",
              href: "/datenschutz",
              newTab: false,
            },
          ],
        },
      ],
    },
  ],
  bottomBar: {
    enabled: true,
    left: {
      type: "copyright",
      id: "copyright-1",
      text: "© 2024 Physiotherapie Kroll. Alle Rechte vorbehalten.",
    },
  },
}

/**
 * Calculate default spans for sections based on count
 */
export function getDefaultSpansForSectionCount(count: number): Array<2 | 3 | 4 | 6> {
  switch (count) {
    case 2:
      return [6, 6]
    case 3:
      return [4, 4, 4]
    case 4:
      return [3, 3, 3, 3]
    case 5:
      return [3, 3, 2, 2, 2]
    default:
      return [6, 6]
  }
}

/**
 * Ensure all sections have span property (backward compatibility)
 */
export function ensureSectionSpans(config: FooterConfig): FooterConfig {
  const sections = config.sections.map((section, index) => {
    if (!("span" in section) || typeof section.span !== "number") {
      const defaultSpans = getDefaultSpansForSectionCount(config.sections.length)
      return { ...section, span: defaultSpans[index] || 6 }
    }
    return section
  })
  return { ...config, sections }
}
