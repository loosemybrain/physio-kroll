import { z } from "zod"
import type { CMSBlock, BlockType, HeroBlock, TextBlock, ImageTextBlock, FeatureGridBlock, CtaBlock, SectionBlock, ServicesGridBlock, FaqBlock, TeamBlock, ContactFormBlock, TestimonialsBlock, GalleryBlock, OpeningHoursBlock, ImageSliderBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { uuid } from "@/lib/cms/arrayOps"
import { typographySchema, elementTypographySchema } from "@/lib/typography"
import type { EditableElementDef } from "@/lib/editableElements"

/**
 * Field types for inspector inputs
 */
export type InspectorFieldType = "text" | "textarea" | "select" | "url" | "image" | "number" | "boolean" | "color"

/**
 * Inspector field definition
 */
export interface InspectorField {
  key: string
  label: string
  type: InspectorFieldType
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  required?: boolean
  helpText?: string
}

/**
 * Block definition with schema, defaults, and inspector configuration
 */
export interface BlockDefinition<T extends CMSBlock = CMSBlock> {
  type: T["type"]
  label: string
  defaults: T["props"]
  zodSchema: z.ZodType<T["props"]>
  inspectorFields: InspectorField[]
  allowInlineEdit?: boolean
  /** Optional list of editable elements within this block */
  elements?: EditableElementDef[]
}

/**
 * Brand key schema
 */
const brandKeySchema = z.enum(["physiotherapy", "physio-konzept"])

/**
 * Media value schema: either mediaId or url
 */
const mediaValueSchema = z.union([
  z.object({ mediaId: z.string() }),
  z.object({ url: z.string() }),
])

/**
 * Brand-specific content schema for Hero
 */
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

/**
 * Hero block schema
 * Supports both legacy flat structure and new brandContent structure
 */
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
})

/**
 * Text block schema
 */
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

/**
 * Image text block schema
 */
const imageTextPropsSchema = z.object({
  imageUrl: z.string(),
  imageAlt: z.string(),
  imagePosition: z.enum(["left", "right"]).optional(),
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
  typography: elementTypographySchema,
})

/**
 * Feature grid block schema
 */
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
  typography: elementTypographySchema,
})

/**
 * CTA block schema
 */
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
  secondaryCtaTextColor: z.string().optional(),
  secondaryCtaBgColor: z.string().optional(),
  secondaryCtaHoverBgColor: z.string().optional(),
  secondaryCtaBorderColor: z.string().optional(),
  typography: elementTypographySchema,
})

/**
 * Section block schema
 */
const sectionPropsSchema = z.object({
  typography: typographySchema,
  eyebrow: z.string().optional(),
  headline: z.string(),
  content: z.string(),
  align: z.enum(["left", "center"]).optional(),
  maxWidth: z.enum(["md", "lg", "xl"]).optional(),
  primaryCtaText: z.string().optional(),
  primaryCtaHref: z.string().optional(),
  variant: z.enum(["default", "soft"]).optional(),
  background: z.enum(["none", "muted", "gradient"]).optional(),
  backgroundColor: z.string().optional(),
  eyebrowColor: z.string().optional(),
  headlineColor: z.string().optional(),
  contentColor: z.string().optional(),
  ctaTextColor: z.string().optional(),
  ctaBgColor: z.string().optional(),
  ctaHoverBgColor: z.string().optional(),
  ctaBorderColor: z.string().optional(),
})

/**
 * Services Grid block schema
 * Note: title and text allow empty strings during editing to prevent validation errors
 * that would trigger normalizeBlock to fall back to defaults. Required validation
 * is handled UI-side (inspectorFields.required) and will be enforced on publish/save.
 */
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

/**
 * FAQ block schema
 * Note: question and answer allow empty strings during editing to prevent validation errors
 * that would trigger normalizeBlock to fall back to defaults. Required validation
 * is handled UI-side (inspectorFields.required) and will be enforced on publish/save.
 */
