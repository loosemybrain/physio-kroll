import type { CMSBlock } from "@/types/cms"
import { uuid } from "@/lib/cms/arrayOps"

/**
 * Creates a deep copy of a CMS block with new IDs
 * - New block.id
 * - New IDs for nested array items (cards, features, items, members)
 */
export function duplicateBlock(block: CMSBlock): CMSBlock {
  // Deep clone using structuredClone if available, otherwise JSON parse/stringify
  let cloned: CMSBlock
  if (typeof structuredClone !== "undefined") {
    cloned = structuredClone(block)
  } else {
    cloned = JSON.parse(JSON.stringify(block))
  }

  // Assign new block ID
  cloned.id = uuid()

  // Renew item IDs in nested arrays based on block type
  switch (block.type) {
    case "servicesGrid": {
      const props = cloned.props as { cards?: Array<{ id: string }> }
      if (props.cards && Array.isArray(props.cards)) {
        props.cards = props.cards.map((card) => ({
          ...card,
          id: uuid(),
        }))
      }
      break
    }

    case "featureGrid": {
      const props = cloned.props as { features?: Array<{ id: string }> }
      if (props.features && Array.isArray(props.features)) {
        props.features = props.features.map((feature) => ({
          ...feature,
          id: uuid(),
        }))
      }
      break
    }

    case "faq": {
      const props = cloned.props as { items?: Array<{ id: string }> }
      if (props.items && Array.isArray(props.items)) {
        props.items = props.items.map((item) => ({
          ...item,
          id: uuid(),
        }))
      }
      break
    }

    case "team": {
      const props = cloned.props as { members?: Array<{ id: string }> }
      if (props.members && Array.isArray(props.members)) {
        props.members = props.members.map((member) => ({
          ...member,
          id: uuid(),
        }))
      }
      break
    }

    case "testimonials": {
      const props = cloned.props as { items?: Array<{ id: string }> }
      if (props.items && Array.isArray(props.items)) {
        props.items = props.items.map((item) => ({
          ...item,
          id: uuid(),
        }))
      }
      break
    }

    case "gallery": {
      const props = cloned.props as { images?: Array<{ id: string }> }
      if (props.images && Array.isArray(props.images)) {
        props.images = props.images.map((img) => ({
          ...img,
          id: uuid(),
        }))
      }
      break
    }

    case "openingHours": {
      const props = cloned.props as { hours?: Array<{ id: string }> }
      if (props.hours && Array.isArray(props.hours)) {
        props.hours = props.hours.map((row) => ({
          ...row,
          id: uuid(),
        }))
      }
      break
    }

    case "imageSlider": {
      const props = cloned.props as { slides?: Array<{ id: string }> }
      if (props.slides && Array.isArray(props.slides)) {
        props.slides = props.slides.map((slide) => ({
          ...slide,
          id: uuid(),
        }))
      }
      break
    }

    // hero.trustItems is string[] - no IDs needed
    // section, text, cta, imageText - only block.id needs renewal (already done)
    default:
      break
  }

  return cloned
}
