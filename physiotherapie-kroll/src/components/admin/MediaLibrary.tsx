"use client";

import * as React from "react";
import { uploadMedia, listMedia, deleteMedia, type MediaRow } from "@/lib/cms/mediaStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function MediaLibrary(props: {
  onSelect?: (item: MediaRow) => void; // optional: wenn du Bild in Block setzen willst
  selectMode?: boolean; // wenn true: click selects statt navigation
}) {
  const [items, setItems] = React.useState<MediaRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<MediaRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await listMedia();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden der Medien");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
  }, []);

  async function onUploadClick() {
    fileRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadMedia({ file });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Hochladen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      item.filename.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const handleDeleteClick = (item: MediaRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(item);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteMedia(deleteTarget.id, deleteTarget.path);
      await refresh();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{props.selectMode ? "Medium wählen" : "Medien"}</CardTitle>
        <div className="flex items-center gap-2">
          {!props.selectMode && (
            <>
              <Input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                onChange={onFileChange}
                className="hidden"
              />
              <Button onClick={onUploadClick} disabled={uploading}>
                {uploading ? "Lade hoch…" : "Upload"}
              </Button>
              <Button variant="outline" onClick={refresh} disabled={loading || uploading}>
                Refresh
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!props.selectMode && (
          <Input
            type="text"
            placeholder="Nach Dateiname suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        )}

        {loading ? (
          <div className="text-sm opacity-70">Lade Medien…</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-sm opacity-70">
            {searchQuery ? "Keine Ergebnisse gefunden." : "Noch keine Medien hochgeladen."}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filteredItems.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "relative group rounded-md overflow-hidden border",
                  props.selectMode && "cursor-pointer hover:ring-2 hover:ring-primary"
                )}
              >
                <button
                  type="button"
                  onClick={() => props.onSelect?.(m)}
                  className="w-full text-left"
                  title={m.filename}
                >
                  {m.type?.startsWith("video/") ? (
                    <video
                      src={m.url}
                      className="w-full h-32 object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt={m.alt ?? ""}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-2 text-xs truncate">{m.filename}</div>
                </button>
                {!props.selectMode && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteClick(m, e)}
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Medium löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie &quot;{deleteTarget?.filename}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
