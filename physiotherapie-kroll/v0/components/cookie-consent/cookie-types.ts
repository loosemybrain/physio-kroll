export interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  externalMedia: boolean
}

export const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  externalMedia: false,
}

export const COOKIE_CONSENT_KEY = "cookie-consent-preferences"
export const COOKIE_CONSENT_VERSION = "1.0"
