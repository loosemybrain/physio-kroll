import { getSupabasePublic } from "@/lib/supabase/serverPublic"

type ScanItem = {
  id: string
  name: string
  domain: string
  path: string
  category: string | null
  purpose: string | null
  duration: string | null
  secure: boolean
  httpOnly: boolean
  sameSite: string | null
  provider: string | null
  isThirdParty: boolean
}

type Scan = {
  id: string
  targetUrl: string
  scannedAt: string | null
  updatedAt: string
}

/**
 * Server Component: Lädt den letzten freigegebenen Cookie-Scan und rendert die Tabelle.
 * Für die Cookie-Legal-Seite. Fallback, wenn kein Scan vorhanden.
 */
export async function CookieScanTable() {
  const supabase = await getSupabasePublic()

  const { data: scanRow } = await supabase
    .from("cookie_scans")
    .select("id, target_url, scanned_at, created_at")
    .eq("approval_status", "approved")
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!scanRow) {
    return (
      <section className="pt-8 pb-12">
        <p className="text-muted-foreground text-sm">
          Es ist noch kein freigegebener Cookie-Scan vorhanden. Nach einem Scan im Admin-Bereich und Freigabe wird hier die Tabelle angezeigt.
        </p>
      </section>
    )
  }

  const { data: items } = await supabase
    .from("cookie_scan_items")
    .select("id, name, domain, path, category, purpose, duration, secure, http_only, same_site, provider, is_third_party")
    .eq("scan_id", scanRow.id)
    .order("name")

  const scan: Scan = {
    id: scanRow.id,
    targetUrl: scanRow.target_url,
    scannedAt: scanRow.scanned_at,
    updatedAt: scanRow.scanned_at ?? scanRow.created_at ?? "",
  }

  const scanItems: ScanItem[] = (items ?? []).map((it) => ({
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
  }))

  const standLabel = scan.scannedAt
    ? formatStand(new Date(scan.scannedAt))
    : scan.updatedAt
      ? formatStand(new Date(scan.updatedAt))
      : "—"

  return (
    <section className="pt-8 pb-12">
      <h2 className="text-xl font-semibold mb-2">Gefundene Cookies</h2>
      <p className="text-muted-foreground text-sm mb-4">
        Stand: {standLabel}
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Anbieter / Domain</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Zweck</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Kategorie</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Laufzeit</th>
              <th className="px-4 py-3 text-left font-medium text-foreground">Typ / SameSite</th>
            </tr>
          </thead>
          <tbody>
            {scanItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Keine Cookies in diesem Scan erfasst.
                </td>
              </tr>
            ) : (
              scanItems.map((it, idx) => (
                <tr
                  key={it.id}
                  className={`border-b border-border/50 last:border-b-0 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{it.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{it.provider || it.domain || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{it.purpose || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{it.category || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{it.duration || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {[it.httpOnly && "HttpOnly", it.sameSite && `SameSite=${it.sameSite}`].filter(Boolean).join(", ") || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatStand(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${day}.${month}.${year}, ${hours}:${minutes}`
}
