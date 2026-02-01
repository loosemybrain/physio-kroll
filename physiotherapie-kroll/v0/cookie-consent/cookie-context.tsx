"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import {
  type CookiePreferences,
  defaultPreferences,
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
} from "./cookie-types"

interface StoredConsent {
  preferences: CookiePreferences
  version: string
  timestamp: number
}

interface CookieConsentContextType {
  preferences: CookiePreferences
  hasConsented: boolean
  isLoading: boolean
  showBanner: boolean
  showSettings: boolean
  setShowBanner: (show: boolean) => void
  setShowSettings: (show: boolean) => void
  acceptAll: () => void
  rejectNonEssential: () => void
  savePreferences: (preferences: CookiePreferences) => void
  openSettings: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)
  const [hasConsented, setHasConsented] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Load consent from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (stored) {
        const parsed: StoredConsent = JSON.parse(stored)
        if (parsed.version === COOKIE_CONSENT_VERSION) {
          setPreferences(parsed.preferences)
          setHasConsented(true)
        } else {
          // Version mismatch, show banner again
          setShowBanner(true)
        }
      } else {
        setShowBanner(true)
      }
    } catch {
      setShowBanner(true)
    }
    setIsLoading(false)
  }, [])

  const saveToStorage = useCallback((prefs: CookiePreferences) => {
    const consent: StoredConsent = {
      preferences: prefs,
      version: COOKIE_CONSENT_VERSION,
      timestamp: Date.now(),
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
  }, [])

  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      externalMedia: true,
    }
    setPreferences(allAccepted)
    setHasConsented(true)
    setShowBanner(false)
    setShowSettings(false)
    saveToStorage(allAccepted)
  }, [saveToStorage])

  const rejectNonEssential = useCallback(() => {
    const essentialOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      externalMedia: false,
    }
    setPreferences(essentialOnly)
    setHasConsented(true)
    setShowBanner(false)
    setShowSettings(false)
    saveToStorage(essentialOnly)
  }, [saveToStorage])

  const savePreferences = useCallback(
    (prefs: CookiePreferences) => {
      const finalPrefs = { ...prefs, necessary: true }
      setPreferences(finalPrefs)
      setHasConsented(true)
      setShowBanner(false)
      setShowSettings(false)
      saveToStorage(finalPrefs)
    },
    [saveToStorage]
  )

  const openSettings = useCallback(() => {
    setShowBanner(true)
    setShowSettings(true)
  }, [])

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        hasConsented,
        isLoading,
        showBanner,
        showSettings,
        setShowBanner,
        setShowSettings,
        acceptAll,
        rejectNonEssential,
        savePreferences,
        openSettings,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider")
  }
  return context
}
