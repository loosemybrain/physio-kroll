"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CMSBlock } from "@/types/cms"
import type { InspectorFieldType } from "@/cms/blocks/registry"
import { getByPath, setByPath } from "@/lib/cms/editorPathOps"
import { ColorField } from "../../../ColorField"
import { ImageField } from "../../../ImageField"

export interface RenderRepeaterItemFieldsOptions {
  block: CMSBlock
  arrayPath: string
  index: number
  item: Record<string, unknown>
  itemFields: Array<{
    key: string
    label: string
    type: InspectorFieldType
    placeholder?: string
    required?: boolean
    options?: Array<{ value: string; label: string }>
  }>
  activeFieldPath: string | null
  selectedBlock: CMSBlock | null
  isTypingRef: React.MutableRefObject<boolean>
  fieldRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>
  updateSelectedProps: (nextProps: CMSBlock["props"]) => void
}

export const renderRepeaterItemFields = ({
  block,
  arrayPath,
  index,
  item,
  itemFields,
  activeFieldPath,
  selectedBlock,
  isTypingRef,
  fieldRefs,
  updateSelectedProps,
}: RenderRepeaterItemFieldsOptions): React.ReactNode => (
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
              <Textarea id={itemFieldId} value={String(itemFieldValue)} onChange={(e) => handleItemFieldChange(e.target.value)} className={cn("text-sm min-h-[60px]", isActive && "ring-2 ring-primary")} placeholder={itemField.label} />
            </div>
          )
        case "color":
          return (
            <div key={itemField.key} className="space-y-1.5">
              <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
              <div className={cn(isActive && "ring-2 ring-primary rounded-md")}>
                <ColorField value={String(itemFieldValue)} onChange={(v: string) => handleItemFieldChange(v)} placeholder={itemField.placeholder || "#rrggbb"} inputRef={(el: HTMLInputElement | null) => { fieldRefs.current[itemFieldId] = el }} />
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
          return (
            <div key={itemField.key} className="space-y-1.5">
              <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
              <Select value={String(itemFieldValue ?? "")} onValueChange={(v: string) => handleItemFieldChange(v)}>
                <SelectTrigger id={itemFieldId} className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")}><SelectValue placeholder={itemField.placeholder || "Wählen"} /></SelectTrigger>
                <SelectContent>
                  {(itemField.options || []).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        case "image":
          return (
            <div key={itemField.key} className="space-y-1.5">
              <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
              <ImageField id={itemFieldId} label="" value={String(itemFieldValue)} onChange={(v: string) => handleItemFieldChange(v)} placeholder={itemField.placeholder} inputRef={(el: HTMLInputElement | null) => { fieldRefs.current[itemFieldId] = el }} />
            </div>
          )
        case "url":
          return (
            <div key={itemField.key} className="space-y-1.5">
              <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
              <Input id={itemFieldId} type="url" value={String(itemFieldValue)} onChange={(e) => handleItemFieldChange(e.target.value)} className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")} placeholder={itemField.placeholder} />
            </div>
          )
        case "boolean":
        case "toggle":
          return (
            <div key={itemField.key} className="flex items-center space-x-2">
              <Checkbox id={itemFieldId} checked={Boolean(itemFieldValue)} onCheckedChange={(checked) => handleItemFieldChange(checked)} />
              <Label htmlFor={itemFieldId} className="text-xs cursor-pointer">{itemField.label}</Label>
            </div>
          )
        case "number":
          return (
            <div key={itemField.key} className="space-y-1.5">
              <Label htmlFor={itemFieldId} className="text-xs">{itemField.label}</Label>
              <Input id={itemFieldId} type="number" value={String(itemFieldValue)} onChange={(e) => handleItemFieldChange(Number(e.target.value) || "")} className={cn("h-8 text-sm", isActive && "ring-2 ring-primary")} placeholder={itemField.placeholder} />
            </div>
          )
        default:
          return null
      }
    })}
  </div>
)
