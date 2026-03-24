import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminClientShell } from "./AdminClientShell"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminMfaState } from "@/lib/auth/adminAccess"
import { toLoginRedirect } from "@/lib/auth/redirects"
import "@/styles/admin-theme.css"

export const metadata: Metadata = {
  title: "Physio Kroll - Admin",
  description: "Physio Kroll - Admin Dashboard",
  generator: "v0.app",
}

/**
 * Admin Layout - Server-side auth gating
 * 
 * Redirects unauthenticated users to /auth/login.
 * This is the only place where /admin auth is enforced.
 * Middleware does NOT redirect to avoid loops.
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    console.log("[ADMIN GATE] redirect:login", { next: "/admin/pages" })
    // Redirect to login; user will be sent back to /admin/pages after auth
    redirect(toLoginRedirect("/admin/pages"))
  }

  const mfaState = await getAdminMfaState(supabase, userData.user)
  if (!mfaState.isAdmin) {
    console.log("[ADMIN GATE] redirect:login", { reason: "admin-required" })
    redirect("/auth/login?error=admin-required")
  }
  if (!mfaState.hasTotpFactor || !mfaState.hasVerifiedTotpFactor) {
    console.log("[ADMIN GATE] redirect:setup", { next: "/admin/pages" })
    redirect("/auth/mfa/setup?next=/admin/pages")
  }
  if (mfaState.currentAal !== "aal2") {
    console.log("[ADMIN GATE] redirect:verify", { next: "/admin/pages" })
    redirect("/auth/mfa/verify?next=/admin/pages")
  }

  console.log("[ADMIN GATE] allow:admin")
  return <AdminClientShell user={userData.user}>{children}</AdminClientShell>
}

