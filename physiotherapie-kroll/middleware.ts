import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname
  const host = request.headers.get("host") || ""

  response.headers.set("x-theme-scope", pathname.startsWith("/admin") ? "admin" : "public")
  response.headers.set(
    "x-brand",
    host.includes("konzept") || pathname.startsWith("/konzept") ? "physio-konzept" : "physiotherapy"
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)", "/admin/:path*"],
}