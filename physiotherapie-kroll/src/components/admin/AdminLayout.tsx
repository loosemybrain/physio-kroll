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

  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // suppressHydrationWarning: Radix Components generieren dynamische IDs
  // die zwischen SSR und Client unterschiedlich sein können.
  // Wrapper mit suppressHydrationWarning stellt sicher, dass dieser Mismatch ignoriert wird.
  return (
    <div className="flex h-dvh min-h-0 overflow-hidden" suppressHydrationWarning>
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <AdminTopbar user={user} />
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">{isMounted && children}</main>
      </div>
    </div>
  )
}


