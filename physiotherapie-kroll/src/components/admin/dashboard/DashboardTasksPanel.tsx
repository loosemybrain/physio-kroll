"use client"

import type { DashboardTask } from "@/lib/admin/dashboard"
import Link from "next/link"
import type { MouseEvent } from "react"
import { ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import styles from "./DashboardTheme.module.css"

type DashboardTasksPanelProps = {
  tasks: DashboardTask[]
}

export function DashboardTasksPanel({ tasks }: DashboardTasksPanelProps) {
  const handleTaskLinkClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("/admin#")) return

    event.preventDefault()
    const id = href.split("#")[1]
    if (!id) return
    const target = document.getElementById(id)
    if (!target) return

    target.scrollIntoView({ behavior: "smooth", block: "start" })
    window.history.replaceState(null, "", `#${id}`)
    setTimeout(() => {
      target.focus({ preventScroll: true })
      target.classList.add("ring-2", "ring-primary/40", "ring-offset-2")
      window.setTimeout(() => {
        target.classList.remove("ring-2", "ring-primary/40", "ring-offset-2")
      }, 1400)
    }, 260)
  }

  return (
    <CardSurface className={`${styles.panelSurface} gap-4 rounded-xl py-4`}>
      <div className="px-6">
        <h2 className={`text-lg font-semibold ${styles.title}`}>Aufgaben</h2>
        <p className={`text-sm ${styles.textSoft}`}>
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
                className={`rounded-xl border px-3 py-3 transition-colors hover:bg-slate-50 ${taskTone(task.severity)}`}
                style={{ borderColor: taskBorderColor(task.severity) }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${taskDotClass(task.severity)}`} />
                    <div>
                      <p className={`text-sm font-medium ${styles.title}`}>{task.title}</p>
                      <p className={`mt-1 text-xs ${styles.text}`}>{task.reason}</p>
                      {task.href ? (
                        <Link
                          href={task.href}
                          onClick={(event) => handleTaskLinkClick(event, task.href!)}
                          className="mt-2 inline-flex text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {task.ctaLabel ?? "Jetzt bearbeiten"}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline" className={taskBadgeClass(task.severity)}>
                      {taskSeverityLabel(task.severity)}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300 bg-slate-100 text-[10px] uppercase tracking-wide text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                      {taskCategoryLabel(task.category)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardSurface>
  )
}

function taskTone(severity: DashboardTask["severity"]) {
  if (severity === "critical") return "bg-red-700/15"
  if (severity === "high") return "bg-red-500/10"
  if (severity === "medium") return styles.warningPanel
  return "bg-blue-50"
}

function taskBorderColor(severity: DashboardTask["severity"]) {
  if (severity === "critical") return "rgba(127, 29, 29, 0.55)"
  if (severity === "high") return "rgba(248, 113, 113, 0.45)"
  if (severity === "medium") return "rgba(249, 115, 22, 0.55)"
  return "rgba(147, 197, 253, 0.35)"
}

function taskBadgeClass(severity: DashboardTask["severity"]) {
  if (severity === "critical") return "border-red-900/70 bg-red-200 text-red-950 dark:border-red-500/70 dark:bg-red-900/50 dark:text-red-100"
  if (severity === "high") return "border-red-700/60 bg-red-100 text-red-900 dark:border-red-400/70 dark:bg-red-900/40 dark:text-red-100"
  if (severity === "medium") return "border-amber-700/60 bg-amber-100 text-amber-900 dark:border-amber-400/70 dark:bg-amber-900/40 dark:text-amber-100"
  return "border-blue-700/50 bg-blue-100 text-blue-900 dark:border-blue-400/70 dark:bg-blue-900/40 dark:text-blue-100"
}

function taskSeverityLabel(severity: DashboardTask["severity"]) {
  if (severity === "critical") return "Kritisch"
  if (severity === "high") return "Hoch"
  if (severity === "medium") return "Mittel"
  return "Niedrig"
}

function taskDotClass(severity: DashboardTask["severity"]) {
  if (severity === "critical") return "bg-red-900"
  if (severity === "high") return "bg-red-500"
  if (severity === "medium") return "bg-amber-500"
  return "bg-blue-500"
}

function taskCategoryLabel(category: DashboardTask["category"]) {
  if (category === "security") return "Security"
  if (category === "compliance") return "Compliance"
  if (category === "operations") return "Operations"
  return "Content"
}
