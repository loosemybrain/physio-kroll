import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminMfaState } from "@/lib/auth/adminAccess";
import { finalizeAdminAccessVerified } from "@/lib/auth/adminAccessFinalizer";
import { writeAuditEvent } from "@/lib/admin/audit";
import { refreshSecuritySnapshot } from "@/lib/server/db/adminWrites";
import { normalizeInternalRedirectTarget } from "@/lib/auth/redirects";

export async function GET(request: NextRequest) {
  console.log("[AUTH CALLBACK] start");
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  console.log("[AUTH CALLBACK] code:present", Boolean(code));
  const next = normalizeInternalRedirectTarget(
    requestUrl.searchParams.get("next"),
    "/admin/pages"
  );
  const authError = requestUrl.searchParams.get("error")
  const authErrorDescription = requestUrl.searchParams.get("error_description")

  if (authError) {
    await writeAuditEvent({
      eventType: "auth_callback_failed",
      category: "operations",
      severity: "warning",
      outcome: "failure",
      actorUserId: null,
      targetUserId: null,
      route: "/auth/callback",
      entityType: "auth_flow",
      entityId: null,
      message: "Auth-Callback konnte nicht verarbeitet werden.",
      metadata: {
        authError,
        authErrorDescription: authErrorDescription ?? null,
      },
    })
    const reason = authErrorDescription
      ? `callback-${encodeURIComponent(authErrorDescription)}`
      : `callback-${encodeURIComponent(authError)}`
    console.log("[AUTH CALLBACK] redirect", { target: "login", reason: authError });
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
          set(name: string, value: string, options: Record<string, unknown>) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: Record<string, unknown>) {
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
      console.log("[AUTH CALLBACK] exchange:success");
      const {
        data: { user },
      } = await supabase.auth.getUser()
      let redirectPath = next
      const mfaState = await getAdminMfaState(supabase, user)
      if (user?.id) {
        await refreshSecuritySnapshot({ user, sessionClient: supabase })
      }
      if (mfaState.isAdmin) {
        if (!mfaState.hasTotpFactor || !mfaState.hasVerifiedTotpFactor) {
          redirectPath = `/auth/mfa/setup?next=${encodeURIComponent(next)}`
        } else if (mfaState.currentAal !== "aal2") {
          redirectPath = `/auth/mfa/verify?next=${encodeURIComponent(next)}`
        } else {
          // Finaler Access-Event erst dann: Admin/Owner ist berechtigt UND MFA/AAL2 ist vollstaendig erfuellt.
          await finalizeAdminAccessVerified({
            sessionClient: supabase,
            sourceRoute: "/auth/callback",
            sourceEvent: "auth_callback_completed",
            metadata: {
              source: "auth-callback",
            },
          })
        }
      }
      console.log("[AUTH CALLBACK] redirect", { next: redirectPath });
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      return response;
    }
    await writeAuditEvent({
      eventType: "auth_callback_failed",
      category: "operations",
      severity: "warning",
      outcome: "failure",
      actorUserId: null,
      targetUserId: null,
      route: "/auth/callback",
      entityType: "auth_flow",
      entityId: null,
      message: "Code-Exchange im Auth-Callback ist fehlgeschlagen.",
      metadata: {
        error: error?.message ?? "unknown",
      },
    })
    console.log("[AUTH CALLBACK] exchange:error", error?.message ?? String(error));
  }

  // If there's an error or no code, redirect to login
  console.log("[AUTH CALLBACK] redirect", { target: "login", reason: "callback-missing-code" });
  return NextResponse.redirect(new URL("/auth/login?error=callback-missing-code", request.url));
}
