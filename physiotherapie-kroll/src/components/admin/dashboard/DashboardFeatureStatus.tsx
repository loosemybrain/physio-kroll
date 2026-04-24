import type { FeatureStatus } from "@/lib/admin/features/types"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<FeatureStatus, string> = {
  active: "aktiv",
  inactive: "nicht aktiviert",
  not_configured: "vorbereitet",
  unavailable: "nicht verfuegbar",
}

const STATUS_CLASS: Record<FeatureStatus, string> = {
  active: "border-emerald-300/80 bg-emerald-50 text-emerald-900",
  inactive: "border-slate-300/80 bg-slate-100 text-slate-800",
  not_configured: "border-amber-400/80 bg-amber-50 text-amber-950",
  unavailable: "border-red-300/80 bg-red-50 text-red-900",
}

export function featureStatusLabel(status: FeatureStatus): string {
  return STATUS_LABEL[status]
}

export function DashboardFeatureStatusBadge({
  status,
  className,
  labelOverride,
}: {
  status: FeatureStatus
  className?: string
  labelOverride?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        STATUS_CLASS[status],
        className,
      )}
    >
      {labelOverride ?? STATUS_LABEL[status]}
    </span>
  )
}
