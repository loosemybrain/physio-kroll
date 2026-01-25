"use client"

import { useRouter } from "next/navigation"
import { PageEditor } from "./PageEditor"

interface PageEditorClientProps {
  pageId: string | null
}

export function PageEditorClient({ pageId }: PageEditorClientProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push("/admin/pages")
  }

  return <PageEditor pageId={pageId} onBack={handleBack} />
}
