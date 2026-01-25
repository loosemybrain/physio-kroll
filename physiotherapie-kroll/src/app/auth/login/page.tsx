import { Suspense } from "react";
import { LoginPageClient } from "./LoginPageClient";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-sm text-muted-foreground">
          Lade Login...
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
