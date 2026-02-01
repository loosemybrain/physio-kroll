"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminTheme } from "./AdminRootProvider"

/**
 * AdminThemeToggle - Toggles light/dark mode in admin area only.
 * - Does not affect public pages or global next-themes
 * - Updates localStorage and data-admin-theme attribute
 * - Can be placed anywhere in the admin area (typically in AdminTopbar or settings)
 */
export function AdminThemeToggle() {
  const { adminTheme, setAdminTheme } = useAdminTheme()

  const toggleTheme = () => {
    const newTheme = adminTheme === "light" ? "dark" : "light"
    setAdminTheme(newTheme)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title={`Switch to ${adminTheme === "light" ? "dark" : "light"} mode`}
      className="h-9 w-9"
    >
      {adminTheme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle admin theme</span>
    </Button>
  )
}
