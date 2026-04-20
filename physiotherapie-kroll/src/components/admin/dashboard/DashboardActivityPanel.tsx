import { Activity, Clock3, FileClock, ShieldCheck } from "lucide-react"
import { CardSurface } from "@/components/ui/card"

type DashboardActivityPanelProps = {
  pagesUpdatedLast7d: number
  popupsActive: number
  scansRunning: number
}

export function DashboardActivityPanel({
  pagesUpdatedLast7d,
  popupsActive,
  scansRunning,
}: DashboardActivityPanelProps) {
  const rows = [
    {
      id: "pages-updated",
      icon: FileClock,
      label: "Seiten in den letzten 7 Tagen aktualisiert",
      value: pagesUpdatedLast7d,
      tone: "green",
    },
    {
      id: "popups-active",
      icon: Activity,
      label: "Aktive Popups",
      value: popupsActive,
      tone: "blue",
    },
    {
      id: "scan-running",
      icon: Clock3,
      label: "Laufende Cookie-Scans",
      value: scansRunning,
      tone: "orange",
    },
  ] as const

  return (
    <CardSurface className="gap-4 rounded-2xl border-indigo-400/25 bg-linear-to-br from-indigo-500/10 via-card to-sky-500/5">
      <div className="px-6">
        <h2 className="text-base font-semibold text-foreground">Aktivitaet</h2>
        <p className="text-sm text-muted-foreground">Aktuelle Bewegung in Content und Betrieb.</p>
      </div>

      <div className="space-y-2 px-6 pb-6">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${toneClass(row.tone)}`}
            style={{ borderColor: toneBorderColor(row.tone) }}
          >
            <div className="flex items-center gap-2.5">
              <row.icon className={`h-4 w-4 ${toneIconClass(row.tone)}`} />
              <span className="text-sm text-foreground">{row.label}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
        <div
          className="flex items-center gap-2 rounded-xl border bg-sky-500/10 px-3 py-2.5"
          style={{ borderColor: "rgba(125, 211, 252, 0.35)" }}
        >
          <ShieldCheck className="h-4 w-4 text-sky-700 dark:text-sky-300" />
          <span className="text-sm text-muted-foreground">Quelle: serverseitiger Dashboard-Loader</span>
        </div>
      </div>
    </CardSurface>
  )
}

function toneClass(tone: "green" | "blue" | "orange") {
  if (tone === "green") return "bg-emerald-500/10"
  if (tone === "blue") return "bg-blue-500/10"
  return "bg-orange-500/10"
}

function toneBorderColor(tone: "green" | "blue" | "orange") {
  if (tone === "green") return "rgba(110, 231, 183, 0.35)"
  if (tone === "blue") return "rgba(147, 197, 253, 0.35)"
  return "rgba(251, 191, 36, 0.35)"
}

function toneIconClass(tone: "green" | "blue" | "orange") {
  if (tone === "green") return "text-emerald-700 dark:text-emerald-300"
  if (tone === "blue") return "text-blue-700 dark:text-blue-300"
  return "text-orange-700 dark:text-orange-300"
}
