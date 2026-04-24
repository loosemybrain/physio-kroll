import { z } from "zod"
import type {
  FooterConfig,
  FooterSection,
  FooterBlock,
  FooterBottomBar,
  FooterDesign,
  FooterSpacing,
  FooterBackground,
  FooterGlassmorphism,
  FooterLegalLinksConfig,
  LegalLinksItems,
  FooterSocialLinksConfig,
} from "@/types/footer"
import type { SectionAlign, TypographySize, TypographyWeight } from "@/types/footer"
import {
  SOCIAL_LIQUID_FILL_DEFAULTS,
  SOCIAL_FILL_RISE_DEFAULTS,
  clampFillRiseBorderWidth,
  clampFillRiseRotation,
  clampFillRiseRotationDuration,
  clampLiquidBorderWidth,
} from "@/lib/footer/socialFillRise"

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
  alignX: z.enum(["left", "center", "right"]).optional(),
  alignY: z.enum(["top", "center", "bottom"]).optional(),
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
  marginTop: z.enum(["none", "sm", "md", "lg"]).optional(),
  left: footerBlockSchema.optional(),
  right: footerBlockSchema.optional(),
})

/**
 * Legal links items (only privacy, cookies, imprint)
 */
const legalLinksItemsSchema: z.ZodType<LegalLinksItems> = z.object({
  imprint: z.boolean().optional(),
  privacy: z.boolean().optional(),
  cookies: z.boolean().optional(),
})

/**
 * Legal links config schema
 */
