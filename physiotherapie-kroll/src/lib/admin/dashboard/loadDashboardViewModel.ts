import "server-only"

import { countOperationalAdminCapableUsers } from "@/lib/server/adminUsers"
import { getSupabaseAdmin } from "@/lib/supabase/admin.server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { DashboardActivityItem, DashboardMetric, DashboardTask, DashboardViewModel } from "./types"

const UNAVAILABLE_LOGIN_ATTEMPTS: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Keine belastbare Datenquelle fuer Login Attempts im Projekt angebunden.",
}

const UNAVAILABLE_SUSPICIOUS_ACCESS: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Kein Suspicious-Access-Feed/Detection-Store im Projekt vorhanden.",
}

const UNAVAILABLE_AUDIT_LOG: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Kein Audit-Log-Store fuer Admin-Aktionen angebunden.",
}

const UNAVAILABLE_BACKUP_STATUS: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Kein Backup-Status aus Infrastruktur in der App verfuegbar.",
}

const UNAVAILABLE_UPTIME: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Kein Uptime-Monitoring in App-Datenquelle integriert.",
}

async function countAuthUsers(admin: SupabaseClient): Promise<number> {
  let total = 0
  let page = 1

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 })
    if (error) throw error
    const users = data?.users ?? []
    total += users.length
    if (users.length < 500) break
    page += 1
    if (page > 200) break
  }

  return total
}

