import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for Next.js (Edge Runtime)
 * Keep it minimal and edge-safe:
 * - No Supabase SSR calls
 * - No "@/lib/*" imports
 * - No process.env that could throw
 * - Only basic request/header manipulation
 * 
 * Stronger auth gating happens in src/app/admin/layout.tsx
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // 1) Set x-theme-scope header for theme system
  const themeScope = pathname.startsWith("/admin") || pathname.startsWith("/auth") ? "admin" : "public"
  response.headers.set("x-theme-scope", themeScope)

  // 2) Determine brand (safe string checks only)
  let brand = "physiotherapy"
  const host = request.headers.get("host")?.toLowerCase() ?? ""
  if (host.includes("konzept") || pathname.startsWith("/konzept")) {
    brand = "physio-konzept"
  }
  response.headers.set("x-brand", brand)

  // 3) Admin route: minimal cookie-based pre-check
  // Full auth validation happens in admin/layout.tsx
  if (pathname.startsWith("/admin")) {
    const hasAuthCookie =
      request.cookies.has("sb-access-token") ||
      request.cookies.has("sb-refresh-token") ||
      request.cookies.has("supabase-auth-token")

    if (!hasAuthCookie) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  // 4) API /admin routes: same minimal pre-check, return 401 if no cookie
  if (pathname.startsWith("/api/admin")) {
    const hasAuthCookie =
      request.cookies.has("sb-access-token") ||
      request.cookies.has("sb-refresh-token") ||
      request.cookies.has("supabase-auth-token")

    if (!hasAuthCookie) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|xml|txt|ico|map|woff|woff2)$).*)",
  ],
}
