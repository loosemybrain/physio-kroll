import { NextResponse } from "next/server"
import { isUuidString, requireAdminWithServiceRole } from "@/lib/api/adminServiceRoute"
import { parseAalFromAssuranceData } from "@/lib/auth/mfaAal"
import {
  countOperationalAdminCapableUsers,
  ensureUserExists,
  isOperationalAdminCapable,
  loadUserRoles,
  loadUserStatus,
  parseUserStatus,
} from "@/lib/server/adminUsers"
import { writeAuditEvent } from "@/lib/admin/audit"

type Params = { params: Promise<{ userId: string }> }

export async function PUT(request: Request, ctx: Params) {
  try {
    const gate = await requireAdminWithServiceRole()
    if (!gate.ok) return gate.response
    const { adminClient, sessionClient, user: actor } = gate.ctx

    const { data: aalData, error: aalError } = await sessionClient.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalError) throw aalError
    if (parseAalFromAssuranceData(aalData) !== "aal2") {
      return NextResponse.json({ error: "MFA-Verifizierung (AAL2) erforderlich." }, { status: 403 })
    }

    const { userId } = await ctx.params
    if (!isUuidString(userId)) {
      return NextResponse.json({ error: "Ungültige Benutzer-ID." }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const nextStatus = parseUserStatus(body?.status)
    if (!nextStatus) {
      return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 })
    }

    await ensureUserExists(adminClient, userId)
    const [actorRoles, targetRoles, targetCurrentStatus] = await Promise.all([
      loadUserRoles(adminClient, actor.id),
      loadUserRoles(adminClient, userId),
      loadUserStatus(adminClient, userId),
    ])
    const actorIsOwner = actorRoles.includes("owner")
    const targetIsOwner = targetRoles.includes("owner")

    if (!actorIsOwner && targetIsOwner) {
      return NextResponse.json({ error: "Nur Owner dürfen Owner-Benutzer verwalten." }, { status: 403 })
    }
    if (actor.id === userId && nextStatus === "disabled") {
      return NextResponse.json({ error: "Sie können Ihr eigenes Konto nicht deaktivieren." }, { status: 409 })
    }

    const targetIsCurrentlyOperationalAdmin = isOperationalAdminCapable(targetRoles, targetCurrentStatus)
    const targetWillBeOperationalAdmin = isOperationalAdminCapable(targetRoles, nextStatus)
    if (targetIsCurrentlyOperationalAdmin && !targetWillBeOperationalAdmin) {
      const activeAdminCapable = await countOperationalAdminCapableUsers(adminClient)
      if (activeAdminCapable <= 1) {
        return NextResponse.json({ error: "Letzter aktiver Admin/Owner kann nicht deaktiviert werden." }, { status: 409 })
      }
    }

    // Final consistency re-check right before write (minimizes race window).
    if (targetIsCurrentlyOperationalAdmin && !targetWillBeOperationalAdmin) {
      const [freshTargetRoles, freshTargetStatus, operationalAdminCount] = await Promise.all([
        loadUserRoles(adminClient, userId),
        loadUserStatus(adminClient, userId),
        countOperationalAdminCapableUsers(adminClient),
      ])
      const freshIsOperational = isOperationalAdminCapable(freshTargetRoles, freshTargetStatus)
      if (freshIsOperational && operationalAdminCount <= 1) {
        return NextResponse.json({ error: "Letzter aktiver Admin/Owner kann nicht deaktiviert werden." }, { status: 409 })
      }
    }

    const { error } = await adminClient
      .from("user_profiles")
      .upsert({ user_id: userId, status: nextStatus }, { onConflict: "user_id" })
    if (error) throw error

    await writeAuditEvent(
      {
        eventType: "user_status_changed",
        category: "user",
        severity: nextStatus === "disabled" ? "high" : "info",
        outcome: "success",
        actorUserId: actor.id,
        targetUserId: userId,
        route: `/api/admin/users/${userId}/status`,
        entityType: "user_profile",
        entityId: userId,
        message: "Benutzerstatus wurde aktualisiert.",
        metadata: {
          previousStatus: targetCurrentStatus,
          nextStatus,
        },
      },
      { adminClient }
    )

    return NextResponse.json({ userId, status: nextStatus }, { status: 200 })
  } catch (error) {
    if ((error as { code?: string })?.code === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 })
    }
    console.error("admin user status update failed:", error)
    return NextResponse.json({ error: "Status konnte nicht aktualisiert werden." }, { status: 500 })
  }
}

