import { NextResponse } from "next/server"
import { requireAdminWithServiceRole } from "@/lib/api/adminServiceRoute"
import { validateCreateGlobalBlockTemplateBody } from "@/lib/cms/validateGlobalBlockTemplatePayload"
import { mapGlobalBlockTemplateRow, type GlobalBlockTemplateRow } from "@/lib/cms/globalBlockTemplateMap"

/**
 * GET /api/admin/block-templates
 */
export async function GET(request: Request) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { adminClient } = gate.ctx
    const { searchParams } = new URL(request.url)

    let q = adminClient.from("global_block_templates").select("*")

    const brand = searchParams.get("brand")
    if (brand) q = q.eq("brand", brand)

    const pageType = searchParams.get("pageType")
    if (pageType) q = q.eq("page_type", pageType)

    const pageSubtype = searchParams.get("pageSubtype")
    if (pageSubtype) q = q.eq("page_subtype", pageSubtype)

    const blockType = searchParams.get("blockType")
    if (blockType) q = q.eq("block_type", blockType)

    const { data, error } = await q.order("created_at", { ascending: false })

    if (error) {
      console.error("block-templates list error:", error)
      return NextResponse.json({ error: "Failed to load templates" }, { status: 500 })
    }

    const rows = (data ?? []) as GlobalBlockTemplateRow[]
    return NextResponse.json(rows.map(mapGlobalBlockTemplateRow), { status: 200 })
  } catch (e) {
    console.error("block-templates GET failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/block-templates
 */
export async function POST(request: Request) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const body = await request.json().catch(() => null)
    const parsed = validateCreateGlobalBlockTemplateBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    const v = parsed.value
    const { adminClient } = gate.ctx

    const { data, error } = await adminClient
      .from("global_block_templates")
      .insert({
        name: v.name,
        description: v.description,
        block_type: v.blockType,
        brand: v.brand,
        page_type: v.pageType,
        page_subtype: v.pageSubtype,
        source_block: v.sourceBlock,
      })
      .select("*")
      .single()

    if (error || !data) {
      console.error("block-templates insert error:", error)
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
    }

    return NextResponse.json(mapGlobalBlockTemplateRow(data as GlobalBlockTemplateRow), { status: 201 })
  } catch (e) {
    console.error("block-templates POST failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
