"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardSurface } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { SensitiveActionMfaDialog } from "@/components/auth/SensitiveActionMfaDialog"
import { mapCredentialUpdateError } from "@/lib/auth/mfaClientErrors"
import {
  applyUserCredentialUpdate,
  prepareSensitiveUserCredentialsChange,
  type VerifiedTotpFactor,
} from "@/lib/auth/sensitiveUserUpdate"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  const [mfaOpen, setMfaOpen] = useState(false)
  const [mfaFactors, setMfaFactors] = useState<VerifiedTotpFactor[] | null>(null)
  const pendingPasswordRef = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const checkSession = async () => {
      try {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "PASSWORD_RECOVERY" || session) {
            setHasSession(true)
            setLoading(false)
          }
        })

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          setHasSession(true)
        }

        setLoading(false)

        return () => subscription.unsubscribe()
      } catch {
        setError("Fehler beim Überprüfen der Session")
        setLoading(false)
      }
    }

    void checkSession()
  }, [])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Das Passwort muss mindestens 8 Zeichen lang sein"
    }
    return null
  }

  const finalizePasswordChange = async (password: string): Promise<boolean> => {
    const supabase = createSupabaseBrowserClient()
    const { error: updateErr } = await applyUserCredentialUpdate(supabase, {
      kind: "password",
      password,
    })
    if (updateErr) {
      setError(mapCredentialUpdateError(updateErr))
      return false
    }
    setSuccess(true)
    setTimeout(async () => {
      await supabase.auth.signOut()
      router.push("/auth/login?message=password-reset-success")
    }, 2000)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein")
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (mfaOpen) return

    setSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const prep = await prepareSensitiveUserCredentialsChange(supabase)
      if (prep.status === "error") {
        setError(prep.message)
        return
      }
      if (prep.status === "proceed") {
        await finalizePasswordChange(newPassword)
        return
      }
      pendingPasswordRef.current = newPassword
      setMfaFactors(prep.factors)
      setMfaOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setSubmitting(false)
    }
  }

  const handleMfaVerified = async () => {
    const pw = pendingPasswordRef.current
    pendingPasswordRef.current = null
    if (!pw) return
    await finalizePasswordChange(pw)
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

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <CardSurface className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ungültiger Link</CardTitle>
            <CardDescription>Der Reset-Link ist abgelaufen oder ungültig.</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Bitte fordern Sie einen neuen Reset-Link an.</AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/auth/forgot">Neuen Reset-Link anfordern</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Anmeldung
              </Link>
            </Button>
          </CardContent>
        </CardSurface>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SensitiveActionMfaDialog
        open={mfaOpen}
        onOpenChange={(o) => {
          setMfaOpen(o)
          if (!o) {
            pendingPasswordRef.current = null
            setMfaFactors(null)
          }
        }}
        initialFactors={mfaFactors ?? undefined}
        onVerified={handleMfaVerified}
      />

      <CardSurface className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Neues Passwort setzen</CardTitle>
          <CardDescription>
            Geben Sie Ihr neues Passwort ein. Es muss mindestens 8 Zeichen lang sein. Bei aktivem Authenticator ist eine
            zusätzliche Bestätigung nötig.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Ihr Passwort wurde erfolgreich geändert. Sie werden zur Anmeldeseite weitergeleitet...
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={submitting || mfaOpen}
                  autoComplete="new-password"
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={submitting || mfaOpen}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={submitting || mfaOpen}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird geprüft…
                    </>
                  ) : (
                    "Passwort ändern"
                  )}
                </Button>
                <Button asChild variant="ghost" className="w-full" disabled={submitting}>
                  <Link href="/auth/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück zur Anmeldung
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </CardSurface>
    </div>
  )
}
