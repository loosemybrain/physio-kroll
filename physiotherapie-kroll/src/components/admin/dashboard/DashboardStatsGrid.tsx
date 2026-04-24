import { BellRing, FileCheck2, FileText, Image, ShieldCheck, Users } from "lucide-react"
import { CardSurface } from "@/components/ui/card"
import styles from "./DashboardTheme.module.css"

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
      detail: styles.text,
    },
    green: {
      surface: "py-4 hover:-translate-y-0.5 hover:border-emerald-300/45 hover:shadow-md transition-all",
      icon: "border-emerald-200/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      detail: styles.text,
    },
    orange: {
      surface: "py-4 hover:-translate-y-0.5 hover:border-amber-300/45 hover:shadow-md transition-all",
      icon: styles.accentIcon,
      detail: styles.accentText,
    },
    red: {
      surface: "py-4 hover:-translate-y-0.5 hover:border-red-300/45 hover:shadow-md transition-all",
      icon: "border-red-200/60 bg-red-500/15 text-red-700 dark:text-red-300",
      detail: styles.text,
    },
  }

  return (
    <CardSurface className={`${styles.panelSurface} gap-2 rounded-xl py-4 ${toneClasses[tone].surface}`}>
      <div className="flex items-start justify-between px-4">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${toneClasses[tone].icon}`}>
          {icon}
        </div>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${trendToneClass(trend.tone)}`}>
          {trend.label}
        </span>
      </div>
      <div className="px-4 pb-1">
        <p className={`text-xs font-medium uppercase tracking-wide ${styles.textSoft}`}>{label}</p>
        <p className={`mt-1 text-3xl font-bold tracking-tight ${styles.title}`}>{value}</p>
        <p className={`mt-1 text-xs leading-5 ${toneClasses[tone].detail}`}>{detail}</p>
      </div>
    </CardSurface>
  )
}

function trendToneClass(tone: "blue" | "green" | "orange" | "red") {
  if (tone === "green") return "border border-emerald-200 bg-emerald-100 text-emerald-800"
  if (tone === "orange") return styles.accentBadge
  if (tone === "red") return "border border-red-200 bg-red-100 text-red-800"
  return "border border-blue-200 bg-blue-100 text-blue-800"
}