const footerLegalLinksSchema: z.ZodType<FooterLegalLinksConfig> = z.object({
  enabled: z.boolean(),
  title: z.string().optional(),
  placement: z.enum(["section", "bottom-bar"]).optional(),
  layout: z.enum(["inline", "stacked", "separated", "chips"]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  showTitle: z.boolean().optional(),
  gap: z.enum(["sm", "md", "lg"]).optional(),
  marginTop: z.enum(["none", "sm", "md", "lg"]).optional(),
  marginBottom: z.enum(["none", "sm", "md", "lg"]).optional(),
  textColor: z.string().optional(),
  hoverColor: z.string().optional(),
  activeColor: z.string().optional(),
  separatorColor: z.string().optional(),
  fontSize: z.enum(["xs", "sm", "base"]).optional(),
  fontWeight: z.enum(["normal", "medium", "semibold"]).optional(),
  uppercase: z.boolean().optional(),
  items: legalLinksItemsSchema,
})

const footerSocialLinksSchema: z.ZodType<FooterSocialLinksConfig> = z.object({
  enabled: z.boolean().default(false),
  title: z.string().optional(),
  placement: z
    .enum(["top", "section", "bottom", "bottomBar", "bottomBarLeft", "bottomBarCenter", "bottomBarRight"])
    .default("bottom"),
  align: z.enum(["left", "center", "right"]).default("left"),
  iconStyle: z.enum(["default", "round", "square", "outline", "minimal", "soft", "pill", "socialFillRise", "socialLiquidFill"]).default("default"),
  iconSet: z.enum(["brand", "simple", "monochrome"]).default("brand"),
  hoverEffect: z.enum(["none", "lift", "shrink", "flip", "draw"]).optional(),
  iconSize: z.enum(["xs", "sm", "md", "lg", "xl"]).default("md"),
  gap: z.enum(["xs", "sm", "md", "lg"]).default("md"),
  color: z.string().optional(),
  hoverColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  openInNewTab: z.boolean().default(true),
  showLabels: z.boolean().default(false),
  labelColor: z.string().optional(),
  fillRiseUseNetworkColors: z.boolean().optional(),
  fillRiseFallbackColor: z.string().optional(),
  fillRiseIconRotate: z.boolean().optional(),
  fillRiseRotationDegrees: z.number().int().min(0).max(720).optional(),
  fillRiseRotationAxis: z.enum(["x", "y", "z"]).optional(),
  fillRiseRotationDurationMs: z.number().int().min(0).max(2000).optional(),
  fillRiseDirection: z.enum(["bottom", "top", "left", "right"]).optional(),
  fillRiseBorderWidth: z.number().int().min(0).max(8).optional(),
  fillRiseBaseBg: z.string().optional(),
  fillRiseActiveIconColor: z.string().optional(),
  fillRiseRadiusMode: z.enum(["circle", "rounded"]).optional(),
  liquidUseNetworkColors: z.boolean().optional(),
  liquidFallbackColor: z.string().optional(),
  liquidBaseBg: z.string().optional(),
  liquidActiveIconColor: z.string().optional(),
  liquidBorderWidth: z.number().int().min(0).max(8).optional(),
  liquidWaveIntensity: z.enum(["subtle", "medium"]).optional(),
  liquidSpeed: z.enum(["slow", "normal"]).optional(),
  items: z.object({
    facebook: z.object({
      enabled: z.boolean().default(false),
      url: z.string().optional(),
      iconVariant: z.enum(["facebook", "facebook-f", "facebook-round"]).optional(),
      label: z.string().optional(),
    }),
    instagram: z.object({
      enabled: z.boolean().default(false),
      url: z.string().optional(),
      iconVariant: z.enum(["instagram", "instagram-outline", "instagram-round"]).optional(),
      label: z.string().optional(),
    }),
  }),
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
    layoutWidth: z.enum(["full", "contained"]).optional(),
    background: z
      .object({
        mode: z.enum(["transparent", "color", "gradient", "image", "video"]).optional(),
        color: z.string().optional(),
        gradientPreset: z.string().optional(),
        gradient: z
          .object({
            from: z.string().optional(),
            via: z.string().optional(),
            to: z.string().optional(),
            angle: z.number().optional(),
          })
          .optional(),
        mediaId: z.string().optional(),
        mediaUrl: z.string().optional(),
        overlay: z
          .object({
            enabled: z.boolean().optional(),
            color: z.string().optional(),
            opacity: z.number().optional(),
          })
          .optional(),
        parallax: z
          .object({
            enabled: z.boolean().optional(),
            strength: z.number().optional(),
          })
          .optional(),
      })
      .optional() as z.ZodType<FooterBackground | undefined>,
    glassmorphism: z
      .object({
        enabled: z.boolean().optional(),
        intensity: z.enum(["subtle", "medium", "strong"]).optional(),
        blurPx: z.number().optional(),
        panelOpacity: z.number().optional(),
        borderOpacity: z.number().optional(),
        borderColor: z.string().optional(),
        highlightLine: z.boolean().optional(),
        highlightColor: z.string().optional(),
        shadowPreset: z.string().optional(),
        panelShadow: z.any().optional(),
        tintColor: z.string().optional(),
      })
      .optional() as z.ZodType<FooterGlassmorphism | undefined>,
    legalLinks: footerLegalLinksSchema.optional(),
    socialLinks: footerSocialLinksSchema.optional(),
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
 * Default legal links configuration (dedizierter Legal-Bereich)
 */
export const DEFAULT_LEGAL_LINKS_CONFIG: FooterLegalLinksConfig = {
  enabled: true,
  title: "Rechtliches",
  placement: "section",
  layout: "inline",
  align: "left",
  showTitle: true,
  gap: "md",
  marginTop: "md",
  marginBottom: "none",
  items: {
    imprint: true,
    privacy: true,
    cookies: true,
  },
}

export const DEFAULT_SOCIAL_LINKS_CONFIG: FooterSocialLinksConfig = {
  enabled: false,
  title: "Social Media",
  placement: "bottom",
  align: "left",
  iconStyle: "default",
  iconSet: "brand",
  hoverEffect: "none",
  iconSize: "md",
  gap: "md",
  openInNewTab: true,
  showLabels: false,
  fillRiseUseNetworkColors: SOCIAL_FILL_RISE_DEFAULTS.fillRiseUseNetworkColors,
  fillRiseIconRotate: SOCIAL_FILL_RISE_DEFAULTS.fillRiseIconRotate,
  fillRiseRotationDegrees: SOCIAL_FILL_RISE_DEFAULTS.fillRiseRotationDegrees,
  fillRiseRotationAxis: SOCIAL_FILL_RISE_DEFAULTS.fillRiseRotationAxis,
  fillRiseRotationDurationMs: SOCIAL_FILL_RISE_DEFAULTS.fillRiseRotationDurationMs,
  fillRiseDirection: SOCIAL_FILL_RISE_DEFAULTS.fillRiseDirection,
  fillRiseBorderWidth: SOCIAL_FILL_RISE_DEFAULTS.fillRiseBorderWidth,
  fillRiseRadiusMode: SOCIAL_FILL_RISE_DEFAULTS.fillRiseRadiusMode,
  liquidUseNetworkColors: SOCIAL_LIQUID_FILL_DEFAULTS.liquidUseNetworkColors,
  liquidBorderWidth: SOCIAL_LIQUID_FILL_DEFAULTS.liquidBorderWidth,
  liquidWaveIntensity: SOCIAL_LIQUID_FILL_DEFAULTS.liquidWaveIntensity,
  liquidSpeed: SOCIAL_LIQUID_FILL_DEFAULTS.liquidSpeed,
  items: {
    facebook: {
      enabled: false,
      iconVariant: "facebook",
      label: "Facebook",
    },
    instagram: {
      enabled: false,
      iconVariant: "instagram",
      label: "Instagram",
    },
  },
}

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
  legalLinks: DEFAULT_LEGAL_LINKS_CONFIG,
  socialLinks: DEFAULT_SOCIAL_LINKS_CONFIG,
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

/**
 * Ensure legalLinks exists with safe defaults (backward compatibility).
 * Alte Footer-Datensätze ohne legalLinks bleiben gültig; beim Laden wird ergänzt.
 */
export function ensureLegalLinks(config: FooterConfig): FooterConfig {
  if (config.legalLinks === undefined || config.legalLinks === null) {
    return { ...config, legalLinks: DEFAULT_LEGAL_LINKS_CONFIG }
  }
  const ll = config.legalLinks
  const merged: FooterLegalLinksConfig = {
    enabled: typeof ll.enabled === "boolean" ? ll.enabled : DEFAULT_LEGAL_LINKS_CONFIG.enabled,
    title: ll.title ?? DEFAULT_LEGAL_LINKS_CONFIG.title,
    placement: (ll.placement as FooterLegalLinksConfig["placement"]) ?? DEFAULT_LEGAL_LINKS_CONFIG.placement,
    layout: (ll.layout as FooterLegalLinksConfig["layout"]) ?? DEFAULT_LEGAL_LINKS_CONFIG.layout,
    align: (ll.align as FooterLegalLinksConfig["align"]) ?? DEFAULT_LEGAL_LINKS_CONFIG.align,
    showTitle: ll.showTitle ?? DEFAULT_LEGAL_LINKS_CONFIG.showTitle,
    gap: (ll.gap as FooterLegalLinksConfig["gap"]) ?? DEFAULT_LEGAL_LINKS_CONFIG.gap,
    marginTop: (ll.marginTop as FooterLegalLinksConfig["marginTop"]) ?? DEFAULT_LEGAL_LINKS_CONFIG.marginTop,
    marginBottom: (ll.marginBottom as FooterLegalLinksConfig["marginBottom"]) ?? DEFAULT_LEGAL_LINKS_CONFIG.marginBottom,
    textColor: ll.textColor,
    hoverColor: ll.hoverColor,
    activeColor: ll.activeColor,
    separatorColor: ll.separatorColor,
    fontSize: (ll.fontSize as FooterLegalLinksConfig["fontSize"]) ?? undefined,
    fontWeight: (ll.fontWeight as FooterLegalLinksConfig["fontWeight"]) ?? undefined,
    uppercase: ll.uppercase ?? false,
    items: {
      imprint: ll.items?.imprint ?? DEFAULT_LEGAL_LINKS_CONFIG.items.imprint,
      privacy: ll.items?.privacy ?? DEFAULT_LEGAL_LINKS_CONFIG.items.privacy,
      cookies: ll.items?.cookies ?? DEFAULT_LEGAL_LINKS_CONFIG.items.cookies,
    },
  }
  return { ...config, legalLinks: merged }
}

function normalizeOptionalString(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Ensure socialLinks exists with safe defaults (backward compatibility).
 * Alte Footer-Datensätze ohne socialLinks bleiben gültig; beim Laden wird ergänzt.
 */
export function ensureSocialLinks(config: FooterConfig): FooterConfig {
  if (config.socialLinks === undefined || config.socialLinks === null) {
    return { ...config, socialLinks: DEFAULT_SOCIAL_LINKS_CONFIG }
  }

  const sl = config.socialLinks
  const merged: FooterSocialLinksConfig = {
    enabled: typeof sl.enabled === "boolean" ? sl.enabled : DEFAULT_SOCIAL_LINKS_CONFIG.enabled,
    title: typeof sl.title === "string" ? sl.title : DEFAULT_SOCIAL_LINKS_CONFIG.title,
    placement: sl.placement ?? DEFAULT_SOCIAL_LINKS_CONFIG.placement,
    align: sl.align ?? DEFAULT_SOCIAL_LINKS_CONFIG.align,
    iconStyle: sl.iconStyle ?? DEFAULT_SOCIAL_LINKS_CONFIG.iconStyle,
    iconSet: sl.iconSet ?? DEFAULT_SOCIAL_LINKS_CONFIG.iconSet,
    hoverEffect: sl.hoverEffect ?? DEFAULT_SOCIAL_LINKS_CONFIG.hoverEffect,
    iconSize: sl.iconSize ?? DEFAULT_SOCIAL_LINKS_CONFIG.iconSize,
    gap: sl.gap ?? DEFAULT_SOCIAL_LINKS_CONFIG.gap,
    color: normalizeOptionalString(sl.color),
    hoverColor: normalizeOptionalString(sl.hoverColor),
    backgroundColor: normalizeOptionalString(sl.backgroundColor),
    borderColor: normalizeOptionalString(sl.borderColor),
    openInNewTab: sl.openInNewTab ?? DEFAULT_SOCIAL_LINKS_CONFIG.openInNewTab,
    showLabels: sl.showLabels ?? DEFAULT_SOCIAL_LINKS_CONFIG.showLabels,
    labelColor: normalizeOptionalString(sl.labelColor),
    fillRiseUseNetworkColors: sl.fillRiseUseNetworkColors ?? DEFAULT_SOCIAL_LINKS_CONFIG.fillRiseUseNetworkColors,
    fillRiseFallbackColor: normalizeOptionalString(sl.fillRiseFallbackColor),
    fillRiseIconRotate: sl.fillRiseIconRotate ?? DEFAULT_SOCIAL_LINKS_CONFIG.fillRiseIconRotate,
    fillRiseRotationDegrees: clampFillRiseRotation(sl.fillRiseRotationDegrees),
    fillRiseRotationAxis: sl.fillRiseRotationAxis ?? DEFAULT_SOCIAL_LINKS_CONFIG.fillRiseRotationAxis,
    fillRiseRotationDurationMs: clampFillRiseRotationDuration(sl.fillRiseRotationDurationMs),
    fillRiseDirection: sl.fillRiseDirection ?? DEFAULT_SOCIAL_LINKS_CONFIG.fillRiseDirection,
    fillRiseBorderWidth: clampFillRiseBorderWidth(sl.fillRiseBorderWidth),
    fillRiseBaseBg: normalizeOptionalString(sl.fillRiseBaseBg),
    fillRiseActiveIconColor: normalizeOptionalString(sl.fillRiseActiveIconColor),
    fillRiseRadiusMode: sl.fillRiseRadiusMode ?? DEFAULT_SOCIAL_LINKS_CONFIG.fillRiseRadiusMode,
    liquidUseNetworkColors: sl.liquidUseNetworkColors ?? DEFAULT_SOCIAL_LINKS_CONFIG.liquidUseNetworkColors,
    liquidFallbackColor: normalizeOptionalString(sl.liquidFallbackColor),
    liquidBaseBg: normalizeOptionalString(sl.liquidBaseBg),
    liquidActiveIconColor: normalizeOptionalString(sl.liquidActiveIconColor),
    liquidBorderWidth: clampLiquidBorderWidth(sl.liquidBorderWidth),
    liquidWaveIntensity: sl.liquidWaveIntensity ?? DEFAULT_SOCIAL_LINKS_CONFIG.liquidWaveIntensity,
    liquidSpeed: sl.liquidSpeed ?? DEFAULT_SOCIAL_LINKS_CONFIG.liquidSpeed,
    items: {
      facebook: {
        enabled: sl.items?.facebook?.enabled ?? DEFAULT_SOCIAL_LINKS_CONFIG.items.facebook.enabled,
        url: normalizeOptionalString(sl.items?.facebook?.url),
        iconVariant:
          sl.items?.facebook?.iconVariant ?? DEFAULT_SOCIAL_LINKS_CONFIG.items.facebook.iconVariant,
        label: sl.items?.facebook?.label ?? DEFAULT_SOCIAL_LINKS_CONFIG.items.facebook.label,
      },
      instagram: {
        enabled: sl.items?.instagram?.enabled ?? DEFAULT_SOCIAL_LINKS_CONFIG.items.instagram.enabled,
        url: normalizeOptionalString(sl.items?.instagram?.url),
        iconVariant:
          sl.items?.instagram?.iconVariant ?? DEFAULT_SOCIAL_LINKS_CONFIG.items.instagram.iconVariant,
        label: sl.items?.instagram?.label ?? DEFAULT_SOCIAL_LINKS_CONFIG.items.instagram.label,
      },
    },
  }

  return { ...config, socialLinks: merged }
}
