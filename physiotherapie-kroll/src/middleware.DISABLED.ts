// NOT USED: Next.js middleware must live at repo root (middleware.ts).
// This file is disabled and kept for reference only.

import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // 1. Determine theme scope based on path
  const themeScope = pathname.startsWith("/admin") ? "admin" : "public"
  response.headers.set("x-theme-scope", themeScope)

  // 2. Determine brand based on hostname (primary) or path (fallback)
  let brand: "physiotherapy" | "physio-konzept" = "physiotherapy"

  // Get host from request headers (more reliable than nextUrl.hostname)
  const host = request.headers.get("host") ?? request.nextUrl.hostname ?? ""

  // Primary: Hostname-based detection (subdomain, domain)
  if (host.toLowerCase().includes("konzept")) {
    brand = "physio-konzept"
  }
  // Fallback: Path-based detection for /konzept* routes (legacy support)
  else if (pathname === "/konzept" || pathname.startsWith("/konzept/")) {
    brand = "physio-konzept"
  }

  response.headers.set("x-brand", brand)

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[middleware] host: ${host}, pathname: ${pathname}, brand: ${brand}, themeScope: ${themeScope}`
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
