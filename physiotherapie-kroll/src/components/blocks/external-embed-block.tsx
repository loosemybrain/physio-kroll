"use client"

import type { ExternalEmbedBlock } from "@/types/cms"
import { CmsExternalEmbedRenderer } from "@/components/cms/CmsExternalEmbedRenderer"
import { cn } from "@/lib/utils"

export type ExternalEmbedBlockProps = ExternalEmbedBlock["props"]

export function ExternalEmbedBlock({
  provider,
  embedUrl,
  title,
  description,
  className,
}: ExternalEmbedBlockProps & { className?: string }) {
  const t = title?.trim()
  const d = description?.trim()

  return (
    <div className={cn("space-y-4", className)}>
      {(t || d) && (
        <div className="space-y-2">
          {t ? <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t}</h2> : null}
          {d ? <p className="text-muted-foreground text-sm leading-relaxed">{d}</p> : null}
        </div>
      )}
      <CmsExternalEmbedRenderer provider={provider} embedUrl={embedUrl} title={t} />
    </div>
  )
}