const faqPropsSchema = z.object({
  headline: z.string().optional(),
  headlineColor: z.string().optional(),
  questionColor: z.string().optional(),
  answerColor: z.string().optional(),
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

/**
 * Team block schema
 * Note: name and role allow empty strings during editing to prevent validation errors
 * that would trigger normalizeBlock to fall back to defaults. Required validation
 * is handled UI-side (inspectorFields.required) and will be enforced on publish/save.
 */
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
})

/**
 * Contact form block schema
 */
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
})

/**
 * Testimonials block schema
 * Note: quote/name allow empty strings during editing; required validation happens UI-side.
 */
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
      z.coerce.number().int().min(1).max(3)
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
      })
    )
    .min(1)
    .max(12),
})

/**
 * Gallery block schema
 * Note: imageAlt allows empty strings during editing; required validation happens UI-side.
 */
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

/**
 * Image slider block schema
 * Note: strings allow empty during editing; publish validation is stricter.
 */
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

/**
 * Opening hours block schema
 * Note: label/value allow empty strings during editing; required validation happens UI-side.
 */
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

/**
 * Default props for each block type
 */
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
  imagePosition: "right",
  headline: "Überschrift",
  content: "Textinhalt hier eingeben...",
  ctaText: "Mehr erfahren",
  ctaHref: "/",
}

const featureGridDefaults: FeatureGridBlock["props"] = {
  features: [
    { id: "1", title: "Feature 1", description: "Beschreibung..." },
    { id: "2", title: "Feature 2", description: "Beschreibung..." },
    { id: "3", title: "Feature 3", description: "Beschreibung..." },
  ],
  columns: 3,
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
  content: "Hier können Sie Ihren Textinhalt eingeben. Dieser Block ist vollständig anpassbar und unterstützt HTML-Formatierung.",
  align: "left",
  maxWidth: "lg",
  primaryCtaText: "Mehr erfahren",
  primaryCtaHref: "/kontakt",
  variant: "default",
  background: "none",
}

function generateUniqueId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Factory functions for creating new array items
 */

