import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Zentrale Brand-Resolution für Server-Komponenten.
 * 
 * Nutze diese Funktion statt pathname-basierter Ableitung.
 * RootLayout und Segment-Layouts nutzen diese, um konsistent brand zu bestimmen.
 */
export async function resolveBrand(): Promise<BrandKey> {
  // Für RootLayout: Standard-Fallback
  // Segment-Layouts überschreiben dies mit ihrem spezifischen Brand
  return "physiotherapy"
}

/**
 * Segment-spezifische Brand-Resolution für /konzept.
 */
export async function resolveBrandKonzept(): Promise<BrandKey> {
  return "physio-konzept"
}
