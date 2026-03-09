import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import type { LegalContactLine } from "@/types/cms"

const spacingTopMap = { none: "pt-0", sm: "pt-4", md: "pt-8", lg: "pt-12" }
const spacingBottomMap = { none: "pb-0", sm: "pb-4", md: "pb-8", lg: "pb-12" }

export type LegalContactCardProps = {
  headline: string
  lines: LegalContactLine[]
  variant?: "default" | "bordered"
  spacingTop?: "none" | "sm" | "md" | "lg"
  spacingBottom?: "none" | "sm" | "md" | "lg"
}

export function LegalContactCard({
  headline,
  lines,
  variant = "default",
  spacingTop = "md",
  spacingBottom = "md",
}: LegalContactCardProps) {
  return (
    <div
      className={cn(
        spacingTopMap[spacingTop],
        spacingBottomMap[spacingBottom],
      )}
    >
      <div
        className={cn(
          "rounded-2xl bg-card p-6 shadow-sm md:p-8",
          variant === "bordered" && "border border-border",
        )}
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{headline}</h3>
        </div>
        <dl className="space-y-3">
          {lines.map((line) => (
            <div key={line.id} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="w-32 flex-shrink-0 text-sm font-medium text-muted-foreground">
                {line.label}
              </dt>
              <dd className="text-sm text-foreground">
                {line.href ? (
                  <a
                    href={line.href}
                    className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {line.value}
                  </a>
                ) : (
                  line.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
