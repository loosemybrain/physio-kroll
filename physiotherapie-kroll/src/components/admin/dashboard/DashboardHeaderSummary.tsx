import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

type DashboardHeaderSummaryProps = {
  generatedAt: string
  healthy: boolean
}

export function DashboardHeaderSummary({
  generatedAt,
  healthy,
}: DashboardHeaderSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Willkommen zurueck</h1>
        <p className="text-lg text-muted-foreground">
          Hier ist dein CMS-Dashboard - alle wichtigen Informationen auf einen Blick.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/30 bg-card px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={healthy ? "secondary" : "outline"}>{healthy ? "Stabil" : "Hinweis"}</Badge>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className={healthy ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-red-600"} />
            {healthy ? "Systemstatus stabil" : "Systemstatus pruefen"}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          letzte Aktualisierung: {new Date(generatedAt).toLocaleString("de-DE")}
        </span>
      </div>
    </div>
  )
}
