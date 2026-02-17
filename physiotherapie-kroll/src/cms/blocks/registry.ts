import { z } from "zod"
import type { CMSBlock, BlockType, HeroBlock, TextBlock, ImageTextBlock, FeatureGridBlock, CtaBlock, SectionBlock, CardBlock, ServicesGridBlock, FaqBlock, TeamBlock, ContactFormBlock, TestimonialsBlock, GalleryBlock, OpeningHoursBlock, ImageSliderBlock, HeroAction } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { uuid } from "@/lib/cms/arrayOps"
import { typographySchema, elementTypographySchema } from "@/lib/typography"
import type { EditableElementDef } from "@/lib/editableElements"
import { getAvailableIconNames } from "@/components/icons/service-icons"

// ---- TestimonialSlider Extension Types (temporary, until in types/cms) ----
export type TestimonialSliderBlock = {
  type: "testimonialSlider"
  props: {
    headline?: string
    subheadline?: string
    background?: "none" | "muted" | "gradient"
    autoplay?: boolean
    interval?: number
    showArrows?: boolean
    showDots?: boolean
    items: Array<{
      id: string
      quote: string
      name: string
      role?: string
      image?: string
    }>
  }
}

// Add InspectorFieldType union for "toggle" (needed for testimonialSlider's inspectorFields; fallback to "boolean" if not supported elsewhere)
export type InspectorFieldType = "text" | "textarea" | "select" | "url" | "image" | "number" | "boolean" | "color" | "toggle"

export interface InspectorField {
  key: string
  label: string
  type: InspectorFieldType
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  required?: boolean
  helpText?: string
  showWhen?: { key: string; equals: any }
}


export interface BlockDefinition<T extends CMSBlock = CMSBlock> {
  type: T["type"]
  label: string
  defaults: T["props"]
  zodSchema: z.ZodType<T["props"]>
  inspectorFields: InspectorField[]
  allowInlineEdit?: boolean
  elements?: EditableElementDef[]
  enableInnerPanel?: boolean
}

const brandKeySchema = z.enum(["physiotherapy", "physio-konzept"])

const mediaValueSchema = z.union([
  z.object({ mediaId: z.string() }),
  z.object({ url: z.string() }),
])

const heroBrandContentSchema = z.object({
  headline: z.string().default(""),
  subheadline: z.string().default(""),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  secondaryCtaText: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
  badgeText: z.string().optional(),
  badgeColor: z.string().optional(),
  badgeBgColor: z.string().optional(),
  playText: z.string().optional(),
  playTextColor: z.string().optional(),
  playBorderColor: z.string().optional(),
  playBgColor: z.string().optional(),
  playHoverBgColor: z.string().optional(),
  trustItems: z.array(z.string()).optional(),
  trustItemsColor: z.string().optional(),
  trustDotColor: z.string().optional(),
  floatingTitle: z.string().optional(),
  floatingTitleColor: z.string().optional(),
  floatingValue: z.string().optional(),
  floatingValueColor: z.string().optional(),
  floatingLabel: z.string().optional(),
  floatingLabelColor: z.string().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  ctaColor: z.string().optional(),
  ctaBgColor: z.string().optional(),
  ctaHoverBgColor: z.string().optional(),
  ctaBorderColor: z.string().optional(),
  image: mediaValueSchema.optional(),
  imageAlt: z.string().optional(),
  imageVariant: z.enum(["landscape", "portrait"]).optional(),
  imageFit: z.enum(["cover", "contain"]).optional(),
  imageFocus: z.enum(["center", "top", "bottom"]).optional(),
  containBackground: z.enum(["none", "blur"]).optional(),
})

const heroPropsSchema = z.object({
  // Legacy props (for backward compatibility)
  mood: brandKeySchema.optional(),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  showMedia: z.boolean().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  mediaUrl: z.string().optional(),
  badgeText: z.string().optional(),
  playText: z.string().optional(),
  trustItems: z.array(z.string()).optional(),
  floatingTitle: z.string().optional(),
  floatingValue: z.string().optional(),
  floatingLabel: z.string().optional(),
  // New brand-specific content structure
  brandContent: z.object({
    physiotherapy: heroBrandContentSchema.optional(),
    "physio-konzept": heroBrandContentSchema.optional(),
  }).optional(),
  typography: elementTypographySchema,
  // Button preset
  buttonPreset: z.string().optional(),
})

const textPropsSchema = z.object({
  content: z.string(),
  alignment: z.enum(["left", "center", "right"]).optional(),
  maxWidth: z.enum(["sm", "md", "lg", "xl", "full"]).optional(),
  textSize: z.enum(["sm", "base", "lg", "xl", "2xl"]).optional(),
  contentColor: z.string().optional(),
  headingColor: z.string().optional(),
  linkColor: z.string().optional(),
  typography: elementTypographySchema,
})

const imageTextPropsSchema = z.object({
  imageUrl: z.string(),
  imageAlt: z.string(),
  imagePosition: z.enum(["left", "right"]).optional(),
  eyebrow: z.string().optional(),
  headline: z.string().optional(),
  content: z.string(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  headlineColor: z.string().optional(),
  contentColor: z.string().optional(),
  ctaTextColor: z.string().optional(),
  ctaBgColor: z.string().optional(),
  ctaHoverBgColor: z.string().optional(),
  ctaBorderColor: z.string().optional(),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  backgroundColor: z.string().optional(),
  designPreset: z.string().optional(),
  style: z.object({
    variant: z.enum(["default", "soft"]).optional(),
    verticalAlign: z.enum(["top", "center"]).optional(),
    textAlign: z.enum(["left", "center"]).optional(),
    maxWidth: z.enum(["md", "lg", "xl"]).optional(),
    imageAspectRatio: z.enum(["4/3", "16/9", "1/1", "3/2"]).optional(),
    paddingY: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
    paddingX: z.enum(["sm", "md", "lg"]).optional(),
  }).optional(),
  buttonPreset: z.string().optional(),
  typography: elementTypographySchema,
})

const featureGridPropsSchema = z.object({
  features: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      titleColor: z.string().optional(),
      descriptionColor: z.string().optional(),
      iconColor: z.string().optional(),
      cardBgColor: z.string().optional(),
      cardBorderColor: z.string().optional(),
      style: z.object({
        variant: z.enum(["default", "soft", "outline", "elevated"]).optional(),
        radius: z.enum(["md", "lg", "xl"]).optional(),
        border: z.enum(["none", "subtle", "strong"]).optional(),
        shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
        accent: z.enum(["none", "brand", "muted"]).optional(),
      }).optional(),
      animation: z.object({
        entrance: z.enum(["none", "fade", "slide-up", "slide-left", "scale"]).optional(),
        hover: z.enum(["none", "lift", "glow", "tilt"]).optional(),
        durationMs: z.number().optional(),
        delayMs: z.number().optional(),
      }).optional(),
    })
  ),
  titleColor: z.string().optional(),
  descriptionColor: z.string().optional(),
  iconColor: z.string().optional(),
  cardBgColor: z.string().optional(),
  cardBorderColor: z.string().optional(),
  columns: z
    .preprocess(
      (v) => (v === "" || v === null || typeof v === "undefined" ? undefined : v),
      z.union([z.literal(2), z.literal(3), z.literal(4)])
    )
    .optional(),
  designPreset: z.string().optional(),
  style: z.object({
    variant: z.enum(["default", "soft", "outline", "elevated"]).optional(),
    radius: z.enum(["md", "lg", "xl"]).optional(),
    border: z.enum(["none", "subtle", "strong"]).optional(),
    shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
    accent: z.enum(["none", "brand", "muted"]).optional(),
  }).optional(),
  animation: z.object({
    entrance: z.enum(["none", "fade", "slide-up", "slide-left", "scale"]).optional(),
    hover: z.enum(["none", "lift", "glow", "tilt"]).optional(),
    durationMs: z.number().optional(),
    delayMs: z.number().optional(),
  }).optional(),
  typography: elementTypographySchema,
})

const ctaPropsSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  primaryCtaText: z.string(),
  primaryCtaHref: z.string(),
  secondaryCtaText: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
  variant: z.enum(["default", "centered", "split"]).optional(),
  backgroundColor: z.string().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  primaryCtaTextColor: z.string().optional(),
  primaryCtaBgColor: z.string().optional(),
  primaryCtaHoverBgColor: z.string().optional(),
  primaryCtaBorderColor: z.string().optional(),
  primaryCtaBorderRadius: z.string().optional(),
  secondaryCtaTextColor: z.string().optional(),
  secondaryCtaBgColor: z.string().optional(),
  secondaryCtaHoverBgColor: z.string().optional(),
  secondaryCtaBorderColor: z.string().optional(),
  secondaryCtaBorderRadius: z.string().optional(),
  buttonPreset: z.string().optional(),
  typography: elementTypographySchema,
})

const sectionPropsSchema = z.object({
  typography: elementTypographySchema,
  elements: z.record(z.string(), z.any()).optional(),
  eyebrow: z.string().optional(),
  headline: z.string(),
  subheadline: z.string().optional(),
  content: z.string(),
  align: z.enum(["left", "center", "justify"]).optional(),
  justifyBias: z.enum(["none", "readable", "tight"]).optional(),
  maxWidth: z.enum(["sm", "md", "lg", "xl", "full"]).optional(),
  background: z.enum(["none", "muted", "gradient-soft", "gradient-brand"]).optional(),
  showDivider: z.boolean().optional(),
  enableGlow: z.boolean().optional(),
  enableHoverElevation: z.boolean().optional(),
  showCta: z.boolean().optional(),
  dividerColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  eyebrowColor: z.string().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  contentColor: z.string().optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  ctaTextColor: z.string().optional(),
  ctaBgColor: z.string().optional(),
  ctaHoverBgColor: z.string().optional(),
  ctaBorderColor: z.string().optional(),
  // Backward compat
  primaryCtaText: z.string().optional(),
  primaryCtaHref: z.string().optional(),
  secondaryCtaText: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
  buttonPreset: z.string().optional(),
})

const cardButtonSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string().optional(),
  onClickAction: z.enum(["none", "open-modal", "scroll-to"]).optional(),
  targetId: z.string().optional(),
  variant: z.enum(["default", "secondary", "outline", "ghost", "link"]).optional(),
  size: z.enum(["sm", "default", "lg"]).optional(),
  icon: z.enum(["none", "arrow-right", "external", "download"]).optional(),
  iconPosition: z.enum(["left", "right"]).optional(),
  disabled: z.boolean().optional(),
})

const cardStyleSchema = z.object({
  variant: z.enum(["default", "soft", "outline", "elevated"]).optional(),
  radius: z.enum(["md", "lg", "xl"]).optional(),
  border: z.enum(["none", "subtle", "strong"]).optional(),
  shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
  accent: z.enum(["none", "brand", "muted"]).optional(),
})

const cardAnimationSchema = z.object({
  entrance: z.enum(["none", "fade", "slide-up", "slide-left", "scale"]).optional(),
  hover: z.enum(["none", "lift", "glow", "tilt"]).optional(),
  durationMs: z.number().optional(),
  delayMs: z.number().optional(),
})

const cardPropsSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  content: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  headerLayout: z.enum(["stacked", "inline-action"]).optional(),
  actionSlot: z.enum(["none", "badge", "icon-button"]).optional(),
  actionLabel: z.string().optional(),
  footerAlign: z.enum(["left", "center", "right"]).optional(),
  buttons: z.array(cardButtonSchema).optional(),
  style: cardStyleSchema.optional(),
  animation: cardAnimationSchema.optional(),
  buttonPreset: z.string().optional(),
})

const servicesGridPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  iconColor: z.string().optional(),
  iconBgColor: z.string().optional(),
  titleColor: z.string().optional(),
  textColor: z.string().optional(),
  ctaColor: z.string().optional(),
  cardBgColor: z.string().optional(),
  cardBorderColor: z.string().optional(),
  columns: z
    .preprocess(
      (v) => (v === "" || v === null || typeof v === "undefined" ? undefined : v),
      z.union([z.literal(2), z.literal(3), z.literal(4)])
    )
    .optional(),
  cards: z.array(
    z.object({
      id: z.string(),
      icon: z.string(),
      title: z.string(), // Allow empty during editing
      text: z.string(), // Allow empty during editing
      ctaText: z.string().optional(),
      ctaHref: z.string().optional(),
      iconColor: z.string().optional(),
      iconBgColor: z.string().optional(),
      titleColor: z.string().optional(),
      textColor: z.string().optional(),
      ctaColor: z.string().optional(),
      cardBgColor: z.string().optional(),
      cardBorderColor: z.string().optional(),
    })
  ).min(1).max(12),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  typography: elementTypographySchema,
})

const faqPropsSchema = z.object({
  headline: z.string().optional(),
  headlineColor: z.string().optional(),
  questionColor: z.string().optional(),
  answerColor: z.string().optional(),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  backgroundColor: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      question: z.string(), // Allow empty during editing
      answer: z.string(), // Allow empty during editing
      questionColor: z.string().optional(),
      answerColor: z.string().optional(),
    })
  ).min(1).max(20),
  variant: z.enum(["default", "soft"]).optional(),
  typography: elementTypographySchema,
})

/* ================================================================ */
/*  Panel Container Props (Reusable Preset for all blocks)            */
/* ================================================================ */

const panelPropsSchema = z.object({
  section: z.any().optional(),
  containerBackgroundMode: z.enum(["transparent", "color", "gradient"]).optional(),
  containerBackgroundColor: z.string().optional(),
  containerBackgroundGradientPreset: z.string().optional(),
  containerBackgroundGradient: z.any().optional(),
  containerShadow: z.any().optional(),
})

const panelDefaults = {
  containerBackgroundMode: "transparent" as const,
  containerBackgroundColor: "",
  containerBackgroundGradientPreset: "soft",
  containerBackgroundGradient: undefined,
  containerShadow: undefined,
}

const panelInspectorFields: InspectorField[] = [
  {
    key: "containerBackgroundMode",
    label: "Panel Hintergrund",
    type: "select",
    options: [
      { value: "transparent", label: "Transparent" },
      { value: "color", label: "Farbe" },
      { value: "gradient", label: "Gradient" },
    ],
  },
  {
    key: "containerBackgroundColor",
    label: "Panel Farbe",
    type: "color",
    placeholder: "#RRGGBB",
    showWhen: { key: "containerBackgroundMode", equals: "color" },
  },
  {
    key: "containerBackgroundGradientPreset",
    label: "Gradient Preset",
    type: "select",
    options: [
      { value: "soft", label: "Soft" },
      { value: "aurora", label: "Aurora" },
      { value: "ocean", label: "Ocean" },
      { value: "sunset", label: "Sunset" },
      { value: "hero", label: "Hero" },
      { value: "none", label: "Keine" },
    ],
    showWhen: { key: "containerBackgroundMode", equals: "gradient" },
  },
  {
    key: "containerBackgroundGradient",
    label: "Gradient (Custom)",
    type: "text",
    placeholder: "Custom gradient (Advanced)",
    showWhen: { key: "containerBackgroundMode", equals: "gradient" },
  },
]

/* ================================================================ */
/*  Inner Panel Auto-Injection Helper                              */
/* ================================================================ */

function withInnerPanel<T extends BlockDefinition>(def: T): T {
  if (!def.enableInnerPanel) return def

  return {
    ...def,
    zodSchema: def.zodSchema ? (def.zodSchema as any).merge(panelPropsSchema) : panelPropsSchema,
    defaults: { ...panelDefaults, ...(def.defaults ?? {}) } as T["defaults"],
    inspectorFields: [
      ...panelInspectorFields,
      ...(def.inspectorFields ?? []),
    ] as InspectorField[],
  } as T
}

/* ================================================================ */
/*  Block Schemas & Defaults                                        */
/* ================================================================ */

const teamPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  nameColor: z.string().optional(),
  roleColor: z.string().optional(),
  ctaColor: z.string().optional(),
  cardBgColor: z.string().optional(),
  cardBorderColor: z.string().optional(),
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(), // Allow empty during editing
      role: z.string(), // Allow empty during editing
      imageUrl: z.string(),
      imageAlt: z.string(),
      ctaText: z.string().optional(),
      ctaHref: z.string().optional(),
      nameColor: z.string().optional(),
      roleColor: z.string().optional(),
      ctaColor: z.string().optional(),
      cardBgColor: z.string().optional(),
      cardBorderColor: z.string().optional(),
    })
  ).min(1).max(12),
  columns: z
    .preprocess(
      (v) => (v === "" || v === null || typeof v === "undefined" ? undefined : v),
      z.union([z.literal(2), z.literal(3), z.literal(4)])
    )
    .optional(),
  // Button preset
  buttonPreset: z.string().optional(),
  // Panel props (merged from panelPropsSchema)
  ...panelPropsSchema.shape,
})

const contactFormPropsSchema = z.object({
  heading: z.string(),
  text: z.string().optional(),
  headingColor: z.string().optional(),
  textColor: z.string().optional(),
  labelColor: z.string().optional(),
  inputTextColor: z.string().optional(),
  inputBgColor: z.string().optional(),
  inputBorderColor: z.string().optional(),
  privacyTextColor: z.string().optional(),
  privacyLinkColor: z.string().optional(),
  consentLabelColor: z.string().optional(),
  buttonTextColor: z.string().optional(),
  buttonBgColor: z.string().optional(),
  buttonHoverBgColor: z.string().optional(),
  buttonBorderColor: z.string().optional(),
  recipients: z.object({
    physiotherapy: z.string().optional(),
    "physio-konzept": z.string().optional(),
  }).optional(),
  fields: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["name", "email", "phone", "subject", "message"]),
      label: z.string(),
      placeholder: z.string().optional(),
      required: z.boolean(),
    })
  ).min(1),
  submitLabel: z.string(),
  successTitle: z.string(),
  successText: z.string(),
  errorText: z.string(),
  privacyText: z.string(),
  privacyLink: z.object({
    label: z.string(),
    href: z.string(),
  }),
  requireConsent: z.boolean().default(false),
  consentLabel: z.string().optional(),
  consentRequiredText: z.string().optional(),
  layout: z.enum(["stack", "split"]).optional(),
  // Button preset
  buttonPreset: z.string().optional(),
})

const testimonialsPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  variant: z.enum(["grid", "slider"]).optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  quoteColor: z.string().optional(),
  nameColor: z.string().optional(),
  roleColor: z.string().optional(),
  columns: z
    .preprocess(
      (v) => (v === "" || v === null || typeof v === "undefined" ? undefined : v),
      z.coerce.number().int().min(1).max(4)
    )
    .optional(),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        quote: z.string(), // allow empty during editing
        quoteColor: z.string().optional(),
        name: z.string(), // allow empty during editing
        nameColor: z.string().optional(),
        role: z.string().optional(),
        roleColor: z.string().optional(),
        rating: z
          .preprocess(
            (v) => (v === "" || v === null || typeof v === "undefined" ? undefined : v),
            z.coerce.number().int().min(1).max(5)
          )
          .optional(),
        avatar: mediaValueSchema.optional(),
      })
    )
    .min(1)
    .max(12),
})

// --- TestimonialSlider Block: Zod schema, defaults, factory ---

const testimonialSliderPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  background: z.enum(["none","muted","gradient"]).optional(),
  autoplay: z.boolean().optional(),
  interval: z.preprocess(
    (v)=> (v === "" || v === null || typeof v === "undefined" ? undefined : v),
    z.coerce.number().int().min(1000).max(30000)
  ).optional(),
  showArrows: z.boolean().optional(),
  showDots: z.boolean().optional(),
  items: z.array(z.object({
    id: z.string(),
    quote: z.string(),
    name: z.string(),
    role: z.string().optional(),
    image: z.string().optional(),
  })).min(1).max(12),
})

const galleryPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  variant: z.enum(["grid", "slider"]).optional(),
  lightbox: z.boolean().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  captionColor: z.string().optional(),
  columns: z
    .preprocess(
      (v) => (v === "" || v === null || typeof v === "undefined" ? undefined : v),
      z.coerce.number().int().min(2).max(4)
    )
    .optional(),
  showCaptions: z.boolean().optional(),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        alt: z.string(), // allow empty during editing
        caption: z.string().optional(),
        captionColor: z.string().optional(),
      })
    )
    .min(3)
    .max(18),
})

const imageSliderPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  cardBgColor: z.string().optional(),
  cardBorderColor: z.string().optional(),
  slideTitleColor: z.string().optional(),
  slideTextColor: z.string().optional(),
  loop: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  autoplayDelayMs: z
    .preprocess(
      (v) => (v === "" || v === null || typeof v === "undefined" ? undefined : v),
      z.coerce.number().int().min(500).max(60000)
    )
    .optional(),
  pauseOnHover: z.boolean().optional(),
  peek: z.boolean().optional(),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  slides: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        alt: z.string(),
        title: z.string().optional(),
        text: z.string().optional(),
        titleColor: z.string().optional(),
        textColor: z.string().optional(),
        cardBgColor: z.string().optional(),
        cardBorderColor: z.string().optional(),
      })
    )
    .min(1)
    .max(12),
})

const openingHoursPropsSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  headlineColor: z.string().optional(),
  subheadlineColor: z.string().optional(),
  labelColor: z.string().optional(),
  valueColor: z.string().optional(),
  noteColor: z.string().optional(),
  cardBgColor: z.string().optional(),
  cardBorderColor: z.string().optional(),
  layout: z.enum(["twoColumn", "stack"]).optional(),
  note: z.string().optional(),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  hours: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(), // allow empty during editing
        value: z.string(), // allow empty during editing
        labelColor: z.string().optional(),
        valueColor: z.string().optional(),
      })
    )
    .min(1)
    .max(10),
})

function getDefaultBrand(): BrandKey {
  return "physiotherapy"
}

const heroDefaults: HeroBlock["props"] = {
  mood: getDefaultBrand(),
  // Legacy props (for backward compatibility)
  headline: "Ihre Gesundheit in besten Händen",
  subheadline: "Professionelle Physiotherapie mit ganzheitlichem Ansatz.",
  ctaText: "Termin vereinbaren",
  ctaHref: "/kontakt",
  showMedia: true,
  mediaType: "image",
  mediaUrl: "/placeholder.svg",
  badgeText: "Vertrauen & Fürsorge",
  playText: "Video ansehen",
  trustItems: ["Über 15 Jahre Erfahrung", "Alle Kassen", "Modernste Therapien"],
  floatingTitle: "Patientenzufriedenheit",
  floatingValue: "98%",
  floatingLabel: undefined,
  // Button preset
  buttonPreset: undefined,
  // New brand-specific content structure
  brandContent: {
    physiotherapy: {
      headline: "Ihre Gesundheit in besten Händen",
      subheadline: "Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualität.",
      ctaText: "Termin vereinbaren",
      ctaHref: "/kontakt",
      badgeText: "Vertrauen & Fürsorge",
      trustItems: ["Über 15 Jahre Erfahrung", "Alle Kassen", "Modernste Therapien"],
      floatingTitle: "Patientenzufriedenheit",
      floatingValue: "98%",
      image: { url: "/placeholder.svg" },
      imageAlt: "Professional physiotherapy treatment in a calm, welcoming environment",
      imageVariant: "landscape",
      imageFit: "cover",
      imageFocus: "center",
      containBackground: "blur",
      actions: [
        {
          id: "primary",
          variant: "primary",
          label: "Termin vereinbaren",
          href: "/kontakt",
        },
      ],
    },
    "physio-konzept": {
      headline: "Push Your Limits",
      subheadline: "Erreiche dein volles Potenzial mit individueller Trainingsbetreuung und sportphysiotherapeutischer Expertise.",
      ctaText: "Jetzt starten",
      secondaryCtaText: "Video ansehen",
      secondaryCtaHref: "#video",
      badgeText: "Performance & Erfolg",
      playText: "Video ansehen",
      floatingTitle: "Nächstes Training",
      floatingValue: "Heute, 18:00",
      image: { url: "/placeholder.svg" },
      imageAlt: "Athlete training with focused determination and energy",
      imageVariant: "landscape",
      imageFit: "cover",
      imageFocus: "center",
      containBackground: "blur",
      actions: [
        {
          id: "primary",
          variant: "primary",
          label: "Jetzt starten",
          href: "/kontakt",
        },
        {
          id: "video",
          variant: "secondary",
          label: "Video ansehen",
          action: "video",
        },
      ],
    },
  },
}

const textDefaults: TextBlock["props"] = {
  content: "Textinhalt hier eingeben...",
  alignment: "left",
  maxWidth: "lg",
  textSize: "base",
}

const imageTextDefaults: ImageTextBlock["props"] = {
  imageUrl: "/placeholder.svg",
  imageAlt: "Bildbeschreibung",
  imagePosition: "left",
  eyebrow: "Label",
  headline: "Überschrift",
  content: "Textinhalt hier eingeben...",
  ctaText: "Mehr erfahren",
  ctaHref: "/",
  background: "none",
  designPreset: "standard",
  style: {
    variant: "default",
    verticalAlign: "center",
    textAlign: "left",
    maxWidth: "lg",
    imageAspectRatio: "4/3",
    paddingY: "md",
    paddingX: "md",
  },
}

const featureGridDefaults: FeatureGridBlock["props"] = {
  features: [
    { id: "1", title: "Feature 1", description: "Beschreibung..." },
    { id: "2", title: "Feature 2", description: "Beschreibung..." },
    { id: "3", title: "Feature 3", description: "Beschreibung..." },
  ],
  columns: 3,
  designPreset: "standard",
  style: {
    variant: "default",
    radius: "xl",
    border: "subtle",
    shadow: "sm",
    accent: "none",
  },
  animation: {
    entrance: "fade",
    hover: "none",
    durationMs: 400,
    delayMs: 0,
  },
}

const ctaDefaults: CtaBlock["props"] = {
  headline: "Bereit zu starten?",
  subheadline: "Kurzer Satz...",
  primaryCtaText: "Kontakt",
  primaryCtaHref: "/kontakt",
  variant: "default",
}

const sectionDefaults: SectionBlock["props"] = {
  eyebrow: "Über uns",
  headline: "Willkommen bei Physiotherapie Kroll",
  subheadline: undefined,
  content: "Hier können Sie Ihren Textinhalt eingeben. Unterstützung von Absätzen via \\n\\n.",
  align: "left",
  justifyBias: "readable",
  maxWidth: "lg",
  background: "none",
  showDivider: false,
  enableGlow: true,
  enableHoverElevation: true,
  showCta: true,
  ctaText: "Mehr erfahren",
  ctaHref: "/kontakt",
}

const cardDefaults: CardBlock["props"] = {
  title: "Card Title",
  eyebrow: "Label",
  description: "Card description",
  content: "Card content goes here",
  align: "left",
  headerLayout: "stacked",
  actionSlot: "none",
  actionLabel: undefined,
  footerAlign: "left",
  buttons: [
    {
      id: "btn-1",
      label: "Action",
      href: "#",
      variant: "default",
      size: "default",
      icon: "arrow-right",
      iconPosition: "right",
      disabled: false,
    },
  ],
  style: {
    variant: "default",
    radius: "xl",
    border: "subtle",
    shadow: "sm",
    accent: "none",
  },
  animation: {
    entrance: "fade",
    hover: "lift",
    durationMs: 400,
    delayMs: 0,
  },
}

export function createCardButton() {
  return {
    id: uuid(),
    label: "New Button",
    href: "#",
    variant: "default" as const,
    size: "default" as const,
    icon: "arrow-right" as const,
    iconPosition: "right" as const,
    disabled: false,
  }
}

function generateUniqueId(prefix: string, index: number): string {
  // Use deterministic IDs for default items (no Date.now, no Math.random)
  // This ensures SSR and Client generate identical IDs for hydration parity
  return `${prefix}-${index}`
}

/**
 * Generate inspector field options for service icons
 * Used in per-item icon selection for ServicesGrid cards
 */
function getServiceIconOptions(): Array<{ value: string; label: string }> {
  return getAvailableIconNames().map((iconName) => ({
    value: iconName,
    label: iconName, // Display as-is for now; could add humanization later
  }))
}

/**
 * Factory functions for creating new array items
 */

export function createServiceCard(): ServicesGridBlock["props"]["cards"][0] {
  return {
    id: uuid(),
    icon: "Heart",
    title: "Neuer Service",
    text: "Beschreibung hier eingeben...",
    ctaText: "Mehr erfahren",
    ctaHref: "/",
  }
}

export function createFaqItem(): FaqBlock["props"]["items"][0] {
  return {
    id: uuid(),
    question: "Neue Frage?",
    answer: "Antwort hier eingeben...",
  }
}

export function createTeamMember(): TeamBlock["props"]["members"][0] {
  return {
    id: uuid(),
    name: "Neues Mitglied",
    role: "Rolle",
    bio: "Bio eingeben...",
    imageUrl: "/placeholder.svg",
    imageAlt: "Portrait",
    avatarGradient: "auto",
    avatarFit: "cover",
    avatarFocus: "center",
    tags: [],
    socials: [],
    ctaText: "Profil ansehen",
    ctaHref: "/team",
  }
}

export function createContactFormField(type: ContactFormBlock["props"]["fields"][0]["type"]): ContactFormBlock["props"]["fields"][0] {
  const defaults: Record<ContactFormBlock["props"]["fields"][0]["type"], { label: string; placeholder: string; required: boolean }> = {
    name: { label: "Name", placeholder: "Ihr Name", required: true },
    email: { label: "E-Mail", placeholder: "ihre@email.de", required: true },
    phone: { label: "Telefon", placeholder: "Optional", required: false },
    subject: { label: "Betreff", placeholder: "Betreff", required: false },
    message: { label: "Nachricht", placeholder: "Ihre Nachricht...", required: true },
  }
  return {
    id: uuid(),
    type,
    ...defaults[type],
  }
}

