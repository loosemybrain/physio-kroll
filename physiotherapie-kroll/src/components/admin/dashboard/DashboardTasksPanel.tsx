import type { DashboardTask } from "@/lib/admin/dashboard"
import { ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

type DashboardTasksPanelProps = {
  tasks: DashboardTask[]
}

export function DashboardTasksPanel({ tasks }: DashboardTasksPanelProps) {
  return (
    <CardSurface className="gap-4 rounded-xl py-4">
      <div className="px-6">
        <h2 className="text-lg font-semibold text-foreground">Aufgaben</h2>
        <p className="text-sm text-muted-foreground">
          Operative Hinweise aus dem aktuellen Projektzustand.
        </p>
      </div>

      <div className="px-6 pb-6">
        {tasks.length === 0 ? (
          <Empty className="min-h-32 border-border/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListChecks className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Keine offenen Hinweise</EmptyTitle>
              <EmptyDescription>Aktuell sind keine operativen To-Dos ableitbar.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-xl border px-3 py-3 transition-colors hover:bg-muted/20 ${taskTone(task.level)}`}
                style={{ borderColor: taskBorderColor(task.level) }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${taskDotClass(task.level)}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{task.reason}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={taskBadgeClass(task.level)}>
                    {taskLevelLabel(task.level)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardSurface>
  )
}

function taskTone(level: DashboardTask["level"]) {
  if (level === "warning") return "bg-red-500/10"
  if (level === "hint") return "bg-orange-500/10"
  return "bg-blue-500/10"
}

function taskBorderColor(level: DashboardTask["level"]) {
  if (level === "warning") return "rgba(248, 113, 113, 0.45)"
  if (level === "hint") return "rgba(251, 191, 36, 0.4)"
  return "rgba(147, 197, 253, 0.35)"
}

function taskBadgeClass(level: DashboardTask["level"]) {
  if (level === "warning") return "border-red-400/45 bg-red-500/15 text-red-800 dark:text-red-200"
  if (level === "hint") return "border-amber-400/45 bg-amber-500/15 text-amber-800 dark:text-amber-200"
  return "border-blue-400/40 bg-blue-500/15 text-blue-800 dark:text-blue-200"
}

function taskLevelLabel(level: DashboardTask["level"]) {
  if (level === "warning") return "Warnung"
  if (level === "hint") return "Hinweis"
  return "Info"
}

function taskDotClass(level: DashboardTask["level"]) {
  if (level === "warning") return "bg-red-500"
  if (level === "hint") return "bg-amber-500"
  return "bg-blue-500"
}
