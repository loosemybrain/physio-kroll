import { NextResponse } from "next/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin.server"

/**
 * PATCH /api/admin/cookie-scan/:id/items/:itemId
 * Einzelnes Item bearbeiten (category, purpose, provider, notes). Nur Admin.
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await ctx.params
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }
    const admin = await getSupabaseAdmin()

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}
    if (typeof body.category === "string") updates.category = body.category || null
    if (typeof body.purpose === "string") updates.purpose = body.purpose || null
    if (typeof body.provider === "string") updates.provider = body.provider || null
    if (typeof body.notes === "string") updates.notes = body.notes || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Keine gültigen Felder (category, purpose, provider, notes)" }, { status: 400 })
    }

    const { data, error } = await admin
      .from("cookie_scan_items")
      .update(updates)
      .eq("id", itemId)
      .eq("scan_id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Item konnte nicht gespeichert werden." }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      category: data.category,
      purpose: data.purpose,
      provider: data.provider,
      notes: data.notes,
    })
  } catch (e) {
    console.error("Cookie scan item patch error:", e)
    return NextResponse.json(
      { error: "Anfrage fehlgeschlagen." },
      { status: 500 }
    )
  }
}
