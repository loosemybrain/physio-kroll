import { NextResponse } from "next/server"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"

/**
 * GET /api/cookie-scan/approved
 * Öffentlich: letzter freigegebener Scan inkl. Items (für Cookie-Seite).
 * Keine Auth. Nur approval_status = 'approved'.
 */
export async function GET() {
  try {
    const supabase = await getSupabasePublic()

    const { data: scan, error: scanErr } = await supabase
      .from("cookie_scans")
      .select("id, target_url, scanned_at, approval_status, updated_at")
      .eq("approval_status", "approved")
      .order("scanned_at", { ascending: false })
      .limit(1)
      .single()

    if (scanErr || !scan) {
      return NextResponse.json({
        scan: null,
        items: [],
        message: "Kein freigegebener Cookie-Scan vorhanden.",
      })
    }

    const { data: items, error: itemsErr } = await supabase
      .from("cookie_scan_items")
      .select("id, name, domain, path, category, purpose, duration, secure, http_only, same_site, provider, is_third_party")
      .eq("scan_id", scan.id)
      .order("name")

    if (itemsErr) {
      return NextResponse.json({
        scan: {
          id: scan.id,
          targetUrl: scan.target_url,
          scannedAt: scan.scanned_at,
          updatedAt: scan.updated_at,
        },
        items: [],
        message: "Items konnten nicht geladen werden.",
      })
    }

    return NextResponse.json({
      scan: {
        id: scan.id,
        targetUrl: scan.target_url,
        scannedAt: scan.scanned_at,
        updatedAt: scan.updated_at,
      },
      items: (items ?? []).map((it) => ({
        id: it.id,
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
        isThirdParty: it.is_third_party,
      })),
    })
  } catch (e) {
    console.error("Cookie scan approved error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unbekannter Fehler" },
      { status: 500 }
    )
  }
}
