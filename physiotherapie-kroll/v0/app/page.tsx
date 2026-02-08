"use client"

import { useState } from "react"
import { HeroSection, type HeroMood } from "../components/hero-section"
import { CardBlock } from "../components/card-block"
import { ContactFormBlock } from "../components/blocks/contact-form-block"
import { ImageTextBlock } from "../components/blocks/image-text-block"
import { TestimonialsBlock } from "../components/blocks/testimonials-block"
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

      {/* CardBlock Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-semibold text-foreground">
            Unsere Leistungen
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CardBlock
              eyebrow="Klassisch"
              title="Physiotherapie"
              description="Professionelle Behandlung bei Schmerzen und Bewegungseinschränkungen"
              content="Unsere erfahrenen Therapeuten erstellen individuelle Behandlungspläne für Ihre Genesung."
              buttons={[
                {
                  id: "book-physio",
                  label: "Termin buchen",
                  href: "/termin",
                  variant: "default",
                  icon: "arrow-right",
                  iconPosition: "right",
                },
                {
                  id: "info-physio",
                  label: "Mehr erfahren",
                  variant: "outline",
                },
              ]}
              animation={{
                entrance: "slide-up",
                hover: "lift",
                durationMs: 500,
                delayMs: 0,
              }}
              style={{
                variant: "default",
                radius: "xl",
                border: "subtle",
                shadow: "md",
                accent: "brand",
              }}
            />

            <CardBlock
              eyebrow="Sport"
              title="Rehabilitation"
              description="Zurück zur Höchstleistung"
              content="Spezialisierte Programme für Sportler aller Leistungsstufen."
              align="center"
              headerLayout="inline-action"
              actionSlot="badge"
              actionLabel="Beliebt"
              footerAlign="center"
              buttons={[
                {
                  id: "start-rehab",
                  label: "Jetzt starten",
                  variant: "default",
                },
              ]}
              animation={{
                entrance: "fade",
                hover: "glow",
                durationMs: 400,
                delayMs: 100,
              }}
              style={{
                variant: "elevated",
                radius: "lg",
                border: "none",
                shadow: "lg",
              }}
            />

            <CardBlock
              title="Manuelle Therapie"
              description="Hands-on Behandlungstechniken"
              buttons={[
                {
                  id: "details-manual",
                  label: "Details ansehen",
                  variant: "ghost",
                  icon: "arrow-right",
                  iconPosition: "right",
                },
                {
                  id: "download-manual",
                  label: "Broschüre laden",
                  variant: "link",
                  icon: "download",
                  iconPosition: "left",
                },
              ]}
              animation={{
                entrance: "scale",
                hover: "none",
                durationMs: 300,
                delayMs: 200,
              }}
              style={{
                variant: "outline",
                radius: "md",
                border: "strong",
                shadow: "none",
                accent: "muted",
              }}
            />
          </div>
        </div>
      </section>

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
