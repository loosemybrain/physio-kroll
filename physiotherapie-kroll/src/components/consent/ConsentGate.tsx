"use client"

import { useCookieConsent } from "./CookieProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { consentCategoryLabels, type ConsentCategory } from "@/lib/consent/types"
import { useState, type ReactNode } from "react"
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
 */
export function ConsentGate({ category, children, fallback, className }: ConsentGateProps) {
  const { hasConsent, setCategory, openSettings } = useCookieConsent()
  const [hasOptedIn, setHasOptedIn] = useState(false)

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

  // Default fallback: Card with opt-in button
  const label = consentCategoryLabels[category]

  const handleOptIn = () => {
    setCategory(category, true)
    setHasOptedIn(true)
  }

  return (
    <Card className={cn("my-4", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{label.label}</CardTitle>
        <CardDescription>{label.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleOptIn} variant="default" className="w-full sm:w-auto">
          {category === "functional" ? "Inhalte laden (funktional)" : `${label.label} aktivieren`}
        </Button>
        <Button
          onClick={openSettings}
          variant="ghost"
          size="sm"
          className="mt-2 w-full sm:w-auto sm:ml-2"
        >
          Cookie-Einstellungen
        </Button>
      </CardContent>
    </Card>
  )
}
