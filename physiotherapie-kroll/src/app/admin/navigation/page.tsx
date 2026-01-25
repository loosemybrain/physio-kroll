import { NavigationEditorClient } from "@/components/admin/NavigationEditorClient"
import { getNavigation } from "@/lib/supabase/navigation"
import { listPagesServer } from "@/lib/supabase/pages.server"

export const dynamic = "force-dynamic"

export default async function NavigationPage() {
  const [physioConfig, konzeptConfig, pages] = await Promise.all([
    getNavigation("physiotherapy"),
    getNavigation("physio-konzept"),
    listPagesServer(), // Load all pages (draft + published) server-side
  ])

  return (
    <NavigationEditorClient
      initialPhysio={physioConfig}
      initialKonzept={konzeptConfig}
      initialPages={pages}
    />
  )
}
