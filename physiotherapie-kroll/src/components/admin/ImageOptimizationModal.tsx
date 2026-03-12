"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OptimizeImageIntent, OptimizeMode } from "@/lib/images/optimizeImageForUpload"
import { cn } from "@/lib/utils"

const INTENT_OPTIONS: { value: OptimizeImageIntent; label: string }[] = [
  { value: "general", label: "Allgemein" },
  { value: "hero", label: "Hero" },
  { value: "gallery", label: "Galerie" },
  { value: "card", label: "Card" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "logo", label: "Logo" },
]

const MODE_OPTIONS: { value: OptimizeMode; label: string }[] = [
  { value: "auto", label: "Automatisch empfohlen" },
  { value: "near-lossless", label: "Nahezu verlustfrei" },
  { value: "balanced", label: "Standard" },
  { value: "strong", label: "Stark komprimiert" },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export type ImageOptimizationModalResult = {
  intent: OptimizeImageIntent
  mode: OptimizeMode
  useForThisUpload: boolean
}

type ImageOptimizationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File
  onOptimizeAndUpload: (options: ImageOptimizationModalResult) => void
  onUseOriginal: () => void
  onCancel: () => void
}

export function ImageOptimizationModal({
  open,
  onOpenChange,
  file,
  onOptimizeAndUpload,
  onUseOriginal,
  onCancel,
}: ImageOptimizationModalProps) {
  const [intent, setIntent] = React.useState<OptimizeImageIntent>("general")
  const [mode, setMode] = React.useState<OptimizeMode>("auto")
  const [useForThisUpload, setUseForThisUpload] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open || !file) return
    setIntent("general")
    setMode("auto")
    setUseForThisUpload(false)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [open, file])

  const handleOptimize = () => {
    onOptimizeAndUpload({ intent, mode, useForThisUpload })
    onOpenChange(false)
  }

  const handleUseOriginal = () => {
    onUseOriginal()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel()
    onOpenChange(false)
  }

  const sizeStr = file ? formatBytes(file.size) : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Bild optimieren</DialogTitle>
          <DialogDescription>
            Wählen Sie Verwendungszweck und Stärke der Komprimierung. Das Bild wird vor dem Upload optimiert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-4">
            {previewUrl && (
              <div className="shrink-0 rounded-md border border-border overflow-hidden bg-muted/30">
                <img
                  src={previewUrl}
                  alt=""
                  className="h-24 w-24 object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Originalgröße: {sizeStr}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Verwendungszweck</Label>
            <Select value={intent} onValueChange={(v) => setIntent(v as OptimizeImageIntent)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Optimierung</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as OptimizeMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="use-for-upload"
              checked={useForThisUpload}
              onCheckedChange={(checked) => setUseForThisUpload(checked === true)}
            />
            <Label
              htmlFor="use-for-upload"
              className="text-sm font-normal cursor-pointer"
            >
              Diese Auswahl für diesen Upload verwenden
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button type="button" variant="outline" onClick={handleUseOriginal}>
            Original verwenden
          </Button>
          <Button type="button" onClick={handleOptimize}>
            Optimieren &amp; hochladen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
