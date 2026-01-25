import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Base block interface that all CMS blocks must extend
 */
export interface BaseBlock {
  id: string
  type: BlockType
}

/**
 * All available block types in the CMS
 */
export type BlockType =
  | "hero"
  | "text"
  | "imageText"
  | "featureGrid"
  | "cta"
  | "section"
  | "servicesGrid"
  | "faq"
  | "team"
  | "contactForm"
  | "testimonials"
  | "gallery"
  | "openingHours"
  | "imageSlider"

export type BackgroundType = "none" | "color" | "gradient" | "image" | "video"
export type GradientKind = "linear" | "radial" | "conic"
export type GradientDirection =
  | "to top"
  | "to right"
  | "to bottom"
  | "to left"
  | "to top right"
  | "to top left"
  | "to bottom right"
  | "to bottom left"

export type BackgroundOverlay = {
  value: string
  /** 0–100 */
  opacity: number
}

export type BackgroundGradientStop = {
  color: string
  /** 0–100 */
  pos: number
}

export type BackgroundSettings = {
  type: BackgroundType
  /**
   * When true, applies a lightweight parallax effect (image/video only).
   * Renderer should gracefully ignore for unsupported types.
   */
  parallax?: boolean

  color?: {
    value: string
    overlay?: BackgroundOverlay
  }

  gradient?: {
    kind: GradientKind
    direction?: GradientDirection
    stops: BackgroundGradientStop[]
  }

  image?: {
    mediaId: string | null
    fit: "cover" | "contain"
    position: "center" | "top" | "bottom" | "left" | "right"
    overlay?: BackgroundOverlay
    /** 0–20 (optional) */
    blur?: number
  }

  video?: {
    mediaId: string | null
    posterMediaId?: string | null
    overlay?: BackgroundOverlay
  }
}

export type SectionBackground = BackgroundSettings

export type SectionLayout = {
  width: "contained" | "full"
  paddingY: "none" | "sm" | "md" | "lg" | "xl"
  paddingX?: "none" | "sm" | "md" | "lg"
  minHeight?: "auto" | "sm" | "md" | "lg" | "screen"
}

export type BlockSectionProps = {
  layout: SectionLayout
  background: SectionBackground
}

/**
 * Media value: either a media ID from the media library or a direct URL
 */
export type MediaValue = 
  | { mediaId: string; alt?: string | null }
  | { url: string; alt?: string | null }

export type SectionBackgroundPreset = {
  id: string
  name: string
  description?: string
  section: BlockSectionProps
}

/**
 * Brand-specific content for Hero block
 */
export type HeroBrandContent = {
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  badgeText?: string
  badgeColor?: string
  badgeBgColor?: string
  playText?: string
  playTextColor?: string
  playBorderColor?: string
  playBgColor?: string
  playHoverBgColor?: string
  trustItems?: string[]
  trustItemsColor?: string
  trustDotColor?: string
  floatingTitle?: string
  floatingTitleColor?: string
  floatingValue?: string
  floatingValueColor?: string
  floatingLabel?: string
  floatingLabelColor?: string
  headlineColor?: string
  subheadlineColor?: string
  ctaColor?: string
  ctaBgColor?: string
  ctaHoverBgColor?: string
  ctaBorderColor?: string
  image?: MediaValue
  imageAlt?: string
  imageVariant?: "landscape" | "portrait"
  imageFit?: "cover" | "contain"
  imageFocus?: "center" | "top" | "bottom"
  containBackground?: "none" | "blur"
}

/**
 * Hero block configuration
 * Supports both legacy flat structure and new brandContent structure
 */
export interface HeroBlock extends BaseBlock {
  type: "hero"
  props: {
    section?: BlockSectionProps
    // Legacy props (for backward compatibility)
    mood?: BrandKey
    headline?: string
    subheadline?: string
    ctaText?: string
    ctaHref?: string
    showMedia?: boolean
    mediaType?: "image" | "video"
    mediaUrl?: string
    badgeText?: string
    playText?: string
    trustItems?: string[]
    floatingTitle?: string
    floatingValue?: string
    floatingLabel?: string
    // New brand-specific content structure
    brandContent?: {
      physiotherapy?: HeroBrandContent
      "physio-konzept"?: HeroBrandContent
    }
  }
}

/**
 * Text block configuration
 */
