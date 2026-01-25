import type { CMSBlock } from "@/types/cms"
import { getBlockDefinition } from "./registry"

/**
 * Normalizes a block by validating props against schema and merging defaults
 * If validation fails, falls back to defaults but preserves id and type
 */
function generateUniqueId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function normalizeBlock(block: CMSBlock): CMSBlock {
  const definition = getBlockDefinition(block.type)

  // Preserve section config (not part of zod schemas; must not be dropped)
  const section = (block.props as unknown as { section?: unknown })?.section
  
  try {
    // Validate and parse props
    const validatedProps = definition.zodSchema.parse(block.props)
    
    // Merge with defaults to ensure all fields are present
    // IMPORTANT: For arrays with objects (like servicesGrid.cards), use validatedProps directly
    // to preserve user edits including empty strings. Don't merge defaults which would overwrite.
    const normalizedProps: Record<string, unknown> = { ...definition.defaults }
    
    // For arrays with objects (e.g., servicesGrid.cards), use validatedProps directly
    // to preserve all user edits including empty strings
    for (const [key, value] of Object.entries(validatedProps)) {
      if (Array.isArray(value) && Array.isArray(normalizedProps[key])) {
        // For arrays with objects, use validatedProps directly (preserves empty strings and all edits)
        normalizedProps[key] = value
      } else {
        // Simple merge for non-array values
        normalizedProps[key] = value
      }
    }

    // Re-attach section config (if present)
    if (section && typeof section === "object") {
      normalizedProps.section = section
    }
    
    // Ensure unique IDs for servicesGrid cards
    if (block.type === "servicesGrid" && "cards" in normalizedProps) {
      const cards = normalizedProps.cards as Array<{ id: string }>
      const seenIds = new Set<string>()
      normalizedProps.cards = cards.map((card, index) => {
        if (seenIds.has(card.id)) {
          // Generate new unique ID if duplicate
          const newId = generateUniqueId("card", index)
          seenIds.add(newId)
          return { ...card, id: newId }
        }
        seenIds.add(card.id)
        return card
      })
    }

    // Ensure unique IDs for testimonials items
    if (block.type === "testimonials" && "items" in normalizedProps) {
      const items = normalizedProps.items as Array<{ id: string }>
      const seenIds = new Set<string>()
      normalizedProps.items = items.map((item, index) => {
        if (seenIds.has(item.id)) {
          const newId = generateUniqueId("testimonial", index)
          seenIds.add(newId)
          return { ...item, id: newId }
        }
        seenIds.add(item.id)
        return item
      })
    }

    // Ensure unique IDs for gallery images
    if (block.type === "gallery" && "images" in normalizedProps) {
      const images = normalizedProps.images as Array<{ id: string }>
      const seenIds = new Set<string>()
      normalizedProps.images = images.map((img, index) => {
        if (seenIds.has(img.id)) {
          const newId = generateUniqueId("image", index)
          seenIds.add(newId)
          return { ...img, id: newId }
        }
        seenIds.add(img.id)
        return img
      })
    }

    // Ensure unique IDs for opening hours rows
    if (block.type === "openingHours" && "hours" in normalizedProps) {
      const rows = normalizedProps.hours as Array<{ id: string }>
      const seenIds = new Set<string>()
      normalizedProps.hours = rows.map((row, index) => {
        if (seenIds.has(row.id)) {
          const newId = generateUniqueId("hours", index)
          seenIds.add(newId)
          return { ...row, id: newId }
        }
        seenIds.add(row.id)
        return row
      })
    }

    // Ensure unique IDs for image slider slides
    if (block.type === "imageSlider" && "slides" in normalizedProps) {
      const slides = normalizedProps.slides as Array<{ id: string }>
      const seenIds = new Set<string>()
      normalizedProps.slides = slides.map((slide, index) => {
        if (seenIds.has(slide.id)) {
          const newId = generateUniqueId("slide", index)
          seenIds.add(newId)
          return { ...slide, id: newId }
        }
        seenIds.add(slide.id)
        return slide
      })
    }
    
    return {
      ...block,
      props: normalizedProps,
    } as CMSBlock
  } catch (error) {
    // If validation fails, use defaults but keep id and type
    console.warn(`Block ${block.id} (${block.type}) validation failed, using defaults:`, error)
    
    const defaultProps: Record<string, unknown> = { ...(definition.defaults as Record<string, unknown>) }
    if (section && typeof section === "object") {
      ;(defaultProps as Record<string, unknown>).section = section
    }
    
    // Ensure unique IDs for servicesGrid cards in defaults
    if (block.type === "servicesGrid" && "cards" in defaultProps) {
      const cards = defaultProps.cards as Array<Record<string, unknown> & { id: string }>
      defaultProps.cards = cards.map((card, index) => ({
        ...card,
        id: generateUniqueId("card", index),
      }))
    }

    // Ensure unique IDs for testimonials items in defaults
    if (block.type === "testimonials" && "items" in defaultProps) {
      const items = defaultProps.items as Array<Record<string, unknown> & { id: string }>
      defaultProps.items = items.map((item, index) => ({
        ...item,
        id: generateUniqueId("testimonial", index),
      }))
    }

    // Ensure unique IDs for gallery images in defaults
    if (block.type === "gallery" && "images" in defaultProps) {
      const images = defaultProps.images as Array<Record<string, unknown> & { id: string }>
      defaultProps.images = images.map((img, index) => ({
        ...img,
        id: generateUniqueId("image", index),
      }))
    }

    // Ensure unique IDs for opening hours rows in defaults
    if (block.type === "openingHours" && "hours" in defaultProps) {
      const rows = defaultProps.hours as Array<Record<string, unknown> & { id: string }>
      defaultProps.hours = rows.map((row, index) => ({
        ...row,
        id: generateUniqueId("hours", index),
      }))
    }

    // Ensure unique IDs for image slider slides in defaults
    if (block.type === "imageSlider" && "slides" in defaultProps) {
      const slides = defaultProps.slides as Array<Record<string, unknown> & { id: string }>
      defaultProps.slides = slides.map((slide, index) => ({
        ...slide,
        id: generateUniqueId("slide", index),
      }))
    }
    
    return {
      id: block.id,
      type: block.type,
      props: defaultProps,
    } as CMSBlock
  }
}

/**
 * Normalizes an array of blocks
 */
export function normalizeBlocks(blocks: CMSBlock[]): CMSBlock[] {
  return blocks.map(normalizeBlock)
}
