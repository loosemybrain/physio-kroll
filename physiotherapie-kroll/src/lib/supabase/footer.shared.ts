import { z } from "zod"
import type { FooterConfig, FooterSection, FooterBlock, FooterBottomBar } from "@/types/footer"

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
 * Footer bottom bar schema
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
