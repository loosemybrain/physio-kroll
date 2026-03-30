import type { CMSBlock } from "@/types/cms"
import { uuid } from "@/lib/cms/arrayOps"

type LegacyLegalTextBlock = {
  type: "heading" | "paragraph"
  id?: string
  data?: { text?: string }
  props?: { text?: string }
  text?: string
}

function isLegacyHeading(block: unknown): block is LegacyLegalTextBlock {
  return Boolean(block && typeof block === "object" && (block as { type?: unknown }).type === "heading")
}

function isLegacyParagraph(block: unknown): block is LegacyLegalTextBlock {
  return Boolean(block && typeof block === "object" && (block as { type?: unknown }).type === "paragraph")
}

function normalizeLegacyText(text: unknown): string {
  if (typeof text !== "string") return ""
  return text.replace(/\r\n/g, "\n").trim()
}

function extractLegacyText(block: unknown): string {
  if (!block || typeof block !== "object") return ""

  const anyBlock = block as {
    data?: { text?: unknown }
    props?: { text?: unknown }
    text?: unknown
  }

  // Priorität:
  // 1) data.text (klassisch alt)
  // 2) props.text (neueres System)
  // 3) text (flacher Fallback)
  const raw = anyBlock.data?.text ?? anyBlock.props?.text ?? anyBlock.text ?? ""
  if (typeof raw !== "string") return ""
  return raw.trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function wrapParagraphHtml(text: string): string {
  const normalized = normalizeLegacyText(text)
  if (!normalized) return ""
  // If it already looks like a single <p>…</p>, keep it as-is.
  if (/^\s*<p[\s>][\s\S]*<\/p>\s*$/i.test(normalized)) {
    return normalized
  }
  return `<p>${escapeHtml(normalized)}</p>`
}

function createEmptyLegalSection(title = "") {
  return {
    id: uuid(),
    type: "legalSection" as const,
    props: {
      title: normalizeLegacyText(title),
      content: "",
      spacing: "md" as const,
      containerMode: "transparent" as const,
    },
  }
}

/**
 * Migrates legacy legal heading/paragraph sequences into legalSection blocks.
 * Idempotent: if legalSection already exists, input is returned unchanged.
 *
 * Test matrix (inline):
 * A) [heading, paragraph, paragraph] -> [legalSection(title=heading, content=2x<p>)]
 * B) [paragraph, paragraph] -> [legalSection(title="", content=2x<p>)]
 * C) [heading, paragraph, image, paragraph, paragraph] -> [legalSection, image, legalSection]
 * D) [heading, image, paragraph] -> [legalSection(title only), image, legalSection(content only)]
 * E) contains legalSection -> unchanged
 * F) { type: "paragraph", props: { text: "A" } } -> correctly extracted
 * G) { type: "paragraph", text: "A" } -> correctly extracted
 */
export function migrateLegalBlocks(blocks: CMSBlock[]): CMSBlock[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return blocks
  if (blocks.some((b) => (b as { type?: string })?.type === "legalSection")) return blocks

  const result: CMSBlock[] = []
  let currentSection: ReturnType<typeof createEmptyLegalSection> | null = null

  const flush = () => {
    if (!currentSection) return
    const title = normalizeLegacyText(currentSection.props.title)
    const content = normalizeLegacyText(currentSection.props.content)
    if (!title && !content) {
      currentSection = null
      return
    }
    currentSection.props.title = title
    currentSection.props.content = content
    result.push(currentSection as unknown as CMSBlock)
    currentSection = null
  }

  const ensureSection = (title = "") => {
    if (!currentSection) currentSection = createEmptyLegalSection(title)
  }

  const appendParagraph = (text: unknown) => {
    ensureSection("")
    const html = wrapParagraphHtml(typeof text === "string" ? text : "")
    if (!html || !currentSection) return
    currentSection.props.content = `${currentSection.props.content}${html}`
  }

  for (const block of blocks) {
    const anyBlock = block as unknown

    if (isLegacyHeading(anyBlock)) {
      flush()
      currentSection = createEmptyLegalSection(normalizeLegacyText(extractLegacyText(anyBlock)))
      continue
    }

    if (isLegacyParagraph(anyBlock)) {
      // Paragraph without heading starts an implicit section with empty title.
      const text = normalizeLegacyText(extractLegacyText(anyBlock))
      appendParagraph(text)
      continue
    }

    flush()
    result.push(block)
  }

  flush()
  return result
}

export function migrateLegalBlocksForPageType(
  blocks: CMSBlock[],
  pageType: string | null | undefined,
): CMSBlock[] {
  return pageType === "legal" ? migrateLegalBlocks(blocks) : blocks
}

