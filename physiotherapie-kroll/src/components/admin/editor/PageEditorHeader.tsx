"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Send } from "lucide-react"
import type { CMSPage, PageType, PageSubtype } from "@/types/cms"
import { isLegalPageType } from "@/types/cms"
import type { BrandKey } from "@/components/brand/brandAssets"
import type { AdminPage } from "@/lib/cms/supabaseStore"

interface PageEditorHeaderProps {
  current: AdminPage
  onBack: () => void
  onUpdatePage: (updates: Partial<AdminPage>) => void
  onBrandChange: (brand: BrandKey) => void
  onSaveDraft: () => void
  onPublish: () => void
}

export function PageEditorHeader({
  current,
  onBack,
  onUpdatePage,
  onBrandChange,
  onSaveDraft,
  onPublish,
}: PageEditorHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to pages">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <Input
            value={current.title}
            onChange={(e) => onUpdatePage({ title: e.target.value })}
            className="h-8 w-64 border-none bg-transparent text-lg font-medium shadow-none focus-visible:ring-0"
          />
          <Input
            value={current.slug}
            onChange={(e) => onUpdatePage({ slug: e.target.value })}
            className="h-8 w-48"
            placeholder="slug"
          />

          <Select value={current.brand} onValueChange={(v: string) => onBrandChange(v as BrandKey)}>
            <SelectTrigger className="h-8 w-52">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physiotherapy">Physiotherapie</SelectItem>
              <SelectItem value="physio-konzept">PhysioKonzept</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={current.pageType ?? "default"}
            onValueChange={(v: string) => {
              const nextType = v as PageType
              onUpdatePage(
                isLegalPageType(nextType)
                  ? { pageType: nextType }
                  : { pageType: nextType, pageSubtype: null }
              )
            }}
          >
            <SelectTrigger className="h-8 w-40">
              <SelectValue placeholder="Seitentyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Standard</SelectItem>
              <SelectItem value="landing">Landingpage</SelectItem>
              <SelectItem value="legal">Rechtliches</SelectItem>
            </SelectContent>
          </Select>

          {isLegalPageType((current.pageType ?? "default") as PageType) && (
            <Select
              value={current.pageSubtype ?? "__none__"}
              onValueChange={(v: string) =>
                onUpdatePage({
                  pageSubtype: v === "__none__" ? null : (v as PageSubtype),
                })
              }
            >
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Untertyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                <SelectItem value="privacy">Datenschutz</SelectItem>
                <SelectItem value="cookies">Cookies</SelectItem>
                <SelectItem value="imprint">Impressum</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2 bg-transparent" onClick={onSaveDraft}>
          <Save className="h-4 w-4" />
          Save draft
        </Button>
        <Button className="gap-2" onClick={onPublish}>
          <Send className="h-4 w-4" />
          Publish
        </Button>
      </div>
    </div>
  )
}
