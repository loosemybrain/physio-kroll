import { getSupabasePublic } from "@/lib/supabase/serverPublic";
import type { CMSBlock } from "@/types/cms";
import { HomePageClient } from "@/components/home-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Homepage route - physiotherapy only
 * Loads CMS page with slug "home" and brand "physiotherapy"
 */
export default async function HomePage() {
  const supabasePublic = await getSupabasePublic();

  // Load a page with slug "home" and brand "physiotherapy"
  const { data: page, error: pageErr } = await supabasePublic
    .from("pages")
    .select("id, title, slug, status")
    .eq("slug", "home")
    .eq("brand", "physiotherapy")
    .eq("status", "published")
    .single();

  // If no "home" page exists, try empty slug
  let homePage = page;
  if (pageErr || !page) {
    const { data: emptySlugPage } = await supabasePublic
      .from("pages")
      .select("id, title, slug, status")
      .eq("slug", "")
      .eq("brand", "physiotherapy")
      .eq("status", "published")
      .single();
    
    homePage = emptySlugPage;
  }

  // If no CMS page found, show fallback
  if (!homePage) {
    return (
      <main className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Willkommen</h1>
          <p className="text-muted-foreground mb-6">
            Erstellen Sie eine Homepage im CMS mit dem Slug &quot;home&quot;.
          </p>
          <p className="text-sm text-muted-foreground">
            Gehen Sie zu <a href="/admin/pages" className="text-primary underline">Admin → Pages</a> und erstellen Sie eine neue Seite mit dem Slug &quot;home&quot;.
          </p>
        </div>
      </main>
    );
  }

  // Load blocks for the home page
  const { data: blocks, error: blocksErr } = await supabasePublic
    .from("blocks")
    // Use "*" to stay compatible if DB migrations aren't applied yet
    // (explicitly selecting a missing column would error).
    .select("*")
    .eq("page_id", homePage.id)
    .order("sort", { ascending: true });

  if (blocksErr) {
    console.error("Error fetching blocks for home page:", {
      message: blocksErr.message,
      details: blocksErr.details,
      hint: blocksErr.hint,
      code: blocksErr.code,
      pageId: homePage.id,
    });
  }

  const cmsBlocks: CMSBlock[] = (blocks ?? []).map((b: any) => ({
    id: b.id,
    type: b.type,
    props: (b.props ?? {}) as any,
  }));

  return <HomePageClient blocks={cmsBlocks} />;
}
