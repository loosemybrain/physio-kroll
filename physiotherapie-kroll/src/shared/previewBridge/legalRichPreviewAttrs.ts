/**
 * Zentrale `data-*`-Namen für Legal-Rich-Preview (Phase 2).
 * Nicht im normalen Frontend-Modus auswerten — nur Preview/Editor-Kontext.
 */
export const LEGAL_RICH_PREVIEW_ATTR = {
  /** CMS-Block-ID (`legalRichText`-Block) */
  blockId: "data-block-id",
  /** ID des strukturierten `contentBlocks`-Eintrags */
  contentBlockId: "data-content-block-id",
  /** Listenzeile innerhalb bulletList/orderedList */
  listItemId: "data-list-item-id",
  /** Legacy-Alias (wird parallel gesetzt) */
  legacyListItemId: "data-legal-rich-list-item-id",
  /** Textsegment / Run */
  runId: "data-run-id",
  /** Knotentyp: paragraph | heading | list | listItem | run */
  nodeType: "data-legal-rich-node-type",
} as const
