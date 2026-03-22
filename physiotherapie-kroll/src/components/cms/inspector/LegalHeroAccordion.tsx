"use client"

import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorField } from "@/components/admin/ColorField"
import { cn } from "@/lib/utils"
import type { InspectorField } from "@/cms/blocks/registry"
import type { CMSBlock } from "@/types/cms"

interface LegalHeroAccordionProps {
  block: CMSBlock
  fields: InspectorField[]
  onFieldChange: (key: string, value: unknown) => void
  renderInspectorField: (field: InspectorField, block: CMSBlock) => React.ReactNode
}

export function LegalHeroAccordion({
  block,
  fields,
  onFieldChange,
  renderInspectorField,
}: LegalHeroAccordionProps) {
  // Gruppiere Felder nach Element
  const backLinkFields = fields.filter((f) => f.key.startsWith("legalBackLink"))
  const updatedAtFields = fields.filter((f) => f.key.startsWith("legalUpdatedAt"))
  const headlineFields = fields.filter((f) => f.key === "headlineColor" || f.key === "headlineFontWeight")
  const subtitleFields = fields.filter((f) => f.key === "subtitleColor" || f.key === "subtitleFontWeight")
  const otherDesignFields = fields.filter(
    (f) =>
      !f.key.startsWith("legalBackLink") &&
      !f.key.startsWith("legalUpdatedAt") &&
      f.key !== "headlineColor" &&
      f.key !== "headlineFontWeight" &&
      f.key !== "subtitleColor" &&
      f.key !== "subtitleFontWeight"
  )

  return (
    <>
      <Separator className="my-4" />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-primary">ELEMENT-STYLING</Label>
        <Accordion
          type="single"
          collapsible
          defaultValue="backlink"
          suppressHydrationWarning
          className="w-full"
        >
          {/* Back Link Section */}
          {backLinkFields.length > 0 && (
            <AccordionItem value="backlink" className="border-border/50">
              <AccordionTrigger className="text-xs font-medium hover:no-underline">
                Rücklink (Zur Startseite)
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-2 space-y-3">
                {backLinkFields.map((field) => (
                  <div key={field.key}>{renderInspectorField(field, block)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Headline Section */}
          {headlineFields.length > 0 && (
            <AccordionItem value="headline" className="border-border/50">
              <AccordionTrigger className="text-xs font-medium hover:no-underline">
                Überschrift
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-2 space-y-3">
                {headlineFields.map((field) => (
                  <div key={field.key}>{renderInspectorField(field, block)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Subtitle Section */}
          {subtitleFields.length > 0 && (
            <AccordionItem value="subtitle" className="border-border/50">
              <AccordionTrigger className="text-xs font-medium hover:no-underline">
                Untertitel
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-2 space-y-3">
                {subtitleFields.map((field) => (
                  <div key={field.key}>{renderInspectorField(field, block)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Updated At Section */}
          {updatedAtFields.length > 0 && (
            <AccordionItem value="updatedat" className="border-border/50">
              <AccordionTrigger className="text-xs font-medium hover:no-underline">
                Aktualisiert-Angabe
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-2 space-y-3">
                {updatedAtFields.map((field) => (
                  <div key={field.key}>{renderInspectorField(field, block)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Other Design Settings */}
          {otherDesignFields.length > 0 && (
            <AccordionItem value="other" className="border-border/50">
              <AccordionTrigger className="text-xs font-medium hover:no-underline">
                Weitere Einstellungen
              </AccordionTrigger>
              <AccordionContent className="pb-3 pt-2 space-y-3">
                {otherDesignFields.map((field) => (
                  <div key={field.key}>{renderInspectorField(field, block)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </>
  )
}
