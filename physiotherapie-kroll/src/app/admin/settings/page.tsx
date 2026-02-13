import { ThemePresetSettings } from "@/components/admin/ThemePresetSettings"
import type { BrandKey } from "@/components/brand/brandAssets"
import { getBrandSettingsAuthed, getThemePresetsAuthed, type ThemePreset, type BrandSettings } from "@/lib/supabase/themePresets"
import Link from "next/link"
import { Palette, Type } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminSettings() {
  const brands: BrandKey[] = ["physiotherapy", "physio-konzept"]

  const [physioPresets, physioSettings, konzeptPresets, konzeptSettings] = await Promise.all([
    getThemePresetsAuthed("physiotherapy"),
    getBrandSettingsAuthed("physiotherapy"),
    getThemePresetsAuthed("physio-konzept"),
    getBrandSettingsAuthed("physio-konzept"),
  ])

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Settings Navigation */}
      <div className="mb-8 border-b border-border">
        <div className="flex gap-4">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 pb-4 border-b-2 border-primary text-primary font-medium"
          >
            <Palette className="h-4 w-4" />
            Theme
          </Link>
          <Link
            href="/admin/settings/fonts"
            className="flex items-center gap-2 pb-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            <Type className="h-4 w-4" />
            Fonts
          </Link>
        </div>
      </div>

      {/* Theme Settings */}
      <ThemePresetSettings
        initial={{
          physiotherapy: {
            presets: (physioPresets ?? []) as ThemePreset[],
            activePresetId: (physioSettings as BrandSettings | null)?.active_theme_preset_id ?? null,
          },
          "physio-konzept": {
            presets: (konzeptPresets ?? []) as ThemePreset[],
            activePresetId: (konzeptSettings as BrandSettings | null)?.active_theme_preset_id ?? null,
          },
        }}
      />
    </div>
  )
}
  