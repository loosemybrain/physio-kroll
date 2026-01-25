import { getFooterServer } from "@/lib/supabase/footer.server"
import { resolveMedia } from "@/lib/cms/resolveMedia"
import { getFooterTheme } from "@/lib/theme/footerTheme"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig, FooterBlock, FooterSection } from "@/types/footer"
import Image from "next/image"
import Link from "next/link"
import { getSupabasePublic } from "@/lib/supabase/serverPublic"
import { cn } from "@/lib/utils"

interface FooterProps {
  brand: BrandKey
}

/**
 * Server Component that fetches footer config and renders it
 */
export async function Footer({ brand }: FooterProps) {
  const footerConfig = await getFooterServer(brand)
  const theme = getFooterTheme(brand)

  if (!footerConfig || footerConfig.sections.length === 0) {
    return null
  }

  // Load pages for pages blocks (only published)
  const supabase = await getSupabasePublic()
  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, title, status")
    .eq("status", "published")
    .order("title", { ascending: true })

  const pagesMap = new Map(pages?.map((p) => [p.slug, p.title]) || [])

  // Resolve all logo URLs upfront
  const resolvedLogos = new Map<string, string | null>()
  for (const section of footerConfig.sections) {
    for (const block of section.blocks) {
      if (block.type === "logo" && block.mediaId) {
        if (!resolvedLogos.has(block.mediaId)) {
          resolvedLogos.set(block.mediaId, await resolveMedia({ mediaId: block.mediaId }))
        }
      }
    }
  }
  if (footerConfig.bottomBar?.left?.type === "logo" && footerConfig.bottomBar.left.mediaId) {
    const mediaId = footerConfig.bottomBar.left.mediaId
    if (!resolvedLogos.has(mediaId)) {
      resolvedLogos.set(mediaId, await resolveMedia({ mediaId }))
    }
  }
  if (footerConfig.bottomBar?.right?.type === "logo" && footerConfig.bottomBar.right.mediaId) {
    const mediaId = footerConfig.bottomBar.right.mediaId
    if (!resolvedLogos.has(mediaId)) {
      resolvedLogos.set(mediaId, await resolveMedia({ mediaId }))
    }
  }

  return (
    <footer
      className={cn(
        "w-full border-t",
        theme.bg,
        theme.border,
        theme.text
      )}
      aria-label="Footer"
    >
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Sections */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">
          {footerConfig.sections.map((section) => (
            <FooterSection
              key={section.id}
              section={section}
              theme={theme}
              pagesMap={pagesMap}
              resolvedLogos={resolvedLogos}
            />
          ))}
        </div>

        {/* Bottom Bar */}
        {footerConfig.bottomBar?.enabled && (
          <div className={cn("mt-12 pt-8 border-t", theme.border)}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {footerConfig.bottomBar.left && (
                <div className="flex-1">
                  <FooterBlock
                    block={footerConfig.bottomBar.left}
                    theme={theme}
                    pagesMap={pagesMap}
                    resolvedLogos={resolvedLogos}
                  />
                </div>
              )}
              {footerConfig.bottomBar.right && (
                <div className="flex-1 flex justify-end">
                  <FooterBlock
                    block={footerConfig.bottomBar.right}
                    theme={theme}
                    pagesMap={pagesMap}
                    resolvedLogos={resolvedLogos}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  )
}

/**
 * Footer Section Component
 */
function FooterSection({
  section,
  theme,
  pagesMap,
  resolvedLogos,
}: {
  section: FooterSection
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
  resolvedLogos: Map<string, string | null>
}) {
  // Map span to Tailwind class (build-safe)
  const spanClassMap = {
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    6: "md:col-span-6",
  } as const

  return (
    <div className={cn(spanClassMap[section.span])}>
      {section.title && (
        <h2 className={cn("text-sm font-semibold mb-4", theme.text)}>
          {section.title}
        </h2>
      )}
      <div className="space-y-4">
        {section.blocks.map((block) => (
          <FooterBlock
            key={block.id}
            block={block}
            theme={theme}
            pagesMap={pagesMap}
            resolvedLogos={resolvedLogos}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Footer Block Component
 */
function FooterBlock({
  block,
  theme,
  pagesMap,
  resolvedLogos,
}: {
  block: FooterBlock
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
  resolvedLogos: Map<string, string | null>
}) {
  switch (block.type) {
    case "text":
      return (
        <div className={cn("text-sm whitespace-pre-line", theme.text)}>
          {block.text}
        </div>
      )

    case "links":
      return (
        <div>
          {block.title && (
            <h3 className={cn("text-sm font-semibold mb-2", theme.text)}>
              {block.title}
            </h3>
          )}
          <ul className="space-y-2">
            {block.links.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? "noopener noreferrer" : undefined}
                  className={cn(
                    "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded",
                    theme.link,
                    theme.linkHover
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )

    case "pages":
      // Filter: only show published pages in public
      const publishedSlugs = block.pageSlugs.filter((slug) => pagesMap.has(slug))

      if (publishedSlugs.length === 0) {
        return null
      }

      return (
        <div>
          {block.title && (
            <h3 className={cn("text-sm font-semibold mb-2", theme.text)}>
              {block.title}
            </h3>
          )}
          <ul className="space-y-2">
            {publishedSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/${slug}`}
                  className={cn(
                    "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded",
                    theme.link,
                    theme.linkHover
                  )}
                >
                  {pagesMap.get(slug) || slug}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )

    case "logo": {
      const logoUrl = block.mediaId || block.url
      if (!logoUrl) {
        return null
      }

      const resolvedLogoUrl = block.mediaId
        ? resolvedLogos.get(block.mediaId) || null
        : block.url

      if (!resolvedLogoUrl) {
        return null
      }

      const sizeClassMap = {
        sm: "h-9",
        md: "h-12",
        lg: "h-14",
      } as const

      const fitClass = block.fit === "cover" ? "object-cover" : "object-contain"

      const logoContent = (
        <Image
          src={resolvedLogoUrl}
          alt={block.alt || "Logo"}
          width={block.size === "sm" ? 120 : block.size === "lg" ? 200 : 160}
          height={block.size === "sm" ? 36 : block.size === "lg" ? 56 : 48}
          className={cn(fitClass, "w-auto")}
        />
      )

      if (block.href) {
        return (
          <Link
            href={block.href}
            className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            {logoContent}
          </Link>
        )
      }

      return <div>{logoContent}</div>
    }

    case "copyright":
      return (
        <div className={cn("text-xs", theme.text)}>
          {block.text}
        </div>
      )

    default:
      return null
  }
}
