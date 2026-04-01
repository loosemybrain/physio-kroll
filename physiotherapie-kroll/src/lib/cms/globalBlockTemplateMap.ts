import type { GlobalBlockTemplate, GlobalBlockTemplateSourceSnapshot } from "@/types/globalBlockTemplate"

/** DB row shape for `global_block_templates`. */
export type GlobalBlockTemplateRow = {
  id: string
  name: string
  description: string | null
  block_type: string
  brand: string | null
  page_type: string | null
  page_subtype: string | null
  source_block: unknown
  created_at: string
  updated_at: string
}

function parseSourceBlock(raw: unknown, fallbackType: string): GlobalBlockTemplateSourceSnapshot {
  const o = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {}
  const propsVal = o.props
  const props =
    typeof propsVal === "object" && propsVal !== null ? (propsVal as Record<string, unknown>) : {}
  const typeStr = typeof o.type === "string" && o.type.trim() ? o.type.trim() : fallbackType
  const idStr = typeof o.id === "string" ? o.id : ""
  return { id: idStr, type: typeStr, props }
}

export function mapGlobalBlockTemplateRow(r: GlobalBlockTemplateRow): GlobalBlockTemplate {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    blockType: r.block_type,
    brand: r.brand,
    pageType: r.page_type,
    pageSubtype: r.page_subtype,
    sourceBlock: parseSourceBlock(r.source_block, r.block_type),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}
