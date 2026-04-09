"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { BlockSectionProps, CMSBlock, HeroBlock, CourseScheduleBlock, CourseSlot, CourseScheduleWeekday, ExternalEmbedBlock } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GradientPresetSelectContent } from "@/components/ui/GradientPresetSelectContent"
import {
  blockRegistry,
  getBlockDefinition,
  getBlockTypesForPageType,
  createServiceCard,
  createFaqItem,
  createTeamMember,
  createFeatureItem,
  createContactFormField,
  createTestimonialItem,
  createGalleryImage,
  createImageSlide,
  createOpeningHour,
  createContactInfoCard,
  createHeroAction,
  createCourseSlot,
  createLegalTableColumn,
  createLegalTableRow,
  createLegalContactLine,
  createLegalCookieCategory,
  createLegalCookieItem,
  sortInspectorFields,
  INSPECTOR_GROUP_LABELS,
  DEFAULT_GROUP_ORDER,
} from "@/cms/blocks/registry"
import type { InspectorField, InspectorFieldType } from "@/cms/blocks/registry"
import { getAvailableIconNames, getAvailableIconsWithLabels } from "@/components/icons/service-icons"
import { getByPath, setByPath } from "@/lib/cms/editorPathOps"
import { InlineFieldEditor } from "../InlineFieldEditor"
import { ImageField } from "../ImageField"
import { SectionInspectorSection } from "../SectionInspectorSection"
import { AnimationInspector } from "../AnimationInspector"
import { ContactFormInspectorSection } from "./inspectors/ContactFormInspectorSection"
import { LegalHeroAccordion } from "@/components/cms/inspector/LegalHeroAccordion"
import { LegalRichTextColorAccordion } from "@/components/cms/inspector/LegalRichTextColorAccordion"
import { validateEmbedUrlForProvider } from "@/lib/consent/validateExternalEmbedUrl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { TypographySettings } from "@/lib/typography"
import { ColorField } from "../ColorField"
import { ShadowInspector } from "../ShadowInspector"
import type { ElementShadow, ElementConfig } from "@/types/cms"
import { UniversalRepeaterInspector } from "./repeater/UniversalRepeaterInspector"
import { BUTTON_PRESET_OPTIONS } from "@/lib/buttonPresets"
import { ElementTypographyAccordion } from "../../cms/inspector/ElementTypographyAccordion"
import { InspectorCardList } from "../inspector/InspectorCardList"
import { LegalRichTextContentInspector } from "./LegalRichTextContentInspector"
import { LegalOutlinePanel } from "../legal/LegalOutlinePanel"
import { CalendarDays, ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react"
import { GRADIENT_PRESETS } from "@/lib/theme/gradientPresets"
import type { AdminPage } from "@/lib/cms/supabaseStore"
import { usePageEditorActions } from "@/hooks/usePageEditorActions"

function normalizeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[]
  if (typeof v === "string") return [v]
  if (v && typeof v === "object") {
    const rec = v as Record<string, unknown>
    const numericKeys = Object.keys(rec).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length > 0) {
      return numericKeys
        .map((k) => rec[k])
        .filter((x) => typeof x === "string") as string[]
    }
  }
  return []
}

export interface PageEditorInspectorProps {
  isNewPage: boolean
  current: AdminPage
  selectedBlock: CMSBlock | null
  selectedBlockId: string | null
  expandedRepeaterCards: Record<string, string | null>
  setExpandedRepeaterCards: React.Dispatch<React.SetStateAction<Record<string, string | null>>>
  lastAddedRepeaterRef: React.MutableRefObject<{ key: string; itemId: string } | null>
  updateSelectedProps: (nextProps: CMSBlock["props"]) => void
  updateBlockPropsById: (blockId: string, updater: (prevProps: Record<string, unknown>) => CMSBlock["props"]) => void
  removeBlock: (id: string) => void
  editorActions: ReturnType<typeof usePageEditorActions>
  confirmDeleteItem: (blockId: string, arrayPath: string, index: number) => void
  handleRemoveArrayItem: (blockId: string, arrayPath: string, index: number) => void
  setInitialLegalDefaultsActive: (val: boolean) => void
  withLiveScrollLock: (fn: () => void) => void
  save: (page: AdminPage) => Promise<AdminPage>
  setPage: (updater: (prev: AdminPage | null) => AdminPage | null) => void
  activeFieldPath: string | null
  selectedElementId: string | null
  selectField: (blockId: string, fieldPath: string) => void
  deselectElement: (blockId: string) => void
  selectElement: (blockId: string, elementId: string) => void
  fieldRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>
  isTypingRef: React.MutableRefObject<boolean>
  blockTypes: Array<{ icon: React.ElementType; label: string; type: CMSBlock["type"] }>
  moveBlock: (index: number, direction: -1 | 1) => void
  selectBlock: (id: string) => void
  activeBrandTab: Record<string, "physiotherapy" | "physio-konzept">
  setActiveBrandTab: React.Dispatch<React.SetStateAction<Record<string, "physiotherapy" | "physio-konzept">>>
  accordionValue: string | undefined
  setAccordionValue: React.Dispatch<React.SetStateAction<string | undefined>>
  /** Nur Legal-Seiten: Abschnitte per DnD sortieren (Struktur-Panel). */
  onReorderLegalSections?: (activeId: string, overId: string) => void
  /** Outline-Klick: Live-Preview zum Block scrollen (iframe postMessage). */
  onRequestPreviewScroll?: (blockId: string) => void
  /** Outline-Insert: neue legalSection an Index einfügen (nur UI). */
  onInsertLegalSectionAt?: (index: number) => void
  /** Letzte Auswahlquelle für Outline-UX (nur UI-State). */
  lastSelectionSource?: "outline" | "preview" | null
  /** Wird bei direktem Outline-Klick gesetzt. */
  onSelectionSourceChange?: (source: "outline" | "preview" | null) => void
  /** Preview-Quelle nach Auto-Expand als verarbeitet markieren. */
  onConsumePreviewSelectionSource?: () => void
  onDeleteBlockFromOutline?: (blockId: string) => void
  onDuplicateBlockFromOutline?: (blockId: string) => void
}

