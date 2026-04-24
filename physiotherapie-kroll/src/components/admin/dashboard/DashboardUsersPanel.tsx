import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"
import type { DashboardMetric } from "@/lib/admin/dashboard"
import type { FeatureStatus } from "@/lib/admin/features/types"
import { DashboardFeatureStatusBadge } from "./DashboardFeatureStatus"
import styles from "./DashboardTheme.module.css"

type DashboardUsersPanelProps = {
  totalAuthUsers: number
  adminCapable: number
  disabledProfiles: number
  roleCounts: {
    owner: number
    admin: number
    editor: number
    user: number
  }
  security: {
    singleAdminRisk: boolean
    disabledProfiles: number
    adminCapable: number
    mfaCoverageNote: DashboardMetric<string>
    loginObservability: DashboardMetric<never>
    auditObservability: DashboardMetric<string>
    adminLoginsLast24h: DashboardMetric<number>
    failedAuthEventsLast24h: DashboardMetric<number>
    mfaEventsLast24h: DashboardMetric<number>
    lastSecurityEventAt: DashboardMetric<string | null>
  }
  featureAudit: FeatureStatus
  featureLoginObservability: FeatureStatus
  featureMfaCoverage: FeatureStatus
}

function softenDashboardReasonText(reason: string): string {
  return reason
    .replace(/nicht vollstaendig messbar/gi, "nicht aktiviert")
    .replace(/nicht messbar/gi, "nicht aktiviert")
    .replace(/nicht verfuegbar/gi, "optionale Erweiterung")
    .replace(/\bfehlt\b/gi, "keine Datenbasis vorhanden")
}

function featureProductStatusText(status: FeatureStatus): string {
  if (status === "active") return "aktiv"
  if (status === "not_configured") return "vorbereitet"
  if (status === "inactive") return "nicht aktiviert"
  return "nicht Bestandteil der aktiven Ausbaustufe"
}

export function DashboardUsersPanel({
  totalAuthUsers,
  adminCapable,
  disabledProfiles,
  roleCounts,
  security,
  featureAudit,
  featureLoginObservability,
  featureMfaCoverage,
}: DashboardUsersPanelProps) {
  return (
    <CardSurface className={`${styles.panelSurface} gap-4 rounded-xl py-4`}>
      <div className="flex flex-col items-start gap-2 px-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className={`text-lg font-semibold ${styles.title}`}>Nutzerverwaltung</h2>
          <p className={`text-sm ${styles.textSoft}`}>Daten aus auth.users, user_profiles und user_roles.</p>
        </div>
        <Badge variant="outline" className="shrink-0 whitespace-nowrap text-xs">
          {adminCapable} admin-faehig
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Auth-User gesamt" value={totalAuthUsers} />
        <Metric label="Admin-faehig" value={adminCapable} />
        <Metric label="Deaktivierte Profile" value={disabledProfiles} isWarning={disabledProfiles > 0} />
      </div>

      <div className="grid gap-2 px-6 pb-6 sm:grid-cols-2">
        <RoleBadge label="Owner" value={roleCounts.owner} />
        <RoleBadge label="Admin" value={roleCounts.admin} />
        <RoleBadge label="Editor" value={roleCounts.editor} />
        <RoleBadge label="User" value={roleCounts.user} />
      </div>

      <div className="space-y-2 border-t border-border/30 px-6 pb-6 pt-4">
        <h3 className={`text-sm font-semibold ${styles.title}`}>Security-Lage</h3>
        <SecurityRow label="Admin-faehige Nutzer" value={String(security.adminCapable)} />
        <SecurityRow label="Deaktivierte Profile" value={String(security.disabledProfiles)} />
        <SecurityRow label="Single-Admin-Risiko" value={security.singleAdminRisk ? "Ja" : "Nein"} warn={security.singleAdminRisk} />
        <MetricSecurityRow
          label="Admin-Zugaenge verifiziert (24h, serverseitig erfasst)"
          metric={security.adminLoginsLast24h}
          featureAudit={featureAudit}
        />
        <MetricSecurityRow
          label="Erfasste Auth-Flow-Fehler (24h)"
          metric={security.failedAuthEventsLast24h}
          featureAudit={featureAudit}
        />
        <MetricSecurityRow label="MFA Events (24h)" metric={security.mfaEventsLast24h} featureAudit={featureAudit} />
        <MetricSecurityRow
          label="Letztes Security-Event"
          metric={security.lastSecurityEventAt}
          featureAudit={featureAudit}
          formatter={(value) => (value ? new Date(value).toLocaleString("de-DE") : "kein Event")}
        />
        <ObservabilityRow label="MFA-Abdeckung" featureStatus={featureMfaCoverage} metric={security.mfaCoverageNote} />
        <ObservabilityRow label="Passwortzugriffs-Telemetrie" featureStatus={featureLoginObservability} metric={security.loginObservability} />
        <ObservabilityRow label="Audit-Log-Telemetrie" featureStatus={featureAudit} metric={security.auditObservability} />
      </div>
    </CardSurface>
  )
}