export interface TextBlock extends BaseBlock {
  type: "text"
  props: {
    section?: BlockSectionProps
    content: string
    alignment?: "left" | "center" | "right"
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full"
    textSize?: "sm" | "base" | "lg" | "xl" | "2xl"
    /** Optional colors for rich text (prose) */
    contentColor?: string
    headingColor?: string
    linkColor?: string
  }
}

/**
 * Image with text block configuration
 */
export interface ImageTextBlock extends BaseBlock {
  type: "imageText"
  props: {
    section?: BlockSectionProps
    imageUrl: string
    imageAlt: string
    imagePosition?: "left" | "right"
    headline?: string
    content: string
    ctaText?: string
    ctaHref?: string
    headlineColor?: string
    contentColor?: string
    ctaTextColor?: string
    ctaBgColor?: string
    ctaHoverBgColor?: string
    ctaBorderColor?: string
  }
}

/**
 * Feature grid block configuration
 */
export interface FeatureGridBlock extends BaseBlock {
  type: "featureGrid"
  props: {
    section?: BlockSectionProps
    features: Array<{
      id: string
      title: string
      description: string
      icon?: string
      titleColor?: string
      descriptionColor?: string
      iconColor?: string
      cardBgColor?: string
      cardBorderColor?: string
    }>
    columns?: 2 | 3 | 4
    titleColor?: string
    descriptionColor?: string
    iconColor?: string
    cardBgColor?: string
    cardBorderColor?: string
  }
}

/**
 * Call-to-action block configuration
 */
export interface CtaBlock extends BaseBlock {
  type: "cta"
  props: {
    section?: BlockSectionProps
    headline: string
    subheadline?: string
    primaryCtaText: string
    primaryCtaHref: string
    secondaryCtaText?: string
    secondaryCtaHref?: string
    variant?: "default" | "centered" | "split"
    backgroundColor?: string
    headlineColor?: string
    subheadlineColor?: string
    primaryCtaTextColor?: string
    primaryCtaBgColor?: string
    primaryCtaHoverBgColor?: string
    primaryCtaBorderColor?: string
    secondaryCtaTextColor?: string
    secondaryCtaBgColor?: string
    secondaryCtaHoverBgColor?: string
    secondaryCtaBorderColor?: string
  }
}

/**
 * Section block configuration
 */
export interface SectionBlock extends BaseBlock {
  type: "section"
  props: {
    section?: BlockSectionProps
    eyebrow?: string
    headline: string
    content: string
    align?: "left" | "center"
    maxWidth?: "md" | "lg" | "xl"
    primaryCtaText?: string
    primaryCtaHref?: string
    variant?: "default" | "soft"
    background?: "none" | "muted" | "gradient"
    backgroundColor?: string
    eyebrowColor?: string
    headlineColor?: string
    contentColor?: string
    ctaTextColor?: string
    ctaBgColor?: string
    ctaHoverBgColor?: string
    ctaBorderColor?: string
  }
}

/**
 * Services Grid block configuration
 */
export interface ServicesGridBlock extends BaseBlock {
  type: "servicesGrid"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    columns?: 2 | 3 | 4
    cards: Array<{
      id: string
      icon: string
      title: string
      text: string
      ctaText?: string
      ctaHref?: string
      iconColor?: string
      iconBgColor?: string
      titleColor?: string
      textColor?: string
      ctaColor?: string
      cardBgColor?: string
      cardBorderColor?: string
    }>
    background?: "none" | "muted" | "gradient"
    headlineColor?: string
    subheadlineColor?: string
    iconColor?: string
    iconBgColor?: string
    titleColor?: string
    textColor?: string
    ctaColor?: string
    cardBgColor?: string
    cardBorderColor?: string
  }
}

/**
 * FAQ Accordion block configuration
 */
export interface FaqBlock extends BaseBlock {
  type: "faq"
  props: {
    section?: BlockSectionProps
    headline?: string
    items: Array<{
      id: string
      question: string
      answer: string
      questionColor?: string
      answerColor?: string
    }>
    variant?: "default" | "soft"
    headlineColor?: string
    questionColor?: string
    answerColor?: string
  }
}

/**
 * Team Grid block configuration
 */
export interface TeamBlock extends BaseBlock {
  type: "team"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    members: Array<{
      id: string
      name: string
      role: string
      imageUrl: string
      imageAlt: string
      ctaText?: string
      ctaHref?: string
      nameColor?: string
      roleColor?: string
      ctaColor?: string
      cardBgColor?: string
      cardBorderColor?: string
    }>
    columns?: 2 | 3 | 4
    headlineColor?: string
    subheadlineColor?: string
    nameColor?: string
    roleColor?: string
    ctaColor?: string
    cardBgColor?: string
    cardBorderColor?: string
  }
}

