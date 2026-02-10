/**
 * Font Settings Page
 * /admin/settings/fonts
 * 
 * Allows admins to:
 * 1. Select default sans-serif font preset
 * 2. Preview selected font
 * 3. Audit for external font requests
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ALL_FONT_PRESETS } from "@/lib/fonts/presets"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Check, Loader2, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FontSettingsPage() {
  const { toast } = useToast()
  const [selectedFont, setSelectedFont] = useState<string>("inter-local")
  const [loading, setLoading] = useState(false)
  const [auditResults, setAuditResults] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

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
        title: "Audit-Fehler",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setAuditLoading(false)
    }
  }

  const selectedPreset = ALL_FONT_PRESETS.find((p) => p.id === selectedFont)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Font Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sans-Serif Font</CardTitle>
          <CardDescription>
            Wähle den Standard-Schrifttyp für die Website (GDPR-sicher: lokal oder via next/font/google)
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

      {/* Audit Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sicherheits-Audit</CardTitle>
          <CardDescription>
            Scannen Sie den Code auf externe Google-Font-Requests (sollten blockiert sein)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CSP-Header sollte <code className="text-xs bg-muted px-1">font-src 'self'</code> setzen, um externe
              Requests zu blocken
            </AlertDescription>
          </Alert>

          <Button onClick={handleAudit} disabled={auditLoading} variant="outline" className="w-full">
            {auditLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanne...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Audit starten
              </>
            )}
          </Button>

          {auditResults.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium text-sm">
                {auditResults.length} Fundstelle{auditResults.length !== 1 ? "n" : ""} gefunden:
              </p>
              <div className="max-h-[300px] overflow-y-auto border border-border rounded p-3 space-y-2">
                {auditResults.map((finding, idx) => (
                  <div key={idx} className="text-xs space-y-1 p-2 bg-muted rounded">
                    <p className="font-mono">{finding.file}</p>
                    <p className="text-muted-foreground">{finding.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {auditResults.length === 0 && auditLoading === false && (
            <div className="text-xs text-muted-foreground text-center py-4">
              Klicke "Audit starten" um zu scannen
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
