import type React from "react"
import type { Metadata } from "next"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Physio Kroll - Admin",
  description: "Physio Kroll - Admin Dashboard",
  generator: "v0.app",
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  return <AdminLayout user={data.user ?? null}>{children}</AdminLayout>
}