export function createServiceCard(): ServicesGridBlock["props"]["cards"][0] {
  return {
    id: uuid(),
    icon: "HeartPulse",
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
    imageUrl: "/placeholder.svg",
    imageAlt: "Portrait",
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

export function createHeroTrustItem(): string {
  return "Neuer Vorteil"
}

export function createTestimonialItem(): TestimonialsBlock["props"]["items"][0] {
  return {
    id: uuid(),
    quote: "Sehr professionelle Behandlung – ich habe mich vom ersten Termin an gut aufgehoben gefühlt.",
    name: "Julia M.",
    role: "Patientin",
    rating: 5,
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
    { id: generateUniqueId("card", 4), icon: "Timer", title: "Prävention", text: "Vorbeugende Maßnahmen für langfristige Gesundheit.", ctaText: "Mehr erfahren", ctaHref: "/praevention" },
    { id: generateUniqueId("card", 5), icon: "Sparkles", title: "Wellness", text: "Entspannung und Regeneration für Körper und Geist.", ctaText: "Mehr erfahren", ctaHref: "/wellness" },
  ],
}

const faqDefaults: FaqBlock["props"] = {
  headline: "Häufige Fragen",
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
  columns: 3,
  members: [
    { id: generateUniqueId("member", 0), name: "Max Mustermann", role: "Physiotherapeut", imageUrl: "/placeholder.svg", imageAlt: "Max Mustermann", ctaText: "Profil ansehen", ctaHref: "/team/max-mustermann" },
    { id: generateUniqueId("member", 1), name: "Anna Schmidt", role: "Sportphysiotherapeutin", imageUrl: "/placeholder.svg", imageAlt: "Anna Schmidt", ctaText: "Profil ansehen", ctaHref: "/team/anna-schmidt" },
    { id: generateUniqueId("member", 2), name: "Thomas Weber", role: "Reha-Spezialist", imageUrl: "/placeholder.svg", imageAlt: "Thomas Weber", ctaText: "Profil ansehen", ctaHref: "/team/thomas-weber" },
  ],
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
  layout: "stack",
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
    },
    {
      id: generateUniqueId("testimonial", 1),
      quote: "Kompetent, freundlich und super organisiert. Ich komme gerne wieder.",
      name: "Thomas K.",
      role: "Patient",
      rating: 5,
    },
    {
      id: generateUniqueId("testimonial", 2),
      quote: "Individuelle Übungen und gute Erklärungen. Endlich verstehe ich, was meinem Rücken hilft.",
      name: "Sarah L.",
      role: "Patientin",
      rating: 4,
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
        group: "Inhalt",
      },
      {
        id: "subheadline",
        label: "Unterüberschrift",
        path: "subheadline",
        supportsTypography: true,
        group: "Inhalt",
      },
      {
        id: "cta",
        label: "CTA Button",
        path: "ctaText",
        supportsTypography: true,
        group: "Call-to-Action",
      },
    ],
    inspectorFields: [
      {
        key: "mood",
        label: "Brand/Mood",
        type: "select",
        options: [
          { value: "physiotherapy", label: "Physiotherapie" },
          { value: "physio-konzept", label: "Physio-Konzept" },
        ],
      },
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
        key: "showMedia",
        label: "Media anzeigen",
        type: "boolean",
      },
      {
        key: "mediaType",
        label: "Media Typ",
        type: "select",
        options: [
          { value: "image", label: "Bild" },
          { value: "video", label: "Video" },
        ],
      },
      {
        key: "mediaUrl",
        label: "Media URL",
        type: "image",
        placeholder: "/placeholder.svg",
      },
      {
        key: "badgeText",
        label: "Badge Text",
        type: "text",
        placeholder: "Badge-Text",
      },
      {
        key: "playText",
        label: "Video Button Text",
        type: "text",
        placeholder: "Video ansehen",
      },
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
        key: "floatingTitle",
        label: "Floating Card Titel",
        type: "text",
        placeholder: "Patientenzufriedenheit",
      },
      {
        key: "floatingValue",
        label: "Floating Card Wert",
        type: "text",
        placeholder: "98%",
      },
      {
        key: "floatingLabel",
        label: "Floating Card Label (optional)",
        type: "text",
        placeholder: "Optionaler Untertext",
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
    ],
  },
  featureGrid: {
    type: "featureGrid",
    label: "Feature Grid",
    defaults: featureGridDefaults,
    zodSchema: featureGridPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "2", label: "2 Spalten" },
          { value: "3", label: "3 Spalten" },
          { value: "4", label: "4 Spalten" },
        ],
      },
      { key: "titleColor", label: "Titel Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "descriptionColor", label: "Beschreibung Farbe (global)", type: "color", placeholder: "#666666" },
      { key: "iconColor", label: "Icon Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "cardBgColor", label: "Card Hintergrund (global)", type: "color", placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border (global)", type: "color", placeholder: "#e5e7eb" },
      // Features (first 3 for MVP in inspector)
      { key: "features.0.title", label: "Feature 1 Titel", type: "text", placeholder: "Feature 1", required: true },
      { key: "features.0.description", label: "Feature 1 Beschreibung", type: "textarea", placeholder: "Beschreibung...", required: true },
      { key: "features.0.icon", label: "Feature 1 Icon", type: "text", placeholder: "Icon-Name (optional)" },

      { key: "features.1.title", label: "Feature 2 Titel", type: "text", placeholder: "Feature 2", required: true },
      { key: "features.1.description", label: "Feature 2 Beschreibung", type: "textarea", placeholder: "Beschreibung...", required: true },
      { key: "features.1.icon", label: "Feature 2 Icon", type: "text", placeholder: "Icon-Name (optional)" },

      { key: "features.2.title", label: "Feature 3 Titel", type: "text", placeholder: "Feature 3", required: true },
      { key: "features.2.description", label: "Feature 3 Beschreibung", type: "textarea", placeholder: "Beschreibung...", required: true },
      { key: "features.2.icon", label: "Feature 3 Icon", type: "text", placeholder: "Icon-Name (optional)" },
    ],
  },
  cta: {
    type: "cta",
    label: "Call-to-Action",
    defaults: ctaDefaults,
    zodSchema: ctaPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "Überschrift",
        required: true,
      },
      {
        key: "subheadline",
        label: "Subheadline",
        type: "textarea",
        placeholder: "Unterüberschrift",
      },
      {
        key: "primaryCtaText",
        label: "Primärer CTA Text",
        type: "text",
        placeholder: "Button-Text",
        required: true,
      },
      {
        key: "primaryCtaHref",
        label: "Primärer CTA Link",
        type: "url",
        placeholder: "/kontakt",
        required: true,
      },
      {
        key: "secondaryCtaText",
        label: "Sekundärer CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "secondaryCtaHref",
        label: "Sekundärer CTA Link",
        type: "url",
        placeholder: "/",
      },
      {
        key: "variant",
        label: "Variante",
        type: "select",
        options: [
          { value: "default", label: "Standard" },
          { value: "centered", label: "Zentriert" },
          { value: "split", label: "Geteilt" },
        ],
      },
      { key: "backgroundColor", label: "Block Hintergrund", type: "color", placeholder: "#f3f4f6" },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "primaryCtaTextColor", label: "Primär CTA Text", type: "color", placeholder: "#ffffff" },
      { key: "primaryCtaBgColor", label: "Primär CTA Hintergrund", type: "color", placeholder: "#111111" },
      { key: "primaryCtaHoverBgColor", label: "Primär CTA Hover", type: "color", placeholder: "#000000" },
      { key: "primaryCtaBorderColor", label: "Primär CTA Border", type: "color", placeholder: "#111111" },
      { key: "secondaryCtaTextColor", label: "Sekundär CTA Text", type: "color", placeholder: "#111111" },
      { key: "secondaryCtaBgColor", label: "Sekundär CTA Hintergrund", type: "color", placeholder: "#ffffff" },
      { key: "secondaryCtaHoverBgColor", label: "Sekundär CTA Hover", type: "color", placeholder: "#f3f4f6" },
      { key: "secondaryCtaBorderColor", label: "Sekundär CTA Border", type: "color", placeholder: "#111111" },
    ],
  },
  section: {
    type: "section",
    label: "Section",
    defaults: sectionDefaults,
    zodSchema: sectionPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "eyebrow",
        label: "Eyebrow",
        type: "text",
        placeholder: "Kleiner Text über der Headline",
      },
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "Überschrift",
        required: true,
      },
      {
        key: "content",
        label: "Inhalt",
        type: "textarea",
        placeholder: "Textinhalt (HTML möglich)",
        required: true,
      },
      {
        key: "align",
        label: "Ausrichtung",
        type: "select",
        options: [
          { value: "left", label: "Links" },
          { value: "center", label: "Zentriert" },
        ],
      },
      {
        key: "maxWidth",
        label: "Maximale Breite",
        type: "select",
        options: [
          { value: "md", label: "Mittel" },
          { value: "lg", label: "Groß" },
          { value: "xl", label: "Extra Groß" },
        ],
      },
      {
        key: "primaryCtaText",
        label: "CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "primaryCtaHref",
        label: "CTA Link",
        type: "url",
        placeholder: "/kontakt",
      },
      {
        key: "variant",
        label: "Variante",
        type: "select",
        options: [
          { value: "default", label: "Standard" },
          { value: "soft", label: "Weich" },
        ],
      },
      {
        key: "background",
        label: "Hintergrund",
        type: "select",
        options: [
          { value: "none", label: "Keiner" },
          { value: "muted", label: "Gedämpft" },
          { value: "gradient", label: "Gradient" },
        ],
      },
      { key: "backgroundColor", label: "Background Override", type: "color", placeholder: "#ffffff" },
      { key: "eyebrowColor", label: "Eyebrow Farbe", type: "color", placeholder: "#2563eb" },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "contentColor", label: "Inhalt Farbe", type: "color", placeholder: "#666666" },
      { key: "ctaTextColor", label: "CTA Text Farbe", type: "color", placeholder: "#ffffff" },
      { key: "ctaBgColor", label: "CTA Hintergrund", type: "color", placeholder: "#111111" },
      { key: "ctaHoverBgColor", label: "CTA Hover", type: "color", placeholder: "#000000" },
      { key: "ctaBorderColor", label: "CTA Border", type: "color", placeholder: "#111111" },
    ],
  },
  servicesGrid: {
    type: "servicesGrid",
    label: "Services Grid",
    defaults: servicesGridDefaults,
    zodSchema: servicesGridPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "Überschrift",
      },
      {
        key: "subheadline",
        label: "Subheadline",
        type: "text",
        placeholder: "Unterüberschrift",
      },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "iconColor", label: "Icon Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "iconBgColor", label: "Icon Hintergrund (global)", type: "color", placeholder: "#e5e7eb" },
      { key: "titleColor", label: "Card Titel Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "textColor", label: "Card Text Farbe (global)", type: "color", placeholder: "#666666" },
      { key: "ctaColor", label: "Card CTA Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "cardBgColor", label: "Card Hintergrund (global)", type: "color", placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border (global)", type: "color", placeholder: "#e5e7eb" },
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "2", label: "2 Spalten" },
          { value: "3", label: "3 Spalten" },
          { value: "4", label: "4 Spalten" },
        ],
      },
      {
        key: "background",
        label: "Hintergrund",
        type: "select",
        options: [
          { value: "none", label: "Keiner" },
          { value: "muted", label: "Gedämpft" },
          { value: "gradient", label: "Gradient" },
        ],
      },
      // Card fields for first 6 cards
      {
        key: "cards.0.icon",
        label: "Card 1 Icon",
        type: "text",
        placeholder: "HeartPulse",
      },
      {
        key: "cards.0.title",
        label: "Card 1 Titel",
        type: "text",
        placeholder: "Titel",
      },
      {
        key: "cards.0.text",
        label: "Card 1 Text",
        type: "textarea",
        placeholder: "Beschreibung",
      },
      {
        key: "cards.0.ctaText",
        label: "Card 1 CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "cards.0.ctaHref",
        label: "Card 1 CTA Link",
        type: "url",
        placeholder: "/link",
      },
      {
        key: "cards.1.icon",
        label: "Card 2 Icon",
        type: "text",
        placeholder: "Dumbbell",
      },
      {
        key: "cards.1.title",
        label: "Card 2 Titel",
        type: "text",
        placeholder: "Titel",
      },
      {
        key: "cards.1.text",
        label: "Card 2 Text",
        type: "textarea",
        placeholder: "Beschreibung",
      },
      {
        key: "cards.1.ctaText",
        label: "Card 2 CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "cards.1.ctaHref",
        label: "Card 2 CTA Link",
        type: "url",
        placeholder: "/link",
      },
      {
        key: "cards.2.icon",
        label: "Card 3 Icon",
        type: "text",
        placeholder: "Activity",
      },
      {
        key: "cards.2.title",
        label: "Card 3 Titel",
        type: "text",
        placeholder: "Titel",
      },
      {
        key: "cards.2.text",
        label: "Card 3 Text",
        type: "textarea",
        placeholder: "Beschreibung",
      },
      {
        key: "cards.2.ctaText",
        label: "Card 3 CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "cards.2.ctaHref",
        label: "Card 3 CTA Link",
        type: "url",
        placeholder: "/link",
      },
      {
        key: "cards.3.icon",
        label: "Card 4 Icon",
        type: "text",
        placeholder: "Users",
      },
      {
        key: "cards.3.title",
        label: "Card 4 Titel",
        type: "text",
        placeholder: "Titel",
      },
      {
        key: "cards.3.text",
        label: "Card 4 Text",
        type: "textarea",
        placeholder: "Beschreibung",
      },
      {
        key: "cards.3.ctaText",
        label: "Card 4 CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "cards.3.ctaHref",
        label: "Card 4 CTA Link",
        type: "url",
        placeholder: "/link",
      },
      {
        key: "cards.4.icon",
        label: "Card 5 Icon",
        type: "text",
        placeholder: "Timer",
      },
      {
        key: "cards.4.title",
        label: "Card 5 Titel",
        type: "text",
        placeholder: "Titel",
      },
      {
        key: "cards.4.text",
        label: "Card 5 Text",
        type: "textarea",
        placeholder: "Beschreibung",
      },
      {
        key: "cards.4.ctaText",
        label: "Card 5 CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "cards.4.ctaHref",
        label: "Card 5 CTA Link",
        type: "url",
        placeholder: "/link",
      },
      {
        key: "cards.5.icon",
        label: "Card 6 Icon",
        type: "text",
        placeholder: "Sparkles",
      },
      {
        key: "cards.5.title",
        label: "Card 6 Titel",
        type: "text",
        placeholder: "Titel",
      },
      {
        key: "cards.5.text",
        label: "Card 6 Text",
        type: "textarea",
        placeholder: "Beschreibung",
      },
      {
        key: "cards.5.ctaText",
        label: "Card 6 CTA Text",
        type: "text",
        placeholder: "Button-Text",
      },
      {
        key: "cards.5.ctaHref",
        label: "Card 6 CTA Link",
        type: "url",
        placeholder: "/link",
      },
    ],
  },
  faq: {
    type: "faq",
    label: "FAQ",
    defaults: faqDefaults,
    zodSchema: faqPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "Häufige Fragen",
      },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "questionColor", label: "Frage Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "answerColor", label: "Antwort Farbe (global)", type: "color", placeholder: "#666666" },
      {
        key: "variant",
        label: "Variante",
        type: "select",
        options: [
          { value: "default", label: "Standard" },
          { value: "soft", label: "Soft" },
        ],
      },
      // FAQ Items (first 5 for MVP in inspector)
      { key: "items.0.question", label: "Frage 1", type: "text", placeholder: "Wie lange dauert eine Behandlung?", required: true },
      { key: "items.0.answer", label: "Antwort 1", type: "textarea", placeholder: "Eine Behandlungseinheit dauert...", required: true },
      { key: "items.1.question", label: "Frage 2", type: "text", placeholder: "Werden die Kosten übernommen?", required: true },
      { key: "items.1.answer", label: "Antwort 2", type: "textarea", placeholder: "Ja, wir arbeiten mit...", required: true },
      { key: "items.2.question", label: "Frage 3", type: "text", placeholder: "Brauche ich eine Überweisung?", required: true },
      { key: "items.2.answer", label: "Antwort 3", type: "textarea", placeholder: "Für die meisten Behandlungen...", required: true },
      { key: "items.3.question", label: "Frage 4", type: "text", placeholder: "Wie kann ich einen Termin vereinbaren?", required: true },
      { key: "items.3.answer", label: "Antwort 4", type: "textarea", placeholder: "Sie können einen Termin...", required: true },
      { key: "items.4.question", label: "Frage 5", type: "text", placeholder: "Was sollte ich mitbringen?", required: true },
      { key: "items.4.answer", label: "Antwort 5", type: "textarea", placeholder: "Bitte bringen Sie...", required: true },
    ],
  },
  team: {
    type: "team",
    label: "Team",
    defaults: teamDefaults,
    zodSchema: teamPropsSchema,
    allowInlineEdit: true,
    inspectorFields: [
      {
        key: "headline",
        label: "Headline",
        type: "text",
        placeholder: "Unser Team",
      },
      {
        key: "subheadline",
        label: "Subheadline",
        type: "textarea",
        placeholder: "Erfahrene Therapeuten für Ihre Gesundheit.",
      },
      { key: "headlineColor", label: "Headline Farbe", type: "color", placeholder: "#111111" },
      { key: "subheadlineColor", label: "Subheadline Farbe", type: "color", placeholder: "#666666" },
      { key: "nameColor", label: "Name Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "roleColor", label: "Rolle Farbe (global)", type: "color", placeholder: "#666666" },
      { key: "ctaColor", label: "CTA Farbe (global)", type: "color", placeholder: "#111111" },
      { key: "cardBgColor", label: "Card Hintergrund (global)", type: "color", placeholder: "#ffffff" },
      { key: "cardBorderColor", label: "Card Border (global)", type: "color", placeholder: "#e5e7eb" },
      {
        key: "columns",
        label: "Spalten",
        type: "select",
        options: [
          { value: "2", label: "2 Spalten" },
          { value: "3", label: "3 Spalten" },
          { value: "4", label: "4 Spalten" },
        ],
      },
      // Team Members (first 3 for MVP in inspector)
      { key: "members.0.name", label: "Mitglied 1 Name", type: "text", placeholder: "Max Mustermann", required: true },
      { key: "members.0.role", label: "Mitglied 1 Rolle", type: "text", placeholder: "Physiotherapeut", required: true },
      { key: "members.0.imageUrl", label: "Mitglied 1 Bild URL", type: "image", placeholder: "/placeholder.svg", required: true },
      { key: "members.0.imageAlt", label: "Mitglied 1 Bild Alt", type: "text", placeholder: "Max Mustermann", required: true },
      { key: "members.0.ctaText", label: "Mitglied 1 CTA Text", type: "text", placeholder: "Profil ansehen" },
      { key: "members.0.ctaHref", label: "Mitglied 1 CTA Link", type: "url", placeholder: "/team/max-mustermann" },

      { key: "members.1.name", label: "Mitglied 2 Name", type: "text", placeholder: "Anna Schmidt", required: true },
      { key: "members.1.role", label: "Mitglied 2 Rolle", type: "text", placeholder: "Sportphysiotherapeutin", required: true },
      { key: "members.1.imageUrl", label: "Mitglied 2 Bild URL", type: "image", placeholder: "/placeholder.svg", required: true },
      { key: "members.1.imageAlt", label: "Mitglied 2 Bild Alt", type: "text", placeholder: "Anna Schmidt", required: true },
      { key: "members.1.ctaText", label: "Mitglied 2 CTA Text", type: "text", placeholder: "Profil ansehen" },
      { key: "members.1.ctaHref", label: "Mitglied 2 CTA Link", type: "url", placeholder: "/team/anna-schmidt" },

      { key: "members.2.name", label: "Mitglied 3 Name", type: "text", placeholder: "Thomas Weber", required: true },
      { key: "members.2.role", label: "Mitglied 3 Rolle", type: "text", placeholder: "Reha-Spezialist", required: true },
      { key: "members.2.imageUrl", label: "Mitglied 3 Bild URL", type: "image", placeholder: "/placeholder.svg", required: true },
      { key: "members.2.imageAlt", label: "Mitglied 3 Bild Alt", type: "text", placeholder: "Thomas Weber", required: true },
      { key: "members.2.ctaText", label: "Mitglied 3 CTA Text", type: "text", placeholder: "Profil ansehen" },
      { key: "members.2.ctaHref", label: "Mitglied 3 CTA Link", type: "url", placeholder: "/team/thomas-weber" },
    ],
  },
  contactForm: {
    type: "contactForm",
    label: "Kontaktformular",
    defaults: contactFormDefaults,
    zodSchema: contactFormPropsSchema,
    allowInlineEdit: false,
    inspectorFields: [
      {
        key: "heading",
        label: "Überschrift",
        type: "text",
        placeholder: "Kontaktieren Sie uns",
        required: true,
      },
      {
        key: "text",
        label: "Beschreibung",
        type: "textarea",
        placeholder: "Wir freuen uns auf Ihre Nachricht...",
      },
      { key: "headingColor", label: "Überschrift Farbe", type: "color", placeholder: "#111111" },
      { key: "textColor", label: "Beschreibung Farbe", type: "color", placeholder: "#666666" },
      { key: "labelColor", label: "Label Farbe", type: "color", placeholder: "#111111" },
      { key: "inputTextColor", label: "Input Text Farbe", type: "color", placeholder: "#111111" },
      { key: "inputBgColor", label: "Input Hintergrund", type: "color", placeholder: "#ffffff" },
      { key: "inputBorderColor", label: "Input Border", type: "color", placeholder: "#e5e7eb" },
      { key: "privacyTextColor", label: "Datenschutz Text Farbe", type: "color", placeholder: "#666666" },
      { key: "privacyLinkColor", label: "Datenschutz Link Farbe", type: "color", placeholder: "#2563eb" },
      { key: "consentLabelColor", label: "Einwilligung Label Farbe", type: "color", placeholder: "#111111" },
      { key: "buttonTextColor", label: "Button Text Farbe", type: "color", placeholder: "#ffffff" },
      { key: "buttonBgColor", label: "Button Hintergrund", type: "color", placeholder: "#111111" },
      { key: "buttonHoverBgColor", label: "Button Hover Hintergrund", type: "color", placeholder: "#000000" },
      { key: "buttonBorderColor", label: "Button Border", type: "color", placeholder: "#111111" },
      {
        key: "submitLabel",
        label: "Button-Text",
        type: "text",
        placeholder: "Nachricht senden",
        required: true,
      },
      {
        key: "successTitle",
        label: "Erfolgs-Titel",
        type: "text",
        placeholder: "Nachricht gesendet",
        required: true,
      },
      {
        key: "successText",
        label: "Erfolgs-Text",
        type: "textarea",
        placeholder: "Vielen Dank für Ihre Nachricht...",
        required: true,
      },
      {
        key: "errorText",
        label: "Fehler-Text",
        type: "textarea",
        placeholder: "Es ist ein Fehler aufgetreten...",
        required: true,
      },
      {
        key: "privacyText",
        label: "Datenschutz-Text",
        type: "textarea",
        placeholder: "Wir verwenden Ihre Angaben...",
        required: true,
      },
      {
        key: "privacyLink.label",
        label: "Datenschutz-Link Text",
        type: "text",
        placeholder: "Datenschutzerklärung",
        required: true,
      },
      {
        key: "privacyLink.href",
        label: "Datenschutz-Link URL",
        type: "url",
        placeholder: "/datenschutz",
        required: true,
      },
      {
        key: "requireConsent",
        label: "Einwilligung erforderlich",
        type: "boolean",
      },
      {
        key: "consentLabel",
        label: "Einwilligungs-Text",
        type: "text",
        placeholder: "Ich habe die Datenschutzerklärung gelesen...",
      },
      {
        key: "layout",
        label: "Layout",
        type: "select",
        options: [
          { value: "stack", label: "Gestapelt" },
          { value: "split", label: "Geteilt" },
        ],
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
 * Get block definition by type
 */
export function getBlockDefinition<T extends BlockType>(type: T): BlockDefinition<Extract<CMSBlock, { type: T }>> {
  return blockRegistry[type] as BlockDefinition<Extract<CMSBlock, { type: T }>>
}

/**
 * Get all block types
 */
export function getAllBlockTypes(): BlockType[] {
  return Object.keys(blockRegistry) as BlockType[]
}
