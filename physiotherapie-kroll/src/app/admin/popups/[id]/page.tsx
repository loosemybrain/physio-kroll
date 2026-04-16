import { PopupEditorClient } from "@/components/admin/popups/PopupEditorClient"

export default async function PopupEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const popupId = resolvedParams.id === "new" ? null : resolvedParams.id
  return <PopupEditorClient popupId={popupId} />
}

