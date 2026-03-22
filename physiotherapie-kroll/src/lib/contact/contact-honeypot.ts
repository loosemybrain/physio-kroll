/**
 * Honeypot: Check if bot-detection fields are filled
 */
export interface HoneypotCheck {
  triggered: boolean
  field?: string
}

/**
 * Check honeypot fields
 * Returns true if spam detected (honeypot filled)
 */
export function checkHoneypot(data: Record<string, unknown>): HoneypotCheck {
  // Check "website" field (main honeypot)
  const website = data.website
  if (typeof website === "string" && website.length > 0) {
    return {
      triggered: true,
      field: "website",
    }
  }

  // Check "company_website" field (secondary honeypot)
  const companyWebsite = data.company_website
  if (typeof companyWebsite === "string" && companyWebsite.length > 0) {
    return {
      triggered: true,
      field: "company_website",
    }
  }

  return {
    triggered: false,
  }
}

/**
 * Check form timing (time between form render and submit)
 * Bots typically fill forms very quickly
 *
 * @param formStartedAt Timestamp (in milliseconds) when form was rendered
 * @param minDelayMs Minimum time before allowing submit (default: 2 seconds)
 * @returns true if submission is too fast (spam indicator)
 */
export function isSubmitTooFast(
  formStartedAt: number,
  minDelayMs: number = 2000
): boolean {
  const now = Date.now()
  const timeSinceRender = now - formStartedAt

  // If negative or zero, something is wrong
  if (timeSinceRender <= 0) {
    return true
  }

  // If submitted too quickly, likely a bot
  return timeSinceRender < minDelayMs
}

/**
 * Create a honeypot field definition for forms
 * Returns the field configuration (name and rendering hints)
 */
export function getHoneypotFieldConfig() {
  return {
    name: "website",
    label: "Website", // Shown only in raw HTML, not in UI
    ariaHidden: true,
    tabIndex: -1,
    autoComplete: "off",
  }
}
