import { cn } from "@/lib/utils"
import { LegalPlainTextBody } from "@/components/legal/LegalPlainTextBody"
import { LegalRichContentRendererPreviewGate } from "@/components/legal/LegalRichContentRendererPreviewGate"
import { legalRichTextUsesStructuredContent } from "@/lib/legal/legalRichContentFactories"
import { type LegalRichTextBlockColorProps } from "@/lib/legal/legalRichTextBlockColors"
import { legalRichHeadlineStyle, legalRichSectionSurfaceStyle } from "@/lib/legal/legalRichTextBlockColors"
import type { LegalRichContentBlock } from "@/types/cms"

const spacingTopMap = { none: "pt-0", sm: "pt-4", md: "pt-8", lg: "pt-12" }
const spacingBottomMap = { none: "pb-0", sm: "pb-4", md: "pb-8", lg: "pb-12" }
const alignMap = { left: "text-left", center: "text-center", justify: "text-justify hyphens-auto" }
const headlineSizeMap = { h2: "text-2xl md:text-3xl", h3: "text-xl md:text-2xl", h4: "text-lg md:text-xl" }

export type LegalRichTextProps = {
  headline: string
  content: string
  contentBlocks?: LegalRichContentBlock[]
  /** CMS-Block-ID — nur im Preview setzen, für `data-block-id` / feingranulare Marker. */
  cmsBlockId?: string
  alignment?: "left" | "center" | "justify"
  headlineSize?: "h2" | "h3" | "h4"
  variant?: "default" | "muted"
  spacingTop?: "none" | "sm" | "md" | "lg"
  spacingBottom?: "none" | "sm" | "md" | "lg"
  /** Blockweite Farben (optional). */
  headingColor?: string
  textColor?: string
  listColor?: string
  listMarkerColor?: string
  linkColor?: string
  linkHoverColor?: string
  backgroundColor?: string
  /** Live-Preview im Admin: Klick-Ziele für strukturierte Blöcke + dezentes Hover. */
  previewAssistEditing?: boolean
}

const HeadingTagMap = { h2: "h2", h3: "h3", h4: "h4" } as const

export function LegalRichText({
  headline,
  content,
  contentBlocks,
  cmsBlockId,
  alignment = "left",
  headlineSize = "h2",
  variant = "default",
  spacingTop = "md",
  spacingBottom = "md",
  headingColor,
  textColor,
  listColor,
  listMarkerColor,
  linkColor,
  linkHoverColor,
  backgroundColor,
  previewAssistEditing = false,
}: LegalRichTextProps) {
  const structured = legalRichTextUsesStructuredContent({ contentBlocks })
  const tag = HeadingTagMap[headlineSize ?? "h2"]
  const blockColors: LegalRichTextBlockColorProps = {
    headingColor,
    textColor,
    listColor,
    listMarkerColor,
    linkColor,
    linkHoverColor,
    backgroundColor,
  }
  const headlineStyle = legalRichHeadlineStyle(headingColor)
  const sectionSurface = legalRichSectionSurfaceStyle(backgroundColor)

  return (
    <section
      style={sectionSurface}
      className={cn(
        spacingTopMap[spacingTop ?? "md"],
        spacingBottomMap[spacingBottom ?? "md"],
        sectionSurface && "rounded-xl px-3 py-3 sm:px-4",
      )}
    >
      {tag === "h2" && (
        <h2
          data-cms-field="headline"
          style={headlineStyle}
          className={cn(
            "font-semibold tracking-tight",
            !headlineStyle && "text-foreground",
            headlineSizeMap[headlineSize ?? "h2"],
            alignMap[alignment ?? "left"],
          )}
        >
          {headline}
        </h2>
      )}
      {tag === "h3" && (
        <h3
          data-cms-field="headline"
          style={headlineStyle}
          className={cn(
            "font-semibold tracking-tight",
            !headlineStyle && "text-foreground",
            headlineSizeMap[headlineSize ?? "h2"],
            alignMap[alignment ?? "left"],
          )}
        >
          {headline}
        </h3>
      )}
      {tag === "h4" && (
        <h4
          data-cms-field="headline"
          style={headlineStyle}
          className={cn(
            "font-semibold tracking-tight",
            !headlineStyle && "text-foreground",
            headlineSizeMap[headlineSize ?? "h2"],
            alignMap[alignment ?? "left"],
          )}
        >
          {headline}
        </h4>
      )}
      {structured && contentBlocks ? (
        <LegalRichContentRendererPreviewGate
          blocks={contentBlocks}
          cmsBlockId={cmsBlockId}
          alignment={alignment}
          variant={variant}
          previewAssistEditing={previewAssistEditing}
          colors={blockColors}
        />
      ) : (
        <LegalPlainTextBody
          text={content}
          textColor={textColor}
          dataCmsField="content"
          className={cn(
            "prose prose-neutral dark:prose-invert mt-4 max-w-none",
            "prose-p:mb-0 prose-p:text-muted-foreground",
            alignMap[alignment ?? "left"],
            variant === "muted" && !textColor?.trim() && "prose-p:text-muted-foreground/90",
          )}
          classNameParagraph={cn("leading-relaxed", !textColor?.trim() && "text-muted-foreground")}
        />
      )}
    </section>
  )
}
