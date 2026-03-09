import { NavigationEditorClient } from "@/components/admin/NavigationEditorClient"
import { getNavigation } from "@/lib/supabase/navigation"
import { listPagesServer, getAnchorTargets } from "@/lib/supabase/pages.server"

export const dynamic = "force-dynamic"

export default async function NavigationPage() {
  const [physioConfig, konzeptConfig, pages, physioAnchorTargets, konzeptAnchorTargets] =
    await Promise.all([
      getNavigation("physiotherapy"),
      getNavigation("physio-konzept"),
      listPagesServer(),
      getAnchorTargets("physiotherapy"),
      getAnchorTargets("physio-konzept"),
    ])

  return (
    <NavigationEditorClient
      initialPhysio={physioConfig}
      initialKonzept={konzeptConfig}
      initialPages={pages}
      initialAnchorTargetsPhysio={physioAnchorTargets}
      initialAnchorTargetsKonzept={konzeptAnchorTargets}
    />
  )
}
