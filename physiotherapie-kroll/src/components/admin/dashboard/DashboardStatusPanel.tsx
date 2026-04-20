import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"
import type { DashboardMetric } from "@/lib/admin/dashboard"

type DashboardStatusPanelProps = {
  queued: number
  running: number
  failed: number
  successful: number
  approved: number
  lastScannedAt: string | null
  loginAttempts: DashboardMetric<never>
  suspiciousAccess: DashboardMetric<never>
  backupStatus: DashboardMetric<never>
  uptime: DashboardMetric<never>
}

export function DashboardStatusPanel({
  queued,
  running,
  failed,
  successful,
  approved,
  lastScannedAt,
  loginAttempts,
  suspiciousAccess,
  backupStatus,
  uptime,
}: DashboardStatusPanelProps) {
  const hasIssue = failed > 0

  return (
    <CardSurface className="gap-4 rounded-2xl border-emerald-400/25 bg-linear-to-br from-emerald-500/10 via-card to-cyan-500/5">
      <div className="flex items-start justify-between gap-3 px-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Systemstatus</h2>
          <p className="text-sm text-muted-foreground">
            Betriebsdaten aus den aktuellen Cookie-Scan-Quellen.
          </p>
        </div>
        <Badge variant={hasIssue ? "destructive" : "secondary"}>
          {hasIssue ? "Pruefen" : "Stabil"}
        </Badge>
      </div>

      <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
        <StatusCell label="Queue" value={queued} tone="slate" />
        <StatusCell label="Running" value={running} tone="blue" />
        <StatusCell label="Failed" value={failed} tone="red" emphasized={failed > 0} />
        <StatusCell label="Success" value={successful} tone="green" />
        <StatusCell label="Approved" value={approved} tone="emerald" />
      </div>

      <div className="px-6">
        <div className="rounded-xl border border-border/30 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
          Letzter Scan: {lastScannedAt ? new Date(lastScannedAt).toLocaleString("de-DE") : "keine Scan-Historie"}
        </div>
      </div>

      <div className="space-y-2 px-6 pb-6">
        <UnavailableRow label="Login attempts" metric={loginAttempts} />
        <UnavailableRow label="Suspicious access" metric={suspiciousAccess} />
        <UnavailableRow label="Backup status" metric={backupStatus} />
        <UnavailableRow label="Uptime" metric={uptime} />
      </div>
    </CardSurface>
  )
}

function StatusCell({
  label,
  value,
  emphasized = false,
  tone = "slate",
}: {
  label: string
  value: number
  emphasized?: boolean
  tone?: "slate" | "blue" | "red" | "green" | "emerald"
}) {
  const toneClasses = {
    slate: "bg-muted/20",
    blue: "bg-blue-500/10",
    red: "bg-red-500/10",
    green: "bg-green-500/10",
    emerald: "bg-emerald-500/10",
  }
  const toneBorderColors = {
    slate: "rgba(148, 163, 184, 0.25)",
    blue: "rgba(147, 197, 253, 0.35)",
    red: "rgba(252, 165, 165, 0.35)",
    green: "rgba(134, 239, 172, 0.35)",
    emerald: "rgba(110, 231, 183, 0.35)",
  } as const
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${toneClasses[tone]}`}
      style={{ borderColor: toneBorderColors[tone] }}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={emphasized ? "mt-1 text-xl font-semibold text-destructive" : "mt-1 text-xl font-semibold text-foreground"}>
        {value}
      </p>
    </div>
  )
}

function UnavailableRow({
  label,
  metric,
}: {
  label: string
  metric: DashboardMetric<never>
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-xl border border-dashed bg-amber-500/10 px-3 py-2.5"
      style={{ borderColor: "rgba(252, 211, 77, 0.4)" }}
    >
      <p className="text-sm text-foreground">{label}</p>
      <Badge variant={metric.status === "unavailable" ? "outline" : "secondary"}>
        {metric.status === "unavailable" ? "unavailable" : "available"}
      </Badge>
    </div>
  )
}
