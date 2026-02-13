"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, X, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface CustomFont {
  id: string
  name: string
  label: string
  description?: string
  file_url: string
}

interface UploadFontComponentProps {
  onFontAdded?: (font: CustomFont) => void
}

export function UploadFontComponent({ onFontAdded }: UploadFontComponentProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
  })
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".woff2")) {
      toast({
        title: "Ungültiges Format",
        description: "Bitte wähle eine .woff2 Datei aus",
        variant: "destructive",
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Maximale Größe: 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpload = async () => {
    if (!selectedFile || !formData.name || !formData.label) {
      toast({
        title: "Fehler",
        description: "Bitte fülle alle erforderlichen Felder aus",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", selectedFile)
      fd.append("name", formData.name)
      fd.append("label", formData.label)
      fd.append("description", formData.description)

      const res = await fetch("/admin/api/fonts/upload-custom", {
        method: "POST",
        body: fd,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload fehlgeschlagen")
      }

      toast({
        title: "✅ Erfolgreich hochgeladen",
        description: `Font "${formData.label}" wurde hinzugefügt`,
      })

      // Reset
      setSelectedFile(null)
      setFormData({ name: "", label: "", description: "" })
      if (inputRef.current) {
        inputRef.current.value = ""
      }

      onFontAdded?.(data.font)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Font hochladen</CardTitle>
        <CardDescription>
          Lade eine .woff2 Fontdatei hoch und registriere sie
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          } ${selectedFile ? "bg-green-50 border-green-300" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".woff2"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          {selectedFile ? (
            <div className="space-y-2">
              <Check className="h-8 w-8 mx-auto text-green-600" />
              <p className="font-medium text-green-900">{selectedFile.name}</p>
              <p className="text-sm text-green-700">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null)
                  if (inputRef.current) {
                    inputRef.current.value = ""
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Ändern
              </Button>
            </div>
          ) : (
            <div
              className="cursor-pointer space-y-2"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="font-medium">
                .woff2 Datei hierher ziehen oder klicken
              </p>
              <p className="text-sm text-muted-foreground">
                Max. 10MB
              </p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Font-ID (eindeutig)*</Label>
              <Input
                id="name"
                name="name"
                placeholder="z.B. my-font, my-font-italic"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Verwendet für CSS-Klasse: .font-{"{name}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Font-Label (angezeigt)*</Label>
              <Input
                id="label"
                name="label"
                placeholder="z.B. My Font (Custom)"
                value={formData.label}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                name="description"
                placeholder="z.B. Moderne serifenlose Schrift"
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Hinweis:</strong> Nach dem Upload muss die CSS konfiguriert werden 
                (siehe Dokumentation). Der Font wird dann in der Auswahl verfügbar.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={loading || !selectedFile || !formData.name || !formData.label}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Hochladen...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Font hinzufügen
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
