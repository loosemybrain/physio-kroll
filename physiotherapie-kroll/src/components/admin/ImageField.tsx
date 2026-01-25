"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon } from "lucide-react";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { cn } from "@/lib/utils";

interface ImageFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onMediaSelect?: (mediaId: string, url: string) => void; // Optional: for mediaId support
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  isActive?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

export function ImageField({
  id,
  label,
  value,
  onChange,
  onMediaSelect,
  placeholder,
  required,
  helpText,
  className,
  isActive,
  inputRef,
}: ImageFieldProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const handleMediaPick = (url: string, mediaId?: string) => {
    onChange(url);
    if (onMediaSelect && mediaId) {
      onMediaSelect(mediaId, url);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
          className={cn("flex-1", isActive && "ring-2 ring-primary")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setPickerOpen(true)}
          title="Aus Medien wählen"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
      {value && (
        <div className="mt-2 rounded-md border border-border overflow-hidden">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={handleMediaPick}
      />
    </div>
  );
}
