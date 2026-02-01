"use client"

import * as React from "react"

import { AdminSidebar } from "./AdminSidebar"
import { AdminTopbar } from "./AdminTopbar"
import type { User } from "@supabase/supabase-js"

type AdminLayoutProps = {
  children: React.ReactNode
  /**
   * Server-provided user (cookie/session is owned server-side).
   * Important: the client must NOT call supabase.auth.getSession().
   */
  user: User | null
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // suppressHydrationWarning: Radix Components generieren dynamische IDs
  // die zwischen SSR und Client unterschiedlich sein können.
  // Wrapper mit suppressHydrationWarning stellt sicher, dass dieser Mismatch ignoriert wird.
  return (
    <div className="flex h-screen overflow-hidden" suppressHydrationWarning>
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <AdminTopbar user={user} />
        <main className="flex-1 overflow-hidden min-h-0">{isMounted && children}</main>
      </div>
    </div>
  )
}


