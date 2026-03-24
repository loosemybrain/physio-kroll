import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminMfaState } from "@/lib/auth/adminAccess";
import { normalizeInternalRedirectTarget } from "@/lib/auth/redirects";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeInternalRedirectTarget(
    requestUrl.searchParams.get("next"),
    "/admin/pages"
  );
  const authError = requestUrl.searchParams.get("error")
  const authErrorDescription = requestUrl.searchParams.get("error_description")

  if (authError) {
    const reason = authErrorDescription
      ? `callback-${encodeURIComponent(authErrorDescription)}`
      : `callback-${encodeURIComponent(authError)}`
    return NextResponse.redirect(new URL(`/auth/login?error=${reason}`, request.url))
  }

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      let redirectPath = next
      const mfaState = await getAdminMfaState(supabase, user)
      if (mfaState.isAdmin) {
        if (!mfaState.hasTotpFactor || !mfaState.hasVerifiedTotpFactor) {
          redirectPath = `/auth/mfa/setup?next=${encodeURIComponent(next)}`
        } else if (mfaState.currentAal !== "aal2") {
          redirectPath = `/auth/mfa/verify?next=${encodeURIComponent(next)}`
        }
      }
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      return response;
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL("/auth/login?error=callback-missing-code", request.url));
}
