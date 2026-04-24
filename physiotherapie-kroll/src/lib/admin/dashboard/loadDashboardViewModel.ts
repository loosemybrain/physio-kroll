import "server-only"

import { featureRegistry } from "@/lib/admin/features/featureRegistry"
import type { FeatureStatus } from "@/lib/admin/features/types"
import { countOperationalAdminCapableUsers } from "@/lib/server/adminUsers"
import { loadSecuritySnapshotMetrics, loadWorkerRuntimeStatus } from "@/lib/server/db/adminWrites"
import { getSupabaseAdmin } from "@/lib/supabase/admin.server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  DashboardActivityItem,
  DashboardHealthStatus,
  DashboardMetric,
  DashboardTask,
  DashboardViewModel,
} from "./types"

const UNAVAILABLE_LOGIN_ATTEMPTS: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Passwort-Login-Fehlversuche sind im aktuellen Flow serverseitig nicht vollstaendig messbar.",
}

const UNAVAILABLE_SUSPICIOUS_ACCESS: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Kein Suspicious-Access-Feed/Detection-Store im Projekt vorhanden.",
}

const UNAVAILABLE_BACKUP_STATUS: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Kein Backup-Status aus Infrastruktur in der App verfuegbar.",
}

const UNAVAILABLE_UPTIME: DashboardMetric<never> = {
  status: "unavailable",
  reason: "Kein Uptime-Monitoring in App-Datenquelle integriert.",
}

const UNAVAILABLE_MFA_COVERAGE_NOTE: DashboardMetric<string> = {
  status: "unavailable",
  reason: "MFA-Abdeckung ist aus den vorhandenen Tabellen derzeit nicht belastbar ableitbar.",
}

type AuditSnapshot = {
  audit: DashboardViewModel["audit"]
  securityMetrics: {
    adminLoginsLast24h: DashboardMetric<number>
    failedAuthEventsLast24h: DashboardMetric<number>
    mfaEventsLast24h: DashboardMetric<number>
    lastSecurityEventAt: DashboardMetric<string | null>
  }
  observabilityAvailable: boolean
  mfaVerifyFailuresLast24h: number | null
  totalAuditEventsCount: number
}

function unavailableMetric<T>(reason: string): DashboardMetric<T> {
  return { status: "unavailable", reason }
}

function resolveFeatureStatus({
  available,
  hasData,
  required,
}: {
  available: boolean
  hasData: boolean
  required: boolean
}): FeatureStatus {
  if (!available) return "unavailable"
  if (!hasData && required) return "not_configured"
  if (!hasData && !required) return "inactive"
  return "active"
}

function calculateSystemMaturity(features: DashboardViewModel["features"]): number {
  const keys = Object.keys(features) as Array<keyof typeof featureRegistry>
  const coreKeys = keys.filter((key) => featureRegistry[key].category === "core")
  const optionalKeys = keys.filter((key) => featureRegistry[key].category !== "core")

  const coreTotalWeight = coreKeys.reduce((sum, key) => sum + featureRegistry[key].weight, 0)
  const coreActiveWeight = coreKeys.reduce(
    (sum, key) => sum + (features[key] === "active" ? featureRegistry[key].weight : 0),
    0
  )
  const optionalTotalWeight = optionalKeys.reduce((sum, key) => sum + featureRegistry[key].weight, 0)
  const optionalActiveWeight = optionalKeys.reduce(
    (sum, key) => sum + (features[key] === "active" ? featureRegistry[key].weight : 0),
    0
  )

  const coreScore = coreTotalWeight === 0 ? 100 : (coreActiveWeight / coreTotalWeight) * 100
  const optionalScore = optionalTotalWeight === 0 ? 100 : (optionalActiveWeight / optionalTotalWeight) * 100

  return Math.round(coreScore * 0.7 + optionalScore * 0.3)
}

function featureTaskSeverity(required: boolean, status: FeatureStatus): DashboardTask["severity"] | null {
  if (status === "active") return null
  if (required && status === "unavailable") return "critical"
  if (required && status === "not_configured") return "high"
  if (!required && status === "unavailable") return "low"
  if (!required && status === "inactive") return "low"
  if (!required && status === "not_configured") return "low"
  return null
}

