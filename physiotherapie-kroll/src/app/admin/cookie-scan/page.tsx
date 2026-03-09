import { CookieScanAdminClient } from "@/components/admin/CookieScanAdminClient"

export const dynamic = "force-dynamic"

export default function CookieScanAdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Cookie-Scan</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Scans starten (Headless-Browser), Ergebnisse prüfen und freigeben. Die Cookie-Seite zeigt nur freigegebene Scans.
      </p>
      <CookieScanAdminClient />
    </div>
  )
}
