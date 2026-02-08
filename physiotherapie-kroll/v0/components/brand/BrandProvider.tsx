"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Brand = "physiotherapy" | "physio-konzept"

interface BrandContextValue {
  brand: Brand
  setBrand: (brand: Brand) => void
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined)

interface BrandProviderProps {
  children: ReactNode
  defaultBrand?: Brand
}

export function BrandProvider({ children, defaultBrand = "physiotherapy" }: BrandProviderProps) {
  const [brand, setBrand] = useState<Brand>(defaultBrand)

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const context = useContext(BrandContext)
  if (context === undefined) {
    // Return a default value instead of throwing, for flexibility
    return { brand: "physiotherapy" as Brand, setBrand: () => {} }
  }
  return context
}
