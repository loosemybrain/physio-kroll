import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminGuard } from "@/lib/auth/adminGuard";

/**
 * GET /api/admin/pages
 * Auth required (HttpOnly Cookies)
 * Uses anon key + RLS (no service role)
 * Query param: ?brand=physiotherapy (optional, filters pages by brand)
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const guard = await requireAdminGuard(supabase)
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    )
  }

  // --- Extract brand filter from query params ---
  const url = new URL(request.url);
  const brandFilter = url.searchParams.get("brand");

  // --- Load pages ---
  let query = supabase
    .from("pages")
    .select("id, title, slug, brand, status, page_type, page_subtype, updated_at");

  if (brandFilter) {
    query = query.eq("brand", brandFilter);
  }

  const { data: pages, error: pagesError } = await query.order("updated_at", { ascending: false });

  if (pagesError) {
    console.error("admin pages list error:", pagesError)
    return NextResponse.json(
      { error: "Failed to load pages" },
      { status: 500 }
    );
  }

  // Map snake_case to camelCase for frontend; fallbacks for legacy rows
  const mapped = (pages ?? []).map((p: { page_type?: string | null; page_subtype?: string | null; updated_at?: string; [k: string]: unknown }) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    brand: p.brand,
    status: p.status,
    pageType: p.page_type ?? "default",
    pageSubtype: p.page_subtype ?? null,
    updatedAt: p.updated_at ?? new Date().toISOString(),
  }));

  return NextResponse.json(mapped, { status: 200 });
}
