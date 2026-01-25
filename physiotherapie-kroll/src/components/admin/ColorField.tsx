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

function normalizeHex(value: string): string | null {
  const v = value.trim()
  const m3 = v.match(/^#([0-9a-fA-F]{3})$/)
  if (m3) {
    const [r, g, b] = m3[1].split("")
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  const m6 = v.match(/^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/)
  if (m6) return `#${m6[1].toLowerCase()}`

  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i)
  if (rgb) {
    const r = Number(rgb[1])
    const g = Number(rgb[2])
    const b = Number(rgb[3])
    return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`
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
}) {
  const [picking, setPicking] = React.useState(false)
  const pickerHex = normalizeHex(props.value) ?? "#000000"

  return (
    <div className={cn("flex items-center gap-2", props.className)}>
      <Input
        ref={props.inputRef}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="h-8 text-sm"
        placeholder={props.placeholder}
      />

      <input
        aria-label="Farbpicker"
        type="color"
        value={pickerHex}
        onChange={(e) => props.onChange(e.target.value)}
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
  )
}

