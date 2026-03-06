"use client"

import React, { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { AdminRootProvider } from "@/components/admin/AdminRootProvider"
import type { User } from "@supabase/supabase-js"

export function AdminClientShell({
  user,
  children,
}: {
  user: User | null
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // SSR: render placeholder until client mount to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only mount gate
    setMounted(true)
  }, [])

  if (!mounted) {
    // Minimal SSR-safe placeholder (keine Radix IDs, keine dynamic content)
    return <div className="min-h-screen" />
  }

  return (
    <AdminRootProvider>
      <AdminLayout user={user}>{children}</AdminLayout>
    </AdminRootProvider>
  )
}
