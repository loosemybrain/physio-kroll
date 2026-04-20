"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, LogOut, Home, ChevronDown, User, Shield } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminThemeToggle } from "./AdminThemeToggle"
import { readLastPublicHome, writeLastPublicHome, type PublicHomePath } from "@/lib/publicHomePreference"

type AdminTopbarProps = {
  /**
   * Server-provided user. Auth/session lifecycle is owned by middleware + server.
   * The client must NOT call supabase.auth.getSession() (HttpOnly cookies).
   */
  user: SupabaseUser | null
}

export function AdminTopbar({ user }: AdminTopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [websiteHome, setWebsiteHome] = React.useState<PublicHomePath>("/")

  const currentTitle = React.useMemo(() => {
    if (pathname === "/admin") return "Dashboard"
    if (pathname?.startsWith("/admin/pages")) return "Seiten"
    return "Admin"
  }, [pathname])

  React.useEffect(() => {
    setWebsiteHome(readLastPublicHome())
  }, [])

  const navigatePublicHome = (path: PublicHomePath) => {
    writeLastPublicHome(path)
    setWebsiteHome(path)
    router.push(path)
  }

  const handleLogout = async () => {
    // Server-owned session: sign out via route handler (clears HttpOnly cookies).
    await fetch("/auth/logout", { method: "POST" }).catch(() => {})
    router.push("/auth/login")
    router.refresh()
  }

  const userInitials = user?.email
    ? user.email
        .split("@")[0]
        .split(".")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium text-foreground">{currentTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigatePublicHome(websiteHome)}
              className="gap-2 rounded-r-none border-r-0 hover:text-accent"
            >
              <Home className="h-4 w-4" />
              <span>Zur Website</span>
            </Button>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-l-none px-2 hover:text-accent"
                aria-label="Website-Marke wählen"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Startseite öffnen (Theme und Inhalt passen zur Route)
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigatePublicHome("/")}>
              Physiotherapie — /
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigatePublicHome("/konzept")}>
              Physio-Konzept — /konzept
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Admin Theme Toggle - scoped to admin area only */}
        {/* <AdminThemeToggle /> */}

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full text-foreground transition-all hover:bg-accent/70 hover:text-foreground hover:ring-2 hover:ring-primary/35 focus-visible:ring-2 focus-visible:ring-primary/45"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User" />
                <AvatarFallback className="text-foreground">{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || "Benutzer"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "Lädt..."}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push("/admin/security/account")}
              className="data-highlighted:bg-muted data-highlighted:text-foreground"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Konto</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push("/admin/security/mfa")}
              className="data-highlighted:bg-muted data-highlighted:text-foreground"
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>MFA</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="data-highlighted:bg-muted data-highlighted:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Abmelden</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
