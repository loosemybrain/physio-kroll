import { z } from "zod"
import type { CMSBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Publish validation issue
 */
export type PublishIssue = {
  blockId: string
  blockType: string
  fieldPath: string
  message: string
}

/**
 * Validation result
 */
export type PublishValidationResult =
  | { ok: true }
  | { ok: false; issues: PublishIssue[] }

/**
 * Publish validation schemas (stricter than edit schemas)
 */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined
}

function brandLabel(brand: BrandKey) {
  return brand === "physio-konzept" ? "Physio‑Konzept" : "Physiotherapie"
}

const textPublishSchema = z.object({
  content: z.string().min(10, "Inhalt muss mindestens 10 Zeichen lang sein"),
})

const sectionPublishSchema = z.object({
  headline: z.string().min(3, "Headline muss mindestens 3 Zeichen lang sein"),
  content: z.string().min(10, "Inhalt muss mindestens 10 Zeichen lang sein"),
})

const servicesGridPublishSchema = z.object({
  cards: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(2, "Titel muss mindestens 2 Zeichen lang sein"),
      text: z.string().min(5, "Text muss mindestens 5 Zeichen lang sein"),
      ctaText: z.string().optional(),
      ctaHref: z.string().optional(),
    }).refine(
      (data) => {
        // Wenn ctaText gesetzt ist, muss ctaHref gesetzt sein und umgekehrt
        if (data.ctaText && !data.ctaHref) return false
        if (data.ctaHref && !data.ctaText) return false
        return true
      },
      {
        message: "CTA Text und Link müssen beide gesetzt sein oder beide leer",
        path: ["ctaText"],
      }
    )
  ).min(1, "Mindestens eine Card erforderlich"),
})

const faqPublishSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(3, "Frage muss mindestens 3 Zeichen lang sein"),
      answer: z.string().min(10, "Antwort muss mindestens 10 Zeichen lang sein"),
    })
  ).min(1, "Mindestens eine FAQ erforderlich"),
})

const teamPublishSchema = z.object({
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
      role: z.string().min(2, "Rolle muss mindestens 2 Zeichen lang sein"),
      imageUrl: z.string().min(1, "Bild URL erforderlich"),
      imageAlt: z.string().min(1, "Bild Alt-Text erforderlich"),
    })
  ).min(1, "Mindestens ein Mitglied erforderlich"),
})

const testimonialsPublishSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        quote: z.string().min(3, "Zitat muss mindestens 3 Zeichen lang sein"),
        name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
        role: z.string().optional(),
        rating: z.number().int().min(1).max(5).optional(),
      })
    )
    .min(1, "Mindestens ein Testimonial erforderlich"),
})

const galleryPublishSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().min(1, "Bild URL erforderlich"),
        alt: z.string().min(1, "Bild Alt-Text erforderlich"),
        caption: z.string().optional(),
      })
    )
    .min(3, "Mindestens 3 Bilder erforderlich"),
})

const openingHoursPublishSchema = z.object({
  hours: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(2, "Label muss mindestens 2 Zeichen lang sein"),
        value: z.string().min(2, "Wert muss mindestens 2 Zeichen lang sein"),
      })
    )
    .min(1, "Mindestens eine Zeile erforderlich"),
})

const imageSliderPublishSchema = z.object({
  slides: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().min(1, "Bild URL erforderlich"),
        alt: z.string().min(1, "Bild Alt-Text erforderlich"),
        title: z.string().optional(),
        text: z.string().optional(),
      })
    )
    .min(1, "Mindestens ein Slide erforderlich"),
})

/**
 * Validates a single block for publishing
 */
