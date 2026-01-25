import { PageEditorClient } from "@/components/admin/PageEditorClient"

export default async function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const pageId = resolvedParams.id === "new" ? null : resolvedParams.id
  return <PageEditorClient pageId={pageId} />
}
