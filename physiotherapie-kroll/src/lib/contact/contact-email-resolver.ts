import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Email validation helper
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false
  // RFC 5322 simplified, but good enough for our use case
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize email to prevent CRLF injection
 */
export function sanitizeEmail(email: string): string {
  // Remove any CRLF/LF that could be used for header injection
  return email.replace(/[\r\n]/g, "").trim()
}

/**
 * Result of email resolution
 */
export interface EmailResolutionResult {
  success: boolean
  // The final email to send to
  recipientEmail?: string
  // The original/intended email (if different in test mode)
  originalEmail?: string
  // Whether test mode was active
  testMode: boolean
  // Why resolution succeeded/failed
  reason: string
  // For logging: which source was used
  source: "cmsBlock" | "envBrand" | "envFallback" | "testMode"
}

/**
 * Configuration for email resolution
 */
export interface EmailResolutionConfig {
  // Email from the CMS block (if configured)
  cmsRecipientEmail?: string
  // Brand to determine env var fallback
  brand: BrandKey
  // Allow test mode override
  allowTestMode?: boolean
}

/**
 * Resolve the final recipient email address
 *
 * Priority:
 * 1. Test mode (if enabled) → CONTACT_TEST_EMAIL
 * 2. CMS block configuration (if valid)
 * 3. ENV variable for brand (CONTACT_EMAIL_PHYSIOTHERAPY / CONTACT_EMAIL_PHYSIOKONZEPT)
 * 4. Global fallback (CONTACT_FALLBACK_EMAIL)
 */
export function resolveRecipientEmail(config: EmailResolutionConfig): EmailResolutionResult {
  const testModeEnabled = process.env.CONTACT_TEST_MODE === "true"
  const testEmail = process.env.CONTACT_TEST_EMAIL

  // Test Mode: highest priority (overrides everything)
  if (testModeEnabled && testEmail) {
    if (!isValidEmail(testEmail)) {
      return {
        success: false,
        testMode: true,
        reason: "Test mode enabled but CONTACT_TEST_EMAIL is invalid",
        source: "testMode",
      }
    }

    return {
      success: true,
      recipientEmail: sanitizeEmail(testEmail),
      originalEmail: config.cmsRecipientEmail || getEnvEmailForBrand(config.brand) || undefined,
      testMode: true,
      reason: "Using test email (TEST_MODE enabled)",
      source: "testMode",
    }
  }

  // CMS Block Configuration: second priority
  if (config.cmsRecipientEmail) {
    const sanitized = sanitizeEmail(config.cmsRecipientEmail)

    if (!isValidEmail(sanitized)) {
      return {
        success: false,
        testMode: false,
        reason: `CMS recipient email is invalid: ${sanitized}`,
        source: "cmsBlock",
      }
    }

    return {
      success: true,
      recipientEmail: sanitized,
      testMode: false,
      reason: "Using recipient email from CMS block",
      source: "cmsBlock",
    }
  }

  // ENV for Brand: third priority
  const envEmail = getEnvEmailForBrand(config.brand)
  if (envEmail) {
    if (!isValidEmail(envEmail)) {
      return {
        success: false,
        testMode: false,
        reason: `ENV email for brand ${config.brand} is invalid: ${envEmail}`,
        source: "envBrand",
      }
    }

    return {
      success: true,
      recipientEmail: sanitizeEmail(envEmail),
      testMode: false,
      reason: `Using ENV email for brand ${config.brand}`,
      source: "envBrand",
    }
  }

  // Global Fallback: last resort
  const fallbackEmail = process.env.CONTACT_FALLBACK_EMAIL
  if (fallbackEmail) {
    if (!isValidEmail(fallbackEmail)) {
      return {
        success: false,
        testMode: false,
        reason: `CONTACT_FALLBACK_EMAIL is invalid: ${fallbackEmail}`,
        source: "envFallback",
      }
    }

    return {
      success: true,
      recipientEmail: sanitizeEmail(fallbackEmail),
      testMode: false,
      reason: "Using global fallback email",
      source: "envFallback",
    }
  }

  // No email found
  return {
    success: false,
    testMode: false,
    reason: "No recipient email configured (CMS, ENV, or fallback)",
    source: "envFallback",
  }
}

/**
 * Get email from environment for a given brand
 */
function getEnvEmailForBrand(brand: BrandKey): string | null {
  if (brand === "physio-konzept") {
    return process.env.CONTACT_EMAIL_PHYSIOKONZEPT || null
  } else {
    return process.env.CONTACT_EMAIL_PHYSIOTHERAPY || null
  }
}

/**
 * Check if test mode is currently enabled
 */
export function isTestModeEnabled(): boolean {
  return process.env.CONTACT_TEST_MODE === "true"
}

/**
 * Get test email if test mode enabled, else null
 */
export function getTestEmail(): string | null {
  if (isTestModeEnabled()) {
    return process.env.CONTACT_TEST_EMAIL || null
  }
  return null
}
