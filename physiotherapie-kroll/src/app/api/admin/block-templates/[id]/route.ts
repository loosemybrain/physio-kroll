import { NextResponse } from "next/server"
import { requireAdminWithServiceRole, isUuidString } from "@/lib/api/adminServiceRoute"
import { validatePatchGlobalBlockTemplateBody } from "@/lib/cms/validateGlobalBlockTemplatePayload"
import { mapGlobalBlockTemplateRow, type GlobalBlockTemplateRow } from "@/lib/cms/globalBlockTemplateMap"

/**
 * PATCH /api/admin/block-templates/:id
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { id } = await ctx.params
    if (!isUuidString(id)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const parsed = validatePatchGlobalBlockTemplateBody(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }

    const v = parsed.value
    const { adminClient } = gate.ctx

    const patch: Record<string, unknown> = {}
    if (v.name !== undefined) patch.name = v.name
    if (v.description !== undefined) patch.description = v.description
    if (v.brand !== undefined) patch.brand = v.brand
    if (v.pageType !== undefined) patch.page_type = v.pageType
    if (v.pageSubtype !== undefined) patch.page_subtype = v.pageSubtype
    if (v.sourceBlock !== undefined) {
      patch.source_block = v.sourceBlock
      if (v.blockType) patch.block_type = v.blockType
    }

    const { data, error } = await adminClient
      .from("global_block_templates")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      console.error("block-templates patch error:", error)
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json(mapGlobalBlockTemplateRow(data as GlobalBlockTemplateRow), { status: 200 })
  } catch (e) {
    console.error("block-templates PATCH failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/block-templates/:id
 */
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response

    const { id } = await ctx.params
    if (!isUuidString(id)) {
      return NextResponse.json({ error: "Invalid template id" }, { status: 400 })
    }

    const { adminClient } = gate.ctx
    const { data, error } = await adminClient.from("global_block_templates").delete().eq("id", id).select("id")

    if (error) {
      console.error("block-templates delete error:", error)
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
    }
    if (!data?.length) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error("block-templates DELETE failed:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
