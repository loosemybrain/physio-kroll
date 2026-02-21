"use client"

import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { TypographyInspectorSection } from "../../admin/TypographyInspectorSection"
import type { TypographySettings } from "@/lib/typography"

interface ElementTypographyAccordionProps {
  blockProps: Record<string, unknown>
  typographyElements: Array<{ id: string; label: string }>
  selectedElementId?: string | null
  accordionValue?: string | null
  onAccordionValueChange?: (v: string) => void
  onElementTypographyChange: (elementId: string, patch: TypographySettings | null) => void
}

export function ElementTypographyAccordion({
  blockProps,
  typographyElements,
  selectedElementId,
  accordionValue,
  onAccordionValueChange,
  onElementTypographyChange,
}: ElementTypographyAccordionProps) {
  return (
    <>
      <Separator className="my-4" />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-primary">ELEMENT-TYPOGRAFIE</Label>
        <Accordion
          type="single"
          collapsible
          value={accordionValue !== null ? accordionValue : selectedElementId || undefined}
          onValueChange={onAccordionValueChange ?? (() => {})}
          suppressHydrationWarning
          className="w-full"
        >
          {typographyElements.map((element) => (
            <div
              key={element.id}
              data-inspector-element={element.id}
              data-inspector-target="typography"
            >
              <AccordionItem value={element.id} className="border-border/50">
                <AccordionTrigger className="text-xs font-medium hover:no-underline">
                  {element.label}
                </AccordionTrigger>
                <AccordionContent className="pb-3 pt-2">
                  <TypographyInspectorSection
                    typography={(blockProps.typography as Record<string, TypographySettings>)?.[element.id]}
                    onChange={(typo: TypographySettings | null) => {
                      onElementTypographyChange(element.id, typo)
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </>
  )
}
