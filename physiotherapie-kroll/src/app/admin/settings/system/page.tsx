import Link from "next/link"
import { Palette, Type, SlidersHorizontal } from "lucide-react"
import { SpinnerPresetSettings } from "@/components/admin/SpinnerPresetSettings"

export default function AdminSystemSettingsPage() {
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="mb-8 border-b border-border">
        <div className="flex gap-4">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 pb-4 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
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
          <Link
            href="/admin/settings/system"
            className="flex items-center gap-2 pb-4 border-b-2 border-primary text-primary font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            System
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        <SpinnerPresetSettings />
      </div>
    </div>
  )
}

