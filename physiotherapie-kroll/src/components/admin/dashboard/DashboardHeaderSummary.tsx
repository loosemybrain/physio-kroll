import { Badge } from "@/components/ui/badge"
import type { DashboardHealthStatus } from "@/lib/admin/dashboard"
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react"
import styles from "./DashboardTheme.module.css"

type DashboardHeaderSummaryProps = {
  generatedAt: string
  status: DashboardHealthStatus
  reasons: string[]
  systemMaturity: number
}

export function DashboardHeaderSummary({
  generatedAt,
  status,
  reasons,
  systemMaturity,
}: DashboardHeaderSummaryProps) {
  const topReasons = reasons.slice(0, 2)

  const badgeVariant =
    status === "critical" ? "destructive" : status === "warning" || status === "info" ? "outline" : "secondary"

  const badgeLabel =
    status === "critical"
      ? "Kritisch"
      : status === "warning"
        ? "Hinweis"
        : status === "info"
          ? "Info"
          : "Stabil"

  const statusLine =
    status === "critical"
      ? "Systemstatus kritisch"
      : status === "warning"
        ? "Systemstatus mit Konfigurationsbedarf"
        : status === "info"
          ? "Systemstatus informativ"
          : "Systemstatus stabil"

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className={`text-3xl font-bold tracking-tight md:text-4xl ${styles.title}`}>Willkommen zurueck</h1>
        <p className={`text-lg ${styles.text}`}>
          Hier ist dein CMS-Dashboard - alle wichtigen Informationen auf einen Blick.
        </p>
      </div>

      <div className={`${styles.panelSurface} flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5`}>
        <div className={`flex flex-wrap items-center gap-2 text-sm ${styles.text}`}>
          <Badge
            variant={badgeVariant}
            className={
              status === "info"
                ? "border-blue-400/70 bg-blue-50 text-blue-900 dark:border-blue-500/50 dark:bg-blue-950/40 dark:text-blue-100"
                : undefined
            }
          >
            {badgeLabel}
          </Badge>
          <span className="inline-flex items-center gap-1.5">
            {status === "critical" ? (
              <ShieldAlert className="h-4 w-4 text-red-700" />
            ) : status === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-orange-700" />
            ) : status === "info" ? (
              <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            {statusLine}
          </span>
        </div>
        <div className={`flex flex-col items-end gap-0.5 text-xs ${styles.textSoft}`}>
          <span>letzte Aktualisierung: {new Date(generatedAt).toLocaleString("de-DE")}</span>
          <span>System-Reifegrad: {systemMaturity}%</span>
        </div>
      </div>

      {topReasons.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {topReasons.map((reason) => (
            <Badge key={reason} variant="outline" className="max-w-full truncate text-xs">
              {reason}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
