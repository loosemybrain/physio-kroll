import { AdminSidebar, AdminTopbar } from '@/components/admin/AdminLayout'
import { DashboardStats } from '@/components/admin/StatCard'
import { ActivityFeed, SecurityOverview, RecentLeads } from '@/components/admin/AdminComponents'
import { QuickActions, TasksList } from '@/components/admin/QuickActions'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Layout */}
      <AdminSidebar />
      <AdminTopbar />

      {/* Main Content */}
      <main className="pt-24 lg:pl-64 pb-12">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-1">Willkommen zurück, Sebastian</h1>
            <p className="text-muted-foreground">Hier ist dein CMS-Dashboard - alle wichtigen Informationen auf einen Blick.</p>
          </div>

          {/* Status Section */}
          <div className="mb-8 p-4 bg-card border border-border rounded-2xl flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Systemstatus</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-muted-foreground">Alle Systeme online • Letztes Backup vor 2 Stunden</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-700">Live</span>
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <DashboardStats />
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>
            <div>
              <SecurityOverview />
            </div>
          </div>

          {/* Leads Table */}
          <div className="mb-8">
            <RecentLeads />
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-2 gap-8">
            <QuickActions />
            <TasksList />
          </div>
        </div>
      </main>
    </div>
  )
}
