import type { CMSBlock, ExternalEmbedBlock } from "@/types/cms"
import { validateEmbedUrlForProvider } from "@/lib/consent/validateExternalEmbedUrl"

export type ExternalEmbedDraftIssue = { blockId: string; fieldPath: string; message: string }

/** Entwurf: ungültige Embed-URLs nicht still speichern (leere URL ist erlaubt). */
export function validateDraftExternalEmbeds(blocks: CMSBlock[]): ExternalEmbedDraftIssue[] {
  const issues: ExternalEmbedDraftIssue[] = []
  for (const b of blocks) {
    if (b.type !== "externalEmbed") continue
    const p = b.props as ExternalEmbedBlock["props"]
    const url = (p.embedUrl ?? "").trim()
    if (!url) continue
    const v = validateEmbedUrlForProvider(p.provider, url)
    if (!v.ok) {
      issues.push({ blockId: b.id, fieldPath: "embedUrl", message: v.message })
    }
  }
  return issues
}
