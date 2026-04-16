export const POPUP_TRIGGER_TYPES = ["immediate", "delay", "scroll"] as const
export type PopupTriggerType = (typeof POPUP_TRIGGER_TYPES)[number]

export const POPUP_SIZES = ["small", "medium", "large"] as const
export type PopupSize = (typeof POPUP_SIZES)[number]

export const POPUP_POSITIONS = ["center", "top_center", "bottom_center"] as const
export type PopupPosition = (typeof POPUP_POSITIONS)[number]

export const POPUP_LAYOUT_VARIANTS = ["image_top", "image_left", "no_image"] as const
export type PopupLayoutVariant = (typeof POPUP_LAYOUT_VARIANTS)[number]

export const POPUP_ANIMATION_VARIANTS = ["fade", "scale", "slide_up"] as const
export type PopupAnimationVariant = (typeof POPUP_ANIMATION_VARIANTS)[number]

export const POPUP_DESIGN_VARIANTS = ["promotion", "announcement"] as const
export type PopupDesignVariant = (typeof POPUP_DESIGN_VARIANTS)[number]

export type PopupDesign = {
  designVariant: PopupDesignVariant
  size: PopupSize
  position: PopupPosition
  layoutVariant: PopupLayoutVariant
  animationVariant: PopupAnimationVariant
  animationFadeInMs: number
  animationFadeOutMs: number
  bgColor: string | null
  textColor: string | null
  overlayOpacity: number | null
  borderRadius: string | null
  shadowPreset: string | null
  buttonVariant: string | null
  showCloseIcon: boolean
}

export type PopupBehavior = {
  closeOnOverlay: boolean
  closeOnEscape: boolean
}

export type PopupTrigger = {
  triggerType: PopupTriggerType
  triggerDelaySeconds: number | null
  triggerScrollPercent: number | null
  showOncePerSession: boolean
  showOncePerBrowser: boolean
}

export type PopupContent = {
  headline: string | null
  body: string | null
  imageUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  closeLabel: string | null
}

export type PopupScheduling = {
  startsAt: string | null // ISO string (timestamptz)
  endsAt: string | null // ISO string (timestamptz)
}

export type AdminPopup = {
  id: string
  name: string
  slug: string | null
  isActive: boolean
  internalNotes: string | null

  content: PopupContent
  scheduling: PopupScheduling
  trigger: PopupTrigger

  allPages: boolean
  selectedPageIds: string[]

  design: PopupDesign
  behavior: PopupBehavior
  priority: number

  createdAt: string
  updatedAt: string
}

/**
 * Public popup shape from `public.popups_public` view.
 * Only contains rendering-relevant fields.
 */
export type PublicPopup = {
  id: string

  headline: string | null
  body: string | null
  imageUrl: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  closeLabel: string | null

  triggerType: PopupTriggerType
  triggerDelaySeconds: number | null
  triggerScrollPercent: number | null
  showOncePerSession: boolean
  showOncePerBrowser: boolean

  allPages: boolean

  designVariant: PopupDesignVariant
  size: PopupSize
  position: PopupPosition
  layoutVariant: PopupLayoutVariant
  animationVariant: PopupAnimationVariant
  animationFadeInMs: number
  animationFadeOutMs: number
  bgColor: string | null
  textColor: string | null
  overlayOpacity: number | null
  borderRadius: string | null
  shadowPreset: string | null
  buttonVariant: string | null
  showCloseIcon: boolean
  closeOnOverlay: boolean
  closeOnEscape: boolean

  priority: number
  updatedAt: string
}

