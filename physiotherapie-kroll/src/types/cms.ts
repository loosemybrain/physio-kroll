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
  | "courseSchedule"
  /** Strukturierte externe Medien (Whitelist-Provider, nur Embed-URL — kein freies HTML/iframe-Snippet). */
  | "externalEmbed"
  | "legalHero"
  | "legalSection"
  | "legalRichText"
  | "legalTable"
  | "legalInfoBox"
  | "legalCookieCategories"
  | "legalContactCard"

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
  /** Wenn true, erscheint der Block in der Navigation als Anker-Ziel (Onepage). */
  anchor?: boolean
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
  badgeBorderColor?: string
  /** Customer-friendly preset for badge radius */
  badgeRadiusPreset?: "pill" | "lg" | "md" | "sm" | "none"
  /** Legacy/advanced CSS border-radius value, e.g. "9999px" or "16px" */
  badgeBorderRadius?: string
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
    imageAlt?: string
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
    textAlign?: "left" | "center" | "right" | "justify"
    ctaColor?: string
    cardBgColor?: string
    cardBorderColor?: string
    cards: Array<{
      id: string
      icon: string
      title: string
      text: string
      textAlign?: "left" | "center" | "right" | "justify"
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
    // Panel Container Props
    containerBackgroundMode?: "transparent" | "color" | "gradient"
    containerBackgroundColor?: string
    containerBackgroundGradientPreset?: import("@/lib/theme/gradientPresets").GradientPresetValue
    containerGradientFrom?: string
    containerGradientVia?: string
    containerGradientTo?: string
    containerGradientAngle?: number
    containerShadow?: any
    containerBorder?: boolean
    containerBorderColor?: string
  }
}

/**
 * Team Grid block configuration
 */
