import type { DashboardQuickAction } from "@/lib/admin/dashboard"
import { ArrowRight, BellPlus, FileText, FolderOpen, LayoutList, Users, Workflow } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"

type DashboardQuickActionsProps = {
  actions: DashboardQuickAction[]
}

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return (
    <CardSurface className="gap-4 rounded-xl py-4">
      <div className="px-6">
        <h2 className="text-lg font-semibold text-foreground">Schnellaktionen</h2>
        <p className="text-sm text-muted-foreground">Direkte Spruenge zu den wichtigsten Admin-Bereichen.</p>
      </div>

      <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
        {actions.map((action, index) => (
          <Link
            key={action.id}
            href={action.href}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 ${toneClass(index)}`}
            style={{ borderColor: toneBorderColor(index) }}
          >
            <span className="flex items-center gap-2.5">
              <span className={`rounded-md border p-1.5 ${toneIconClass(index)}`}>
                <QuickActionIcon id={action.id} />
              </span>
              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">{action.label}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {action.source}
                </Badge>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </CardSurface>
  )
}

function toneClass(index: number) {
  const tones = ["bg-blue-500/10", "bg-blue-500/10", "bg-blue-500/10", "bg-blue-500/10"]
  return tones[index % tones.length]
}

function toneIconClass(index: number) {
  const tones = [
    "border-blue-200/60 bg-blue-500/12 text-blue-700 dark:text-blue-300",
    "border-blue-200/60 bg-blue-500/12 text-blue-700 dark:text-blue-300",
    "border-blue-200/60 bg-blue-500/12 text-blue-700 dark:text-blue-300",
    "border-blue-200/60 bg-blue-500/12 text-blue-700 dark:text-blue-300",
  ]
  return tones[index % tones.length]
}

function toneBorderColor(index: number) {
  const tones = [
    "rgba(147, 197, 253, 0.35)",
    "rgba(147, 197, 253, 0.35)",
    "rgba(147, 197, 253, 0.35)",
    "rgba(147, 197, 253, 0.35)",
  ]
  return tones[index % tones.length]
}

function QuickActionIcon({ id }: { id: string }) {
  if (id === "create-page") return <FileText className="h-4 w-4" />
  if (id === "create-popup") return <BellPlus className="h-4 w-4" />
  if (id === "open-media") return <FolderOpen className="h-4 w-4" />
  if (id === "open-users") return <Users className="h-4 w-4" />
  if (id === "edit-navigation") return <Workflow className="h-4 w-4" />
  return <LayoutList className="h-4 w-4" />
}
