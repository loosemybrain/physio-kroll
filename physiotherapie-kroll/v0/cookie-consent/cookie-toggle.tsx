"use client"

import { cn } from "@/lib/utils"

interface CookieToggleProps {
  id: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  label: string
  description: string
}

export function CookieToggle({
  id,
  checked,
  disabled = false,
  onChange,
  label,
  description,
}: CookieToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex-1 space-y-1">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none",
            disabled ? "text-muted-foreground" : "text-foreground cursor-pointer"
          )}
        >
          {label}
          {disabled && (
            <span className="ml-2 text-xs text-muted-foreground">(Immer aktiv)</span>
          )}
        </label>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "bg-primary" : "bg-muted",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  )
}
