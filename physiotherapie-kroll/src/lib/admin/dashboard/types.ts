import type { FeatureStatus } from "@/lib/admin/features/types"

export type DashboardMetricUnavailable = {
  status: "unavailable"
  reason: string
}

export type DashboardMetricValue<T> = {
  status: "available"
  value: T
}

export type DashboardMetric<T> = DashboardMetricValue<T> | DashboardMetricUnavailable

export type DashboardQuickAction = {
  id: string
  label: string
  href: string
  source: string
}

export type DashboardTask = {
  id: string
  title: string
  severity: "low" | "medium" | "high" | "critical"
  category: "content" | "security" | "compliance" | "operations"
  reason: string
  href?: string
  ctaLabel?: string
}

export type DashboardHealthStatus = "healthy" | "info" | "warning" | "critical"

export type DashboardActivityItem = {
  id: string
  kind: "page" | "popup" | "media" | "user" | "cookie-scan"
  title: string
  subtitle: string
  timestamp: string
}

export type DashboardViewModel = {
  generatedAt: string
  health: {
    status: DashboardHealthStatus
    reasons: string[]
  }
  systemMaturity: number
  summary: {
    pagesTotal: number
    pagesPublished: number
    pagesDraft: number
    mediaAssetsTotal: number
    popupsActive: number
    usersTotal: number
    adminCapableUsers: number
    cookieScansTotal: number
  }
  content: {
    pages: {
      total: number
      published: number
      draft: number
      updatedLast7d: number
      withoutMetaDescription: DashboardMetric<number>
    }
    blocks: {
      total: number
    }
    popups: {
      total: number
      active: number
      scheduled: number
    }
    media: {
      assetsTotal: number
      foldersTotal: number
    }
    navigation: {
      configuredBrands: number
    }
    footer: {
      configuredBrands: number
    }
    siteSettings: {
      sansPreset: DashboardMetric<string>
      customFontsTotal: DashboardMetric<number>
    }
  }
  operations: {
    cookieScans: {
      total: number
      queued: number
      running: number
      failed: number
      successful: number
      approved: number
      lastScannedAt: string | null
    }
    loginAttempts: DashboardMetric<never>
    suspiciousAccess: DashboardMetric<never>
    backupStatus: DashboardMetric<never>
    uptime: DashboardMetric<never>
    workerHeartbeat: DashboardMetric<{
      status: "running" | "idle" | "stale" | "offline"
      workerId: string | null
      type: string | null
      lastSeenAt: string | null
    }>
  }
  users: {
    totalAuthUsers: number
    disabledProfiles: number
    adminCapable: number
    roles: {
      owner: number
      admin: number
      editor: number
      user: number
    }
  }
  security: {
    singleAdminRisk: boolean
    disabledProfiles: number
    adminCapable: number
    mfaCoverageNote: DashboardMetric<string>
    loginObservability: DashboardMetric<never>
    auditObservability: DashboardMetric<string>
    adminLoginsLast24h: DashboardMetric<number>
    failedAuthEventsLast24h: DashboardMetric<number>
    mfaEventsLast24h: DashboardMetric<number>
    lastSecurityEventAt: DashboardMetric<string | null>
    snapshotFreshness: DashboardMetric<"fresh" | "stale">
    totalAdminSnapshots: DashboardMetric<number>
    mfaEnabledAdmins: DashboardMetric<number>
    mfaVerifiedAdmins: DashboardMetric<number>
    staleSnapshots: DashboardMetric<number>
  }
  audit: {
    eventsLast24h: DashboardMetric<number>
    failuresLast24h: DashboardMetric<number>
    highOrCriticalLast24h: DashboardMetric<number>
    lastEventAt: DashboardMetric<string | null>
    recent: DashboardMetric<
      Array<{
        id: string
        eventType: string
        category: string
        severity: string
        outcome: string
        message: string
        createdAt: string
      }>
    >
  }
  compliance: {
    cookieScans: {
      pendingReview: number
      approved: number
      reviewed: number
    }
    legalPages: {
      required: number
      published: number
      missing: string[]
    }
    auditLog: DashboardMetric<string>
  }
  quickActions: DashboardQuickAction[]
  activity: DashboardActivityItem[]
  tasks: DashboardTask[]
  features: {
    audit: FeatureStatus
    loginObservability: FeatureStatus
    mfaCoverage: FeatureStatus
    cookieScan: FeatureStatus
    content: FeatureStatus
    users: FeatureStatus
  }
}
