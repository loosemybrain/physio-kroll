"use client"

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2, UserCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle, CardSurface } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SensitiveActionMfaDialog } from "@/components/auth/SensitiveActionMfaDialog"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { mapCredentialUpdateError } from "@/lib/auth/mfaClientErrors"
import {
  applyUserCredentialUpdate,
  prepareSensitiveUserCredentialsChange,
  type UserCredentialUpdate,
  type VerifiedTotpFactor,
} from "@/lib/auth/sensitiveUserUpdate"

type Props = {
  initialEmail: string
}

export function AccountSecurityClient({ initialEmail }: Props) {
  const [currentEmail] = useState(initialEmail)

  const [newEmail, setNewEmail] = useState("")
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailBusy, setEmailBusy] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordBusy, setPasswordBusy] = useState(false)

  const [mfaOpen, setMfaOpen] = useState(false)
  const [mfaFactors, setMfaFactors] = useState<VerifiedTotpFactor[] | null>(null)

  const pendingRef = useRef<UserCredentialUpdate | null>(null)
  const runningRef = useRef(false)

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Das Passwort muss mindestens 8 Zeichen lang sein."
    return null
  }

  const runCredentialUpdate = useCallback(async (update: UserCredentialUpdate): Promise<boolean> => {
    if (runningRef.current) return false
    runningRef.current = true
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await applyUserCredentialUpdate(supabase, update)
      if (error) {
        const friendly = mapCredentialUpdateError(error)
        if (update.kind === "email") {
          setEmailError(friendly)
        } else {
          setPasswordError(friendly)
        }
        return false
      }
      if (update.kind === "email") {
        setEmailMessage(
          "Die Änderung wurde gespeichert. Sofern in Ihrem Projekt die E-Mail-Bestätigung aktiv ist, erhalten Sie eine Bestätigungsmail an die neue Adresse."
        )
        setNewEmail("")
      } else {
        setPasswordMessage("Ihr Passwort wurde erfolgreich geändert.")
        setNewPassword("")
        setConfirmPassword("")
      }
      return true
    } finally {
      runningRef.current = false
    }
  }, [])

  const startSensitiveFlow = useCallback(
    async (update: UserCredentialUpdate, setBusy: (v: boolean) => void, setErr: (s: string | null) => void) => {
      setErr(null)
      const supabase = createSupabaseBrowserClient()
      const prep = await prepareSensitiveUserCredentialsChange(supabase)
      if (prep.status === "error") {
        setErr(prep.message)
        return
      }
      if (prep.status === "proceed") {
        setBusy(true)
        try {
          await runCredentialUpdate(update)
        } finally {
          setBusy(false)
        }
        return
      }
      pendingRef.current = update
      setMfaFactors(prep.factors)
      setMfaOpen(true)
    },
    [runCredentialUpdate]
  )

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaOpen) return
    setEmailMessage(null)
    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed) {
      setEmailError("Bitte eine neue E-Mail-Adresse eingeben.")
      return
    }
    if (trimmed === (currentEmail || "").toLowerCase()) {
      setEmailError("Die neue Adresse ist identisch mit der aktuellen.")
      return
    }
    await startSensitiveFlow({ kind: "email", email: trimmed }, setEmailBusy, setEmailError)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaOpen) return
    setPasswordMessage(null)
    if (newPassword !== confirmPassword) {
      setPasswordError("Die Passwörter stimmen nicht überein.")
      return
    }
    const pe = validatePassword(newPassword)
    if (pe) {
      setPasswordError(pe)
      return
    }
    await startSensitiveFlow({ kind: "password", password: newPassword }, setPasswordBusy, setPasswordError)
  }

  const handleMfaVerified = useCallback(async () => {
    const pending = pendingRef.current
    pendingRef.current = null
    if (!pending) return
    await runCredentialUpdate(pending)
  }, [runCredentialUpdate])

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <UserCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Konto &amp; Anmeldung</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            E-Mail-Adresse und Passwort ändern. Bei aktivem Authenticator ist vor sensiblen Änderungen eine
            zusätzliche Bestätigung nötig.
          </p>
        </div>
      </div>

      <SensitiveActionMfaDialog
        open={mfaOpen}
        onOpenChange={(o) => {
          setMfaOpen(o)
          if (!o) {
            pendingRef.current = null
            setMfaFactors(null)
          }
        }}
        initialFactors={mfaFactors ?? undefined}
        onVerified={handleMfaVerified}
      />

      <CardSurface className="mb-6">
        <CardHeader>
          <CardTitle>E-Mail-Adresse</CardTitle>
          <CardDescription>Aktuell: {currentEmail || "—"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {emailError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{emailError}</AlertDescription>
              </Alert>
            ) : null}
            {emailMessage ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{emailMessage}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="new-email">Neue E-Mail-Adresse</Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="email"
                value={newEmail}
                onChange={(ev) => setNewEmail(ev.target.value)}
                disabled={emailBusy || mfaOpen}
              />
            </div>
            <Button type="submit" disabled={emailBusy || mfaOpen}>
              {emailBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              E-Mail ändern
            </Button>
          </form>
        </CardContent>
      </CardSurface>

      <Separator className="my-8" />

      <CardSurface>
        <CardHeader>
          <CardTitle>Passwort</CardTitle>
          <CardDescription>Mindestens 8 Zeichen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            ) : null}
            {passwordMessage ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{passwordMessage}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="acc-new-pw">Neues Passwort</Label>
              <Input
                id="acc-new-pw"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                disabled={passwordBusy || mfaOpen}
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-confirm-pw">Passwort bestätigen</Label>
              <Input
                id="acc-confirm-pw"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                disabled={passwordBusy || mfaOpen}
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={passwordBusy || mfaOpen}>
              {passwordBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Passwort ändern
            </Button>
          </form>
        </CardContent>
      </CardSurface>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/admin/security/mfa" className="underline underline-offset-4 hover:text-foreground">
          MFA / Authenticator verwalten
        </Link>
      </p>
    </div>
  )
}
