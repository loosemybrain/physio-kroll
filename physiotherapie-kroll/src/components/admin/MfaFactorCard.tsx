"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardTitle } from "@/components/ui/card"

export type MfaTotpFactorListItem = {
  id: string
  friendly_name?: string
  status: string
}

type Props = {
  factor: MfaTotpFactorListItem
  onRemove: () => void
  removing: boolean
}

export function MfaFactorCard({ factor, onRemove, removing }: Props) {
  const name = factor.friendly_name?.trim() || "Authenticator"
  const verified = factor.status.toLowerCase() === "verified"

  return (
    <Card className="border border-border">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="text-base font-medium leading-snug">{name}</CardTitle>
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground break-all">
              ID: {factor.id}
            </p>
          </div>
          <Badge
            className={
              verified
                ? "mt-0.5 shrink-0 border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "mt-0.5 shrink-0 border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200"
            }
            variant="outline"
          >
            {verified ? "verified" : "unverified"}
          </Badge>
        </div>
        <div className="mt-4 border-t border-border/60 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onRemove} disabled={removing}>
            {removing ? "Wird entfernt…" : "Entfernen"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
