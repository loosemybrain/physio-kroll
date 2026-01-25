import { ThemePresetSettings } from "@/components/admin/ThemePresetSettings"
import type { BrandKey } from "@/components/brand/brandAssets"
import { getBrandSettingsAuthed, getThemePresetsAuthed, type ThemePreset, type BrandSettings } from "@/lib/supabase/themePresets"

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
  