function appendFeatureGapTasks(tasks: DashboardTask[], model: DashboardViewModel) {
  const entries: Array<{ key: keyof typeof featureRegistry; href?: string; ctaLabel?: string }> = [
    { key: "audit", href: "/admin#dashboard-audit", ctaLabel: "Audit anzeigen" },
    { key: "loginObservability" },
    { key: "mfaCoverage", href: "/admin/security/mfa", ctaLabel: "MFA verwalten" },
    { key: "cookieScan", href: "/admin/cookie-scan", ctaLabel: "Cookie-Scan starten" },
    { key: "content", href: "/admin/pages", ctaLabel: "Content anlegen" },
    { key: "users", href: "/admin/users", ctaLabel: "Benutzer prüfen" },
  ]
  const groupedOptionalSecurityKeys: Array<keyof typeof featureRegistry> = ["audit", "loginObservability", "mfaCoverage"]
  const groupedMissingOptionalSecurity = groupedOptionalSecurityKeys.filter((key) => {
    const status = model.features[key]
    return status === "inactive" || status === "unavailable" || status === "not_configured"
  })

  if (groupedMissingOptionalSecurity.length >= 2) {
    const hasUnavailable = groupedMissingOptionalSecurity.some((key) => model.features[key] === "unavailable")
    const hasNotConfigured = groupedMissingOptionalSecurity.some((key) => model.features[key] === "not_configured")
    tasks.push({
      id: "grouped-optional-security-features",
      title: "Erweiterte Sicherheitsfunktionen nicht aktiviert",
      severity: hasUnavailable ? "medium" : hasNotConfigured ? "medium" : "low",
      category: "security",
      reason:
        "Mehrere optionale Sicherheitsfunktionen sind noch nicht Bestandteil der aktiven Ausbaustufe (Audit, Login-Observability, MFA-Abdeckung).",
      href: "/admin#dashboard-security",
      ctaLabel: "Sicherheitsstatus anzeigen",
    })
  }

  for (const { key, href, ctaLabel } of entries) {
    if (groupedMissingOptionalSecurity.length >= 2 && groupedOptionalSecurityKeys.includes(key)) {
      continue
    }
    const status = model.features[key]
    const registryEntry = featureRegistry[key]
    const required = registryEntry.required
    let severity = featureTaskSeverity(required, status)
    if (!required && status === "unavailable" && registryEntry.category === "security") {
      severity = "medium"
    }
    if (!severity) continue

    const label = registryEntry.label
    const productStateLabel = registryEntry.productStateLabel
    const categoryByFeature: Record<keyof typeof featureRegistry, DashboardTask["category"]> = {
      audit: "operations",
      loginObservability: "security",
      mfaCoverage: "security",
      cookieScan: "operations",
      content: "content",
      users: "operations",
    }
    const reasonByStatus: Record<FeatureStatus, string> = {
      active: "",
      inactive: `${label}: nicht aktiviert (${productStateLabel}).`,
      not_configured: required
        ? `${label}: Pflichtfunktion ist noch nicht konfiguriert.`
        : `${label}: ${productStateLabel}, noch nicht Bestandteil der aktiven Ausbaustufe.`,
      unavailable: required
        ? `${label}: Pflichtfunktion ist derzeit nicht verfuegbar.`
        : `${label}: ${productStateLabel}, noch nicht Bestandteil der aktiven Ausbaustufe.`,
    }

    tasks.push({
      id: `feature-gap-${key}`,
      title:
        status === "unavailable" && required
          ? `${label}: derzeit nicht verfuegbar`
          : status === "unavailable"
            ? `${label}: ${productStateLabel}`
          : status === "not_configured"
            ? `${label}: nicht konfiguriert`
            : `${label}: nicht aktiviert`,
      severity,
      category: categoryByFeature[key],
      reason: reasonByStatus[status],
      href,
      ctaLabel,
    })
  }
}

