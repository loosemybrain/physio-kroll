/**
 * Cookie-Scan-Worker: Holt Jobs (status=queued) aus Supabase, führt Playwright-Scan aus,
 * schreibt Ergebnisse zurück. Läuft getrennt vom CMS (z. B. in Docker).
 */

import { createClient } from "@supabase/supabase-js"
import { runScan } from "./scan.js"

const POLL_INTERVAL_MS = Math.max(
  2000,
  parseInt(process.env.COOKIE_SCAN_POLL_INTERVAL ?? "5000", 10)
)
const ZOMBIE_AFTER_MS = 15 * 60 * 1000 // 15 Minuten
const WORKER_ID = process.env.COOKIE_SCAN_WORKER_ID ?? `worker-${process.pid}-${Date.now()}`

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})

type ScanRow = {
  id: string
  target_url: string
  environment: string
  consent_mode: string
  status: string
  started_at?: string | null
  created_at: string
  processing_token?: string | null
  processed_by?: string | null
}

/** Zombie-Bereinigung per RPC: running-Jobs älter als Schwellwert -> failed */
const ZOMBIE_STALE_MINUTES = Math.max(1, parseInt(process.env.COOKIE_SCAN_ZOMBIE_STALE_MINUTES ?? "15", 10))

async function cleanupZombies(): Promise<void> {
  const { data: count, error } = await supabase.rpc("cookie_scan_mark_zombies_failed", {
    p_stale_minutes: ZOMBIE_STALE_MINUTES,
  })
  if (error) {
    console.error("Zombie-RPC Fehler:", error)
    return
  }
  if (typeof count === "number" && count > 0) {
    console.warn(`Zombie-Bereinigung: ${count} Job(s) auf failed gesetzt`)
  }
}

/**
 * Atomare Job-Übernahme per RPC. Genau ein queued-Job wird übernommen; keine Race Condition.
 */
async function claimNextJob(): Promise<ScanRow | null> {
  const { data, error } = await supabase.rpc("cookie_scan_claim_next_job", {
    p_worker_id: WORKER_ID,
  })
  if (error) {
    console.error("Claim-RPC Fehler:", error)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  return (row as ScanRow) ?? null
}

/** Führt den Scan aus und schreibt Erfolg oder Fehler in die DB. */
async function processJob(job: ScanRow): Promise<void> {
  const { id, target_url, consent_mode } = job
  console.log(`Verarbeite Job ${id}: ${target_url}`)

  const result = await runScan(target_url, {
    consentMode: consent_mode === "accepted" ? "accepted" : "none",
    scanId: id,
  })

  const now = new Date().toISOString()

  if (result.error) {
    await supabase
      .from("cookie_scans")
      .update({
        status: "failed",
        error_message: result.error,
        scanned_at: now,
        finished_at: now,
      })
      .eq("id", id)
    console.warn(`Job ${id} fehlgeschlagen: ${result.error}`)
    return
  }

  if (result.cookies.length > 0) {
    const rows = result.cookies.map((c) => ({
      scan_id: id,
      name: c.name,
      domain: c.domain,
      path: c.path,
      category: c.category,
      purpose: c.purpose,
      duration: c.duration,
      secure: c.secure,
      http_only: c.http_only,
      same_site: c.same_site,
      provider: c.provider,
      source_url: c.source_url,
      is_third_party: c.is_third_party,
      notes: c.notes,
    }))
    const { error: insertErr } = await supabase.from("cookie_scan_items").insert(rows)
    if (insertErr) console.error("cookie_scan_items insert:", insertErr)
  }

  await supabase
    .from("cookie_scans")
    .update({
      status: "success",
      scanned_at: now,
      finished_at: now,
      error_message: null,
      raw_result_json: result.rawCookies ?? { cookies: result.cookies.length },
    })
    .eq("id", id)

  console.log(`Job ${id} erfolgreich: ${result.cookies.length} Cookies`)
}

async function pollOnce(): Promise<void> {
  const job = await claimNextJob()
  if (job) await processJob(job)
}

const ZOMBIE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // alle 5 Minuten

async function main(): Promise<void> {
  console.log("Cookie-Scan-Worker gestartet.", { workerId: WORKER_ID, pollIntervalMs: POLL_INTERVAL_MS })
  await cleanupZombies()
  setInterval(cleanupZombies, ZOMBIE_CLEANUP_INTERVAL_MS)

  const run = async () => {
    try {
      await pollOnce()
    } catch (e) {
      console.error("Poll-Zyklus Fehler:", e)
    }
    setTimeout(run, POLL_INTERVAL_MS)
  }
  setTimeout(run, POLL_INTERVAL_MS)
}

main()
