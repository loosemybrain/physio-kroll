import type { BrandKey } from "@/components/brand/brandAssets"
import type { BlockAnimationConfig } from "@/lib/animations/types"

/**
 * Shadow configuration for elements (global system)
 */
export interface ElementShadow {
  enabled?: boolean
  preset?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "glow" | "custom"
  inset?: boolean
  x?: number
  y?: number
  blur?: number
  spread?: number
  color?: string
  opacity?: number
}

/**
 * Style overrides for individual elements within blocks
 */
export interface ElementStyle {
  shadow?: ElementShadow
}

/**
 * Per-element configuration (keyed by elementId)
 */
export interface ElementConfig {
  style?: ElementStyle
}

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
  | "card"
  | "testimonialSlider"
  | "servicesGrid"
  | "faq"
  | "team"
  | "contactForm"
  | "testimonials"
  | "gallery"
  | "openingHours"
  | "imageSlider"
  | "testimonialSlider"

/**
 * Common props shape for all blocks with element styling support
 */
export interface CommonBlockProps {
  /** Global element styles (keyed by elementId from data-element-id) */
  elements?: Record<string, ElementConfig>
}

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
  /**
   * Parallax strength multiplier (0.5 to 2.0, default 1.0).
   * Scales the factor in useResponsiveParallax.
   */
  parallaxStrength?: number

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
  animation?: BlockAnimationConfig // Neu: Animation Config
  fullBleed?: boolean // Optional: render without max-width constraint
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
 * Hero action (button)
 */
export type HeroAction = {
  id: string
  variant: "primary" | "secondary"
  label: string
  href?: string
  action?: "video" | "scroll"
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
  // Actions array (new)
  actions?: HeroAction[]
}

/**
 * Hero block configuration
 * Supports both legacy flat structure and new brandContent structure
 */
export interface HeroBlock extends BaseBlock {
  type: "hero"
  props: {
    section?: BlockSectionProps
    minHeightVh?: "50" | "60" | "70" | "80" | "90" | "100"
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
    // Hero background color override (for theme presets or manual override)
    heroBgColor?: string
    // Actions array (new)
    actions?: HeroAction[]
    // New brand-specific content structure
    brandContent?: {
      physiotherapy?: HeroBrandContent
      "physio-konzept"?: HeroBrandContent
    }
    // Button preset (global)
    buttonPreset?: string
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
/**
 * Design style for ImageText (from v0)
 */
export interface ImageTextStyle {
  variant?: "default" | "soft"
  verticalAlign?: "top" | "center"
  textAlign?: "left" | "center"
  maxWidth?: "md" | "lg" | "xl"
  imageAspectRatio?: "4/3" | "16/9" | "1/1" | "3/2"
  paddingY?: "none" | "sm" | "md" | "lg" | "xl"
  paddingX?: "sm" | "md" | "lg"
}

export interface ImageTextBlock extends BaseBlock {
  type: "imageText"
  props: {
    section?: BlockSectionProps
    imageUrl: string
    imageAlt: string
    imagePosition?: "left" | "right"
    eyebrow?: string
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
    background?: "none" | "muted" | "gradient"
    backgroundColor?: string
    designPreset?: string
    style?: ImageTextStyle
    buttonPreset?: string
  }
}

/**
 * Design style for FeatureGrid cards (shared with CardBlock)
 */
export interface FeatureGridStyle {
  variant?: "default" | "soft" | "outline" | "elevated"
  radius?: "md" | "lg" | "xl"
  border?: "none" | "subtle" | "strong"
  shadow?: "none" | "sm" | "md" | "lg"
  accent?: "none" | "brand" | "muted"
}

/**
 * Animation config for FeatureGrid cards (shared with CardBlock)
 */
export interface FeatureGridAnimation {
  entrance?: "none" | "fade" | "slide-up" | "slide-left" | "scale"
  hover?: "none" | "lift" | "glow" | "tilt"
  durationMs?: number
  delayMs?: number
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
      style?: FeatureGridStyle
      animation?: FeatureGridAnimation
    }>
    columns?: 2 | 3 | 4
    titleColor?: string
    descriptionColor?: string
    iconColor?: string
    cardBgColor?: string
    cardBorderColor?: string
    designPreset?: string
    style?: FeatureGridStyle
    animation?: FeatureGridAnimation
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
    primaryCtaBorderRadius?: string
    secondaryCtaTextColor?: string
    secondaryCtaBgColor?: string
    secondaryCtaHoverBgColor?: string
    secondaryCtaBorderColor?: string
    secondaryCtaBorderRadius?: string
    buttonPreset?: string
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
    subheadline?: string
    content: string
    align?: "left" | "center" | "justify"
    justifyBias?: "none" | "readable" | "tight"
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full"
    background?: "none" | "muted" | "gradient-soft" | "gradient-brand"
    showDivider?: boolean
    enableGlow?: boolean
    enableHoverElevation?: boolean
    showCta?: boolean
    dividerColor?: string
    backgroundColor?: string
    eyebrowColor?: string
    headlineColor?: string
    subheadlineColor?: string
    contentColor?: string
    ctaText?: string
    ctaHref?: string
    ctaTextColor?: string
    ctaBgColor?: string
    ctaHoverBgColor?: string
    ctaBorderColor?: string
    /** Per-element typography */
    typography?: Record<string, any>
    /** Per-element shadows & other properties */
    elements?: Record<string, any>
    /** Backward compat - old prop names */
    primaryCtaText?: string
    primaryCtaHref?: string
    secondaryCtaText?: string
    secondaryCtaHref?: string
    buttonPreset?: string
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
    variant?: "grid" | "slider"
    autoplay?: boolean
    interval?: number
    sliderAlign?: "center" | "left"
    showControls?: boolean
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
    background?: "none" | "muted" | "gradient"
    backgroundColor?: string
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
    eyebrow?: string
    layout?: "cards" | "compact"
    background?: "none" | "muted" | "gradient"
    members: Array<{
      id: string
      name: string
      role?: string
      bio?: string
      imageUrl?: string | { url?: string; src?: string; publicUrl?: string; path?: string }
      imageAlt?: string
      avatarGradient?: "auto" | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8" | "g9" | "g10"
      avatarFit?: "cover" | "contain"
      avatarFocus?: "center" | "top" | "bottom" | "left" | "right"
      tags?: string[]
      socials?: Array<{
        type: "website" | "linkedin" | "instagram" | "email"
        href: string
      }>
      ctaText?: string
      ctaHref?: string
      nameColor?: string
      roleColor?: string
      bioColor?: string
      ctaColor?: string
      cardBgColor?: string
      cardBorderColor?: string
    }>
    columns?: 2 | 3 | 4
    headlineColor?: string
    subheadlineColor?: string
    eyebrowColor?: string
    nameColor?: string
    roleColor?: string
    bioColor?: string
    ctaColor?: string
    cardBgColor?: string
    cardBorderColor?: string
    
    // Inner Container Background (for Panel behind Header + Grid)
    containerBackgroundMode?: "transparent" | "color" | "gradient"
    containerBackgroundColor?: string
    containerBackgroundGradientPreset?: "soft" | "aurora" | "ocean" | "sunset" | "hero" | "none"
    containerBackgroundGradient?: string
    
    // Container Shadow
    containerShadow?: ElementShadow
    
    // Button preset (global)
    buttonPreset?: string
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
    layout?: "stack" | "stacked" | "split"
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
    
    // Contact Info Cards (for split layout)
    contactInfoCards?: Array<{
      id: string
      icon: "clock" | "phone" | "mapPin" | "mail"
      title: string
      value: string
    }>
    
    // Button preset (global)
    buttonPreset?: string
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
    elements?: Record<string, ElementConfig>
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
      avatar?: MediaValue
      /** Avatar gradient preset: "auto" | "g1"..."g10" (default: "auto") */
      avatarGradient?: "auto" | "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "g7" | "g8" | "g9" | "g10"
    }>
    columns?: 1 | 2 | 3 | 4
    background?: "none" | "muted" | "gradient"
    autoplay?: boolean
    interval?: number
  }
}

