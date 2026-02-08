"use client"

import * as React from "react"
import type { ElementShadow } from "@/types/cms"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SHADOW_PRESETS, type ShadowPresetKey } from "@/lib/shadow/shadowPresets"

interface ShadowInspectorProps {
  config?: ElementShadow
  onChange: (config: ElementShadow) => void
  onClose?: () => void
}

export function ShadowInspector({ config = {}, onChange, onClose }: ShadowInspectorProps) {
  const [localConfig, setLocalConfig] = React.useState<ElementShadow>({
    enabled: config.enabled ?? false,
    preset: config.preset ?? "none",
    inset: config.inset ?? false,
    x: config.x ?? 0,
    y: config.y ?? 4,
    blur: config.blur ?? 6,
    spread: config.spread ?? -1,
    color: config.color ?? "rgba(0, 0, 0, 0.1)",
    opacity: config.opacity ?? 1,
  })

  // Synchronize localConfig when config prop changes (element selection changed)
  React.useEffect(() => {
    setLocalConfig({
      enabled: config.enabled ?? false,
      preset: config.preset ?? "none",
      inset: config.inset ?? false,
      x: config.x ?? 0,
      y: config.y ?? 4,
      blur: config.blur ?? 6,
      spread: config.spread ?? -1,
      color: config.color ?? "rgba(0, 0, 0, 0.1)",
      opacity: config.opacity ?? 1,
    })
  }, [config])

  const handleChange = (updates: Partial<ElementShadow>) => {
    const newConfig = { ...localConfig, ...updates }
    setLocalConfig(newConfig)
    onChange(newConfig)
  }

  const presets = Object.keys(SHADOW_PRESETS) as ShadowPresetKey[]
  const isCustom = localConfig.preset === "custom"

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Shadow</h4>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="shadow-enabled"
          checked={localConfig.enabled}
          onCheckedChange={(checked) => handleChange({ enabled: !!checked })}
          className="h-5 w-5"
        />
        <Label htmlFor="shadow-enabled" className="cursor-pointer text-sm font-medium">
          Enable Shadow
        </Label>
      </div>

      {/* Preset Select */}
      {localConfig.enabled && (
        <>
          <div className="space-y-2">
            <Label htmlFor="shadow-preset" className="text-xs font-medium text-muted-foreground">
              Preset
            </Label>
            <Select
              value={localConfig.preset || "none"}
              onValueChange={(value) => {
                // Wenn auf "glow" gewechselt wird und color kein hex ist, Standard setzen
                if (
                  value === "glow" &&
                  (!/^#[0-9A-Fa-f]{6}$/.test(localConfig.color ?? "") ||
                    typeof localConfig.color !== "string")
                ) {
                  handleChange({
                    preset: value as ShadowPresetKey,
                    color: "#3b82f6",
                    opacity: 0.5,
                  })
                } else {
                  handleChange({ preset: value as ShadowPresetKey })
                }
              }}
            >
              <SelectTrigger id="shadow-preset" className="h-8">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Glow Shadow Settings */}
          {localConfig.preset === "glow" && (
            <div className="space-y-3 rounded-md border border-border/50 bg-muted/20 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Glow Einstellungen</p>
              {/* Color Picker für Glow */}
              <div className="space-y-1.5">
                <Label htmlFor="glow-color" className="text-xs">
                  Glow-Farbe
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="glow-color"
                    type="color"
                    value={
                      // Nur Hexfarbwerte im Picker verwenden, sonst Default
                      /^#[0-9A-Fa-f]{6}$/.test(localConfig.color ?? "")
                        ? localConfig.color!
                        : "#3b82f6"
                    }
                    onChange={(e) => handleChange({ color: e.target.value })}
                    className="h-8 w-10 p-0 border border-border rounded"
                    style={{ background: "none" }}
                  />
                  <Input
                    type="text"
                    value={localConfig.color ?? ""}
                    onChange={(e) => handleChange({ color: e.target.value })}
                    className="h-8 text-sm flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              {/* Opacity für Glow */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="glow-opacity" className="text-xs">
                    Opazität
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {typeof localConfig.opacity === "number"
                      ? localConfig.opacity.toFixed(2)
                      : "0.5"}
                  </span>
                </div>
                {/* Slider can be used here for nice UX, keep Input for consistency */}
                <Input
                  id="glow-opacity"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={
                    (typeof localConfig.opacity === "number"
                      ? localConfig.opacity
                      : 0.5)
                  }
                  onChange={(e) => {
                    let next = parseFloat(e.target.value)
                    if (isNaN(next)) next = 0.5
                    if (next > 1) next = 1
                    if (next < 0) next = 0
                    handleChange({ opacity: next })
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Custom Shadow Settings */}
          {isCustom && (
            <div className="space-y-3 rounded-md border border-border/50 bg-muted/20 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Custom Shadow</p>

              {/* Inset Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="shadow-inset"
                  checked={localConfig.inset ?? false}
                  onCheckedChange={(checked) => handleChange({ inset: !!checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="shadow-inset" className="cursor-pointer text-xs">
                  Inset
                </Label>
              </div>

              {/* X Offset */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow-x" className="text-xs">
                    X Offset
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {localConfig.x}px
                  </span>
                </div>
                <Input
                  id="shadow-x"
                  type="number"
                  value={localConfig.x ?? 0}
                  onChange={(e) => handleChange({ x: parseInt(e.target.value, 10) || 0 })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Y Offset */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow-y" className="text-xs">
                    Y Offset
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {localConfig.y}px
                  </span>
                </div>
                <Input
                  id="shadow-y"
                  type="number"
                  value={localConfig.y ?? 4}
                  onChange={(e) => handleChange({ y: parseInt(e.target.value, 10) || 0 })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Blur Radius */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow-blur" className="text-xs">
                    Blur Radius
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {localConfig.blur}px
                  </span>
                </div>
                <Input
                  id="shadow-blur"
                  type="number"
                  value={localConfig.blur ?? 6}
                  onChange={(e) => handleChange({ blur: parseInt(e.target.value, 10) || 0 })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Spread Radius */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow-spread" className="text-xs">
                    Spread Radius
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {localConfig.spread}px
                  </span>
                </div>
                <Input
                  id="shadow-spread"
                  type="number"
                  value={localConfig.spread ?? -1}
                  onChange={(e) => handleChange({ spread: parseInt(e.target.value, 10) || 0 })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label htmlFor="shadow-color" className="text-xs">
                  Color
                </Label>
                <Input
                  id="shadow-color"
                  type="text"
                  value={localConfig.color ?? "rgba(0, 0, 0, 0.1)"}
                  onChange={(e) => handleChange({ color: e.target.value })}
                  placeholder="rgba(0, 0, 0, 0.1)"
                  className="h-8 text-sm"
                />
              </div>

              {/* Opacity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shadow-opacity" className="text-xs">
                    Opacity
                  </Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {(localConfig.opacity ?? 1).toFixed(2)}
                  </span>
                </div>
                <Input
                  id="shadow-opacity"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localConfig.opacity ?? 1}
                  onChange={(e) => handleChange({ opacity: parseFloat(e.target.value) || 1 })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
