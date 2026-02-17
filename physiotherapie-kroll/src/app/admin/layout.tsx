import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminClientShell } from "./AdminClientShell"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import "@/styles/admin-theme.css"

export const metadata: Metadata = {
  title: "Physio Kroll - Admin",
  description: "Physio Kroll - Admin Dashboard",
  generator: "v0.app",
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    redirect("/auth/login?next=" + encodeURIComponent("/admin/pages"))
  }

  return <AdminClientShell user={userData.user}>{children}</AdminClientShell>
}

