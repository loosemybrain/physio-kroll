/**
 * Zentrale Texte für External-Media-Gate (ohne externe URLs).
 */
export const EXTERNAL_MEDIA_PROVIDERS = {
  google_maps: {
    id: "google_maps" as const,
    label: "Google Maps",
    description:
      "Zum Anzeigen der Karte ist Ihre Zustimmung zur Kategorie „Externe Medien“ nötig. Die Entscheidung wird in einem Cookie gespeichert und gilt für die gesamte Website.",
  },
  facebook: {
    id: "facebook" as const,
    label: "Facebook",
    description:
      "Zum Laden von Facebook-Inhalten ist Ihre Zustimmung zur Kategorie „Externe Medien“ nötig. Die Entscheidung wird in einem Cookie gespeichert und gilt für die gesamte Website.",
  },
} as const

export type ExternalMediaProviderId = keyof typeof EXTERNAL_MEDIA_PROVIDERS
