import { cn } from "@/lib/utils"
import { legalPlainTextToParagraphs } from "@/lib/legal/legalPlainTextParagraphs"
import { trimLegalRichColor } from "@/lib/legal/legalRichTextBlockColors"

export type LegalPlainTextBodyProps = {
  text: string | undefined | null
  /** Classes on the outer wrapper (omit wrapper when null and no dataCmsField — use fragment via wrapper) */
  className?: string
  classNameParagraph?: string
  /** Optional Absatzfarbe (Block `textColor`), Theme sonst. */
  textColor?: string
  /** `data-cms-field` for inline editing (whole body is one field) */
  dataCmsField?: string
}

/**
 * Renders legal plain-text body as safe `<p>` elements (React escapes text).
 */
export function LegalPlainTextBody({
  text,
  className,
  classNameParagraph,
  textColor,
  dataCmsField,
}: LegalPlainTextBodyProps) {
  const parts = legalPlainTextToParagraphs(text)
  if (parts.length === 0) return null
  const paraColor = trimLegalRichColor(textColor)

  return (
    <div
      className={cn("space-y-3", className)}
      {...(dataCmsField ? { "data-cms-field": dataCmsField } : {})}
    >
      {parts.map((para, i) => (
        <p
          key={i}
          style={paraColor ? { color: paraColor } : undefined}
          className={cn("m-0", classNameParagraph)}
        >
          {para}
        </p>
      ))}
    </div>
  )
}
