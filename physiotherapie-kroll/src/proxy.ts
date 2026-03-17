// NOT USED: Next.js middleware must live at repo root (middleware.ts).
// This file is disabled and kept for reference only.

import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // 1. Determine theme scope based on path
  const themeScope = pathname.startsWith("/admin") ? "admin" : "public"

  // 2. Determine brand based on hostname (primary) or path (fallback)
  let brand: "physiotherapy" | "physio-konzept" = "physiotherapy"

  // Preview iframe: Brand explizit über Query respektieren (iframe ist eigener Kontext).
  if (pathname === "/preview" || pathname.startsWith("/preview/")) {
    const qBrand = searchParams.get("brand")
    if (qBrand === "physio-konzept" || qBrand === "physiotherapy") {
      brand = qBrand
    }
  }

  // Get host from request headers (more reliable than nextUrl.hostname)
  const host = request.headers.get("host") ?? request.nextUrl.hostname ?? ""

  // Primary: Hostname-based detection (subdomain, domain)
  if (brand === "physiotherapy" && host.toLowerCase().includes("konzept")) {
    brand = "physio-konzept"
  }
  // Fallback: Path-based detection for /konzept* routes (legacy support)
  else if (brand === "physiotherapy" && (pathname === "/konzept" || pathname.startsWith("/konzept/"))) {
    brand = "physio-konzept"
  }

  // IMPORTANT:
  // Server Components (RootLayout) read *request* headers via next/headers.
  // Therefore we must forward x-brand/x-theme-scope as request headers, not only response headers.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-theme-scope", themeScope)
  requestHeaders.set("x-brand", brand)
  requestHeaders.set("x-preview", pathname === "/preview" || pathname.startsWith("/preview/") ? "1" : "0")

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Keep as response headers too (useful for debugging in dev tools)
  response.headers.set("x-theme-scope", themeScope)
  response.headers.set("x-brand", brand)
  response.headers.set("x-preview", pathname === "/preview" || pathname.startsWith("/preview/") ? "1" : "0")

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
