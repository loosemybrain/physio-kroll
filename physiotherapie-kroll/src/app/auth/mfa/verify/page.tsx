import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getAdminMfaState } from "@/lib/auth/adminAccess"
import { normalizeInternalRedirectTarget, toLoginRedirect } from "@/lib/auth/redirects"
import { MfaVerifyClient } from "./verify-client"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function MfaVerifyPage({ searchParams }: PageProps) {
  const params = await searchParams
  const next = normalizeInternalRedirectTarget(params.next, "/admin/pages")
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(toLoginRedirect(next))
  }

  const mfaState = await getAdminMfaState(supabase, user)
  if (!mfaState.isAdmin) {
    redirect("/auth/login?error=admin-required")
  }
  if (!mfaState.hasTotpFactor || !mfaState.hasVerifiedTotpFactor) {
    redirect(`/auth/mfa/setup?next=${encodeURIComponent(next)}`)
  }
  if (mfaState.currentAal === "aal2") {
    redirect(next)
  }

  return <MfaVerifyClient nextPath={next} />
}

