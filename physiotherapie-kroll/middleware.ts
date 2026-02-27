import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for Next.js (Edge Runtime)
 * Keep it minimal and edge-safe:
 * - No Supabase SSR calls
 * - No "@/lib/*" imports
 * - No process.env that could throw
 * - Only basic request/header manipulation
 * 
 * Auth gating is handled server-side:
 * - /admin/* routes: see src/app/admin/layout.tsx
 * - /api/admin/* routes: auth checks in individual route handlers
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

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json|xml|txt|ico|map|woff|woff2)$).*)",
  ],
}
