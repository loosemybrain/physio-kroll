import { NextResponse } from "next/server"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { SearchItem } from "@/lib/search/types"
import { extractSearchItemsFromBlock } from "@/lib/search/extractors.server"

/**
 * GET /api/search?q=query
 * Search published pages + gezielt extrahierte Block-Inhalte (brand-aware)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const brand = (searchParams.get("brand") || null) as BrandKey | null

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const supabase = await getSupabasePublic()

    const q = query.trim().toLowerCase()

    // 1) Pages (titelbasiert, sehr günstig)
    let pageQb = supabase
      .from("pages")
      .select("id, title, slug, brand")
      .eq("status", "published")
      .ilike("title", `%${query}%`)
      .limit(20)

    if (brand) pageQb = pageQb.eq("brand", brand)

    const { data: pageHits, error: pageErr } = await pageQb
    if (pageErr) {
      console.error("Error searching pages:", pageErr)
      return NextResponse.json([], { status: 500 })
    }

    const pageItems: SearchItem[] = (pageHits || []).map((p) => ({
      id: `page:${p.id}`,
      title: p.title,
      category: "Seiten",
      href: (p.brand === "physio-konzept" ? `/konzept/${p.slug}` : `/${p.slug}`) as string,
      brand: (p.brand ?? brand ?? "physiotherapy") as BrandKey,
      priority: p.slug === "datenschutz" || p.slug === "impressum" || p.slug === "cookies" ? 8 : 35,
    }))

    // 2) Block-Inhalte: kleine Site -> alle relevanten Blocks ziehen und gezielt extrahieren.
    //    (Kein blindes JSON-Flattening; Extractor ist pro Blocktyp.)
    let pagesQb = supabase
      .from("pages")
      .select("id, slug, brand")
      .eq("status", "published")
      .limit(200)

    if (brand) pagesQb = pagesQb.eq("brand", brand)

    const { data: pages, error: pagesErr } = await pagesQb
    if (pagesErr) {
      console.error("Error loading pages for block search:", pagesErr)
      return NextResponse.json(pageItems)
    }

    const pageById = new Map<string, { slug: string; brand: BrandKey }>()
    for (const p of pages || []) {
      if (!p?.id || !p?.slug) continue
      pageById.set(String(p.id), { slug: String(p.slug), brand: (p.brand ?? brand ?? "physiotherapy") as BrandKey })
    }

    const pageIds = (pages || []).map((p) => String(p.id))
    if (pageIds.length === 0) return NextResponse.json(pageItems)

    const { data: blocks, error: blocksErr } = await supabase
      .from("blocks")
      .select("id, page_id, type, props")
      .in("page_id", pageIds)
      .limit(2000)

    if (blocksErr) {
      console.error("Error loading blocks for search:", blocksErr)
      return NextResponse.json(pageItems)
    }

    const extracted: SearchItem[] = []
    for (const b of blocks || []) {
      const page = pageById.get(String(b.page_id))
      if (!page) continue
      extracted.push(
        ...extractSearchItemsFromBlock({
          block: { id: String(b.id), type: String(b.type), props: b.props },
          pageSlug: page.slug,
          brand: page.brand,
        })
      )
    }

    // Server-side Vorfilter: nur sinnvolle Matches zurückgeben (Ranking macht danach der Client).
    const matches = extracted.filter((it) => {
      const hay = [
        it.title,
        it.description ?? "",
        ...(it.keywords ?? []),
        it.category ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })

    // Dedup: gleiche href+title nur einmal (höchste priority gewinnt)
    const byKey = new Map<string, SearchItem>()
    for (const it of [...pageItems, ...matches]) {
      const key = `${it.href}::${it.title.toLowerCase()}`
      const prev = byKey.get(key)
      if (!prev || (it.priority ?? 0) > (prev.priority ?? 0)) byKey.set(key, it)
    }

    const out = Array.from(byKey.values())
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, 60)

    return NextResponse.json(out)
  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json([], { status: 500 })
  }
}
