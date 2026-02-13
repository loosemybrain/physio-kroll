/**
 * Font Settings Page
 * /admin/settings/fonts
 * 
 * Allows admins to:
 * 1. Select default sans-serif font preset
 * 2. Upload custom fonts to Supabase Storage
 * 3. Manage custom fonts
 * 4. Audit for external font requests
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ALL_FONT_PRESETS } from "@/lib/fonts/presets"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Check, Loader2, Search, Palette, Type } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UploadFontComponent } from "@/components/admin/UploadFontComponent"
import { CustomFontsList } from "@/components/admin/CustomFontsList"
import type { CustomFont } from "@/components/admin/CustomFontsList"

export default function FontSettingsPage() {
  const { toast } = useToast()
  const [selectedFont, setSelectedFont] = useState<string>("inter-local")
  const [loading, setLoading] = useState(false)
  const [auditResults, setAuditResults] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([])
  const [loadingCustomFonts, setLoadingCustomFonts] = useState(true)

  // Lade custom fonts beim Mount
  useEffect(() => {
    loadCustomFonts()
  }, [])

  const loadCustomFonts = async () => {
    try {
      const res = await fetch("/admin/api/fonts/list-custom")
      if (res.ok) {
        const data = await res.json()
        setCustomFonts(data.fonts || [])
      }
    } catch (error) {
      console.error("Error loading custom fonts:", error)
    } finally {
      setLoadingCustomFonts(false)
    }
  }

  const handleSaveFont = async () => {
    setLoading(true)
    try {
      const res = await fetch("/admin/api/fonts/update-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId: selectedFont }),
      })

      if (res.ok) {
        toast({
          title: "Erfolgreich gespeichert",
          description: `Font-Preset aktualisiert: ${selectedFont}`,
        })
      } else {
        toast({
          title: "Fehler",
          description: "Font-Preset konnte nicht gespeichert werden",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAudit = async () => {
    setAuditLoading(true)
    try {
      const res = await fetch("/admin/api/fonts/audit")
      const data = await res.json()
      setAuditResults(data.findings || [])

      if (data.findings.length === 0) {
        toast({
          title: "✅ Audit bestanden",
          description: "Keine externen Google-Font-Requests gefunden",
        })
      } else {
        toast({
          title: "⚠️ Audit-Ergebnisse",
          description: `${data.findings.length} Fundstelle(n) gefunden`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setAuditLoading(false)
    }
  }

  const selectedPreset = ALL_FONT_PRESETS.find((p) => p.id === selectedFont)

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Settings Navigation */}
      <div className="mb-8 border-b border-border">
        <div className="flex gap-4">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 pb-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Palette className="h-4 w-4" />
            Theme
          </Link>
          <Link
            href="/admin/settings/fonts"
            className="flex items-center gap-2 pb-4 border-b-2 border-primary text-primary font-medium"
          >
            <Type className="h-4 w-4" />
            Fonts
          </Link>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Font Selection */}
        <div className="grid gap-4 max-w-2xl">
          {/* Preset Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle>Standard-Font auswählen</CardTitle>
              <CardDescription>
                Wähle den Standard-Schrifttyp für die Website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="font-select">Font-Preset</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger id="font-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_FONT_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        <span>
                          {preset.label}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({preset.source === "local" ? "Lokal" : "Google"})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPreset && (
                <div className="rounded-lg bg-muted p-3 space-y-2">
                  <p className="text-sm font-medium">{selectedPreset.label}</p>
                  <p className="text-xs text-muted-foreground">{selectedPreset.description}</p>
                  <div
                    className={`p-4 rounded border border-border text-center ${selectedPreset.applyClass}`}
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    <p className="text-base">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-sm mt-2">Vorschau: {selectedPreset.label}</p>
                  </div>
                </div>
              )}

              <Button onClick={handleSaveFont} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Font speichern
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Font Management Section */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Custom Fonts</h2>
          
          {/* Upload Component */}
          <div className="grid gap-4 mb-6">
            <UploadFontComponent onFontAdded={(font) => {
              setCustomFonts(prev => [font, ...prev])
              loadCustomFonts()
            }} />
          </div>

          {/* Custom Fonts List */}
          {!loadingCustomFonts && (
            <CustomFontsList
              fonts={customFonts}
              onDelete={(fontId) => {
                setCustomFonts(prev => prev.filter(f => f.id !== fontId))
              }}
            />
          )}
        </div>

        {/* Security Audit */}
        <div className="border-t pt-8">
          <Card>
            <CardHeader>
              <CardTitle>Sicherheits-Audit</CardTitle>
              <CardDescription>
                Überprüfe, ob keine externen Font-Requests gemacht werden (CSP-Sicherheit).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleAudit} disabled={auditLoading} variant="outline" className="w-full">
                {auditLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Audit läuft...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Audit durchführen
                  </>
                )}
              </Button>

              {auditResults.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">{auditResults.length} Fundstelle(n):</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {auditResults.map((finding, i) => (
                        <li key={i} className="text-sm">
                          <code className="text-xs bg-destructive/10 px-1 py-0.5 rounded">
                            {finding.file}
                          </code>
                          : {finding.reason}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {auditResults.length === 0 && auditLoading === false && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>✅ Audit bestanden! Keine externen Font-Requests gefunden.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
