"use client"

import React, { createContext, useCallback, useContext, useState } from "react"

export type LeaveGuard = {
  isDirty: () => boolean
  requestLeave: (href: string) => void
}

type ContextValue = {
  guard: LeaveGuard | null
  setGuard: (g: LeaveGuard | null) => void
}

const AdminLeaveGuardContext = createContext<ContextValue | null>(null)

export function AdminLeaveGuardProvider({ children }: { children: React.ReactNode }) {
  const [guard, setGuard] = useState<LeaveGuard | null>(null)
  const value: ContextValue = React.useMemo(() => ({ guard, setGuard }), [guard])
  return (
    <AdminLeaveGuardContext.Provider value={value}>
      {children}
    </AdminLeaveGuardContext.Provider>
  )
}

export function useLeaveGuard(): LeaveGuard | null {
  const ctx = useContext(AdminLeaveGuardContext)
  return ctx?.guard ?? null
}

export function useSetLeaveGuard() {
  const ctx = useContext(AdminLeaveGuardContext)
  return ctx?.setGuard ?? (() => {})
}