export function createContactInfoCard(): {
  id: string
  icon: "clock" | "phone" | "mapPin" | "mail"
  title: string
  value: string
} {
  return {
    id: uuid(),
    icon: "mail",
    title: "Neue Info",
    value: "Wert eingeben",
  }
}

export function createHeroTrustItem(): string {
  return "Neuer Vorteil"
}

export function createHeroAction(): HeroAction {
  return {
    id: uuid(),
    variant: "primary",
    label: "Neue Action",
    href: "#",
  }
}

export function createTestimonialItem(): TestimonialsBlock["props"]["items"][0] {
  return {
    id: uuid(),
    quote: "Sehr professionelle Behandlung – ich habe mich vom ersten Termin an gut aufgehoben gefühlt.",
    name: "Julia M.",
    role: "Patientin",
    rating: 5,
    avatar: undefined,
    avatarGradient: "auto", // Default: auto
  }
}

export function createGalleryImage(): GalleryBlock["props"]["images"][0] {
  return {
    id: uuid(),
    url: "/placeholder.svg",
    alt: "",
    caption: "Einblick in unsere Praxis",
  }
}

export function createImageSlide(): ImageSliderBlock["props"]["slides"][0] {
  return {
    id: uuid(),
    url: "/placeholder.svg",
    alt: "",
    title: "Headline…",
    text: "Kurzer Text…",
  }
}

export function createOpeningHour(): OpeningHoursBlock["props"]["hours"][0] {
  return {
    id: uuid(),
    label: "Montag",
    value: "08:00 – 18:00",
  }
}

export function createFeatureItem(): FeatureGridBlock["props"]["features"][0] {
  return {
    id: uuid(),
    title: "Neues Feature",
    description: "Beschreibung hier eingeben...",
  }
}

// ------------ TestimonialSlider: Defaults + Factory ---------------
const testimonialSliderDefaults: TestimonialSliderBlock["props"] = {
  headline: "Vertrauen, das man spürt",
  subheadline: "Das sagen unsere Patienten",
  background: "none",
  autoplay: false,
  interval: 6000,
  showArrows: true,
  showDots: true,
  items: [
    { id: generateUniqueId("testimonialSlider",0), quote:"...", name:"Julia M.", role:"Patientin", image:"" },
    { id: generateUniqueId("testimonialSlider",1), quote:"...", name:"Michael K.", role:"Patient", image:"" },
  ],
}

export function createTestimonialSliderItem(): TestimonialSliderBlock["props"]["items"][0] {
  return { id: uuid(), quote: "", name: "", role: "", image: "" }
}

const servicesGridDefaults: ServicesGridBlock["props"] = {
  headline: "Angebote & Kurse",
  subheadline: "Therapie, Training und Kurse – alles an einem Ort.",
  columns: 3,
  background: "none",
  cards: [
    { id: generateUniqueId("card", 0), icon: "HeartPulse", title: "Physiotherapie", text: "Individuelle Behandlung für Ihre Gesundheit und Wohlbefinden.", ctaText: "Mehr erfahren", ctaHref: "/physiotherapie" },
    { id: generateUniqueId("card", 1), icon: "Dumbbell", title: "Training", text: "Gezieltes Kraft- und Ausdauertraining für optimale Ergebnisse.", ctaText: "Mehr erfahren", ctaHref: "/training" },
    { id: generateUniqueId("card", 2), icon: "Activity", title: "Rehabilitation", text: "Professionelle Reha nach Verletzungen und Operationen.", ctaText: "Mehr erfahren", ctaHref: "/rehabilitation" },
    { id: generateUniqueId("card", 3), icon: "Users", title: "Gruppenkurse", text: "Gemeinsam trainieren und motiviert bleiben in der Gruppe.", ctaText: "Mehr erfahren", ctaHref: "/kurse" },
    { id: generateUniqueId("card", 4), icon: "Clock", title: "Prävention", text: "Vorbeugende Maßnahmen für langfristige Gesundheit.", ctaText: "Mehr erfahren", ctaHref: "/praevention" },
    { id: generateUniqueId("card", 5), icon: "Sparkles", title: "Wellness", text: "Entspannung und Regeneration für Körper und Geist.", ctaText: "Mehr erfahren", ctaHref: "/wellness" },
  ],
}

const faqDefaults: FaqBlock["props"] = {
  headline: "Häufige Fragen",
  background: "none",
  backgroundColor: "",
  variant: "default",
  items: [
    { id: generateUniqueId("faq", 0), question: "Wie lange dauert eine Behandlung?", answer: "Eine Behandlungseinheit dauert in der Regel 30-60 Minuten, abhängig von der Art der Therapie und Ihren individuellen Bedürfnissen." },
    { id: generateUniqueId("faq", 1), question: "Werden die Kosten von der Krankenkasse übernommen?", answer: "Ja, wir arbeiten mit allen gesetzlichen und privaten Krankenkassen zusammen. Die Kostenübernahme hängt von Ihrer Versicherung und der Art der Behandlung ab." },
    { id: generateUniqueId("faq", 2), question: "Brauche ich eine Überweisung vom Arzt?", answer: "Für die meisten Behandlungen benötigen Sie eine ärztliche Verordnung. Bei privaten Behandlungen ist keine Überweisung erforderlich." },
    { id: generateUniqueId("faq", 3), question: "Wie kann ich einen Termin vereinbaren?", answer: "Sie können einen Termin telefonisch, per E-Mail oder über unser Online-Buchungssystem vereinbaren. Wir bemühen uns, Ihnen zeitnah einen passenden Termin anzubieten." },
    { id: generateUniqueId("faq", 4), question: "Was sollte ich zum ersten Termin mitbringen?", answer: "Bitte bringen Sie Ihre Versichertenkarte, einen gültigen Ausweis und, falls vorhanden, ärztliche Befunde oder Verordnungen mit." },
  ],
}

const teamDefaults: TeamBlock["props"] = {
  headline: "Unser Team",
  subheadline: "Erfahrene Therapeuten für Ihre Gesundheit.",
  eyebrow: "UNSER TEAM",
  columns: 3,
  layout: "cards",
  background: "none",
  section: {
    layout: {
      width: "contained",
      paddingY: "lg",
      paddingX: "md",
    },
    background: {
      type: "none",
    },
  },
  // Inner container background defaults (transparent by default)
  containerBackgroundMode: "transparent",
  containerBackgroundColor: undefined,
  containerBackgroundGradientPreset: "soft",
  containerBackgroundGradient: undefined,
  members: [
    { 
      id: generateUniqueId("member", 0), 
      name: "Max Mustermann", 
      role: "Physiotherapeut",
      bio: "Leidenschaftlicher Therapeut mit über 10 Jahren Erfahrung in der modernen Physiotherapie.",
      imageUrl: "/placeholder.svg", 
      imageAlt: "Max Mustermann",
      avatarGradient: "g1",
      avatarFit: "cover",
      avatarFocus: "center",
      tags: ["Physiotherapie", "Rehabilitation"],
      socials: [
        { type: "linkedin", href: "https://linkedin.com" },
        { type: "email", href: "mailto:max@example.com" }
      ],
      ctaText: "Profil ansehen", 
      ctaHref: "/team/max-mustermann" 
    },
    { 
      id: generateUniqueId("member", 1), 
      name: "Anna Schmidt", 
      role: "Sportphysiotherapeutin",
      bio: "Spezialistin für Sportmedizin und Leistungsoptimierung mit Top-Athleten.",
      imageUrl: "/placeholder.svg", 
      imageAlt: "Anna Schmidt",
      avatarGradient: "g2",
      avatarFit: "cover",
      avatarFocus: "center",
      tags: ["Sportmedizin", "Training"],
      socials: [
        { type: "linkedin", href: "https://linkedin.com" }
      ],
      ctaText: "Profil ansehen", 
      ctaHref: "/team/anna-schmidt" 
    },
    { 
      id: generateUniqueId("member", 2), 
      name: "Thomas Weber", 
      role: "Reha-Spezialist",
      bio: "Erfahrener Experte für medizinische Rehabilitation und postoperative Betreuung.",
      imageUrl: "/placeholder.svg", 
      imageAlt: "Thomas Weber",
      avatarGradient: "g3",
      avatarFit: "cover",
      avatarFocus: "center",
      tags: ["Rehabilitation", "Schmerztherapie"],
      socials: [
        { type: "website", href: "https://example.com" }
      ],
      ctaText: "Profil ansehen", 
      ctaHref: "/team/thomas-weber" 
    },
  ],
  // Button preset
  buttonPreset: undefined,
}

const contactFormDefaults: ContactFormBlock["props"] = {
  heading: "Kontaktieren Sie uns",
  text: "Wir freuen uns auf Ihre Nachricht und melden uns schnellstmöglich zurück.",
  recipients: {
    physiotherapy: "info@physiotherapie-kroll.de",
    "physio-konzept": "info@physio-konzept.de",
  },
  fields: [
    { id: uuid(), type: "name", label: "Name", placeholder: "Ihr Name", required: true },
    { id: uuid(), type: "email", label: "E-Mail", placeholder: "ihre@email.de", required: true },
    { id: uuid(), type: "phone", label: "Telefon", placeholder: "Optional", required: false },
    { id: uuid(), type: "message", label: "Nachricht", placeholder: "Ihre Nachricht...", required: true },
  ],
  submitLabel: "Nachricht senden",
  successTitle: "Nachricht gesendet",
  successText: "Vielen Dank für Ihre Nachricht. Wir melden uns schnellstmöglich bei Ihnen zurück.",
  errorText: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt per E-Mail.",
  privacyText: "Wir verwenden Ihre Angaben zur Bearbeitung Ihrer Anfrage. Weitere Informationen finden Sie in der Datenschutzerklärung.",
  privacyLink: {
    label: "Datenschutzerklärung",
    href: "/datenschutz",
  },
  requireConsent: false,
  consentLabel: "Ich akzeptiere die Datenschutzerklärung",
  layout: "stack",
  // Button preset
  buttonPreset: undefined,
}

