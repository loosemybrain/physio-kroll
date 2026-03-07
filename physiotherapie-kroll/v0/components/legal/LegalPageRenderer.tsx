"use client"

import { cn } from "@/lib/utils"
import type { LegalPageConfig, LegalBlock, LegalSectionBlock } from "@/types/legal"
import { LegalPageHero } from "./LegalPageHero"
import { LegalSection } from "./LegalSection"
import { LegalTableBlock } from "./LegalTableBlock"
import { LegalInfoBox } from "./LegalInfoBox"
import { LegalContactCard } from "./LegalContactCard"
import { CookieCategoryCards } from "./CookieCategoryCards"
import { LegalDivider } from "./LegalDivider"
import { AnchorNavigation } from "./AnchorNavigation"

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface LegalPageRendererProps {
  config: LegalPageConfig
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Block Renderer                                                     */
/* ------------------------------------------------------------------ */

function renderBlock(block: LegalBlock) {
  if (block.visible === false) return null

  switch (block.type) {
    case "section":
      return <LegalSection key={block.id} {...block} />
    case "richtext":
      return (
        <div
          key={block.id}
          className={cn(
            "prose prose-neutral dark:prose-invert max-w-none",
            "prose-headings:text-foreground prose-p:text-muted-foreground",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            block.textAlign === "center" && "text-center",
            block.textAlign === "justify" && "text-justify hyphens-auto",
          )}
          style={block.textColor ? { color: block.textColor } : undefined}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      )
    case "table":
      return <LegalTableBlock key={block.id} {...block} />
    case "infobox":
      return <LegalInfoBox key={block.id} {...block} />
    case "contact-card":
      return <LegalContactCard key={block.id} {...block} />
    case "cookie-categories":
      return <CookieCategoryCards key={block.id} {...block} />
    case "divider":
      return <LegalDivider key={block.id} {...block} />
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LegalPageRenderer({ config, className }: LegalPageRendererProps) {
  const { meta, blocks, showTableOfContents, tocPosition = "inline" } = config

  // Generate anchor items from section blocks
  const anchorItems = blocks
    .filter((b): b is LegalSectionBlock => b.type === "section" && b.visible !== false)
    .map((section) => ({
      id: section.anchorId || section.id,
      label: section.headline,
      level: section.headlineSize === "h3" || section.headlineSize === "h4" ? 2 as const : 1 as const,
    }))

  const hasSidebar = showTableOfContents && tocPosition === "sidebar" && anchorItems.length > 0

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Hero */}
      <LegalPageHero
        type={meta.type}
        title={meta.title}
        subtitle={meta.subtitle}
        introText={meta.introText}
        updatedAt={meta.updatedAt}
      />

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:py-16">
        {hasSidebar ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            {/* Main content */}
            <main>
              {blocks.map(renderBlock)}
            </main>

            {/* Sidebar TOC */}
            <aside>
              <AnchorNavigation items={anchorItems} position="sidebar" />
            </aside>
          </div>
        ) : (
          <main className="mx-auto max-w-4xl">
            {/* Inline TOC */}
            {showTableOfContents && anchorItems.length > 0 && (
              <div className="mb-10">
                <AnchorNavigation items={anchorItems} position="inline" />
              </div>
            )}

            {/* Blocks */}
            {blocks.map(renderBlock)}
          </main>
        )}
      </div>
    </div>
  )
}
