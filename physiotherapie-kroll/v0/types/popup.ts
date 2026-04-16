import type React from "react"

export type PopupLayoutVariant = "image-top" | "image-left" | "no-image"
export type PopupVariant = "promotion" | "info" | "consent" | "announcement"
export type PopupSize = "sm" | "md" | "lg"

export interface PopupConfig {
  // Core
  variant: PopupVariant
  layoutVariant: PopupLayoutVariant
  size?: PopupSize

  // Content
  headline: string
  subheadline?: string
  body: React.ReactNode

  // Image (optional)
  image?: {
    src: string
    alt: string
    parallax?: boolean
  }

  // CTAs
  primaryCTA: {
    label: string
    onClick: () => void
    loading?: boolean
  }
  secondaryCTA?: {
    label: string
    onClick: () => void
  }
  tertiaryText?: string

  // Behavior
  onClose: () => void
  closeOnOverlayClick?: boolean
  mobileBottomSheet?: boolean

  // Styling
  className?: string
  accentColor?: "primary" | "accent" | "destructive"
}
