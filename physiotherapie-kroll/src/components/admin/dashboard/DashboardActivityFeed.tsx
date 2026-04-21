import type { DashboardActivityItem } from "@/lib/admin/dashboard/types"
import { BellRing, FileText, Image, ScanSearch, UserRound } from "lucide-react"
import { CardSurface } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

type DashboardActivityFeedProps = {
  items: DashboardActivityItem[]
}

export function DashboardActivityFeed({ items }: DashboardActivityFeedProps) {
  return (
    <CardSurface className="gap-4 rounded-xl py-4">
      <div className="px-6">
        <h2 className="text-lg font-semibold text-foreground">Aktivitaet</h2>
        <p className="text-sm text-muted-foreground">Letzte Content- und Systemaenderungen.</p>
      </div>

      <div className="px-6 pb-4">
        {items.length === 0 ? (
          <Empty className="min-h-40 border-border/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BellRing className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Noch keine Aktivitaeten</EmptyTitle>
              <EmptyDescription>Es liegen aktuell keine verwertbaren Aktivitaetseintraege vor.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 8).map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border bg-muted/10 px-3 py-2.5 transition-colors hover:bg-muted/20"
                style={{ borderColor: "rgba(148, 163, 184, 0.28)" }}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border ${activityToneClass(item.kind)}`}>
                    <ActivityIcon kind={item.kind} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground/80">
                  {new Date(item.timestamp).toLocaleString("de-DE")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CardSurface>
  )
}

function ActivityIcon({ kind }: { kind: DashboardActivityItem["kind"] }) {
  if (kind === "page") return <FileText className="h-3.5 w-3.5" />
  if (kind === "media") return <Image className="h-3.5 w-3.5" />
  if (kind === "popup") return <BellRing className="h-3.5 w-3.5" />
  if (kind === "user") return <UserRound className="h-3.5 w-3.5" />
  return <ScanSearch className="h-3.5 w-3.5" />
}

function activityToneClass(kind: DashboardActivityItem["kind"]) {
  if (kind === "page") return "border-blue-200/50 bg-blue-500/10 text-blue-700 dark:text-blue-300"
  if (kind === "user") return "border-emerald-200/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (kind === "popup") return "border-amber-200/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  if (kind === "cookie-scan") return "border-red-200/50 bg-red-500/10 text-red-700 dark:text-red-300"
  return "border-blue-200/50 bg-blue-500/10 text-blue-700 dark:text-blue-300"
}
