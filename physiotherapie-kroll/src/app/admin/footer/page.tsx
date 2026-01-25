import { FooterEditorClient } from "@/components/admin/FooterEditorClient"
import { getFooterServer } from "@/lib/supabase/footer.server"
import { listPagesServer } from "@/lib/supabase/pages.server"

export const dynamic = "force-dynamic"

export default async function FooterPage() {
  const [physioConfig, konzeptConfig, pages] = await Promise.all([
    getFooterServer("physiotherapy"),
    getFooterServer("physio-konzept"),
    listPagesServer(), // Load all pages (draft + published) server-side
  ])

  return (
    <FooterEditorClient
      initialPhysio={physioConfig}
      initialKonzept={konzeptConfig}
      initialPages={pages}
    />
  )
}
