"use client"

import { useMemo } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { BrandKey } from "@/types/navigation"
import type { FooterConfig, FooterSection, FooterBlock, FooterLink } from "@/types/footer"
import { getFooterTheme, type FooterTheme } from "@/lib/theme/footerTheme"

/* ------------------------------------------------------------------ */
/*  Span class map (Tailwind-safe static)                              */
/* ------------------------------------------------------------------ */

const spanClassMap: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FooterClientProps {
  brand: BrandKey
  footerConfig: FooterConfig
  pagesMap?: Map<string, string>
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Link resolver                                                      */
/* ------------------------------------------------------------------ */

function resolveHref(link: FooterLink, pagesMap?: Map<string, string>): string {
  if (link.type === "url" && link.href) return link.href
  if (link.type === "page" && link.pageSlug !== undefined) {
    return link.pageSlug === "" ? "/" : `/${link.pageSlug}`
  }
  return "#"
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FooterLinkItem({
  link,
  theme,
  pagesMap,
}: {
  link: FooterLink
  theme: FooterTheme
  pagesMap?: Map<string, string>
}) {
  const href = resolveHref(link, pagesMap)
  const isExternal = link.type === "url" && link.newTab

  return (
    <li>
      <Link
        href={href}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={cn(
          "inline-block rounded-md px-2 py-1 text-sm transition-colors",
          theme.link,
          theme.linkHover,
          theme.focus
        )}
      >
        {link.label}
      </Link>
    </li>
  )
}

function FooterBlockRenderer({
  block,
  theme,
  pagesMap,
}: {
  block: FooterBlock
  theme: FooterTheme
  pagesMap?: Map<string, string>
}) {
  switch (block.type) {
    case "logo":
      return (
        <div className="mb-3">
          <span className={cn("text-xl font-bold tracking-tight", theme.heading)}>
            {block.title || "PhysioPraxis"}
          </span>
        </div>
      )

    case "text":
      return (
        <div>
          {block.title && (
            <h3 className={cn("mb-3 text-sm font-semibold uppercase tracking-wider", theme.heading)}>
              {block.title}
            </h3>
          )}
          {block.content && (
            <p className={cn("text-sm leading-relaxed whitespace-pre-line", theme.mutedText)}>
              {block.content}
            </p>
          )}
        </div>
      )

    case "links":
      return (
        <div>
          {block.title && (
            <h3 className={cn("mb-3 text-sm font-semibold uppercase tracking-wider", theme.heading)}>
              {block.title}
            </h3>
          )}
          {block.links && block.links.length > 0 && (
            <ul className="flex flex-col gap-1">
              {block.links.map((link) => (
                <FooterLinkItem key={link.id} link={link} theme={theme} pagesMap={pagesMap} />
              ))}
            </ul>
          )}
        </div>
      )

    case "social":
      return (
        <div>
          {block.title && (
            <h3 className={cn("mb-3 text-sm font-semibold uppercase tracking-wider", theme.heading)}>
              {block.title}
            </h3>
          )}
          <p className={cn("text-sm", theme.mutedText)}>Social links placeholder</p>
        </div>
      )

    case "newsletter":
      return (
        <div>
          {block.title && (
            <h3 className={cn("mb-3 text-sm font-semibold uppercase tracking-wider", theme.heading)}>
              {block.title}
            </h3>
          )}
          <p className={cn("text-sm", theme.mutedText)}>Newsletter form placeholder</p>
        </div>
      )

    default:
      return null
  }
}

function FooterSectionRenderer({
  section,
  theme,
  pagesMap,
}: {
  section: FooterSection
  theme: FooterTheme
  pagesMap?: Map<string, string>
}) {
  const spanClass = spanClassMap[section.span ?? 1] || "col-span-1"

  return (
    <div className={cn(spanClass, "flex flex-col gap-4")}>
      {section.blocks.map((block) => (
        <FooterBlockRenderer key={block.id} block={block} theme={theme} pagesMap={pagesMap} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function FooterClient({ brand, footerConfig, pagesMap, className }: FooterClientProps) {
  const theme = useMemo(
    () => getFooterTheme(brand, footerConfig.design),
    [brand, footerConfig.design]
  )

  const containerEnabled = footerConfig.design?.container?.enabled
  const containerClass = footerConfig.design?.container?.className

  return (
    <footer
      className={cn(theme.bg, theme.text, theme.spacing, "w-full border-t", theme.border, className)}
      role="contentinfo"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Optional inner container panel */}
        <div
          className={cn(
            containerEnabled && "rounded-2xl border p-6 sm:p-8",
            containerEnabled && theme.border,
            containerEnabled && containerClass
          )}
        >
          {/* Grid: 4-column on lg, 2 on sm, 1 on mobile */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerConfig.sections.map((section) => (
              <FooterSectionRenderer
                key={section.id}
                section={section}
                theme={theme}
                pagesMap={pagesMap}
              />
            ))}
          </div>

          {/* Bottom bar */}
          {footerConfig.bottomBar && (
            <>
              {theme.dividerEnabled && (
                <div className={cn("mt-8 border-t", theme.divider)} />
              )}
              <div
                className={cn(
                  "flex flex-col items-center justify-between gap-3 sm:flex-row",
                  theme.dividerEnabled ? "pt-6" : "mt-8"
                )}
              >
                {footerConfig.bottomBar.left && (
                  <p className={cn("text-xs", theme.mutedText)}>{footerConfig.bottomBar.left}</p>
                )}
                {footerConfig.bottomBar.links && footerConfig.bottomBar.links.length > 0 && (
                  <nav aria-label="Footer bottom links" className="flex gap-4">
                    {footerConfig.bottomBar.links.map((link) => (
                      <Link
                        key={link.id}
                        href={resolveHref(link, pagesMap)}
                        className={cn(
                          "text-xs transition-colors",
                          theme.link,
                          theme.linkHover,
                          theme.focus
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                )}
                {footerConfig.bottomBar.right && (
                  <p className={cn("text-xs", theme.mutedText)}>{footerConfig.bottomBar.right}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
