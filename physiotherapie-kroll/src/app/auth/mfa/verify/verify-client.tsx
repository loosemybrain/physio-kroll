"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
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
}

function mapVerifyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()
  if (lower.includes("invalid")) return "Der eingegebene Code ist ungültig."
  if (lower.includes("expired")) return "Der Code ist abgelaufen. Bitte neuen Code eingeben."
  if (lower.includes("session")) return "Ihre Sitzung ist abgelaufen. Bitte erneut anmelden."
  return "MFA-Verifizierung fehlgeschlagen. Bitte erneut versuchen."
}

function getVerifiedTotpFactor(list: TotpFactor[] | undefined): TotpFactor | null {
  if (!Array.isArray(list)) return null
  return (
    list.find(
      (f) =>
        (f.factor_type ?? f.factorType) === "totp" &&
        (f.status ?? "").toLowerCase() === "verified"
    ) ?? null
  )
}

export function MfaVerifyClient({ nextPath }: Props) {
  const router = useRouter()
  const safeNext = normalizeInternalRedirectTarget(nextPath, "/admin/pages")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [factorId, setFactorId] = useState<string | null>(null)

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
        const factor = getVerifiedTotpFactor((factorsData?.all ?? []) as TotpFactor[])
        if (!factor?.id) {
          router.replace(`/auth/mfa/setup?next=${encodeURIComponent(safeNext)}`)
          return
        }
        setFactorId(factor.id)
      } catch (e) {
        setError(mapVerifyError(e))
      } finally {
        setLoading(false)
      }
    }
    void boot()
  }, [router, safeNext])

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!factorId || code.trim().length !== 6) {
      setError("Bitte einen gültigen 6-stelligen Code eingeben.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      console.log("[MFA VERIFY] submit:start", {
        factorId,
        codeLength: code.trim().length,
        nextPath: safeNext,
      })
      const supabase = createSupabaseBrowserClient()
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: code.trim(),
      })
      if (verifyError) throw verifyError
      console.log("[MFA VERIFY] challengeAndVerify:success")
      await supabase.auth.refreshSession()
      const sessionAfterRefresh = await supabase.auth.getSession()
      console.log("[MFA VERIFY] session:afterRefresh", sessionAfterRefresh)
      const aalAfterVerify = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      console.log("[MFA VERIFY] aal:afterVerify", aalAfterVerify)
      console.log("[MFA VERIFY] redirect:next", {
        safeNext,
      })
      router.replace(safeNext)
      router.refresh()
    } catch (e) {
      console.error("[MFA VERIFY] error", e)
      setError(mapVerifyError(e))
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
          <CardTitle>MFA bestätigen</CardTitle>
          <CardDescription>
            Bitte den 6-stelligen Code aus Ihrer Authenticator-App eingeben, um den Adminbereich zu öffnen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="verify-code">TOTP-Code</Label>
              <Input
                id="verify-code"
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
              Verifizieren
            </Button>
          </form>
        </CardContent>
      </CardSurface>
    </div>
  )
}

