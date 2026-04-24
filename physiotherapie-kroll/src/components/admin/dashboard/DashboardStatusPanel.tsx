import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"
import type { DashboardMetric } from "@/lib/admin/dashboard"
import type { FeatureStatus } from "@/lib/admin/features/types"
import { DashboardFeatureStatusBadge } from "./DashboardFeatureStatus"
import styles from "./DashboardTheme.module.css"

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
  loginObservability: FeatureStatus
  workerHeartbeat: DashboardMetric<{
    status: "running" | "idle" | "stale" | "offline"
    workerId: string | null
    type: string | null
    lastSeenAt: string | null
  }>
}

function metricToFeatureStatus(metric: DashboardMetric<never>): FeatureStatus {
  return metric.status === "unavailable" ? "inactive" : "active"
}

function softenInfrastructureReason(reason: string): string {
  return reason
    .replace(/nicht vollstaendig messbar/gi, "nicht aktiviert")
    .replace(/nicht messbar/gi, "nicht aktiviert")
    .replace(/\bfehlt\b/gi, "als optionale Erweiterung nicht aktiviert")
    .replace(/nicht verfuegbar/gi, "noch nicht Bestandteil der aktiven Ausbaustufe")
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
  loginObservability,
  workerHeartbeat,
}: DashboardStatusPanelProps) {
  const hasIssue = failed > 0

  return (
    <CardSurface className={`${styles.panelSurface} gap-4 rounded-2xl`}>
      <div className="flex items-start justify-between gap-3 px-6">
        <div>
          <h2 className={`text-base font-semibold ${styles.title}`}>Systemstatus</h2>
          <p className={`text-sm ${styles.textSoft}`}>
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
        <div className={`${styles.mutedPanel} rounded-xl border px-3 py-2.5 text-sm ${styles.text}`}>
          Letzter Scan: {lastScannedAt ? new Date(lastScannedAt).toLocaleString("de-DE") : "keine Scan-Historie"}
        </div>
      </div>

      <div className="space-y-2 px-6 pb-6">
        <OperationFeatureRow
          label="Passwortzugriffs-Fehlversuche"
          featureStatus={loginObservability}
          detail={loginAttempts.status === "unavailable" ? softenInfrastructureReason(loginAttempts.reason) : undefined}
          statusLabelOverride={
            loginObservability === "unavailable" ? "nicht Bestandteil der aktiven Ausbaustufe" : undefined
          }
        />
        <OperationFeatureRow
          label="Suspicious access"
          featureStatus={metricToFeatureStatus(suspiciousAccess)}
          detail={
            suspiciousAccess.status === "unavailable"
              ? "Optionale Infrastruktur-Erweiterung: noch nicht Bestandteil der aktiven Ausbaustufe."
              : undefined
          }
        />
        <OperationFeatureRow
          label="Backup status"
          featureStatus={metricToFeatureStatus(backupStatus)}
          detail={
            backupStatus.status === "unavailable"
              ? "Optionale Infrastruktur-Erweiterung: noch nicht Bestandteil der aktiven Ausbaustufe."
              : undefined
          }
        />
        <OperationFeatureRow
          label="Uptime"
          featureStatus={metricToFeatureStatus(uptime)}
          detail={
            uptime.status === "unavailable"
              ? "Optionale Infrastruktur-Erweiterung: noch nicht Bestandteil der aktiven Ausbaustufe."
              : undefined
          }
        />
        <OperationFeatureRow
          label="Worker heartbeat"
          featureStatus={
            workerHeartbeat.status !== "available"
              ? "inactive"
              : workerHeartbeat.value.status === "offline"
                ? "unavailable"
                : workerHeartbeat.value.status === "stale"
                  ? "not_configured"
                  : "active"
          }
          detail={
            workerHeartbeat.status !== "available"
              ? "Keine Heartbeat-Daten verfuegbar."
              : `Status: ${workerHeartbeat.value.status}${
                  workerHeartbeat.value.lastSeenAt
                    ? `, zuletzt gesehen ${new Date(workerHeartbeat.value.lastSeenAt).toLocaleString("de-DE")}`
                    : ""
                }`
          }
        />
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
      <p className={`text-xs uppercase tracking-wide ${styles.textSoft}`}>{label}</p>
      <p className={emphasized ? "mt-1 text-xl font-semibold text-destructive" : `mt-1 text-xl font-semibold ${styles.title}`}>
        {value}
      </p>
    </div>
  )
}

function OperationFeatureRow({
  label,
  featureStatus,
  detail,
  statusLabelOverride,
}: {
  label: string
  featureStatus: FeatureStatus
  detail?: string
  statusLabelOverride?: string
}) {
  return (
    <div className={`${styles.mutedPanel} rounded-xl border px-3 py-2.5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-medium ${styles.title}`}>{label}</p>
        <DashboardFeatureStatusBadge status={featureStatus} labelOverride={statusLabelOverride} />
      </div>
      {detail && featureStatus !== "active" ? <p className={`mt-1 text-xs ${styles.textSoft}`}>{detail}</p> : null}
    </div>
  )
}