const testimonialsDefaults: TestimonialsBlock["props"] = {
  headline: "Was unsere Patienten sagen",
  subheadline: "Echte Erfahrungen aus unserer Praxis – persönlich, ehrlich, hilfreich.",
  variant: "grid",
  columns: 3,
  background: "none",
  items: [
    {
      id: generateUniqueId("testimonial", 0),
      quote: "Sehr professionelle Behandlung – nach wenigen Terminen ging es mir deutlich besser.",
      name: "Julia M.",
      role: "Patientin",
      rating: 5,
      avatarGradient: "g1",
    },
    {
      id: generateUniqueId("testimonial", 1),
      quote: "Kompetent, freundlich und super organisiert. Ich komme gerne wieder.",
      name: "Thomas K.",
      role: "Patient",
      rating: 5,
      avatarGradient: "g2",
    },
    {
      id: generateUniqueId("testimonial", 2),
      quote: "Individuelle Übungen und gute Erklärungen. Endlich verstehe ich, was meinem Rücken hilft.",
      name: "Sarah L.",
      role: "Patientin",
      rating: 4,
      avatarGradient: "g3",
    },
  ],
}

const galleryDefaults: GalleryBlock["props"] = {
  headline: "Galerie",
  subheadline: "Einblicke in unsere Räume und unseren Alltag.",
  variant: "grid",
  lightbox: false,
  columns: 3,
  showCaptions: true,
  background: "none",
  images: [
    { id: generateUniqueId("image", 0), url: "/placeholder.svg", alt: "", caption: "Behandlungsraum" },
    { id: generateUniqueId("image", 1), url: "/placeholder.svg", alt: "", caption: "Trainingsbereich" },
    { id: generateUniqueId("image", 2), url: "/placeholder.svg", alt: "", caption: "Empfang" },
  ],
}

const openingHoursDefaults: OpeningHoursBlock["props"] = {
  headline: "Öffnungszeiten",
  subheadline: "Wir sind zu folgenden Zeiten für Sie da.",
  layout: "twoColumn",
  note: "Termine nach Vereinbarung. Bitte rufen Sie uns an oder nutzen Sie das Kontaktformular.",
  background: "none",
  hours: [
    { id: generateUniqueId("hours", 0), label: "Montag", value: "08:00 – 18:00" },
    { id: generateUniqueId("hours", 1), label: "Dienstag", value: "08:00 – 18:00" },
    { id: generateUniqueId("hours", 2), label: "Mittwoch", value: "08:00 – 16:00" },
    { id: generateUniqueId("hours", 3), label: "Donnerstag", value: "08:00 – 18:00" },
    { id: generateUniqueId("hours", 4), label: "Freitag", value: "08:00 – 14:00" },
  ],
}

const imageSliderDefaults: ImageSliderBlock["props"] = {
  headline: "Impressionen",
  subheadline: "Ein kleiner Einblick – wischen oder klicken Sie sich durch.",
  loop: true,
  autoplay: false,
  autoplayDelayMs: 5000,
  pauseOnHover: true,
  peek: true,
  background: "none",
  slides: [
    { id: generateUniqueId("slide", 0), url: "/placeholder.svg", alt: "", title: "Behandlungsraum", text: "Ruhige Atmosphäre für Ihre Therapie." },
    { id: generateUniqueId("slide", 1), url: "/placeholder.svg", alt: "", title: "Trainingsbereich", text: "Modernes Equipment für gezieltes Training." },
    { id: generateUniqueId("slide", 2), url: "/placeholder.svg", alt: "", title: "Empfang", text: "Freundlich. Persönlich. Organisiert." },
  ],
}

/**
 * Block registry with all block definitions
 */
// Temporäre UI-Gate: unstabile/ungetestete Section-Felder verstecken (nur UI, keine DB/Props-Änderung)
const HIDE_UNSTABLE_SECTION_FIELDS = true

