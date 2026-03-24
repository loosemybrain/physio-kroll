"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardSurface, CardTitle } from "@/components/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { normalizeInternalRedirectTarget, toLoginRedirect } from "@/lib/auth/redirects"

type Props = {
  nextPath: string
}

type TotpFactor = {
  id: string
  status?: string
  factor_type?: string
  factorType?: string
  totp?: {
    qr_code?: string
    uri?: string
    secret?: string
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * Supabase liefert `totp.qr_code` je nach Version/Backend unterschiedlich:
 * - vollständige data-URL (`data:image/png;base64,...` oder `data:image/svg+xml;base64,...`)
 * - rohe Base64-PNG ohne Prefix
 * - SVG-Markup als String
 * Falsch wäre: alles als SVG per encodeURIComponent zu behandeln → kaputtes <img>.
 */
function toQrImageSrc(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim()
  if (s.startsWith("data:image/")) return s

  const compact = s.replace(/\s/g, "")
  // Rohe Base64-Zeichenkette (typisch PNG von GoTrue)
  if (/^[A-Za-z0-9+/]+=*$/.test(compact) && compact.length >= 40) {
    return `data:image/png;base64,${compact}`
  }

  if (/^<svg[\s/>]/i.test(s) || s.startsWith("<?xml")) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`
}

/** Nach listFactors() liefert Supabase bei unverified oft kein qr_code/secret mehr – nur direkt nach enroll(). */
function hasTotpEnrollmentDisplay(f: TotpFactor): boolean {
  const t = f.totp
  return Boolean(t?.qr_code?.trim() || t?.secret?.trim() || t?.uri?.trim())
}

export function MfaSetupClient({ nextPath }: Props) {
  const router = useRouter()
  const safeNext = normalizeInternalRedirectTarget(nextPath, "/admin/pages")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [factor, setFactor] = useState<TotpFactor | null>(null)

  const qrCodeRaw = factor?.totp?.qr_code ?? null
  const totpSecret = factor?.totp?.secret ?? null
  const otpauthUri = factor?.totp?.uri ?? null
  const qrImageSrc = useMemo(() => toQrImageSrc(qrCodeRaw), [qrCodeRaw])

  useEffect(() => {
    const boot = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.replace(toLoginRedirect(safeNext))
          return
        }

        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
        if (factorsError) throw factorsError

        // Primär: factorsData.totp (Supabase liefert hier typischerweise TOTP-Faktoren).
        // Fallback: factorsData.all filtern auf factor_type === "totp", falls totp leer ist
        // (sonst droht erneutes enroll → "friendly name already exists").
        const raw = factorsData as { totp?: unknown; all?: unknown } | null
        let totpFactors: TotpFactor[] = Array.isArray(raw?.totp)
          ? (raw.totp as TotpFactor[])
          : []
        if (totpFactors.length === 0 && Array.isArray(raw?.all)) {
          totpFactors = (raw.all as TotpFactor[]).filter(
            (f) => (f.factor_type ?? f.factorType ?? "").toLowerCase() === "totp"
          )
        }

        const verifiedTotp = totpFactors.find(
          (f) => (f.status ?? "").toLowerCase() === "verified"
        )

        const unverifiedTotp = totpFactors.find(
          (f) => (f.status ?? "").toLowerCase() === "unverified"
        )

        if (verifiedTotp) {
          router.replace(`/auth/mfa/verify?next=${encodeURIComponent(safeNext)}`)
          return
        }

        let factorToSet: TotpFactor | null = null

        if (unverifiedTotp) {
          if (hasTotpEnrollmentDisplay(unverifiedTotp)) {
            factorToSet = unverifiedTotp
          } else {
            const { error: unenrollError } = await supabase.auth.mfa.unenroll({
              factorId: unverifiedTotp.id,
            })
            if (unenrollError) throw unenrollError
            // Ohne QR/Secret ist Setup nicht fortsetzbar → Faktor entfernen, enroll liefert neue Anzeige-Daten.
          }
        }

        if (!factorToSet) {
          const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
            factorType: "totp",
            friendlyName: "Admin Authenticator",
          })
          if (enrollError) throw enrollError
          factorToSet = enrollData as TotpFactor
        }

        setFactor(factorToSet)
      } catch (e) {
        console.error("MFA setup failed", e)
        setError(getErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    void boot()
  }, [router, safeNext])

  const handleVerifyFirstCode = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!factor?.id) {
      setError("TOTP Faktor fehlt. Seite neu laden.")
      return
    }

    if (code.trim().length !== 6) {
      setError("Bitte einen gültigen 6-stelligen Code eingeben.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      console.log("MFA VERIFY DEBUG", {
        factorId: factor.id,
        code: code.trim(),
      })

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: code.trim(),
      })
      if (verifyError) throw verifyError
      await supabase.auth.refreshSession()
      setSuccess("MFA erfolgreich eingerichtet.")
      router.replace(safeNext)
      router.refresh()
    } catch (e) {
      console.error("MFA setup failed", e)
      setError(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <CardSurface className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </CardSurface>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <CardSurface className="w-full max-w-md">
        <CardHeader>
          <CardTitle>TOTP einrichten</CardTitle>
          <CardDescription>
            Scannen Sie den QR-Code mit Ihrer Authenticator-App und bestätigen Sie mit einem 6-stelligen Code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyFirstCode} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}

            {qrImageSrc ? (
              <div className="flex justify-center rounded-md border p-4 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageSrc} alt="TOTP QR-Code" className="h-44 w-44" />
              </div>
            ) : null}

            {totpSecret ? (
              <div className="space-y-1">
                <Label>Manueller Secret (Fallback)</Label>
                <p className="rounded border bg-muted px-3 py-2 text-xs font-mono break-all">{totpSecret}</p>
              </div>
            ) : null}

            {otpauthUri ? (
              <p className="text-xs text-muted-foreground break-all">
                Falls der QR-Code nicht angezeigt wird, nutzen Sie diesen URI in Ihrer App: {otpauthUri}
              </p>
            ) : null}

            {factor && !qrImageSrc && !totpSecret && !otpauthUri ? (
              <Alert>
                <AlertDescription>
                  Es wurden keine QR-/Secret-Daten geliefert. Bitte Seite neu laden. Wenn das weiterhin passiert,
                  prüfen Sie in Supabase unter Authentication → MFA, ob TOTP aktiv ist.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="mfa-code">6-stelliger TOTP-Code</Label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={submitting}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Einrichtung bestätigen
            </Button>
          </form>
        </CardContent>
      </CardSurface>
    </div>
  )
}

