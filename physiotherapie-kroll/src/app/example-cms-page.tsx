import { getPageBySlugAndBrand } from "@/lib/supabase/queries"
import { CMSRenderer } from "@/components/cms/BlockRenderer"
import type { BrandKey } from "@/components/brand/brandAssets"

interface ExampleCMSPageProps {
  slug: string
  brand: BrandKey
}

/**
 * Example Server Component that loads a CMS page from Supabase
 * 
 * Usage:
 * <ExampleCMSPage slug="home" brand="physiotherapy" />
 */
export async function ExampleCMSPage({ slug, brand }: ExampleCMSPageProps) {
  const page = await getPageBySlugAndBrand(slug, brand)

  if (!page) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
        <p className="mt-4 text-muted-foreground">
          Die Seite mit dem Slug &quot;{slug}&quot; für Brand &quot;{brand}&quot; wurde nicht gefunden.
        </p>
      </div>
    )
  }

  return (
    <article>
      <header className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold">{page.title}</h1>
        {page.meta?.description && (
          <p className="mt-2 text-lg text-muted-foreground">{page.meta.description}</p>
        )}
      </header>
      <CMSRenderer blocks={page.blocks} />
    </article>
  )
}
