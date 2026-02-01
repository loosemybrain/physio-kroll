import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/pages
 * Auth required (HttpOnly Cookies)
 * Uses anon key + RLS (no service role)
 * Query param: ?brand=physiotherapy (optional, filters pages by brand)
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  // --- Auth check (mandatory) ---
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // --- Extract brand filter from query params ---
  const url = new URL(request.url);
  const brandFilter = url.searchParams.get("brand");

  // --- Load pages ---
  let query = supabase
    .from("pages")
    .select("id, title, slug, brand, status, updated_at");

  if (brandFilter) {
    query = query.eq("brand", brandFilter);
  }

  const { data: pages, error: pagesError } = await query.order("updated_at", { ascending: false });

  if (pagesError) {
    return NextResponse.json(
      { error: pagesError.message },
      { status: 500 }
    );
  }

  // Important: return an array (client expects `any[]`)
  return NextResponse.json(pages ?? [], { status: 200 });
}
