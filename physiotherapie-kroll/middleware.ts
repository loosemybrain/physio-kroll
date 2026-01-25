import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Resolve brand robustly for public pages:
  // - Legacy: /konzept/... -> physio-konzept
  // - Default: physiotherapy
  // - For slug pages (/{slug}): look up pages.brand in DB (slug is globally unique)
  let brand: "physiotherapy" | "physio-konzept" =
    pathname === "/konzept" || pathname.startsWith("/konzept/")
      ? "physio-konzept"
      : "physiotherapy";

  const isPublicSlugRoute =
    brand === "physiotherapy" &&
    pathname !== "/" &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/preview") &&
    pathname.split("/").filter(Boolean).length === 1;

  if (isPublicSlugRoute) {
    const slug = pathname.replace(/^\/+|\/+$/g, "");
    try {
      const supabasePublic = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return [];
            },
            setAll() {
              // no-op
            },
          },
        }
      );

      const { data } = await supabasePublic
        .from("pages")
        .select("brand")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (process.env.NODE_ENV === "development") {
        console.log("[middleware] brand lookup", {
          pathname,
          slug,
          dbBrand: data?.brand ?? null,
        });
      }

      if (data?.brand === "physio-konzept") {
        brand = "physio-konzept";
      } else if (data?.brand === "physiotherapy") {
        brand = "physiotherapy";
      }
    } catch {
      // If lookup fails, keep default brand
      if (process.env.NODE_ENV === "development") {
        console.log("[middleware] brand lookup failed", { pathname });
      }
    }
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
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error && process.env.NODE_ENV === "development") {
      // Avoid noisy production logs (which may include request context in some platforms).
      console.error("Middleware auth error:", error.message);
    }

    if (!session) {
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
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
