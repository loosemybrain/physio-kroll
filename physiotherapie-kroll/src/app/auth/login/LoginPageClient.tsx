"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardSurface, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAdminMfaState } from "@/lib/auth/adminAccess";
import { normalizeInternalRedirectTarget } from "@/lib/auth/redirects";

function mapLoginMessage(message: string | null): string | null {
  if (!message) return null
  if (message === "password-reset-success") {
    return "Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt anmelden."
  }
  return null
}

function mapLoginError(errorCode: string | null): string | null {
  if (!errorCode) return null
  if (errorCode === "admin-required") {
    return "Sie haben keine Admin-Berechtigung für diesen Bereich."
  }
  if (errorCode === "callback-missing-code") {
    return "Der Bestätigungslink ist unvollständig oder abgelaufen. Bitte erneut anmelden."
  }
  if (errorCode.startsWith("callback-")) {
    return "Der Anmelde- oder Bestätigungslink konnte nicht verarbeitet werden."
  }
  return "Anmeldung fehlgeschlagen. Bitte erneut versuchen."
}

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = normalizeInternalRedirectTarget(searchParams.get("next"), "/admin/pages")

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const message = mapLoginMessage(searchParams.get("message"))
    const error = mapLoginError(searchParams.get("error"))
    setSuccessMessage(message)
    if (error) setError(error)
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.session) {
        const { data: userData } = await supabase.auth.getUser()
        const mfaState = await getAdminMfaState(supabase, userData.user)
        if (mfaState.isAdmin) {
          const target = encodeURIComponent(next)
          if (!mfaState.hasTotpFactor || !mfaState.hasVerifiedTotpFactor) {
            router.push(`/auth/mfa/setup?next=${target}`)
            router.refresh()
            return
          }
          if (mfaState.currentAal !== "aal2") {
            router.push(`/auth/mfa/verify?next=${target}`)
            router.refresh()
            return
          }
        }
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message === "Failed to fetch" || err.name === "TypeError"
            ? "Verbindung fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und ob die Supabase-URL (NEXT_PUBLIC_SUPABASE_URL) in .env erreichbar ist."
            : err.message
          : "Ein Fehler ist aufgetreten";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <CardSurface className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Physiotherapie Kroll Login</CardTitle>
          <CardDescription>Melden Sie sich an, um auf das Backend zuzugreifen</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {successMessage && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird angemeldet...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>

            <div className="text-center text-sm">
              <Link href="/auth/forgot" className="text-primary hover:underline">
                Passwort vergessen?
              </Link>
            </div>
          </form>
        </CardContent>
      </CardSurface>
    </div>
  );
}

