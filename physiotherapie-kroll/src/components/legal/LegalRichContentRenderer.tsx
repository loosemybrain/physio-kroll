import * as React from "react"
import { cn } from "@/lib/utils"
import type { LegalRichContentBlock, LegalRichTextRun } from "@/types/cms"
import { getLegalRichListItemDomId, getLegalRichRunDomId } from "@/lib/legal/legalRichContentFactories"
import { isExternalLegalHref, sanitizeLegalLinkHref } from "@/lib/legal/sanitizeLegalLinkHref"
import { LEGAL_RICH_PREVIEW_ATTR } from "@/shared/previewBridge/legalRichPreviewAttrs"
import {
  type LegalRichTextBlockColorProps,
  buildLegalRichContentCssVars,
  legalRichContentColorClasses,
  trimLegalRichColor,
} from "@/lib/legal/legalRichTextBlockColors"

const headingTagByLevel = { 2: "h2", 3: "h3", 4: "h4", 5: "h5", 6: "h6" } as const
const headingClassByLevel = {
  2: "mt-7 mb-3 text-2xl font-semibold tracking-tight md:text-3xl [&_em]:italic [&_strong]:font-semibold",
  3: "mt-6 mb-2 text-xl font-semibold tracking-tight md:text-2xl [&_em]:italic [&_strong]:font-semibold",
  4: "mt-5 mb-2 text-lg font-semibold tracking-tight md:text-xl [&_em]:italic [&_strong]:font-semibold",
  5: "mt-4 mb-2 text-base font-semibold tracking-tight md:text-lg [&_em]:italic [&_strong]:font-semibold",
  6: "mt-4 mb-2 text-sm font-semibold tracking-tight md:text-base [&_em]:italic [&_strong]:font-semibold",
} as const

function runsHaveVisibleText(runs: LegalRichTextRun[]): boolean {
  return runs.some((r) => {
    const safe = r.link?.href ? sanitizeLegalLinkHref(r.link.href) : null
    return r.text.length > 0 || Boolean(r.link?.label?.trim()) || Boolean(safe)
  })
}

type RunRenderCtx = {
  cmsBlockId?: string
  contentBlockId: string
  previewAssistEditing?: boolean
}

function renderRun(run: LegalRichTextRun, key: string, runIndex: number, ctx: RunRenderCtx): React.ReactNode | null {
  const safeHref = run.link?.href ? sanitizeLegalLinkHref(run.link.href) : null
  const label = run.link?.label?.trim() ?? ""
  if (!run.text && !label && !safeHref) return null

  let inner: React.ReactNode = run.text || label || (safeHref ?? "")
  if (run.italic) inner = <em>{inner}</em>
  if (run.bold) inner = <strong>{inner}</strong>
  if (run.underline) inner = <u>{inner}</u>
  if (safeHref) {
    const external = isExternalLegalHref(safeHref)
    inner = (
      <a
        href={safeHref}
        className="underline-offset-2 hover:underline"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    )
  }

  const seg = previewAssistSegmentClass(ctx.previewAssistEditing)
  const preview = Boolean(ctx.cmsBlockId?.trim())
  if (!preview) {
    return (
      <span key={key} style={run.color ? { color: run.color } : undefined}>
        {inner}
      </span>
    )
  }

  const runDomId = getLegalRichRunDomId(ctx.contentBlockId, run, runIndex)
  const dataAttrs: Record<string, string> = {
    [LEGAL_RICH_PREVIEW_ATTR.runId]: runDomId,
    [LEGAL_RICH_PREVIEW_ATTR.nodeType]: "run",
    [LEGAL_RICH_PREVIEW_ATTR.blockId]: ctx.cmsBlockId!,
    [LEGAL_RICH_PREVIEW_ATTR.contentBlockId]: ctx.contentBlockId,
  }

  return (
    <span key={key} {...dataAttrs} className={cn(seg)} style={run.color ? { color: run.color } : undefined}>
      {inner}
    </span>
  )
}