function MetricSecurityRow<T>({
  label,
  metric,
  featureAudit,
  formatter,
}: {
  label: string
  metric: DashboardMetric<T>
  featureAudit: FeatureStatus
  formatter?: (value: T) => string
}) {
  const text =
    metric.status === "available"
      ? formatter
        ? formatter(metric.value)
        : String(metric.value)
      : featureProductStatusText(featureAudit)
  return (
    <div className={`${styles.mutedPanel} rounded-lg border px-3 py-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm ${styles.textSoft}`}>{label}</span>
        <span className={`text-sm font-semibold ${styles.title}`}>{text}</span>
      </div>
      {metric.status === "unavailable" ? (
        <p className={`mt-1 text-xs ${styles.textSoft}`}>{softenDashboardReasonText(metric.reason)}</p>
      ) : null}
    </div>
  )
}

function Metric({
  label,
  value,
  isWarning = false,
}: {
  label: string
  value: number
  isWarning?: boolean
}) {
  return (
    <div className={`${styles.mutedPanel} rounded-xl border px-4 py-3`}>
      <p className={`text-xs leading-tight ${styles.textSoft}`}>{label}</p>
      <p className={isWarning ? `mt-1 text-xl font-semibold ${styles.accentText}` : `mt-1 text-xl font-semibold ${styles.title}`}>
        {value}
      </p>
    </div>
  )
}

function RoleBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${styles.mutedPanel} flex items-center justify-between rounded-lg border px-3 py-2`}>
      <span className={`text-sm ${styles.textSoft}`}>{label}</span>
      <Badge variant="secondary">{value}</Badge>
    </div>
  )
}

function SecurityRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`${styles.mutedPanel} flex items-center justify-between rounded-lg border px-3 py-2`}>
      <span className={`text-sm ${styles.textSoft}`}>{label}</span>
      <span className={warn ? "text-sm font-semibold text-red-800" : `text-sm font-semibold ${styles.title}`}>{value}</span>
    </div>
  )
}

function ObservabilityRow({
  label,
  featureStatus,
  metric,
}: {
  label: string
  featureStatus: FeatureStatus
  metric: DashboardMetric<string> | DashboardMetric<never>
}) {
  const available = metric.status === "available"
  return (
    <div className={`${styles.warningPanel} rounded-lg border border-dashed px-3 py-2`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-sm ${styles.title}`}>{label}</span>
        <DashboardFeatureStatusBadge
          status={available ? "active" : featureStatus}
          labelOverride={available ? undefined : featureProductStatusText(featureStatus)}
        />
      </div>
      {available && metric.status === "available" ? (
        <p className={`mt-1 text-xs ${styles.text}`}>
          {"value" in metric && typeof metric.value === "string"
            ? metric.value
            : "Belastbar aus vorhandenen Datenquellen ableitbar."}
        </p>
      ) : metric.status === "unavailable" ? (
        <p className={`mt-1 text-xs ${styles.text}`}>{softenDashboardReasonText(metric.reason)}</p>
      ) : null}
    </div>
  )
}