/**
 * Testimonial Slider block configuration
 */
export interface TestimonialSliderBlock extends BaseBlock {
  type: "testimonialSlider"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    items: Array<{
      id: string
      quote: string
      name: string
      role?: string
      image?: string
    }>
    autoplay?: boolean
    interval?: number
    showArrows?: boolean
    showDots?: boolean
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
 * Card block configuration
 */
export interface CardBlock extends BaseBlock {
  type: "card"
  props: {
    section?: BlockSectionProps
    eyebrow?: string
    title: string
    description?: string
    content?: string
    align?: "left" | "center" | "right"
    headerLayout?: "stacked" | "inline-action"
    actionSlot?: "none" | "badge" | "icon-button"
    actionLabel?: string
    footerAlign?: "left" | "center" | "right"
    buttons?: Array<{
      id: string
      label: string
      href?: string
      onClickAction?: "none" | "open-modal" | "scroll-to"
      targetId?: string
      variant?: "default" | "secondary" | "outline" | "ghost" | "link"
      size?: "sm" | "default" | "lg"
      icon?: "none" | "arrow-right" | "external" | "download"
      iconPosition?: "left" | "right"
      disabled?: boolean
    }>
    style?: {
      variant?: "default" | "soft" | "outline" | "elevated"
      radius?: "md" | "lg" | "xl"
      border?: "none" | "subtle" | "strong"
      shadow?: "none" | "sm" | "md" | "lg"
      accent?: "none" | "brand" | "muted"
    }
    animation?: {
      entrance?: "none" | "fade" | "slide-up" | "slide-left" | "scale"
      hover?: "none" | "lift" | "glow" | "tilt"
      durationMs?: number
      delayMs?: number
    }
    buttonPreset?: string
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
  | CardBlock
  | ServicesGridBlock
  | FaqBlock
  | TeamBlock
  | ContactFormBlock
  | TestimonialsBlock
  | TestimonialSliderBlock
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
