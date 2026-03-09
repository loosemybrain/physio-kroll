import { NextResponse } from "next/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server"

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
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }
    const admin = await getSupabaseAdmin()

    const { data: scan, error: scanErr } = await admin
      .from("cookie_scans")
      .select("id, target_url, environment, scanned_at, status, consent_mode, approval_status, error_message, created_at, updated_at, started_at, finished_at, processed_by")
      .eq("id", id)
      .single()

    if (scanErr || !scan) {
      return NextResponse.json(
        { error: "Scan nicht gefunden." },
        { status: scanErr?.code === "PGRST116" ? 404 : 500 }
      )
    }

    const { data: items, error: itemsErr } = await admin
      .from("cookie_scan_items")
      .select("*")
      .eq("scan_id", id)
      .order("name")

    if (itemsErr) {
      return NextResponse.json({ error: "Items konnten nicht geladen werden." }, { status: 500 })
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
        updatedAt: scan.updated_at ?? scan.created_at,
        startedAt: scan.started_at ?? null,
        finishedAt: scan.finished_at ?? null,
        processedBy: scan.processed_by ?? null,
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
      { error: "Anfrage fehlgeschlagen." },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/cookie-scan/:id
 * Scan: approval_status (draft | reviewed | approved | rejected). Nur Admin.
 * Body: { approvalStatus?: "draft"|"reviewed"|"approved"|"rejected" }
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }
    const admin = await getSupabaseAdmin()

    const body = await request.json().catch(() => ({}))
    const approvalStatus = body.approvalStatus
    if (!approvalStatus || !["draft", "reviewed", "approved", "rejected"].includes(approvalStatus)) {
      return NextResponse.json({ error: "approvalStatus ungültig (draft|reviewed|approved|rejected)" }, { status: 400 })
    }

    const { data, error } = await admin
      .from("cookie_scans")
      .update({ approval_status: approvalStatus })
      .eq("id", id)
      .select("id, approval_status")
      .single()

    if (error) {
      return NextResponse.json({ error: "Freigabe konnte nicht gespeichert werden." }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      approvalStatus: data.approval_status,
    })
  } catch (e) {
    console.error("Cookie scan patch error:", e)
    return NextResponse.json(
      { error: "Anfrage fehlgeschlagen." },
      { status: 500 }
    )
  }
}
