import type { CMSBlock } from "@/types/cms"
import type { GlobalBlockTemplateSourceSnapshot } from "@/types/globalBlockTemplate"
import { sanitizeCmsBlocksForPersistence } from "@/lib/security/sanitizeCmsHtmlOnWrite"

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

/** Trim; leer → null */
export function normalizeOptionalText(v: unknown): string | null {
  if (v === undefined || v === null) return null
  if (typeof v !== "string") return null
  const t = v.trim()
  return t === "" ? null : t
}

function sanitizeSourceSnapshot(sb: GlobalBlockTemplateSourceSnapshot): GlobalBlockTemplateSourceSnapshot {
  const id = sb.id?.trim() || "00000000-0000-4000-8000-000000000000"
  const asBlock = { id, type: sb.type, props: sb.props } as CMSBlock
  const out = sanitizeCmsBlocksForPersistence([asBlock])[0]
  return {
    id: typeof out.id === "string" ? out.id : id,
    type: typeof out.type === "string" ? out.type : sb.type,
    props: (out.props ?? {}) as Record<string, unknown>,
  }
}

export type ValidatedCreateGlobalBlockTemplate = {
  name: string
  description: string | null
  brand: string | null
  pageType: string | null
  pageSubtype: string | null
  blockType: string
  sourceBlock: GlobalBlockTemplateSourceSnapshot
}

export function validateCreateGlobalBlockTemplateBody(body: unknown):
  | { ok: true; value: ValidatedCreateGlobalBlockTemplate }
  | { ok: false; error: string; status: number } {
  if (!isRecord(body)) {
    return { ok: false, error: "Invalid payload", status: 400 }
  }

  const nameRaw = body.name
  if (typeof nameRaw !== "string" || !nameRaw.trim()) {
    return { ok: false, error: "Invalid name", status: 400 }
  }
  const name = nameRaw.trim()

  const description = normalizeOptionalText(body.description)
  const brand = normalizeOptionalText(body.brand)
  const pageType = normalizeOptionalText(body.pageType)
  const pageSubtype = normalizeOptionalText(body.pageSubtype)

  const rawSb = body.sourceBlock
  if (!isRecord(rawSb)) {
    return { ok: false, error: "sourceBlock must be an object", status: 400 }
  }

  const typeStr = rawSb.type
  if (typeof typeStr !== "string" || !typeStr.trim()) {
    return { ok: false, error: "sourceBlock.type is required", status: 400 }
  }
  const blockType = typeStr.trim()

  let props: Record<string, unknown> = {}
  if (rawSb.props !== undefined) {
    if (!isRecord(rawSb.props)) {
      return { ok: false, error: "sourceBlock.props must be an object", status: 400 }
    }
    props = rawSb.props
  }

  const idStr =
    typeof rawSb.id === "string" && rawSb.id.trim()
      ? rawSb.id.trim()
      : "00000000-0000-4000-8000-000000000000"

  const sourceBlock = sanitizeSourceSnapshot({
    id: idStr,
    type: blockType,
    props,
  })

  return {
    ok: true,
    value: {
      name,
      description,
      brand,
      pageType,
      pageSubtype,
      blockType,
      sourceBlock,
    },
  }
}

export type ValidatedPatchGlobalBlockTemplate = {
  name?: string
  description?: string | null
  brand?: string | null
  pageType?: string | null
  pageSubtype?: string | null
  sourceBlock?: GlobalBlockTemplateSourceSnapshot
  blockType?: string
}

export function validatePatchGlobalBlockTemplateBody(body: unknown):
  | { ok: true; value: ValidatedPatchGlobalBlockTemplate }
  | { ok: false; error: string; status: number } {
  if (!isRecord(body)) {
    return { ok: false, error: "Invalid payload", status: 400 }
  }

  const out: ValidatedPatchGlobalBlockTemplate = {}

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { ok: false, error: "Invalid name", status: 400 }
    }
    out.name = body.name.trim()
  }

  if (body.description !== undefined) {
    out.description = normalizeOptionalText(body.description)
  }

  if (body.brand !== undefined) {
    out.brand = normalizeOptionalText(body.brand)
  }

  if (body.pageType !== undefined) {
    out.pageType = normalizeOptionalText(body.pageType)
  }

  if (body.pageSubtype !== undefined) {
    out.pageSubtype = normalizeOptionalText(body.pageSubtype)
  }

  if (body.sourceBlock !== undefined) {
    const rawSb = body.sourceBlock
    if (!isRecord(rawSb)) {
      return { ok: false, error: "sourceBlock must be an object", status: 400 }
    }
    const typeStr = rawSb.type
    if (typeof typeStr !== "string" || !typeStr.trim()) {
      return { ok: false, error: "sourceBlock.type is required", status: 400 }
    }
    const blockType = typeStr.trim()
    let props: Record<string, unknown> = {}
    if (rawSb.props !== undefined) {
      if (!isRecord(rawSb.props)) {
        return { ok: false, error: "sourceBlock.props must be an object", status: 400 }
      }
      props = rawSb.props
    }
    const idStr = typeof rawSb.id === "string" && rawSb.id.trim() ? rawSb.id.trim() : "00000000-0000-4000-8000-000000000000"
    const sourceBlock = sanitizeSourceSnapshot({ id: idStr, type: blockType, props })
    out.sourceBlock = sourceBlock
    out.blockType = blockType
  }

  if (Object.keys(out).length === 0) {
    return { ok: false, error: "No valid fields to update", status: 400 }
  }

  return { ok: true, value: out }
}
