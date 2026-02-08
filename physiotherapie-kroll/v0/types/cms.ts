// CMS Block Types for Contact Form

export interface ContactFormField {
  id: string
  type: "name" | "email" | "phone" | "subject" | "message" | "text"
  label: string
  placeholder?: string
  required?: boolean
}

export interface ContactFormBlock {
  type: "contact-form"
  props: {
    heading: string
    text?: string
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
    fields: ContactFormField[]
    submitLabel: string
    successTitle: string
    successText: string
    errorText?: string
    privacyText: string
    privacyLink: {
      href: string
      label: string
    }
    requireConsent?: boolean
    consentLabel?: string
    layout?: "stack" | "split"
  }
}

// Image-Text Block
export interface ImageTextBlock {
  type: "image-text"
  props: {
    blockId: string
    layout: "image-left" | "image-right"
    variant: "default" | "soft"
    verticalAlign: "top" | "center"
    textAlign: "left" | "center"
    maxWidth: "md" | "lg" | "xl"
    image: MediaValue
    eyebrow?: string
    headline: string
    content: string
    cta?: {
      label: string
      href: string
    }
    headlineColor?: string
    textColor?: string
    backgroundColor?: string
  }
}

export interface MediaValue {
  src: string
  alt: string
  width?: number
  height?: number
}

export type CMSBlock = ContactFormBlock | ImageTextBlock
