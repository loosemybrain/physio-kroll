"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSvgQrMarkup, toQrImageSrc } from "@/components/admin/mfaDisplayUtils"

export type MfaEnrollPayload = {
  id: string
  totp: {
    qr_code: string
    secret: string
    uri: string
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrolling: boolean
  enrollError: string | null
  payload: MfaEnrollPayload | null
  onEnrolled: () => void
}

export function MfaEnrollDialog({
  open,
  onOpenChange,
  enrolling,
  enrollError,
  payload,
  onEnrolled,
}: Props) {
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [uriQrDataUrl, setUriQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setVerifying(false)
      setVerifyError(null)
      setCode("")
      setUriQrDataUrl(null)
    }
  }, [open])

  const qrRaw = payload?.totp.qr_code ?? ""
  const svg = isSvgQrMarkup(qrRaw) ? qrRaw.trim() : null
  const imgSrc = svg ? null : toQrImageSrc(qrRaw)
  const otpauthUri = payload?.totp.uri?.trim() ?? ""

  useEffect(() => {
    if (!payload || svg || imgSrc || !otpauthUri) {
      setUriQrDataUrl(null)
      return
    }
    let cancelled = false
    void import("qrcode")
      .then((mod) =>
        mod.default.toDataURL(otpauthUri, { width: 176, margin: 2, errorCorrectionLevel: "M" }),
      )
      .then((url) => {
        if (!cancelled) setUriQrDataUrl(url)
      })
      .catch((e) => {
        console.error("[MFA MANAGER] uriQr:gen:error", e)
        if (!cancelled) setUriQrDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [payload, svg, imgSrc, otpauthUri])

  const displayImg = imgSrc || uriQrDataUrl
  const showError = enrollError || verifyError

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payload?.id || code.trim().length !== 6) {
      setVerifyError("Bitte einen gültigen 6-stelligen Code eingeben.")
      return
    }
    setVerifying(true)
    setVerifyError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: verifyErrorRes } = await supabase.auth.mfa.challengeAndVerify({
        factorId: payload.id,
        code: code.trim(),
      })
      if (verifyErrorRes) throw verifyErrorRes
      onOpenChange(false)
      onEnrolled()
    } catch (err) {
      console.error("[MFA MANAGER] challengeAndVerify:error", err)
      setVerifyError(getErrorMessage(err))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={!enrolling && !verifying}>
        <DialogHeader>
          <DialogTitle>Neuen Authenticator hinzufügen</DialogTitle>
          <DialogDescription>
            Scannen Sie den QR-Code oder geben Sie das Secret manuell ein. Anschließend bestätigen Sie mit einem
            Code aus der App.
          </DialogDescription>
        </DialogHeader>

        {showError ? (
          <Alert variant="destructive">
            <AlertDescription>{showError}</AlertDescription>
          </Alert>
        ) : null}

        {enrolling ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : payload ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex justify-center rounded-md border bg-white p-4 dark:bg-muted">
              {svg ? (
                <div
                  className="flex max-h-44 max-w-44 items-center justify-center [&_svg]:h-auto [&_svg]:max-h-44 [&_svg]:w-full [&_svg]:max-w-44"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : displayImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImg} alt="TOTP QR-Code" className="h-44 w-44" />
              ) : (
                <p className="text-center text-sm text-muted-foreground">Kein QR-Bild verfügbar.</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Secret (Fallback)</Label>
              <p className="rounded border bg-muted px-3 py-2 font-mono text-xs break-all">
                {payload.totp.secret}
              </p>
            </div>

            {otpauthUri ? (
              <p className="text-xs text-muted-foreground break-all">
                otpauth-URI (falls nötig): {otpauthUri}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="mfa-enroll-code">6-stelliger Code</Label>
              <Input
                id="mfa-enroll-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={verifying}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={verifying}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={verifying}>
                {verifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Bestätigen
              </Button>
            </DialogFooter>
          </form>
        ) : enrollError ? (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
