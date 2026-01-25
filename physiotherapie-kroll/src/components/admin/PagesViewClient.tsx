"use client"

import { useRouter } from "next/navigation"
import { PagesView } from "./PageView"
import { usePages } from "@/lib/cms/useLocalCms"
import { deletePage } from "@/lib/cms/supabaseStore"

export function PagesViewClient() {
  const router = useRouter()
  const { pages, refresh } = usePages()

  const handleEditPage = (pageId: string) => {
    router.push(`/admin/pages/${pageId}`)
  }

  const handleNewPage = () => {
    router.push("/admin/pages/new")
  }

  const handleDelete = async (pageId: string) => {
    await deletePage(pageId)
    await refresh()
  }

  const handlePreviewPage = (pageId: string) => {
    // Open a dedicated preview route (works for draft + published)
    // Use a new tab to keep admin state intact.
    window.open(`/preview/${pageId}`, "_blank", "noopener,noreferrer")
  }

  return (
    <PagesView
      pages={pages}
      onEditPage={handleEditPage}
      onNewPage={handleNewPage}
      onPreviewPage={handlePreviewPage}
      onDeletePage={handleDelete}
    />
  )
}
