"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SpinnerIndicator } from "@/components/ui/SpinnerIndicator"
import {
  readSpinnerPreset,
  SPINNER_PRESETS,
  writeSpinnerPreset,
  type SpinnerPresetKey,
} from "@/lib/ui/spinnerPresets"
import { cn } from "@/lib/utils"

export function SpinnerPresetSettings() {
  const { toast } = useToast()
  const [selected, setSelected] = React.useState<SpinnerPresetKey>("modern")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setSelected(readSpinnerPreset())
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      writeSpinnerPreset(selected)
      toast({
        title: "Spinner-Preset gespeichert",
        description: `Aktives Preset: ${SPINNER_PRESETS.find((p) => p.key === selected)?.label ?? selected}`,
      })
    } finally {
      window.setTimeout(() => setSaving(false), 200)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spinner Presets</CardTitle>
        <CardDescription>
          Definiert den globalen Loader beim Seitenladen und Seitenwechsel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {SPINNER_PRESETS.map((preset) => {
            const active = selected === preset.key
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => setSelected(preset.key)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  active ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/30"
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <SpinnerIndicator preset={preset.key} size="sm" />
                  <div className="font-medium">{preset.label}</div>
                </div>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </button>
            )
          })}
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="mb-2 text-sm font-medium">Live Vorschau</div>
          <div className="flex h-24 items-center justify-center rounded-md bg-background">
            <SpinnerIndicator preset={selected} size="lg" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

