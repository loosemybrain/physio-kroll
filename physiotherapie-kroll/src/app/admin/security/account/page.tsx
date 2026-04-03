import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AccountSecurityClient } from "./AccountSecurityClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function AdminAccountSecurityPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?next=/admin/security/account")
  }
  return <AccountSecurityClient initialEmail={user.email ?? ""} />
}
