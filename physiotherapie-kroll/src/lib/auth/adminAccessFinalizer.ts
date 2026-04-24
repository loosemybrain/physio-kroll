import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { refreshSecuritySnapshot, writeAuditEventServer } from "@/lib/server/db/adminWrites"
import { getAdminMfaState } from "./adminAccess"

type FinalizeAdminAccessParams = {
  sessionClient: SupabaseClient
  sourceRoute: string
  sourceEvent: string
  metadata?: Record<string, unknown>
}

export async function finalizeAdminAccessVerified(params: FinalizeAdminAccessParams): Promise<"written" | "skipped"> {
  const {
    data: { user },
  } = await params.sessionClient.auth.getUser()
  if (!user?.id) return "skipped"

  const mfaState = await getAdminMfaState(params.sessionClient, user)
  if (!mfaState.isAdmin || !mfaState.hasTotpFactor || !mfaState.hasVerifiedTotpFactor || mfaState.currentAal !== "aal2") {
    return "skipped"
  }

  await refreshSecuritySnapshot({ user, sessionClient: params.sessionClient })

  const inserted = await writeAuditEventServer({
    eventType: "admin_access_verified",
    category: "auth",
    severity: "info",
    outcome: "success",
    actorUserId: user.id,
    targetUserId: user.id,
    route: params.sourceRoute,
    entityType: "auth_user",
    entityId: user.id,
    message: "Admin access fully verified",
    metadata: {
      sourceEvent: params.sourceEvent,
      hasTotpFactor: mfaState.hasTotpFactor,
      hasVerifiedTotpFactor: mfaState.hasVerifiedTotpFactor,
      currentAal: mfaState.currentAal,
      ...(params.metadata ?? {}),
    },
  })

  return inserted ? "written" : "skipped"
}