function renderRuns(runs: LegalRichTextRun[], keyPrefix: string, ctx: RunRenderCtx): React.ReactNode {
  return (
    <>
      {runs.map((run, i) => renderRun(run, `${keyPrefix}-r${i}`, i, ctx))}
    </>
  )
}

function blockHasContent(block: LegalRichContentBlock): boolean {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return runsHaveVisibleText(block.runs)
    case "bulletList":
    case "orderedList":
      return block.items.some((item) => runsHaveVisibleText(item.runs))
    default:
      return false
  }
}

const linkProseDefault = "prose-a:text-primary prose-a:no-underline hover:prose-a:underline"

/** Preview-Assisted Editing: Repeater-Keys für Inspector (`contentBlocks`). */
function contentBlockRepeaterAttrs(block: LegalRichContentBlock) {
  return {
    "data-repeater-field": "contentBlocks",
    "data-repeater-item-id": block.id,
    "data-legal-rich-block-type": block.type,
  } as const
}

function previewAssistSegmentClass(previewAssistEditing?: boolean) {
  return cn(
    previewAssistEditing &&
      "cursor-pointer rounded-sm outline-1 -outline-offset-2 outline-transparent transition-[outline-color,background-color] hover:outline-primary/40 hover:bg-primary/[0.04]",
  )
}

function blockNodeDataAttrs(cmsBlockId: string | undefined, contentBlockId: string, nodeType: string) {
  const preview = Boolean(cmsBlockId?.trim())
  if (!preview) return {}
  return {
    [LEGAL_RICH_PREVIEW_ATTR.blockId]: cmsBlockId!,
    [LEGAL_RICH_PREVIEW_ATTR.contentBlockId]: contentBlockId,
    [LEGAL_RICH_PREVIEW_ATTR.nodeType]: nodeType,
  } as Record<string, string>
}

export type LegalRichContentRendererProps = {
  blocks: LegalRichContentBlock[]
  /** CMS-Block-ID (`legalRichText`) — für Preview-Marker; im öffentlichen Frontend weglassen. */
  cmsBlockId?: string
  alignment?: "left" | "center" | "justify"
  variant?: "default" | "muted"
  className?: string
  /** Nur im bearbeitbaren Live-Preview: dezente Hover-Umrandung pro adressierbarem Bereich. */
  previewAssistEditing?: boolean
  /** Blockweite Farben (optional; Theme-Fallback wenn nicht gesetzt). */
  colors?: LegalRichTextBlockColorProps
}

const alignMap = { left: "text-left", center: "text-center", justify: "text-justify hyphens-auto" }

