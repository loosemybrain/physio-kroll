"use client"

import { createContext, useContext, ReactNode } from "react"

interface LegalPageContextType {
  isLegalPage: boolean
}

const LegalPageContext = createContext<LegalPageContextType | undefined>(undefined)

export function LegalPageProvider({
  children,
  isLegalPage = false,
}: {
  children: ReactNode
  isLegalPage?: boolean
}) {
  return (
    <LegalPageContext.Provider value={{ isLegalPage }}>
      {children}
    </LegalPageContext.Provider>
  )
}

export function useLegalPageContext(): LegalPageContextType {
  const context = useContext(LegalPageContext)
  if (context === undefined) {
    return { isLegalPage: false }
  }
  return context
}
