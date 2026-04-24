import { PreviewBrandSetter } from "@/components/preview/PreviewBrandSetter"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { CMSBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { redirect } from "next/navigation"
import { PreviewLiveRenderer } from "./preview-live-renderer"
import { getThemePresetInlineVars } from "@/lib/theme/themePresetCss.server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ brand?: string }>
}) {
  const { id } = await params
  const sp = (await searchParams) ?? {}
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
    .maybeSingle()

  // Only real query errors should fail the preview.
  // "No row found yet" is a valid state for a new, unsaved page (draft arrives via bridge).
  if (pageErr) {
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

  let cmsBlocks: CMSBlock[] = []
  if (page) {
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

    cmsBlocks = (blocks ?? []).map((b) => {
      // DB shape: { id, type, sort, props }. We keep typing strict (no `any`)
      // and cast to CMSBlock at the boundary.
      const candidate = {
        id: String((b as { id: unknown }).id),
        type: (b as { type: unknown }).type as CMSBlock["type"],
        props: ((b as { props?: unknown }).props ?? {}) as unknown,
      }
      return candidate as unknown as CMSBlock
    })
  }

  const brandFromQuery = sp.brand === "physio-konzept" ? ("physio-konzept" as const) : sp.brand === "physiotherapy" ? ("physiotherapy" as const) : null
  const brand: BrandKey = (brandFromQuery ?? (page?.brand as BrandKey)) || "physiotherapy"
  const pageSlug = (page?.slug ?? "") as string

  // IMPORTANT: Preview runs under /preview/* (not /konzept/*), so RootLayout's html[data-brand]
  // may still be "physiotherapy" if it can't derive brand for preview requests.
  // To prevent preset flicker/wrong background, we apply the correct preset vars for the preview root here.
  const preset = await getThemePresetInlineVars(brand).catch(() => ({
    brand,
    presetId: null,
    presetName: null,
    vars: {} as Record<string, string>,
  }))
  const hasTokens = Object.keys(preset.vars).length > 0

  // Make brand authoritative for all blocks during preview to prevent client fallbacks after hydration.
  const previewBlocks: CMSBlock[] = cmsBlocks.map((b) => ({
    ...b,
    props: {
      ...(typeof b.props === "object" && b.props ? (b.props as Record<string, unknown>) : {}),
      __previewBrand: brand,
    } as Record<string, unknown>,
  } as unknown as CMSBlock))

  return (
    <article
      className={brand === "physio-konzept" ? "physio-konzept" : ""}
      data-preview-brand={brand}
      style={hasTokens ? (preset.vars as unknown as React.CSSProperties) : undefined}
    >
      <PreviewBrandSetter brand={brand} />
      <PreviewLiveRenderer pageId={String(page?.id ?? id)} initialBrand={brand} initialPageSlug={pageSlug} initialBlocks={previewBlocks} />
    </article>
  )
}