export function LegalRichContentRenderer({
  blocks,
  cmsBlockId,
  alignment = "left",
  variant = "default",
  className,
  previewAssistEditing = false,
  colors,
}: LegalRichContentRendererProps) {
  const align = alignMap[alignment]
  const seg = previewAssistSegmentClass(previewAssistEditing)
  const c = colors ?? {}
  const hasText = Boolean(trimLegalRichColor(c.textColor))
  const hasMarker = Boolean(trimLegalRichColor(c.listMarkerColor))
  const hasLink = Boolean(trimLegalRichColor(c.linkColor))

  return (
    <div
      style={buildLegalRichContentCssVars(c)}
      className={cn(
        "prose prose-neutral dark:prose-invert mt-4 max-w-none",
        "prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground",
        !hasLink && linkProseDefault,
        "prose-a:no-underline hover:prose-a:underline",
        "prose-li:text-muted-foreground",
        !hasMarker && "prose-li:marker:text-primary",
        "prose-ul:my-3 prose-ol:my-3",
        align,
        variant === "muted" && !hasText && "prose-p:text-muted-foreground/90",
        legalRichContentColorClasses(c),
        className,
      )}
    >
      {blocks.filter(blockHasContent).map((block) => {
        const runCtx: RunRenderCtx = {
          cmsBlockId,
          contentBlockId: block.id,
          previewAssistEditing,
        }

        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={block.id}
                className={cn(!trimLegalRichColor(c.textColor) && "text-muted-foreground", "leading-relaxed whitespace-pre-wrap", seg)}
                {...contentBlockRepeaterAttrs(block)}
                {...blockNodeDataAttrs(cmsBlockId, block.id, "paragraph")}
              >
                {renderRuns(block.runs, block.id, runCtx)}
              </p>
            )
          case "heading":
            return React.createElement(
              headingTagByLevel[block.level],
              {
                key: block.id,
                className: cn(
                  headingClassByLevel[block.level],
                  !trimLegalRichColor(c.headingColor) && "text-foreground",
                  !trimLegalRichColor(c.linkColor) && "[&_a]:text-primary",
                  seg,
                ),
                ...contentBlockRepeaterAttrs(block),
                ...blockNodeDataAttrs(cmsBlockId, block.id, "heading"),
              },
              renderRuns(block.runs, block.id, runCtx),
            )
          case "bulletList": {
            const li = block.items
              .map((item, idx) => ({ item, idx }))
              .filter(({ item }) => runsHaveVisibleText(item.runs))
            if (li.length === 0) return null
            return (
              <ul
                key={block.id}
                className="list-disc pl-5"
                {...contentBlockRepeaterAttrs(block)}
                {...(cmsBlockId?.trim() ? blockNodeDataAttrs(cmsBlockId, block.id, "list") : {})}
              >
                {li.map(({ item, idx }) => {
                  const listItemDomId = getLegalRichListItemDomId(block.id, item, idx)
                  const liCtx: RunRenderCtx = { cmsBlockId, contentBlockId: block.id, previewAssistEditing }
                  return (
                    <li
                      key={listItemDomId}
                      className={cn(!trimLegalRichColor(c.listColor) && "text-muted-foreground whitespace-pre-wrap", seg)}
                      {...(cmsBlockId?.trim()
                        ? {
                            ...blockNodeDataAttrs(cmsBlockId, block.id, "listItem"),
                            [LEGAL_RICH_PREVIEW_ATTR.listItemId]: listItemDomId,
                            [LEGAL_RICH_PREVIEW_ATTR.legacyListItemId]: listItemDomId,
                          }
                        : {})}
                    >
                      {renderRuns(item.runs, `${block.id}-${listItemDomId}`, liCtx)}
                    </li>
                  )
                })}
              </ul>
            )
          }
          case "orderedList": {
            const li = block.items
              .map((item, idx) => ({ item, idx }))
              .filter(({ item }) => runsHaveVisibleText(item.runs))
            if (li.length === 0) return null
            return (
              <ol
                key={block.id}
                className="list-decimal pl-5"
                {...contentBlockRepeaterAttrs(block)}
                {...(cmsBlockId?.trim() ? blockNodeDataAttrs(cmsBlockId, block.id, "list") : {})}
              >
                {li.map(({ item, idx }) => {
                  const listItemDomId = getLegalRichListItemDomId(block.id, item, idx)
                  const liCtx: RunRenderCtx = { cmsBlockId, contentBlockId: block.id, previewAssistEditing }
                  return (
                    <li
                      key={listItemDomId}
                      className={cn(!trimLegalRichColor(c.listColor) && "text-muted-foreground whitespace-pre-wrap", seg)}
                      {...(cmsBlockId?.trim()
                        ? {
                            ...blockNodeDataAttrs(cmsBlockId, block.id, "listItem"),
                            [LEGAL_RICH_PREVIEW_ATTR.listItemId]: listItemDomId,
                            [LEGAL_RICH_PREVIEW_ATTR.legacyListItemId]: listItemDomId,
                          }
                        : {})}
                    >
                      {renderRuns(item.runs, `${block.id}-${listItemDomId}`, liCtx)}
                    </li>
                  )
                })}
              </ol>
            )
          }
          default:
            return null
        }
      })}
    </div>
  )
}