function validateBlock(block: CMSBlock): PublishIssue[] {
  const issues: PublishIssue[] = []

  try {
    // Ensure block.props exists
    if (!block.props || typeof block.props !== "object") {
      issues.push({
        blockId: block.id,
        blockType: block.type,
        fieldPath: "",
        message: "Block props fehlen oder sind ungültig",
      })
      return issues
    }

    switch (block.type) {
      case "hero": {
        const props = block.props as Record<string, unknown>
        const pageBrand = (props.mood as BrandKey | undefined) ?? "physiotherapy"
        const brandContent =
          isRecord(props.brandContent) && isRecord(props.brandContent[pageBrand])
            ? (props.brandContent[pageBrand] as Record<string, unknown>)
            : null

        const headline = (asString(brandContent?.headline) ?? asString(props.headline) ?? "").trim()
        if (headline.length < 3) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            fieldPath: "headline",
            message: `Headline (${brandLabel(pageBrand)}) muss mindestens 3 Zeichen lang sein`,
          })
        }

        const ctaText = (asString(brandContent?.ctaText) ?? asString(props.ctaText) ?? "").trim()
        const ctaHref = (asString(brandContent?.ctaHref) ?? asString(props.ctaHref) ?? "").trim()
        if ((ctaText && !ctaHref) || (ctaHref && !ctaText)) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            fieldPath: "ctaText",
            message: `CTA Text und Link (${brandLabel(pageBrand)}) müssen beide gesetzt sein oder beide leer`,
          })
        }
        break
      }

      case "text": {
        const result = textPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            issues.push({
              blockId: block.id,
              blockType: block.type,
              fieldPath: (error.path && error.path.length > 0 ? error.path.join(".") : "content") || "content",
              message: error.message || "Validierungsfehler",
            })
          })
        }
        break
      }

      case "section": {
        const result = sectionPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            issues.push({
              blockId: block.id,
              blockType: block.type,
              fieldPath: (error.path && error.path.length > 0 ? error.path.join(".") : "headline") || "headline",
              message: error.message || "Validierungsfehler",
            })
          })
        }
        break
      }

      case "servicesGrid": {
        const result = servicesGridPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            const path = (error.path && error.path.length > 0 ? error.path.join(".") : "cards") || "cards"
            // Handle array index errors (e.g., "cards.0.title")
            if (path.startsWith("cards.")) {
              issues.push({
                blockId: block.id,
                blockType: block.type,
                fieldPath: path,
                message: error.message || "Validierungsfehler",
              })
            } else {
              // General array error (e.g., "cards" min length)
              issues.push({
                blockId: block.id,
                blockType: block.type,
                fieldPath: "cards",
                message: error.message || "Validierungsfehler",
              })
            }
          })
        }
        break
      }

      case "faq": {
        const result = faqPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            const path = (error.path && error.path.length > 0 ? error.path.join(".") : "items") || "items"
            if (path.startsWith("items.")) {
              issues.push({
                blockId: block.id,
                blockType: block.type,
                fieldPath: path,
                message: error.message || "Validierungsfehler",
              })
            } else {
              issues.push({
                blockId: block.id,
                blockType: block.type,
                fieldPath: "items",
                message: error.message || "Validierungsfehler",
              })
            }
          })
        }
        break
      }

      case "team": {
        const result = teamPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            const path = (error.path && error.path.length > 0 ? error.path.join(".") : "members") || "members"
            if (path.startsWith("members.")) {
              issues.push({
                blockId: block.id,
                blockType: block.type,
                fieldPath: path,
                message: error.message || "Validierungsfehler",
              })
            } else {
              issues.push({
                blockId: block.id,
                blockType: block.type,
                fieldPath: "members",
                message: error.message || "Validierungsfehler",
              })
            }
          })
        }
        break
      }

      case "testimonials": {
        const result = testimonialsPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            const path = (error.path && error.path.length > 0 ? error.path.join(".") : "items") || "items"
            issues.push({
              blockId: block.id,
              blockType: block.type,
              fieldPath: path.startsWith("items.") ? path : "items",
              message: error.message || "Validierungsfehler",
            })
          })
        }
        break
      }

      case "gallery": {
        const result = galleryPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            const path = (error.path && error.path.length > 0 ? error.path.join(".") : "images") || "images"
            issues.push({
              blockId: block.id,
              blockType: block.type,
              fieldPath: path.startsWith("images.") ? path : "images",
              message: error.message || "Validierungsfehler",
            })
          })
        }
        break
      }

      case "openingHours": {
        const result = openingHoursPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            const path = (error.path && error.path.length > 0 ? error.path.join(".") : "hours") || "hours"
            issues.push({
              blockId: block.id,
              blockType: block.type,
              fieldPath: path.startsWith("hours.") ? path : "hours",
              message: error.message || "Validierungsfehler",
            })
          })
        }
        break
      }

      case "imageSlider": {
        const result = imageSliderPublishSchema.safeParse(block.props)
        if (!result.success && result.error) {
          const errors = result.error.issues || []
          errors.forEach((error) => {
            const path = (error.path && error.path.length > 0 ? error.path.join(".") : "slides") || "slides"
            issues.push({
              blockId: block.id,
              blockType: block.type,
              fieldPath: path.startsWith("slides.") ? path : "slides",
              message: error.message || "Validierungsfehler",
            })
          })
        }
        break
      }

      case "contactForm": {
        const props = block.props as Record<string, unknown>
        
        // Validate heading
        const heading = (asString(props.heading) ?? "").trim()
        if (heading.length < 3) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            fieldPath: "heading",
            message: "Überschrift muss mindestens 3 Zeichen lang sein",
          })
        }

        // Validate submitLabel
        const submitLabel = (asString(props.submitLabel) ?? "").trim()
        if (submitLabel.length < 2) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            fieldPath: "submitLabel",
            message: "Button-Text muss mindestens 2 Zeichen lang sein",
          })
        }

        // Validate fields array
        const fields = Array.isArray(props.fields) ? props.fields : []
        if (fields.length === 0) {
          issues.push({
            blockId: block.id,
            blockType: block.type,
            fieldPath: "fields",
            message: "Mindestens ein Formularfeld erforderlich",
          })
        }

        // Validate requireConsent and consentLabel
        const requireConsent = props.requireConsent === true
        if (requireConsent) {
          const consentLabel = (asString(props.consentLabel) ?? "").trim()
          if (consentLabel.length === 0) {
            issues.push({
              blockId: block.id,
              blockType: block.type,
              fieldPath: "consentLabel",
              message: "Zustimmungs-Text erforderlich, wenn Zustimmung erforderlich ist",
            })
          }
        }
        break
      }

      // Other block types (imageText, featureGrid, cta) - no validation for MVP
      default:
        break
    }
  } catch (error) {
    // Fallback for unexpected errors
    issues.push({
      blockId: block.id,
      blockType: block.type,
      fieldPath: "",
      message: `Unerwarteter Validierungsfehler: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  return issues
}

/**
 * Validates a page for publishing
 */
export function validatePageForPublish(page: { blocks: CMSBlock[] }): PublishValidationResult {
  try {
    if (!page || !Array.isArray(page.blocks)) {
      return {
        ok: false,
        issues: [{
          blockId: "",
          blockType: "unknown",
          fieldPath: "",
          message: "Ungültige Seitenstruktur: blocks Array fehlt",
        }],
      }
    }

    const allIssues: PublishIssue[] = []

    const pageBrand = (page as unknown as { brand?: BrandKey }).brand

    for (const block of page.blocks) {
      if (!block || !block.id || !block.type) {
        allIssues.push({
          blockId: block?.id || "unknown",
          blockType: block?.type || "unknown",
          fieldPath: "",
          message: "Ungültiger Block: id oder type fehlt",
        })
        continue
      }

      // Provide page brand context for brand-specific blocks (e.g., hero brandContent)
      const blockIssues =
        block.type === "hero" && pageBrand
          ? (() => {
              // Temporarily mirror page brand into props.mood for validation context without mutating state
              const next = {
                ...block,
                props: isRecord(block.props) ? ({ ...block.props, mood: pageBrand } as Record<string, unknown>) : block.props,
              } as CMSBlock
              return validateBlock(next)
            })()
          : validateBlock(block)
      allIssues.push(...blockIssues)
    }

    if (allIssues.length === 0) {
      return { ok: true }
    }

    return { ok: false, issues: allIssues }
  } catch (error) {
    console.error("Error in validatePageForPublish:", error)
    return {
      ok: false,
      issues: [{
        blockId: "",
        blockType: "unknown",
        fieldPath: "",
        message: `Validierungsfehler: ${error instanceof Error ? error.message : String(error)}`,
      }],
    }
  }
}
