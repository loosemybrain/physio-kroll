import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isUserAdminInDatabase } from "@/lib/auth/adminAccess"
import { finalizeAdminAccessVerified } from "@/lib/auth/adminAccessFinalizer"
import { writeAuditEvent, type AdminAuditEventInput, type AuditEventType } from "@/lib/admin/audit"

const ALLOWED_CLIENT_EVENTS: readonly AuditEventType[] = [
  "mfa_setup_started",
  "mfa_setup_completed",
  "mfa_verify_succeeded",
  "mfa_verify_failed",
]

function isAllowedClientEventType(value: unknown): value is AuditEventType {
  return typeof value === "string" && ALLOWED_CLIENT_EVENTS.includes(value as AuditEventType)
}

function normalizeMetadata(eventType: AuditEventType, value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>
  const normalized: Record<string, unknown> = {}

  if (typeof input.factorId === "string" && input.factorId.length > 0 && input.factorId.length <= 128) {
    normalized.factorId = input.factorId
  }

  if (eventType === "mfa_verify_failed" && typeof input.errorCode === "string" && input.errorCode.length <= 64) {
    normalized.errorCode = input.errorCode
  }

  return normalized
}

function buildServerControlledEvent(eventType: AuditEventType, userId: string, metadata: Record<string, unknown>): AdminAuditEventInput {
  const base = {
    actorUserId: userId,
    targetUserId: userId,
    route: eventType === "mfa_setup_started" || eventType === "mfa_setup_completed" ? "/auth/mfa/setup" : "/auth/mfa/verify",
    entityType: "auth_user",
    entityId: userId,
    metadata,
  }

  if (eventType === "mfa_setup_started") {
    return {
      ...base,
      eventType,
      category: "auth",
      severity: "info",
      outcome: "info",
      message: "MFA-Setup gestartet.",
    }
  }
  if (eventType === "mfa_setup_completed") {
    return {
      ...base,
      eventType,
      category: "auth",
      severity: "info",
      outcome: "success",
      message: "MFA-Setup abgeschlossen.",
    }
  }
  if (eventType === "mfa_verify_succeeded") {
    return {
      ...base,
      eventType,
      category: "auth",
      severity: "info",
      outcome: "success",
      message: "MFA-Verifizierung erfolgreich.",
    }
  }
  return {
    ...base,
    eventType: "mfa_verify_failed",
    category: "auth",
    severity: "warning",
    outcome: "failure",
    message: "MFA-Verifizierung fehlgeschlagen.",
  }
}

export async function POST(request: Request) {
  try {
    const sessionClient = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser()
    if (userError || !user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 })
    }

    const isAdmin = await isUserAdminInDatabase(sessionClient, user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || !isAllowedClientEventType(body.eventType)) {
      return NextResponse.json({ error: "Ungueltiger Event-Typ." }, { status: 400 })
    }

    const metadata = normalizeMetadata(body.eventType, body.metadata)
    const event = buildServerControlledEvent(body.eventType, user.id, metadata)

    await writeAuditEvent(event)
    if (body.eventType === "mfa_verify_succeeded" || body.eventType === "mfa_setup_completed") {
      await finalizeAdminAccessVerified({
        sessionClient,
        sourceRoute: body.eventType === "mfa_setup_completed" ? "/auth/mfa/setup" : "/auth/mfa/verify",
        sourceEvent: body.eventType,
        metadata: {
          source: "mfa-event-route",
        },
      })
    }
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("admin audit event route failed:", error)
    return NextResponse.json({ error: "Audit-Event konnte nicht verarbeitet werden." }, { status: 500 })
  }
}
