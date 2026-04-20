import { BellRing, FileCheck2, FileText, Image, ShieldCheck, Users } from "lucide-react"
import { CardSurface } from "@/components/ui/card"

type DashboardStatsGridProps = {
  pagesTotal: number
  pagesDraft: number
  popupsActive: number
  mediaTotal: number
  usersTotal: number
  cookieScansTotal: number
  pagesPublished: number
}

export function DashboardStatsGrid({
  pagesTotal,
  pagesDraft,
  popupsActive,
  mediaTotal,
  usersTotal,
  cookieScansTotal,
  pagesPublished,
}: DashboardStatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        icon={<FileText className="h-4 w-4" />}
        label="Seiten gesamt"
        value={pagesTotal}
        detail={`${pagesPublished} veroeffentlicht`}
        tone="blue"
        trend={{ label: "Core", tone: "blue" }}
      />
      <StatCard
        icon={<FileCheck2 className="h-4 w-4" />}
        label="Entwuerfe"
        value={pagesDraft}
        detail="noch nicht veroeffentlicht"
        tone="orange"
        trend={{ label: pagesDraft > 0 ? "Hinweis" : "OK", tone: pagesDraft > 0 ? "orange" : "green" }}
      />
      <StatCard
        icon={<Image className="h-4 w-4" />}
        label="Medien"
        value={mediaTotal}
        detail="media_assets"
        tone="blue"
        trend={{ label: "Info", tone: "blue" }}
      />
      <StatCard
        icon={<Users className="h-4 w-4" />}
        label="Nutzer gesamt"
        value={usersTotal}
        tone="green"
        detail="auth.users"
        trend={{ label: "OK", tone: "green" }}
      />
      <StatCard
        icon={<BellRing className="h-4 w-4" />}
        label="Aktive Popups"
        value={popupsActive}
        detail="derzeit ausgespielt"
        tone="orange"
        trend={{ label: "Aktiv", tone: "orange" }}
      />
      <StatCard
        icon={<ShieldCheck className="h-4 w-4" />}
        label="Cookie-Scans"
        value={cookieScansTotal}
        detail="gesamt"
        tone="blue"
        trend={{ label: "Info", tone: "blue" }}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
  trend,
}: {
  icon: React.ReactNode
  label: string
  value: number
  detail: string
  tone: "blue" | "green" | "orange" | "red"
  trend: { label: string; tone: "blue" | "green" | "orange" | "red" }
}) {
  const toneClasses = {
    blue: {
      surface: "py-4 hover:-translate-y-0.5 hover:border-blue-300/45 hover:shadow-md transition-all",
      icon: "border-blue-200/60 bg-blue-500/15 text-blue-700 dark:text-blue-300",
      detail: "text-blue-700/70 dark:text-blue-300/80",
    },
    green: {
      surface: "py-4 hover:-translate-y-0.5 hover:border-emerald-300/45 hover:shadow-md transition-all",
      icon: "border-emerald-200/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      detail: "text-emerald-700/70 dark:text-emerald-300/80",
    },
    orange: {
      surface: "py-4 hover:-translate-y-0.5 hover:border-amber-300/45 hover:shadow-md transition-all",
      icon: "border-amber-200/60 bg-amber-500/15 text-amber-700 dark:text-amber-300",
      detail: "text-amber-700/70 dark:text-amber-300/80",
    },
    red: {
      surface: "py-4 hover:-translate-y-0.5 hover:border-red-300/45 hover:shadow-md transition-all",
      icon: "border-red-200/60 bg-red-500/15 text-red-700 dark:text-red-300",
      detail: "text-red-700/70 dark:text-red-300/80",
    },
  }

  return (
    <CardSurface className={`gap-2 rounded-xl py-4 ${toneClasses[tone].surface}`}>
      <div className="flex items-start justify-between px-4">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${toneClasses[tone].icon}`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold ${trendToneClass(trend.tone)}`}>{trend.label}</span>
      </div>
      <div className="px-4 pb-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className={`mt-1 text-xs ${toneClasses[tone].detail}`}>{detail}</p>
      </div>
    </CardSurface>
  )
}

function trendToneClass(tone: "blue" | "green" | "orange" | "red") {
  if (tone === "green") return "text-emerald-600"
  if (tone === "orange") return "text-amber-600"
  if (tone === "red") return "text-red-600"
  return "text-blue-600"
}
