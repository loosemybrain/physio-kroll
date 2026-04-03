/** Verständliche MFA-/Auth-Fehler für die UI (keine rohen Supabase-Strings). */

export function mapMfaVerifyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()
  if (lower.includes("invalid")) return "Der eingegebene Code ist ungültig."
  if (lower.includes("expired")) return "Der Code ist abgelaufen. Bitte einen neuen Versuch starten."
  if (lower.includes("session")) return "Ihre Sitzung ist abgelaufen. Bitte erneut anmelden."
  if (lower.includes("challenge")) return "Die Sicherheitsabfrage konnte nicht gestartet werden. Bitte erneut versuchen."
  return "Die Bestätigung ist fehlgeschlagen. Bitte erneut versuchen."
}

export function mapCredentialUpdateError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()
  if (lower.includes("aal2") || lower.includes("mfa")) {
    return "Für diese Änderung ist eine zusätzliche Sicherheitsbestätigung erforderlich."
  }
  if (lower.includes("same")) return "Die neue E-Mail-Adresse entspricht der aktuellen."
  if (lower.includes("password")) return "Das Passwort konnte nicht geändert werden. Bitte Anforderungen prüfen."
  return "Die Änderung ist fehlgeschlagen. Bitte erneut versuchen."
}
