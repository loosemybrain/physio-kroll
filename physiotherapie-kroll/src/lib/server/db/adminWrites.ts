import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { AdminAuditEventInput, AuditEventCategory, AuditEventOutcome, AuditEventSeverity, AuditEventType } from "@/lib/admin/audit/types"
import { getAdminMfaState } from "@/lib/auth/adminAccess"
import { getSupabaseAdmin } from "@/lib/supabase/admin.server"

export type AuditEventServerInput = {
  eventType: AuditEventType
  category: AuditEventCategory
  severity: AuditEventSeverity
  outcome: AuditEventOutcome
  actorUserId: string | null
  message: string
  targetUserId?: string | null
  route?: string | null
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown>
  createdAt?: string
}

const ADMIN_ACCESS_DEDUP_WINDOW_MS = 5_000
const SNAPSHOT_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000
const WORKER_STALE_THRESHOLD_MS = 5 * 60 * 1000
const WORKER_OFFLINE_THRESHOLD_MS = 15 * 60 * 1000

type WorkerRuntimeStatus = "running" | "idle" | "stale" | "offline"

export async function writeAuditEventServer(event: AuditEventServerInput): Promise<boolean> {
  try {
    const admin = await getSupabaseAdmin()
    if (event.eventType === "admin_access_verified" && event.actorUserId) {
      const dedupSince = new Date(Date.now() - ADMIN_ACCESS_DEDUP_WINDOW_MS).toISOString()
      const { data: latest, error: dedupError } = await admin
        .from("admin_audit_events")
        .select("id, created_at")
        .eq("event_type", event.eventType)
        .eq("actor_user_id", event.actorUserId)
        .gte("created_at", dedupSince)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!dedupError && latest?.id) {
        return false
      }
    }

    const payload: AdminAuditEventInput = {
      eventType: event.eventType,
      category: event.category,
      severity: event.severity,
      outcome: event.outcome,
      actorUserId: event.actorUserId,
      targetUserId: event.targetUserId ?? event.actorUserId ?? null,
      route: event.route ?? null,
      entityType: event.entityType ?? null,
      entityId: event.entityId ?? event.actorUserId ?? null,
      message: event.message,
      metadata: event.metadata ?? {},
      createdAt: event.createdAt,
    }

    const { error } = await admin.from("admin_audit_events").insert({
      event_type: payload.eventType,
      category: payload.category,
      severity: payload.severity,
      outcome: payload.outcome,
      actor_user_id: payload.actorUserId,
      target_user_id: payload.targetUserId,
      route: payload.route,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      message: payload.message,
      metadata: payload.metadata,
      created_at: payload.createdAt ?? undefined,
    })
    if (error) {
      console.error("writeAuditEventServer insert failed:", error.message)
      return false
    }
    return true
  } catch (error) {
    console.error("writeAuditEventServer failed:", error)
    return false
  }
}

export async function upsertSecuritySnapshot(user: Pick<User, "id" | "email" | "role">): Promise<void> {
  // Legacy-Einstiegspunkt: delegiert auf den vollständigen Snapshot-Refresh,
  // um unvollständige Zeilen zu vermeiden.
  await refreshSecuritySnapshot({ user })
}

export async function refreshSecuritySnapshot(params: {
  user: Pick<User, "id" | "email" | "role">
  sessionClient?: SupabaseClient
}): Promise<void> {
  try {
    const admin = await getSupabaseAdmin()
    const rolesResult = await admin.from("user_roles").select("role_id").eq("user_id", params.user.id)
    const roleIds = (rolesResult.data ?? []).map((row: { role_id: string }) => row.role_id)
    const roleSet = new Set(roleIds)
    const isAdminOwner = roleSet.has("admin") || roleSet.has("owner")

    let mfaEnabled = false
    let mfaVerified = false
    let currentAal: string | null = null
    if (params.sessionClient) {
      const mfaState = await getAdminMfaState(params.sessionClient, params.user as User)
      mfaEnabled = mfaState.hasTotpFactor
      mfaVerified = mfaState.hasVerifiedTotpFactor
      currentAal = mfaState.currentAal
    }

    const snapshotAt = new Date().toISOString()
    const detailedPayload = {
      user_id: params.user.id,
      email: params.user.email ?? null,
      role: params.user.role ?? null,
      role_ids: roleIds,
      is_admin_owner: isAdminOwner,
      mfa_enabled: mfaEnabled,
      mfa_verified: mfaVerified,
      current_aal: currentAal,
      snapshot_at: snapshotAt,
      updated_at: snapshotAt,
    }

    const { error: detailedError } = await admin
      .from("admin_security_profile_snapshots")
      .upsert(detailedPayload, { onConflict: "user_id" })
    if (detailedError) {
      console.error("refreshSecuritySnapshot failed:", detailedError.message)
    }
  } catch (error) {
    console.error("refreshSecuritySnapshot crashed:", error)
  }
}

export async function writeWorkerHeartbeat(
  workerId: string,
  type: string,
  status: "running" | "idle" | "stale" | "offline",
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const admin = await getSupabaseAdmin()
    const nowIso = new Date().toISOString()
    const { error } = await admin.from("worker_heartbeats").upsert(
      {
        worker_id: workerId,
        type,
        status,
        last_seen_at: nowIso,
        heartbeat_at: nowIso,
        updated_at: nowIso,
        metadata: metadata ?? {},
      },
      { onConflict: "worker_id,type" }
    )
    if (error) {
      console.error("writeWorkerHeartbeat failed:", error.message)
    }
  } catch (error) {
    console.error("writeWorkerHeartbeat crashed:", error)
  }
}

