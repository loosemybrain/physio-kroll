import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import {
  CookieConsentProvider,
  CookieBanner,
  FloatingCookieButton,
} from "@/components/cookie-consent"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _playfair = Playfair_Display({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Physiotherapie & PhysioKonzept",
  description: "Professional physiotherapy services for your health and performance",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className="font-sans antialiased">
        <CookieConsentProvider>
          {children}
          <CookieBanner />
          <FloatingCookieButton />
        </CookieConsentProvider>
        <Analytics />
      </body>
    </html>
  )
}
