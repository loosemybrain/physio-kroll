"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaLibrary } from "./MediaLibrary";
import type { MediaRow } from "@/lib/cms/mediaStore";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (url: string, mediaId?: string) => void;
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
}: MediaPickerDialogProps) {
  const handleSelect = (item: MediaRow) => {
    onPick(item.url, item.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[80vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus from scrolling the page
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Medium auswählen</DialogTitle>
          <DialogDescription>
            Wählen Sie ein Medium (Bild/Video) aus Ihrer Mediensammlung aus.
          </DialogDescription>
        </DialogHeader>
        <MediaLibrary onSelect={handleSelect} selectMode />
      </DialogContent>
    </Dialog>
  );
}