export const blockRegistry: Record<BlockType, BlockDefinition> = {
  hero: {
    type: "hero",
    label: "Hero",
    defaults: heroDefaults,
    zodSchema: heroPropsSchema,
    allowInlineEdit: true,
    elements: [
      {
        id: "headline",
        label: "Überschrift",
        path: "headline",
        supportsTypography: true,
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "subheadline",
        label: "Unterüberschrift",
        path: "subheadline",
        supportsTypography: true,
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "badge",
        label: "Badge/Auszeichnung",
        path: "badgeText",
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "cta",
        label: "CTA Button",
        path: "ctaText",
        supportsTypography: true,
        supportsShadow: true,
        group: "Call-to-Action",
      },
      {
        id: "secondaryCtaText",
        label: "Sekundäre CTA",
        path: "secondaryCtaText",
        supportsTypography: true,
        supportsShadow: true,
        group: "Call-to-Action",
      },
      {
        id: "media",
        label: "Bild/Media",
        path: "image",
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "trustItem",
        label: "Vertrauens-Item",
        path: "trustItems",
        supportsShadow: true,
        dynamic: true,
        idTemplate: "trustItems.{index}",
        labelTemplate: "Trust Item {index+1}",
        itemCountPath: "trustItems",
        group: "Inhalt",
      },
    ],
    inspectorFields: [
      // Brand/Mood
      {
        key: "mood",
        label: "Brand/Mood",
        type: "select",
        options: [
          { value: "physiotherapy", label: "Physiotherapie" },
          { value: "physio-konzept", label: "Physio-Konzept" },
        ],
      },
      // Texte & CTAs
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "Überschrift eingeben",
      },
      {
        key: "subheadline",
        label: "Subheadline",
        type: "textarea",
        placeholder: "Unterüberschrift eingeben",
      },
      {
        key: "headlineColor",
        label: "Headline Farbe",
        type: "color",
        placeholder: "#111111",
      },
      {
        key: "subheadlineColor",
        label: "Subheadline Farbe",
        type: "color",
        placeholder: "#888888",
      },
      {
        key: "ctaText",
        label: "CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "ctaHref",
        label: "CTA Link",
        type: "url",
        placeholder: "/kontakt",
      },
      {
        key: "ctaColor",
        label: "CTA Textfarbe",
        type: "color",
        placeholder: "#FFFFFF",
      },
      {
        key: "ctaBgColor",
        label: "CTA Hintergrundfarbe",
        type: "color",
        placeholder: "#308973",
      },
      {
        key: "ctaHoverBgColor",
        label: "CTA Hover Hintergrundfarbe",
        type: "color",
        placeholder: "#276D5A",
      },
      {
        key: "ctaBorderColor",
        label: "CTA Rahmenfarbe",
        type: "color",
        placeholder: "#276D5A",
      },
      {
        key: "secondaryCtaText",
        label: "Sekundäre CTA Text",
        type: "text",
        placeholder: "2. Button-Text",
      },
      {
        key: "secondaryCtaHref",
        label: "Sekundäre CTA Link",
        type: "url",
        placeholder: "/zweiter-link",
      },

      // Badge
      {
        key: "badgeText",
        label: "Badge Text",
        type: "text",
        placeholder: "Badge-Text",
      },
      {
        key: "badgeColor",
        label: "Badge Textfarbe",
        type: "color",
        placeholder: "#FFFFFF",
      },
      {
        key: "badgeBgColor",
        label: "Badge Hintergrundfarbe",
        type: "color",
        placeholder: "#308973",
      },

      // Play Button für Video
      {
        key: "playText",
        label: "Video Button Text",
        type: "text",
        placeholder: "Video ansehen",
      },
      {
        key: "playTextColor",
        label: "Play-Button Textfarbe",
        type: "color",
        placeholder: "#FFFFFF",
      },
      {
        key: "playBorderColor",
        label: "Play-Button Rahmen",
        type: "color",
        placeholder: "#308973",
      },
      {
        key: "playBgColor",
        label: "Play-Button Hintergrund",
        type: "color",
        placeholder: "#276D5A",
      },
      {
        key: "playHoverBgColor",
        label: "Play-Button Hover",
        type: "color",
        placeholder: "#1F5342",
      },

      // Trust Items
      {
        key: "trustItems.0",
        label: "Trust Item 1",
        type: "text",
        placeholder: "Über 15 Jahre Erfahrung",
      },
      {
        key: "trustItems.1",
        label: "Trust Item 2",
        type: "text",
        placeholder: "Alle Kassen",
      },
      {
        key: "trustItems.2",
        label: "Trust Item 3",
        type: "text",
        placeholder: "Modernste Therapien",
      },
      {
        key: "trustItemsColor",
        label: "Trust Items Textfarbe",
        type: "color",
        placeholder: "#222",
      },
      {
        key: "trustDotColor",
        label: "Trust Dot Farbe",
        type: "color",
        placeholder: "#308973",
      },

      // Floating Card
      {
        key: "floatingTitle",
        label: "Floating Card Titel",
        type: "text",
        placeholder: "Patientenzufriedenheit",
      },
      {
        key: "floatingTitleColor",
        label: "Floating Titel-Farbe",
        type: "color",
        placeholder: "#222",
      },
      {
        key: "floatingValue",
        label: "Floating Card Wert",
        type: "text",
        placeholder: "98%",
      },
      {
        key: "floatingValueColor",
        label: "Floating Wert-Farbe",
        type: "color",
        placeholder: "#308973",
      },
      {
        key: "floatingLabel",
        label: "Floating Card Label (optional)",
        type: "text",
        placeholder: "Optionaler Untertext",
      },
      {
        key: "floatingLabelColor",
        label: "Floating Label-Farbe",
        type: "color",
        placeholder: "#888",
      },

      // Media/Legacy Media section
      {
        key: "showMedia",
        label: "Media anzeigen (Legacy)",
        type: "boolean",
      },
      {
        key: "mediaType",
        label: "Media Typ (Legacy)",
        type: "select",
        options: [
          { value: "image", label: "Bild" },
          { value: "video", label: "Video" },
        ],
      },
      {
        key: "mediaUrl",
        label: "Media URL (Legacy)",
        type: "image",
        placeholder: "/placeholder.svg",
      },

      // Bild/Medien modern (brandContent Feature Set)
      {
        key: "image",
        label: "Bilddatei",
        type: "image",
        placeholder: "/placeholder.svg",
      },
      {
        key: "imageAlt",
        label: "Bild Alt-Text",
        type: "text",
        placeholder: "Bildbeschreibung",
      },
      {
        key: "imageVariant",
        label: "Bild-Format",
        type: "select",
        options: [
          { value: "landscape", label: "Querformat" },
          { value: "portrait", label: "Hochformat" },
        ],
      },
      {
        key: "imageFit",
        label: "Bild Füllung",
        type: "select",
        options: [
          { value: "cover", label: "Cover (ausfüllen)" },
          { value: "contain", label: "Contain (einpassen)" },
        ],
      },
      {
        key: "imageFocus",
        label: "Bildfokus",
        type: "select",
        options: [
          { value: "center", label: "Zentriert" },
          { value: "top", label: "Oben" },
          { value: "bottom", label: "Unten" },
        ],
      },
      {
        key: "containBackground",
        label: "Bild-Hintergrund",
        type: "select",
        options: [
          { value: "none", label: "Kein Blur" },
          { value: "blur", label: "Weichzeichnen" },
        ],
      },
    ],
  },
  text: {
    type: "text",
    label: "Text",
    defaults: textDefaults,
    zodSchema: textPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "content",
        label: "Inhalt",
        type: "textarea",
        placeholder: "Textinhalt (HTML möglich)",
        required: true,
      },
      {
        key: "alignment",
        label: "Ausrichtung",
        type: "select",
        options: [
          { value: "left", label: "Links" },
          { value: "center", label: "Zentriert" },
          { value: "right", label: "Rechts" },
        ],
      },
      {
        key: "maxWidth",
        label: "Maximale Breite",
        type: "select",
        options: [
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
          { value: "full", label: "Vollbreite" },
        ],
      },
      {
        key: "textSize",
        label: "Textgröße",
        type: "select",
        options: [
          { value: "sm", label: "Small" },
          { value: "base", label: "Base" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
          { value: "2xl", label: "2x Large" },
        ],
      },
      { key: "contentColor", label: "Textfarbe", type: "color", placeholder: "#111111" },
      { key: "headingColor", label: "Überschriftenfarbe", type: "color", placeholder: "#111111" },
      { key: "linkColor", label: "Linkfarbe", type: "color", placeholder: "#2563eb" },
    ],
  },
  imageText: {
    type: "imageText",
    label: "Bild + Text",
    defaults: imageTextDefaults,
    zodSchema: imageTextPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "imageUrl",
        label: "Bild URL",
        type: "image",
        placeholder: "/placeholder.svg",
        required: true,
      },
      {
        key: "imageAlt",
        label: "Bild Alt-Text",
        type: "text",
        placeholder: "Bildbeschreibung",
        required: true,
      },
      // Style controls
      {
        key: "style.variant",
        label: "Variante",
        type: "select",
        options: [
          { value: "default", label: "Default" },
          { value: "soft", label: "Soft" },
        ],
      },
      {
        key: "style.verticalAlign",
        label: "Vertikale Ausrichtung",
        type: "select",
        options: [
          { value: "top", label: "Oben" },
          { value: "center", label: "Zentriert" },
        ],
      },
      {
        key: "style.textAlign",
        label: "Text Ausrichtung",
        type: "select",
        options: [
          { value: "left", label: "Links" },
          { value: "center", label: "Zentriert" },
        ],
      },
      {
        key: "style.maxWidth",
        label: "Maximale Breite",
        type: "select",
        options: [
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
      {
        key: "style.imageAspectRatio",
        label: "Bild Seitenverhältnis",
        type: "select",
        options: [
          { value: "4/3", label: "4:3 (Standard)" },
          { value: "16/9", label: "16:9 (Breitbild)" },
          { value: "1/1", label: "1:1 (Quadrat)" },
          { value: "3/2", label: "3:2 (Klassisch)" },
        ],
      },
      // Spacing section
      {
        key: "style.paddingY",
        label: "Padding (Vertikal)",
        type: "select",
        options: [
          { value: "none", label: "Keine" },
          { value: "sm", label: "Klein" },
          { value: "md", label: "Mittel" },
          { value: "lg", label: "Groß" },
          { value: "xl", label: "Extra Groß" },
        ],
      },
      {
        key: "style.paddingX",
        label: "Padding (Horizontal)",
        type: "select",
        options: [
          { value: "sm", label: "Klein" },
          { value: "md", label: "Mittel" },
          { value: "lg", label: "Groß" },
        ],
      },
      {
        key: "imagePosition",
        label: "Bildposition",
        type: "select",
        options: [
          { value: "left", label: "Links" },
          { value: "right", label: "Rechts" },
        ],
      },
      {
        key: "eyebrow",
        label: "Eyebrow (Label)",
        type: "text",
        placeholder: "Label eingeben",
      },
      {
        key: "headline",
        label: "Überschrift",
        type: "text",
        placeholder: "Überschrift eingeben",
      },
      {
        key: "content",
        label: "Inhalt",
        type: "textarea",
        placeholder: "Textinhalt (HTML möglich)",
        required: true,
      },
      {
        key: "ctaText",
        label: "CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "ctaHref",
        label: "CTA Link",
        type: "url",
        placeholder: "/",
      },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "contentColor", label: "Inhalt Farbe", type: "color", placeholder: "#666666" },
      { key: "ctaTextColor", label: "CTA Text Farbe", type: "color", placeholder: "#ffffff" },
      { key: "ctaBgColor", label: "CTA Hintergrund", type: "color", placeholder: "#111111" },
      { key: "ctaHoverBgColor", label: "CTA Hover Hintergrund", type: "color", placeholder: "#000000" },
      { key: "ctaBorderColor", label: "CTA Border", type: "color", placeholder: "#111111" },
      {
        key: "background",
        label: "Hintergrund",
        type: "select",
        options: [
          { value: "none", label: "Keine" },
          { value: "muted", label: "Dezent" },
          { value: "gradient", label: "Verlauf" },
        ],
      },
      { key: "backgroundColor", label: "Hintergrundfarbe (Custom)", type: "color", placeholder: "#ffffff" },
    ],
  },
  section: {
    type: "section",
    label: "Section",
    defaults: sectionDefaults,
    zodSchema: sectionPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      { key: "eyebrow", label: "Eyebrow", type: "text", placeholder: "Über uns" },
      { key: "headline", label: "Headline", type: "text", placeholder: "Willkommen bei Physiotherapie Kroll", required: true },
      { key: "subheadline", label: "Subheadline (optional)", type: "text", placeholder: "Kurze Beschreibung..." },
      { key: "content", label: "Inhalt", type: "textarea", placeholder: "Textinhalt mit Absätzen via \\n\\n", required: true },
      {
        key: "align",
        label: "Ausrichtung",
        type: "select",
        options: [
          { value: "left", label: "Links" },
          { value: "center", label: "Zentriert" },
          { value: "justify", label: "Blocksatz" },
        ],
      },
      {
        key: "justifyBias",
        label: "Justifikations-Modus",
        type: "select",
        options: [
          { value: "none", label: "Keine Anpassung" },
          { value: "readable", label: "Lesbar (max-w-prose)" },
          { value: "tight", label: "Enger (max-w-3xl)" },
        ],
      },
      {
        key: "maxWidth",
        label: "Maximale Breite",
        type: "select",
        options: [
          { value: "sm", label: "Small (xl)" },
          { value: "md", label: "Medium (2xl)" },
          { value: "lg", label: "Large (4xl)" },
          { value: "xl", label: "Extra Large (6xl)" },
          { value: "full", label: "Vollbreite" },
        ],
      },
      {
        key: "background",
        label: "Hintergrund",
        type: "select",
        options: [
          { value: "none", label: "Kein Hintergrund" },
          { value: "muted", label: "Dezent (Muted)" },
          { value: "gradient-soft", label: "Soft Gradient" },
          { value: "gradient-brand", label: "Brand Gradient" },
        ],
      },
      ...(HIDE_UNSTABLE_SECTION_FIELDS
        ? []
        : [
            { key: "showDivider", label: "Divider anzeigen", type: "boolean" as const },
            { key: "enableGlow", label: "Glow-Effekt aktivieren", type: "boolean" as const },
            { key: "enableHoverElevation", label: "Hover-Elevation aktivieren", type: "boolean" as const },
            { key: "showCta", label: "CTA Button anzeigen", type: "boolean" as const },
            {
              key: "dividerColor",
              label: "Divider-Farbe",
              type: "color" as const,
            },
          ]),
      { key: "enableHoverElevation", label: "Hover-Elevation aktivieren", type: "boolean" as const },
      { key: "ctaText", label: "CTA Button Text", type: "text", placeholder: "Mehr erfahren" },
      { key: "ctaHref", label: "CTA Button Link", type: "url", placeholder: "/kontakt" },
      { key: "secondaryCtaText", label: "Sekundärer CTA Text (optional)", type: "text", placeholder: "Weitere Info" },
      { key: "secondaryCtaHref", label: "Sekundärer CTA Link", type: "url", placeholder: "/info" },

      { key: "backgroundColor", label: "Hintergrundfarbe (Custom)", type: "color", placeholder: "#ffffff" },
      { key: "eyebrowColor", label: "Eyebrow Farbe", type: "color", placeholder: "#8f8f8f" },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#222222" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#888888" },
      { key: "contentColor", label: "Inhalt Farbe", type: "color", placeholder: "#666666" },
      { key: "ctaTextColor", label: "CTA Text Farbe", type: "color", placeholder: "#ffffff" },
      { key: "ctaBgColor", label: "CTA Hintergrund", type: "color", placeholder: "#308973" },
      { key: "ctaHoverBgColor", label: "CTA Hover Hintergrund", type: "color", placeholder: "#276D5A" },
      { key: "ctaBorderColor", label: "CTA Border Farbe", type: "color", placeholder: "#276D5A" },
    ],
    elements: [
      {
        id: "section.surface",
        label: "Oberfläche/Hintergrund",
        path: "surface",
        supportsShadow: true,
        group: "Layout",
      },
      {
        id: "section.eyebrow",
        label: "Eyebrow/Label",
        path: "eyebrow",
        supportsTypography: true,
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "section.headline",
        label: "Überschrift",
        path: "headline",
        supportsTypography: true,
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "section.subheadline",
        label: "Unterüberschrift",
        path: "subheadline",
        supportsTypography: true,
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "section.divider",
        label: "Divider/Trennlinie",
        path: "divider",
        supportsShadow: true,
        group: "Dekorative Elemente",
      },
      {
        id: "section.content",
        label: "Inhalt/Body Text",
        path: "content",
        supportsTypography: true,
        supportsShadow: true,
        group: "Inhalt",
      },
      {
        id: "section.ctaPrimary",
        label: "Primärer CTA Button",
        path: "ctaText",
        supportsTypography: true,
        supportsShadow: true,
        group: "Call-to-Action",
      },
      {
        id: "section.ctaSecondary",
        label: "Sekundärer CTA Button",
        path: "secondaryCtaText",
        supportsTypography: true,
        supportsShadow: true,
        group: "Call-to-Action",
      },
    ],
  },
  card: {
    type: "card",
    label: "Card",
    defaults: cardDefaults,
    zodSchema: cardPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      // Content
      { key: "eyebrow", label: "Eyebrow (Label)", type: "text", placeholder: "Label" },
      { key: "title", label: "Title", type: "text", placeholder: "Card Title", required: true },
      { key: "description", label: "Description", type: "text", placeholder: "Card description" },
      { key: "content", label: "Content", type: "textarea", placeholder: "Card content" },
      
      // Layout
      {
        key: "align",
        label: "Text Alignment",
        type: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
      {
        key: "headerLayout",
        label: "Header Layout",
        type: "select",
        options: [
          { value: "stacked", label: "Stacked" },
          { value: "inline-action", label: "Inline Action" },
        ],
      },
      {
        key: "actionSlot",
        label: "Action Slot",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "badge", label: "Badge" },
          { value: "icon-button", label: "Icon Button" },
        ],
      },
      { key: "actionLabel", label: "Action Label", type: "text", placeholder: "New" },
      {
        key: "footerAlign",
        label: "Footer Alignment",
        type: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
      
      // Style
      {
        key: "style.variant",
        label: "Card Variant",
        type: "select",
        options: [
          { value: "default", label: "Default" },
          { value: "soft", label: "Soft" },
          { value: "outline", label: "Outline" },
          { value: "elevated", label: "Elevated" },
        ],
      },
      {
        key: "style.radius",
        label: "Border Radius",
        type: "select",
        options: [
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
      {
        key: "style.border",
        label: "Border Style",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "subtle", label: "Subtle" },
          { value: "strong", label: "Strong" },
        ],
      },
      {
        key: "style.shadow",
        label: "Shadow",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
        ],
      },
      {
        key: "style.accent",
        label: "Accent Color",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "brand", label: "Brand" },
          { value: "muted", label: "Muted" },
        ],
      },
      
      // Animation
      {
        key: "animation.entrance",
        label: "Entrance Animation",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "fade", label: "Fade" },
          { value: "slide-up", label: "Slide Up" },
          { value: "slide-left", label: "Slide Left" },
          { value: "scale", label: "Scale" },
        ],
      },
      {
        key: "animation.hover",
        label: "Hover Animation",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "lift", label: "Lift" },
          { value: "glow", label: "Glow" },
          { value: "tilt", label: "Tilt" },
        ],
      },
      {
        key: "animation.durationMs",
        label: "Animation Duration (ms)",
        type: "number",
        placeholder: "400",
      },
      {
        key: "animation.delayMs",
        label: "Animation Delay (ms)",
        type: "number",
        placeholder: "0",
      },
    ],
  },
  featureGrid: {
    type: "featureGrid",
    label: "Feature Grid",
    defaults: featureGridDefaults,
    zodSchema: featureGridPropsSchema,
    inspectorFields: [
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
      // Style controls
      {
        key: "style.variant",
        label: "Card Variant",
        type: "select",
        options: [
          { value: "default", label: "Default" },
          { value: "soft", label: "Soft" },
          { value: "outline", label: "Outline" },
          { value: "elevated", label: "Elevated" },
        ],
      },
      {
        key: "style.radius",
        label: "Border Radius",
        type: "select",
        options: [
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
      {
        key: "style.border",
        label: "Border Style",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "subtle", label: "Subtle" },
          { value: "strong", label: "Strong" },
        ],
      },
      {
        key: "style.shadow",
        label: "Shadow",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
        ],
      },
      {
        key: "style.accent",
        label: "Accent Color",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "brand", label: "Brand" },
          { value: "muted", label: "Muted" },
        ],
      },
      // Animation controls
      {
        key: "animation.entrance",
        label: "Entrance Animation",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "fade", label: "Fade" },
          { value: "slide-up", label: "Slide Up" },
          { value: "slide-left", label: "Slide Left" },
          { value: "scale", label: "Scale" },
        ],
      },
      {
        key: "animation.hover",
        label: "Hover Animation",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "lift", label: "Lift" },
          { value: "glow", label: "Glow" },
          { value: "tilt", label: "Tilt" },
        ],
      },
      {
        key: "animation.durationMs",
        label: "Animation Duration (ms)",
        type: "number",
        placeholder: "400",
      },
      {
        key: "animation.delayMs",
        label: "Animation Delay (ms)",
        type: "number",
        placeholder: "0",
      },
      // Global colors
      { key: "titleColor", label: "Title Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "descriptionColor", label: "Beschreibung Farbe (global)", type: "color", placeholder: "#666666" },
      { key: "iconColor", label: "Icon Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "cardBgColor", label: "Card Hintergrund (global)", type: "color", placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border (global)", type: "color", placeholder: "#e5e7eb" },
    ],
  },
  cta: {
    type: "cta",
    label: "Call to Action",
    defaults: ctaDefaults,
    zodSchema: ctaPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Überschrift", required: true },
      { key: "subheadline", label: "Subheadline", type: "text", placeholder: "Optionaler Untertext" },
      { key: "primaryCtaText", label: "Primärer CTA Text", type: "text", placeholder: "Button Text", required: true },
      { key: "primaryCtaHref", label: "Primärer CTA Link", type: "url", placeholder: "https://...", required: true },
      { key: "secondaryCtaHref", label: "Sekundärer CTA Link", type: "url", placeholder: "https://..." },
      {
        key: "variant",
        label: "Layout",
        type: "select",
        options: [
          { value: "centered", label: "Zentriert" },
          { value: "split", label: "Geteilt" },
          { value: "default", label: "Standard" },
        ],
      },
      { key: "backgroundColor", label: "Hintergrundfarbe", type: "color" },
      { key: "headlineColor", label: "Headline Farbe", type: "color" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color" },
      { key: "primaryCtaTextColor", label: "Primärer CTA Text Farbe", type: "color" },
      { key: "primaryCtaBgColor", label: "Primärer CTA Hintergrund", type: "color" },
      { key: "primaryCtaHoverBgColor", label: "Primärer CTA Hover Hintergrund", type: "color" },
      { key: "primaryCtaBorderColor", label: "Primärer CTA Border", type: "color" },
      { key: "primaryCtaBorderRadius", label: "Primärer CTA Border Radius", type: "text", placeholder: "0.5rem" },
      { key: "secondaryCtaTextColor", label: "Sekundärer CTA Text Farbe", type: "color" },
      { key: "secondaryCtaBgColor", label: "Sekundärer CTA Hintergrund", type: "color" },
      { key: "secondaryCtaHoverBgColor", label: "Sekundärer CTA Hover Hintergrund", type: "color" },
      { key: "secondaryCtaBorderColor", label: "Sekundärer CTA Border", type: "color" },
      { key: "secondaryCtaBorderRadius", label: "Sekundärer CTA Border Radius", type: "text", placeholder: "0.5rem" },
    ],
  },
  servicesGrid: {
    type: "servicesGrid",
    label: "Services Grid",
    defaults: servicesGridDefaults,
    zodSchema: servicesGridPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Überschrift", required: false },
      { key: "subheadline", label: "Subheadline", type: "text", placeholder: "Kurzer Text", required: false },
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
        required: false,
      },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "iconColor", label: "Icon Farbe", type: "color", placeholder: "#111111" },
      { key: "iconBgColor", label: "Icon Hintergrund", type: "color", placeholder: "#EEEEEE" },
      { key: "titleColor", label: "Titel Farbe", type: "color", placeholder: "#111111" },
      { key: "textColor", label: "Text Farbe", type: "color", placeholder: "#666666" },
      { key: "ctaColor", label: "CTA Farbe", type: "color", placeholder: "#111111" },
      { key: "cardBgColor", label: "Karte Hintergrund", type: "color", placeholder: "#FFFFFF" },
      { key: "cardBorderColor", label: "Karte Border", type: "color", placeholder: "#E5E7EB" },
      
    ],
  },
  faq: {
    type: "faq",
    label: "FAQ",
    defaults: faqDefaults,
    zodSchema: faqPropsSchema,
    enableInnerPanel: true,
    inspectorFields: [
      { key: "headline", label: "Überschrift", type: "text", placeholder: "Überschrift eingeben", required: false },
      {
        key: "background",
        label: "Hintergrund",
        type: "select",
        options: [
          { value: "none", label: "Keine" },
          { value: "muted", label: "Gedimmt" },
          { value: "gradient", label: "Gradient" },
        ],
      },
      { key: "backgroundColor", label: "Hintergrundfarbe (Wrapper)", type: "color", placeholder: "#RRGGBB" },
      { key: "headlineColor", label: "Überschrift Farbe", type: "color", placeholder: "#111111" },
      { key: "questionColor", label: "Frage Farbe", type: "color", placeholder: "#111111" },
      { key: "answerColor", label: "Antwort Farbe", type: "color", placeholder: "#666666" },
    ],
  },
  team: {
    type: "team",
    label: "Team",
    defaults: teamDefaults,
    zodSchema: teamPropsSchema,
    allowInlineEdit: true,
    enableInnerPanel: true,
    inspectorFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Überschrift", required: false },
      { key: "subheadline", label: "Subheadline", type: "text", placeholder: "Kurzer Text" },
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "nameColor", label: "Name Farbe", type: "color", placeholder: "#111111" },
      { key: "roleColor", label: "Rolle Farbe", type: "color", placeholder: "#666666" },
      { key: "ctaColor", label: "CTA Farbe", type: "color", placeholder: "#111111" },
      { key: "cardBgColor", label: "Karte Hintergrund", type: "color" },
      { key: "cardBorderColor", label: "Karte Border", type: "color" },
    ],
  },
  contactForm: {
    type: "contactForm",
    label: "Kontaktformular",
    defaults: contactFormDefaults,
    zodSchema: contactFormPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      { key: "heading", label: "Überschrift", type: "text", placeholder: "Kontaktieren Sie uns" },
      { key: "text", label: "Intro-Text", type: "textarea", placeholder: "Beschreibungstext..." },
      { key: "submitLabel", label: "Button-Text", type: "text", placeholder: "Nachricht senden" },
      { key: "successTitle", label: "Erfolgs-Titel", type: "text", placeholder: "Nachricht gesendet" },
      { key: "successText", label: "Erfolgs-Nachricht", type: "textarea", placeholder: "Danke-Nachricht..." },
      { key: "errorText", label: "Fehler-Nachricht", type: "textarea", placeholder: "Fehler-Text..." },
      { key: "privacyText", label: "Datenschutz-Text", type: "textarea", placeholder: "Wir verwenden..." },
      { key: "backgroundColor", label: "Hintergrundfarbe", type: "color", placeholder: "#ffffff" },
      {
        key: "privacyLink.label",
        label: "Datenschutz-Link Label",
        type: "text",
        placeholder: "Datenschutzerklärung",
      },
      {
        key: "privacyLink.href",
        label: "Datenschutz-Link URL",
        type: "text",
        placeholder: "/datenschutz",
      },
      { key: "requireConsent", label: "Zustimmung erforderlich", type: "boolean" },
      { key: "consentLabel", label: "Zustimmungs-Text", type: "textarea", placeholder: "Ich akzeptiere..." },
      {
        key: "layout",
        label: "Layout",
        type: "select",
        options: [
          { value: "stack", label: "Gestapelt" },
          { value: "split", label: "Zweispaltig" },
        ],
      },
      { key: "headingColor", label: "Überschrift Farbe", type: "color", placeholder: "#000000" },
      { key: "textColor", label: "Text Farbe", type: "color", placeholder: "#666666" },
      { key: "inputTextColor", label: "Input Text Farbe", type: "color", placeholder: "#000000" },
      { key: "inputBgColor", label: "Input Hintergrund", type: "color", placeholder: "#ffffff" },
      { key: "inputBorderColor", label: "Input Border", type: "color", placeholder: "#cccccc" },
      { key: "buttonTextColor", label: "Button Text Farbe", type: "color", placeholder: "#ffffff" },
      { key: "buttonBgColor", label: "Button Hintergrund", type: "color", placeholder: "#000000" },
      {
        key: "buttonHoverBgColor",
        label: "Button Hover Hintergrund",
        type: "color",
        placeholder: "#333333",
      },
    ],
  },
  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    defaults: testimonialsDefaults,
    zodSchema: testimonialsPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Überschrift" },
      { key: "subheadline", label: "Subheadline", type: "textarea", placeholder: "Kurzer erklärender Text" },
      {
        key: "variant",
        label: "Variante",
        type: "select",
        options: [
          { value: "grid", label: "Grid" },
          { value: "slider", label: "Slider" },
        ],
      },
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "quoteColor", label: "Zitat Farbe", type: "color", placeholder: "#111111" },
      { key: "nameColor", label: "Name Farbe", type: "color", placeholder: "#111111" },
      { key: "roleColor", label: "Rolle Farbe", type: "color", placeholder: "#666666" },
      {
        key: "background",
        label: "Background",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "muted", label: "Muted" },
          { value: "gradient", label: "Gradient" },
        ],
      },
    ],
  },
  testimonialSlider: {
    type: "testimonialSlider",
    label: "Testimonial Slider",
    defaults: testimonialSliderDefaults,
    zodSchema: testimonialSliderPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      { key:"headline", label:"Headline", type:"text", placeholder:"Überschrift" },
      { key:"subheadline", label:"Subheadline", type:"textarea", placeholder:"Kurzer Text" },
      { key:"background", label:"Background", type:"select", options:[
        { value:"none", label:"None" },
        { value:"muted", label:"Muted" },
        { value:"gradient", label:"Gradient" },
      ]},
      { key:"autoplay", label:"Autoplay", type:"boolean" },
      { key:"interval", label:"Intervall (ms)", type:"text", placeholder:"6000" },
      { key:"showArrows", label:"Arrows", type:"boolean" },
      { key:"showDots", label:"Dots", type:"boolean" },

    ],
  },
  gallery: {
    type: "gallery",
    label: "Galerie",
    defaults: galleryDefaults,
    zodSchema: galleryPropsSchema,
    allowInlineEdit: false,
    inspectorFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Überschrift" },
      { key: "subheadline", label: "Subheadline", type: "textarea", placeholder: "Kurzer erklärender Text" },
      {
        key: "variant",
        label: "Variante",
        type: "select",
        options: [
          { value: "grid", label: "Grid" },
          { value: "slider", label: "Slider" },
        ],
      },
      { key: "lightbox", label: "Lightbox/Slider aktiv", type: "boolean", helpText: "Wenn aktiv, wird die Galerie als Slider gerendert." },
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ],
      },
      { key: "showCaptions", label: "Captions anzeigen", type: "boolean" },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "captionColor", label: "Caption Farbe", type: "color", placeholder: "#666666" },
      {
        key: "background",
        label: "Background",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "muted", label: "Muted" },
          { value: "gradient", label: "Gradient" },
        ],
      },
    ],
  },
  imageSlider: {
    type: "imageSlider",
    label: "Bild-Slider",
    defaults: imageSliderDefaults,
    zodSchema: imageSliderPropsSchema,
    allowInlineEdit: false,
    inspectorFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Überschrift" },
      { key: "subheadline", label: "Subheadline", type: "textarea", placeholder: "Kurzer erklärender Text" },
      { key: "loop", label: "Loop", type: "boolean" },
      { key: "peek", label: "Peek (nächstes Bild sichtbar)", type: "boolean" },
      { key: "autoplay", label: "Autoplay", type: "boolean" },
      {
        key: "autoplayDelayMs",
        label: "Autoplay Delay",
        type: "select",
        options: [
          { value: "3000", label: "3s" },
          { value: "5000", label: "5s" },
          { value: "7000", label: "7s" },
          { value: "10000", label: "10s" },
        ],
        helpText: "Wird nur genutzt, wenn Autoplay aktiv ist.",
      },
      { key: "pauseOnHover", label: "Autoplay pausieren bei Hover/Fokus", type: "boolean" },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "cardBgColor", label: "Slide Card Hintergrund (global)", type: "color", placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Slide Card Border (global)", type: "color", placeholder: "#e5e7eb" },
      { key: "slideTitleColor", label: "Slide Titel Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "slideTextColor", label: "Slide Text Farbe (global)", type: "color", placeholder: "#666666" },
      {
        key: "background",
        label: "Background",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "muted", label: "Muted" },
          { value: "gradient", label: "Gradient" },
        ],
      },
    ],
  },
  openingHours: {
    type: "openingHours",
    label: "Öffnungszeiten",
    defaults: openingHoursDefaults,
    zodSchema: openingHoursPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      { key: "headline", label: "Headline", type: "text", placeholder: "Überschrift" },
      { key: "subheadline", label: "Subheadline", type: "textarea", placeholder: "Kurzer erklärender Text" },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "labelColor", label: "Label Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "valueColor", label: "Wert Farbe (global)", type: "color", placeholder: "#666666" },
      { key: "noteColor", label: "Hinweis Farbe", type: "color", placeholder: "#666666" },
      { key: "cardBgColor", label: "Card Hintergrund", type: "color", placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border", type: "color", placeholder: "#e5e7eb" },
      {
        key: "layout",
        label: "Layout",
        type: "select",
        options: [
          { value: "twoColumn", label: "Zwei Spalten" },
          { value: "stack", label: "Stack" },
        ],
      },
      { key: "note", label: "Hinweis (optional)", type: "textarea", placeholder: "z.B. Termine nach Vereinbarung" },
      {
        key: "background",
        label: "Background",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "muted", label: "Muted" },
          { value: "gradient", label: "Gradient" },
        ],
      },
    ],
  },
}

/**
 * Transform blockRegistry to apply withInnerPanel to all blocks
 */
const transformedRegistry = Object.fromEntries(
  Object.entries(blockRegistry).map(([type, def]) => [type, withInnerPanel(def)])
) as Record<BlockType, BlockDefinition>

// Re-export the transformed registry
Object.assign(blockRegistry, transformedRegistry)

/**
 * Get block definition by type
 */
export function getBlockDefinition<T extends BlockType>(type: T): BlockDefinition<Extract<CMSBlock, { type: T }>> {
  const def = blockRegistry[type] as BlockDefinition<Extract<CMSBlock, { type: T }>>
  return def
}

/**
 * Get all block types
 */
export function getAllBlockTypes(): BlockType[] {
  return Object.keys(blockRegistry) as BlockType[]
}

/**
 * Helper function to add global shadow inspector section to a block definition
 * This allows any block to have element-level shadow styling
 */
export function withGlobalElementShadow<T extends CMSBlock = CMSBlock>(
  definition: BlockDefinition<T>
): BlockDefinition<T> {
  // Return the definition as-is; shadow handling is done in PageEditor via ShadowInspector
  // This is a marker function for clarity in code
  return definition
}