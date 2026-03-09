/**
 * Cookie-Scan-Worker: Holt Jobs (status=queued) aus Supabase, führt Playwright-Scan aus,
 * schreibt Ergebnisse zurück. Läuft getrennt vom CMS (z. B. in Docker).
 */
import { createClient } from "@supabase/supabase-js";
import { runScan } from "./scan.js";
const POLL_INTERVAL_MS = Math.max(2000, parseInt(process.env.COOKIE_SCAN_POLL_INTERVAL ?? "5000", 10));
const ZOMBIE_AFTER_MS = 15 * 60 * 1000; // 15 Minuten
const WORKER_ID = process.env.COOKIE_SCAN_WORKER_ID ?? `worker-${process.pid}-${Date.now()}`;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
});
/** Setzt alte running-Jobs auf failed (Zombie-Bereinigung). */
async function cleanupZombies() {
    const { data: running } = await supabase
        .from("cookie_scans")
        .select("id, started_at, created_at")
        .eq("status", "running");
    if (!running?.length)
        return;
    const cutoff = Date.now() - ZOMBIE_AFTER_MS;
    for (const row of running) {
        const ref = row.started_at ?? row.created_at;
        if (ref && new Date(ref).getTime() < cutoff) {
            await supabase
                .from("cookie_scans")
                .update({
                status: "failed",
                error_message: "Worker-Timeout (Zombie): Job wurde nicht abgeschlossen.",
                scanned_at: new Date().toISOString(),
                finished_at: new Date().toISOString(),
            })
                .eq("id", row.id);
            console.warn(`Zombie bereinigt: ${row.id}`);
        }
    }
}
/**
 * Nimmt einen queued-Job atomar an: nur wenn status noch 'queued' ist, wird auf 'running' gesetzt.
 * Gibt den übernommenen Scan zurück oder null.
 */
async function claimNextJob() {
    const { data: candidates } = await supabase
        .from("cookie_scans")
        .select("id, target_url, environment, consent_mode, status, created_at")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(1);
    const job = candidates?.[0];
    if (!job)
        return null;
    const { data: updated, error } = await supabase
        .from("cookie_scans")
        .update({
        status: "running",
        started_at: new Date().toISOString(),
        processed_by: WORKER_ID,
    })
        .eq("id", job.id)
        .eq("status", "queued")
        .select()
        .maybeSingle();
    if (error || !updated)
        return null;
    return updated;
}
/** Führt den Scan aus und schreibt Erfolg oder Fehler in die DB. */
async function processJob(job) {
    const { id, target_url, consent_mode } = job;
    console.log(`Verarbeite Job ${id}: ${target_url}`);
    const result = await runScan(target_url, {
        consentMode: consent_mode === "accepted" ? "accepted" : "none",
        scanId: id,
    });
    const now = new Date().toISOString();
    if (result.error) {
        await supabase
            .from("cookie_scans")
            .update({
            status: "failed",
            error_message: result.error,
            scanned_at: now,
            finished_at: now,
        })
            .eq("id", id);
        console.warn(`Job ${id} fehlgeschlagen: ${result.error}`);
        return;
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
        }));
        const { error: insertErr } = await supabase.from("cookie_scan_items").insert(rows);
        if (insertErr)
            console.error("cookie_scan_items insert:", insertErr);
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
        .eq("id", id);
    console.log(`Job ${id} erfolgreich: ${result.cookies.length} Cookies`);
}
async function pollOnce() {
    const job = await claimNextJob();
    if (job)
        await processJob(job);
}
const ZOMBIE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // alle 5 Minuten
async function main() {
    console.log("Cookie-Scan-Worker gestartet.", { workerId: WORKER_ID, pollIntervalMs: POLL_INTERVAL_MS });
    await cleanupZombies();
    setInterval(cleanupZombies, ZOMBIE_CLEANUP_INTERVAL_MS);
    const run = async () => {
        try {
            await pollOnce();
        }
        catch (e) {
            console.error("Poll-Zyklus Fehler:", e);
        }
        setTimeout(run, POLL_INTERVAL_MS);
    };
    setTimeout(run, POLL_INTERVAL_MS);
}
main();
