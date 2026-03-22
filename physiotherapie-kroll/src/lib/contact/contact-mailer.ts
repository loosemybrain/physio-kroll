import type { BrandKey } from "@/components/brand/brandAssets"

/**
 * Mail provider interface
 * Allows for different mail providers (Resend, SMTP, SendGrid, etc.)
 */
export interface MailProvider {
  send(options: MailOptions): Promise<MailResult>
}

/**
 * Mail options
 */
export interface MailOptions {
  to: string
  from: string
  replyTo?: string
  subject: string
  text: string
  html?: string
}

/**
 * Mail result
 */
export interface MailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Resend mail provider
 * Requires RESEND_API_KEY environment variable
 */
class ResendMailProvider implements MailProvider {
  async send(options: MailOptions): Promise<MailResult> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured")
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options.from,
          to: options.to,
          ...(options.replyTo && { reply_to: options.replyTo }),
          subject: options.subject,
          text: options.text,
          ...(options.html && { html: options.html }),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || `Resend API error: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        messageId: result.id,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

/**
 * Get the configured mail provider
 */
export function getMailProvider(): MailProvider {
  // Default to Resend (can be extended with other providers)
  const provider = process.env.CONTACT_MAIL_PROVIDER || "resend"

  switch (provider) {
    case "resend":
      return new ResendMailProvider()
    default:
      throw new Error(`Unknown mail provider: ${provider}`)
  }
}

/**
 * Format contact submission as plaintext email
 */
export function formatContactEmailText(data: {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  brand: BrandKey
  testMode?: boolean
  originalRecipient?: string
  pageSlug?: string
  requestId?: string
}): string {
  const brandName = data.brand === "physio-konzept" ? "Physio-Konzept" : "Physiotherapy"
  const lines = [
    "=".repeat(60),
    "NEUE KONTAKTANFRAGE",
    "=".repeat(60),
    "",
    `Brand: ${brandName}`,
    `Name: ${data.name}`,
    `E-Mail: ${data.email}`,
    ...(data.phone ? [`Telefon: ${data.phone}`] : []),
    ...(data.subject ? [`Betreff: ${data.subject}`] : []),
    ...(data.pageSlug ? [`Quelle: ${data.pageSlug}`] : []),
    "",
  ]

  // Test mode indicator
  if (data.testMode) {
    lines.push("---")
    lines.push("[!] TESTMODUS - KONTROLLIERTER VERSAND")
    lines.push(`[!] Ursprünglicher Empfänger: ${data.originalRecipient || "nicht konfiguriert"}`)
    lines.push("---")
    lines.push("")
  }

  lines.push("NACHRICHT:")
  lines.push("-".repeat(60))
  lines.push(data.message)
  lines.push("-".repeat(60))
  lines.push("")
  lines.push(`Eingereicht am: ${new Date().toLocaleString("de-DE")}`)
  
  if (data.requestId) {
    lines.push(`Request-ID: ${data.requestId}`)
  }

  lines.push("")

  return lines.join("\n")
}

/**
 * Format contact submission as HTML email
 */
export function formatContactEmailHTML(data: {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  brand: BrandKey
  testMode?: boolean
  originalRecipient?: string
  pageSlug?: string
  requestId?: string
}): string {
  const brandName = data.brand === "physio-konzept" ? "Physio-Konzept" : "Physiotherapy"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
    .value { margin-top: 4px; }
    .message-body { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
    .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
    .test-notice { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .test-notice-title { font-weight: 600; color: #856404; margin-bottom: 8px; }
    .test-notice-text { color: #856404; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 18px; color: #333;">Neue Kontaktanfrage</h1>
      <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Von: <strong>${brandName}</strong></p>
    </div>

    ${
      data.testMode
        ? `
    <div class="test-notice">
      <div class="test-notice-title">⚠️ TESTMODUS - KONTROLLIERTER VERSAND</div>
      <div class="test-notice-text">
        Diese Nachricht wurde in der Testphase versendet.<br/>
        <strong>Ursprünglicher Empfänger:</strong> ${escapeHtml(data.originalRecipient || "nicht konfiguriert")}
      </div>
    </div>
    `
        : ""
    }

    <div class="field">
      <div class="label">Name</div>
      <div class="value">${escapeHtml(data.name)}</div>
    </div>

    <div class="field">
      <div class="label">E-Mail</div>
      <div class="value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
    </div>

    ${
      data.phone
        ? `
    <div class="field">
      <div class="label">Telefon</div>
      <div class="value"><a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></div>
    </div>
    `
        : ""
    }

    ${
      data.subject
        ? `
    <div class="field">
      <div class="label">Betreff</div>
      <div class="value">${escapeHtml(data.subject)}</div>
    </div>
    `
        : ""
    }

    ${
      data.pageSlug
        ? `
    <div class="field">
      <div class="label">Quelle</div>
      <div class="value">${escapeHtml(data.pageSlug)}</div>
    </div>
    `
        : ""
    }

    <div class="field">
      <div class="label">Nachricht</div>
      <div class="message-body">${escapeHtml(data.message)}</div>
    </div>

    <div class="footer">
      <p>Eingereicht am: ${new Date().toLocaleString("de-DE")}</p>
      ${data.requestId ? `<p>Request-ID: ${escapeHtml(data.requestId)}</p>` : ""}
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Send contact form email
 */
export async function sendContactEmail(data: {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  brand: BrandKey
  recipientEmail: string
  testMode?: boolean
  originalRecipient?: string
  pageSlug?: string
  requestId?: string
}): Promise<MailResult> {
  const provider = getMailProvider()

  // Get "from" email
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "noreply@example.com"

  // Format emails
  const text = formatContactEmailText(data)
  const html = formatContactEmailHTML(data)

  // Add test mode indicator to subject if in test mode
  let subjectPrefix = "[Kontaktformular]"
  if (data.testMode) {
    subjectPrefix = "[TEST] [Kontaktformular]"
  }
  const subject = data.subject ? `${subjectPrefix} ${data.subject}` : `${subjectPrefix} Neue Anfrage`

  // Send
  return provider.send({
    from: fromEmail,
    to: data.recipientEmail,
    replyTo: data.email,
    subject,
    text,
    html,
  })
}