/**
 * Contact form field definition
 */
export type ContactFormFieldType = "name" | "email" | "phone" | "subject" | "message"

export interface ContactFormField {
  id: string
  type: ContactFormFieldType
  label: string
  placeholder?: string
  required: boolean
}

/**
 * Contact form block configuration
 */
export interface ContactFormBlock extends BaseBlock {
  type: "contactForm"
  props: {
    section?: BlockSectionProps
    heading: string
    text?: string
    recipients?: {
      physiotherapy?: string
      "physio-konzept"?: string
    }
    fields: ContactFormField[]
    submitLabel: string
    successTitle: string
    successText: string
    errorText: string
    privacyText: string
    privacyLink: {
      label: string
      href: string
    }
    requireConsent: boolean
    consentLabel?: string
    consentRequiredText?: string
    layout?: "stack" | "split"
    headingColor?: string
    textColor?: string
    labelColor?: string
    inputTextColor?: string
    inputBgColor?: string
    inputBorderColor?: string
    privacyTextColor?: string
    privacyLinkColor?: string
    consentLabelColor?: string
    buttonTextColor?: string
    buttonBgColor?: string
    buttonHoverBgColor?: string
    buttonBorderColor?: string
  }
}

/**
 * Testimonials block configuration
 */
export interface TestimonialsBlock extends BaseBlock {
  type: "testimonials"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    variant?: "grid" | "slider"
    headlineColor?: string
    subheadlineColor?: string
    quoteColor?: string
    nameColor?: string
    roleColor?: string
    items: Array<{
      id: string
      quote: string
      quoteColor?: string
      name: string
      nameColor?: string
      role?: string
      roleColor?: string
      /** 1–5 (optional) */
      rating?: 1 | 2 | 3 | 4 | 5
    }>
    columns?: 1 | 2 | 3
    background?: "none" | "muted" | "gradient"
  }
}

/**
 * Gallery block configuration
 */
export interface GalleryBlock extends BaseBlock {
  type: "gallery"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    variant?: "grid" | "slider"
    lightbox?: boolean
    headlineColor?: string
    subheadlineColor?: string
    captionColor?: string
    images: Array<{
      id: string
      url: string
      /** may be empty during editing */
      alt: string
      caption?: string
      captionColor?: string
    }>
    columns?: 2 | 3 | 4
    showCaptions?: boolean
    background?: "none" | "muted" | "gradient"
  }
}

/**
 * Image slider block configuration
 */
export interface ImageSliderBlock extends BaseBlock {
  type: "imageSlider"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    headlineColor?: string
    subheadlineColor?: string
    slides: Array<{
      id: string
      url: string
      alt: string
      title?: string
      text?: string
      titleColor?: string
      textColor?: string
      cardBgColor?: string
      cardBorderColor?: string
    }>
    loop?: boolean
    autoplay?: boolean
    autoplayDelayMs?: number
    pauseOnHover?: boolean
    peek?: boolean
    background?: "none" | "muted" | "gradient"
    cardBgColor?: string
    cardBorderColor?: string
    slideTitleColor?: string
    slideTextColor?: string
  }
}

/**
 * Opening hours block configuration
 */
export interface OpeningHoursBlock extends BaseBlock {
  type: "openingHours"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    hours: Array<{
      id: string
      label: string
      value: string
      labelColor?: string
      valueColor?: string
    }>
    layout?: "twoColumn" | "stack"
    note?: string
    background?: "none" | "muted" | "gradient"
    headlineColor?: string
    subheadlineColor?: string
    labelColor?: string
    valueColor?: string
    noteColor?: string
    cardBgColor?: string
    cardBorderColor?: string
  }
}

/**
 * Union type of all possible CMS blocks
 */
export type CMSBlock =
  | HeroBlock
  | TextBlock
  | ImageTextBlock
  | FeatureGridBlock
  | CtaBlock
  | SectionBlock
  | ServicesGridBlock
  | FaqBlock
  | TeamBlock
  | ContactFormBlock
  | TestimonialsBlock
  | GalleryBlock
  | OpeningHoursBlock
  | ImageSliderBlock

/**
 * CMS page content structure
 */
export interface CMSPage {
  id: string
  title: string
  slug: string
  blocks: CMSBlock[]
  meta?: {
    description?: string
    keywords?: string[]
  }
}
