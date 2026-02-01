import { CMSRenderer } from "@/components/cms/BlockRenderer";
import { getSupabasePublic } from "@/lib/supabase/serverPublic";
import type { CMSBlock } from "@/types/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CMSPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  // physiotherapy only
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabasePublic = await getSupabasePublic();

  // First, try to find the page without status filter to see if it exists (brand="physiotherapy")
  const { data: allPages, error: checkErr } = await supabasePublic
    .from("pages")
    .select("id, title, slug, status")
    .eq("slug", slug)
    .eq("brand", "physiotherapy");

  if (checkErr) {
    console.error("Error checking page existence:", checkErr);
  }

  // Now get the published page (brand="physiotherapy")
  const { data: page, error: pageErr } = await supabasePublic
    .from("pages")
    .select("id, title, slug, status")
    .eq("slug", slug)
    .eq("brand", "physiotherapy")
    .eq("status", "published")
    .single();

  if (pageErr) {
    console.error("Error fetching page:", {
      message: pageErr.message,
      details: pageErr.details,
      hint: pageErr.hint,
      code: pageErr.code,
      slug,
    });
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Fehler beim Laden</h1>
        <p className="mt-4 text-muted-foreground">
          Fehler: {pageErr.message}
          {pageErr.hint && <span className="block mt-2 text-sm">Hinweis: {pageErr.hint}</span>}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Slug: &quot;{slug}&quot;
        </p>
      </div>
    );
  }

  if (!page) {
    // Check if page exists but is not published
    const existingPage = allPages?.[0];
    if (existingPage) {
      return (
        <div className="container mx-auto py-12 px-4">
          <h1 className="text-2xl font-bold">Seite nicht veröffentlicht</h1>
          <p className="mt-4 text-muted-foreground">
            Die Seite mit dem Slug &quot;{slug}&quot; existiert, ist aber nicht veröffentlicht.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Aktueller Status: <strong>{existingPage.status}</strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Bitte setzen Sie den Status auf &quot;published&quot; im Admin-Bereich.
          </p>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
        <p className="mt-4 text-muted-foreground">
          Die Seite mit dem Slug &quot;{slug}&quot; wurde nicht gefunden.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Status: Die Seite muss den Status &quot;published&quot; haben, um angezeigt zu werden.
        </p>
      </div>
    );
  }

  const { data: blocks, error: blocksErr } = await supabasePublic
    .from("blocks")
    // Use "*" to stay compatible if DB migrations aren't applied yet
    // (explicitly selecting a missing column would error).
    .select("*")
    .eq("page_id", page.id)
    .order("sort", { ascending: true });

  if (blocksErr) {
    console.error("Error fetching blocks:", {
      message: blocksErr.message,
      details: blocksErr.details,
      hint: blocksErr.hint,
      code: blocksErr.code,
      pageId: page.id,
    });
  }

  if (blocksErr) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Fehler beim Laden</h1>
        <p className="mt-4 text-muted-foreground">Die Seite konnte nicht geladen werden.</p>
      </div>
    );
  }

  const cmsBlocks: CMSBlock[] = (blocks ?? []).map((b: any) => ({
    id: b.id,
    type: b.type,
    props: (b.props ?? {}) as any,
  }));

  return (
    <article>
      <CMSRenderer blocks={cmsBlocks} pageSlug={slug} />
    </article>
  );
}
