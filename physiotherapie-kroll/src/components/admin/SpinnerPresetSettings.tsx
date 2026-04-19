"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SpinnerIndicator } from "@/components/ui/SpinnerIndicator"
import {
  readSpinnerConfigsAllBrands,
  SPINNER_OVERLAYS,
  SPINNER_SPEEDS,
  SPINNER_PRESETS,
  writeSpinnerConfigForBrand,
  type SpinnerBrandKey,
  type SpinnerConfig,
} from "@/lib/ui/spinnerPresets"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SpinnerPresetSettings() {
  const { toast } = useToast()
  const [activeBrand, setActiveBrand] = React.useState<SpinnerBrandKey>("physiotherapy")
  const [configs, setConfigs] = React.useState<Record<SpinnerBrandKey, SpinnerConfig>>({
    physiotherapy: { preset: "modern", speed: "normal", overlayStrength: "medium" },
    "physio-konzept": { preset: "modern", speed: "normal", overlayStrength: "medium" },
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setConfigs(readSpinnerConfigsAllBrands())
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const current = configs[activeBrand]
      writeSpinnerConfigForBrand(activeBrand, current)
      toast({
        title: "Spinner-Preset gespeichert",
        description: `${activeBrand === "physio-konzept" ? "Physio‑Konzept" : "Physiotherapie"}: ${SPINNER_PRESETS.find((p) => p.key === current.preset)?.label ?? current.preset} (${SPINNER_SPEEDS.find((s) => s.key === current.speed)?.label ?? current.speed}, Overlay: ${SPINNER_OVERLAYS.find((o) => o.key === current.overlayStrength)?.label ?? current.overlayStrength})`,
      })
    } finally {
      window.setTimeout(() => setSaving(false), 200)
    }
  }

  const current = configs[activeBrand]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spinner Presets</CardTitle>
        <CardDescription>
          Definiert den globalen Loader beim Seitenladen und Seitenwechsel – getrennt pro Brand.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeBrand} onValueChange={(v) => setActiveBrand(v as SpinnerBrandKey)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
            <TabsTrigger value="physio-konzept">Physio‑Konzept</TabsTrigger>
          </TabsList>

          {(["physiotherapy", "physio-konzept"] as SpinnerBrandKey[]).map((brand) => (
            <TabsContent key={brand} value={brand} className="space-y-4 mt-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-2 text-sm font-medium">Live Vorschau</div>
                <div className="flex h-24 items-center justify-center rounded-md bg-background">
                  <SpinnerIndicator preset={configs[brand].preset} speed={configs[brand].speed} size="lg" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {SPINNER_PRESETS.map((preset) => {
                  const active = configs[brand].preset === preset.key
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() =>
                        setConfigs((prev) => ({
                          ...prev,
                          [brand]: { ...prev[brand], preset: preset.key },
                        }))
                      }
                      className={cn(
                        "rounded-lg border p-4 text-left transition-colors",
                        active ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/30"
                      )}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <SpinnerIndicator preset={preset.key} speed={configs[brand].speed} size="sm" />
                        <div className="font-medium">{preset.label}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 text-sm font-medium">Geschwindigkeit</div>
                <div className="grid gap-2 md:grid-cols-3">
                  {SPINNER_SPEEDS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setConfigs((prev) => ({
                          ...prev,
                          [brand]: { ...prev[brand], speed: item.key },
                        }))
                      }
                      className={cn(
                        "rounded-md border p-3 text-left transition-colors",
                        configs[brand].speed === item.key ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/30"
                      )}
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 text-sm font-medium">Overlay-Stärke</div>
                <div className="grid gap-2 md:grid-cols-3">
                  {SPINNER_OVERLAYS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setConfigs((prev) => ({
                          ...prev,
                          [brand]: { ...prev[brand], overlayStrength: item.key },
                        }))
                      }
                      className={cn(
                        "rounded-md border p-3 text-left transition-colors",
                        configs[brand].overlayStrength === item.key
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:bg-muted/30"
                      )}
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </button>
                  ))}
                </div>
              </div>

            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {`Speichern (${activeBrand === "physio-konzept" ? "Physio‑Konzept" : "Physiotherapie"})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

