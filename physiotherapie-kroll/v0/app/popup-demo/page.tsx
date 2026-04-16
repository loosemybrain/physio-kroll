'use client'

import { useState } from 'react'
import { PopupModal } from '@/components/popup'
import { Button } from '@/components/ui/button'

export default function PopupDemoPage() {
  const [promotionOpen, setPromotionOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [consentOpen, setConsentOpen] = useState(false)
  const [announcementOpen, setAnnouncementOpen] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground">Popup Modal Variants</h1>
          <p className="mt-2 text-muted-foreground">
            Explore all popup variants and layouts for your website
          </p>
        </div>
      </header>

      {/* Demo Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Promotion Popup */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Promotion Popup</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Image-top layout with call-to-action for promotions
            </p>
            <Button onClick={() => setPromotionOpen(true)} className="w-full">
              Open Promotion Popup
            </Button>
          </div>

          {/* Info Popup */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Info Popup</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Text-focused minimal design for information
            </p>
            <Button onClick={() => setInfoOpen(true)} className="w-full">
              Open Info Popup
            </Button>
          </div>

          {/* Consent Popup */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Consent Popup</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Legal/consent style with primary and secondary actions
            </p>
            <Button onClick={() => setConsentOpen(true)} className="w-full">
              Open Consent Popup
            </Button>
          </div>

          {/* Announcement Popup */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Announcement Popup</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Split layout with image on the left side
            </p>
            <Button onClick={() => setAnnouncementOpen(true)} className="w-full">
              Open Announcement Popup
            </Button>
          </div>
        </div>
      </section>

      {/* Popups */}
      <PopupModal
        isOpen={promotionOpen}
        variant="promotion"
        layoutVariant="image-top"
        size="md"
        headline="Sparen Sie 20% auf Ihre erste Buchung"
        subheadline="Limitiertes Angebot für Neupatienten"
        body="Erleben Sie unsere preisgekrönte Physiotherapie mit 20% Rabatt auf Ihre erste Sitzung. Melden Sie sich jetzt an und beginnen Sie Ihren Weg zur Genesung."
        image={{
          src: '/images/therapy-room.jpg',
          alt: 'Physiotherapy treatment room',
          parallax: true,
        }}
        primaryCTA={{
          label: 'Jetzt Termin buchen',
          onClick: () => {
            console.log('Booking clicked')
            setPromotionOpen(false)
          },
        }}
        secondaryCTA={{
          label: 'Später anschauen',
          onClick: () => setPromotionOpen(false),
        }}
        tertiaryText="Angebot endet bald"
        onClose={() => setPromotionOpen(false)}
        accentColor="primary"
      />

      <PopupModal
        isOpen={infoOpen}
        variant="info"
        layoutVariant="no-image"
        size="sm"
        headline="Besuchen Sie unsere neue Filiale"
        subheadline="Jetzt auch in Kreuzberg"
        body="Wir freuen uns, unsere vierte Praxis in Berlin-Kreuzberg eröffnet zu haben. Mit modernster Ausstattung und einem noch größeren Team sind wir noch besser für Sie da."
        primaryCTA={{
          label: 'Weitere Informationen',
          onClick: () => {
            console.log('Info clicked')
            setInfoOpen(false)
          },
        }}
        onClose={() => setInfoOpen(false)}
        accentColor="accent"
      />

      <PopupModal
        isOpen={consentOpen}
        variant="consent"
        layoutVariant="no-image"
        size="md"
        headline="Datenschutz & Cookies"
        subheadline="Wir respektieren Ihre Privatsphäre"
        body="Diese Website verwendet Cookies, um Ihre Erfahrung zu verbessern. Alle Daten werden sicher und gemäß DSGVO behandelt."
        primaryCTA={{
          label: 'Alle akzeptieren',
          onClick: () => {
            console.log('Consent given')
            setConsentOpen(false)
          },
        }}
        secondaryCTA={{
          label: 'Einstellungen anpassen',
          onClick: () => console.log('Settings clicked'),
        }}
        tertiaryText="Nur notwendige akzeptieren"
        onClose={() => setConsentOpen(false)}
        accentColor="primary"
      />

      <PopupModal
        isOpen={announcementOpen}
        variant="announcement"
        layoutVariant="image-left"
        size="lg"
        headline="Neue Gruppentherapie verfügbar"
        subheadline="Gemeinsam trainieren, schneller genesen"
        body="Entdecken Sie unsere neuen Gruppentrainings für Rückengesundheit und Sportrehabilitation. Jetzt anmelden und von Gruppenrabatten profitieren."
        image={{
          src: '/images/sports-rehab.jpg',
          alt: 'Group training session',
        }}
        primaryCTA={{
          label: 'Zur Anmeldung',
          onClick: () => {
            console.log('Signup clicked')
            setAnnouncementOpen(false)
          },
        }}
        secondaryCTA={{
          label: 'Kursplan ansehen',
          onClick: () => console.log('Schedule clicked'),
        }}
        onClose={() => setAnnouncementOpen(false)}
        accentColor="primary"
      />
    </main>
  )
}
