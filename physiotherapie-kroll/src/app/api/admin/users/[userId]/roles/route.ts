import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { isUuidString, requireAdminWithServiceRole } from "@/lib/api/adminServiceRoute"
import {
  countOperationalAdminCapableUsers,
  ensureUserExists,
  isAdminRoleSet,
  isOperationalAdminCapable,
  loadUserStatus,
  loadUserRoles,
  MANAGEABLE_ROLES,
  setUserRolesAtomic,
  type ManageableRole,
} from "@/lib/server/adminUsers"
import { parseAalFromAssuranceData } from "@/lib/auth/mfaAal"
import { writeAuditEvent } from "@/lib/admin/audit"

type Params = { params: Promise<{ userId: string }> }

function normalizeRoleList(value: unknown): ManageableRole[] | null {
  if (!Array.isArray(value)) return null
  const set = new Set<ManageableRole>()
  for (const entry of value) {
    if (typeof entry !== "string") return null
    if (!(MANAGEABLE_ROLES as readonly string[]).includes(entry)) return null
    set.add(entry as ManageableRole)
  }
  if (!set.has("user")) set.add("user")
  return [...set]
}

function isOwner(roles: readonly string[]): boolean {
  return roles.includes("owner")
}

async function assertAal2(sessionClient: SupabaseClient) {
  const { data, error } = await sessionClient.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return parseAalFromAssuranceData(data) === "aal2"
}

export async function PUT(request: Request, ctx: Params) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response
    const { adminClient, sessionClient, user: actor } = gate.ctx

    const aal2 = await assertAal2(sessionClient)
    if (!aal2) {
      return NextResponse.json({ error: "MFA-Verifizierung (AAL2) erforderlich." }, { status: 403 })
    }

    const { userId } = await ctx.params
    if (!isUuidString(userId)) {
      return NextResponse.json({ error: "Ungültige Benutzer-ID." }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const requestedRoles = normalizeRoleList(body?.roles)
    if (!requestedRoles) {
      return NextResponse.json({ error: "Ungültige Rollenliste." }, { status: 400 })
    }

    await ensureUserExists(adminClient, userId)
    const actorRoles = await loadUserRoles(adminClient, actor.id)
    const [targetRoles, targetStatus] = await Promise.all([
      loadUserRoles(adminClient, userId),
      loadUserStatus(adminClient, userId),
    ])
    const actorIsOwner = isOwner(actorRoles)
    const targetIsOwner = isOwner(targetRoles)
    const nextHasOwner = requestedRoles.includes("owner")

    if (!actorIsOwner && (targetIsOwner || nextHasOwner)) {
      return NextResponse.json({ error: "Nur Owner dürfen Owner-Rollen ändern." }, { status: 403 })
    }

    const targetWasOperationalAdminCapable = isOperationalAdminCapable(targetRoles, targetStatus)
    const targetWillBeOperationalAdminCapable = isOperationalAdminCapable(requestedRoles, targetStatus)
    const targetWillBeAdminCapable = isAdminRoleSet(requestedRoles)
    const isSelfTarget = actor.id === userId

    if (isSelfTarget && !targetWillBeAdminCapable) {
      return NextResponse.json({ error: "Sie können sich nicht selbst die Adminberechtigung entziehen." }, { status: 409 })
    }

    if (targetWasOperationalAdminCapable && !targetWillBeOperationalAdminCapable) {
      const operationalAdminCount = await countOperationalAdminCapableUsers(adminClient)
      if (operationalAdminCount <= 1) {
        return NextResponse.json({ error: "Letzte operative Adminfähigkeit kann nicht entfernt werden." }, { status: 409 })
      }
    }

    // Final consistency re-check right before applying the atomic change (minimizes race window).
    if (targetWasOperationalAdminCapable && !targetWillBeOperationalAdminCapable) {
      const [freshTargetRoles, freshTargetStatus, operationalAdminCount] = await Promise.all([
        loadUserRoles(adminClient, userId),
        loadUserStatus(adminClient, userId),
        countOperationalAdminCapableUsers(adminClient),
      ])
      const freshWasOperational = isOperationalAdminCapable(freshTargetRoles, freshTargetStatus)
      if (freshWasOperational && operationalAdminCount <= 1) {
        return NextResponse.json({ error: "Letzte operative Adminfähigkeit kann nicht entfernt werden." }, { status: 409 })
      }
    }

    await setUserRolesAtomic(adminClient, userId, requestedRoles, actor.id)

    const roles = await loadUserRoles(adminClient, userId)
    await writeAuditEvent(
      {
        eventType: "user_role_changed",
        category: "user",
        severity: "high",
        outcome: "success",
        actorUserId: actor.id,
        targetUserId: userId,
        route: `/api/admin/users/${userId}/roles`,
        entityType: "user_role",
        entityId: userId,
        message: "Rollen eines Benutzers wurden angepasst.",
        metadata: {
          previousRoles: targetRoles,
          nextRoles: roles,
        },
      },
      { adminClient }
    )

    return NextResponse.json({ userId, roles }, { status: 200 })
  } catch (error) {
    if ((error as { code?: string })?.code === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 })
    }
    console.error("admin user roles update failed:", error)
    return NextResponse.json({ error: "Rollen konnten nicht aktualisiert werden." }, { status: 500 })
  }
}

