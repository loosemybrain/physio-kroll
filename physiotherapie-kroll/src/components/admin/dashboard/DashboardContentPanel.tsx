import type { DashboardMetric } from "@/lib/admin/dashboard"
import { CardSurface } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import styles from "./DashboardTheme.module.css"

type DashboardContentPanelProps = {
  pagesTotal: number
  pagesPublished: number
  pagesDraft: number
  pagesWithoutMetaDescription: DashboardMetric<number>
  blocksTotal: number
  popupsTotal: number
  popupsActive: number
  popupsScheduled: number
  navigationConfiguredBrands: number
  footerConfiguredBrands: number
}

export function DashboardContentPanel(props: DashboardContentPanelProps) {
  const metaDescriptionHint =
    props.pagesWithoutMetaDescription.status === "available"
      ? `${props.pagesWithoutMetaDescription.value} ohne Meta-Description`
      : "Meta-Description derzeit nicht robust auswertbar"

  const rows = [
    { name: "Pages", total: props.pagesTotal, detail: `${props.pagesPublished} published / ${props.pagesDraft} draft` },
    { name: "SEO-Meta", total: props.pagesWithoutMetaDescription.status === "available" ? props.pagesWithoutMetaDescription.value : "-", detail: metaDescriptionHint },
    { name: "Blocks", total: props.blocksTotal, detail: "CMS Block-Inhalte" },
    { name: "Popups", total: props.popupsTotal, detail: `${props.popupsActive} aktiv / ${props.popupsScheduled} geplant` },
    { name: "Navigation", total: props.navigationConfiguredBrands, detail: "konfigurierte Brand-Eintraege" },
    { name: "Footer", total: props.footerConfiguredBrands, detail: "konfigurierte Brand-Eintraege" },
  ]

  return (
    <CardSurface className={`${styles.panelSurface} gap-4 rounded-xl py-4`}>
      <div className="px-6">
        <h2 className={`text-lg font-semibold ${styles.title}`}>Content-Bestand</h2>
        <p className={`text-sm ${styles.textSoft}`}>Tabellarische Sicht auf zentrale CMS-Quellen.</p>
      </div>

      <div className="px-6 pb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bereich</TableHead>
              <TableHead className="text-right">Anzahl</TableHead>
              <TableHead>Hinweis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right">{row.total}</TableCell>
                <TableCell className="text-muted-foreground">{row.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardSurface>
  )
}