export interface TeamBlock extends BaseBlock {
  type: "team"
  props: {
    typography?: Record<string, any>
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
      bioAlign?: "left" | "center" | "right"
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
    bioAlign?: "left" | "center" | "right"
    ctaColor?: string
    cardBgColor?: string
    cardBorderColor?: string
    
    // Inner Container Background (for Panel behind Header + Grid)
    containerBackgroundMode?: "transparent" | "color" | "gradient"
    containerBackgroundColor?: string
    containerBackgroundGradientPreset?: import("@/lib/theme/gradientPresets").GradientPresetValue
    containerGradientFrom?: string
    containerGradientVia?: string
    containerGradientTo?: string
    containerGradientAngle?: number
    
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
    
    // Recipient Email Configuration
    // If set, overrides env vars CONTACT_EMAIL_PHYSIOTHERAPY/PHYSIOKONZEPT
    // Allows per-block customization of recipient
    // Falls back to env vars if empty
    recipientEmail?: string
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
 * layout: v0-style layouts; variant kept for backward compat (slider → carousel).
 */
export interface GalleryBlock extends BaseBlock {
  type: "gallery"
  props: {
    section?: BlockSectionProps
    headline?: string
    subheadline?: string
    /** v0 layouts; if unset, variant "slider" → carousel, else grid */
    layout?: "grid" | "masonry" | "carousel" | "stack" | "highlight-first"
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
      /** optional link when lightbox is off */
      link?: string
    }>
    columns?: 2 | 3 | 4 | 5 | 6
    showCaptions?: boolean
    /** Caption position: below image or overlay on hover */
    captionStyle?: "below" | "overlay"
    /** Responsive gap between items */
    gap?: "sm" | "md" | "lg"
    /** Image corner radius preset */
    imageRadius?: "none" | "sm" | "md" | "lg" | "xl"
    /** Aspect ratio of image cells (grid/carousel); masonry/stack use auto */
    aspectRatio?: "auto" | "square" | "video" | "portrait" | "landscape"
    /** Image object-fit */
    imageFit?: "cover" | "contain"
    /** Hover effect on tiles */
    hoverEffect?: "none" | "zoom" | "lift" | "fade"
    /** Show counter in lightbox */
    showCounter?: boolean
    /** Enable motion (stagger, lightbox transitions) */
    enableMotion?: boolean
    /** Legacy section background when no container panel */
    background?: "none" | "muted" | "gradient"
    /** Inner container panel (team-grid pattern) */
    containerBackgroundMode?: "transparent" | "color" | "gradient"
    containerBackgroundColor?: string
    containerBackgroundGradientPreset?: import("@/lib/theme/gradientPresets").GradientPresetValue
    containerGradientFrom?: string
    containerGradientVia?: string
    containerGradientTo?: string
    containerGradientAngle?: number
    containerShadow?: ElementShadow
    containerBorder?: boolean
    /** Element typography (e.g. gallery.headline, gallery.subheadline) */
    typography?: Record<string, unknown>
  }
}

/**
 * Image slider block configuration
 */
export interface ImageSliderBlock extends BaseBlock {
  type: "imageSlider"
  props: {
    section?: BlockSectionProps
    typography?: Record<string, unknown>

    eyebrow?: string
    headline?: string
    subheadline?: string
    eyebrowColor?: string
    headlineColor?: string
    subheadlineColor?: string

    slides: Array<{
      id: string
      url: string
      alt: string
      title?: string
      text?: string
      link?: string
      focalPoint?: { x: number; y: number }
      titleColor?: string
      textColor?: string
      cardBgColor?: string
      cardBorderColor?: string
      shadow?: ElementShadow
    }>

    variant?: "classic" | "progress" | "thumbnails" | "hero" | "cards"
    aspect?: "video" | "square" | "portrait" | "auto"
    slidesPerView?: { base?: number; md?: number; lg?: number }

    controls?: {
      showArrows?: boolean
      showDots?: boolean
      showProgress?: boolean
      showThumbnails?: boolean
    }

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
    cardsLightbox?: boolean
    cardsLightboxBackdropColor?: string
    cardsLightboxBackdropPreset?: "soft-dark" | "dark" | "darker" | "black"
    cardsFirstImageLightbox?: boolean

    containerBackgroundMode?: "transparent" | "color" | "gradient"
    containerBackgroundColor?: string
    containerBackgroundGradientPreset?: import("@/lib/theme/gradientPresets").GradientPresetValue
    containerGradientFrom?: string
    containerGradientVia?: string
    containerGradientTo?: string
    containerGradientAngle?: number
    containerShadow?: ElementShadow
    containerBorder?: boolean
    containerBorderColor?: string

    ariaLabel?: string
  }
}

/**
 * Weekday (German) for course schedule
 */
export type CourseScheduleWeekday =
  | "Montag"
  | "Dienstag"
  | "Mittwoch"
  | "Donnerstag"
  | "Freitag"
  | "Samstag"
  | "Sonntag"

/**
 * Single course/slot in the schedule
 */
export interface CourseSlot {
  id: string
  weekday: CourseScheduleWeekday
  startTime: string
  endTime: string
  title: string
  instructor?: string
  location?: string
  highlight?: boolean
}

/**
 * Course schedule block configuration
 */
export interface CourseScheduleBlock extends BaseBlock {
  type: "courseSchedule"
  props: {
    section?: BlockSectionProps
    typography?: Record<string, unknown>
    mode: "calendar" | "timeline"
    eyebrow?: string
    headline?: string
    subheadline?: string
    eyebrowColor?: string
    headlineColor?: string
    subheadlineColor?: string
    slots: CourseSlot[]
    hideWeekend?: boolean
    containerBackgroundMode?: "transparent" | "color" | "gradient"
    containerBackgroundColor?: string
    containerBackgroundGradientPreset?: import("@/lib/theme/gradientPresets").GradientPresetValue
    containerGradientFrom?: string
    containerGradientVia?: string
    containerGradientTo?: string
    containerGradientAngle?: number
    containerShadow?: ElementShadow
    containerBorder?: boolean
    elements?: Record<string, ElementConfig>
  }
}

/**
 * Opening hours block configuration
 */
/** Erlaubte Drittanbieter für CMS-Embeds (muss mit Consent-Providern übereinstimmen). */
export type CmsExternalEmbedProvider = "google_maps" | "facebook"

/**
 * Externe Medien-Einbettung: nur Provider + HTTPS-Embed-URL.
 * Ausgabe ausschließlich über zentrale Renderer mit ExternalMediaGate.
 */
export interface ExternalEmbedBlock extends BaseBlock {
  type: "externalEmbed"
  props: {
    section?: BlockSectionProps
    provider: CmsExternalEmbedProvider
    /** Offizielle Embed-URL des Anbieters (kein iframe-HTML). */
    embedUrl: string
    /** Optional: sichtbare Überschrift und iframe-title. */
    title?: string
    /** Optionaler erklärender Text oberhalb des Embeds. */
    description?: string
    elements?: Record<string, ElementConfig>
    /** Wie bei anderen Blöcken (Inspector/Typografie). */
    typography?: Record<string, unknown>
  }
}

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

/** Legal block spacing (reused across legal blocks). */
export type LegalSpacing = "none" | "sm" | "md" | "lg"

/** legalHero: Seitenkopf für Datenschutz / Cookies / Impressum */
export interface LegalHeroBlock extends BaseBlock {
  type: "legalHero"
  props: {
    section?: BlockSectionProps
    eyebrow?: string
    title: string
    subtitle?: string
    introText?: string
    showUpdatedAt?: boolean
    updatedAtLabel?: string
    updatedAtValue?: string
    alignment?: "left" | "center"
    variant?: "default" | "minimal"
    headlineColor?: string
    subtitleColor?: string
    eyebrowColor?: string
    legalIcon?: string
    legalIconBgColor?: string
    legalBackLinkColor?: string
    legalUpdatedAtColor?: string
    showBackLink?: boolean
    legalBackLinkFontSize?: "xs" | "sm" | "base" | "lg"
    legalBackLinkFontWeight?: "normal" | "medium" | "semibold" | "bold"
    legalUpdatedAtFontSize?: "xs" | "sm" | "base" | "lg"
    legalUpdatedAtFontWeight?: "normal" | "medium" | "semibold" | "bold"
    headlineFontWeight?: "normal" | "medium" | "semibold" | "bold"
    subtitleFontWeight?: "normal" | "medium" | "semibold" | "bold"
  }
}

/** legalSection: strukturierter Abschnitt für Legal-Seiten (Titel + HTML-Inhalt). */
export interface LegalSectionBlock extends BaseBlock {
  type: "legalSection"
  props: {
    section?: BlockSectionProps
    title: string
    content: string
    containerBackground?: string
    containerMode?: "transparent" | "color" | "gradient"
    spacing?: LegalSpacing
  }
}

/**
 * Ein kontrolliertes Textsegment (Run) innerhalb von Absatz oder Zwischenüberschrift.
 * Kein Markdown, kein HTML — nur explizite Felder.
 *
 * Link-Ziel: `link.href` (kein separates Top-Level-`href`, damit optionaler Anzeigetext sauber bleibt).
 */
export interface LegalRichTextRun {
  /**
   * Stabile ID für Preview/Inspector (Runs). Optional bei älteren Daten —
   * Normalisierung vergibt UUIDs beim Laden/Speichern; Renderer nutzt deterministischen DOM-Fallback.
   */
  id?: string
  text: string
  /** Fett (rendert als `<strong>`). */
  bold?: boolean
  /** Kursiv (rendert als `<em>`). */
  italic?: boolean
  /**
   * Link: Ziel-URL unter `href`, optional eigener Anzeigetext unter `label`.
   * Ohne `label` gilt der sichtbare Text aus `text` (sonst Fallback URL).
   */
  link?: { href: string; label?: string }
}

/** Listenpunkt im strukturierten Legal-Fließtext. */
export interface LegalRichListItem {
  id: string
  runs: LegalRichTextRun[]
}

/** Strukturierter Inhalt für `legalRichText` (bevorzugt gegenüber `content`). */
export type LegalRichContentBlock =
  | { id: string; type: "paragraph"; runs: LegalRichTextRun[] }
  | { id: string; type: "heading"; level: 3 | 4; runs: LegalRichTextRun[] }
  | { id: string; type: "bulletList"; items: LegalRichListItem[] }
  | { id: string; type: "orderedList"; items: LegalRichListItem[] }

/** legalRichText: Überschrift + Rich-Text (ersetzt separaten legalSection). */
export interface LegalRichTextBlock extends BaseBlock {
  type: "legalRichText"
  props: {
    headline: string
    /** Legacy / Fallback: Klartext mit Zeilenumbrüchen für Absätze. */
    content: string
    /** Strukturierter Modus: wenn non-empty, wird dieses gerendert (statt `content`). */
    contentBlocks?: LegalRichContentBlock[]
    alignment?: "left" | "center" | "justify"
    headlineSize?: "h2" | "h3" | "h4"
    variant?: "default" | "muted"
    spacingTop?: LegalSpacing
    spacingBottom?: LegalSpacing
    /** Blockweite Farben (Phase 3A). Leer/`undefined` = Theme-Defaults (Tailwind/prose). */
    headingColor?: string
    textColor?: string
    listColor?: string
    listMarkerColor?: string
    linkColor?: string
    linkHoverColor?: string
    backgroundColor?: string
  }
}

/** legalTable: Spalten- und Zeilen-Definition. */
export interface LegalTableColumn {
  id: string
  label: string
  width?: string
}

export interface LegalTableRow {
  id: string
  cells: Record<string, string>
}

export interface LegalTableBlock extends BaseBlock {
  type: "legalTable"
  props: {
    caption?: string
    columns: LegalTableColumn[]
    rows: LegalTableRow[]
    variant?: "default" | "compact" | "spacious"
    zebra?: boolean
    spacingTop?: LegalSpacing
    spacingBottom?: LegalSpacing
  }
}

/** legalInfoBox: Hinweise, Rechtsgrundlagen, Widerruf. */
export interface LegalInfoBoxBlock extends BaseBlock {
  type: "legalInfoBox"
  props: {
    variant?: "info" | "warning" | "success" | "neutral"
    headline?: string
    content: string
    spacingTop?: LegalSpacing
    spacingBottom?: LegalSpacing
  }
}

/** legalCookieCategories: Kategorien mit Cookies. */
export interface LegalCookieItem {
  id: string
  name: string
  provider: string
  purpose: string
  duration: string
  type: string
}

export interface LegalCookieCategory {
  id: string
  name: string
  description: string
  required: boolean
  cookies: LegalCookieItem[]
}

export interface LegalCookieCategoriesBlock extends BaseBlock {
  type: "legalCookieCategories"
  props: {
    variant?: "cards" | "accordion"
    categories: LegalCookieCategory[]
    spacingTop?: LegalSpacing
    spacingBottom?: LegalSpacing
  }
}

/** legalContactCard: Anbieterkennzeichnung / Verantwortliche Stelle. */
export interface LegalContactLine {
  id: string
  label: string
  value: string
  href?: string
}

export interface LegalContactCardBlock extends BaseBlock {
  type: "legalContactCard"
  props: {
    headline: string
    lines: LegalContactLine[]
    variant?: "default" | "bordered"
    spacingTop?: LegalSpacing
    spacingBottom?: LegalSpacing
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
  | CourseScheduleBlock
  | ExternalEmbedBlock
  | LegalHeroBlock
  | LegalSectionBlock
  | LegalRichTextBlock
  | LegalTableBlock
  | LegalInfoBoxBlock
  | LegalCookieCategoriesBlock
  | LegalContactCardBlock

/**
 * Page type for context-dependent CMS (e.g. block palette filtering in Phase 2).
 * DB: page_type (default 'default').
 */
export type PageType = "default" | "landing" | "legal"

/**
 * Legal page subtype. Only relevant when pageType === 'legal'.
 * DB: page_subtype (nullable).
 */
export type PageSubtype = "privacy" | "cookies" | "imprint" | null

/** Allowed page type values (for validation and UI). */
export const PAGE_TYPE_VALUES: PageType[] = ["default", "landing", "legal"]

/** Allowed legal subtype values (for validation and UI). */
export const PAGE_SUBTYPE_VALUES: Array<NonNullable<PageSubtype>> = ["privacy", "cookies", "imprint"]

/**
 * Returns true if the page type is legal (subtype is then relevant).
 */
export function isLegalPageType(type: PageType): boolean {
  return type === "legal"
}

/**
 * CMS page content structure
 */
export interface CMSPage {
  id: string
  title: string
  slug: string
  /** Seitentyp; default 'default' when loading legacy data. */
  pageType: PageType
  /** Untertyp nur bei pageType 'legal'; sonst null. */
  pageSubtype: PageSubtype
  blocks: CMSBlock[]
  meta?: {
    description?: string
    keywords?: string[]
  }
}