async function loadAuditSnapshot(admin: SupabaseClient, sinceIso: string): Promise<AuditSnapshot> {
  try {
    const [events24hResult, recentResult, securityLastResult, totalCountResult] = await Promise.all([
      admin
        .from("admin_audit_events")
        .select("id, event_type, category, severity, outcome, message, created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false }),
      admin
        .from("admin_audit_events")
        .select("id, event_type, category, severity, outcome, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("admin_audit_events")
        .select("created_at")
        .in("category", ["auth", "security"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("admin_audit_events").select("id, actor_user_id", { count: "exact", head: true }),
    ])

    if (events24hResult.error) throw events24hResult.error
    if (recentResult.error) throw recentResult.error
    if (securityLastResult.error) throw securityLastResult.error
    if (totalCountResult.error) throw totalCountResult.error

    const totalAuditEventsCount = totalCountResult.count ?? 0

    const rows = (events24hResult.data ?? []) as Array<{
      id: string
      event_type: string
      category: string
      severity: string
      outcome: string
      message: string
      created_at: string
    }>
    const recentRows = (recentResult.data ?? []) as Array<{
      id: string
      event_type: string
      category: string
      severity: string
      outcome: string
      message: string
      created_at: string
    }>

    const failuresLast24h = rows.filter((row) => row.outcome === "failure").length
    const highOrCriticalLast24h = rows.filter((row) => row.severity === "high" || row.severity === "critical").length
    const adminLoginsLast24h = rows.filter((row) => row.event_type === "admin_access_verified").length
    const failedAuthEventsLast24h = rows.filter(
      (row) => row.outcome === "failure" && (row.event_type === "mfa_verify_failed" || row.event_type === "auth_callback_failed")
    ).length
    const mfaEventsLast24h = rows.filter((row) => row.event_type.startsWith("mfa_")).length
    const mfaVerifyFailuresLast24h = rows.filter((row) => row.event_type === "mfa_verify_failed").length

    const latestEventAt = rows[0]?.created_at ?? null
    const latestSecurityEventAt =
      ((securityLastResult.data as { created_at?: string | null } | null)?.created_at ?? null)

    return {
      observabilityAvailable: true,
      mfaVerifyFailuresLast24h,
      totalAuditEventsCount,
      audit: {
        eventsLast24h: { status: "available", value: rows.length },
        failuresLast24h: { status: "available", value: failuresLast24h },
        highOrCriticalLast24h: { status: "available", value: highOrCriticalLast24h },
        lastEventAt: { status: "available", value: latestEventAt },
        recent: {
          status: "available",
          value: recentRows.map((row) => ({
            id: row.id,
            eventType: row.event_type,
            category: row.category,
            severity: row.severity,
            outcome: row.outcome,
            message: row.message,
            createdAt: row.created_at,
          })),
        },
      },
      securityMetrics: {
        adminLoginsLast24h: { status: "available", value: adminLoginsLast24h },
        failedAuthEventsLast24h: { status: "available", value: failedAuthEventsLast24h },
        mfaEventsLast24h: { status: "available", value: mfaEventsLast24h },
        lastSecurityEventAt: { status: "available", value: latestSecurityEventAt },
      },
    }
  } catch {
    const reason = "admin_audit_events ist nicht verfuegbar oder noch nicht angelegt."
    return {
      observabilityAvailable: false,
      mfaVerifyFailuresLast24h: null,
      totalAuditEventsCount: 0,
      audit: {
        eventsLast24h: unavailableMetric<number>(reason),
        failuresLast24h: unavailableMetric<number>(reason),
        highOrCriticalLast24h: unavailableMetric<number>(reason),
        lastEventAt: unavailableMetric<string | null>(reason),
        recent: unavailableMetric<
          Array<{
            id: string
            eventType: string
            category: string
            severity: string
            outcome: string
            message: string
            createdAt: string
          }>
        >(reason),
      },
      securityMetrics: {
        adminLoginsLast24h: unavailableMetric<number>(reason),
        failedAuthEventsLast24h: unavailableMetric<number>(reason),
        mfaEventsLast24h: unavailableMetric<number>(reason),
        lastSecurityEventAt: unavailableMetric<string | null>(reason),
      },
    }
  }
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
  apply?: (
    query: ReturnType<ReturnType<SupabaseClient["from"]>["select"]>
  ) => ReturnType<ReturnType<SupabaseClient["from"]>["select"]>
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

function buildTasks(
  model: DashboardViewModel,
  auditSignals: { mfaVerifyFailuresLast24h: number | null }
): DashboardTask[] {
  const tasks: DashboardTask[] = []

  if (model.content.pages.draft > 0) {
    tasks.push({
      id: "draft-pages-present",
      title: `${model.content.pages.draft} Seiten sind noch nicht veroeffentlicht`,
      severity: model.content.pages.draft >= 10 ? "medium" : "low",
      category: "content",
      reason: `${model.content.pages.draft} Seiten sind noch im Draft-Status.`,
      href: "/admin/pages",
      ctaLabel: "Seiten pruefen",
    })
  }

  if (model.content.pages.withoutMetaDescription.status === "available" && model.content.pages.withoutMetaDescription.value > 0) {
    tasks.push({
      id: "pages-missing-meta-description",
      title: "Meta-Descriptions nachziehen",
      severity: model.content.pages.withoutMetaDescription.value >= 10 ? "medium" : "low",
      category: "content",
      reason: `${model.content.pages.withoutMetaDescription.value} Seiten ohne Meta-Description gefunden.`,
      href: "/admin/pages",
      ctaLabel: "SEO-Luecken schliessen",
    })
  }

  if (model.compliance.legalPages.missing.length > 0) {
    tasks.push({
      id: "missing-legal-pages",
      title: "Rechtliche Seiten vervollstaendigen",
      severity: "high",
      category: "compliance",
      reason: `Fehlende Legal-Subtypes: ${model.compliance.legalPages.missing.join(", ")}.`,
      href: "/admin/pages",
      ctaLabel: "Legal-Seiten bearbeiten",
    })
  }

  if (model.operations.cookieScans.total > 0 && model.operations.cookieScans.successful === 0) {
    tasks.push({
      id: "no-successful-cookie-scans",
      title: "Cookie-Scan-Qualitaet pruefen",
      severity: "medium",
      category: "operations",
      reason: "Es gibt Scans, aber keinen erfolgreichen Durchlauf.",
      href: "/admin/cookie-scan",
      ctaLabel: "Scans analysieren",
    })
  }

  if (model.content.popups.total > 0 && model.content.popups.active === 0) {
    tasks.push({
      id: "popups-inactive",
      title: "Inaktive Popups ueberpruefen",
      severity: "low",
      category: "operations",
      reason: `${model.content.popups.total} Popups vorhanden, aber kein Popup ist aktiv.`,
      href: "/admin/popups",
      ctaLabel: "Popups pruefen",
    })
  }

  if (model.content.navigation.configuredBrands === 0) {
    tasks.push({
      id: "navigation-empty",
      title: "Navigation konfigurieren",
      severity: "medium",
      category: "content",
      reason: "Keine Navigationseintraege fuer Brands gefunden.",
      href: "/admin/navigation",
      ctaLabel: "Navigation oeffnen",
    })
  }

  if (model.content.footer.configuredBrands === 0) {
    tasks.push({
      id: "footer-empty",
      title: "Footer konfigurieren",
      severity: "medium",
      category: "content",
      reason: "Keine Footer-Konfiguration fuer Brands gefunden.",
      href: "/admin/footer",
      ctaLabel: "Footer oeffnen",
    })
  }

  if (model.operations.cookieScans.failed > 0) {
    tasks.push({
      id: "failed-cookie-scans",
      title: "Fehlgeschlagene Cookie-Scans analysieren",
      severity: "high",
      category: "operations",
      reason: `${model.operations.cookieScans.failed} Scan(s) im Status failed.`,
      href: "/admin/cookie-scan",
      ctaLabel: "Fehler analysieren",
    })
  }

  if (model.security.singleAdminRisk) {
    tasks.push({
      id: "single-admin-risk",
      title: "Nur ein Admin/Owner aktiv",
      severity: "high",
      category: "security",
      reason: "Ein zweiter administrativer Account reduziert Ausfallrisiko.",
      href: "/admin/users",
      ctaLabel: "Rollen absichern",
    })
  }

  if (model.activity.length > 0) {
    const latestTs = new Date(model.activity[0].timestamp).getTime()
    const daysSinceUpdate = Math.floor((Date.now() - latestTs) / (24 * 60 * 60 * 1000))
    if (Number.isFinite(daysSinceUpdate) && daysSinceUpdate >= 7) {
      tasks.push({
        id: "low-content-activity",
        title: "Wenig Content-Aktivitaet",
        severity: "low",
        category: "operations",
        reason: `Seit ${daysSinceUpdate} Tagen keine sichtbare Aktualisierung.`,
      })
    }
  }

  if (model.security.failedAuthEventsLast24h.status === "available" && model.security.failedAuthEventsLast24h.value > 0) {
    tasks.push({
      id: "failed-auth-events-24h",
      title: "Erfasste Auth-Flow-Fehlerereignisse in den letzten 24h",
      severity: "medium",
      category: "security",
      reason: `${model.security.failedAuthEventsLast24h.value} erfasste Auth-Flow-Fehler (MFA-Verify/Callback, nur serverseitig instrumentierte Flows).`,
      href: "/admin#dashboard-audit",
      ctaLabel: "Audit anzeigen",
    })
  }

  if (
    model.audit.highOrCriticalLast24h.status === "available" &&
    model.audit.highOrCriticalLast24h.value > 0
  ) {
    tasks.push({
      id: "high-critical-audit-events-24h",
      title: "Sicherheitsrelevante Audit-Events priorisieren",
      severity: "high",
      category: "security",
      reason: `${model.audit.highOrCriticalLast24h.value} Audit-Event(s) mit high/critical Severity in den letzten 24h.`,
      href: "/admin#dashboard-audit",
      ctaLabel: "Audit anzeigen",
    })
  }

  if (typeof auditSignals.mfaVerifyFailuresLast24h === "number" && auditSignals.mfaVerifyFailuresLast24h > 0) {
    tasks.push({
      id: "mfa-verify-failures-24h",
      title: "MFA-Verify-Fehlerhaeufung beobachten",
      severity: "medium",
      category: "security",
      reason: `${auditSignals.mfaVerifyFailuresLast24h} MFA-Verify-Fehler in den letzten 24h.`,
      href: "/admin/security/mfa",
      ctaLabel: "MFA verwalten",
    })
  }

  if (model.content.siteSettings.customFontsTotal.status === "unavailable") {
    // Intentionally omitted: not core for dashboard operation.
  }

  if (model.security.snapshotFreshness.status === "available" && model.security.snapshotFreshness.value === "stale") {
    tasks.push({
      id: "security-snapshot-stale",
      title: "Security-Snapshot aktualisieren",
      severity: "medium",
      category: "security",
      reason: "Der letzte Security-Snapshot ist aelter als 24 Stunden.",
      href: "/admin#dashboard-security",
      ctaLabel: "Security-Status anzeigen",
    })
  }

  appendFeatureGapTasks(tasks, model)

  const severityOrder: Record<DashboardTask["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return tasks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

function buildHealth(model: DashboardViewModel): {
  status: DashboardHealthStatus
  reasons: string[]
} {
  const criticalReasons: string[] = []
  const warningReasons: string[] = []
  const infoReasons: string[] = []

  const featureKeys = Object.keys(featureRegistry) as Array<keyof typeof featureRegistry>
  for (const key of featureKeys) {
    const status = model.features[key]
    const required = featureRegistry[key].required
    const name = featureRegistry[key].label
    const productStateLabel = featureRegistry[key].productStateLabel
    if (required && status === "unavailable") {
      criticalReasons.push(`${name}: Pflicht-Feature nicht verfuegbar.`)
    }
    if (required && status === "not_configured") {
      warningReasons.push(`${name}: Pflicht-Feature nicht konfiguriert.`)
    }
    if (!required && status === "inactive") {
      infoReasons.push(`${name}: ${productStateLabel}, derzeit nicht aktiviert.`)
    }
    if (!required && status === "unavailable") {
      infoReasons.push(`${name}: ${productStateLabel}, noch nicht Bestandteil der aktiven Ausbaustufe.`)
    }
  }

  if (model.operations.cookieScans.failed > 0) {
    criticalReasons.push(`${model.operations.cookieScans.failed} Cookie-Scan(s) fehlgeschlagen.`)
  }

  if (model.compliance.legalPages.missing.length > 0) {
    criticalReasons.push(`Rechtliche Seiten fehlen: ${model.compliance.legalPages.missing.join(", ")}.`)
  }

  if (model.security.singleAdminRisk) {
    criticalReasons.push("Nur ein Admin/Owner verfuegbar (Single-Admin-Risiko).")
  }

  if (model.content.pages.draft > 0) {
    warningReasons.push(`${model.content.pages.draft} Seite(n) im Draft-Status.`)
  }

  if (
    model.content.pages.withoutMetaDescription.status === "available" &&
    model.content.pages.withoutMetaDescription.value > 0
  ) {
    warningReasons.push(`${model.content.pages.withoutMetaDescription.value} Seite(n) ohne Meta-Description.`)
  }

  if (model.content.navigation.configuredBrands === 0) {
    warningReasons.push("Navigation ist nicht konfiguriert.")
  }

  if (model.content.footer.configuredBrands === 0) {
    warningReasons.push("Footer ist nicht konfiguriert.")
  }

  if (model.security.failedAuthEventsLast24h.status === "available" && model.security.failedAuthEventsLast24h.value > 0) {
    warningReasons.push(`${model.security.failedAuthEventsLast24h.value} erfasste Auth-Failure-Events in 24h.`)
  }

  if (model.audit.highOrCriticalLast24h.status === "available") {
    if (model.audit.highOrCriticalLast24h.value >= 5) {
      criticalReasons.push(`${model.audit.highOrCriticalLast24h.value} high/critical Audit-Events in 24h.`)
    } else if (model.audit.highOrCriticalLast24h.value > 0) {
      warningReasons.push(`${model.audit.highOrCriticalLast24h.value} high/critical Audit-Events in 24h.`)
    }
  }

  if (model.operations.workerHeartbeat.status === "available") {
    if (model.operations.workerHeartbeat.value.status === "offline") {
      criticalReasons.push("Worker-Heartbeat ist offline.")
    } else if (model.operations.workerHeartbeat.value.status === "stale") {
      warningReasons.push("Worker-Heartbeat ist veraltet (stale).")
    }
  }

  if (model.security.snapshotFreshness.status === "available" && model.security.snapshotFreshness.value === "stale") {
    warningReasons.push("Security-Snapshot ist aelter als 24h (veraltet).")
  }

  if (criticalReasons.length > 0) {
    return { status: "critical", reasons: criticalReasons }
  }

  if (warningReasons.length > 0) {
    return { status: "warning", reasons: warningReasons }
  }

  if (infoReasons.length > 0) {
    return { status: "info", reasons: infoReasons }
  }

  return {
    status: "healthy",
    reasons: ["Alle Feature-Flags aktiv; keine weiteren Hinweise aus den angebundenen Datenquellen."],
  }
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
  const oneDayAgoIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
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
    auditSnapshot,
    snapshotMetrics,
    workerRuntime,
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
    loadAuditSnapshot(admin, oneDayAgoIso),
    loadSecuritySnapshotMetrics(),
    loadWorkerRuntimeStatus(),
  ])

  const loginObservabilityHasData =
    (auditSnapshot.securityMetrics.adminLoginsLast24h.status === "available" &&
      auditSnapshot.securityMetrics.adminLoginsLast24h.value > 0) ||
    (auditSnapshot.securityMetrics.failedAuthEventsLast24h.status === "available" &&
      auditSnapshot.securityMetrics.failedAuthEventsLast24h.value > 0)

  const mfaCoverageAvailable = snapshotMetrics.status === "available"
  const mfaCoverageHasData = mfaCoverageAvailable && snapshotMetrics.totalAdminSnapshots > 0

  const features: DashboardViewModel["features"] = {
    audit: resolveFeatureStatus({
      available: auditSnapshot.observabilityAvailable,
      hasData: auditSnapshot.totalAuditEventsCount > 0,
      required: featureRegistry.audit.required,
    }),
    loginObservability: resolveFeatureStatus({
      available: auditSnapshot.observabilityAvailable,
      hasData: loginObservabilityHasData,
      required: featureRegistry.loginObservability.required,
    }),
    mfaCoverage: resolveFeatureStatus({
      available: mfaCoverageAvailable,
      hasData: mfaCoverageHasData,
      required: featureRegistry.mfaCoverage.required,
    }),
    cookieScan: resolveFeatureStatus({
      available: true,
      hasData: cookieScansTotal > 0,
      required: featureRegistry.cookieScan.required,
    }),
    content: resolveFeatureStatus({
      available: true,
      hasData: pagesTotal > 0 || blocksTotal > 0,
      required: featureRegistry.content.required,
    }),
    users: resolveFeatureStatus({
      available: true,
      hasData: totalAuthUsers > 0,
      required: featureRegistry.users.required,
    }),
  }

  const systemMaturity = calculateSystemMaturity(features)

  const model: DashboardViewModel = {
    generatedAt: nowIso,
    health: {
      status: "healthy",
      reasons: [],
    },
    systemMaturity,
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
      workerHeartbeat:
        workerRuntime.status === "offline" && !workerRuntime.lastSeenAt
          ? unavailableMetric("Kein Worker-Heartbeat vorhanden oder Quelle nicht erreichbar.")
          : {
              status: "available",
              value: workerRuntime,
            },
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
    security: {
      singleAdminRisk: ownerRoleUsers + adminRoleUsers <= 1,
      disabledProfiles,
      adminCapable,
      mfaCoverageNote:
        snapshotMetrics.status === "unavailable"
          ? UNAVAILABLE_MFA_COVERAGE_NOTE
          : snapshotMetrics.totalAdminSnapshots === 0
            ? { status: "available", value: "Keine Admin/Owner-Snapshots vorhanden." }
            : {
                status: "available",
                value: `${snapshotMetrics.mfaVerifiedAdmins}/${snapshotMetrics.totalAdminSnapshots} Admin/Owner mit verifiziertem MFA`,
              },
      loginObservability: UNAVAILABLE_LOGIN_ATTEMPTS,
      auditObservability: auditSnapshot.observabilityAvailable
        ? {
            status: "available",
            value: "Audit-Quelle admin_audit_events ist angebunden.",
          }
        : unavailableMetric<string>("Audit-Quelle admin_audit_events ist nicht verfuegbar oder noch nicht angelegt."),
      adminLoginsLast24h: auditSnapshot.securityMetrics.adminLoginsLast24h,
      failedAuthEventsLast24h: auditSnapshot.securityMetrics.failedAuthEventsLast24h,
      mfaEventsLast24h: auditSnapshot.securityMetrics.mfaEventsLast24h,
      lastSecurityEventAt: auditSnapshot.securityMetrics.lastSecurityEventAt,
      snapshotFreshness:
        snapshotMetrics.status === "unavailable"
          ? unavailableMetric("Security-Snapshot-Datenquelle nicht verfuegbar.")
          : { status: "available", value: snapshotMetrics.freshness === "stale" ? "stale" : "fresh" },
      totalAdminSnapshots:
        snapshotMetrics.status === "unavailable"
          ? unavailableMetric("Keine Snapshot-Daten verfuegbar.")
          : { status: "available", value: snapshotMetrics.totalAdminSnapshots },
      mfaEnabledAdmins:
        snapshotMetrics.status === "unavailable"
          ? unavailableMetric("Keine Snapshot-Daten verfuegbar.")
          : { status: "available", value: snapshotMetrics.mfaEnabledAdmins },
      mfaVerifiedAdmins:
        snapshotMetrics.status === "unavailable"
          ? unavailableMetric("Keine Snapshot-Daten verfuegbar.")
          : { status: "available", value: snapshotMetrics.mfaVerifiedAdmins },
      staleSnapshots:
        snapshotMetrics.status === "unavailable"
          ? unavailableMetric("Keine Snapshot-Daten verfuegbar.")
          : { status: "available", value: snapshotMetrics.staleSnapshots },
    },
    audit: auditSnapshot.audit,
    compliance: {
      cookieScans: {
        pendingReview: cookiePendingReview,
        approved: cookieApproved,
        reviewed: cookieReviewed,
      },
      legalPages,
      auditLog: auditSnapshot.observabilityAvailable
        ? {
            status: "available",
            value: "Audit-Events werden aus admin_audit_events geladen.",
          }
        : unavailableMetric<string>("Audit-Log ist nicht verfuegbar, da admin_audit_events fehlt."),
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
    features,
  }

  model.health = buildHealth(model)
  model.tasks = buildTasks(model, { mfaVerifyFailuresLast24h: auditSnapshot.mfaVerifyFailuresLast24h })
  return model
}
