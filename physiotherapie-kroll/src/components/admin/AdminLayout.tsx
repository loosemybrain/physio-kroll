"use client"

import type React from "react"

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
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <AdminTopbar user={user} />
        <main className="flex-1 overflow-hidden min-h-0">{children}</main>
      </div>
    </div>
  )
}


