"use client";

import { MediaLibrary } from "@/components/admin/MediaLibrary";

export default function MediaPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Medienbibliothek</h1>
      <MediaLibrary />
    </div>
  );
}
