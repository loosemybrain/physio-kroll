import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { runCookieScan, assignScanId } from "@/lib/cookie-scan/runCookieScan"

/** Prüft, ob die Ziel-URL localhost/private ist (von Server-Runtime ggf. nicht erreichbar). */
function isLocalOrPrivateUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true
    if (host.startsWith("192.168.") || host.startsWith("10.") || host.endsWith(".local")) return true
    return false
  } catch {
    return false
  }
}

/**
 * Setzt einen Scan auf "failed", wenn er noch "running" ist. Loggt Fehler, wirft nicht.
 * Garantiert: Kein dauerhaft hängender running-Status.
 */
async function ensureScanNotStuckRunning(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  scanId: string,
  errorMessage: string
): Promise<void> {
  try {
    await supabase
      .from("cookie_scans")
      .update({
        status: "failed",
        error_message: errorMessage,
        scanned_at: new Date().toISOString(),
      })
      .eq("id", scanId)
      .eq("status", "running")
  } catch (e) {
    console.error("Cookie scan: ensureScanNotStuckRunning failed", e)
  }
}

/**
 * POST /api/admin/cookie-scan/run
 * Startet einen Cookie-Scan (headless browser). Nur für Admins.
 * Body: { targetUrl: string, consentMode?: "none" | "accepted", environment?: string }
 */
export async function POST(request: Request) {
  let scanId: string | null = null
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null

  try {
    supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    if (isLocalOrPrivateUrl(targetUrl)) {
      return NextResponse.json(
        {
          error:
            "localhost/127.0.0.1 oder private Adressen sind von dieser Runtime oft nicht erreichbar. Bitte eine öffentlich erreichbare URL verwenden oder den Scan lokal ausführen.",
        },
        { status: 400 }
      )
    }

    const consentMode = body.consentMode === "accepted" ? "accepted" : "none"
    const environment = typeof body.environment === "string" ? body.environment : "production"

    const { data: scan, error: insertErr } = await supabase
      .from("cookie_scans")
      .insert({
        target_url: targetUrl,
        environment,
        status: "running",
        consent_mode: consentMode,
        approval_status: "draft",
      })
      .select("id")
      .single()

    if (insertErr || !scan?.id) {
      console.error("Cookie scan insert error:", insertErr)
      return NextResponse.json({ error: insertErr?.message ?? "Scan konnte nicht angelegt werden" }, { status: 500 })
    }

    scanId = scan.id

    let cookies: Awaited<ReturnType<typeof runCookieScan>>["cookies"] = []
    let scanError: string | undefined

    try {
      const result = await runCookieScan(targetUrl, { consentMode, environment })
      cookies = result.cookies ?? []
      scanError = result.error
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e)
      scanError =
        raw.toLowerCase().includes("chromium") || raw.toLowerCase().includes("executable")
          ? 'Chromium für Playwright nicht installiert. Bitte "npm run install:cookie-scan" ausführen.'
          : "Cookie-Scan ist fehlgeschlagen. Details siehe Server-Log."
      console.error("Cookie scan run threw:", e)
    }

    const items = assignScanId(cookies, scan.id)

    if (scanError) {
      await supabase
        .from("cookie_scans")
        .update({ status: "failed", error_message: scanError, scanned_at: new Date().toISOString() })
        .eq("id", scan.id)
      return NextResponse.json({
        id: scan.id,
        status: "failed",
        error: scanError,
        itemsCount: 0,
      })
    }

    if (items.length > 0) {
      const rows = items.map((it) => ({
        scan_id: it.scan_id,
        name: it.name,
        domain: it.domain,
        path: it.path,
        category: it.category ?? null,
        purpose: it.purpose ?? null,
        duration: it.duration ?? null,
        secure: it.secure,
        http_only: it.http_only,
        same_site: it.same_site ?? null,
        provider: it.provider ?? null,
        source_url: it.source_url ?? null,
        is_third_party: it.is_third_party,
        notes: it.notes ?? null,
      }))
      const { error: itemsErr } = await supabase.from("cookie_scan_items").insert(rows)
      if (itemsErr) {
        console.error("Cookie scan items insert error:", itemsErr)
      }
    }

    await supabase
      .from("cookie_scans")
      .update({
        status: "success",
        scanned_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", scan.id)

    return NextResponse.json({
      id: scan.id,
      status: "success",
      itemsCount: items.length,
    })
  } catch (e) {
    console.error("Cookie scan run error:", e)
    // Garantiert: running-Scans werden auf failed gesetzt, hängen nicht dauerhaft.
    if (scanId && supabase) {
      await ensureScanNotStuckRunning(
        supabase,
        scanId,
        "Scan abgebrochen oder unerwarteter Fehler. Siehe Server-Log."
      )
    }
    return NextResponse.json(
      { error: "Cookie-Scan konnte nicht ausgeführt werden. Siehe Server-Log." },
      { status: 500 }
    )
  }
}
