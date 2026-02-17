"use client"

import React, { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { AdminRootProvider } from "@/components/admin/AdminRootProvider"

export function AdminClientShell({
  user,
  children,
}: {
  user: any
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
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
