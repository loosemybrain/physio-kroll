"use client"

import * as React from "react"
import type { BrandKey } from "@/components/brand/brandAssets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Folder,
  FolderPlus,
  MoreVertical,
  Trash2,
  Edit,
  Upload,
  Move,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { MediaFolder, MediaAsset } from "@/lib/supabase/mediaLibrary"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import {
  uploadWithConcurrency,
  validateUploadFiles,
  extractFilesFromInput,
  type UploadStatus,
} from "@/lib/uploadConcurrency"

type MediaLibraryProps = {
  onSelect?: (asset: MediaAsset) => void
  selectMode?: boolean
}

export function MediaLibrary(props: MediaLibraryProps) {
  const { toast } = useToast()
  const [activeBrand, setActiveBrand] = React.useState<BrandKey>("physiotherapy")
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)
  const [folders, setFolders] = React.useState<MediaFolder[]>([])
  const [assets, setAssets] = React.useState<MediaAsset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [uploadStatuses, setUploadStatuses] = React.useState<UploadStatus[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deleteAssetDialogOpen, setDeleteAssetDialogOpen] = React.useState<string | null>(null)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = React.useState<string | null>(null)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = React.useState(false)
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = React.useState<string | null>(null)
  const [moveAssetDialogOpen, setMoveAssetDialogOpen] = React.useState<string | null>(null)
  const [moveTargetFolderId, setMoveTargetFolderId] = React.useState<string | "none">("none")
  const [newFolderName, setNewFolderName] = React.useState("")
  const [renameFolderName, setRenameFolderName] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const folderInputRef = React.useRef<HTMLInputElement | null>(null)

  const loadFolders = React.useCallback(async (brand: BrandKey) => {
    try {
      const res = await fetch(`/api/admin/media/folders?brand=${encodeURIComponent(brand)}`, {
        cache: "no-store",
        credentials: "include",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "Folders konnten nicht geladen werden")
      setFolders((body?.folders ?? []) as MediaFolder[])
    } catch (e) {
      console.error("[MediaLibrary] Failed to load folders:", e)
    }
  }, [])

  const loadAssets = React.useCallback(async (brand: BrandKey, folderId: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/media/assets?brand=${encodeURIComponent(brand)}&folderId=${folderId || "null"}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "Assets konnten nicht geladen werden")
      setAssets((body?.assets ?? []) as MediaAsset[])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Fehler beim Laden"
      setError(msg)
      toast({ title: "Fehler", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadFolders(activeBrand)
  }, [activeBrand, loadFolders])

  React.useEffect(() => {
    loadAssets(activeBrand, selectedFolderId)
  }, [activeBrand, selectedFolderId, loadAssets])

  // Set folder input attributes via DOM to bypass TS limitation
  React.useEffect(() => {
    const el = folderInputRef.current
    if (!el) return
    el.setAttribute("webkitdirectory", "")
    el.setAttribute("directory", "")
  }, [])

  const handleCreateFolder = React.useCallback(async () => {
    if (!newFolderName.trim()) {
      toast({ title: "Fehler", description: "Ordnername darf nicht leer sein.", variant: "destructive" })
      return
    }

    setActionLoading("create-folder")
    setError(null)
    try {
      const res = await fetch("/api/admin/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: activeBrand,
          name: newFolderName.trim(),
          parentId: selectedFolderId,
        }),
        credentials: "include",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "Konnte nicht erstellen")

      await loadFolders(activeBrand)
      setCreateFolderDialogOpen(false)
      setNewFolderName("")
      toast({ title: "Ordner erstellt", description: "Der Ordner wurde erfolgreich erstellt." })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
      setError(msg)
      toast({ title: "Fehler", description: msg, variant: "destructive" })
    } finally {
      setActionLoading(null)
    }
  }, [activeBrand, selectedFolderId, newFolderName, loadFolders, toast])

  const handleRenameFolder = React.useCallback(
    async (folderId: string) => {
      if (!renameFolderName.trim()) {
        toast({ title: "Fehler", description: "Ordnername darf nicht leer sein.", variant: "destructive" })
        return
      }

      setActionLoading(folderId)
      setError(null)
      try {
        const res = await fetch("/api/admin/media/folders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: folderId, name: renameFolderName.trim() }),
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht umbenennen")

        await loadFolders(activeBrand)
        setRenameFolderDialogOpen(null)
        setRenameFolderName("")
        toast({ title: "Ordner umbenannt", description: "Der Ordner wurde erfolgreich umbenannt." })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setActionLoading(null)
      }
    },
    [activeBrand, renameFolderName, loadFolders, toast]
  )

  const handleDeleteFolder = React.useCallback(
    async (folderId: string) => {
      setActionLoading(folderId)
      setError(null)
      try {
        const res = await fetch(`/api/admin/media/folders?id=${encodeURIComponent(folderId)}`, {
          method: "DELETE",
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht löschen")

        await loadFolders(activeBrand)
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null)
        }
        setDeleteFolderDialogOpen(null)
        toast({ title: "Ordner gelöscht", description: "Der Ordner wurde erfolgreich gelöscht." })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setActionLoading(null)
      }
    },
    [activeBrand, selectedFolderId, loadFolders, toast]
  )

  const handleUploadSingleFile = React.useCallback(
    async (file: File): Promise<void> => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("brand", activeBrand)
      if (selectedFolderId) {
        formData.append("folderId", selectedFolderId)
      }

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "Konnte nicht hochladen")
    },
    [activeBrand, selectedFolderId]
  )

  const handleUpload = React.useCallback(
    async (file: File) => {
      setUploading(true)
      setError(null)
      try {
        await handleUploadSingleFile(file)
        await loadAssets(activeBrand, selectedFolderId)
        toast({ title: "Datei hochgeladen", description: "Die Datei wurde erfolgreich hochgeladen." })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setUploading(false)
      }
    },
    [activeBrand, selectedFolderId, loadAssets, handleUploadSingleFile, toast]
  )

  const handleFilesUpload = React.useCallback(
    async (files: FileList | File[]) => {
      const { valid, errors } = validateUploadFiles(files)

      if (errors.length > 0) {
        errors.forEach((err) => {
          toast({ title: "Validierungsfehler", description: err, variant: "destructive" })
        })
      }

      if (valid.length === 0) return

      setUploading(true)
      setError(null)

      // Initialize status for all files
      const statuses: UploadStatus[] = valid.map((file, idx) => ({
        id: `${Date.now()}-${idx}`,
        fileName: file.name,
        status: "pending" as const,
      }))
      setUploadStatuses(statuses)

      try {
        await uploadWithConcurrency(
          valid,
          4, // Max 4 concurrent uploads
          async (file) => {
            // Update status to uploading
            setUploadStatuses((prev) =>
              prev.map((s) => (s.fileName === file.name ? { ...s, status: "uploading" as const } : s))
            )

            try {
              await handleUploadSingleFile(file)
              // Update status to success
              setUploadStatuses((prev) =>
                prev.map((s) => (s.fileName === file.name ? { ...s, status: "success" as const } : s))
              )
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Fehler beim Upload"
              // Update status to error
              setUploadStatuses((prev) =>
                prev.map((s) =>
                  s.fileName === file.name ? { ...s, status: "error" as const, error: msg } : s
                )
              )
            }
          },
          (completed, total) => {
            // Optional: log progress
            console.log(`[MediaLibrary] Upload progress: ${completed}/${total}`)
          }
        )

        // Reload assets after all uploads
        await loadAssets(activeBrand, selectedFolderId)

        // Count successes
        const successCount = statuses.filter((s) => s.status === "success").length
        if (successCount > 0) {
          toast({
            title: "Dateien hochgeladen",
            description: `${successCount} von ${valid.length} Dateien erfolgreich hochgeladen.`,
          })
        }

        // Clear statuses after 3 seconds
        setTimeout(() => {
          setUploadStatuses([])
        }, 3000)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Fehler beim Upload"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setUploading(false)
      }
    },
    [activeBrand, selectedFolderId, loadAssets, handleUploadSingleFile, toast]
  )

  const handleMoveAsset = React.useCallback(
    async (assetId: string, targetFolderId: string | null) => {
      setActionLoading(assetId)
      setError(null)
      try {
        const res = await fetch("/api/admin/media/assets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: assetId, folderId: targetFolderId }),
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht verschieben")

        await loadAssets(activeBrand, selectedFolderId)
        setMoveAssetDialogOpen(null)
        toast({ title: "Datei verschoben", description: "Die Datei wurde erfolgreich verschoben." })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setActionLoading(null)
      }
    },
    [activeBrand, selectedFolderId, loadAssets, toast]
  )

  const handleDeleteAsset = React.useCallback(
    async (assetId: string) => {
      setActionLoading(assetId)
      setError(null)
      try {
        const res = await fetch(`/api/admin/media/assets?id=${encodeURIComponent(assetId)}`, {
          method: "DELETE",
          credentials: "include",
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.error || "Konnte nicht löschen")

        await loadAssets(activeBrand, selectedFolderId)
        setDeleteAssetDialogOpen(null)
        toast({ title: "Datei gelöscht", description: "Die Datei wurde erfolgreich gelöscht." })
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unbekannter Fehler"
        setError(msg)
        toast({ title: "Fehler", description: msg, variant: "destructive" })
      } finally {
        setActionLoading(null)
      }
    },
    [activeBrand, selectedFolderId, loadAssets, toast]
  )

  const rootFolders = folders.filter((f) => f.parent_id === null)
  const getPublicUrl = React.useCallback((objectKey: string) => {
    const supabase = createSupabaseBrowserClient()
    const { data } = supabase.storage.from("media").getPublicUrl(objectKey)
    return data.publicUrl
  }, [])

  const filteredAssets = React.useMemo(() => {
    if (!searchQuery.trim()) return assets
    const query = searchQuery.toLowerCase()
    return assets.filter((a) => a.filename.toLowerCase().includes(query))
  }, [assets, searchQuery])

  const selectedFolder = folders.find((f) => f.id === selectedFolderId)

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Left Sidebar: Folders */}
      <div className="w-64 shrink-0 border-r border-border bg-card p-4 flex flex-col">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Ordner</h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setNewFolderName("")
              setCreateFolderDialogOpen(true)
            }}
            title="Neuer Ordner"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors",
              selectedFolderId === null
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >
            Alle Dateien
          </button>
          {rootFolders.map((folder) => (
            <div
              key={folder.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedFolderId(folder.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setSelectedFolderId(folder.id)
                }
              }}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 group",
                selectedFolderId === folder.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Folder className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{folder.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      const f = folders.find((f) => f.id === folder.id)
                      if (f) {
                        setRenameFolderName(f.name)
                        setRenameFolderDialogOpen(f.id)
                      }
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Umbenennen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteFolderDialogOpen(folder.id)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel: Assets */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Brand Switcher + Search + Upload */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <Tabs value={activeBrand} onValueChange={(v) => setActiveBrand(v as BrandKey)}>
            <TabsList>
              <TabsTrigger value="physiotherapy">Physiotherapie</TabsTrigger>
              <TabsTrigger value="physio-konzept">Physio‑Konzept</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Dateien durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  handleFilesUpload(files)
                }
                e.target.value = ""
              }}
              className="hidden"
            />
            <Input
              ref={folderInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  handleFilesUpload(files)
                }
                e.target.value = ""
              }}
              className="hidden"
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} title="Mehrere Dateien hochladen">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Hochladen
            </Button>
            <Button onClick={() => folderInputRef.current?.click()} disabled={uploading} variant="outline" title="Ordner hochladen">
              <Folder className="mr-2 h-4 w-4" />
              Ordner
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Status List */}
        {uploadStatuses.length > 0 && (
          <div className="mb-4 border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Upload-Fortschritt: {uploadStatuses.filter((s) => s.status === "success").length} / {uploadStatuses.length}
              </h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {uploadStatuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center gap-3 text-sm p-2 rounded-md bg-muted/50"
                >
                  <div className="flex-1 truncate">
                    <p className="text-foreground truncate">{status.fileName}</p>
                    {status.error && <p className="text-destructive text-xs">{status.error}</p>}
                  </div>
                  <div className="shrink-0">
                    {status.status === "pending" && <div className="text-muted-foreground text-xs">Ausstehend</div>}
                    {status.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {status.status === "success" && <div className="text-green-600 text-xs font-semibold">✓</div>}
                    {status.status === "error" && <div className="text-destructive text-xs font-semibold">✕</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">Lade Dateien…</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {searchQuery ? "Keine Ergebnisse gefunden." : selectedFolder ? `Keine Dateien in "${selectedFolder.name}".` : "Noch keine Dateien hochgeladen."}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredAssets.map((asset) => {
                const url = getPublicUrl(asset.object_key)
                const isVideo = asset.content_type?.startsWith("video/")
                return (
                  <div key={asset.id} className="relative group rounded-md overflow-hidden border border-border">
                    <button
                      type="button"
                      onClick={() => props.onSelect?.(asset)}
                      className="w-full text-left"
                      title={asset.filename}
                    >
                      {isVideo ? (
                        <video src={url} className="w-full h-32 object-cover" muted playsInline preload="metadata" />
                      ) : (
                        <img src={url} alt={asset.filename} className="w-full h-32 object-cover" loading="lazy" />
                      )}
                      <div className="p-2 text-xs truncate">{asset.filename}</div>
                    </button>
                    {!props.selectMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setMoveAssetDialogOpen(asset.id)}>
                            <Move className="mr-2 h-4 w-4" />
                            Verschieben
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteAssetDialogOpen(asset.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Ordner</DialogTitle>
            <DialogDescription>Erstellen Sie einen neuen Ordner für {activeBrand === "physio-konzept" ? "Physio‑Konzept" : "Physiotherapie"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ordnername"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder()
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handleCreateFolder} disabled={!newFolderName.trim() || actionLoading === "create-folder"}>
              {actionLoading === "create-folder" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameFolderDialogOpen !== null} onOpenChange={(open) => !open && setRenameFolderDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ordner umbenennen</DialogTitle>
            <DialogDescription>Geben Sie einen neuen Namen für den Ordner ein.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Ordnername"
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameFolderDialogOpen) handleRenameFolder(renameFolderDialogOpen)
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameFolderDialogOpen(null)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={() => renameFolderDialogOpen && handleRenameFolder(renameFolderDialogOpen)}
              disabled={!renameFolderName.trim() || actionLoading === renameFolderDialogOpen}
            >
              {actionLoading === renameFolderDialogOpen ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Umbenennen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Asset Dialog */}
      <Dialog
        open={moveAssetDialogOpen !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMoveAssetDialogOpen(null)
          } else if (moveAssetDialogOpen) {
            // Find the asset being moved to determine its current folder
            const asset = assets.find((a) => a.id === moveAssetDialogOpen)
            setMoveTargetFolderId(asset?.folder_id ?? "none")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datei verschieben</DialogTitle>
            <DialogDescription>Wählen Sie den Zielordner aus.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              value={moveTargetFolderId}
              onValueChange={(v) => {
                setMoveTargetFolderId(v)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordner wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Ordner</SelectItem>
                {rootFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveAssetDialogOpen(null)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (moveAssetDialogOpen) {
                  handleMoveAsset(
                    moveAssetDialogOpen,
                    moveTargetFolderId === "none" ? null : moveTargetFolderId
                  )
                  setMoveAssetDialogOpen(null)
                }
              }}
              disabled={actionLoading === moveAssetDialogOpen}
            >
              {actionLoading === moveAssetDialogOpen ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Verschieben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <AlertDialog open={deleteFolderDialogOpen !== null} onOpenChange={(open) => !open && setDeleteFolderDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ordner löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Ordner wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFolderDialogOpen && handleDeleteFolder(deleteFolderDialogOpen)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading === deleteFolderDialogOpen}
            >
              {actionLoading === deleteFolderDialogOpen ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Asset Dialog */}
      <AlertDialog open={deleteAssetDialogOpen !== null} onOpenChange={(open) => !open && setDeleteAssetDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Datei löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Datei wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAssetDialogOpen && handleDeleteAsset(deleteAssetDialogOpen)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading === deleteAssetDialogOpen}
            >
              {actionLoading === deleteAssetDialogOpen ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
