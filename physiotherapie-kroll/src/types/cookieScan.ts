/**
 * Cookie-Scan: Typen für Scans und Items.
 * Technische Erkennung (Scan) und fachliche Nachpflege (Kategorie, Zweck, Anbieter) getrennt.
 */

export type CookieScanStatus = "idle" | "running" | "success" | "failed"
export type CookieScanApprovalStatus = "draft" | "reviewed" | "approved"

export interface CookieScan {
  id: string
  target_url: string
  environment: string
  scanned_at: string | null
  status: CookieScanStatus
  consent_mode: string
  raw_result_json: unknown
  approval_status: CookieScanApprovalStatus
  error_message: string | null
  created_at: string
  /** Nicht in DB vorhanden; API liefert created_at bzw. scanned_at als Fallback. */
  updated_at?: string
}

export interface CookieScanItem {
  id: string
  scan_id: string
  name: string
  domain: string
  path: string
  category: string | null
  purpose: string | null
  duration: string | null
  secure: boolean
  http_only: boolean
  same_site: string | null
  provider: string | null
  source_url: string | null
  is_third_party: boolean
  notes: string | null
  created_at: string
}

/** Rohdaten eines Cookies aus dem Browser-Kontext (Playwright). */
export interface RawScannedCookie {
  name: string
  domain: string
  path: string
  value?: string
  expires?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "Strict" | "Lax" | "None"
}

/** Ein Item für die DB nach Deduplizierung (name+domain+path). */
export interface CookieScanItemInsert {
  scan_id: string
  name: string
  domain: string
  path: string
  category?: string | null
  purpose?: string | null
  duration?: string | null
  secure: boolean
  http_only: boolean
  same_site?: string | null
  provider?: string | null
  source_url?: string | null
  is_third_party: boolean
  notes?: string | null
}
