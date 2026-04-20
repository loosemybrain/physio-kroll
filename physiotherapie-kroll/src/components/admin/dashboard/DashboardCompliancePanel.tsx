import type { DashboardMetric } from "@/lib/admin/dashboard"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"

type DashboardCompliancePanelProps = {
  pendingReview: number
  approved: number
  reviewed: number
  legalPages: {
    required: number
    published: number
    missing: string[]
  }
  auditLog: DashboardMetric<never>
}

export function DashboardCompliancePanel({
  pendingReview,
  approved,
  reviewed,
  legalPages,
  auditLog,
}: DashboardCompliancePanelProps) {
  return (
    <CardSurface className="gap-4 rounded-xl border-purple-400/25 bg-linear-to-br from-purple-500/10 via-card to-emerald-500/5 py-4">
      <div className="px-6">
        <h2 className="text-lg font-semibold text-foreground">Compliance</h2>
        <p className="text-sm text-muted-foreground">Cookie-Freigaben plus Audit-Log-Verfuegbarkeit.</p>
      </div>

      <div className="space-y-3 px-6 pb-6">
        <Row label="Scans mit pending review" value={pendingReview} tone="amber" />
        <Row label="Scans approved" value={approved} positive tone="emerald" />
        <Row label="Scans reviewed" value={reviewed} tone="blue" />
        <Row
          label="Legal-Seiten (published)"
          value={legalPages.published}
          detail={`von ${legalPages.required}`}
          positive={legalPages.published >= legalPages.required}
          tone="violet"
        />

        {legalPages.missing.length > 0 && (
          <div
            className="rounded-xl border px-3 py-2 text-sm font-medium"
            style={{
              borderColor: "rgba(217, 119, 6, 0.65)",
              backgroundColor: "#fffbeb",
              color: "#7c2d12",
            }}
          >
            Fehlende Legal-Seiten: {legalPages.missing.join(", ")}
          </div>
        )}

        {auditLog.status === "unavailable" ? (
          <div
            className="flex items-start gap-2 rounded-xl border px-3 py-2"
            style={{
              borderColor: "rgba(217, 119, 6, 0.65)",
              backgroundColor: "#fffbeb",
              color: "#7c2d12",
            }}
          >
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "#b45309" }}
            />
            <div className="text-sm">
              <p
                className="font-semibold tracking-tight"
                style={{ color: "#7c2d12" }}
              >
                Audit-Log derzeit nicht angebunden
              </p>
              <p
                className="mt-0.5 font-medium"
                style={{ color: "#92400e" }}
              >
                {auditLog.reason}
              </p>
            </div>
          </div>
        ) : (
          <Badge variant="secondary" className="w-fit">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Audit-Log verfuegbar
          </Badge>
        )}
      </div>
    </CardSurface>
  )
}

function Row({
  label,
  value,
  positive = false,
  detail,
  tone = "slate",
}: {
  label: string
  value: number
  positive?: boolean
  detail?: string
  tone?: "slate" | "amber" | "emerald" | "blue" | "violet"
}) {
  const toneClasses = {
    slate: "bg-muted/20",
    amber: "bg-amber-500/10",
    emerald: "bg-emerald-500/10",
    blue: "bg-blue-500/10",
    violet: "bg-violet-500/10",
  }
  const toneBorderColors = {
    slate: "rgba(148, 163, 184, 0.25)",
    amber: "rgba(252, 211, 77, 0.4)",
    emerald: "rgba(110, 231, 183, 0.35)",
    blue: "rgba(147, 197, 253, 0.35)",
    violet: "rgba(196, 181, 253, 0.35)",
  }
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${toneClasses[tone]}`}
      style={{ borderColor: toneBorderColors[tone] }}
    >
      <span className="text-sm text-foreground">{label}</span>
      <div className="text-right">
        <span className={positive ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-foreground"}>
          {value}
        </span>
        {detail ? <p className="text-[11px] text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  )
}