export async function writeHealthCheck(type: string, status: "ok" | "warning" | "error"): Promise<void> {
  await runAndWriteHealthCheck(type, status)
}

export async function runAndWriteHealthCheck(type: string, requestedStatus: "ok" | "warning" | "error"): Promise<{
  type: string
  status: "ok" | "warning" | "error"
  latencyMs: number
  message: string
  checkedAt: string
}> {
  const checkedAt = new Date().toISOString()
  try {
    const admin = await getSupabaseAdmin()
    const started = Date.now()
    const dbProbe = await admin.from("admin_audit_events").select("id").limit(1)
    const latencyMs = Date.now() - started
    const effectiveStatus = dbProbe.error ? "error" : requestedStatus
    const message = dbProbe.error ? `db_probe_failed:${dbProbe.error.message}` : "db_query_ok"

    const { error } = await admin.from("system_health_checks").insert({
      type,
      status: effectiveStatus,
      latency_ms: latencyMs,
      message,
      checked_at: checkedAt,
    })
    if (error) {
      console.error("writeHealthCheck failed:", error.message)
    }
    return { type, status: effectiveStatus, latencyMs, message, checkedAt }
  } catch (error) {
    console.error("writeHealthCheck crashed:", error)
    return {
      type,
      status: "error",
      latencyMs: -1,
      message: "db_probe_failed:unexpected_exception",
      checkedAt,
    }
  }
}

export async function loadWorkerRuntimeStatus(): Promise<{
  status: WorkerRuntimeStatus
  workerId: string | null
  type: string | null
  lastSeenAt: string | null
}> {
  try {
    const admin = await getSupabaseAdmin()
    const { data, error } = await admin
      .from("worker_heartbeats")
      .select("worker_id, type, status, last_seen_at, heartbeat_at, updated_at")
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .order("heartbeat_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) {
      return { status: "offline", workerId: null, type: null, lastSeenAt: null }
    }

    const row = data as {
      worker_id?: string | null
      type?: string | null
      status?: string | null
      last_seen_at?: string | null
      heartbeat_at?: string | null
      updated_at?: string | null
    }
    const lastSeenAt = row.last_seen_at ?? row.heartbeat_at ?? row.updated_at ?? null
    if (!lastSeenAt) {
      return { status: "offline", workerId: row.worker_id ?? null, type: row.type ?? null, lastSeenAt: null }
    }

    const ageMs = Date.now() - new Date(lastSeenAt).getTime()
    const normalizedStatus =
      ageMs > WORKER_OFFLINE_THRESHOLD_MS
        ? "offline"
        : ageMs > WORKER_STALE_THRESHOLD_MS
          ? "stale"
          : row.status === "idle"
            ? "idle"
            : "running"

    return {
      status: normalizedStatus,
      workerId: row.worker_id ?? null,
      type: row.type ?? null,
      lastSeenAt,
    }
  } catch (error) {
    console.error("loadWorkerRuntimeStatus failed:", error)
    return { status: "offline", workerId: null, type: null, lastSeenAt: null }
  }
}

export async function loadSecuritySnapshotMetrics(): Promise<{
  status: "available" | "unavailable"
  totalAdminSnapshots: number
  mfaEnabledAdmins: number
  mfaVerifiedAdmins: number
  staleSnapshots: number
  freshness: "fresh" | "stale" | "unavailable"
}> {
  try {
    const admin = await getSupabaseAdmin()
    const { data, error } = await admin
      .from("admin_security_profile_snapshots")
      .select("mfa_enabled, mfa_verified, snapshot_at, updated_at")
      .eq("is_admin_owner", true)
    if (error) {
      return {
        status: "unavailable",
        totalAdminSnapshots: 0,
        mfaEnabledAdmins: 0,
        mfaVerifiedAdmins: 0,
        staleSnapshots: 0,
        freshness: "unavailable",
      }
    }

    const rows = (data ?? []) as Array<{
      mfa_enabled?: boolean | null
      mfa_verified?: boolean | null
      snapshot_at?: string | null
      updated_at?: string | null
    }>

    const staleCutoff = Date.now() - SNAPSHOT_STALE_THRESHOLD_MS
    const staleSnapshots = rows.filter((row) => {
      const ts = row.updated_at ?? row.snapshot_at
      if (!ts) return true
      return new Date(ts).getTime() < staleCutoff
    }).length

    const total = rows.length
    return {
      status: "available",
      totalAdminSnapshots: total,
      mfaEnabledAdmins: rows.filter((row) => row.mfa_enabled === true).length,
      mfaVerifiedAdmins: rows.filter((row) => row.mfa_verified === true).length,
      staleSnapshots,
      freshness: total > 0 && staleSnapshots > 0 ? "stale" : "fresh",
    }
  } catch (error) {
    console.error("loadSecuritySnapshotMetrics failed:", error)
    return {
      status: "unavailable",
      totalAdminSnapshots: 0,
      mfaEnabledAdmins: 0,
      mfaVerifiedAdmins: 0,
      staleSnapshots: 0,
      freshness: "unavailable",
    }
  }
}