async function countRows(
  admin: SupabaseClient,
  table: string,
  apply?: (query: any) => any
): Promise<number> {
  let query = admin.from(table).select("*", { count: "exact", head: true })
  if (apply) {
    query = apply(query)
  }
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function countDistinctUsersByRole(admin: SupabaseClient, roleId: string): Promise<number> {
  const { data, error } = await admin.from("user_roles").select("user_id").eq("role_id", roleId)
  if (error) throw error
  return new Set((data ?? []).map((row: { user_id: string }) => row.user_id)).size
}

async function loadCookieLastScannedAt(admin: SupabaseClient): Promise<string | null> {
  const { data, error } = await admin
    .from("cookie_scans")
    .select("scanned_at, created_at")
    .order("scanned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error

  const row = data as { scanned_at?: string | null; created_at?: string | null } | null
  return row?.scanned_at ?? row?.created_at ?? null
}

async function loadPagesWithoutMetaDescriptionMetric(admin: SupabaseClient): Promise<DashboardMetric<number>> {
  try {
    const { data, error } = await admin.from("pages").select("id, meta_description")
    if (error) throw error
    const pages = (data ?? []) as Array<{ meta_description?: string | null }>
    const withoutMetaDescription = pages.filter(
      (page) => typeof page.meta_description !== "string" || page.meta_description.trim().length === 0
    ).length
    return { status: "available", value: withoutMetaDescription }
  } catch {
    return {
      status: "unavailable",
      reason: "meta_description ist im aktuellen Schema nicht stabil verfuegbar.",
    }
  }
}

async function loadLegalPagesOverview(
  admin: SupabaseClient
): Promise<{ required: number; published: number; missing: string[] }> {
  const requiredSubtypes = ["imprint", "privacy", "cookies"] as const
  const { data, error } = await admin
    .from("pages")
    .select("page_type, page_subtype, status")
    .eq("page_type", "legal")
    .eq("status", "published")

  if (error) {
    return { required: requiredSubtypes.length, published: 0, missing: [...requiredSubtypes] }
  }

  const subtypeSet = new Set(
    ((data ?? []) as Array<{ page_subtype?: string | null }>).map((row) => String(row.page_subtype ?? ""))
  )
  const missing = requiredSubtypes.filter((subtype) => !subtypeSet.has(subtype))

  return {
    required: requiredSubtypes.length,
    published: requiredSubtypes.length - missing.length,
    missing: [...missing],
  }
}

async function loadSansPresetMetric(admin: SupabaseClient): Promise<DashboardMetric<string>> {
  try {
    const { data, error } = await admin
      .from("site_settings")
      .select("sans_preset")
      .eq("id", "singleton")
      .maybeSingle()

    if (error) throw error

    const preset = (data as { sans_preset?: unknown } | null)?.sans_preset
    return {
      status: "available",
      value: typeof preset === "string" && preset.length > 0 ? preset : "inter-local",
    }
  } catch {
    return {
      status: "unavailable",
      reason: "site_settings.sans_preset aktuell nicht belastbar lesbar.",
    }
  }
}

async function loadCustomFontsMetric(admin: SupabaseClient): Promise<DashboardMetric<number>> {
  try {
    const total = await countRows(admin, "custom_fonts")
    return { status: "available", value: total }
  } catch {
    return {
      status: "unavailable",
      reason: "custom_fonts nicht konsistent verfuegbar (Schema-Drift/Fehlerfall).",
    }
  }
}

async function loadActivity(admin: SupabaseClient): Promise<DashboardActivityItem[]> {
  const [pages, popups, mediaAssets, users, cookieScans] = await Promise.all([
    admin
      .from("pages")
      .select("id, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(3),
    admin
      .from("popups")
      .select("id, name, is_active, updated_at")
      .order("updated_at", { ascending: false })
      .limit(2),
    admin
      .from("media_assets")
      .select("id, filename, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(2),
    admin
      .from("user_profiles")
      .select("user_id, display_name, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(2),
    admin
      .from("cookie_scans")
      .select("id, status, created_at, scanned_at")
      .order("created_at", { ascending: false })
      .limit(2),
  ])

  const events: DashboardActivityItem[] = []

  for (const row of (pages.data ?? []) as Array<{ id: string; title: string | null; status: string; updated_at: string }>) {
    events.push({
      id: `page-${row.id}`,
      kind: "page",
      title: row.status === "published" ? "Seite aktualisiert (published)" : "Seite aktualisiert (draft)",
      subtitle: row.title ?? "Untitled",
      timestamp: row.updated_at,
    })
  }

  for (const row of (popups.data ?? []) as Array<{ id: string; name: string | null; is_active: boolean; updated_at: string }>) {
    events.push({
      id: `popup-${row.id}`,
      kind: "popup",
      title: row.is_active ? "Popup aktiv" : "Popup inaktiv",
      subtitle: row.name ?? "Popup",
      timestamp: row.updated_at,
    })
  }

  for (const row of (mediaAssets.data ?? []) as Array<{ id: string; filename: string | null; created_at: string; updated_at: string }>) {
    events.push({
      id: `media-${row.id}`,
      kind: "media",
      title: "Medium hinzugefuegt/aktualisiert",
      subtitle: row.filename ?? "Datei",
      timestamp: row.updated_at ?? row.created_at,
    })
  }

  for (const row of (users.data ?? []) as Array<{ user_id: string; display_name: string | null; created_at: string; updated_at: string }>) {
    events.push({
      id: `user-${row.user_id}`,
      kind: "user",
      title: "Nutzerprofil aktualisiert",
      subtitle: row.display_name ?? row.user_id,
      timestamp: row.updated_at ?? row.created_at,
    })
  }

  for (const row of (cookieScans.data ?? []) as Array<{ id: string; status: string; created_at: string; scanned_at: string | null }>) {
    events.push({
      id: `scan-${row.id}`,
      kind: "cookie-scan",
      title: `Cookie-Scan: ${row.status}`,
      subtitle: "cookie_scans",
      timestamp: row.scanned_at ?? row.created_at,
    })
  }

  return events
    .filter((event) => Boolean(event.timestamp))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)
}

function buildTasks(model: DashboardViewModel): DashboardTask[] {
  const tasks: DashboardTask[] = []

  if (model.content.pages.draft > 0) {
    tasks.push({
      id: "draft-pages-present",
      title: `${model.content.pages.draft} Seiten sind noch nicht veroeffentlicht`,
      level: "hint",
      reason: `${model.content.pages.draft} Seiten sind noch im Draft-Status.`,
    })
  }

  if (model.content.pages.withoutMetaDescription.status === "available" && model.content.pages.withoutMetaDescription.value > 0) {
    tasks.push({
      id: "pages-missing-meta-description",
      title: "Meta-Descriptions nachziehen",
      level: "info",
      reason: `${model.content.pages.withoutMetaDescription.value} Seiten ohne Meta-Description gefunden.`,
    })
  }

  if (model.compliance.legalPages.missing.length > 0) {
    tasks.push({
      id: "missing-legal-pages",
      title: "Rechtliche Seiten vervollstaendigen",
      level: "warning",
      reason: `Fehlende Legal-Subtypes: ${model.compliance.legalPages.missing.join(", ")}.`,
    })
  }

  if (model.operations.cookieScans.total === 0) {
    tasks.push({
      id: "no-cookie-scans",
      title: "Ersten Cookie-Scan durchfuehren",
      level: "warning",
      reason: "Es sind aktuell keine Cookie-Scans vorhanden.",
    })
  } else if (model.operations.cookieScans.successful === 0) {
    tasks.push({
      id: "no-successful-cookie-scans",
      title: "Cookie-Scan-Qualitaet pruefen",
      level: "hint",
      reason: "Es gibt Scans, aber keinen erfolgreichen Durchlauf.",
    })
  }

  if (model.content.popups.total > 0 && model.content.popups.active === 0) {
    tasks.push({
      id: "popups-inactive",
      title: "Inaktive Popups ueberpruefen",
      level: "hint",
      reason: `${model.content.popups.total} Popups vorhanden, aber kein Popup ist aktiv.`,
    })
  }

  if (model.content.navigation.configuredBrands === 0) {
    tasks.push({
      id: "navigation-empty",
      title: "Navigation konfigurieren",
      level: "warning",
      reason: "Keine Navigationseintraege fuer Brands gefunden.",
    })
  }

  if (model.content.footer.configuredBrands === 0) {
    tasks.push({
      id: "footer-empty",
      title: "Footer konfigurieren",
      level: "warning",
      reason: "Keine Footer-Konfiguration fuer Brands gefunden.",
    })
  }

  if (model.operations.cookieScans.failed > 0) {
    tasks.push({
      id: "failed-cookie-scans",
      title: "Fehlgeschlagene Cookie-Scans analysieren",
      level: "warning",
      reason: `${model.operations.cookieScans.failed} Scan(s) im Status failed.`,
    })
  }

  if (model.users.roles.owner + model.users.roles.admin <= 1) {
    tasks.push({
      id: "single-admin-risk",
      title: "Nur ein Admin/Owner aktiv",
      level: "warning",
      reason: "Ein zweiter administrativer Account reduziert Ausfallrisiko.",
    })
  }

  if (model.activity.length > 0) {
    const latestTs = new Date(model.activity[0].timestamp).getTime()
    const daysSinceUpdate = Math.floor((Date.now() - latestTs) / (24 * 60 * 60 * 1000))
    if (Number.isFinite(daysSinceUpdate) && daysSinceUpdate >= 7) {
      tasks.push({
        id: "low-content-activity",
        title: "Wenig Content-Aktivitaet",
        level: "hint",
        reason: `Seit ${daysSinceUpdate} Tagen keine sichtbare Aktualisierung.`,
      })
    }
  }

  if (model.operations.loginAttempts.status === "unavailable") {
    // Intentionally omitted from operational task list until a real source exists.
  }

  if (model.compliance.auditLog.status === "unavailable") {
    // Intentionally omitted from operational task list until a real source exists.
  }

  if (model.content.siteSettings.customFontsTotal.status === "unavailable") {
    // Intentionally omitted: not core for dashboard operation.
  }

  return tasks
}

/**
 * Zentraler, serverseitiger Dashboard-Loader.
 * - Nur reale Quellen werden aggregiert (pages, blocks, popups, media_assets/media_folders, navigation, footer, cookie_scans, user_roles/user_profiles, site_settings/custom_fonts).
 * - Nicht vorhandene Security/Operations-Quellen werden explizit als `unavailable` modelliert.
 */
export async function loadDashboardViewModel(): Promise<DashboardViewModel> {
  const admin = await getSupabaseAdmin()
  const now = new Date()
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const nowIso = now.toISOString()

  const [
    pagesTotal,
    pagesPublished,
    pagesDraft,
    pagesUpdatedLast7d,
    blocksTotal,
    popupsTotal,
    popupsActive,
    popupsScheduled,
    mediaAssetsTotal,
    mediaFoldersTotal,
    navigationConfiguredBrands,
    footerConfiguredBrands,
    cookieScansTotal,
    cookieQueued,
    cookieRunning,
    cookieFailed,
    cookieSuccessful,
    cookieApproved,
    cookiePendingReview,
    cookieReviewed,
    cookieLastScannedAt,
    totalAuthUsers,
    disabledProfiles,
    adminCapable,
    ownerRoleUsers,
    adminRoleUsers,
    editorRoleUsers,
    userRoleUsers,
    sansPreset,
    customFontsTotal,
    pagesWithoutMetaDescription,
    legalPages,
    activity,
  ] = await Promise.all([
    countRows(admin, "pages"),
    countRows(admin, "pages", (q) => q.eq("status", "published")),
    countRows(admin, "pages", (q) => q.eq("status", "draft")),
    countRows(admin, "pages", (q) => q.gte("updated_at", sevenDaysAgoIso)),
    countRows(admin, "blocks"),
    countRows(admin, "popups"),
    countRows(admin, "popups", (q) => q.eq("is_active", true)),
    countRows(admin, "popups", (q) => q.eq("is_active", true).gt("starts_at", nowIso)),
    countRows(admin, "media_assets"),
    countRows(admin, "media_folders"),
    countRows(admin, "navigation"),
    countRows(admin, "footer"),
    countRows(admin, "cookie_scans"),
    countRows(admin, "cookie_scans", (q) => q.eq("status", "queued")),
    countRows(admin, "cookie_scans", (q) => q.eq("status", "running")),
    countRows(admin, "cookie_scans", (q) => q.eq("status", "failed")),
    countRows(admin, "cookie_scans", (q) => q.eq("status", "success")),
    countRows(admin, "cookie_scans", (q) => q.eq("approval_status", "approved")),
    countRows(admin, "cookie_scans", (q) => q.eq("approval_status", "draft")),
    countRows(admin, "cookie_scans", (q) => q.eq("approval_status", "reviewed")),
    loadCookieLastScannedAt(admin),
    countAuthUsers(admin),
    countRows(admin, "user_profiles", (q) => q.eq("status", "disabled")),
    countOperationalAdminCapableUsers(admin),
    countDistinctUsersByRole(admin, "owner"),
    countDistinctUsersByRole(admin, "admin"),
    countDistinctUsersByRole(admin, "editor"),
    countDistinctUsersByRole(admin, "user"),
    loadSansPresetMetric(admin),
    loadCustomFontsMetric(admin),
    loadPagesWithoutMetaDescriptionMetric(admin),
    loadLegalPagesOverview(admin),
    loadActivity(admin),
  ])

  const model: DashboardViewModel = {
    generatedAt: nowIso,
    summary: {
      pagesTotal,
      pagesPublished,
      pagesDraft,
      mediaAssetsTotal,
      popupsActive,
      usersTotal: totalAuthUsers,
      adminCapableUsers: adminCapable,
      cookieScansTotal,
    },
    content: {
      pages: {
        total: pagesTotal,
        published: pagesPublished,
        draft: pagesDraft,
        updatedLast7d: pagesUpdatedLast7d,
        withoutMetaDescription: pagesWithoutMetaDescription,
      },
      blocks: {
        total: blocksTotal,
      },
      popups: {
        total: popupsTotal,
        active: popupsActive,
        scheduled: popupsScheduled,
      },
      media: {
        assetsTotal: mediaAssetsTotal,
        foldersTotal: mediaFoldersTotal,
      },
      navigation: {
        configuredBrands: navigationConfiguredBrands,
      },
      footer: {
        configuredBrands: footerConfiguredBrands,
      },
      siteSettings: {
        sansPreset,
        customFontsTotal,
      },
    },
    operations: {
      cookieScans: {
        total: cookieScansTotal,
        queued: cookieQueued,
        running: cookieRunning,
        failed: cookieFailed,
        successful: cookieSuccessful,
        approved: cookieApproved,
        lastScannedAt: cookieLastScannedAt,
      },
      loginAttempts: UNAVAILABLE_LOGIN_ATTEMPTS,
      suspiciousAccess: UNAVAILABLE_SUSPICIOUS_ACCESS,
      backupStatus: UNAVAILABLE_BACKUP_STATUS,
      uptime: UNAVAILABLE_UPTIME,
    },
    users: {
      totalAuthUsers,
      disabledProfiles,
      adminCapable,
      roles: {
        owner: ownerRoleUsers,
        admin: adminRoleUsers,
        editor: editorRoleUsers,
        user: userRoleUsers,
      },
    },
    compliance: {
      cookieScans: {
        pendingReview: cookiePendingReview,
        approved: cookieApproved,
        reviewed: cookieReviewed,
      },
      legalPages,
      auditLog: UNAVAILABLE_AUDIT_LOG,
    },
    quickActions: [
      { id: "create-page", label: "Seite erstellen", href: "/admin/pages", source: "pages" },
      { id: "create-popup", label: "Popup erstellen", href: "/admin/popups", source: "popups" },
      { id: "open-media", label: "Medien oeffnen", href: "/admin/media", source: "media_assets/media_folders" },
      { id: "edit-navigation", label: "Navigation bearbeiten", href: "/admin/navigation", source: "navigation" },
      { id: "edit-footer", label: "Footer bearbeiten", href: "/admin/footer", source: "footer" },
      { id: "open-users", label: "Benutzerverwaltung oeffnen", href: "/admin/users", source: "user_profiles/user_roles" },
    ],
    activity,
    tasks: [],
  }

  model.tasks = buildTasks(model)
  return model
}
