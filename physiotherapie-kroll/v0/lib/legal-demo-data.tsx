import type { LegalPageConfig } from "@/types/legal"

/* ------------------------------------------------------------------ */
/*  Datenschutzerklärung                                               */
/* ------------------------------------------------------------------ */

export const DATENSCHUTZ_CONFIG: LegalPageConfig = {
  meta: {
    id: "datenschutz",
    type: "datenschutz",
    slug: "datenschutz",
    title: "Datenschutzerklärung",
    subtitle: "Informationen zum Umgang mit Ihren personenbezogenen Daten",
    introText:
      "Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003).",
    seoTitle: "Datenschutzerklärung | Physiotherapie Praxis",
    seoDescription:
      "Erfahren Sie, wie wir Ihre personenbezogenen Daten schützen und verarbeiten.",
    published: true,
    updatedAt: "2024-01-15",
  },
  showTableOfContents: true,
  tocPosition: "inline",
  blocks: [
    {
      id: "verantwortlicher",
      type: "section",
      anchorId: "verantwortlicher",
      headline: "Verantwortlicher",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 1,
      content: `
        <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
      `,
    },
    {
      id: "verantwortlicher-contact",
      type: "contact-card",
      headline: "Verantwortliche Stelle",
      lines: [
        { id: "name", label: "Name", value: "Physiotherapie Musterpraxis GmbH" },
        { id: "strasse", label: "Adresse", value: "Musterstraße 123, 12345 Musterstadt" },
        { id: "tel", label: "Telefon", value: "+49 123 456789", href: "tel:+49123456789" },
        { id: "email", label: "E-Mail", value: "datenschutz@musterpraxis.de", href: "mailto:datenschutz@musterpraxis.de" },
      ],
    },
    {
      id: "erhebung",
      type: "section",
      anchorId: "erhebung",
      headline: "Erhebung und Speicherung personenbezogener Daten",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 2,
      content: `
        <p>Beim Besuch unserer Website werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert.</p>
        <p>Folgende Informationen werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:</p>
        <ul>
          <li>IP-Adresse des anfragenden Rechners</li>
          <li>Datum und Uhrzeit des Zugriffs</li>
          <li>Name und URL der abgerufenen Datei</li>
          <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
          <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
        </ul>
      `,
    },
    {
      id: "rechtsgrundlage-info",
      type: "infobox",
      variant: "info",
      headline: "Rechtsgrundlage",
      content: "<p>Die genannten Daten werden durch uns zu folgenden Zwecken verarbeitet: Gewährleistung eines reibungslosen Verbindungsaufbaus der Website, Gewährleistung einer komfortablen Nutzung unserer Website, Auswertung der Systemsicherheit und -stabilität.</p>",
    },
    {
      id: "kontaktformular",
      type: "section",
      anchorId: "kontaktformular",
      headline: "Kontaktformular",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 3,
      content: `
        <p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.</p>
        <p>Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.</p>
      `,
    },
    {
      id: "terminbuchung",
      type: "section",
      anchorId: "terminbuchung",
      headline: "Online-Terminbuchung",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 4,
      content: `
        <p>Für die Online-Terminbuchung nutzen wir einen externen Dienstleister. Bei der Buchung werden folgende Daten erhoben:</p>
        <ul>
          <li>Vor- und Nachname</li>
          <li>E-Mail-Adresse</li>
          <li>Telefonnummer</li>
          <li>Gewünschter Termin und Behandlungsart</li>
        </ul>
        <p>Diese Daten werden ausschließlich zur Terminkoordination verwendet und nach Ablauf der gesetzlichen Aufbewahrungsfristen gelöscht.</p>
      `,
    },
    {
      id: "verarbeitungen-table",
      type: "table",
      caption: "Übersicht der Datenverarbeitungen",
      columns: [
        { id: "zweck", label: "Zweck", width: "25%" },
        { id: "daten", label: "Verarbeitete Daten", width: "30%" },
        { id: "grundlage", label: "Rechtsgrundlage", width: "20%" },
        { id: "dauer", label: "Speicherdauer", width: "25%" },
      ],
      rows: [
        {
          id: "r1",
          cells: {
            zweck: "Website-Betrieb",
            daten: "IP-Adresse, Zugriffsdaten",
            grundlage: "Art. 6 Abs. 1 lit. f DSGVO",
            dauer: "7 Tage",
          },
        },
        {
          id: "r2",
          cells: {
            zweck: "Kontaktanfragen",
            daten: "Name, E-Mail, Nachricht",
            grundlage: "Art. 6 Abs. 1 lit. b DSGVO",
            dauer: "6 Monate",
          },
        },
        {
          id: "r3",
          cells: {
            zweck: "Terminbuchung",
            daten: "Name, E-Mail, Telefon, Termin",
            grundlage: "Art. 6 Abs. 1 lit. b DSGVO",
            dauer: "10 Jahre (gesetzl.)",
          },
        },
        {
          id: "r4",
          cells: {
            zweck: "Newsletter",
            daten: "E-Mail-Adresse",
            grundlage: "Art. 6 Abs. 1 lit. a DSGVO",
            dauer: "Bis Widerruf",
          },
        },
      ],
      variant: "default",
      zebra: true,
    },
    {
      id: "divider1",
      type: "divider",
      variant: "gradient",
      spacingTop: "lg",
      spacingBottom: "lg",
    },
    {
      id: "rechte",
      type: "section",
      anchorId: "rechte",
      headline: "Ihre Rechte",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 5,
      content: `
        <p>Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:</p>
        <ul>
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
          <li>Recht auf Löschung (Art. 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
        </ul>
        <p>Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.</p>
      `,
      highlight: true,
    },
    {
      id: "widerruf-info",
      type: "infobox",
      variant: "warning",
      headline: "Widerrufsrecht",
      content: "<p>Sofern wir Ihre personenbezogenen Daten auf Grundlage Ihrer Einwilligung verarbeiten, haben Sie das Recht, Ihre Einwilligung jederzeit zu widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt davon unberührt.</p>",
    },
  ],
}

