import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { loadUserRoles } from "@/lib/server/adminUsers"
import { UserManagementPage } from "@/components/admin/users/UserManagementPage"
import { getSupabaseAdmin } from "@/lib/supabase/admin.server"
import { toLoginRedirect } from "@/lib/auth/redirects"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect(toLoginRedirect("/admin/users"))
  }

  const adminClient = await getSupabaseAdmin()
  const roles = await loadUserRoles(adminClient, user.id)
  const isAdmin = roles.includes("admin") || roles.includes("owner")
  if (!isAdmin) {
    redirect("/auth/login?error=admin-required")
  }

  return <UserManagementPage currentUserId={user.id} canManageOwner={roles.includes("owner")} />
}

