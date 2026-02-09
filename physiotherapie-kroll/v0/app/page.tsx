"use client"

import { useState } from "react"
import { HeroSection, type HeroMood } from "../components/hero-section"
import { ContactFormBlock } from "../components/blocks/contact-form-block"
import { ServicesGridBlock } from "../components/blocks/services-grid-block"
import { ImageTextBlock } from "../components/blocks/image-text-block"
import { TestimonialsBlock } from "../components/blocks/testimonials-block"
import { TeamGridBlock } from "../components/blocks/team-grid-block"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [mood, setMood] = useState<HeroMood>("physiotherapy")

  return (
    <main>
      {/* Theme Switcher for Demo */}
      <nav
        className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-card/80 p-2 shadow-lg backdrop-blur-sm"
        aria-label="Theme selection"
      >
        <Button
          variant={mood === "physiotherapy" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMood("physiotherapy")}
          className="rounded-full"
        >
          Physiotherapie
        </Button>
        <Button
          variant={mood === "physio-konzept" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMood("physio-konzept")}
          className="rounded-full"
        >
          PhysioKonzept
        </Button>
      </nav>

      {/* Hero Section */}
      <HeroSection mood={mood} onCtaClick={() => console.log("CTA clicked")} />

      {/* Services Grid */}
      <ServicesGridBlock
        blockId="services-grid"
        headline="Unsere Leistungen"
        subheadline="Was wir bieten"
        variant="grid"
        columns={3}
        background="muted"
        cards={[
          {
            id: "s1",
            icon: "Activity",
            title: "Physiotherapie",
            text: "Professionelle Behandlung bei Schmerzen und Bewegungseinschränkungen. Unsere erfahrenen Therapeuten erstellen individuelle Behandlungspläne für Ihre Genesung.",
            ctaText: "Termin buchen",
            ctaHref: "#contact",
          },
          {
            id: "s2",
            icon: "Dumbbell",
            title: "Sport-Rehabilitation",
            text: "Spezialisierte Programme für Sportler aller Leistungsstufen. Zurück zur Höchstleistung mit evidenzbasierter Therapie.",
            ctaText: "Jetzt starten",
            ctaHref: "#contact",
          },
          {
            id: "s3",
            icon: "HandHeart",
            title: "Manuelle Therapie",
            text: "Gezielte Hands-on Behandlungstechniken zur Mobilisierung von Gelenken und Lösung von Verspannungen im gesamten Bewegungsapparat.",
            ctaText: "Details ansehen",
            ctaHref: "#contact",
          },
          {
            id: "s4",
            icon: "Brain",
            title: "Neurologische Therapie",
            text: "Behandlung neurologischer Erkrankungen wie Schlaganfall, Multiple Sklerose oder Parkinson mit spezialisierten Therapiekonzepten.",
            ctaText: "Mehr erfahren",
            ctaHref: "#contact",
          },
          {
            id: "s5",
            icon: "Waves",
            title: "Lymphdrainage",
            text: "Sanfte, rhythmische Massagetechnik zur Anregung des Lymphflusses und Reduktion von Schwellungen nach Operationen oder Verletzungen.",
            ctaText: "Termin vereinbaren",
            ctaHref: "#contact",
          },
          {
            id: "s6",
            icon: "Flame",
            title: "Wärmetherapie",
            text: "Fango, Rotlicht und Heißluft zur Förderung der Durchblutung, Schmerzlinderung und Vorbereitung auf die manuelle Behandlung.",
            ctaText: "Mehr erfahren",
            ctaHref: "#contact",
          },
        ]}
      />

      {/* Image-Text Block: About */}
      <ImageTextBlock
        blockId="about-block"
        layout="image-left"
        variant="soft"
        verticalAlign="center"
        textAlign="left"
        maxWidth="xl"
        image={{
          src: "/images/therapy-room.jpg",
          alt: "Moderne Behandlungsräume mit professioneller Ausstattung",
        }}
        eyebrow="Über uns"
        headline="Ganzheitliche Therapie für Ihr Wohlbefinden"
        content="<p>Unser erfahrenes Team aus zertifizierten Therapeuten begleitet Sie individuell auf dem Weg zur Genesung. Mit modernsten Methoden und einem ganzheitlichen Ansatz sorgen wir dafür, dass Sie sich rundum gut aufgehoben fühlen.</p>"
        cta={{
          label: "Mehr erfahren",
          href: "#contact",
        }}
      />

      {/* Image-Text Block: Services reversed */}
      <ImageTextBlock
        blockId="services-block"
        layout="image-right"
        variant="default"
        verticalAlign="center"
        textAlign="left"
        maxWidth="xl"
        image={{
          src: "/images/sports-rehab.jpg",
          alt: "Sportliche Rehabilitation und Training",
        }}
        eyebrow="Leistungen"
        headline="Individuelle Behandlungspläne"
        content="<p>Von klassischer Physiotherapie über manuelle Therapie bis hin zur sportlichen Rehabilitation — wir bieten ein breites Spektrum an Behandlungsmethoden, die auf Ihre Bedürfnisse abgestimmt sind.</p>"
        cta={{
          label: "Termin vereinbaren",
          href: "#contact",
        }}
      />

      {/* Team Grid */}
      <TeamGridBlock
        blockId="team"
        eyebrow="Unser Team"
        headline="Die Menschen hinter Ihrer Genesung"
        subheadline="Lernen Sie unser engagiertes Team aus erfahrenen Therapeuten kennen, das sich jeden Tag für Ihre Gesundheit einsetzt."
        columns={3}
        layout="cards"
        background="gradient"
        members={[
          {
            id: "m1",
            name: "Dr. Elena Hartmann",
            role: "Praxisleitung & Physiotherapeutin",
            bio: "Spezialisiert auf orthopädische Rehabilitation mit über 15 Jahren Erfahrung. Zertifizierte Manualtherapeutin und Sportphysiotherapeutin.",
            tags: ["Orthopädie", "Manuelle Therapie"],
            socials: [
              { type: "linkedin", href: "#" },
              { type: "email", href: "mailto:hartmann@example.com" },
            ],
            ctaText: "Profil ansehen",
            ctaHref: "#",
          },
          {
            id: "m2",
            name: "Maximilian Berger",
            role: "Sport-Physiotherapeut",
            bio: "Ehemaliger Leistungssportler mit Fokus auf sportliche Rehabilitation. Betreut Athleten vom Breitensport bis zur Bundesliga.",
            avatarGradient: "g2",
            tags: ["Sport-Reha", "Leistungsdiagnostik"],
            socials: [
              { type: "instagram", href: "#" },
              { type: "linkedin", href: "#" },
            ],
            ctaText: "Profil ansehen",
            ctaHref: "#",
          },
          {
            id: "m3",
            name: "Sophie Kraus",
            role: "Neurologische Therapeutin",
            bio: "Expertin für neurologische Erkrankungen wie Schlaganfall, MS und Parkinson. Arbeitet mit evidenzbasierten Therapiekonzepten.",
            avatarGradient: "g4",
            tags: ["Neurologie", "Bobath"],
            socials: [
              { type: "linkedin", href: "#" },
            ],
            ctaText: "Profil ansehen",
            ctaHref: "#",
          },
          {
            id: "m4",
            name: "Jonas Fischer",
            role: "Manualtherapeut",
            bio: "Spezialist für Wirbelsäulentherapie und chronische Schmerzbehandlung. Zertifiziert in Osteopathie und Faszientherapie.",
            avatarGradient: "g6",
            tags: ["Wirbelsäule", "Osteopathie"],
            socials: [
              { type: "website", href: "#" },
              { type: "email", href: "mailto:fischer@example.com" },
            ],
            ctaText: "Profil ansehen",
            ctaHref: "#",
          },
          {
            id: "m5",
            name: "Laura Weiß",
            role: "Lymphtherapeutin",
            bio: "Zertifizierte Lymphdrainagetherapeutin mit Zusatzqualifikation in Ödemtherapie. Einfühlsame Betreuung nach operativen Eingriffen.",
            avatarGradient: "g3",
            tags: ["Lymphdrainage", "Ödemtherapie"],
            socials: [
              { type: "linkedin", href: "#" },
            ],
            ctaText: "Profil ansehen",
            ctaHref: "#",
          },
          {
            id: "m6",
            name: "David Meier",
            role: "Trainingstherapeut",
            bio: "Medizinischer Trainingstherapeut und Personal Trainer. Erstellt individuelle Trainingspläne für Prävention und Rehabilitation.",
            avatarGradient: "g8",
            tags: ["MTT", "Prävention"],
            socials: [
              { type: "instagram", href: "#" },
              { type: "linkedin", href: "#" },
            ],
            ctaText: "Profil ansehen",
            ctaHref: "#",
          },
        ]}
      />

      {/* Testimonials Block -- Slider variant */}
      <TestimonialsBlock
        headline="Das sagen unsere Patienten"
        subheadline="Erfahrungsberichte"
        variant="slider"
        background="muted"
        items={[
          {
            id: "t1",
            quote:
              "Nach meiner Knie-OP war ich hier in den besten Händen. Die einfühlsame Betreuung und die professionelle Therapie haben mir geholfen, schneller wieder auf die Beine zu kommen. Schon nach wenigen Wochen konnte ich wieder ohne Schmerzen spazieren gehen.",
            name: "Maria Schneider",
            role: "Patientin seit 2022",
            rating: 5,
          },
          {
            id: "t2",
            quote:
              "Die ganzheitliche Herangehensweise hat mir bei meinen chronischen Rückenschmerzen endlich Linderung gebracht. Das Team nimmt sich wirklich Zeit, zuhören und individuell auf meine Beschwerden einzugehen. Ich bin unendlich dankbar.",
            name: "Thomas Weber",
            role: "Patient seit 2021",
            rating: 5,
          },
          {
            id: "t3",
            quote:
              "Vertrauensvoll, professionell und menschlich -- genau das, was man sich von einer Physiotherapie-Praxis wünscht. Die moderne Ausstattung und das freundliche Team machen jeden Besuch angenehm.",
            name: "Anna Müller",
            role: "Patientin seit 2023",
            rating: 5,
          },
        ]}
      />

      {/* Testimonials Block -- Grid variant */}
      <TestimonialsBlock
        headline="Erfolgsgeschichten unserer Sportler"
        subheadline="Resultate"
        variant="grid"
        columns={3}
        background="gradient"
        items={[
          {
            id: "g1",
            quote:
              "Dank der individuellen Trainingsplanung habe ich meine Bestzeit im Marathon um 12 Minuten verbessert. Die Kombination aus Physiotherapie und Leistungsdiagnostik ist unschlagbar.",
            name: "Markus Hoffmann",
            role: "Marathonläufer",
            rating: 5,
          },
          {
            id: "g2",
            quote:
              "Nach meiner Sportverletzung bin ich stärker zurückgekommen als zuvor. Das Team versteht genau, was Athleten brauchen, und begleitet einen bis zum Comeback.",
            name: "Lisa Berger",
            role: "Triathletin",
            rating: 5,
          },
          {
            id: "g3",
            quote:
              "Professionelles Training auf höchstem Niveau. Hier wird man gefordert und gefördert zugleich. Die Ergebnisse sprechen für sich.",
            name: "Felix Kramer",
            role: "Crossfit Athlet",
            rating: 5,
          },
        ]}
      />

      {/* Contact Form Section */}
      <section id="contact" className="bg-background py-20">
        <div className="container mx-auto px-4">
          <ContactFormBlock
            layout="split"
            headline="Schreiben Sie uns"
            introText="Haben Sie Fragen zu unseren Leistungen oder möchten Sie einen Termin vereinbaren? Wir freuen uns auf Ihre Nachricht."
            submitLabel="Nachricht absenden"
            successMessage="Vielen Dank! Wir haben Ihre Nachricht erhalten und melden uns innerhalb von 24 Stunden bei Ihnen."
          />
        </div>
      </section>
    </main>
  )
}
