"use client"

import { useCookieConsent } from "./CookieProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { consentCategoryLabels, type ConsentCategory } from "@/lib/consent/types"
import { useState, type ReactNode, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ConsentGateProps {
  category: ConsentCategory
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

/**
 * Gate component that only renders children if consent is given for the category
 * Shows a fallback with opt-in button if consent is not given
 * V0 design with animations
 */
export function ConsentGate({ category, children, fallback, className }: ConsentGateProps) {
  const { hasConsent, setCategory, openSettings } = useCookieConsent()
  const [hasOptedIn, setHasOptedIn] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setPrefersReducedMotion(
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  }, [])

  // Necessary category is always allowed
  if (category === "necessary") {
    return <>{children}</>
  }

  // Check if consent is given
  const hasConsentForCategory = hasConsent(category)

  // If consent is given or user opted in, render children
  if (hasConsentForCategory || hasOptedIn) {
    return <div className={className}>{children}</div>
  }

  // Show fallback or default placeholder
  if (fallback) {
    return <div className={className}>{fallback}</div>
  }

  // Default fallback: Card with opt-in button (V0 design)
  const label = consentCategoryLabels[category]

  const handleOptIn = () => {
    setCategory(category, true)
    setHasOptedIn(true)
  }

  return (
    <Card
      className={cn(
        "my-4 border-border bg-card/50 backdrop-blur-sm",
        prefersReducedMotion ? "" : "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">{label.label}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{label.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          onClick={handleOptIn}
          variant="default"
          className="rounded-lg px-6 font-medium"
          size="sm"
        >
          {category === "functional" ? "Inhalte laden (funktional)" : `${label.label} aktivieren`}
        </Button>
        <Button
          onClick={openSettings}
          variant="ghost"
          size="sm"
          className="rounded-lg px-4"
        >
          Cookie-Einstellungen
        </Button>
      </CardContent>
    </Card>
  )
}
