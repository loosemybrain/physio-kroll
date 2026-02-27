import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware for Next.js Edge Runtime
 * 
 * CRITICAL: Keep this minimal and edge-safe to prevent MIDDLEWARE_INVOCATION_FAILED on Vercel.
 * 
 * Edge constraints:
 * - NO imports from "@/lib" or server-only modules
 * - NO Supabase calls
 * - NO process.env access that can throw
 * - NO async external calls
 * - Sync only (no await unless internal)
 * 
 * Auth gating is in:
 * - src/app/admin/layout.tsx (server component)
 * - Individual /api/admin/* route handlers
 */
export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // Set theme scope header
    try {
      const themeScope = pathname.startsWith("/admin") ? "admin" : "public"
      response.headers.set("x-theme-scope", themeScope)
    } catch {}

    // Set brand header
    try {
      let brand = "physiotherapy"
      const host = request.headers.get("host") || ""
      if (host.toLowerCase().includes("konzept") || pathname.startsWith("/konzept")) {
        brand = "physio-konzept"
      }
      response.headers.set("x-brand", brand)
    } catch {}

    return response
  } catch (err) {
    // Fail gracefully - return unmodified response
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
}