/* ------------------------------------------------------------------ */
/*  Cookie-Richtlinie                                                  */
/* ------------------------------------------------------------------ */

export const COOKIES_CONFIG: LegalPageConfig = {
  meta: {
    id: "cookies",
    type: "cookies",
    slug: "cookies",
    title: "Cookie-Richtlinie",
    subtitle: "Informationen zur Verwendung von Cookies auf unserer Website",
    introText:
      "Wir verwenden Cookies und ähnliche Technologien, um Ihnen ein optimales Website-Erlebnis zu bieten. Hier erfahren Sie, welche Cookies wir einsetzen und wie Sie Ihre Präferenzen verwalten können.",
    seoTitle: "Cookie-Richtlinie | Physiotherapie Praxis",
    seoDescription: "Erfahren Sie, welche Cookies wir verwenden und wie Sie Ihre Einstellungen verwalten können.",
    published: true,
    updatedAt: "2024-01-15",
  },
  showTableOfContents: true,
  tocPosition: "inline",
  blocks: [
    {
      id: "was-sind-cookies",
      type: "section",
      anchorId: "was-sind-cookies",
      headline: "Was sind Cookies?",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 1,
      content: `
        <p>Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website besuchen. Sie ermöglichen es der Website, Ihre Aktionen und Einstellungen (wie z. B. Login, Sprache, Schriftgröße und andere Anzeigeeinstellungen) über einen bestimmten Zeitraum zu speichern.</p>
        <p>Cookies können von der Website, die Sie besuchen ("Erstanbieter-Cookies"), oder von anderen Websites, die Inhalte auf der Seite bereitstellen ("Drittanbieter-Cookies"), gesetzt werden.</p>
      `,
    },
    {
      id: "kategorien",
      type: "section",
      anchorId: "kategorien",
      headline: "Cookie-Kategorien",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 2,
      content: `<p>Wir unterteilen die auf unserer Website verwendeten Cookies in folgende Kategorien:</p>`,
    },
    {
      id: "cookie-categories",
      type: "cookie-categories",
      variant: "cards",
      categories: [
        {
          id: "essential",
          name: "Essenzielle Cookies",
          description: "Diese Cookies sind für die grundlegende Funktionalität der Website erforderlich und können nicht deaktiviert werden. Sie werden nur als Reaktion auf von Ihnen vorgenommene Aktionen gesetzt.",
          required: true,
          cookies: [
            { id: "c1", name: "session_id", provider: "Eigene Website", purpose: "Sitzungsverwaltung", duration: "Sitzung", type: "HTTP" },
            { id: "c2", name: "cookie_consent", provider: "Eigene Website", purpose: "Speicherung der Cookie-Einstellungen", duration: "1 Jahr", type: "HTTP" },
            { id: "c3", name: "csrf_token", provider: "Eigene Website", purpose: "Sicherheit gegen Cross-Site-Anfragen", duration: "Sitzung", type: "HTTP" },
          ],
        },
        {
          id: "functional",
          name: "Funktionale Cookies",
          description: "Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung, wie z. B. die Speicherung Ihrer Spracheinstellungen oder die Anzeige personalisierter Inhalte.",
          required: false,
          cookies: [
            { id: "c4", name: "language", provider: "Eigene Website", purpose: "Speicherung der Spracheinstellung", duration: "1 Jahr", type: "HTTP" },
            { id: "c5", name: "theme", provider: "Eigene Website", purpose: "Speicherung des Farbschemas", duration: "1 Jahr", type: "HTTP" },
          ],
        },
        {
          id: "analytics",
          name: "Statistik-Cookies",
          description: "Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren. Alle erfassten Informationen sind anonymisiert.",
          required: false,
          cookies: [
            { id: "c6", name: "_ga", provider: "Google Analytics", purpose: "Unterscheidung von Nutzern", duration: "2 Jahre", type: "HTTP" },
            { id: "c7", name: "_gid", provider: "Google Analytics", purpose: "Unterscheidung von Nutzern", duration: "24 Stunden", type: "HTTP" },
          ],
        },
        {
          id: "marketing",
          name: "Marketing-Cookies",
          description: "Diese Cookies werden verwendet, um Werbung relevanter für Sie zu gestalten. Sie werden derzeit auf unserer Website nicht eingesetzt.",
          required: false,
          cookies: [],
        },
      ],
    },
    {
      id: "divider-cookies",
      type: "divider",
      variant: "gradient",
      spacingTop: "lg",
      spacingBottom: "lg",
    },
    {
      id: "alle-cookies-table",
      type: "section",
      anchorId: "alle-cookies",
      headline: "Detaillierte Cookie-Übersicht",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 3,
      content: `<p>Die folgende Tabelle enthält eine vollständige Übersicht aller auf unserer Website verwendeten Cookies:</p>`,
    },
    {
      id: "cookies-table",
      type: "table",
      columns: [
        { id: "name", label: "Cookie-Name", width: "15%" },
        { id: "provider", label: "Anbieter", width: "15%" },
        { id: "purpose", label: "Zweck", width: "30%" },
        { id: "duration", label: "Speicherdauer", width: "15%" },
        { id: "type", label: "Typ", width: "10%" },
        { id: "category", label: "Kategorie", width: "15%" },
      ],
      rows: [
        { id: "t1", cells: { name: "session_id", provider: "Eigene Website", purpose: "Sitzungsverwaltung", duration: "Sitzung", type: "HTTP", category: "Essenziell" } },
        { id: "t2", cells: { name: "cookie_consent", provider: "Eigene Website", purpose: "Cookie-Einstellungen", duration: "1 Jahr", type: "HTTP", category: "Essenziell" } },
        { id: "t3", cells: { name: "csrf_token", provider: "Eigene Website", purpose: "Sicherheit", duration: "Sitzung", type: "HTTP", category: "Essenziell" } },
        { id: "t4", cells: { name: "language", provider: "Eigene Website", purpose: "Spracheinstellung", duration: "1 Jahr", type: "HTTP", category: "Funktional" } },
        { id: "t5", cells: { name: "_ga", provider: "Google", purpose: "Nutzerunterscheidung", duration: "2 Jahre", type: "HTTP", category: "Statistik" } },
        { id: "t6", cells: { name: "_gid", provider: "Google", purpose: "Nutzerunterscheidung", duration: "24 Stunden", type: "HTTP", category: "Statistik" } },
      ],
      variant: "default",
      zebra: true,
    },
    {
      id: "verwaltung",
      type: "section",
      anchorId: "verwaltung",
      headline: "Verwaltung Ihrer Cookie-Einstellungen",
      headlineSize: "h2",
      showNumber: true,
      numberValue: 4,
      content: `
        <p>Sie können Ihre Cookie-Einstellungen jederzeit über unser Cookie-Banner oder in Ihren Browser-Einstellungen verwalten.</p>
        <p>Bitte beachten Sie, dass das Deaktivieren bestimmter Cookies die Funktionalität unserer Website beeinträchtigen kann.</p>
      `,
    },
    {
      id: "settings-info",
      type: "infobox",
      variant: "info",
      headline: "Cookie-Einstellungen ändern",
      content: "<p>Um Ihre Cookie-Einstellungen zu ändern, klicken Sie auf das Cookie-Symbol in der unteren linken Ecke unserer Website oder nutzen Sie die entsprechende Option in Ihrem Browser.</p>",
    },
  ],
}

