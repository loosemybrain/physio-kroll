import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  response.headers.set("x-theme-scope", "admin")

  const host = request.headers.get("host")?.toLowerCase() ?? ""
  const brand =
    host.includes("konzept") || pathname.startsWith("/konzept") ? "physio-konzept" : "physiotherapy"
  response.headers.set("x-brand", brand)

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}