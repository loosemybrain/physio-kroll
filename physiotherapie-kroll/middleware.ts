import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const brandParam = request.nextUrl.searchParams.get("brand");

  // Determine brand using brand param (for /preview), otherwise fallback to path rules
  let brand: "physiotherapy" | "physio-konzept";
  if (
    pathname.startsWith("/preview") &&
    (brandParam === "physiotherapy" || brandParam === "physio-konzept")
  ) {
    brand = brandParam;
  } else {
    brand =
      pathname === "/konzept" || pathname.startsWith("/konzept/")
        ? "physio-konzept"
        : "physiotherapy";
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-brand", brand);

  // Theme presets should only affect the public website (not the admin UI).
  // We still allow them on /preview to match website rendering.
  const themeScope =
    pathname.startsWith("/admin") || pathname.startsWith("/auth") ? "admin" : "public";
  requestHeaders.set("x-theme-scope", themeScope);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Protect /admin routes, /api/admin routes, and /preview routes
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/preview")
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({
                name,
                value,
                ...options,
              });
            });
          },
        },
      }
    );

    // Refresh session to ensure it's valid
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error && process.env.NODE_ENV === "development") {
      // Avoid noisy production logs (which may include request context in some platforms).
      console.error("Middleware auth error:", error.message);
    }

    if (error ||!user) {
      // For API routes, return 401 instead of redirect
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        );
      }

      // For page routes, redirect to login
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static asset extensions (extensible)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|xml|txt|ico|map|woff|woff2)$).*)",
  ],
};