/* ------------------------------------------------------------------ */
/*  Impressum                                                          */
/* ------------------------------------------------------------------ */

export const IMPRESSUM_CONFIG: LegalPageConfig = {
  meta: {
    id: "impressum",
    type: "impressum",
    slug: "impressum",
    title: "Impressum",
    subtitle: "Angaben gemäß § 5 TMG",
    seoTitle: "Impressum | Physiotherapie Praxis",
    seoDescription: "Impressum und rechtliche Angaben zur Physiotherapie Musterpraxis.",
    published: true,
    updatedAt: "2024-01-15",
  },
  showTableOfContents: false,
  blocks: [
    {
      id: "anbieter",
      type: "contact-card",
      headline: "Anbieterkennzeichnung",
      lines: [
        { id: "firma", label: "Firma", value: "Physiotherapie Musterpraxis GmbH" },
        { id: "strasse", label: "Adresse", value: "Musterstraße 123" },
        { id: "ort", label: "", value: "12345 Musterstadt" },
        { id: "tel", label: "Telefon", value: "+49 123 456789", href: "tel:+49123456789" },
        { id: "fax", label: "Fax", value: "+49 123 456780" },
        { id: "email", label: "E-Mail", value: "info@musterpraxis.de", href: "mailto:info@musterpraxis.de" },
      ],
      spacingBottom: "lg",
    },
    {
      id: "vertretung",
      type: "section",
      headline: "Vertretungsberechtigte",
      headlineSize: "h3",
      content: `<p>Geschäftsführer: Max Mustermann</p>`,
      spacingTop: "none",
      spacingBottom: "md",
    },
    {
      id: "register",
      type: "section",
      headline: "Registereintrag",
      headlineSize: "h3",
      content: `
        <p>Eintragung im Handelsregister</p>
        <p>Registergericht: Amtsgericht Musterstadt<br/>
        Registernummer: HRB 12345</p>
      `,
      spacingTop: "none",
      spacingBottom: "md",
    },
    {
      id: "umsatzsteuer",
      type: "section",
      headline: "Umsatzsteuer-ID",
      headlineSize: "h3",
      content: `<p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br/>DE 123 456 789</p>`,
      spacingTop: "none",
      spacingBottom: "md",
    },
    {
      id: "berufsbezeichnung",
      type: "section",
      headline: "Berufsbezeichnung und berufsrechtliche Regelungen",
      headlineSize: "h3",
      content: `
        <p>Berufsbezeichnung: Physiotherapeut/in (verliehen in der Bundesrepublik Deutschland)</p>
        <p>Zuständige Aufsichtsbehörde: Gesundheitsamt Musterstadt</p>
        <p>Zuständige Kammer: Landeskammer für Physiotherapie</p>
      `,
      spacingTop: "none",
      spacingBottom: "md",
    },
    {
      id: "divider-impressum",
      type: "divider",
      variant: "gradient",
      spacingTop: "md",
      spacingBottom: "md",
    },
    {
      id: "haftung-inhalte",
      type: "section",
      headline: "Haftung für Inhalte",
      headlineSize: "h3",
      content: `
        <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
        <p>Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>
      `,
      spacingTop: "none",
      spacingBottom: "md",
    },
    {
      id: "haftung-links",
      type: "section",
      headline: "Haftung für Links",
      headlineSize: "h3",
      content: `
        <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
        <p>Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.</p>
      `,
      spacingTop: "none",
      spacingBottom: "md",
    },
    {
      id: "urheberrecht",
      type: "section",
      headline: "Urheberrecht",
      headlineSize: "h3",
      content: `
        <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
        <p>Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>
      `,
      spacingTop: "none",
      spacingBottom: "md",
    },
    {
      id: "streitschlichtung-info",
      type: "infobox",
      variant: "neutral",
      headline: "Streitschlichtung",
      content: `<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`,
    },
  ],
}
