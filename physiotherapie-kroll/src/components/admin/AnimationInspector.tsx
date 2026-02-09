"use client"

import * as React from "react"
import type { SingleAnimationConfig, BlockAnimationConfig } from "@/lib/animations/types"
import {
  ANIMATION_TYPES,
  ANIMATION_LABELS,
  ANIMATION_TRIGGERS,
  TRIGGER_LABELS,
  EASING_TYPES,
  EASING_LABELS,
} from "@/lib/animations/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnimationInspectorProps {
  config: BlockAnimationConfig
  onChange: (config: BlockAnimationConfig) => void
}

/**
 * Inspector Component: Konfiguriere Animationen für Block
 */
export function AnimationInspector({ config: configProp, onChange }: AnimationInspectorProps) {
  // Ensure config has all required properties
  const config: BlockAnimationConfig = {
    enabled: configProp?.enabled ?? false,
    enter: configProp?.enter ?? {
      type: "none",
      duration: 300,
      delay: 0,
      easing: "ease-out",
      trigger: "onLoad",
      once: true,
    },
    exit: configProp?.exit ?? {
      type: "none",
      duration: 300,
      delay: 0,
      easing: "ease-out",
      trigger: "onLoad",
      once: true,
    },
    hover: configProp?.hover ?? {
      type: "none",
      duration: 300,
      delay: 0,
      easing: "ease-out",
      trigger: "onHover",
      once: false,
    },
  }

  const handleToggleEnabled = (enabled: boolean) => {
    onChange({ ...config, enabled })
  }

  const handleConfigChange = (stage: "enter" | "exit" | "hover", updates: Partial<SingleAnimationConfig>) => {
    const stageConfig = config[stage]
    if (!stageConfig) return

    onChange({
      ...config,
      [stage]: { ...stageConfig, ...updates },
    })
  }

  return (
    <Card className="border border-border bg-card">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Enable/Disable */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-background border border-input hover:border-primary/50 transition-colors">
            <Checkbox
              id="animations-enabled"
              checked={config.enabled}
              onCheckedChange={handleToggleEnabled}
              className="w-5 h-5"
            />
            <Label htmlFor="animations-enabled" className="font-medium cursor-pointer text-foreground">
              Animationen aktivieren
            </Label>
          </div>

          {!config.enabled && (
            <div className="mb-4 px-3 py-2 rounded-md bg-muted/60 border border-muted text-xs text-muted-foreground italic">
              Animationen sind deaktiviert
            </div>
          )}

          {config.enabled && (
            <Tabs defaultValue="enter" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="enter">Eingang</TabsTrigger>
                <TabsTrigger value="exit">Ausgang</TabsTrigger>
                <TabsTrigger value="hover">Hover</TabsTrigger>
              </TabsList>

              {config.enter && (
                <TabsContent value="enter" className="space-y-3 mt-4">
                  <AnimationConfigSection
                    stage="Enter (Eingangsanimation)"
                    config={config.enter}
                    onChange={(updates) => handleConfigChange("enter", updates)}
                  />
                </TabsContent>
              )}

              {config.exit && (
                <TabsContent value="exit" className="space-y-3 mt-4">
                  <AnimationConfigSection
                    stage="Exit (Ausgangsanimation)"
                    config={config.exit}
                    onChange={(updates) => handleConfigChange("exit", updates)}
                  />
                </TabsContent>
              )}

              {config.hover && (
                <TabsContent value="hover" className="space-y-3 mt-4">
                  <AnimationConfigSection
                    stage="Hover (Hover-Animation)"
                    config={config.hover}
                    onChange={(updates) => handleConfigChange("hover", updates)}
                  />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AnimationConfigSectionProps {
  stage: string
  config?: SingleAnimationConfig
  onChange: (updates: Partial<SingleAnimationConfig>) => void
}

function AnimationConfigSection({ stage, config, onChange }: AnimationConfigSectionProps) {
  if (!config) return null

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{stage}</h4>

      {/* Animation Type */}
      <div className="space-y-1 mb-4">
        <Label className="text-xs text-muted-foreground">Animationstyp</Label>
        <Select value={config.type} onValueChange={(type) => onChange({ type: type as any })}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ANIMATION_TYPES).map(([key, value]) => (
              <SelectItem key={key} value={value}>
                {ANIMATION_LABELS[value as keyof typeof ANIMATION_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.type !== "none" && (
        <>
          {/* Trigger */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Auslöser</Label>
            <Select value={config.trigger} onValueChange={(trigger) => onChange({ trigger: trigger as any })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ANIMATION_TRIGGERS).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {TRIGGER_LABELS[value as keyof typeof TRIGGER_LABELS]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration & Delay */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Dauer (ms)</Label>
              <Input
                type="number"
                value={config.duration}
                onChange={(e) => onChange({ duration: parseInt(e.target.value) || 0 })}
                min={0}
                max={2000}
                step={100}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Verzögerung (ms)</Label>
              <Input
                type="number"
                value={config.delay}
                onChange={(e) => onChange({ delay: parseInt(e.target.value) || 0 })}
                min={0}
                max={1000}
                step={50}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Easing */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Easing-Funktion</Label>
            <Select value={config.easing} onValueChange={(easing) => onChange({ easing: easing as any })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EASING_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {EASING_LABELS[value as keyof typeof EASING_LABELS]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stagger */}
          {config.stagger !== undefined && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Stagger für Kinder (ms)</Label>
              <Input
                type="number"
                value={config.stagger}
                onChange={(e) => onChange({ stagger: parseInt(e.target.value) || 0 })}
                min={0}
                max={200}
                step={10}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Once */}
          <div className="flex items-center gap-2">
            <Checkbox
              id={`once-${stage}`}
              checked={config.once}
              onCheckedChange={(checked) => onChange({ once: !!checked })}
            />
            <Label htmlFor={`once-${stage}`} className="text-xs cursor-pointer">
              Nur einmal (bei Scroll)
            </Label>
          </div>

          {/* Scroll Trigger Params */}
          {config.trigger === "onScroll" && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Threshold (0-1)</Label>
              <Input
                type="number"
                value={config.threshold ?? 0.1}
                onChange={(e) => onChange({ threshold: parseFloat(e.target.value) || 0.1 })}
                min={0}
                max={1}
                step={0.1}
                className="h-8 text-xs"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
