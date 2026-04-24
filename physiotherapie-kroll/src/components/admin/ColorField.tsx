"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type EyeDropperResult = { sRGBHex: string }
type EyeDropperApi = { open: () => Promise<EyeDropperResult> }

function clamp255(n: number) {
  return Math.max(0, Math.min(255, n))
}

function toHex2(n: number) {
  return clamp255(n).toString(16).padStart(2, "0")
}

function parseColorWithAlpha(value: string): { hex: string; alpha: number } | null {
  const v = value.trim()

  const m8 = v.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})$/)
  if (m8) {
    return {
      hex: `#${m8[1].toLowerCase()}`,
      alpha: parseInt(m8[2], 16) / 255,
    }
  }

  const m6 = v.match(/^#([0-9a-fA-F]{6})$/)
  if (m6) {
    return {
      hex: `#${m6[1].toLowerCase()}`,
      alpha: 1,
    }
  }

  const m3 = v.match(/^#([0-9a-fA-F]{3})$/)
  if (m3) {
    const [r, g, b] = m3[1].split("")
    return {
      hex: `#${r}${r}${g}${g}${b}${b}`.toLowerCase(),
      alpha: 1,
    }
  }

  const rgba = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+))?\s*\)$/i)
  if (rgba) {
    const r = Number(rgba[1])
    const g = Number(rgba[2])
    const b = Number(rgba[3])
    const a = rgba[4] ? Math.max(0, Math.min(1, parseFloat(rgba[4]))) : 1
    return {
      hex: `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`,
      alpha: a,
    }
  }

  return null
}

function supportsEyeDropper(): boolean {
  return typeof window !== "undefined" && "EyeDropper" in window
}

export function ColorField(props: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
  inputRef?: React.Ref<HTMLInputElement>
  /** Wenn true: Alpha-Slider ausblenden und nur Hex/RGB verwenden */
  disableAlpha?: boolean
}) {
  const [picking, setPicking] = React.useState(false)
  const parsed = parseColorWithAlpha(props.value) ?? { hex: "#000000", alpha: 1 }
  const pickerHex = parsed.hex

  const handleAlphaChange = (newAlpha: number) => {
    const alphaHex = toHex2(Math.round(newAlpha * 255))
    props.onChange(`${pickerHex}${alphaHex}`)
  }

  const effectiveInputValue = props.disableAlpha ? parsed.hex : props.value

  return (
    <div className={cn("flex flex-col gap-3", props.className)}>
      <div className="flex min-w-0 items-center gap-2">
        <Input
          ref={props.inputRef}
          value={effectiveInputValue}
          onChange={(e) => {
            if (props.disableAlpha) {
              const next = e.target.value
              const parsedNext = parseColorWithAlpha(next)
              props.onChange(parsedNext?.hex ?? next)
              return
            }
            props.onChange(e.target.value)
          }}
          className="h-8 min-w-0 flex-1 text-sm"
          placeholder={props.placeholder}
        />

        <input
          aria-label="Farbpicker"
          type="color"
          value={pickerHex}
          onChange={(e) => {
            const newHex = e.target.value
            if (props.disableAlpha) {
              props.onChange(newHex)
              return
            }
            const alphaHex = toHex2(Math.round(parsed.alpha * 255))
            props.onChange(`${newHex}${alphaHex}`)
          }}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0"
          title="Farbpicker"
        />

        {supportsEyeDropper() && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            disabled={picking}
            onClick={async () => {
              try {
                setPicking(true)
                const Ctor = (window as unknown as { EyeDropper?: { new (): EyeDropperApi } }).EyeDropper
                if (!Ctor) return
                const eye = new Ctor()
                const res = await eye.open()
                if (res?.sRGBHex) props.onChange(res.sRGBHex)
              } catch {
                // user cancelled or unsupported
              } finally {
                setPicking(false)
              }
            }}
          >
            Pipette
          </Button>
        )}
      </div>

      {!props.disableAlpha && (
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <label className="text-xs text-muted-foreground">Alpha:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(parsed.alpha * 100)}
            onChange={(e) => handleAlphaChange(parseInt(e.target.value) / 100)}
            className={cn(
              "flex-1 h-2 rounded-lg appearance-none cursor-pointer",
              "bg-muted/80 border border-border",
              "accent-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              // WebKit thumb
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/50 [&::-webkit-slider-thumb]:shadow-sm",
              // Firefox thumb
              "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/50",
              // Firefox track
              "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:bg-muted/80 [&::-moz-range-track]:border [&::-moz-range-track]:border-border"
            )}
          />
          <span className="w-12 text-right text-xs text-muted-foreground">{Math.round(parsed.alpha * 100)}%</span>
        </div>
      )}
    </div>
  )
}

