"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Loader2, FileJson } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface CustomFont {
  id: string
  name: string
  label: string
  description?: string
  file_url: string
  font_weight: string
  font_style: string
  created_at: string
}

interface CustomFontsListProps {
  fonts?: CustomFont[]
  onDelete?: (fontId: string) => void
}

export function CustomFontsList({ fonts = [], onDelete }: CustomFontsListProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (fontId: string, label: string) => {
    if (!confirm(`Font "${label}" wirklich löschen?`)) return

    setLoading(fontId)
    try {
      const res = await fetch("/admin/api/fonts/delete-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fontId }),
      })

      if (!res.ok) {
        throw new Error("Löschen fehlgeschlagen")
      }

      toast({
        title: "✅ Gelöscht",
        description: `Font "${label}" wurde entfernt`,
      })

      onDelete?.(fontId)
    } catch (error) {
      toast({
        title: "Fehler",
        description: String(error),
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  if (fonts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hochgeladene Fonts</CardTitle>
          <CardDescription>Bisher keine benutzerdefinierten Fonts hochgeladen</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Starten Sie oben einen Font-Upload, um benutzerdefinierte Fonts hinzuzufügen.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hochgeladene Fonts ({fonts.length})</CardTitle>
        <CardDescription>
          Verwalte deine benutzerdefinierten Fonts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fonts.map((font) => (
            <div
              key={font.id}
              className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {font.label}
                  <span className="text-xs text-muted-foreground ml-2">
                    ({font.name})
                  </span>
                </p>
                {font.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {font.description}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {font.font_weight}
                  </span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {font.font_style}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-900 px-2 py-1 rounded">
                    Custom
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Hochgeladen: {new Date(font.created_at).toLocaleDateString("de-DE")}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={font.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded"
                  title="Datei öffnen"
                >
                  <FileJson className="h-4 w-4 text-muted-foreground" />
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(font.id, font.label)}
                  disabled={loading === font.id}
                  className="text-destructive hover:text-destructive"
                >
                  {loading === font.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
