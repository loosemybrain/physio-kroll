"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MfaFactorCard, type MfaTotpFactorListItem } from "@/components/admin/MfaFactorCard"
import { MfaEnrollDialog, type MfaEnrollPayload } from "@/components/admin/MfaEnrollDialog"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function extractTotpFactors(data: unknown): MfaTotpFactorListItem[] {
  const raw = data as { totp?: unknown; all?: unknown } | null | undefined
  let list: MfaTotpFactorListItem[] = []
  if (Array.isArray(raw?.totp)) {
    list = (raw.totp as MfaTotpFactorListItem[]).filter(
      (f) => (f as { factor_type?: string }).factor_type === "totp",
    )
  }
  if (list.length === 0 && Array.isArray(raw?.all)) {
    list = (raw.all as MfaTotpFactorListItem[]).filter(
      (f) => (f as { factor_type?: string }).factor_type === "totp",
    )
  }
  return list
}

export function MfaManagerClient() {
  const [factors, setFactors] = useState<MfaTotpFactorListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [removingId, setRemovingId] = useState<string | null>(null)
  const [factorToDelete, setFactorToDelete] = useState<MfaTotpFactorListItem | null>(null)

  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollPayload, setEnrollPayload] = useState<MfaEnrollPayload | null>(null)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const loadFactors = useCallback(async () => {
    setPageError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      setFactors(extractTotpFactors(data))
    } catch (e) {
      console.error("[MFA MANAGER] listFactors:error", e)
      setPageError(getErrorMessage(e))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await loadFactors()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadFactors])

  const resetEnrollState = useCallback(() => {
    setEnrolling(false)
    setEnrollPayload(null)
    setEnrollError(null)
  }, [])

  const handleEnrollOpenChange = useCallback(
    (open: boolean) => {
      setEnrollOpen(open)
      if (!open) resetEnrollState()
    },
    [resetEnrollState],
  )

  const startEnroll = useCallback(async () => {
    setEnrollOpen(true)
    setEnrollPayload(null)
    setEnrollError(null)
    setEnrolling(true)
    try {
      const supabase = createSupabaseBrowserClient()
      let friendlyName = "Backup Authenticator"
      let { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      })
      const msg = enrollErr?.message?.toLowerCase() ?? ""
      if (
        enrollErr &&
        (msg.includes("friendly") || msg.includes("duplicate") || msg.includes("exists"))
      ) {
        friendlyName = `Backup Authenticator (${Date.now()})`
        const second = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName,
        })
        data = second.data as typeof data
        enrollErr = second.error
      }
      if (enrollErr) throw enrollErr
      const row = data as {
        id?: string
        totp?: { qr_code: string; secret: string; uri: string }
      } | null
      if (!row?.id || !row.totp) throw new Error("Ungültige Antwort vom Server (enroll).")
      setEnrollPayload({
        id: row.id,
        totp: {
          qr_code: row.totp.qr_code,
          secret: row.totp.secret,
          uri: row.totp.uri,
        },
      })
    } catch (e) {
      console.error("[MFA MANAGER] enroll:error", e)
      setEnrollError(getErrorMessage(e))
    } finally {
      setEnrolling(false)
    }
  }, [])

  const handleAddAuthenticator = () => {
    void startEnroll()
  }

  const confirmUnenroll = async () => {
    if (!factorToDelete) return
    setRemovingId(factorToDelete.id)
    setPageError(null)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.mfa.unenroll({ factorId: factorToDelete.id })
      if (error) throw error
      setFactorToDelete(null)
      await loadFactors()
    } catch (e) {
      console.error("[MFA MANAGER] unenroll:error", e)
      setPageError(getErrorMessage(e))
    } finally {
      setRemovingId(null)
    }
  }

  const totpCount = factors.length
  const isLastTotp = totpCount <= 1

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MFA verwalten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            TOTP-Authenticator-Geräte für Ihr Konto. Wir empfehlen mindestens zwei Geräte – speichern Sie einen
            Backup-Faktor auf einem separaten Gerät.
          </p>
        </div>
      </div>

      {pageError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleAddAuthenticator} disabled={enrollOpen}>
          Neuen Authenticator hinzufügen
        </Button>
        <Button type="button" variant="outline" onClick={() => void loadFactors()}>
          Liste aktualisieren
        </Button>
      </div>

      {factors.length === 0 ? (
        <Alert>
          <AlertDescription>
            Keine TOTP-Faktoren gefunden. Fügen Sie einen Authenticator hinzu oder richten Sie MFA unter
            „TOTP einrichten“ ein.
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="space-y-4">
          {factors.map((f) => (
            <li key={f.id}>
              <MfaFactorCard
                factor={f}
                removing={removingId === f.id}
                onRemove={() => setFactorToDelete(f)}
              />
            </li>
          ))}
        </ul>
      )}

      <MfaEnrollDialog
        open={enrollOpen}
        onOpenChange={handleEnrollOpenChange}
        enrolling={enrolling}
        enrollError={enrollError}
        payload={enrollPayload}
        onEnrolled={() => void loadFactors()}
      />

      <AlertDialog open={Boolean(factorToDelete)} onOpenChange={(o) => !o && setFactorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authenticator entfernen?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>
                  Der Faktor wird dauerhaft von diesem Konto getrennt. Sie können sich danach nicht mehr mit diesem
                  Gerät anmelden.
                </p>
                {factorToDelete && isLastTotp ? (
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Letzter Authenticator – danach ist kein Zugriff mit MFA mehr möglich, bis Sie erneut einen
                    Faktor einrichten.
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void confirmUnenroll()
              }}
            >
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
