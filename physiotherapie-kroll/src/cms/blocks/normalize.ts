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

    // Ensure unique IDs for legal blocks and sync rows to columns (defensive for historical/incomplete data)
    if (block.type === "legalTable") {
      const colsRaw = normalizedProps.columns
      const cols = Array.isArray(colsRaw) ? (colsRaw as Array<{ id: string }>) : []
      const seen = new Set<string>()
      const normalizedCols = cols.map((c, i) =>
        c && typeof c === "object" && c.id
          ? (seen.has(c.id) ? { ...c, id: generateUniqueId("col", i) } : (seen.add(c.id), c))
          : { id: generateUniqueId("col", i), label: "", width: "" }
      )
      normalizedProps.columns = normalizedCols
      const columnIds = new Set(normalizedCols.map((c) => c.id))

      const rowsRaw = normalizedProps.rows
      const rowsArray = Array.isArray(rowsRaw) ? (rowsRaw as Array<{ id?: string; cells?: Record<string, string> }>) : []
      const seenRow = new Set<string>()
      normalizedProps.rows = rowsArray.map((r, ri) => {
        const cells = r?.cells && typeof r.cells === "object" ? r.cells : {}
        const synced: Record<string, string> = {}
        for (const colId of columnIds) synced[colId] = cells[colId] ?? ""
        const rowId =
          r?.id && !seenRow.has(r.id) ? (seenRow.add(r.id), r.id) : (() => { const id = generateUniqueId("row", ri); seenRow.add(id); return id })()
        return { ...r, id: rowId, cells: synced }
      })
    }
    if (block.type === "legalContactCard" && "lines" in normalizedProps) {
      const lines = normalizedProps.lines as Array<{ id: string }>
      const seen = new Set<string>()
      normalizedProps.lines = lines.map((l, i) => (seen.has(l.id) ? { ...l, id: generateUniqueId("line", i) } : (seen.add(l.id), l)))
    }
    if (block.type === "legalCookieCategories" && "categories" in normalizedProps) {
      const categories = normalizedProps.categories as Array<{ id: string; cookies?: Array<{ id: string }> }>
      const seenCat = new Set<string>()
      const seenCookie = new Set<string>()
      normalizedProps.categories = categories.map((cat, ci) => {
        const newCat = seenCat.has(cat.id) ? { ...cat, id: generateUniqueId("cat", ci) } : (seenCat.add(cat.id), { ...cat })
        const newCookies = (newCat.cookies ?? []).map((ck, ki) =>
          seenCookie.has(ck.id) ? { ...ck, id: generateUniqueId("cookie", ki) } : (seenCookie.add(ck.id), { ...ck })
        )
        return { ...newCat, cookies: newCookies }
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

    // Ensure unique IDs for legal blocks in defaults
    if (block.type === "legalTable") {
      const cols = defaultProps.columns as Array<Record<string, unknown> & { id: string }> | undefined
      if (cols?.length) defaultProps.columns = cols.map((c, i) => ({ ...c, id: generateUniqueId("col", i) }))
      const rows = defaultProps.rows as Array<Record<string, unknown> & { id: string }> | undefined
      if (rows?.length) defaultProps.rows = rows.map((r, i) => ({ ...r, id: generateUniqueId("row", i) }))
    }
    if (block.type === "legalContactCard" && defaultProps.lines) {
      const lines = defaultProps.lines as Array<Record<string, unknown> & { id: string }>
      defaultProps.lines = lines.map((l, i) => ({ ...l, id: generateUniqueId("line", i) }))
    }
    if (block.type === "legalCookieCategories" && defaultProps.categories) {
      const categories = defaultProps.categories as Array<Record<string, unknown> & { id: string; cookies?: Array<{ id: string }> }>
      defaultProps.categories = categories.map((cat, ci) => ({
        ...cat,
        id: generateUniqueId("cat", ci),
        cookies: (cat.cookies ?? []).map((ck, ki) => ({ ...ck, id: generateUniqueId("cookie", ki) })),
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
