"use client"

import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { AdminPageSummary } from "@/lib/cms/supabaseStore"

interface PagesViewProps {
  pages: AdminPageSummary[]
  onEditPage: (pageId: string) => void
  onNewPage: () => void
  onPreviewPage?: (pageId: string) => void
  onDeletePage?: (pageId: string) => void
}

function brandLabel(brand: AdminPageSummary["brand"]) {
  return brand === "physio-konzept" ? "Physio-Konzept" : "Physiotherapie"
}

function statusLabel(status: AdminPageSummary["status"]) {
  return status === "published" ? "Published" : "Draft"
}

export function PagesView({ pages, onEditPage, onNewPage, onPreviewPage, onDeletePage }: PagesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pages</h2>
          <p className="text-sm text-muted-foreground">Manage your website pages</p>
        </div>
        <Button onClick={onNewPage} className="gap-2">
          <Plus className="h-4 w-4" />
          New Page
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium">Title</TableHead>
              <TableHead className="font-medium">Brand</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Last Updated</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No pages yet. Click “New Page” to create one.
                </TableCell>
              </TableRow>
            ) : (
              pages.map((page) => {
                const isHomePage = page.slug === "home" || page.slug === "";
                return (
                <TableRow key={page.id} className="group">
                  <TableCell className="font-medium text-foreground">
                    {page.title}
                    {isHomePage && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Homepage
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{brandLabel(page.brand)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={page.status === "published" ? "default" : "secondary"}
                      className={
                        page.status === "published"
                          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
                      }
                    >
                      {statusLabel(page.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(page.updatedAt).toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditPage(page.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPreviewPage?.(page.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDeletePage?.(page.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
