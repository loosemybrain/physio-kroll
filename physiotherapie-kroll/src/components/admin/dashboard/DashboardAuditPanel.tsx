import type { DashboardMetric } from "@/lib/admin/dashboard"
import type { FeatureStatus } from "@/lib/admin/features/types"
import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"
import { DashboardFeatureStatusBadge, featureStatusLabel } from "./DashboardFeatureStatus"
import styles from "./DashboardTheme.module.css"

function softenAuditReason(reason: string): string {
  return reason
    .replace(/nicht verfuegbar/gi, "noch nicht Bestandteil der aktiven Ausbaustufe")
    .replace(/\bfehlt\b/gi, "ist als optionale Erweiterung nicht aktiviert")
    .replace(/nicht messbar/gi, "nicht aktiviert")
}

type AuditRecentItem = {
  id: string
  eventType: string
  category: string
  severity: string
  outcome: string
  message: string
  createdAt: string
}

type DashboardAuditPanelProps = {
  auditFeatureStatus: FeatureStatus
  eventsLast24h: DashboardMetric<number>
  failuresLast24h: DashboardMetric<number>
  highOrCriticalLast24h: DashboardMetric<number>
  lastEventAt: DashboardMetric<string | null>
  recent: DashboardMetric<AuditRecentItem[]>
}

function metricDisplayText<T>(label: string, metric: DashboardMetric<T>, auditFeatureStatus: FeatureStatus, formatter?: (value: T) => string) {
  if (metric.status !== "available") return featureStatusLabel(auditFeatureStatus)
  if (label === "Events 24h" && typeof metric.value === "number" && metric.value === 0) {
    return "Keine sicherheitsrelevanten Ereignisse festgestellt"
  }
  return formatter ? formatter(metric.value) : String(metric.value)
}

function auditFeatureContextLine(status: FeatureStatus): string | null {
  if (status === "inactive") return "Audit-Log ist vorbereitet, bisher wurden keine Events erfasst."
  if (status === "not_configured") return "Audit-Tracking ist vorbereitet, aber noch nicht aktiviert."
  if (status === "unavailable") return "Audit ist als optionale Erweiterung noch nicht Bestandteil der aktiven Ausbaustufe."
  return null
}

export function DashboardAuditPanel({
  auditFeatureStatus,
  eventsLast24h,
  failuresLast24h,
  highOrCriticalLast24h,
  lastEventAt,
  recent,
}: DashboardAuditPanelProps) {
  const contextLine = auditFeatureContextLine(auditFeatureStatus)

  return (
    <CardSurface className={`${styles.panelSurface} gap-4 rounded-xl py-4`}>
      <div className="px-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className={`text-lg font-semibold ${styles.title}`}>Audit</h2>
          <DashboardFeatureStatusBadge
            status={auditFeatureStatus}
            labelOverride={auditFeatureStatus === "unavailable" ? "nicht Bestandteil der aktiven Ausbaustufe" : undefined}
          />
        </div>
        <p className={`text-sm ${styles.textSoft}`}>
          Ereignisse aus `admin_audit_events` (24h + letzte Eintraege, nur serverseitig instrumentierte Flows).
        </p>
        {contextLine ? <p className={`mt-2 text-sm font-medium ${styles.text}`}>{contextLine}</p> : null}
      </div>

      <div className="space-y-2 px-6 pb-3">
        <MetricRow label="Events 24h" metric={eventsLast24h} auditFeatureStatus={auditFeatureStatus} />
        <MetricRow label="Failures 24h" metric={failuresLast24h} auditFeatureStatus={auditFeatureStatus} />
        <MetricRow label="High/Critical 24h" metric={highOrCriticalLast24h} auditFeatureStatus={auditFeatureStatus} />
        <MetricRow
          label="Letztes Event"
          metric={lastEventAt}
          auditFeatureStatus={auditFeatureStatus}
          formatter={(value) => (value ? new Date(value).toLocaleString("de-DE") : "kein Event")}
        />
      </div>

      <div className="space-y-2 px-6 pb-6">
        <h3 className={`text-sm font-semibold ${styles.title}`}>Letzte 5 Audit-Events</h3>
        {recent.status === "unavailable" ? (
          <div className={`${styles.warningPanel} rounded-lg border border-dashed px-3 py-2 text-xs`}>
            <p className={`font-medium ${styles.title}`}>
              {auditFeatureContextLine(auditFeatureStatus) ??
                (auditFeatureStatus === "active"
                  ? "Letzte Audit-Eintraege derzeit nicht lesbar."
                  : "Audit-Datenquelle nicht erreichbar.")}
            </p>
            <p className={`mt-1 ${styles.textSoft}`}>{softenAuditReason(recent.reason)}</p>
          </div>
        ) : recent.value.length === 0 ? (
          <p className={`${styles.mutedPanel} rounded-lg border px-3 py-2 text-xs ${styles.textSoft}`}>
            {auditFeatureStatus === "inactive"
              ? "Audit-Log ist vorbereitet, bisher wurden keine Events erfasst."
              : "Keine Audit-Events vorhanden."}
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.value.map((event) => (
              <li key={event.id} className={`${styles.mutedPanel} rounded-lg border px-3 py-2`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${styles.title}`}>{event.message}</p>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {event.severity}
                  </Badge>
                </div>
                <p className={`mt-1 text-xs ${styles.textSoft}`}>
                  {event.eventType} · {event.category} · {event.outcome} · {new Date(event.createdAt).toLocaleString("de-DE")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CardSurface>
  )
}

function MetricRow<T>({
  label,
  metric,
  auditFeatureStatus,
  formatter,
}: {
  label: string
  metric: DashboardMetric<T>
  auditFeatureStatus: FeatureStatus
  formatter?: (value: T) => string
}) {
  const text = metricDisplayText(label, metric, auditFeatureStatus, formatter)
  return (
    <div className={`${styles.mutedPanel} rounded-lg border px-3 py-2`}>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${styles.textSoft}`}>{label}</span>
        <span className={`text-sm font-semibold ${styles.title}`}>{text}</span>
      </div>
      {metric.status === "unavailable" ? (
        <p className={`mt-1 text-xs ${styles.textSoft}`}>{softenAuditReason(metric.reason)}</p>
      ) : null}
    </div>
  )
}
