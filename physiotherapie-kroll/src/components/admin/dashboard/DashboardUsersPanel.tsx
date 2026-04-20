import { Badge } from "@/components/ui/badge"
import { CardSurface } from "@/components/ui/card"

type DashboardUsersPanelProps = {
  totalAuthUsers: number
  adminCapable: number
  disabledProfiles: number
  roleCounts: {
    owner: number
    admin: number
    editor: number
    user: number
  }
}

export function DashboardUsersPanel({
  totalAuthUsers,
  adminCapable,
  disabledProfiles,
  roleCounts,
}: DashboardUsersPanelProps) {
  return (
    <CardSurface className="gap-4 rounded-xl border-border/30 py-4">
      <div className="flex items-start justify-between gap-2 px-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Nutzerverwaltung</h2>
          <p className="text-sm text-muted-foreground">Daten aus auth.users, user_profiles und user_roles.</p>
        </div>
        <Badge variant="outline">{adminCapable} admin-faehig</Badge>
      </div>

      <div className="grid gap-3 px-6 pb-6 sm:grid-cols-3">
        <Metric label="Auth-User gesamt" value={totalAuthUsers} />
        <Metric label="Admin-faehig" value={adminCapable} />
        <Metric label="Deaktivierte Profile" value={disabledProfiles} isWarning={disabledProfiles > 0} />
      </div>

      <div className="grid gap-2 px-6 pb-6 sm:grid-cols-2">
        <RoleBadge label="Owner" value={roleCounts.owner} />
        <RoleBadge label="Admin" value={roleCounts.admin} />
        <RoleBadge label="Editor" value={roleCounts.editor} />
        <RoleBadge label="User" value={roleCounts.user} />
      </div>
    </CardSurface>
  )
}

function Metric({
  label,
  value,
  isWarning = false,
}: {
  label: string
  value: number
  isWarning?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-muted/20 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={isWarning ? "mt-1 text-xl font-semibold text-amber-600" : "mt-1 text-xl font-semibold text-foreground"}>
        {value}
      </p>
    </div>
  )
}

function RoleBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="secondary">{value}</Badge>
    </div>
  )
}
