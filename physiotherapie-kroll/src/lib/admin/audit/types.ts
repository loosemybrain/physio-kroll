export type AuditEventType =
  | "admin_access_verified"
  | "auth_callback_failed"
  | "mfa_setup_started"
  | "mfa_setup_completed"
  | "mfa_verify_succeeded"
  | "mfa_verify_failed"
  | "user_role_changed"
  | "user_status_changed"
  | "cookie_scan_started"

export type AuditEventCategory = "auth" | "security" | "user" | "content" | "operations" | "compliance"

export type AuditEventSeverity = "info" | "warning" | "high" | "critical"

export type AuditEventOutcome = "success" | "failure" | "info"

export type AdminAuditEventInput = {
  eventType: AuditEventType
  category: AuditEventCategory
  severity: AuditEventSeverity
  outcome: AuditEventOutcome
  actorUserId: string | null
  targetUserId: string | null
  route: string | null
  entityType: string | null
  entityId: string | null
  message: string
  metadata: Record<string, unknown>
  createdAt?: string
}
