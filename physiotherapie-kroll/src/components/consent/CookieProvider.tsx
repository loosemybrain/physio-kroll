"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { getConsentFromDocumentCookie, setConsentCookie, type ConsentState, type ConsentCategory } from "@/lib/consent/cookie"
import { defaultConsentState } from "@/lib/consent/types"

interface CookieContextValue {
  consent: ConsentState | null
  hasConsent: (category: ConsentCategory) => boolean
  acceptAll: () => void
  rejectAll: () => void
  rejectNonEssential: () => void // Alias for rejectAll (V0 compatibility)
  setCategory: (category: ConsentCategory, value: boolean) => void
  openSettings: () => void
  closeSettings: () => void
  isSettingsOpen: boolean
  hasUserConsented: boolean // Whether user has made a choice (not just default)
  isLoading: boolean // Loading state during initial consent load
}

const CookieContext = createContext<CookieContextValue | undefined>(undefined)

interface CookieProviderProps {
  children: ReactNode
}

export function CookieProvider({ children }: CookieProviderProps) {
  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [hasUserConsented, setHasUserConsented] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load consent from cookie on mount
  useEffect(() => {
    const cookieConsent = getConsentFromDocumentCookie()
    if (cookieConsent) {
      setConsent(cookieConsent)
      setHasUserConsented(true) // User has made a choice
    } else {
      // No cookie = no consent yet, use default (only necessary)
      setConsent(defaultConsentState)
      setHasUserConsented(false)
    }
    setIsLoading(false)
  }, [])

  const updateConsent = useCallback((newConsent: ConsentState) => {
    setConsent(newConsent)
    setConsentCookie(newConsent)
    setHasUserConsented(true)
  }, [])

  const acceptAll = useCallback(() => {
    const newConsent: ConsentState = {
      v: 1,
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      externalMedia: true,
      ts: Date.now(),
    }
    updateConsent(newConsent)
    setIsSettingsOpen(false)
  }, [updateConsent])

  const rejectAll = useCallback(() => {
    const newConsent: ConsentState = {
      v: 1,
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      externalMedia: false,
      ts: Date.now(),
    }
    updateConsent(newConsent)
    setIsSettingsOpen(false)
  }, [updateConsent])

  // Alias for V0 compatibility (rejectNonEssential = rejectAll)
  const rejectNonEssential = useCallback(() => {
    rejectAll()
  }, [rejectAll])

  const setCategory = useCallback(
    (category: ConsentCategory, value: boolean) => {
      if (!consent) return
      if (category === "necessary") return // Cannot change necessary

      const newConsent: ConsentState = {
        ...consent,
        [category]: value,
        ts: Date.now(),
      }
      updateConsent(newConsent)
    },
    [consent, updateConsent]
  )

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false)
  }, [])

  const hasConsentForCategory = useCallback(
    (category: ConsentCategory): boolean => {
      if (!consent) return category === "necessary"
      if (category === "necessary") return true
      return consent[category] === true
    },
    [consent]
  )

  const value: CookieContextValue = {
    consent,
    hasConsent: hasConsentForCategory,
    acceptAll,
    rejectAll,
    rejectNonEssential,
    setCategory,
    openSettings,
    closeSettings,
    isSettingsOpen,
    hasUserConsented,
    isLoading,
  }

  return <CookieContext.Provider value={value}>{children}</CookieContext.Provider>
}

export function useCookieConsent(): CookieContextValue {
  const context = useContext(CookieContext)
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieProvider")
  }
  return context
}
