import type { DashboardViewModel } from "@/lib/admin/dashboard"
import { DashboardActivityFeed } from "./DashboardActivityFeed"
import { DashboardAuditPanel } from "./DashboardAuditPanel"
import { DashboardCompliancePanel } from "./DashboardCompliancePanel"
import { DashboardContentPanel } from "./DashboardContentPanel"
import { DashboardHeaderSummary } from "./DashboardHeaderSummary"
import { DashboardQuickActions } from "./DashboardQuickActions"
import { DashboardStatsGrid } from "./DashboardStatsGrid"
import { DashboardStatusPanel } from "./DashboardStatusPanel"
import { DashboardTasksPanel } from "./DashboardTasksPanel"
import { DashboardUsersPanel } from "./DashboardUsersPanel"
import styles from "./DashboardTheme.module.css"

type AdminDashboardContentProps = {
  data: DashboardViewModel
}

export function AdminDashboardContent({ data }: AdminDashboardContentProps) {
  return (
    <section className={`${styles.dashboardShell} container mx-auto max-w-7xl space-y-8 px-4 py-6 md:space-y-8 md:px-6 md:py-8`}>
      <DashboardHeaderSummary
        generatedAt={data.generatedAt}
        status={data.health.status}
        reasons={data.health.reasons}
        systemMaturity={data.systemMaturity}
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

      <div className="pt-4 md:pt-6">
        <DashboardStatusPanel
          queued={data.operations.cookieScans.queued}
          running={data.operations.cookieScans.running}
          failed={data.operations.cookieScans.failed}
          successful={data.operations.cookieScans.successful}
          approved={data.operations.cookieScans.approved}
          lastScannedAt={data.operations.cookieScans.lastScannedAt}
          loginAttempts={data.operations.loginAttempts}
          suspiciousAccess={data.operations.suspiciousAccess}
          backupStatus={data.operations.backupStatus}
          uptime={data.operations.uptime}
          loginObservability={data.features.loginObservability}
          workerHeartbeat={data.operations.workerHeartbeat}
        />
      </div>

      <div className="pt-3 md:pt-4">
        <DashboardQuickActions actions={data.quickActions} />
      </div>

      <div className="pt-4 md:pt-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
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
          </div>
          <div
            id="dashboard-security"
            tabIndex={-1}
            className="scroll-mt-28 rounded-xl transition-colors duration-300 target:ring-2 target:ring-primary/30 target:ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            <DashboardUsersPanel
              totalAuthUsers={data.users.totalAuthUsers}
              adminCapable={data.users.adminCapable}
              disabledProfiles={data.users.disabledProfiles}
              roleCounts={data.users.roles}
              security={data.security}
              featureAudit={data.features.audit}
              featureLoginObservability={data.features.loginObservability}
              featureMfaCoverage={data.features.mfaCoverage}
            />
          </div>
          <DashboardCompliancePanel
            pendingReview={data.compliance.cookieScans.pendingReview}
            approved={data.compliance.cookieScans.approved}
            reviewed={data.compliance.cookieScans.reviewed}
            legalPages={data.compliance.legalPages}
            auditLog={data.compliance.auditLog}
            auditEventsLast24h={data.audit.eventsLast24h}
            auditFailuresLast24h={data.audit.failuresLast24h}
          />
          <div
            id="dashboard-audit"
            tabIndex={-1}
            className="scroll-mt-28 rounded-xl transition-colors duration-300 target:ring-2 target:ring-primary/30 target:ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            <DashboardAuditPanel
              auditFeatureStatus={data.features.audit}
              eventsLast24h={data.audit.eventsLast24h}
              failuresLast24h={data.audit.failuresLast24h}
              highOrCriticalLast24h={data.audit.highOrCriticalLast24h}
              lastEventAt={data.audit.lastEventAt}
              recent={data.audit.recent}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
