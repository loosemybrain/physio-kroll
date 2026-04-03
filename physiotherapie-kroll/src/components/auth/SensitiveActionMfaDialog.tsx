"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { mapMfaVerifyError } from "@/lib/auth/mfaClientErrors"
import {
  extractVerifiedTotpFactors,
  verifyTotpCodeAndRefreshToAal2,
  type VerifiedTotpFactor,
} from "@/lib/auth/sensitiveUserUpdate"

const REAUTH_COPY =
  "Für diese Änderung ist eine zusätzliche Sicherheitsbestätigung erforderlich. Bitte geben Sie den Code aus Ihrer Authenticator-App ein."

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Nach erfolgreicher MFA-Prüfung (AAL2); hier genau einmal updateUser o. Ä. ausführen */
  onVerified: () => void | Promise<void>
  /** Optional: vorgegebene Faktoren (sonst werden sie beim Öffnen geladen) */
  initialFactors?: VerifiedTotpFactor[] | null
}

export function SensitiveActionMfaDialog({ open, onOpenChange, onVerified, initialFactors }: Props) {
  const [factors, setFactors] = useState<VerifiedTotpFactor[]>([])
  const [selectedFactorId, setSelectedFactorId] = useState<string>("")
  const [code, setCode] = useState("")
  const [loadingFactors, setLoadingFactors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const resetLocal = useCallback(() => {
    setCode("")
    setError(null)
    setLoadError(null)
    setSubmitting(false)
    setLoadingFactors(false)
  }, [])

  useEffect(() => {
    if (!open) {
      resetLocal()
      setFactors([])
      setSelectedFactorId("")
      return
    }

    if (initialFactors && initialFactors.length > 0) {
      setFactors(initialFactors)
      setSelectedFactorId(initialFactors[0].id)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoadingFactors(true)
      setLoadError(null)
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error: facErr } = await supabase.auth.mfa.listFactors()
        if (facErr) throw facErr
        const list = extractVerifiedTotpFactors(data)
        if (cancelled) return
        if (list.length === 0) {
          setLoadError(
            "Es ist kein verifizierter Authenticator hinterlegt. Bitte richten Sie unter „MFA“ zuerst einen TOTP-Faktor ein."
          )
          setFactors([])
          setSelectedFactorId("")
          return
        }
        setFactors(list)
        setSelectedFactorId(list[0].id)
      } catch (e) {
        if (!cancelled) setLoadError(mapMfaVerifyError(e))
      } finally {
        if (!cancelled) setLoadingFactors(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, initialFactors, resetLocal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFactorId || code.trim().length !== 6) {
      setError("Bitte einen gültigen 6-stelligen Code eingeben.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      await verifyTotpCodeAndRefreshToAal2(supabase, selectedFactorId, code.trim())
      await onVerified()
      resetLocal()
      onOpenChange(false)
    } catch (err) {
      setError(mapMfaVerifyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetLocal()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Sicherheit bestätigen</DialogTitle>
          <DialogDescription>{REAUTH_COPY}</DialogDescription>
        </DialogHeader>

        {loadingFactors ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Schließen
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {factors.length > 1 ? (
              <div className="space-y-2">
                <Label>Authenticator</Label>
                <Select value={selectedFactorId} onValueChange={setSelectedFactorId} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gerät wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {factors.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.friendlyName?.trim() || "Authenticator"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="sensitive-mfa-code">6-stelliger Code</Label>
              <Input
                id="sensitive-mfa-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={submitting}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={submitting || !selectedFactorId}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Bestätigen
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
