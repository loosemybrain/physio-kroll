import type { DashboardViewModel } from "@/lib/admin/dashboard"
import { DashboardActivityFeed } from "./DashboardActivityFeed"
import { DashboardCompliancePanel } from "./DashboardCompliancePanel"
import { DashboardContentPanel } from "./DashboardContentPanel"
import { DashboardHeaderSummary } from "./DashboardHeaderSummary"
import { DashboardQuickActions } from "./DashboardQuickActions"
import { DashboardStatsGrid } from "./DashboardStatsGrid"
import { DashboardTasksPanel } from "./DashboardTasksPanel"
import { DashboardUsersPanel } from "./DashboardUsersPanel"

type AdminDashboardContentProps = {
  data: DashboardViewModel
}

export function AdminDashboardContent({ data }: AdminDashboardContentProps) {
  return (
    <section className="container mx-auto max-w-7xl space-y-8 px-4 py-6 md:space-y-8 md:px-6 md:py-8">
      <DashboardHeaderSummary
        generatedAt={data.generatedAt}
        healthy={data.operations.cookieScans.failed === 0}
      />

      <div className="pt-3 md:pt-4">
        <DashboardStatsGrid
          pagesTotal={data.summary.pagesTotal}
          pagesPublished={data.summary.pagesPublished}
          pagesDraft={data.summary.pagesDraft}
          popupsActive={data.summary.popupsActive}
          mediaTotal={data.summary.mediaAssetsTotal}
          usersTotal={data.summary.usersTotal}
          cookieScansTotal={data.summary.cookieScansTotal}
        />
      </div>

      <div className="pt-4 md:pt-6">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DashboardActivityFeed items={data.activity} />
          </div>
          <div>
            <DashboardTasksPanel tasks={data.tasks} />
          </div>
        </div>
      </div>

      <div className="pt-3 md:pt-4">
        <DashboardQuickActions actions={data.quickActions} />
      </div>

      <div className="pt-4 md:pt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardContentPanel
            pagesTotal={data.content.pages.total}
            pagesPublished={data.content.pages.published}
            pagesDraft={data.content.pages.draft}
            pagesWithoutMetaDescription={data.content.pages.withoutMetaDescription}
            blocksTotal={data.content.blocks.total}
            popupsTotal={data.content.popups.total}
            popupsActive={data.content.popups.active}
            popupsScheduled={data.content.popups.scheduled}
            navigationConfiguredBrands={data.content.navigation.configuredBrands}
            footerConfiguredBrands={data.content.footer.configuredBrands}
          />
          <DashboardUsersPanel
            totalAuthUsers={data.users.totalAuthUsers}
            adminCapable={data.users.adminCapable}
            disabledProfiles={data.users.disabledProfiles}
            roleCounts={data.users.roles}
          />
          <DashboardCompliancePanel
            pendingReview={data.compliance.cookieScans.pendingReview}
            approved={data.compliance.cookieScans.approved}
            reviewed={data.compliance.cookieScans.reviewed}
            legalPages={data.compliance.legalPages}
            auditLog={data.compliance.auditLog}
          />
        </div>
      </div>
    </section>
  )
}
