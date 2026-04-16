import { CMSRenderer } from "@/components/cms/BlockRenderer";
import { StickyMiniToc } from "@/components/blog/StickyMiniToc";
import { CookieScanTable } from "@/components/legal/CookieScanTable";
import { getSupabasePublic } from "@/lib/supabase/serverPublic";
import { splitLeadingLegalHeroes } from "@/lib/cms/splitLeadingLegalHeroes";
import { migrateLegalBlocksForPageType } from "@/lib/cms/migrations/legalSections";
import type { CMSBlock } from "@/types/cms";
import { PopupRuntime } from "@/components/popups/PopupRuntime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BRANDS = ["physiotherapy", "physio-konzept"] as const;

export default async function CMSPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const currentBrand = "physiotherapy" as const;
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabasePublic = await getSupabasePublic();

  // First, check if page exists in current brand (any status)
  const { data: allPages, error: checkErr } = await supabasePublic
    .from("pages")
    .select("id, title, slug, status")
    .eq("slug", slug)
    .eq("brand", currentBrand);

  if (checkErr) {
    console.error("Error checking page existence:", checkErr);
  }

  // Prefer published page in current brand
  const { data: ownBrandPage, error: ownBrandErr } = await supabasePublic
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("brand", currentBrand)
    .eq("status", "published")
    .maybeSingle();

  if (ownBrandErr) {
    console.error("Error fetching page:", {
      message: ownBrandErr.message,
      details: ownBrandErr.details,
      hint: ownBrandErr.hint,
      code: ownBrandErr.code,
      slug,
    });
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Fehler beim Laden</h1>
        <p className="mt-4 text-muted-foreground">
          Fehler: {ownBrandErr.message}
          {ownBrandErr.hint && <span className="block mt-2 text-sm">Hinweis: {ownBrandErr.hint}</span>}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Slug: &quot;{slug}&quot;
        </p>
      </div>
    );
  }

  // Legal pages are shared between both brands: fallback to other brand's published legal page.
  let page = ownBrandPage;
  if (!page) {
    const { data: sharedLegalPage, error: sharedLegalErr } = await supabasePublic
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("page_type", "legal")
      .in("brand", [...BRANDS])
      .limit(1)
      .maybeSingle();
    if (sharedLegalErr) {
      console.error("Error fetching shared legal page:", {
        message: sharedLegalErr.message,
        details: sharedLegalErr.details,
        hint: sharedLegalErr.hint,
        code: sharedLegalErr.code,
        slug,
      });
      return (
        <div className="container mx-auto py-12 px-4">
          <h1 className="text-2xl font-bold">Fehler beim Laden</h1>
          <p className="mt-4 text-muted-foreground">
            Fehler: {sharedLegalErr.message}
            {sharedLegalErr.hint && <span className="block mt-2 text-sm">Hinweis: {sharedLegalErr.hint}</span>}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Slug: &quot;{slug}&quot;
          </p>
        </div>
      );
    }
    page = sharedLegalPage ?? null;
  }

  if (!page && checkErr) {
    console.error("Error fetching page:", {
      message: checkErr.message,
      details: checkErr.details,
      hint: checkErr.hint,
      code: checkErr.code,
      slug,
    });
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Fehler beim Laden</h1>
        <p className="mt-4 text-muted-foreground">
          Fehler: {checkErr.message}
          {checkErr.hint && <span className="block mt-2 text-sm">Hinweis: {checkErr.hint}</span>}
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

  const cmsBlocksRaw: CMSBlock[] = (blocks ?? []).map((b: any) => ({
    id: b.id,
    type: b.type,
    props: (b.props ?? {}) as any,
  }));

  const isCookieLegalPage =
    (page as { page_type?: string; page_subtype?: string }).page_type === "legal" &&
    (page as { page_type?: string; page_subtype?: string }).page_subtype === "cookies";

  // TOC nur auf Legal-Seiten oder Blog-Posts anzeigen, nicht auf Homepage oder normale Content-Seiten
  const pageType = (page as { page_type?: string }).page_type
  const isLegalPage = pageType === "legal";
  const cmsBlocks = migrateLegalBlocksForPageType(cmsBlocksRaw, pageType)

  const { prefix: legalHeroPrefix, rest: legalBodyBlocks } = splitLeadingLegalHeroes(cmsBlocks, isLegalPage);

  return (
    <>
    <article>
      {legalHeroPrefix.length > 0 ? (
        <div className="w-full min-w-0">
          <CMSRenderer blocks={legalHeroPrefix} pageSlug={slug} edgeToEdgeShell />
        </div>
      ) : null}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div data-article>
          {legalBodyBlocks.length > 0 ? (
            <CMSRenderer
              blocks={legalBodyBlocks}
              pageSlug={slug}
              firstBlockGlobalIndex={legalHeroPrefix.length}
            />
          ) : null}
          {isCookieLegalPage && (
            <div className="max-w-7xl">
              <CookieScanTable />
            </div>
          )}
        </div>
        <aside className="hidden lg:block">
          <StickyMiniToc disabled={!isLegalPage} />
        </aside>
      </div>
    </article>
    <PopupRuntime pageId={page.id} />
    </>
  );
}
