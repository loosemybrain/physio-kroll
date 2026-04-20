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
  level: "info" | "hint" | "warning"
  reason: string
}

export type DashboardActivityItem = {
  id: string
  kind: "page" | "popup" | "media" | "user" | "cookie-scan"
  title: string
  subtitle: string
  timestamp: string
}

export type DashboardViewModel = {
  generatedAt: string
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
    auditLog: DashboardMetric<never>
  }
  quickActions: DashboardQuickAction[]
  activity: DashboardActivityItem[]
  tasks: DashboardTask[]
}
