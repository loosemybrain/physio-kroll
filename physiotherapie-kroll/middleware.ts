import { NextResponse, type NextRequest } from "next/server"

/**
 * Minimal Edge Middleware
 * - Sets x-theme-scope header (admin for /admin routes, else public)
 * - Sets x-brand header (based on host or pathname)
 * - No auth logic here (handled in app/admin/layout.tsx)
 */
export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // Set theme scope header
    const themeScope = pathname.startsWith("/admin") ? "admin" : "public"
    response.headers.set("x-theme-scope", themeScope)

    // Set brand header
    const host = request.headers.get("host")?.toLowerCase() ?? ""
    const brand =
      host.includes("konzept") || pathname.startsWith("/konzept") ? "physio-konzept" : "physiotherapy"
    response.headers.set("x-brand", brand)

    return response
  } catch (err) {
    // Fail gracefully
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Match all routes except static assets
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
}