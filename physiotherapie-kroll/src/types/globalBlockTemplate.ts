/**
 * Globale Block-Vorlagen (API/DB-Mapping: DB snake_case → JSON camelCase).
 */

export type GlobalBlockTemplateSourceSnapshot = {
  id: string
  type: string
  props: Record<string, unknown>
}

export type GlobalBlockTemplate = {
  id: string
  name: string
  description: string | null
  blockType: string
  brand: string | null
  pageType: string | null
  pageSubtype: string | null
  sourceBlock: GlobalBlockTemplateSourceSnapshot
  createdAt: string
  updatedAt: string
}

export type CreateGlobalBlockTemplateInput = {
  name: string
  description?: string | null
  brand?: string | null
  pageType?: string | null
  pageSubtype?: string | null
  sourceBlock: {
    id?: string
    type: string
    props?: Record<string, unknown>
  }
}

export type UpdateGlobalBlockTemplateInput = {
  name?: string
  description?: string | null
  brand?: string | null
  pageType?: string | null
  pageSubtype?: string | null
  sourceBlock?: GlobalBlockTemplateSourceSnapshot
}
