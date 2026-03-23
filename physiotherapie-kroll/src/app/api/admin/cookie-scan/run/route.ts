import { NextResponse } from "next/server"
import { requireAdminGuard } from "@/lib/auth/adminGuard"
import { createSupabaseServerClient, getSupabaseAdmin } from "@/lib/supabase/server"
import { isLocalOrPrivateUrl } from "@/lib/cookie-scan/isLocalOrPrivateUrl"

/**
 * POST /api/admin/cookie-scan/run
 * Legt nur einen Scan-Job an (status=queued). Kein Playwright in dieser Runtime.
 * Ein separater Cookie-Scan-Worker (Docker) holt den Job und führt den Scan aus.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const guard = await requireAdminGuard(supabase)
    if (!guard.ok) {
      return NextResponse.json({ error: guard.message }, { status: guard.status })
    }
    const admin = await getSupabaseAdmin()

    const body = await request.json().catch(() => ({}))
    const targetUrl = typeof body.targetUrl === "string" ? body.targetUrl.trim() : ""
    if (!targetUrl) {
      return NextResponse.json({ error: "targetUrl fehlt" }, { status: 400 })
    }
    try {
      new URL(targetUrl)
    } catch {
      return NextResponse.json({ error: "Ungültige targetUrl" }, { status: 400 })
    }

    const allowLocalhost = process.env.COOKIE_SCAN_ALLOW_LOCALHOST === "true"
    if (!allowLocalhost && isLocalOrPrivateUrl(targetUrl)) {
      return NextResponse.json(
        {
          error:
            "Lokale oder private Adressen (z. B. localhost, 127.0.0.1, 10.x, 172.16–31.x, 192.168.x) sind für den Scan-Worker in der Regel nicht erreichbar. " +
            "Bitte eine öffentlich erreichbare URL verwenden. Für lokale Tests: COOKIE_SCAN_ALLOW_LOCALHOST=true setzen.",
        },
        { status: 400 }
      )
    }

    const consentMode =
      body.consentMode === "accepted" || body.consentMode === "none"
        ? body.consentMode
        : "none"
    const environment = typeof body.environment === "string" ? body.environment : "production"

    const { data: scan, error: insertErr } = await admin
      .from("cookie_scans")
      .insert({
        target_url: targetUrl,
        environment,
        status: "queued",
        consent_mode: consentMode,
        approval_status: "draft",
      })
      .select("id")
      .single()

    if (insertErr || !scan?.id) {
      console.error("Cookie scan job insert error:", insertErr)
      return NextResponse.json(
        { error: "Scan-Job konnte nicht angelegt werden." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: scan.id,
      status: "queued",
      message: "Scan-Job in Warteschlange. Ein Worker verarbeitet den Job.",
    })
  } catch (e) {
    console.error("Cookie scan run (job create) error:", e)
    return NextResponse.json(
      { error: "Scan-Job konnte nicht angelegt werden." },
      { status: 500 }
    )
  }
}
