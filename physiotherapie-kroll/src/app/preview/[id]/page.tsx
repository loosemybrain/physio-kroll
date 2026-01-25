import { CMSRenderer } from "@/components/cms/BlockRenderer"
import { PreviewBrandSetter } from "@/components/preview/PreviewBrandSetter"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { CMSBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // Should be enforced by middleware, but keep a server-side guard too.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(`/preview/${id}`)}`)
  }

  const { data: page, error: pageErr } = await supabase
    .from("pages")
    .select("id, title, slug, brand, status")
    .eq("id", id)
    .single()

  if (pageErr || !page) {
    return (
      <main className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Vorschau nicht verfügbar</h1>
        <p className="mt-4 text-muted-foreground">
          Die Seite konnte nicht geladen werden.
        </p>
        {pageErr?.message && (
          <p className="mt-2 text-sm text-muted-foreground">Fehler: {pageErr.message}</p>
        )}
      </main>
    )
  }

  const { data: blocks, error: blocksErr } = await supabase
    .from("blocks")
    // Use "*" to stay compatible if DB migrations aren't applied yet
    // (explicitly selecting a missing column would error).
    .select("*")
    .eq("page_id", page.id)
    .order("sort", { ascending: true })

  if (blocksErr) {
    return (
      <main className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Vorschau nicht verfügbar</h1>
        <p className="mt-4 text-muted-foreground">Die Blöcke konnten nicht geladen werden.</p>
        <p className="mt-2 text-sm text-muted-foreground">Fehler: {blocksErr.message}</p>
      </main>
    )
  }

  const cmsBlocks: CMSBlock[] = (blocks ?? []).map((b) => {
    // DB shape: { id, type, sort, props }. We keep typing strict (no `any`)
    // and cast to CMSBlock at the boundary.
    const candidate = {
      id: String((b as { id: unknown }).id),
      type: (b as { type: unknown }).type as CMSBlock["type"],
      props: ((b as { props?: unknown }).props ?? {}) as unknown,
    }
    return candidate as unknown as CMSBlock
  })

  const brand: BrandKey = (page.brand as BrandKey) || "physiotherapy"
  const pageSlug = (page.slug ?? "") as string

  return (
    <article>
      <PreviewBrandSetter brand={brand} />
      <CMSRenderer blocks={cmsBlocks} pageSlug={pageSlug} />
    </article>
  )
}