export function PageEditorInspector({
  isNewPage,
  current,
  selectedBlock,
  selectedBlockId,
  expandedRepeaterCards,
  setExpandedRepeaterCards,
  lastAddedRepeaterRef,
  updateSelectedProps,
  updateBlockPropsById,
  removeBlock,
  editorActions,
  confirmDeleteItem,
  handleRemoveArrayItem,
  setInitialLegalDefaultsActive,
  withLiveScrollLock,
  save,
  setPage,
  activeFieldPath,
  selectedElementId,
  selectField,
  deselectElement,
  selectElement,
  fieldRefs,
  isTypingRef,
  blockTypes,
  moveBlock,
  selectBlock,
  activeBrandTab,
  setActiveBrandTab,
  accordionValue,
  setAccordionValue,
  onReorderLegalSections,
  onRequestPreviewScroll,
  onInsertLegalSectionAt,
  lastSelectionSource,
  onSelectionSourceChange,
  onConsumePreviewSelectionSource,
  onDeleteBlockFromOutline,
  onDuplicateBlockFromOutline,
}: PageEditorInspectorProps) {
  const renderStringArrayControls = (
    block: CMSBlock,
    arrayPath: string,
    itemLabel: string,
    createItem: () => string
  ) => {
    const props = block.props as Record<string, unknown>
    const items = (getByPath(props, arrayPath) as string[]) || []

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">{itemLabel}s</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editorActions.handleAddArrayItem(block.id, arrayPath, createItem)}
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            {itemLabel} hinzufügen
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const itemFieldKey = `${arrayPath}.${index}`
            const itemFieldId = `${block.id}.${itemFieldKey}`
            const isActive = activeFieldPath === itemFieldKey
            const itemKey = `${arrayPath}-${index}-${String(item || "").substring(0, 20)}`

            const handleItemChange = (newValue: string) => {
              if (!selectedBlock) return
              isTypingRef.current = true
              const currentProps = selectedBlock.props as Record<string, unknown>
              const updatedProps = setByPath(currentProps, itemFieldKey, newValue) as CMSBlock["props"]
              updateSelectedProps(updatedProps)
              setTimeout(() => {
                isTypingRef.current = false
              }, 50)
            }

            return (
              <div
                key={itemKey}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{itemLabel} {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => editorActions.handleMoveArrayItem(block.id, arrayPath, index, index - 1)}
                      disabled={index === 0}
                      title="Nach oben"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => editorActions.handleMoveArrayItem(block.id, arrayPath, index, index + 1)}
                      disabled={index === items.length - 1}
                      title="Nach unten"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => confirmDeleteItem(block.id, arrayPath, index)}
                      title="Löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Input
                  id={itemFieldId}
                  value={item}
                  onChange={(e) => handleItemChange(e.target.value)}
                  className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}
                  placeholder={itemLabel}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /** Rendert die Feld-Controls für ein einzelnes Repeater-Item (für InspectorCardList und renderArrayItemsControls). */
  const renderOneRepeaterItemFields = (
    block: CMSBlock,
    arrayPath: string,
    index: number,
    item: Record<string, unknown>,
    itemFields: Array<{
      key: string
      label: string
      type: InspectorFieldType
      placeholder?: string
      helpText?: string
      required?: boolean
      options?: Array<{ value: string; label: string }>
    }>
  ): React.ReactNode => (
    <div className="space-y-3 pt-2 border-t border-border">
      {itemFields.map((itemField) => {
        const itemFieldKey = `${arrayPath}.${index}.${itemField.key}`
        const itemFieldValue = getByPath(item, itemField.key) ?? ""
        const itemFieldId = `${block.id}.${itemFieldKey}`
        const isActive = activeFieldPath === itemFieldKey
        const handleItemFieldChange = (newValue: unknown) => {
          if (!selectedBlock) return
          isTypingRef.current = true
          const currentProps = selectedBlock.props as Record<string, unknown>
          const updatedProps = setByPath(currentProps, itemFieldKey, newValue) as CMSBlock["props"]
          updateSelectedProps(updatedProps)
          setTimeout(() => { isTypingRef.current = false }, 50)
        }
        switch (itemField.type) {
          case "text":
            return (
              <div key={itemField.key} className="space-y-1.5">
                <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
                <Input id={itemFieldId} value={String(itemFieldValue)} onChange={(e) => handleItemFieldChange(e.target.value)} className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")} placeholder={itemField.label} />
              </div>
            )
          case "textarea":
            return (
              <div key={itemField.key} className="space-y-1.5">
                <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
                <Textarea
                  id={itemFieldId}
                  value={String(itemFieldValue)}
                  onChange={(e) => handleItemFieldChange(e.target.value)}
                  className={cn("text-sm min-h-[80px]", isActive && "ring-2 ring-primary")}
                  placeholder={itemField.placeholder ?? itemField.label}
                  rows={itemField.key === "description" ? 5 : 4}
                />
                {itemField.helpText ? <p className="text-[11px] text-muted-foreground">{itemField.helpText}</p> : null}
              </div>
            )
          case "color":
            return (
              <div key={itemField.key} className="space-y-1.5">
                <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
                <div className={cn(isActive && "ring-2 ring-primary rounded-md")}>
                  <ColorField value={String(itemFieldValue)} onChange={(v) => handleItemFieldChange(v)} placeholder={itemField.placeholder || "#rrggbb"} inputRef={(el) => { fieldRefs.current[itemFieldId] = el }} />
                </div>
              </div>
            )
          case "select":
            if (itemField.key === "type" && block.type === "contactForm") {
              const typeOptions = [{ value: "name", label: "Name" }, { value: "email", label: "E-Mail" }, { value: "phone", label: "Telefon" }, { value: "subject", label: "Betreff" }, { value: "message", label: "Nachricht" }]
              return (
                <div key={itemField.key} className="space-y-1.5">
                  <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
                  <Select value={String(itemFieldValue)} onValueChange={(v: string) => handleItemFieldChange(v)}>
                    <SelectTrigger id={itemFieldId} className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}><SelectValue placeholder="Typ wählen" /></SelectTrigger>
                    <SelectContent>{typeOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              )
            }
            const options = itemField.options ?? []
            if (options.length > 0) {
              return (
                <div key={itemField.key} className="space-y-1.5">
                  <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
                  <Select value={itemFieldValue == null || itemFieldValue === "" ? "none" : String(itemFieldValue)} onValueChange={(v) => { if (itemField.key === "rating") { if (v === "none") handleItemFieldChange(undefined); else handleItemFieldChange(Number(v)) } else handleItemFieldChange(v) }}>
                    <SelectTrigger id={itemFieldId} className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}><SelectValue placeholder={itemField.placeholder || "Auswählen"} /></SelectTrigger>
                    <SelectContent>{options.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              )
            }
            return null
          case "boolean":
            return (
              <div key={itemField.key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2">
                <div className="space-y-0.5"><Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label><p className="text-[11px] text-muted-foreground">Pflichtfeld im Formular</p></div>
                <Checkbox id={itemFieldId} checked={Boolean(itemFieldValue)} onCheckedChange={(v) => handleItemFieldChange(Boolean(v))} className={cn(isActive && "ring-2 ring-primary")} />
              </div>
            )
          case "url":
            return (
              <div key={itemField.key} className="space-y-1.5">
                <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
                <Input id={itemFieldId} type="url" value={String(itemFieldValue)} onChange={(e) => handleItemFieldChange(e.target.value)} className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")} placeholder="/path" />
              </div>
            )
          case "image":
            return (
              <ImageField key={itemField.key} id={itemFieldId} label={itemField.label} value={String(itemFieldValue)} onChange={(v) => handleItemFieldChange(v)} placeholder={itemField.placeholder} required={itemField.required} className="text-sm" isActive={isActive} />
            )
          default:
            return null
        }
      })}
    </div>
  )

  // Render array items with controls (Add/Remove/Move)
  const renderArrayItemsControls = <T extends object>(
    block: CMSBlock,
    arrayPath: string,
    itemLabel: string,
    getItemLabel: (item: T, index: number) => string,
    createItem: () => T,
    itemFields: Array<{
      key: string
      label: string
      type: InspectorFieldType
      placeholder?: string
      helpText?: string
      required?: boolean
      options?: Array<{ value: string; label: string }>
    }>,
    minItems?: number,
    maxItems?: number
  ) => {
    const props = block.props as Record<string, unknown>
    const items = (getByPath(props, arrayPath) as T[]) || []
    const canAdd = typeof maxItems === "number" ? items.length < maxItems : true
    const canRemove = typeof minItems === "number" ? items.length > minItems : true

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">{itemLabel}s</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => editorActions.handleAddArrayItem(block.id, arrayPath, createItem)}
            className="gap-1"
            disabled={!canAdd}
          >
            <Plus className="h-3 w-3" />
            {itemLabel} hinzufügen
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={(item as { id?: string }).id || index}
              className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{getItemLabel(item, index)}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => editorActions.handleMoveArrayItem(block.id, arrayPath, index, index - 1)}
                    disabled={index === 0}
                    title="Nach oben"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => editorActions.handleMoveArrayItem(block.id, arrayPath, index, index + 1)}
                    disabled={index === items.length - 1}
                    title="Nach unten"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => confirmDeleteItem(block.id, arrayPath, index)}
                    title="Löschen"
                    disabled={!canRemove}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {renderOneRepeaterItemFields(block, arrayPath, index, item as Record<string, unknown>, itemFields)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Heuristik: Erkennt Bildfelder automatisch anhand des Feldnamens
  const isImageField = (fieldKey: string, value: unknown): boolean => {
    const imagePattern = /(image|img|logo|avatar|thumbnail|background|bg|heroImage|cover|mediaUrl)/i
    return imagePattern.test(fieldKey) && (typeof value === "string" || value === null || value === "")
  }

  const renderInspectorField = (field: InspectorField, block: CMSBlock) => {
    const fieldKey = `${block.id}.${field.key}`
    const props = block.props as Record<string, unknown>
    // Support nested paths like "trustItems.0" or "cards.0.title"
    const value = getByPath(props, field.key) ?? ""

    const handleChange = (newValue: unknown) => {
      if (!selectedBlock) return
      // Mark as typing to prevent focus stealing
      isTypingRef.current = true
      // Always use latest block props from page state (avoids stale props e.g. gallery losing images on layout change)
      updateBlockPropsById(selectedBlock.id, (currentProps) =>
        setByPath(currentProps, field.key, newValue) as CMSBlock["props"]
      )
      setTimeout(() => {
        isTypingRef.current = false
      }, 50)
    }

    const handleClearField = () => {
      if (field.required || !selectedBlock) return
      handleChange(undefined)
    }

  const isActive = activeFieldPath === field.key

  // Automatische Erkennung: Wenn field.type === "image" ODER Heuristik true
  // ABER: Expliziter field.type hat IMMER Priorität. Heuristik greift nur bei fehlender Klassifizierung.
  const knownTypes = ["text", "textarea", "color", "select", "url", "image", "checkbox", "number", "date"]
  const shouldRenderAsImage = field.type === "image" || (knownTypes.indexOf(field.type as string) === -1 && isImageField(field.key, value))

  switch (shouldRenderAsImage ? "image" : field.type) {
    case "text":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Input
              id={fieldKey}
              ref={(el) => {
                fieldRefs.current[fieldKey] = el
              }}
              value={String(value)}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              className={cn("flex-1", isActive && "ring-2 ring-primary")}
            />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "textarea":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Textarea
              id={fieldKey}
              ref={(el) => {
                fieldRefs.current[fieldKey] = el
              }}
              value={String(value)}
              onChange={(e) => {
                isTypingRef.current = true
                handleChange(e.target.value)
                setTimeout(() => {
                  isTypingRef.current = false
                }, 100)
              }}
              onFocus={() => {
                isTypingRef.current = true
              }}
              onBlur={() => {
                isTypingRef.current = false
              }}
              placeholder={field.placeholder}
              rows={field.key === "content" ? 8 : field.key === "introText" ? 6 : 4}
              className={cn("flex-1", isActive && "ring-2 ring-primary")}
            />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center self-start mt-10"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "color":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <div className={cn("flex-1", isActive && "ring-2 ring-primary rounded-md")}>
              <ColorField
                value={String(value)}
                onChange={(v) => handleChange(v)}
                placeholder={field.placeholder || "#rrggbb"}
                inputRef={(el) => {
                  fieldRefs.current[fieldKey] = el
                }}
              />
            </div>
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "select": {
      // Wichtig: Radix Select darf kein value="" in SelectItem haben.
      // Außerdem: Select.value sollte bei leerem Wert undefined sein (damit Placeholder greift)
      const safeValue = value == null || value === "" ? undefined : String(value)
      const options =
        field.options
          ?.filter((o) => o.value !== "" && o.value != null)
          .map((o) => ({ value: String(o.value), label: o.label })) ?? []

      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Select value={safeValue} onValueChange={(v: string) => handleChange(v)}>
              <SelectTrigger
                id={fieldKey}
                ref={(el) => {
                  fieldRefs.current[fieldKey] = el as HTMLSelectElement | null
                }}
                className={cn("flex-1", isActive && "ring-2 ring-primary")}
              >
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )
    }

    case "url":
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex gap-2">
            <Input
              id={fieldKey}
              ref={(el) => {
                fieldRefs.current[fieldKey] = el
              }}
              type="url"
              value={String(value)}
              onChange={(e) => {
                isTypingRef.current = true
                handleChange(e.target.value)
                setTimeout(() => {
                  isTypingRef.current = false
                }, 100)
              }}
              onFocus={() => {
                isTypingRef.current = true
              }}
              onBlur={() => {
                isTypingRef.current = false
              }}
              placeholder={field.placeholder}
              className={cn("flex-1", isActive && "ring-2 ring-primary")}
            />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-10 w-10 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    case "image":
      return (
        <div key={field.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <div />
            {!field.required && (
              <button
                type="button"
                onClick={handleClearField}
                className="h-8 w-8 px-0 text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                title="Löschen"
              >
                ✕
              </button>
            )}
          </div>
          <ImageField
            id={fieldKey}
            label={field.label}
            value={String(value)}
            onChange={(v) => {
              isTypingRef.current = true
              handleChange(v)
              setTimeout(() => {
                isTypingRef.current = false
              }, 100)
            }}
            placeholder={field.placeholder}
            required={field.required}
            helpText={field.helpText}
            isActive={isActive}
            inputRef={(el) => {
              fieldRefs.current[fieldKey] = el
            }}
          />
        </div>
      )

    case "boolean":
      return (
        <div key={field.key} className="flex items-center space-x-2">
          <Checkbox id={fieldKey} checked={Boolean(value)} onCheckedChange={(checked) => handleChange(checked)} />
          <Label htmlFor={fieldKey} className="cursor-pointer">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      )

    default:
      return null
  }
}

  return (
    <>
      {isNewPage && (
        <>
          <div className="p-4 border-b border-border bg-primary/5">
            <div className="mb-2">
              <div className="text-sm font-semibold text-foreground">Brand für neue Seite</div>
              <p className="text-xs text-muted-foreground">
                Bitte auswählen – beeinflusst Block-Defaults (z.B. Hero-Mood) und die Seite wird entsprechend markiert.
              </p>
            </div>
            <Tabs value={current.brand || "physiotherapy"} onValueChange={(v) => editorActions.handlePageBrandChange(v as BrandKey)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="physiotherapy" onClick={() => editorActions.handlePageBrandChange("physiotherapy")}>
                  Physiotherapie
                </TabsTrigger>
                <TabsTrigger value="physio-konzept" onClick={() => editorActions.handlePageBrandChange("physio-konzept")}>
                  PhysioKonzept
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Separator />
        </>
      )}

      <div className="p-4">
        <h3 className="mb-4 font-semibold text-foreground">Add Blocks</h3>
        {(() => {
          const pageType = current.pageType ?? "default"
          const allowedTypes = getBlockTypesForPageType(pageType)
          const legalPickerWhitelist: Array<CMSBlock["type"]> = [
            "legalHero",
            "legalSection",
            "legalRichText",
            "legalTable",
            "legalInfoBox",
            "legalCookieCategories",
            "legalContactCard",
          ]
          const isLegal = pageType === "legal"
          const pickerBlockTypes = blockTypes.filter((bt) => {
            if (bt.type === "courseSchedule") return false
            if (!allowedTypes.includes(bt.type)) return false
            if (!isLegal) return true
            return legalPickerWhitelist.includes(bt.type)
          })
          const showCourseSchedule = allowedTypes.includes("courseSchedule")
          const count = pickerBlockTypes.length + (showCourseSchedule ? 1 : 0)
          return (
            <>
              {isLegal && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Für Rechtlich-Seiten stehen nur rechtlich passende Blocktypen zur Verfügung.
                </p>
              )}
              {!isLegal && count < blockTypes.length && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Für diesen Seitentyp sind nur bestimmte Blocktypen verfügbar.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {pickerBlockTypes.map((blockType) => {
                  const Icon = blockType.icon
                  return (
                    <Button
                      key={blockType.type}
                      variant="outline"
                      className="h-auto flex-col gap-2 py-4 bg-transparent"
                      onClick={() => editorActions.addBlock(blockType.type)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{blockType.label}</span>
                    </Button>
                  )
                })}
                {showCourseSchedule && (
                  <>
                    <Button
                      key="courseSchedule-calendar"
                      variant="outline"
                      className="h-auto flex-col gap-2 py-4 bg-transparent"
                      onClick={() => editorActions.addBlock("courseSchedule")}
                    >
                      <CalendarDays className="h-5 w-5" />
                      <span className="text-xs">Kursplan</span>
                    </Button>
                  </>
                )}
              </div>
              {count === 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Für diesen Seitentyp sind aktuell keine Blöcke zum Hinzufügen verfügbar.
                </p>
              )}
            </>
          )
        })()}
      </div>

      <Separator />

      {(current.pageType ?? "default") !== "legal" && current.blocks.length > 0 && (
        <div className="p-4 border-b border-border">
          <h3 className="mb-3 font-semibold text-foreground text-sm">Block-Liste</h3>
          <div className="space-y-1">
            {current.blocks.map((block, index) => {
              const blockDefinition = getBlockDefinition(block.type)
              const blockLabel = blockDefinition.label || block.type
              const isFirst = index === 0
              const isLast = index === current.blocks.length - 1

              return (
                <div
                  key={block.id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                    selectedBlockId === block.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50 cursor-pointer"
                  )}
                  onClick={() => selectBlock(block.id)}
                >
                  <span className="flex-1 truncate">{blockLabel}</span>
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        moveBlock(index, -1)
                      }}
                      disabled={isFirst}
                      title="Nach oben"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        moveBlock(index, 1)
                      }}
                      disabled={isLast}
                      title="Nach unten"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(current.pageType ?? "default") === "legal" && onReorderLegalSections ? (
        <LegalOutlinePanel
          blocks={current.blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={selectBlock}
          onInsertLegalSectionAt={onInsertLegalSectionAt}
          onRequestPreviewScroll={onRequestPreviewScroll}
          selectionSource={lastSelectionSource}
          onSelectionSourceChange={onSelectionSourceChange}
          onConsumePreviewSelectionSource={onConsumePreviewSelectionSource}
          onReorder={onReorderLegalSections}
          onDeleteBlock={onDeleteBlockFromOutline}
          onDuplicateBlock={onDuplicateBlockFromOutline}
        />
      ) : null}

      <Separator />

      {selectedBlock && (
        <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {blockRegistry[selectedBlock.type]?.label || selectedBlock.type} · Block Settings
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeBlock(selectedBlock.id)}
                  aria-label="Remove block"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <SectionInspectorSection
                brand={current.brand || "physiotherapy"}
                section={((selectedBlock.props as Record<string, unknown>)?.section as unknown) as BlockSectionProps | undefined}
                onChange={(nextSection) => {
                  const nextProps = {
                    ...(selectedBlock.props as Record<string, unknown>),
                    section: nextSection,
                  } as CMSBlock["props"]
                  updateSelectedProps(nextProps)
                }}
                onApplyPreset={(nextSection) => {
                  if (!selectedBlock) return
                  setInitialLegalDefaultsActive(false)
                  const nextProps = {
                    ...(selectedBlock.props as Record<string, unknown>),
                    section: nextSection,
                  } as CMSBlock["props"]

                  const nextPage = {
                    ...current,
                    blocks: current.blocks.map((b) =>
                      b.id === selectedBlock.id ? ({ ...b, props: nextProps } as CMSBlock) : b
                    ),
                  }

                  // Update state + persist immediately (1-click requirement)
                  withLiveScrollLock(() => setPage(() => nextPage))
                  void save(nextPage)
                }}
                onApplyPresetBackgroundOnly={(nextSection) => {
                  if (!selectedBlock) return
                  setInitialLegalDefaultsActive(false)
                  const nextProps = {
                    ...(selectedBlock.props as Record<string, unknown>),
                    section: nextSection,
                  } as CMSBlock["props"]

                  const nextPage = {
                    ...current,
                    blocks: current.blocks.map((b) =>
                      b.id === selectedBlock.id ? ({ ...b, props: nextProps } as CMSBlock) : b
                    ),
                  }

                  withLiveScrollLock(() => setPage(() => nextPage))
                  void save(nextPage)
                }}
              />

              {/* ContactForm Inspector Section */}
              {selectedBlock.type === "contactForm" && (
                <>
                  <ContactFormInspectorSection
                    selectedBlock={selectedBlock}
                    selectedBlockId={selectedBlockId}
                    updateBlockPropsById={updateBlockPropsById}
                    fieldRefs={fieldRefs}
                    isTypingRef={isTypingRef}
                  />
                  <Separator />
                </>
              )}

              {/* Animation Inspector */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold mb-4">Animationen</h3>
                <AnimationInspector
                  config={(((selectedBlock.props as Record<string, unknown>)?.section as unknown) as BlockSectionProps | undefined)?.animation || {
                    enabled: false,
                  }}
                  onChange={(nextAnimation) => {
                    const currentSection = ((selectedBlock.props as Record<string, unknown>)?.section as unknown) as BlockSectionProps | undefined
                    const nextSection: BlockSectionProps = {
                      layout: currentSection?.layout ?? { width: "contained", paddingY: "lg" },
                      background: currentSection?.background ?? { type: "none", parallax: false },
                      animation: nextAnimation,
                    }
                    const nextProps = {
                      ...(selectedBlock.props as Record<string, unknown>),
                      section: nextSection,
                    } as CMSBlock["props"]
                    updateSelectedProps(nextProps)
                  }}
                />
              </div>              <Separator />

              {/* Global Element Shadow Inspector (nur wenn Element Shadow unterstützt) */}
              {selectedElementId && selectedBlock.type !== "section" && (() => {
                const def = getBlockDefinition(selectedBlock.type)
                const elementDef = def?.elements?.find((e: any) => e?.id === selectedElementId) ?? null
                const elementShadowConfig =
                  ((selectedBlock.props as Record<string, unknown>)?.elements as Record<string, ElementConfig> | undefined)?.[
                    selectedElementId
                  ]?.style?.shadow

                const shouldShowShadow = Boolean((elementDef as any)?.supportsShadow)
                if (!shouldShowShadow) return null
                return (
                  <>
                    <div className="space-y-3">
                    <h3 className="text-sm font-semibold mb-4">Shadow</h3>
                      <ShadowInspector
                        config={elementShadowConfig}
                        onChange={(shadowConfig) => {
                          const currentElements = ((selectedBlock.props as Record<string, unknown>)?.elements ?? {}) as Record<string, ElementConfig>
                          const currentElement = currentElements[selectedElementId] ?? { style: {} }
                          const nextElement: ElementConfig = {
                            ...currentElement,
                            style: {
                              ...currentElement.style,
                              shadow: shadowConfig,
                            },
                          }
                          const nextElements = {
                            ...currentElements,
                            [selectedElementId]: nextElement,
                          }
                          const updatedProps = setByPath(selectedBlock.props as Record<string, unknown>, "elements", nextElements) as CMSBlock["props"]
                          updateSelectedProps(updatedProps)
                        }}
                        onClose={() => deselectElement(selectedBlockId || "")}
                      />
                    </div>
                    <Separator />
                  </>
                )
              })()}

              {/* Inner Panel (Container) – for all blocks with enableInnerPanel (FAQ, courseSchedule, team, etc.) */}
              {getBlockDefinition(selectedBlock.type)?.enableInnerPanel && (
                <>
                  <Separator />
                  <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
                    <Label className="text-xs font-semibold text-primary">CONTAINER (inneres Panel)</Label>
                    <Select
                      value={(() => {
                        const v = (selectedBlock.props as Record<string, unknown>)?.containerBackgroundMode
                        return v === "color" || v === "gradient" ? v : "transparent"
                      })()}
                      onValueChange={(v) => {
                        if (!selectedBlock) return
                        const currentProps = selectedBlock.props as Record<string, unknown>
                        updateSelectedProps({ ...currentProps, containerBackgroundMode: v } as CMSBlock["props"])
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transparent">Transparent</SelectItem>
                        <SelectItem value="color">Farbe</SelectItem>
                        <SelectItem value="gradient">Verlauf</SelectItem>
                      </SelectContent>
                    </Select>
                    {(selectedBlock.props as Record<string, unknown>)?.containerBackgroundMode === "color" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Panel-Farbe</Label>
                        <ColorField
                          value={String((selectedBlock.props as Record<string, unknown>)?.containerBackgroundColor ?? "")}
                          onChange={(v: string) => {
                            if (!selectedBlock) return
                            const currentProps = selectedBlock.props as Record<string, unknown>
                            updateSelectedProps({ ...currentProps, containerBackgroundColor: v } as CMSBlock["props"])
                          }}
                          placeholder="#RRGGBB"
                          disableAlpha
                        />
                      </div>
                    )}
                    {(selectedBlock.props as Record<string, unknown>)?.containerBackgroundMode === "gradient" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Verlauf-Preset</Label>
                        <Select
                          value={((selectedBlock.props as Record<string, unknown>)?.containerBackgroundGradientPreset as string) ?? "soft"}
                          onValueChange={(v) => {
                            if (!selectedBlock) return
                            const currentProps = selectedBlock.props as Record<string, unknown>
                            updateSelectedProps({ ...currentProps, containerBackgroundGradientPreset: v } as CMSBlock["props"])
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedBlock.type === "section" && (
                              <SelectItem value="custom">Custom (manuell)</SelectItem>
                            )}
                            {GRADIENT_PRESETS.map((preset) => (
                              <SelectItem key={preset.value} value={preset.value}>
                                {preset.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {(() => {
                          const props = selectedBlock.props as Record<string, unknown>
                          const preset = String(props.containerBackgroundGradientPreset ?? "soft")
                          const from = String(props.containerGradientFrom ?? "").trim()
                          const via = String(props.containerGradientVia ?? "").trim()
                          const to = String(props.containerGradientTo ?? "").trim()
                          const angle = typeof props.containerGradientAngle === "number" ? props.containerGradientAngle : 135
                          const showCustom = preset === "custom" || !!from || !!via || !!to
                          if (!showCustom) return null
                          return (
                            <div className="mt-2 space-y-2 rounded-md border border-border/60 bg-background/40 p-2">
                              <div className="text-[11px] font-semibold text-muted-foreground">Custom Verlauf</div>
                              <div className="grid grid-cols-1 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">From</Label>
                                  <ColorField
                                    value={String(props.containerGradientFrom ?? "")}
                                    onChange={(v: string) => updateSelectedProps({ ...props, containerGradientFrom: v } as CMSBlock["props"])}
                                    placeholder="#RRGGBB"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Via (optional)</Label>
                                  <ColorField
                                    value={String(props.containerGradientVia ?? "")}
                                    onChange={(v: string) => updateSelectedProps({ ...props, containerGradientVia: v } as CMSBlock["props"])}
                                    placeholder="#RRGGBB"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">To</Label>
                                  <ColorField
                                    value={String(props.containerGradientTo ?? "")}
                                    onChange={(v: string) => updateSelectedProps({ ...props, containerGradientTo: v } as CMSBlock["props"])}
                                    placeholder="#RRGGBB"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Winkel</Label>
                                  <Input
                                    className="h-8"
                                    value={String(angle)}
                                    onChange={(e) => {
                                      const n = Number(e.target.value)
                                      if (!Number.isFinite(n)) return
                                      updateSelectedProps({ ...props, containerGradientAngle: n } as CMSBlock["props"])
                                    }}
                                  />
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Tipp: Leere Stops nutzen weiterhin das Preset als Fallback.
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Opacity</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={Math.round(((selectedBlock.props as Record<string, unknown>)?.containerOpacity as number | undefined ?? 1) * 100)}
                            onChange={(e) => {
                              if (!selectedBlock) return
                              const next = Math.min(1, Math.max(0, Number(e.target.value) / 100))
                              updateSelectedProps({ ...(selectedBlock.props as Record<string, unknown>), containerOpacity: next } as CMSBlock["props"])
                            }}
                            className="flex-1"
                          />
                          <Input
                            className="h-8 w-20 font-mono text-sm"
                            value={String(Math.round(((selectedBlock.props as Record<string, unknown>)?.containerOpacity as number | undefined ?? 1) * 100))}
                            onChange={(e) => {
                              if (!selectedBlock) return
                              const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 3)
                              const pct = Math.min(100, Math.max(0, Number(raw || "0")))
                              updateSelectedProps({ ...(selectedBlock.props as Record<string, unknown>), containerOpacity: pct / 100 } as CMSBlock["props"])
                            }}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="container-border"
                          checked={!!(selectedBlock.props as Record<string, unknown>)?.containerBorder}
                          onChange={(e) => {
                            if (!selectedBlock) return
                            const enabled = e.target.checked
                            updateBlockPropsById(selectedBlock.id, (prev) => ({
                              ...prev,
                              containerBorder: enabled,
                              containerBorderColor: enabled ? (String((prev as Record<string, unknown>).containerBorderColor || "").trim() || "#e5e7eb") : (prev as Record<string, unknown>).containerBorderColor,
                            } as CMSBlock["props"]))
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <Label htmlFor="container-border" className="text-xs font-medium cursor-pointer">Rahmen anzeigen</Label>
                      </div>
                      {!!(selectedBlock.props as Record<string, unknown>)?.containerBorder && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Rahmenfarbe</Label>
                          <div className="flex gap-2 items-center">
                            <input
                              key={`${selectedBlock?.id}-border-color-picker`}
                              type="color"
                              value={(() => {
                                const v = String((selectedBlock.props as Record<string, unknown>)?.containerBorderColor || "").trim()
                                return v && /^#[0-9A-Fa-f]{6}$/.test(v) ? v : "#e5e7eb"
                              })()}
                              onChange={(e) => {
                                if (!selectedBlock) return
                                updateBlockPropsById(selectedBlock.id, (prev) => ({
                                  ...prev,
                                  containerBorderColor: e.target.value,
                                } as CMSBlock["props"]))
                              }}
                              className="h-8 w-12 shrink-0 rounded border border-border bg-background cursor-pointer"
                            />
                            <Input
                              placeholder="#e5e7eb (Standard)"
                              value={String((selectedBlock.props as Record<string, unknown>)?.containerBorderColor ?? "")}
                              onChange={(e) => {
                                if (!selectedBlock) return
                                const v = e.target.value
                                updateBlockPropsById(selectedBlock.id, (prev) => ({
                                  ...prev,
                                  containerBorderColor: v === "" ? undefined : v,
                                } as CMSBlock["props"]))
                              }}
                              onBlur={(e) => {
                                if (!selectedBlock) return
                                const raw = e.target.value.trim()
                                if (raw === "") {
                                  updateBlockPropsById(selectedBlock.id, (prev) => ({
                                    ...prev,
                                    containerBorderColor: undefined,
                                  } as CMSBlock["props"]))
                                  return
                                }
                                const hexChars = raw.replace(/^#/, "").replace(/[^0-9A-Fa-f]/g, "").slice(0, 6)
                                if (hexChars.length === 6) {
                                  updateBlockPropsById(selectedBlock.id, (prev) => ({
                                    ...prev,
                                    containerBorderColor: `#${hexChars}`,
                                  } as CMSBlock["props"]))
                                }
                              }}
                              className="h-8 flex-1 font-mono text-sm"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">Leer = Standardfarbe (Rahmen-Farbe des Themes)</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <Label className="text-xs font-semibold">Shadow</Label>
                      <ShadowInspector
                        config={(selectedBlock.props as Record<string, unknown>)?.containerShadow as ElementShadow | undefined}
                        onChange={(shadowConfig) => {
                          if (!selectedBlock) return
                          const currentProps = selectedBlock.props as Record<string, unknown>
                          updateSelectedProps({ ...currentProps, containerShadow: shadowConfig } as CMSBlock["props"])
                        }}
                      />
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Generic Inspector from Registry */}
              <div className="space-y-4">
                {/* Brand Tabs for Hero Block */}
                {selectedBlock.type === "hero" && (() => {
                  const props = selectedBlock.props as HeroBlock["props"]
                  const currentBrandTab = activeBrandTab[selectedBlock.id] || "physiotherapy"
                  const handleBrandTabChange = (brand: "physiotherapy" | "physio-konzept") => {
                    setActiveBrandTab((prev) => ({ ...prev, [selectedBlock.id]: brand }))
                  }
                  
                  // Get current brandContent for display (read-only during render)
                  // Migration happens in useEffect to avoid render loop
                  const brandContentForTab = props.brandContent?.[currentBrandTab] || {}
                  // Force headline and subheadline to always exist (even if empty string)
                  const brandContent = {
                    ...brandContentForTab,
                    headline: brandContentForTab.headline ?? "",
                    subheadline: brandContentForTab.subheadline ?? "",
                  }

                  const handleBrandFieldChange = (fieldPath: string, value: unknown) => {
                    if (!selectedBlock) return
                    isTypingRef.current = true
                    const blockId = selectedBlock.id
                    const brand = currentBrandTab
                    updateBlockPropsById(blockId, (prevProps) => {
                      const next = setByPath(
                        prevProps,
                        `brandContent.${brand}.${fieldPath}`,
                        value
                      ) as CMSBlock["props"]
                      return next
                    })
                    setTimeout(() => {
                      isTypingRef.current = false
                    }, 50)
                  }

                  const handleBrandImageChange = (url: string) => {
                    if (!selectedBlock) return
                    isTypingRef.current = true
                    const blockId = selectedBlock.id
                    const brand = currentBrandTab
                    updateBlockPropsById(blockId, (prevProps) => {
                      // Store as MediaValue-like shape (url)
                      const next = setByPath(
                        prevProps,
                        `brandContent.${brand}.image`,
                        url ? ({ url } as unknown) : undefined
                      ) as CMSBlock["props"]
                      return next
                    })
                    setTimeout(() => {
                      isTypingRef.current = false
                    }, 50)
                  }

                  const handleHeroRootFieldChange = (fieldPath: string, value: unknown) => {
                    if (!selectedBlock) return
                    isTypingRef.current = true
                    const blockId = selectedBlock.id
                    updateBlockPropsById(blockId, (prevProps) => {
                      return setByPath(prevProps, fieldPath, value) as unknown as CMSBlock["props"]
                    })
                    setTimeout(() => {
                      isTypingRef.current = false
                    }, 50)
                  }

                  return (
                    <div className="space-y-4">
                      {/* Global hero settings (not brand-specific) */}
                      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold">Media anzeigen</div>
                          <div className="text-xs text-muted-foreground">
                            Floating-Elemente werden im Media-Bereich gerendert.
                          </div>
                        </div>
                        <Checkbox
                          checked={Boolean(props.showMedia ?? true)}
                          onCheckedChange={(checked) => handleHeroRootFieldChange("showMedia", Boolean(checked))}
                        />
                      </div>

                      {/* Viewport Height Dropdown */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Höhe (Viewport)</Label>
                        <Select
                          value={String(props.minHeightVh || "90")}
                          onValueChange={(v) => handleHeroRootFieldChange("minHeightVh", v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50vh</SelectItem>
                            <SelectItem value="60">60vh</SelectItem>
                            <SelectItem value="70">70vh</SelectItem>
                            <SelectItem value="80">80vh</SelectItem>
                            <SelectItem value="90">90vh</SelectItem>
                            <SelectItem value="100">100vh</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Minimale Höhe des Hero-Bereichs
                        </p>
                      </div>

                      <Tabs value={currentBrandTab} onValueChange={(v) => handleBrandTabChange(v as typeof currentBrandTab)}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
                          <TabsTrigger value="physio-konzept">PhysioKonzept</TabsTrigger>
                        </TabsList>
                        <TabsContent value="physiotherapy" className="space-y-4 mt-4">
                          {currentBrandTab !== "physiotherapy" ? null : (
                          <div className="space-y-3">
                            {/* FESTE TEXT-SECTION: Überschrift und Unterüberschrift - IMMER sichtbar */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Überschrift</Label>
                              <Input
                                id={`${selectedBlock.id}.headline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.headline`] = el
                                }}
                                value={String(brandContent.headline ?? "")}
                                onChange={(e) => handleBrandFieldChange("headline", e.target.value)}
                                placeholder="Ihre Gesundheit in besten Händen"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Unterüberschrift</Label>
                              <Textarea
                                id={`${selectedBlock.id}.subheadline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.subheadline`] = el
                                }}
                                value={String(brandContent.subheadline ?? "")}
                                onChange={(e) => handleBrandFieldChange("subheadline", e.target.value)}
                                placeholder="Professionelle Physiotherapie mit ganzheitlichem Ansatz. Wir begleiten Sie auf dem Weg zu mehr Wohlbefinden und Lebensqualität."
                                className="text-sm min-h-[60px]"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Text</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaText`] = el
                                }}
                                value={String(brandContent.ctaText || "")}
                                onChange={(e) => handleBrandFieldChange("ctaText", e.target.value)}
                                placeholder="CTA Text"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Link</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaHref`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaHref`] = el
                                }}
                                value={String(brandContent.ctaHref || "")}
                                onChange={(e) => handleBrandFieldChange("ctaHref", e.target.value)}
                                placeholder="/kontakt"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Badge Text</Label>
                              <Input
                                id={`${selectedBlock.id}.badgeText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.badgeText`] = el
                                }}
                                value={String(brandContent.badgeText || "")}
                                onChange={(e) => handleBrandFieldChange("badgeText", e.target.value)}
                                placeholder="Badge Text"
                                className="h-8 text-sm"
                              />
                            </div>

                            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                              <div className="text-xs font-semibold">Farben</div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Hero Hintergrund</Label>
                                  <ColorField
                                    value={String(props.heroBgColor || "")}
                                    onChange={(v) => handleHeroRootFieldChange("heroBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.heroBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Headline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).headlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("headlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.headlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Subheadline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).subheadlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("subheadlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.subheadlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Radius</Label>
                                  {(() => {
                                    const bc = brandContent as Record<string, unknown>
                                    const legacy = String(bc.badgeBorderRadius || "")
                                    const preset =
                                      String(bc.badgeRadiusPreset || "") ||
                                      (legacy === "9999px" || legacy === "9999" ? "pill" : "") ||
                                      (legacy === "16px" || legacy === "16" ? "lg" : "") ||
                                      (legacy === "12px" || legacy === "12" ? "md" : "") ||
                                      (legacy === "8px" || legacy === "8" ? "sm" : "") ||
                                      (legacy === "0px" || legacy === "0" ? "none" : "") ||
                                      "pill"

                                    return (
                                      <Select
                                        value={preset}
                                        onValueChange={(v) => {
                                          handleBrandFieldChange("badgeRadiusPreset", v)
                                          // migrate legacy value away once user touches the select
                                          if (legacy) handleBrandFieldChange("badgeBorderRadius", "")
                                        }}
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pill">Pill (rund)</SelectItem>
                                          <SelectItem value="lg">Groß</SelectItem>
                                          <SelectItem value="md">Mittel</SelectItem>
                                          <SelectItem value="sm">Klein</SelectItem>
                                          <SelectItem value="none">Eckig</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )
                                  })()}
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playTextColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playTextColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playTextColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Trust Items Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).trustItemsColor || "")}
                                    onChange={(v) => handleBrandFieldChange("trustItemsColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.trustItemsColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Trust Dot Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).trustDotColor || "")}
                                    onChange={(v) => handleBrandFieldChange("trustDotColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.trustDotColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Title Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingTitleColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingTitleColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingTitleColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Value Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingValueColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingValueColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingValueColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Label Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingLabelColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingLabelColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingLabelColor`] = el
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild</Label>
                              <ImageField
                                id={`${selectedBlock.id}.brandContent.${currentBrandTab}.image`}
                                label=""
                                value={
                                  brandContent.image && "url" in brandContent.image
                                    ? String(brandContent.image.url)
                                    : ""
                                }
                                onChange={handleBrandImageChange}
                                placeholder="/placeholder.svg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild Alt-Text</Label>
                              <Input
                                value={String(brandContent.imageAlt || "")}
                                onChange={(e) => handleBrandFieldChange("imageAlt", e.target.value)}
                                placeholder="Bildbeschreibung"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildformat</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "landscape" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "landscape")}
                                  className="flex-1"
                                >
                                  Querformat
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "portrait" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "portrait")}
                                  className="flex-1"
                                >
                                  Hochformat
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ändert das Seitenverhältnis des Bildcontainers
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildanpassung</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "cover" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "cover")}
                                  className="flex-1"
                                >
                                  Füllen
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "contain" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "contain")}
                                  className="flex-1"
                                >
                                  Vollständig
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Wie das Bild im Container angezeigt wird
                              </p>
                            </div>
                            {(brandContent.imageFit || "cover") === "cover" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Fokus</Label>
                                <Select
                                  value={brandContent.imageFocus || "center"}
                                  onValueChange={(v) => handleBrandFieldChange("imageFocus", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="center">Mitte</SelectItem>
                                    <SelectItem value="top">Oben</SelectItem>
                                    <SelectItem value="bottom">Unten</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Wichtiger Bereich des Bildes (z.B. Gesichter oben)
                                </p>
                              </div>
                            )}
                            {(brandContent.imageFit || "cover") === "contain" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Hintergrund</Label>
                                <Select
                                  value={brandContent.containBackground || "blur"}
                                  onValueChange={(v) => handleBrandFieldChange("containBackground", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="blur">Blur</SelectItem>
                                    <SelectItem value="none">Keiner</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Hintergrund bei vollständiger Anzeige
                                </p>
                              </div>
                            )}
                            
                            <Separator />
                            
                            {/* Floating Elements */}
                            <div className="space-y-3">
                              <Label className="text-xs font-semibold">Floating Element</Label>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Title</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingTitle`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingTitle`] = el
                                  }}
                                  value={String(brandContent.floatingTitle || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingTitle", e.target.value)}
                                  placeholder="Patientenzufriedenheit"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Value</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingValue`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingValue`] = el
                                  }}
                                  value={String(brandContent.floatingValue || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingValue", e.target.value)}
                                  placeholder="98%"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Label</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingLabel`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingLabel`] = el
                                  }}
                                  value={String(brandContent.floatingLabel || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingLabel", e.target.value)}
                                  placeholder="Optionales Label"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            {/* Trust Items */}
                            <div className="space-y-3">
                              <Label className="text-xs font-semibold">Trust Items</Label>
                              {(() => {
                                const trustItems = normalizeStringArray(brandContent.trustItems)
                                return (
                                  <div className="space-y-2">
                                    {trustItems.map((item, index) => {
                                      const itemKey = `trust-${index}-${String(item).substring(0, 20)}`
                                      return (
                                      <div key={itemKey} className="flex gap-2">
                                        <Input
                                          id={`${selectedBlock.id}.trustItems.${index}`}
                                          ref={(el) => {
                                            fieldRefs.current[`${selectedBlock.id}.trustItems.${index}`] = el
                                          }}
                                          value={item}
                                          onChange={(e) => {
                                            const updated = [...trustItems]
                                            updated[index] = e.target.value
                                            handleBrandFieldChange("trustItems", updated)
                                          }}
                                          placeholder={`Trust Item ${index + 1}`}
                                          className="h-8 text-sm flex-1"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            const updated = trustItems.filter((_, i) => i !== index)
                                            handleBrandFieldChange("trustItems", updated)
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      )
                                    })}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() => {
                                        const updated = [...trustItems, ""]
                                        handleBrandFieldChange("trustItems", updated)
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Trust Item hinzufügen
                                    </Button>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                          )}
                        </TabsContent>
                        <TabsContent value="physio-konzept" className="space-y-4 mt-4">
                          {currentBrandTab !== "physio-konzept" ? null : (
                          <div className="space-y-3">
                            {/* FESTE TEXT-SECTION: Überschrift und Unterüberschrift - IMMER sichtbar */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Überschrift</Label>
                              <Input
                                id={`${selectedBlock.id}.headline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.headline`] = el
                                }}
                                value={String(brandContent.headline ?? "")}
                                onChange={(e) => handleBrandFieldChange("headline", e.target.value)}
                                placeholder="Push Your Limits"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">Unterüberschrift</Label>
                              <Textarea
                                id={`${selectedBlock.id}.subheadline`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.subheadline`] = el
                                }}
                                value={String(brandContent.subheadline ?? "")}
                                onChange={(e) => handleBrandFieldChange("subheadline", e.target.value)}
                                placeholder="Erreiche dein volles Potenzial mit individueller Trainingsbetreuung und sportphysiotherapeutischer Expertise."
                                className="text-sm min-h-[60px]"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Badge Text</Label>
                              <Input
                                id={`${selectedBlock.id}.badgeText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.badgeText`] = el
                                }}
                                value={String(brandContent.badgeText || "")}
                                onChange={(e) => handleBrandFieldChange("badgeText", e.target.value)}
                                placeholder="Badge Text"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Text</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaText`] = el
                                }}
                                value={String(brandContent.ctaText || "")}
                                onChange={(e) => handleBrandFieldChange("ctaText", e.target.value)}
                                placeholder="CTA Text"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">CTA Link</Label>
                              <Input
                                id={`${selectedBlock.id}.ctaHref`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.ctaHref`] = el
                                }}
                                value={String(brandContent.ctaHref || "")}
                                onChange={(e) => handleBrandFieldChange("ctaHref", e.target.value)}
                                placeholder="/kontakt"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Sekundärer Button Text</Label>
                              <Input
                                id={`${selectedBlock.id}.playText`}
                                ref={(el) => {
                                  fieldRefs.current[`${selectedBlock.id}.playText`] = el
                                }}
                                value={String(brandContent.playText || "")}
                                onChange={(e) => handleBrandFieldChange("playText", e.target.value)}
                                placeholder="Video ansehen"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Sekundärer CTA Link</Label>
                              <Input
                                value={String(brandContent.secondaryCtaHref || "")}
                                onChange={(e) => handleBrandFieldChange("secondaryCtaHref", e.target.value)}
                                placeholder="/video"
                                className="h-8 text-sm"
                              />
                            </div>                            

                            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-3">
                              <div className="text-xs font-semibold">Farben</div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Headline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).headlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("headlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.headlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Subheadline Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).subheadlineColor || "")}
                                    onChange={(v) => handleBrandFieldChange("subheadlineColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.subheadlineColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">CTA Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).ctaBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("ctaBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.ctaBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).badgeBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("badgeBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.badgeBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Badge Radius</Label>
                                  {(() => {
                                    const bc = brandContent as Record<string, unknown>
                                    const legacy = String(bc.badgeBorderRadius || "")
                                    const preset =
                                      String(bc.badgeRadiusPreset || "") ||
                                      (legacy === "9999px" || legacy === "9999" ? "pill" : "") ||
                                      (legacy === "16px" || legacy === "16" ? "lg" : "") ||
                                      (legacy === "12px" || legacy === "12" ? "md" : "") ||
                                      (legacy === "8px" || legacy === "8" ? "sm" : "") ||
                                      (legacy === "0px" || legacy === "0" ? "none" : "") ||
                                      "pill"

                                    return (
                                      <Select
                                        value={preset}
                                        onValueChange={(v) => {
                                          handleBrandFieldChange("badgeRadiusPreset", v)
                                          if (legacy) handleBrandFieldChange("badgeBorderRadius", "")
                                        }}
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pill">Pill (rund)</SelectItem>
                                          <SelectItem value="lg">Groß</SelectItem>
                                          <SelectItem value="md">Mittel</SelectItem>
                                          <SelectItem value="sm">Klein</SelectItem>
                                          <SelectItem value="none">Eckig</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )
                                  })()}
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Text Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playTextColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playTextColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playTextColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Border</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBorderColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBorderColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBorderColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Play Hover Hintergrund</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).playHoverBgColor || "")}
                                    onChange={(v) => handleBrandFieldChange("playHoverBgColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.playHoverBgColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Title Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingTitleColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingTitleColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingTitleColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Value Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingValueColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingValueColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingValueColor`] = el
                                    }}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Floating Label Farbe</Label>
                                  <ColorField
                                    value={String((brandContent as Record<string, unknown>).floatingLabelColor || "")}
                                    onChange={(v) => handleBrandFieldChange("floatingLabelColor", v)}
                                    placeholder="#rrggbb"
                                    inputRef={(el) => {
                                      fieldRefs.current[`${selectedBlock.id}.floatingLabelColor`] = el
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild</Label>
                              <ImageField
                                id={`${selectedBlock.id}.brandContent.${currentBrandTab}.image`}
                                label=""
                                value={
                                  brandContent.image && "url" in brandContent.image
                                    ? String(brandContent.image.url)
                                    : ""
                                }
                                onChange={handleBrandImageChange}
                                placeholder="/placeholder.svg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bild Alt-Text</Label>
                              <Input
                                value={String(brandContent.imageAlt || "")}
                                onChange={(e) => handleBrandFieldChange("imageAlt", e.target.value)}
                                placeholder="Bildbeschreibung"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildformat</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "landscape" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "landscape")}
                                  className="flex-1"
                                >
                                  Querformat
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageVariant || "landscape") === "portrait" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageVariant", "portrait")}
                                  className="flex-1"
                                >
                                  Hochformat
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Ändert das Seitenverhältnis des Bildcontainers
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bildanpassung</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "cover" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "cover")}
                                  className="flex-1"
                                >
                                  Füllen
                                </Button>
                                <Button
                                  type="button"
                                  variant={(brandContent.imageFit || "cover") === "contain" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleBrandFieldChange("imageFit", "contain")}
                                  className="flex-1"
                                >
                                  Vollständig
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Wie das Bild im Container angezeigt wird
                              </p>
                            </div>
                            {(brandContent.imageFit || "cover") === "cover" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Fokus</Label>
                                <Select
                                  value={brandContent.imageFocus || "center"}
                                  onValueChange={(v) => handleBrandFieldChange("imageFocus", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="center">Mitte</SelectItem>
                                    <SelectItem value="top">Oben</SelectItem>
                                    <SelectItem value="bottom">Unten</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Wichtiger Bereich des Bildes (z.B. Gesichter oben)
                                </p>
                              </div>
                            )}
                            {(brandContent.imageFit || "cover") === "contain" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Hintergrund</Label>
                                <Select
                                  value={brandContent.containBackground || "blur"}
                                  onValueChange={(v) => handleBrandFieldChange("containBackground", v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="blur">Blur</SelectItem>
                                    <SelectItem value="none">Keiner</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Hintergrund bei vollständiger Anzeige
                                </p>
                              </div>
                            )}
                            
                            <Separator />
                            
                            {/* Floating Elements */}
                            <div className="space-y-3">
                              <Label className="text-xs font-semibold">Floating Element</Label>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Title</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingTitle`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingTitle`] = el
                                  }}
                                  value={String(brandContent.floatingTitle || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingTitle", e.target.value)}
                                  placeholder="Nächstes Training"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Value</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingValue`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingValue`] = el
                                  }}
                                  value={String(brandContent.floatingValue || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingValue", e.target.value)}
                                  placeholder="Heute, 18:00"
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Floating Label</Label>
                                <Input
                                  id={`${selectedBlock.id}.floatingLabel`}
                                  ref={(el) => {
                                    fieldRefs.current[`${selectedBlock.id}.floatingLabel`] = el
                                  }}
                                  value={String(brandContent.floatingLabel || "")}
                                  onChange={(e) => handleBrandFieldChange("floatingLabel", e.target.value)}
                                  placeholder="Optionales Label"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          )}
                        </TabsContent>
                      </Tabs>
                      <Separator />
                    </div>
                  )
                })()}

                {/* Dynamic Element Selector (e.g., for trust items, actions) */}
                {selectedBlock.type === "hero" && (() => {
                  const props = selectedBlock.props as HeroBlock["props"]
                  const trustItems = normalizeStringArray(props.trustItems ?? [])
                  const mood = (props as any)?.mood ?? "physiotherapy"
                  const actions = props.actions ?? (props.brandContent?.[mood as keyof typeof props.brandContent]?.actions) ?? []
                  
                  if (trustItems.length === 0 && actions.length === 0) return null
                  
                  return (
                    <>
                      {trustItems.length > 0 && (
                        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                          <Label className="text-xs font-semibold">Trust Items</Label>
                          <div className="flex flex-wrap gap-2">
                            {trustItems.map((item, index) => {
                              const itemId = `trustItems.${index}`
                              const isSelected = selectedElementId === itemId
                              const itemKey = `trustItems-${index}-${String(item || "").substring(0, 20)}`
                              return (
                                <Button
                                  key={itemKey}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => selectElement(selectedBlockId || "", itemId)}
                                >
                                  Item {index + 1}
                                </Button>
                              )
                            })}
                          </div>
                          {selectedElementId && selectedElementId.startsWith("trustItems.") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => deselectElement(selectedBlockId || "")}
                            >
                              Deselect
                            </Button>
                          )}
                        </div>
                      )}

                      {actions.length > 0 && (
                        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                          <Label className="text-xs font-semibold">CTA Actions</Label>
                          <div className="flex flex-wrap gap-2">
                            {actions.map((action: any, index: number) => {
                              const itemId = `action-${action.id}`
                              const isSelected = selectedElementId === itemId
                              return (
                                <Button
                                  key={action?.id ?? `action-${action?.label ?? "unnamed"}-${action?.href ?? "nohref"}-${index}`}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => selectElement(selectedBlockId || "", itemId)}
                                >
                                  {action.label || `Action ${index + 1}`}
                                </Button>
                              )
                            })}
                          </div>
                          {selectedElementId && selectedElementId.startsWith("action-") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => deselectElement(selectedBlockId || "")}
                            >
                              Deselect
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Hero Actions Array Editor */}
                {selectedBlock.type === "hero" && (() => {
                  const def = getBlockDefinition("hero")
                  const hasActionsField = def.inspectorFields?.some(f => f.key === "actions")
                  if (!hasActionsField) return null

                  return (
                    <>
                      <Separator />
                      {renderArrayItemsControls(
                        selectedBlock,
                        "actions",
                        "Action",
                        (action: any, index: number) => `${index + 1}. ${action.label || "Action"}`,
                        createHeroAction,
                        [
                          {
                            key: "variant",
                            label: "Typ",
                            type: "select" as const,
                            options: [
                              { value: "primary", label: "Primary Button" },
                              { value: "secondary", label: "Secondary Button" },
                            ],
                          },
                          { key: "label", label: "Label", type: "text" as const, required: true },
                          { key: "href", label: "Link (optional)", type: "url" as const },
                          {
                            key: "action",
                            label: "Action Typ (optional)",
                            type: "select" as const,
                            options: [
                              { value: "video", label: "Video" },
                              { value: "scroll", label: "Scroll" },
                            ],
                          },
                        ]
                      )}
                    </>
                  )
                })()}


                {/* Render array items with controls for featureGrid, faq, team, contactForm */}
                
{(() => {
  const def = getBlockDefinition(selectedBlock.type)
  const fields = def.inspectorFields ?? []

  const primaryKeys = new Set(["eyebrow", "headline", "subheadline", "title", "subtitle"])
  // Kursplan: Eyebrow wird im Spezial-Inspector gerendert (bei Anzeige/Wochenende), damit es nicht "verschwindet"
  // und wir die Reihenfolge konsistent halten.
  if (selectedBlock.type === "courseSchedule") primaryKeys.delete("eyebrow")
  const lateKeys = new Set(["autoplay", "interval", "showArrows", "showDots"])

  const isArrayItemField = (key: string) => {
    if (selectedBlock.type === "hero" && key.startsWith("trustItems.")) return true
    if (selectedBlock.type === "hero" && key.startsWith("actions.")) return true
    if (selectedBlock.type === "featureGrid" && key.startsWith("features.")) return true
    if (selectedBlock.type === "servicesGrid" && key.startsWith("cards.")) return true
    if (selectedBlock.type === "faq" && key.startsWith("items.")) return true
    if (selectedBlock.type === "team" && key.startsWith("members.")) return true
    if (selectedBlock.type === "contactForm" && key.startsWith("fields.")) return true
    if (selectedBlock.type === "contactForm" && key.startsWith("contactInfoCards.")) return true
    if (selectedBlock.type === "testimonials" && key.startsWith("items.")) return true
    if (selectedBlock.type === "testimonialSlider" && key.startsWith("items.")) return true
    if (selectedBlock.type === "gallery" && key.startsWith("images.")) return true
    if (selectedBlock.type === "imageSlider" && key.startsWith("slides.")) return true
    if (selectedBlock.type === "courseSchedule" && key.startsWith("slots.")) return true
    if (selectedBlock.type === "openingHours" && key.startsWith("hours.")) return true
    if (selectedBlock.type === "legalTable" && (key.startsWith("columns.") || key.startsWith("rows."))) return true
    if (selectedBlock.type === "legalContactCard" && key.startsWith("lines.")) return true
    if (selectedBlock.type === "legalCookieCategories" && key.startsWith("categories.")) return true
    return false
  }

  const isLegacyHeroField = (key: string) => {
    if (selectedBlock.type !== "hero") return false
    // Fields handled via Brand Tabs (content)
    const brandTabFields = [
      // Media fields
      "mediaUrl",
      "mediaType",
      "showMedia",
      "image",
      "imageFit",
      "containBackground",
      "imageAlt",
      "imageVariant",
      "imageFocus",
      // Text content
      "headline",
      "subheadline",
      "ctaText",
      "ctaHref",
      "badgeText",
      "playText",
      "floatingTitle",
      "floatingValue",
      "floatingLabel",
      // Brand/Mood
      "mood",
      // Brand-specific color fields
      "headlineColor",
      "subheadlineColor",
      "ctaColor",
      "ctaBgColor",
      "ctaHoverBgColor",
      "ctaBorderColor",
      "badgeColor",
      "badgeBgColor",
      "playTextColor",
      "playBgColor",
      "playBorderColor",
      "playHoverBgColor",
      "trustItemsColor",
      "trustDotColor",
      "floatingTitleColor",
      "floatingValueColor",
      "floatingLabelColor",
      // Secondary CTA fields
      "secondaryCtaText",
      "secondaryCtaHref",
      "secondaryCtaColor",
      "secondaryCtaBgColor",
      "secondaryCtaHoverBgColor",
      "secondaryCtaBorderColor",
    ]
    return brandTabFields.includes(key)
  }

  const normalFields = fields.filter((field) => {
    if (isArrayItemField(field.key)) return false
    if (isLegacyHeroField(field.key)) return false
    // Panel-Felder werden im separaten CONTAINER-Panel gerendert → hier ausblenden, sonst doppelt
    if (def.enableInnerPanel && field.key.startsWith("container")) return false
    return true
  })

  // Sort fields by group (use custom group order if defined on block)
  const groupOrder = def.inspectorGroupOrder || undefined
  const sortedFields = sortInspectorFields(normalFields, groupOrder)

  const primaryFields = sortedFields.filter((f) => {
    if (primaryKeys.has(f.key)) return true
    // Slider: background soll direkt bei Head/Subline stehen
    if (selectedBlock.type === "testimonialSlider" && f.key === "background") return true
    return false
  })

  const restFields = sortedFields.filter((f) => !primaryFields.some((p) => p.key === f.key))
  const midFields = restFields.filter((f) => !lateKeys.has(f.key))
  const lateFields = restFields.filter((f) => lateKeys.has(f.key))

  // Helper to evaluate showWhen condition
  const shouldShowField = (field: InspectorField): boolean => {
    if (!field.showWhen) return true
    const currentProps = selectedBlock?.props as Record<string, unknown>
    const getByPath = (obj: any, path: string): any => {
      return path.split(".").reduce((acc, part) => acc?.[part], obj)
    }
    const currentValue = getByPath(currentProps, field.showWhen.key)
    return currentValue === field.showWhen.equals
  }

  return (
    <>
      {/* 1) Head/Subline (und ggf. Background) */}
      {primaryFields.filter(shouldShowField).map((field) => renderInspectorField(field, selectedBlock))}

      {selectedBlock.type === "externalEmbed" &&
        (() => {
          const p = selectedBlock.props as ExternalEmbedBlock["props"]
          const url = (p.embedUrl ?? "").trim()
          if (!url) return null
          const v = validateEmbedUrlForProvider(p.provider, url)
          if (v.ok) return null
          return (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{v.message}</AlertDescription>
            </Alert>
          )
        })()}

      {selectedBlock.type === "legalRichText" && (
        <>
          <Separator />
          <LegalRichTextContentInspector
            block={selectedBlock as CMSBlock & { type: "legalRichText" }}
            updateSelectedProps={updateSelectedProps}
            expandedRepeaterCards={expandedRepeaterCards}
            setExpandedRepeaterCards={setExpandedRepeaterCards}
          />
        </>
      )}

      {/* Button Preset (one dropdown per block for card, section, imageText, cta, hero, team, contactForm) */}
      {(() => {
        const showButtonPreset = selectedBlock.type === "card" ||
          selectedBlock.type === "section" ||
          selectedBlock.type === "imageText" ||
          selectedBlock.type === "cta" ||
          selectedBlock.type === "hero" ||
          selectedBlock.type === "team" ||
          selectedBlock.type === "contactForm"
        
        if (!showButtonPreset) {
          return null
        }
        
        return (
          <>
            <Separator />
            <div className="space-y-1.5">
              <Label className="text-xs">Button Preset</Label>
              <Select
                value={String((selectedBlock.props as Record<string, unknown>)?.buttonPreset ?? "default")}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = {
                    ...currentProps,
                    buttonPreset: v === "default" ? undefined : v,
                  } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={5}>
                  {BUTTON_PRESET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )
      })()}

      {/* 2) Items/Arrays */}
      {selectedBlock.type === "servicesGrid" && (
        <>
          <Separator />

          {/* Block-Level Controls: Variant, Background, Columns, Autoplay, Interval */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Variante</Label>
              <Select
                value={selectedBlock.props?.variant || "grid"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, variant: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="slider">Slider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Hintergrund</Label>
              <Select
                value={selectedBlock.props?.background || "none"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, background: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedBlock.props?.variant === "grid" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Spalten</Label>
                  <Select
                    value={String(selectedBlock.props?.columns || 3)}
                    onValueChange={(v) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, columns: Number(v) } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Text Ausrichtung</Label>
                  <Select
                    value={(selectedBlock.props?.textAlign || "left") as string}
                    onValueChange={(v) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, textAlign: v } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Links</SelectItem>
                      <SelectItem value="center">Mitte</SelectItem>
                      <SelectItem value="right">Rechts</SelectItem>
                      <SelectItem value="justify">Blocksatz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {selectedBlock.props?.variant === "slider" && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Autoplay</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, autoplay: !currentProps.autoplay } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className={cn(
                      "h-6 w-11 rounded-full border border-border transition-colors",
                      selectedBlock.props?.autoplay ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full bg-white transition-transform",
                        selectedBlock.props?.autoplay ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                {selectedBlock.props?.autoplay && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Interval (Sekunden)</Label>
                    <Select
                      value={String(selectedBlock.props?.interval || 6000)}
                      onValueChange={(v) => {
                        if (!selectedBlock) return
                        const currentProps = selectedBlock.props as Record<string, unknown>
                        const updatedProps = { ...currentProps, interval: Number(v) } as CMSBlock["props"]
                        updateSelectedProps(updatedProps)
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3000">3 Sekunden</SelectItem>
                        <SelectItem value="4500">4,5 Sekunden</SelectItem>
                        <SelectItem value="6000">6 Sekunden</SelectItem>
                        <SelectItem value="8000">8 Sekunden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Slider Ausrichtung</Label>
                  <Select
                    value={selectedBlock.props?.sliderAlign || "center"}
                    onValueChange={(v) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, sliderAlign: v } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Zentriert</SelectItem>
                      <SelectItem value="left">Links</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Steuerelemente</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, showControls: !currentProps.showControls } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className={cn(
                      "h-6 w-11 rounded-full border border-border transition-colors",
                      selectedBlock.props?.showControls ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full bg-white transition-transform",
                        selectedBlock.props?.showControls ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </>
            )}
          </div>

          <Separator />

          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const cards = ((getByPath(props, "cards") as Array<{ id: string; title?: string }>) || [])
            const repeaterKey = `${selectedBlock.id}:cards`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const updateCards = (next: typeof cards) => updateSelectedProps({ ...props, cards: next } as CMSBlock["props"])
            const addItem = () => {
              const newItem = createServiceCard()
              updateCards([...cards, newItem])
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            const serviceCardFields = [
              { key: "icon", label: "Icon", type: "select" as const, options: getAvailableIconsWithLabels() },
              { key: "iconColor", label: "Icon Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "iconBgColor", label: "Icon Hintergrund (optional)", type: "color" as const, placeholder: "#e5e7eb" },
              { key: "title", label: "Titel", type: "text" as const },
              { key: "titleColor", label: "Titel Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "text", label: "Text", type: "textarea" as const },
              { key: "textColor", label: "Text Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "textAlign", label: "Text Ausrichtung", type: "select" as const, options: [{ value: "left", label: "Links" }, { value: "center", label: "Mitte" }, { value: "right", label: "Rechts" }, { value: "justify", label: "Blocksatz" }] },
              { key: "ctaText", label: "CTA Text", type: "text" as const },
              { key: "ctaColor", label: "CTA Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "ctaHref", label: "CTA Link", type: "url" as const },
              { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
              { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
            ]
            return (
              <UniversalRepeaterInspector
                items={cards}
                getItemId={(c) => c.id}
                renderSummary={(card) => <span className="truncate">{card.title || "Card"}</span>}
                renderContent={(card, index) => renderOneRepeaterItemFields(selectedBlock, "cards", index, card as Record<string, unknown>, serviceCardFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${cards.length} Cards`}
                addLabel="Card hinzufügen"
                onAdd={addItem}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "cards", from, to)}
                onRemove={(itemId) => confirmDeleteItem(selectedBlock.id, "cards", cards.findIndex((c) => c.id === itemId))}
              />
            )
          })()}
        </>
      )}

      {selectedBlock.type === "testimonials" && (
        <>
          <Separator />
          
          {/* Block-Level Controls: Autoplay & Interval (nur für Slider-Variante) */}
          {selectedBlock.props?.variant === "slider" && (
            <div className="space-y-3 border-b border-border pb-4 mb-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Autoplay</Label>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const updatedProps = { ...currentProps, autoplay: !currentProps.autoplay } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  className={cn(
                    "h-6 w-11 rounded-full border border-border transition-colors",
                    selectedBlock.props?.autoplay ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      selectedBlock.props?.autoplay ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              {selectedBlock.props?.autoplay && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Interval (Sekunden)</Label>
                  <Select
                    value={String(selectedBlock.props?.interval || 6000)}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const updatedProps = { ...currentProps, interval: Number(v) } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3000">3 Sekunden</SelectItem>
                      <SelectItem value="4500">4,5 Sekunden</SelectItem>
                      <SelectItem value="6000">6 Sekunden</SelectItem>
                      <SelectItem value="8000">8 Sekunden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const items = ((getByPath(props, "items") as Array<{ id: string; name?: string }>) || [])
            const repeaterKey = `${selectedBlock.id}:items`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const updateItems = (next: typeof items) => updateSelectedProps({ ...props, items: next } as CMSBlock["props"])
            const addItem = () => {
              const newItem = createTestimonialItem()
              updateItems([...items, newItem])
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            const testimonialFields = [
              { key: "quote", label: "Zitat", type: "textarea" as const, required: true },
              { key: "quoteColor", label: "Zitat Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "avatar", label: "Avatar (optional)", type: "image" as const, placeholder: "/avatar.jpg" },
              { key: "avatarGradient", label: "Avatar Gradient", type: "select" as const, options: [{ value: "auto", label: "Auto" }, { value: "g1", label: "Primary" }, { value: "g2", label: "Accent" }, { value: "g3", label: "Chart 1" }, { value: "g4", label: "Chart 2" }, { value: "g5", label: "Chart 3" }, { value: "g6", label: "Blue" }, { value: "g7", label: "Purple" }, { value: "g8", label: "Green" }, { value: "g9", label: "Rose" }, { value: "g10", label: "Amber" }] },
              { key: "avatarColor", label: "Avatar Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "name", label: "Name", type: "text" as const, required: true },
              { key: "nameColor", label: "Name Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "role", label: "Rolle (optional)", type: "text" as const },
              { key: "roleColor", label: "Rolle Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "rating", label: "Rating (optional)", type: "select" as const, options: [{ value: "none", label: "—" }, { value: "5", label: "★★★★★ (5)" }, { value: "4", label: "★★★★☆ (4)" }, { value: "3", label: "★★★☆☆ (3)" }, { value: "2", label: "★★☆☆☆ (2)" }, { value: "1", label: "★☆☆☆☆ (1)" }] },
            ]
            return (
              <UniversalRepeaterInspector
                items={items}
                getItemId={(i) => i.id}
                renderSummary={(item) => <span className="truncate">{(item as Record<string, unknown>).name as string || "Testimonial"}</span>}
                renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "items", index, item as Record<string, unknown>, testimonialFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${items.length} Testimonials`}
                addLabel="Testimonial hinzufügen"
                onAdd={addItem}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "items", from, to)}
                onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "items", items.findIndex((i) => i.id === itemId))}
                minItems={1}
                maxItems={12}
              />
            )
          })()}
        </>
      )}

      {selectedBlock.type === "testimonialSlider" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "items",
            "Testimonial",
            (item, index) => {
              const it = item as unknown as Record<string, unknown>
              const name = String(it.name || "")
              return `${index + 1}. ${name || "Testimonial"}`
            },
            createTestimonialItem,
            [
              { key: "quote", label: "Zitat", type: "textarea" as const, required: true },
              { key: "name", label: "Name", type: "text" as const, required: true },
              { key: "role", label: "Rolle (optional)", type: "text" as const },
              {
                key: "rating",
                label: "Rating (optional)",
                type: "select" as const,
                options: [
                  { value: "none", label: "—" },
                  { value: "5", label: "★★★★★ (5)" },
                  { value: "4", label: "★★★★☆ (4)" },
                  { value: "3", label: "★★★☆☆ (3)" },
                  { value: "2", label: "★★☆☆☆ (2)" },
                  { value: "1", label: "★☆☆☆☆ (1)" },
                ],
              },
            ],
            1,
            12
          )}
        </>
      )}

      {selectedBlock.type === "gallery" && (
        <>
          <Separator />
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const images = (getByPath(props, "images") as Array<{ id: string }>) || []
            const repeaterKey = `${selectedBlock.id}:images`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const addImage = () => {
              const newItem = createGalleryImage()
              editorActions.handleAddArrayItem(selectedBlock.id, "images", () => newItem)
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            const galleryImageFields = [
              { key: "url", label: "Bild-URL", type: "image" as const, required: true, placeholder: "/placeholder.svg" },
              { key: "alt", label: "Alt-Text", type: "text" as const, required: true },
              { key: "caption", label: "Caption (optional)", type: "text" as const },
              { key: "captionColor", label: "Caption Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "link", label: "Link (optional, wenn Lightbox aus)", type: "url" as const },
            ]
            return (
              <UniversalRepeaterInspector
                items={images}
                getItemId={(img) => img.id}
                getItemLabel={(_img, index) => `Bild ${index + 1}`}
                renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "images", index, item as Record<string, unknown>, galleryImageFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${images.length} Bilder`}
                addLabel="Bild hinzufügen"
                onAdd={addImage}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "images", from, to)}
                onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "images", images.findIndex((img) => img.id === itemId))}
                minItems={3}
                maxItems={18}
              />
            )
          })()}
        </>
      )}

      {selectedBlock.type === "imageSlider" && (
        <>
          <Separator />
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const slides = ((getByPath(props, "slides") as Array<{ id: string; title?: string }>) || [])
            const repeaterKey = `${selectedBlock.id}:slides`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const updateSlides = (next: typeof slides) => updateSelectedProps({ ...props, slides: next } as CMSBlock["props"])
            const addSlide = () => {
              const newItem = createImageSlide()
              updateSlides([...slides, newItem])
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            const removeSlideAt = (index: number) => {
              const id = slides[index]?.id
              if (id && expandedId === id) setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))
              updateSlides(slides.filter((_, i) => i !== index))
            }
            const slideFields = [
              { key: "url", label: "Bild", type: "image" as const, required: true },
              { key: "alt", label: "Alt-Text", type: "text" as const, required: true },
              { key: "title", label: "Titel (optional)", type: "text" as const },
              { key: "text", label: "Text (optional)", type: "textarea" as const },
              { key: "titleColor", label: "Titel Farbe", type: "color" as const, placeholder: "#111111" },
              { key: "textColor", label: "Text Farbe", type: "color" as const, placeholder: "#666666" },
            ]
            return (
              <UniversalRepeaterInspector
                items={slides}
                getItemId={(s) => s.id}
                renderSummary={(slide) => <span className="truncate">{(slide as Record<string, unknown>).title as string || "Slide"}</span>}
                renderContent={(slide, index) => renderOneRepeaterItemFields(selectedBlock, "slides", index, slide as Record<string, unknown>, slideFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${slides.length} Slides`}
                addLabel="Slide hinzufügen"
                onAdd={addSlide}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "slides", from, to)}
                onRemove={(itemId) => removeSlideAt(slides.findIndex((s) => s.id === itemId))}
                minItems={1}
                maxItems={12}
              />
            )
          })()}

          {/* Slide Shadow Inspector */}
          {((selectedBlock.props as any)?.slides ?? []).map((slide: any, slideIndex: number) => {
            const slideKey = slide.id || `slide-${slideIndex}-${slide.title || ""}`
            return (
            <div key={slideKey} className="mt-4 pt-4 border-t border-border/50">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">
                  {slide.title ? `Slide ${slideIndex + 1}: ${slide.title}` : `Slide ${slideIndex + 1}`} - Shadow
                </h4>
                <ShadowInspector
                  config={slide.shadow}
                  onChange={(shadowConfig) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const slides = Array.isArray(currentProps.slides) ? [...(currentProps.slides as any[])] : []
                    if (slides[slideIndex]) {
                      slides[slideIndex] = { ...slides[slideIndex], shadow: shadowConfig }
                      const updatedProps = { ...currentProps, slides } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }
                  }}
                />
              </div>
            </div>
            )
          })}
        </>
      )}

      {selectedBlock.type === "courseSchedule" && (() => {
        const props = selectedBlock.props as CourseScheduleBlock["props"]
        const slots: CourseSlot[] = props.slots ?? []
        const weekdays: CourseScheduleWeekday[] = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
        const repeaterKey = `${selectedBlock.id}:slots`
        const expandedSlotId = expandedRepeaterCards[repeaterKey] ?? null
        const updateSlots = (nextSlots: CourseSlot[]) => updateSelectedProps({ ...props, slots: nextSlots } as CMSBlock["props"])
        const updateSlot = (slotId: string, patch: Partial<CourseSlot>) => {
          const idx = slots.findIndex((s) => s.id === slotId)
          if (idx === -1) return
          const next = [...slots]
          next[idx] = { ...next[idx], ...patch }
          updateSlots(next)
        }
        const removeSlot = (slotId: string) => {
          const next = slots.filter((s) => s.id !== slotId)
          if (expandedSlotId === slotId) {
            setExpandedRepeaterCards((prev) => ({ ...prev, [repeaterKey]: null }))
          }
          updateSlots(next)
        }
        const addSlot = () => {
          const newSlot = createCourseSlot()
          updateSlots([...slots, newSlot])
          setExpandedRepeaterCards((prev) => ({ ...prev, [repeaterKey]: newSlot.id }))
          lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newSlot.id }
        }
        const toggleSlot = (slotId: string) => {
          setExpandedRepeaterCards((prev) => ({
            ...prev,
            [repeaterKey]: expandedSlotId === slotId ? null : slotId,
          }))
        }
        return (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Eyebrow (optional)</Label>
                <Input
                  value={props.eyebrow ?? ""}
                  onChange={(e) => updateSelectedProps({ ...props, eyebrow: e.target.value } as CMSBlock["props"])}
                  className="h-8 text-sm"
                  placeholder="z.B. KURSE"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Anzeige</Label>
                <Select
                  value={props.mode ?? "calendar"}
                  onValueChange={(v: "calendar" | "timeline") => {
                    if (!selectedBlock) return
                    updateSelectedProps({ ...props, mode: v } as CMSBlock["props"])
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calendar">Kalender</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Wochenende verstecken</Label>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedBlock) return
                    updateSelectedProps({ ...props, hideWeekend: !props.hideWeekend } as CMSBlock["props"])
                  }}
                  className={cn(
                    "h-6 w-11 rounded-full border border-border transition-colors",
                    props.hideWeekend ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      props.hideWeekend ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
            <Separator />
            <UniversalRepeaterInspector<CourseSlot>
              items={slots}
              getItemId={(s) => s.id}
              renderSummary={(slot) => (
                <div className="flex items-center gap-2 min-w-0 w-full">
                  <span className="truncate text-sm font-medium">{slot.title || "Neuer Kurs"}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {slot.weekday} {slot.startTime}–{slot.endTime}
                  </span>
                </div>
              )}
              renderContent={(slot) => (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Wochentag</Label>
                    <Select
                      value={slot.weekday}
                      onValueChange={(v) => updateSlot(slot.id, { weekday: v as CourseScheduleWeekday })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weekdays.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ende</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Titel</Label>
                    <Input
                      value={slot.title}
                      onChange={(e) => updateSlot(slot.id, { title: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="Kursname"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Referent/in (optional)</Label>
                    <Input
                      value={slot.instructor ?? ""}
                      onChange={(e) => updateSlot(slot.id, { instructor: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="Name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ort (optional)</Label>
                    <Input
                      value={slot.location ?? ""}
                      onChange={(e) => updateSlot(slot.id, { location: e.target.value })}
                      className="h-8 text-sm"
                      placeholder="Raum / Adresse"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`slot-highlight-${slot.id}`}
                      checked={!!slot.highlight}
                      onCheckedChange={(checked) => updateSlot(slot.id, { highlight: !!checked })}
                    />
                    <Label htmlFor={`slot-highlight-${slot.id}`} className="text-xs cursor-pointer">Hervorheben</Label>
                  </div>
                </>
              )}
              expandedId={expandedSlotId}
              onToggle={toggleSlot}
              onCollapseAll={() => setExpandedRepeaterCards((prev) => ({ ...prev, [repeaterKey]: null }))}
              countLabel={`${slots.length} Kurse`}
              addLabel="Slot hinzufügen"
              onAdd={addSlot}
              onMove={() => {}}
              onRemove={(itemId) => removeSlot(itemId)}
              emptyState={<p className="text-xs text-muted-foreground py-2">Keine Kurse. Slot hinzufügen.</p>}
              showMoveButtons={false}
            />
          </>
        )
      })()}

      {selectedBlock.type === "openingHours" && (
        <>
          <Separator />
          
          {/* Element Shadow Inspector for selected element */}
          {selectedElementId && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold mb-4">Element Shadow</h3>
                <ShadowInspector
                  config={
                    ((selectedBlock.props as Record<string, unknown>)?.elements as Record<string, ElementConfig> | undefined)?.[selectedElementId]?.style?.shadow
                  }
                  onChange={(shadowConfig) => {
                    const currentElements = ((selectedBlock.props as Record<string, unknown>)?.elements ?? {}) as Record<string, ElementConfig>
                    const currentElement = currentElements[selectedElementId] ?? { style: {} }
                    const nextElement: ElementConfig = {
                      ...currentElement,
                      style: {
                        ...currentElement.style,
                        shadow: shadowConfig,
                      },
                    }
                    const nextElements = {
                      ...currentElements,
                      [selectedElementId]: nextElement,
                    }
                    const updatedProps = setByPath(selectedBlock.props as Record<string, unknown>, "elements", nextElements) as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  onClose={() => deselectElement(selectedBlockId || "")}
                />
              </div>
              <Separator />
            </>
          )}
          
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const hours = (getByPath(props, "hours") as Array<{ id: string; label?: string }>) || []
            const repeaterKey = `${selectedBlock.id}:hours`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const openingHourFields = [
              { key: "label", label: "Label", type: "text" as const, required: true },
              { key: "labelColor", label: "Label Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "value", label: "Wert", type: "text" as const, required: true },
              { key: "valueColor", label: "Wert Farbe (optional)", type: "color" as const, placeholder: "#666666" },
            ]
            const addHour = () => {
              const newItem = createOpeningHour()
              editorActions.handleAddArrayItem(selectedBlock.id, "hours", () => newItem)
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            return (
              <UniversalRepeaterInspector
                items={hours}
                getItemId={(h) => h.id}
                renderSummary={(row) => <span className="truncate">{(row as Record<string, unknown>).label as string || "Zeile"}</span>}
                renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "hours", index, item as Record<string, unknown>, openingHourFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${hours.length} Zeilen`}
                addLabel="Zeile hinzufügen"
                onAdd={addHour}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "hours", from, to)}
                onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "hours", hours.findIndex((h) => h.id === itemId))}
                minItems={1}
                maxItems={10}
              />
            )
          })()}
        </>
      )}

      {selectedBlock.type === "featureGrid" && (
        <>
          <Separator />

          {/* Block-Level Design System Controls */}
          <div className="space-y-3">
            {/* Columns */}
            <div className="space-y-1.5">
              <Label className="text-xs">Spalten</Label>
              <Select
                value={((selectedBlock.props as any)?.columns || 3).toString()}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, columns: parseInt(v, 10) } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Design Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-primary">Design Preset</Label>
              <Select
                value={(selectedBlock.props as any)?.designPreset || "standard"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const presets: Record<string, any> = {
                    standard: {
                      style: { variant: "default", radius: "xl", border: "subtle", shadow: "sm", accent: "none" },
                      animation: { entrance: "fade", hover: "none", durationMs: 400, delayMs: 0 },
                    },
                    softGlow: {
                      style: { variant: "soft", radius: "lg", border: "none", shadow: "md", accent: "none" },
                      animation: { entrance: "fade", hover: "glow", durationMs: 400, delayMs: 0 },
                    },
                    outlineStrong: {
                      style: { variant: "outline", radius: "lg", border: "strong", shadow: "none", accent: "none" },
                      animation: { entrance: "slide-up", hover: "lift", durationMs: 500, delayMs: 0 },
                    },
                    elevatedBrand: {
                      style: { variant: "elevated", radius: "xl", border: "subtle", shadow: "lg", accent: "brand" },
                      animation: { entrance: "scale", hover: "lift", durationMs: 400, delayMs: 0 },
                    },
                    mutedAccentMinimal: {
                      style: { variant: "soft", radius: "md", border: "none", shadow: "sm", accent: "muted" },
                      animation: { entrance: "slide-left", hover: "none", durationMs: 300, delayMs: 0 },
                    },
                  }
                  const preset = presets[v]
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = {
                    ...currentProps,
                    designPreset: v,
                    style: preset.style,
                    animation: preset.animation,
                  } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="softGlow">Soft Glow</SelectItem>
                  <SelectItem value="outlineStrong">Outline Strong</SelectItem>
                  <SelectItem value="elevatedBrand">Elevated Brand</SelectItem>
                  <SelectItem value="mutedAccentMinimal">Muted Accent Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style Controls */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">STYLE (nach Preset anpassen)</Label>
              
              {/* Variant */}
              <div className="space-y-1.5">
                <Label className="text-xs">Variante</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.variant || "default"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, variant: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="elevated">Elevated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Radius */}
              <div className="space-y-1.5">
                <Label className="text-xs">Border Radius</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.radius || "xl"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, radius: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Border */}
              <div className="space-y-1.5">
                <Label className="text-xs">Border</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.border || "subtle"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, border: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Shadow */}
              <div className="space-y-1.5">
                <Label className="text-xs">Schatten</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.shadow || "sm"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, shadow: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Accent */}
              <div className="space-y-1.5">
                <Label className="text-xs">Akzentfarbe</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.accent || "none"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, accent: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="muted">Muted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">ANIMATION</Label>
              
              {/* Entrance */}
              <div className="space-y-1.5">
                <Label className="text-xs">Eintrittsanimation</Label>
                <Select
                  value={(selectedBlock.props as any)?.animation?.entrance || "fade"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, entrance: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide-up">Slide Up</SelectItem>
                    <SelectItem value="slide-left">Slide Left</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hover */}
              <div className="space-y-1.5">
                <Label className="text-xs">Hover-Animation</Label>
                <Select
                  value={(selectedBlock.props as any)?.animation?.hover || "none"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, hover: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="lift">Lift</SelectItem>
                    <SelectItem value="glow">Glow</SelectItem>
                    <SelectItem value="tilt">Tilt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <Label className="text-xs">Dauer (ms)</Label>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  step="50"
                  value={(selectedBlock.props as any)?.animation?.durationMs || 400}
                  onChange={(e) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, durationMs: parseInt(e.target.value, 10) },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  className="h-8 w-full rounded border border-border bg-background px-2 text-sm"
                />
              </div>

              {/* Delay */}
              <div className="space-y-1.5">
                <Label className="text-xs">Verzögerung (ms)</Label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="50"
                  value={(selectedBlock.props as any)?.animation?.delayMs || 0}
                  onChange={(e) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const animation = (currentProps.animation as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      animation: { ...animation, delayMs: parseInt(e.target.value, 10) },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                  className="h-8 w-full rounded border border-border bg-background px-2 text-sm"
                />
              </div>
            </div>

            {/* Global Colors */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">FARBEN (global)</Label>
              
              <div className="space-y-1.5">
                <Label className="text-xs">Titel Farbe</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.titleColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, titleColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.titleColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, titleColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Beschreibung Farbe</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.descriptionColor || "#666666"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, descriptionColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.descriptionColor || "#666666"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, descriptionColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Icon Farbe</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.iconColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, iconColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.iconColor || "#111111"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, iconColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Card Hintergrund</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.cardBgColor || "#ffffff"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBgColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.cardBgColor || "#ffffff"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBgColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Card Border</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(selectedBlock.props as any)?.cardBorderColor || "#e5e7eb"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBorderColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 w-12 rounded border border-border"
                  />
                  <input
                    type="text"
                    value={(selectedBlock.props as any)?.cardBorderColor || "#e5e7eb"}
                    onChange={(e) => {
                      if (!selectedBlock) return
                      const currentProps = selectedBlock.props as Record<string, unknown>
                      const updatedProps = { ...currentProps, cardBorderColor: e.target.value } as CMSBlock["props"]
                      updateSelectedProps(updatedProps)
                    }}
                    className="h-8 flex-1 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Features repeater */}
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const features = (getByPath(props, "features") as Array<{ id: string; title?: string }>) || []
            const repeaterKey = `${selectedBlock.id}:features`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const updateFeatures = (next: typeof features) => updateSelectedProps({ ...props, features: next } as CMSBlock["props"])
            const addFeature = () => {
              const newItem = createFeatureItem()
              updateFeatures([...features, newItem])
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            const featureFields = [
              { key: "title", label: "Titel", type: "text" as const },
              { key: "titleColor", label: "Titel Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "description", label: "Beschreibung", type: "textarea" as const },
              { key: "descriptionColor", label: "Beschreibung Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "icon", label: "Icon", type: "text" as const },
              { key: "iconColor", label: "Icon Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
              { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
            ]
            return (
              <UniversalRepeaterInspector
                items={features}
                getItemId={(f) => f.id}
                getItemLabel={(_, index) => `Feature ${index + 1}`}
                renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "features", index, item as Record<string, unknown>, featureFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${features.length} Features`}
                addLabel="Feature hinzufügen"
                onAdd={addFeature}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "features", from, to)}
                onRemove={(itemId) => handleRemoveArrayItem(selectedBlock.id, "features", features.findIndex((f) => f.id === itemId))}
              />
            )
          })()}
        </>
      )}

      {selectedBlock.type === "imageText" && (
        <>
          <Separator />
          
          {/* Block-Level Design System Controls */}
          <div className="space-y-3">
            {/* Layout Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-primary">Layout Preset</Label>
              <Select
                value={(selectedBlock.props as any)?.designPreset || "standard"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const presets: Record<string, any> = {
                    standard: {
                      style: { variant: "default", verticalAlign: "center", textAlign: "left", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "left",
                    },
                    soft: {
                      style: { variant: "soft", verticalAlign: "center", textAlign: "left", maxWidth: "lg" },
                      background: "muted",
                      imagePosition: "left",
                    },
                    softCentered: {
                      style: { variant: "soft", verticalAlign: "center", textAlign: "center", maxWidth: "lg" },
                      background: "muted",
                      imagePosition: "left",
                    },
                    imageRight: {
                      style: { variant: "default", verticalAlign: "center", textAlign: "left", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "right",
                    },
                    imageRightCentered: {
                      style: { variant: "default", verticalAlign: "center", textAlign: "center", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "right",
                    },
                    topAligned: {
                      style: { variant: "default", verticalAlign: "top", textAlign: "left", maxWidth: "lg" },
                      background: "none",
                      imagePosition: "left",
                    },
                  }
                  const preset = presets[v]
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = {
                    ...currentProps,
                    designPreset: v,
                    style: preset.style,
                    background: preset.background,
                    imagePosition: preset.imagePosition,
                  } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                  <SelectItem value="softCentered">Soft Centered</SelectItem>
                  <SelectItem value="imageRight">Image Right</SelectItem>
                  <SelectItem value="imageRightCentered">Image Right Centered</SelectItem>
                  <SelectItem value="topAligned">Top Aligned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Style Controls */}
            <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
              <Label className="text-xs font-semibold text-primary">STYLE</Label>
              
              {/* Variant */}
              <div className="space-y-1.5">
                <Label className="text-xs">Variante</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.variant || "default"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, variant: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vertical Align */}
              <div className="space-y-1.5">
                <Label className="text-xs">Vertikale Ausrichtung</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.verticalAlign || "center"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, verticalAlign: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Oben</SelectItem>
                    <SelectItem value="center">Zentriert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Align */}
              <div className="space-y-1.5">
                <Label className="text-xs">Text Ausrichtung</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.textAlign || "left"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, textAlign: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Links</SelectItem>
                    <SelectItem value="center">Zentriert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Width */}
              <div className="space-y-1.5">
                <Label className="text-xs">Maximale Breite</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.maxWidth || "lg"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, maxWidth: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Aspect Ratio */}
              <div className="space-y-1.5">
                <Label className="text-xs">Bild Seitenverhältnis</Label>
                <Select
                  value={(selectedBlock.props as any)?.style?.imageAspectRatio || "4/3"}
                  onValueChange={(v) => {
                    if (!selectedBlock) return
                    const currentProps = selectedBlock.props as Record<string, unknown>
                    const style = (currentProps.style as Record<string, unknown>) || {}
                    const updatedProps = {
                      ...currentProps,
                      style: { ...style, imageAspectRatio: v },
                    } as CMSBlock["props"]
                    updateSelectedProps(updatedProps)
                  }}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4/3">4:3 (Standard)</SelectItem>
                    <SelectItem value="16/9">16:9 (Breitbild)</SelectItem>
                    <SelectItem value="1/1">1:1 (Quadrat)</SelectItem>
                    <SelectItem value="3/2">3:2 (Klassisch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Special-case repeater – not migrated to UniversalRepeaterInspector (columns/rows with cells sync, custom row editor). */}
      {selectedBlock.type === "legalTable" && (
        <>
          <Separator />
          <div className="space-y-4 p-4">
            <h4 className="text-sm font-medium text-foreground">Spalten</h4>
            {(() => {
              const props = selectedBlock.props as Record<string, unknown>
              const columns = (getByPath(props, "columns") as Array<{ id: string; label: string; width?: string }>) || []
              const repeaterKey = `${selectedBlock.id}:columns`
              const expandedId = expandedRepeaterCards[repeaterKey] ?? null
              const addColumn = () => editorActions.handleAddArrayItem(selectedBlock.id, "columns", createLegalTableColumn)
              const columnFields = [{ key: "label", label: "Bezeichnung", type: "text" as const }, { key: "width", label: "Breite (optional)", type: "text" as const, placeholder: "z.B. 25%" }]
              type ColItem = { id: string; label: string; width?: string }
              return (
                <InspectorCardList<ColItem>
                  items={columns}
                  getItemId={(c: ColItem) => c.id}
                  mode="single"
                  expandedId={expandedId}
                  onToggle={(id: string) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                  onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                  countLabel={`${columns.length} Spalten`}
                  addAction={<Button type="button" variant="outline" size="sm" className="w-full h-8 text-sm" onClick={addColumn}><Plus className="h-4 w-4 mr-1.5" />Spalte hinzufügen</Button>}
                  renderSummary={(c: ColItem) => <span className="truncate">{c.label || "Spalte"}</span>}
                  renderHeaderActions={(item: ColItem) => {
                    const i = columns.findIndex((x) => x.id === item.id)
                    return (
                      <div className="flex items-center gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i > 0) editorActions.handleMoveArrayItem(selectedBlock.id, "columns", i, i - 1) }} disabled={i === 0} title="Nach oben"><ChevronUp className="h-3 w-3" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i < columns.length - 1) editorActions.handleMoveArrayItem(selectedBlock.id, "columns", i, i + 1) }} disabled={i === columns.length - 1} title="Nach unten"><ChevronDown className="h-3 w-3" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveArrayItem(selectedBlock.id, "columns", i) }} title="Löschen"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )
                  }}
                  renderContent={(item: ColItem) => renderOneRepeaterItemFields(selectedBlock, "columns", columns.findIndex((c) => c.id === item.id), item as Record<string, unknown>, columnFields)}
                />
              )
            })()}
            <h4 className="text-sm font-medium text-foreground pt-2">Zeilen</h4>
            {(() => {
              const props = selectedBlock.props as Record<string, unknown>
              const columns = (getByPath(props, "columns") as import("@/types/cms").LegalTableColumn[]) || []
              const rows = (getByPath(props, "rows") as Array<{ id: string; cells: Record<string, string> }>) || []
              type RowItem = { id: string; cells: Record<string, string> }
              const repeaterKey = `${selectedBlock.id}:rows`
              const expandedId = expandedRepeaterCards[repeaterKey] ?? null
              const addRow = () => editorActions.handleAddArrayItem(selectedBlock.id, "rows", () => createLegalTableRow(columns))
              const updateRowCells = (rowIndex: number, columnId: string, value: string) => {
                const next = rows.map((r: RowItem, i: number) => i === rowIndex ? { ...r, cells: { ...r.cells, [columnId]: value } } : r)
                updateSelectedProps({ ...props, rows: next } as CMSBlock["props"])
              }
              return (
                <InspectorCardList<RowItem>
                  items={rows}
                  getItemId={(r: RowItem) => r.id}
                  mode="single"
                  expandedId={expandedId}
                  onToggle={(id: string) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                  onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                  countLabel={`${rows.length} Zeilen`}
                  addAction={<Button type="button" variant="outline" size="sm" className="w-full h-8 text-sm" onClick={addRow}><Plus className="h-4 w-4 mr-1.5" />Zeile hinzufügen</Button>}
                  renderSummary={() => <span className="truncate">Zeile</span>}
                  renderHeaderActions={(item: RowItem) => {
                    const i = rows.findIndex((x) => x.id === item.id)
                    return (
                      <div className="flex items-center gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i > 0) editorActions.handleMoveArrayItem(selectedBlock.id, "rows", i, i - 1) }} disabled={i === 0} title="Nach oben"><ChevronUp className="h-3 w-3" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i < rows.length - 1) editorActions.handleMoveArrayItem(selectedBlock.id, "rows", i, i + 1) }} disabled={i === rows.length - 1} title="Nach unten"><ChevronDown className="h-3 w-3" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveArrayItem(selectedBlock.id, "rows", i) }} title="Löschen"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    )
                  }}
                  renderContent={(row: RowItem) => {
                    const rowIndex = rows.findIndex((r: RowItem) => r.id === row.id)
                    const r = row
                    return (
                      <div className="space-y-3 pt-2 border-t border-border">
                        {columns.map((col, colIdx) => (
                          <div key={col.id} className="space-y-1">
                            <Label className="text-xs">{col.label?.trim() || `Spalte ${colIdx + 1}`}</Label>
                            <Input
                              value={r.cells?.[col.id] ?? ""}
                              onChange={(e) => updateRowCells(rowIndex, col.id, e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Wert"
                            />
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
              )
            })()}
          </div>
        </>
      )}

      {selectedBlock.type === "legalContactCard" && (
        <>
          <Separator />
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const lines = (getByPath(props, "lines") as Array<{ id: string; label: string; value: string; href?: string }>) || []
            const repeaterKey = `${selectedBlock.id}:lines`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const addLine = () => editorActions.handleAddArrayItem(selectedBlock.id, "lines", createLegalContactLine)
            type LineItem = { id: string; label: string; value: string; href?: string }
            const lineFields = [
              { key: "label", label: "Label", type: "text" as const },
              { key: "value", label: "Wert", type: "text" as const },
              { key: "href", label: "Link (optional)", type: "url" as const, placeholder: "https://" },
            ]
            return (
              <InspectorCardList<LineItem>
                items={lines}
                getItemId={(l: LineItem) => l.id}
                mode="single"
                expandedId={expandedId}
                onToggle={(id: string) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${lines.length} Zeilen`}
                addAction={<Button type="button" variant="outline" size="sm" className="w-full h-8 text-sm" onClick={addLine}><Plus className="h-4 w-4 mr-1.5" />Zeile hinzufügen</Button>}
                renderSummary={(item: LineItem) => <span className="truncate">{item.label || "Zeile"}</span>}
                renderHeaderActions={(item: LineItem) => {
                  const i = lines.findIndex((x) => x.id === item.id)
                  return (
                    <div className="flex items-center gap-0.5">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i > 0) editorActions.handleMoveArrayItem(selectedBlock.id, "lines", i, i - 1) }} disabled={i === 0} title="Nach oben"><ChevronUp className="h-3 w-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i < lines.length - 1) editorActions.handleMoveArrayItem(selectedBlock.id, "lines", i, i + 1) }} disabled={i === lines.length - 1} title="Nach unten"><ChevronDown className="h-3 w-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveArrayItem(selectedBlock.id, "lines", i) }} title="Löschen"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )
                }}
                renderContent={(item: LineItem) => renderOneRepeaterItemFields(selectedBlock, "lines", lines.findIndex((l: LineItem) => l.id === item.id), item as Record<string, unknown>, lineFields)}
              />
            )
          })()}
        </>
      )}

      {/* Special-case repeater – not migrated to UniversalRepeaterInspector (nested cookies per category). */}
      {selectedBlock.type === "legalCookieCategories" && (
        <>
          <Separator />
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            type CategoryItem = { id: string; name: string; description: string; required: boolean; cookies: Array<{ id: string; name: string; provider: string; purpose: string; duration: string; type: string }> }
            const categories = (getByPath(props, "categories") as CategoryItem[]) || []
            const repeaterKey = `${selectedBlock.id}:categories`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const addCategory = () => editorActions.handleAddArrayItem(selectedBlock.id, "categories", createLegalCookieCategory)
            const categoryFields = [
              { key: "name", label: "Name", type: "text" as const },
              {
                key: "description",
                label: "Beschreibung",
                type: "textarea" as const,
                placeholder: "Drücke Enter für neuen Absatz",
                helpText: "Zeilenumbrüche werden als Absätze dargestellt.",
              },
              { key: "required", label: "Erforderlich", type: "boolean" as const },
            ]
            return (
              <InspectorCardList<CategoryItem>
                items={categories}
                getItemId={(c: CategoryItem) => c.id}
                mode="single"
                expandedId={expandedId}
                onToggle={(id: string) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${categories.length} Kategorien`}
                addAction={<Button type="button" variant="outline" size="sm" className="w-full h-8 text-sm" onClick={addCategory}><Plus className="h-4 w-4 mr-1.5" />Kategorie hinzufügen</Button>}
                renderSummary={(item: CategoryItem) => <span className="truncate">{item.name || "Kategorie"}</span>}
                renderHeaderActions={(item: CategoryItem) => {
                  const i = categories.findIndex((x) => x.id === item.id)
                  return (
                    <div className="flex items-center gap-0.5">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i > 0) editorActions.handleMoveArrayItem(selectedBlock.id, "categories", i, i - 1) }} disabled={i === 0} title="Nach oben"><ChevronUp className="h-3 w-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (i < categories.length - 1) editorActions.handleMoveArrayItem(selectedBlock.id, "categories", i, i + 1) }} disabled={i === categories.length - 1} title="Nach unten"><ChevronDown className="h-3 w-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveArrayItem(selectedBlock.id, "categories", i) }} title="Löschen"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )
                }}
                renderContent={(item: CategoryItem) => {
                  const catIndex = categories.findIndex((c: CategoryItem) => c.id === item.id)
                  const category = item as { id: string; name: string; description: string; required: boolean; cookies: Array<{ id: string; name: string; provider: string; purpose: string; duration: string; type: string }> }
                  const cookies = category.cookies ?? []
                  const updateCookieField = (cookieIndex: number, field: string, value: string) => {
                    const nextCategories = categories.map((c, i) =>
                      i === catIndex
                        ? { ...c, cookies: (c.cookies ?? []).map((ck, j) => (j === cookieIndex ? { ...ck, [field]: value } : ck)) }
                        : c
                    )
                    updateSelectedProps({ ...(selectedBlock.props as Record<string, unknown>), categories: nextCategories } as CMSBlock["props"])
                  }
                  const cookiesPath = `categories.${catIndex}.cookies`
                  return (
                    <>
                      {renderOneRepeaterItemFields(selectedBlock, "categories", catIndex, item as Record<string, unknown>, categoryFields)}
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <Label className="text-xs font-medium text-foreground">Cookies in dieser Kategorie</Label>
                        <p className="text-xs text-muted-foreground">Name, Anbieter, Zweck, Dauer und Typ pro Cookie.</p>
                        {cookies.map((cookie, cookieIndex) => (
                          <div key={cookie.id} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-foreground truncate">{cookie.name?.trim() || `Cookie ${cookieIndex + 1}`}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive hover:text-destructive" onClick={() => handleRemoveArrayItem(selectedBlock.id, cookiesPath, cookieIndex)} title="Cookie entfernen"><Trash2 className="h-3 w-3" /></Button>
                            </div>
                            <div className="grid gap-2">
                              <div><Label className="text-xs">Name</Label><Input value={cookie.name} onChange={(e) => updateCookieField(cookieIndex, "name", e.target.value)} className="h-8 text-sm" placeholder="Cookie-Name" /></div>
                              <div><Label className="text-xs">Anbieter</Label><Input value={cookie.provider} onChange={(e) => updateCookieField(cookieIndex, "provider", e.target.value)} className="h-8 text-sm" placeholder="Anbieter" /></div>
                              <div><Label className="text-xs">Zweck</Label><Input value={cookie.purpose} onChange={(e) => updateCookieField(cookieIndex, "purpose", e.target.value)} className="h-8 text-sm" placeholder="Zweck" /></div>
                              <div><Label className="text-xs">Dauer</Label><Input value={cookie.duration} onChange={(e) => updateCookieField(cookieIndex, "duration", e.target.value)} className="h-8 text-sm" placeholder="z.B. 1 Jahr" /></div>
                              <div><Label className="text-xs">Typ</Label><Input value={cookie.type} onChange={(e) => updateCookieField(cookieIndex, "type", e.target.value)} className="h-8 text-sm" placeholder="z.B. HTTP" /></div>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="w-full h-8 text-sm" onClick={() => editorActions.handleAddArrayItem(selectedBlock.id, cookiesPath, createLegalCookieItem)}><Plus className="h-4 w-4 mr-1.5" />Cookie hinzufügen</Button>
                      </div>
                    </>
                  )
                }}
              />
            )
          })()}
        </>
      )}

      {selectedBlock.type === "faq" && (
        <>
          <Separator />
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const items = ((getByPath(props, "items") as Array<{ id: string; question?: string }>) || [])
            const repeaterKey = `${selectedBlock.id}:items`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const updateItems = (next: typeof items) => updateSelectedProps({ ...props, items: next } as CMSBlock["props"])
            const addItem = () => {
              const newItem = createFaqItem()
              updateItems([...items, newItem])
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            const removeItem = (itemId: string) => {
              if (expandedId === itemId) setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))
              updateItems(items.filter((i) => i.id !== itemId))
            }
            const faqFields = [
              { key: "question", label: "Frage", type: "text" as const },
              { key: "questionColor", label: "Frage Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "answer", label: "Antwort", type: "textarea" as const },
              { key: "answerColor", label: "Antwort Farbe (optional)", type: "color" as const, placeholder: "#666666" },
            ]
            return (
              <UniversalRepeaterInspector
                items={items}
                getItemId={(i) => i.id}
                renderSummary={(item) => <span className="truncate">{(item as Record<string, unknown>).question as string || "FAQ"}</span>}
                renderContent={(item, index) => renderOneRepeaterItemFields(selectedBlock, "items", index, item as Record<string, unknown>, faqFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${items.length} FAQs`}
                addLabel="FAQ hinzufügen"
                onAdd={addItem}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "items", from, to)}
                onRemove={removeItem}
                minItems={1}
              />
            )
          })()}
        </>
      )}

      {selectedBlock.type === "team" && (
        <>
          <Separator />
          
          {/* Block-Level Controls */}
          <div className="space-y-3">
            {/* Eyebrow */}
            <div className="space-y-1.5">
              <Label className="text-xs">Eyebrow (optional)</Label>
              <input
                type="text"
                value={(selectedBlock.props as any)?.eyebrow || ""}
                onChange={(e) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, eyebrow: e.target.value } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
                className="h-8 w-full rounded border border-border bg-background px-2 text-sm"
                placeholder="z.B. UNSER TEAM"
              />
            </div>

            {/* Layout */}
            <div className="space-y-1.5">
              <Label className="text-xs">Layout</Label>
              <Select
                value={(selectedBlock.props as any)?.layout || "cards"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, layout: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards (vertikal)</SelectItem>
                  <SelectItem value="compact">Compact (horizontal)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Background */}
            <div className="space-y-1.5">
              <Label className="text-xs">Hintergrund</Label>
              <Select
                value={(selectedBlock.props as any)?.background || "none"}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, background: v } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Columns */}
            <div className="space-y-1.5">
              <Label className="text-xs">Spalten</Label>
              <Select
                value={String((selectedBlock.props as any)?.columns || 3)}
                onValueChange={(v) => {
                  if (!selectedBlock) return
                  const currentProps = selectedBlock.props as Record<string, unknown>
                  const updatedProps = { ...currentProps, columns: Number(v) } as CMSBlock["props"]
                  updateSelectedProps(updatedProps)
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Members Array */}
          {(() => {
            const props = selectedBlock.props as Record<string, unknown>
            const members = ((getByPath(props, "members") as Array<{ id: string; name?: string }>) || [])
            const repeaterKey = `${selectedBlock.id}:members`
            const expandedId = expandedRepeaterCards[repeaterKey] ?? null
            const updateMembers = (next: typeof members) => updateSelectedProps({ ...props, members: next } as CMSBlock["props"])
            const addMember = () => {
              const newItem = createTeamMember()
              updateMembers([...members, newItem])
              setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: newItem.id }))
              lastAddedRepeaterRef.current = { key: repeaterKey, itemId: newItem.id }
            }
            const memberFields = [
              { key: "name", label: "Name", type: "text" as const, required: true },
              { key: "nameColor", label: "Name Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "role", label: "Rolle", type: "text" as const },
              { key: "roleColor", label: "Rolle Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "bio", label: "Bio", type: "textarea" as const },
              { key: "bioColor", label: "Bio Farbe (optional)", type: "color" as const, placeholder: "#666666" },
              { key: "bioAlign", label: "Bio Ausrichtung", type: "select" as const, options: [{ value: "left", label: "Links" }, { value: "center", label: "Mitte" }, { value: "right", label: "Rechts" }] },
              { key: "imageUrl", label: "Avatar", type: "image" as const },
              { key: "imageAlt", label: "Avatar Alt-Text", type: "text" as const },
              { key: "avatarGradient", label: "Avatar Gradient", type: "select" as const, options: [{ value: "auto", label: "Auto" }, { value: "g1", label: "Emerald" }, { value: "g2", label: "Sky" }, { value: "g3", label: "Amber" }, { value: "g4", label: "Rose" }, { value: "g5", label: "Violet" }, { value: "g6", label: "Cyan" }, { value: "g7", label: "Lime" }, { value: "g8", label: "Fuchsia" }, { value: "g9", label: "Indigo" }, { value: "g10", label: "Red" }] },
              { key: "avatarFit", label: "Bildanpassung", type: "select" as const, options: [{ value: "cover", label: "Füllen (Cover)" }, { value: "contain", label: "Vollständig (Contain)" }] },
              { key: "avatarFocus", label: "Bildfokus", type: "select" as const, options: [{ value: "center", label: "Mitte" }, { value: "top", label: "Oben" }, { value: "bottom", label: "Unten" }, { value: "left", label: "Links" }, { value: "right", label: "Rechts" }] },
              { key: "tags", label: "Tags (komma-getrennt)", type: "text" as const, placeholder: "Tag1, Tag2, Tag3" },
              { key: "ctaText", label: "CTA Text", type: "text" as const },
              { key: "ctaColor", label: "CTA Farbe (optional)", type: "color" as const, placeholder: "#111111" },
              { key: "ctaHref", label: "CTA Link", type: "url" as const },
              { key: "cardBgColor", label: "Card Hintergrund (optional)", type: "color" as const, placeholder: "#ffffff" },
              { key: "cardBorderColor", label: "Card Border (optional)", type: "color" as const, placeholder: "#e5e7eb" },
            ]
            return (
              <UniversalRepeaterInspector
                items={members}
                getItemId={(m) => m.id}
                renderSummary={(member) => <span className="truncate">{(member as Record<string, unknown>).name as string || "Mitglied"}</span>}
                renderContent={(member, index) => renderOneRepeaterItemFields(selectedBlock, "members", index, member as Record<string, unknown>, memberFields)}
                expandedId={expandedId}
                onToggle={(id) => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: expandedId === id ? null : id }))}
                onCollapseAll={() => setExpandedRepeaterCards((p) => ({ ...p, [repeaterKey]: null }))}
                countLabel={`${members.length} Mitglieder`}
                addLabel="Mitglied hinzufügen"
                onAdd={addMember}
                onMove={(from, to) => editorActions.handleMoveArrayItem(selectedBlock.id, "members", from, to)}
                onRemove={(itemId) => confirmDeleteItem(selectedBlock.id, "members", members.findIndex((m) => m.id === itemId))}
                minItems={1}
              />
            )
          })()}
        </>
      )}

      {/* Special-case repeater – not migrated to UniversalRepeaterInspector (contactForm fields/contactInfoCards with type select etc.). */}
      {selectedBlock.type === "contactForm" && (
        <>
          <Separator />
          {renderArrayItemsControls(
            selectedBlock,
            "fields",
            "Feld",
            (field, index) => {
              const f = field as unknown as Record<string, unknown>
              const t = String(f.type || "")
              const label = String(f.label || "")
              return `${index + 1}. ${label || t || "Feld"}`
            },
            () => createContactFormField("subject"),
            [
              { key: "type", label: "Typ", type: "select" as const },
              { key: "label", label: "Label", type: "text" as const },
              { key: "placeholder", label: "Placeholder", type: "text" as const },
              { key: "required", label: "Required", type: "boolean" as const },
            ]
          )}
          
          {/* Contact Info Cards */}
          {renderArrayItemsControls(
            selectedBlock,
            "contactInfoCards",
            "Info-Card",
            (card, index) => {
              const c = card as unknown as Record<string, unknown>
              const title = String(c.title || "")
              return `${index + 1}. ${title || "Card"}`
            },
            createContactInfoCard,
            [
              { key: "title", label: "Titel", type: "text" as const, required: true },
              { key: "value", label: "Wert", type: "text" as const, required: true },
              {
                key: "icon",
                label: "Icon",
                type: "select" as const,
                options: [
                  { value: "clock", label: "Uhr (Schnelle Antwort)" },
                  { value: "phone", label: "Telefon (Kostenlose Beratung)" },
                  { value: "mapPin", label: "Map-Pin (Lokale Betreuung)" },
                  { value: "mail", label: "Mail (E-Mail)" },
                ],
              },
            ]
          )}
        </>
      )}

      {/* 3) Restliche Felder mit Gruppierung und Headern */}
      {(() => {
        const visibleMidFields = midFields.filter(shouldShowField)
        const visibleLateFields = lateFields.filter(shouldShowField)

        // Get group order for this block
        const blockDef = getBlockDefinition(selectedBlock.type)
        const effectiveGroupOrder = blockDef.inspectorGroupOrder || DEFAULT_GROUP_ORDER

        // Get typography elements if block has elements
        const elements = blockDef.elements || []
        const typographyElements = elements.filter((el) => el.supportsTypography)
        
        // Check if there are any fields or typography elements to render
        if (visibleMidFields.length === 0 && visibleLateFields.length === 0 && typographyElements.length === 0) {
          return null
        }

        // Group visible fields by their group property
        const groupedFields: Record<string, InspectorField[]> = {}
        for (const field of visibleMidFields) {
          const group = field.group ?? "design"
          if (!groupedFields[group]) groupedFields[group] = []
          groupedFields[group].push(field)
        }

        // Helper to render element typography section
        const renderElementTypography = () => {
          if (typographyElements.length === 0) return null

          const blockProps = selectedBlock.props as Record<string, unknown>
          const typographyRecord = (blockProps.typography as Record<string, TypographySettings> | undefined) || {}

          const handleElementTypographyChange = (elementId: string, typography: TypographySettings | null) => {
            if (!selectedBlock) return
            isTypingRef.current = true
            const currentProps = selectedBlock.props as Record<string, unknown>
            const currentTypography = (currentProps.typography as Record<string, TypographySettings> | undefined) || {}
            
            let updatedTypography: Record<string, TypographySettings> | undefined
            if (typography) {
              updatedTypography = { ...currentTypography, [elementId]: typography }
            } else {
              const { [elementId]: _, ...rest } = currentTypography
              updatedTypography = Object.keys(rest).length > 0 ? rest : undefined
            }

            const updatedProps = setByPath(currentProps, "typography", updatedTypography) as CMSBlock["props"]
            updateSelectedProps(updatedProps)
            setTimeout(() => {
              isTypingRef.current = false
            }, 50)
          }

          return (
            <ElementTypographyAccordion
              blockProps={blockProps}
              typographyElements={typographyElements}
              selectedElementId={selectedElementId}
              accordionValue={accordionValue}
              onAccordionValueChange={setAccordionValue}
              onElementTypographyChange={handleElementTypographyChange}
            />
          )
        }

        return (
          <>
            {/* Render grouped fields in order, with special handling for "elements" group and legalHero "design" group */}
            {effectiveGroupOrder.map((group) => {
              const groupFields = groupedFields[group] || []
              const hasElementTypography = group === "elements" && typographyElements.length > 0
              const isLegalHeroDesignGroup = selectedBlock.type === "legalHero" && group === "design"
              const isLegalRichTextDesignGroup = selectedBlock.type === "legalRichText" && group === "design"

              if (groupFields.length === 0 && !hasElementTypography) {
                return null
              }

              // legalRichText: Design (Ausrichtung, Überschrift-Größe, Variante) + Farben im Akkordeon
              if (isLegalRichTextDesignGroup) {
                return (
                  <div key={group}>
                    <Separator />
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <Label className="text-xs font-semibold">{INSPECTOR_GROUP_LABELS[group] || group}</Label>
                      <div className="space-y-3 mt-2">
                        {groupFields.map((field) => (
                          <div key={field.key}>{renderInspectorField(field, selectedBlock)}</div>
                        ))}
                        <LegalRichTextColorAccordion
                          block={selectedBlock as CMSBlock & { type: "legalRichText" }}
                          updateSelectedProps={updateSelectedProps}
                        />
                      </div>
                    </div>
                  </div>
                )
              }

              // Special rendering for legalHero design group with Accordions
              if (isLegalHeroDesignGroup) {
                return (
                  <div key={group}>
                    <LegalHeroAccordion
                      block={selectedBlock}
                      fields={groupFields}
                      onFieldChange={(key, value) => {
                        const updatedProps = setByPath(selectedBlock.props as Record<string, unknown>, key, value) as CMSBlock["props"]
                        updateSelectedProps(updatedProps)
                      }}
                      renderInspectorField={renderInspectorField}
                    />
                  </div>
                )
              }

              return (
                <div key={group}>
                  <Separator />
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <Label className="text-xs font-semibold">{INSPECTOR_GROUP_LABELS[group] || group}</Label>
                    <div className="space-y-3 mt-2">
                      {groupFields.map((field) => (
                        <div key={field.key}>
                          {renderInspectorField(field, selectedBlock)}
                        </div>
                      ))}
                      {hasElementTypography && renderElementTypography()}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Render late fields if any */}
            {visibleLateFields.length > 0 && (
              <div>
                <Separator />
                <div className="mt-3 pt-3">
                  {visibleLateFields.map((field) => (
                    <div key={field.key}>
                      {renderInspectorField(field, selectedBlock)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      })()}

    </>
  )
})()}

              </div>

        </div>
      )}

    </>
  )
}
