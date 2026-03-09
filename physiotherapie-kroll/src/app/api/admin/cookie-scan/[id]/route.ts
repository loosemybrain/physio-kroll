import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * GET /api/admin/cookie-scan/:id
 * Ein Scan inkl. Items. Nur Admin.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: scan, error: scanErr } = await supabase
      .from("cookie_scans")
      .select("*")
      .eq("id", id)
      .single()

    if (scanErr || !scan) {
      return NextResponse.json(
        { error: scanErr?.message ?? "Scan nicht gefunden" },
        { status: scanErr?.code === "PGRST116" ? 404 : 500 }
      )
    }

    const { data: items, error: itemsErr } = await supabase
      .from("cookie_scan_items")
      .select("*")
      .eq("scan_id", id)
      .order("name")

    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    return NextResponse.json({
      scan: {
        id: scan.id,
        targetUrl: scan.target_url,
        environment: scan.environment,
        scannedAt: scan.scanned_at,
        status: scan.status,
        consentMode: scan.consent_mode,
        approvalStatus: scan.approval_status,
        errorMessage: scan.error_message,
        createdAt: scan.created_at,
        updatedAt: scan.updated_at,
      },
      items: (items ?? []).map((it) => ({
        id: it.id,
        scanId: it.scan_id,
        name: it.name,
        domain: it.domain,
        path: it.path,
        category: it.category,
        purpose: it.purpose,
        duration: it.duration,
        secure: it.secure,
        httpOnly: it.http_only,
        sameSite: it.same_site,
        provider: it.provider,
        sourceUrl: it.source_url,
        isThirdParty: it.is_third_party,
        notes: it.notes,
        createdAt: it.created_at,
      })),
    })
  } catch (e) {
    console.error("Cookie scan get error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/cookie-scan/:id
 * Scan: approval_status (draft | reviewed | approved). Nur Admin.
 * Body: { approvalStatus?: "draft"|"reviewed"|"approved" }
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const approvalStatus = body.approvalStatus
    if (!approvalStatus || !["draft", "reviewed", "approved"].includes(approvalStatus)) {
      return NextResponse.json({ error: "approvalStatus ungültig (draft|reviewed|approved)" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("cookie_scans")
      .update({ approval_status: approvalStatus })
      .eq("id", id)
      .select("id, approval_status")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      approvalStatus: data.approval_status,
    })
  } catch (e) {
    console.error("Cookie scan patch error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
