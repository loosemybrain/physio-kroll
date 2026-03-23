"use client"

import type { CMSBlock } from "@/types/cms"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ColorField } from "@/components/admin/ColorField"

type LegalRichTextColorProps = {
  headingColor?: string
  textColor?: string
  listColor?: string
  listMarkerColor?: string
  linkColor?: string
  linkHoverColor?: string
  backgroundColor?: string
}

export function LegalRichTextColorAccordion({
  block,
  updateSelectedProps,
}: {
  block: CMSBlock & { type: "legalRichText" }
  updateSelectedProps: (props: CMSBlock["props"]) => void
}) {
  const props = block.props as CMSBlock["props"] & LegalRichTextColorProps

  const patch = (patch: Partial<LegalRichTextColorProps>) => {
    updateSelectedProps({ ...props, ...patch } as CMSBlock["props"])
  }

  return (
    <Accordion type="single" collapsible className="w-full border-0">
      <AccordionItem value="legal-rich-colors" className="border-border/50">
        <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
          Farben (gesamter Block)
        </AccordionTrigger>
        <AccordionContent className="pb-2 pt-0">
          <p className="text-[11px] text-muted-foreground mb-3">
            Leer lassen für Theme-Standard. Gilt für Block-Überschrift, strukturierten Fließtext und Legacy-Klartext.
          </p>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5 min-w-0">
              <Label className="text-[11px] text-muted-foreground">Überschriften (Titel + Zwischenüberschriften)</Label>
              <ColorField
                className="w-full min-w-0"
                disableAlpha
                value={props.headingColor ?? ""}
                onChange={(v) => patch({ headingColor: v.trim() || undefined })}
                placeholder="Theme-Standard"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label className="text-[11px] text-muted-foreground">Fließtext / Absätze</Label>
              <ColorField
                className="w-full min-w-0"
                disableAlpha
                value={props.textColor ?? ""}
                onChange={(v) => patch({ textColor: v.trim() || undefined })}
                placeholder="Theme-Standard"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label className="text-[11px] text-muted-foreground">Listen-Text</Label>
              <ColorField
                className="w-full min-w-0"
                disableAlpha
                value={props.listColor ?? ""}
                onChange={(v) => patch({ listColor: v.trim() || undefined })}
                placeholder="Theme-Standard"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label className="text-[11px] text-muted-foreground">Listen-Marker (Bullet / Nummer)</Label>
              <ColorField
                className="w-full min-w-0"
                disableAlpha
                value={props.listMarkerColor ?? ""}
                onChange={(v) => patch({ listMarkerColor: v.trim() || undefined })}
                placeholder="Theme-Standard"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label className="text-[11px] text-muted-foreground">Links</Label>
              <ColorField
                className="w-full min-w-0"
                disableAlpha
                value={props.linkColor ?? ""}
                onChange={(v) => patch({ linkColor: v.trim() || undefined })}
                placeholder="Theme-Standard"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label className="text-[11px] text-muted-foreground">Link-Hover</Label>
              <ColorField
                className="w-full min-w-0"
                disableAlpha
                value={props.linkHoverColor ?? ""}
                onChange={(v) => patch({ linkHoverColor: v.trim() || undefined })}
                placeholder="Theme-Standard"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label className="text-[11px] text-muted-foreground">Hintergrund (Block)</Label>
              <ColorField
                className="w-full min-w-0"
                disableAlpha
                value={props.backgroundColor ?? ""}
                onChange={(v) => patch({ backgroundColor: v.trim() || undefined })}
                placeholder="Kein eigener Hintergrund"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
