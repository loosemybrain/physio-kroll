"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

/** Sichere interne Hinweis-UI bei ungültiger Embed-URL (keine externen Ressourcen). */
export function EmbedUrlInvalidNotice({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="my-2 border-destructive/40 bg-destructive/5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-sm">Einbettung nicht möglich</AlertTitle>
      <AlertDescription className="text-sm">{message}</AlertDescription>
    </Alert>
  )
}
