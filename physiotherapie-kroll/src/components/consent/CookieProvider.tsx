"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { getConsentFromDocumentCookie, setConsentCookie, type ConsentState, type ConsentCategory } from "@/lib/consent/cookie"
import { defaultConsentState } from "@/lib/consent/types"

interface CookieContextValue {
  consent: ConsentState | null
  hasConsent: (category: ConsentCategory) => boolean
  acceptAll: () => void
  rejectAll: () => void
  rejectNonEssential: () => void
  setCategory: (category: ConsentCategory, value: boolean) => void
  openSettings: () => void
  closeSettings: () => void
  isSettingsOpen: boolean
  hasUserConsented: boolean
  isLoading: boolean
}

const CookieContext = createContext<CookieContextValue | undefined>(undefined)

interface CookieProviderProps {
  children: ReactNode
}

export function CookieProvider({ children }: CookieProviderProps) {
  const [consent, setConsent] = useState<ConsentState | null>(defaultConsentState)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [hasUserConsented, setHasUserConsented] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initialConsent = getConsentFromDocumentCookie()
    const raf = window.requestAnimationFrame(() => {
      if (initialConsent) {
        setConsent(initialConsent)
        setHasUserConsented(true)
      } else {
        setConsent(defaultConsentState)
        setHasUserConsented(false)
      }
      setIsLoading(false)
    })
    return () => window.cancelAnimationFrame(raf)
  }, [])

  const updateConsent = useCallback((newConsent: ConsentState) => {
    setConsent(newConsent)
    setConsentCookie(newConsent)
    setHasUserConsented(true)
  }, [])

  const acceptAll = useCallback(() => {
    const newConsent: ConsentState = {
      ...defaultConsentState,
      externalMedia: true,
      ts: Date.now(),
    }
    updateConsent(newConsent)
    setIsSettingsOpen(false)
  }, [updateConsent])

  const rejectAll = useCallback(() => {
    const newConsent: ConsentState = {
      ...defaultConsentState,
      externalMedia: false,
      ts: Date.now(),
    }
    updateConsent(newConsent)
    setIsSettingsOpen(false)
  }, [updateConsent])

  const rejectNonEssential = useCallback(() => {
    rejectAll()
  }, [rejectAll])

  const setCategory = useCallback(
    (category: ConsentCategory, value: boolean) => {
      if (!consent) return
      if (category === "necessary") return

      if (category !== "externalMedia") return

      const newConsent: ConsentState = {
        ...consent,
        externalMedia: value,
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
      return consent.externalMedia === true
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
