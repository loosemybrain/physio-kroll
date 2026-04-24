"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CardContent, CardDescription, CardHeader, CardSurface, CardTitle } from "@/components/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { normalizeInternalRedirectTarget, toLoginRedirect } from "@/lib/auth/redirects"
import { mapMfaVerifyError } from "@/lib/auth/mfaClientErrors"
import { verifyTotpCodeAndRefreshToAal2 } from "@/lib/auth/sensitiveUserUpdate"

type Props = {
  nextPath: string
}

type TotpFactor = {
  id: string
  status?: string
  factor_type?: string
  factorType?: string
}

async function sendAuditEvent(
  eventType: "mfa_verify_succeeded" | "mfa_verify_failed",
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await fetch("/api/admin/audit/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType,
        metadata,
      }),
    })
  } catch {
    // Audit ist best effort und darf den MFA-Flow nicht blockieren.
  }
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
        setError(mapMfaVerifyError(e))
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
      await verifyTotpCodeAndRefreshToAal2(supabase, factorId, code.trim())
      void sendAuditEvent("mfa_verify_succeeded", {
        factorId,
      })
      console.log("[MFA VERIFY] challengeAndVerify:success")
      await new Promise((resolve) => setTimeout(resolve, 150))
      console.log("[MFA VERIFY] redirect:next", {
        safeNext,
      })
      window.location.href = safeNext
    } catch (e) {
      console.error("[MFA VERIFY] error", e)
      void sendAuditEvent("mfa_verify_failed", {
        factorId,
        errorCode: e instanceof Error ? "verify_error" : "unknown_error",
      })
      setError(mapMfaVerifyError(e))
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
            Bitte den 6-stelligen Code aus Ihrer Authenticator-App eingeben, um den Adminbereich zu öffnen. Auf dieser
            Seite wird kein QR-Code angezeigt – der wird nur bei der ersten Einrichtung unter „TOTP einrichten“
            benötigt.
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

