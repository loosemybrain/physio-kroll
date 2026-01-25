"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RotateCcw } from "lucide-react"
import type { TypographySettings } from "@/lib/typography"

interface TypographyInspectorSectionProps {
  typography: TypographySettings | null | undefined
  onChange: (typography: TypographySettings | null) => void
}

export function TypographyInspectorSection({
  typography,
  onChange,
}: TypographyInspectorSectionProps) {
  const [localTypography, setLocalTypography] = useState<TypographySettings | null>(
    typography || null
  )

  // Sync local state with prop changes
  useEffect(() => {
    setLocalTypography(typography || null)
  }, [typography])

  const updateTypography = (updates: Partial<TypographySettings>) => {
    const newTypography = {
      ...localTypography,
      ...updates,
    } as TypographySettings

    // Remove undefined values
    const cleaned = Object.fromEntries(
      Object.entries(newTypography).filter(([_, v]) => v !== undefined)
    ) as TypographySettings

    setLocalTypography(Object.keys(cleaned).length > 0 ? cleaned : null)
    onChange(Object.keys(cleaned).length > 0 ? cleaned : null)
  }

  const handleReset = () => {
    setLocalTypography(null)
    onChange(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Typografie</Label>
        {localTypography && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Zurücksetzen
          </Button>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        {/* Font Family */}
        <div className="space-y-1.5">
          <Label htmlFor="typography-fontFamily" className="text-xs">
            Schriftart
          </Label>
          <Select
            value={localTypography?.fontFamily || "__default__"}
            onValueChange={(value: "sans" | "serif" | "__default__") => {
              if (value === "__default__") {
                updateTypography({ fontFamily: undefined })
              } else {
                updateTypography({ fontFamily: value })
              }
            }}
          >
            <SelectTrigger id="typography-fontFamily" className="h-8 text-sm">
              <SelectValue placeholder="Standard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Standard</SelectItem>
              <SelectItem value="sans">Sans (Inter)</SelectItem>
              <SelectItem value="serif">Serif (Playfair Display)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Weight */}
        <div className="space-y-1.5">
          <Label htmlFor="typography-fontWeight" className="text-xs">
            Schriftstärke
          </Label>
          <Select
            value={localTypography?.fontWeight?.toString() || "__default__"}
            onValueChange={(value: string) => {
              if (value === "__default__") {
                updateTypography({ fontWeight: undefined })
              } else {
                updateTypography({ fontWeight: parseInt(value, 10) as 300 | 400 | 500 | 600 | 700 })
              }
            }}
          >
            <SelectTrigger id="typography-fontWeight" className="h-8 text-sm">
              <SelectValue placeholder="Standard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Standard</SelectItem>
              <SelectItem value="300">Light (300)</SelectItem>
              <SelectItem value="400">Normal (400)</SelectItem>
              <SelectItem value="500">Medium (500)</SelectItem>
              <SelectItem value="600">Semibold (600)</SelectItem>
              <SelectItem value="700">Bold (700)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-1.5">
          <Label htmlFor="typography-fontSize" className="text-xs">
            Schriftgröße
          </Label>
          <Select
            value={localTypography?.fontSize || "__default__"}
            onValueChange={(value: string) => {
              if (value === "__default__") {
                updateTypography({ fontSize: undefined })
              } else {
                updateTypography({
                  fontSize: value as "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
                })
              }
            }}
          >
            <SelectTrigger id="typography-fontSize" className="h-8 text-sm">
              <SelectValue placeholder="Standard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Standard</SelectItem>
              <SelectItem value="xs">Extra Small (xs)</SelectItem>
              <SelectItem value="sm">Small (sm)</SelectItem>
              <SelectItem value="base">Base</SelectItem>
              <SelectItem value="lg">Large (lg)</SelectItem>
              <SelectItem value="xl">Extra Large (xl)</SelectItem>
              <SelectItem value="2xl">2XL</SelectItem>
              <SelectItem value="3xl">3XL</SelectItem>
              <SelectItem value="4xl">4XL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Height */}
        <div className="space-y-1.5">
          <Label htmlFor="typography-lineHeight" className="text-xs">
            Zeilenhöhe
          </Label>
          <Select
            value={localTypography?.lineHeight || "__default__"}
            onValueChange={(value: string) => {
              if (value === "__default__") {
                updateTypography({ lineHeight: undefined })
              } else {
                updateTypography({
                  lineHeight: value as "tight" | "snug" | "normal" | "relaxed" | "loose",
                })
              }
            }}
          >
            <SelectTrigger id="typography-lineHeight" className="h-8 text-sm">
              <SelectValue placeholder="Standard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Standard</SelectItem>
              <SelectItem value="tight">Tight</SelectItem>
              <SelectItem value="snug">Snug</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="relaxed">Relaxed</SelectItem>
              <SelectItem value="loose">Loose</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Letter Spacing */}
        <div className="space-y-1.5">
          <Label htmlFor="typography-letterSpacing" className="text-xs">
            Zeichenabstand
          </Label>
          <Select
            value={localTypography?.letterSpacing || "__default__"}
            onValueChange={(value: string) => {
              if (value === "__default__") {
                updateTypography({ letterSpacing: undefined })
              } else {
                updateTypography({
                  letterSpacing: value as "tighter" | "tight" | "normal" | "wide" | "wider",
                })
              }
            }}
          >
            <SelectTrigger id="typography-letterSpacing" className="h-8 text-sm">
              <SelectValue placeholder="Standard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Standard</SelectItem>
              <SelectItem value="tighter">Tighter</SelectItem>
              <SelectItem value="tight">Tight</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
              <SelectItem value="wider">Wider</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Italic */}
        <div className="flex items-center justify-between">
          <Label htmlFor="typography-italic" className="text-xs">
            Kursiv
          </Label>
          <Switch
            id="typography-italic"
            checked={localTypography?.italic || false}
            onCheckedChange={(checked) => {
              updateTypography({ italic: checked || undefined })
            }}
          />
        </div>
      </div>
    </div>
  )
}
