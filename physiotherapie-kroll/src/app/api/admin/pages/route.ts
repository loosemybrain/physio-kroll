import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/pages
 * Auth required (HttpOnly Cookies)
 * Uses anon key + RLS (no service role)
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();

  // --- Auth check (mandatory) ---
  const { data: sessionData, error: authError } = await supabase.auth.getSession()
  if (authError || !sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // --- Load pages ---
  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select("id, title, slug, brand, status, updated_at")
    .order("updated_at", { ascending: false });

  if (pagesError) {
    return NextResponse.json(
      { error: pagesError.message },
      { status: 500 }
    );
  }

  // Important: return an array (client expects `any[]`)
  return NextResponse.json(pages ?? [], { status: 200 });
}
