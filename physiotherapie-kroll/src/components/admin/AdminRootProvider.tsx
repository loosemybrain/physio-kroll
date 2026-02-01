"use client"

import * as React from "react"

export const AdminThemeContext = React.createContext<{
  adminTheme: "light" | "dark"
  setAdminTheme: (theme: "light" | "dark") => void
} | null>(null)

export function useAdminTheme() {
  const ctx = React.useContext(AdminThemeContext)
  if (!ctx) {
    throw new Error("useAdminTheme must be used within <AdminRootProvider>")
  }
  return ctx
}

interface AdminRootProviderProps {
  children: React.ReactNode
}

/**
 * AdminRootProvider manages the admin-scoped light/dark theme.
 * - Reads initial theme from localStorage (adminTheme, default: light)
 * - Sets data-admin-theme attribute on wrapper element
 * - Persists theme changes to localStorage
 * - Completely scoped to admin area (does not affect global theme or next-themes)
 */
export function AdminRootProvider({ children }: AdminRootProviderProps) {
  const [adminTheme, setAdminThemeState] = React.useState<"light" | "dark">("light")
  const [isMounted, setIsMounted] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Initialize from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem("adminTheme") as "light" | "dark" | null
    const initialTheme = stored || "light"
    setAdminThemeState(initialTheme)
    
    // Set attribute on wrapper after state update
    if (wrapperRef.current) {
      wrapperRef.current.setAttribute("data-admin-theme", initialTheme)
    }
    
    setIsMounted(true)
  }, [])

  const setAdminTheme = React.useCallback((theme: "light" | "dark") => {
    setAdminThemeState(theme)
    localStorage.setItem("adminTheme", theme)
    
    if (wrapperRef.current) {
      wrapperRef.current.setAttribute("data-admin-theme", theme)
    }
  }, [])

  // Create context value
  const value = React.useMemo(() => ({ adminTheme, setAdminTheme }), [adminTheme, setAdminTheme])

  // suppressHydrationWarning: Radix generiert IDs die unterschiedlich sein können zwischen SSR und Client
  // Dies ist sicher weil die IDs nicht kritisch für das Rendering sind (nur für Accessibility)
  return (
    <div ref={wrapperRef} className="admin-root" data-admin-theme={adminTheme} suppressHydrationWarning>
      <AdminThemeContext.Provider value={value}>
        {children}
      </AdminThemeContext.Provider>
    </div>
  )
}
