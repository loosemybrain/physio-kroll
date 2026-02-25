"use client"

import { getFooterTheme } from "@/lib/theme/footerTheme"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { FooterConfig, FooterBlock, FooterSection } from "@/types/footer"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { resolveMediaClient } from "@/lib/cms/resolveMediaClient"

interface FooterClientProps {
  brand: BrandKey
  footerConfig: FooterConfig
  pagesMap: Map<string, string>
}

/**
 * Client Component that renders footer with brand-aware theme
 */
export function FooterClient({ brand, footerConfig, pagesMap }: FooterClientProps) {
  const theme = getFooterTheme(brand, footerConfig?.design)

  if (!footerConfig || footerConfig.sections.length === 0) {
    return null
  }

  return (
    <footer
      className={cn(
        "w-full border-t",
        theme.border,
        theme.text,
        theme.spacing.py
      )}
      aria-label="Footer"
      style={{ backgroundColor: theme.colors.bg }}
    >
      <div className="container mx-auto px-4">
        {/* Main Footer Sections */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10">
          {footerConfig.sections.map((section) => (
            <FooterSection
              key={section.id}
              section={section}
              theme={theme}
              pagesMap={pagesMap}
            />
          ))}
        </div>

        {/* Bottom Bar */}
        {footerConfig.bottomBar?.enabled && (
          <div className={cn("mt-12 pt-8", theme.bottomBar.enabled && "border-t", theme.bottomBar.class)}>
            <div className={cn("flex flex-col sm:flex-row items-center gap-4", theme.bottomBar.align)}>
              {footerConfig.bottomBar.left && (
                <div>
                  <FooterBlock
                    block={footerConfig.bottomBar.left}
                    theme={theme}
                    pagesMap={pagesMap}
                  />
                </div>
              )}
              {footerConfig.bottomBar.right && (
                <div>
                  <FooterBlock
                    block={footerConfig.bottomBar.right}
                    theme={theme}
                    pagesMap={pagesMap}
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
}: {
  section: FooterSection
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
}) {
  const spanClassMap = {
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    6: "md:col-span-6",
  } as const

  return (
    <div className={cn(spanClassMap[section.span])}>
      {section.title && (
        <h2 
          className={cn(
            "mb-4",
            theme.typography.heading.size,
            theme.typography.heading.weight,
            theme.typography.heading.font
          )}
          style={{ color: theme.colors.heading }}
        >
          {section.title}
        </h2>
      )}
      <div className={cn("space-y-4", theme.section.align)}>
        {section.blocks.map((block) => (
          <FooterBlock
            key={block.id}
            block={block}
            theme={theme}
            pagesMap={pagesMap}
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
}: {
  block: FooterBlock
  theme: ReturnType<typeof getFooterTheme>
  pagesMap: Map<string, string>
}) {
  switch (block.type) {
    case "text":
      return (
        <div 
          className={cn(
            "whitespace-pre-line",
            theme.typography.body.size,
            theme.typography.body.weight,
            theme.typography.body.font
          )}
          style={{ color: theme.colors.text }}
        >
          {block.text}
        </div>
      )

    case "links":
      return (
        <div>
          {block.title && (
            <h3 
              className={cn(
                "mb-2",
                theme.typography.heading.size,
                theme.typography.heading.weight,
                theme.typography.heading.font
              )}
              style={{ color: theme.colors.heading }}
            >
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
                    "transition-colors outline-none rounded",
                    theme.typography.body.size,
                    theme.link,
                    theme.linkHover,
                    theme.focus,
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
      if (block.pageSlugs.length === 0) {
        return null
      }

      return (
        <div>
          {block.title && (
            <h3 
              className={cn(
                "mb-2",
                theme.typography.heading.size,
                theme.typography.heading.weight,
                theme.typography.heading.font
              )}
              style={{ color: theme.colors.heading }}
            >
              {block.title}
            </h3>
          )}
          <ul className="space-y-2">
            {block.pageSlugs.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/${slug}`}
                  className={cn(
                    "transition-colors outline-none rounded",
                    theme.typography.body.size,
                    theme.link,
                    theme.linkHover,
                    theme.focus,
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
        ? resolveMediaClient({ mediaId: block.mediaId })
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
            className={cn("inline-block outline-none rounded", theme.focus)}
          >
            {logoContent}
          </Link>
        )
      }

      return <div>{logoContent}</div>
    }

    case "copyright":
      return (
        <div 
          className={cn(
            "text-xs",
            theme.typography.body.size,
            theme.typography.body.weight,
            theme.typography.body.font
          )}
          style={{ color: theme.colors.text }}
        >
          {block.text}
        </div>
      )

    default:
      return null
  }
}
