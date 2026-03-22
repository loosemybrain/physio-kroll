# Contact Form Setup Guide

## Quick Start (5 minutes)

### 1. Get API Keys

**Resend Email Service:**
1. Go to [resend.com](https://resend.com)
2. Sign up (free tier available)
3. Create a project
4. Copy your API Key: `re_xxx...`

### 2. Update Environment Variables

**`.env.local` (Development):**

```bash
# Existing Supabase vars...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Add these new vars:

# Brand-specific recipient emails
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physiotherapy.example.com
CONTACT_EMAIL_PHYSIOKONZEPT=contact@physio-konzept.example.com

# Email sender
CONTACT_FROM_EMAIL=noreply@example.com

# Mail provider
CONTACT_MAIL_PROVIDER=resend

# Your Resend API key
RESEND_API_KEY=re_your_key_here

# Allowed origins for CSRF protection
CONTACT_ALLOWED_ORIGINS=localhost,127.0.0.1
```

### 3. Test Locally

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# Navigate to a page with contact form
# Fill it out completely
# Submit

# Check:
# - Success message appears ✓
# - Email arrives in your inbox ✓
# - Submission appears in Supabase table ✓
```

## Detailed Configuration

### Environment Variables

#### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `CONTACT_EMAIL_PHYSIOTHERAPY` | `contact@physio.de` | Recipient for "physiotherapy" brand |
| `CONTACT_EMAIL_PHYSIOKONZEPT` | `contact@konzept.de` | Recipient for "physio-konzept" brand |
| `CONTACT_FROM_EMAIL` | `noreply@example.com` | Sender address |
| `RESEND_API_KEY` | `re_xxx...` | Resend API key |
| `CONTACT_ALLOWED_ORIGINS` | `localhost,example.com` | Allowed domains (CSRF) |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTACT_MAIL_PROVIDER` | `resend` | Mail provider to use |
| `CONTACT_FALLBACK_EMAIL` | `(none)` | Fallback if brand unknown |

### Resend Configuration

**Verifying Sending Domain (Production):**

For production, you need to verify your domain with Resend:

1. In Resend dashboard: Domains → Add domain
2. Add your domain (e.g., `example.com`)
3. Follow DNS verification steps
4. Once verified, update `CONTACT_FROM_EMAIL` to use verified domain

**Development/Testing:**

- Use Resend's sandbox mode (free API key)
- Emails go to inbox, but slower
- For testing, add recipient emails to "Audiences" in Resend

### CORS & Origin Configuration

**`CONTACT_ALLOWED_ORIGINS`:**

Comma-separated list of allowed origins (domain only, no protocol):

```bash
# Development
CONTACT_ALLOWED_ORIGINS=localhost

# Testing multiple domains
CONTACT_ALLOWED_ORIGINS=localhost,127.0.0.1,preview.example.com

# Production
CONTACT_ALLOWED_ORIGINS=example.com,www.example.com
```

The handler checks:
1. `Origin` header (preferred, used for CORS)
2. `Referer` header (fallback, for older browsers)

## Database Setup

The database table should be created automatically by Supabase migration:

```bash
# Migration file location:
src/lib/supabase/migrations-contact.sql

# Already applied if you have production database
# If not applied, run in Supabase SQL Editor:
```

**Check if table exists:**

1. Log in to Supabase
2. Go to SQL Editor
3. Run:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'contact_submissions';
```

4. If not found, apply migration in Supabase SQL Editor

## Local Development

### Email Testing in Development

**Option 1: Use Resend Sandbox (Default)**

```bash
RESEND_API_KEY=re_xxx...  # Free sandbox key
```

- Emails sent to verified addresses
- Check Resend dashboard for delivery
- Free tier includes testing

**Option 2: Log Emails to Console**

Modify `src/lib/contact/contact-mailer.ts`:

```typescript
async send(options: MailOptions): Promise<MailResult> {
  // Log to console for development
  console.log("[DEV] Email would be sent:", {
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text.substring(0, 100) + "...",
  })
  return { success: true, messageId: "dev-" + Date.now() }
}
```

**Option 3: Use ngrok for Webhook Testing**

- Run local Resend webhook handler
- Use ngrok to expose to internet
- Configure webhook in Resend dashboard

### Testing Features

**1. Valid Submission:**

```bash
# Fill form in browser
# Wait 3+ seconds
# Click submit
# ✓ See success message
# ✓ Email arrives
# ✓ Submission in Supabase
```

**2. Rate Limiting:**

```bash
# Submit same email 6 times
# 6th attempt: "Zu viele Anfragen" error
# HTTP 429 response
```

**3. Honeypot:**

```bash
# Open form in DevTools
# Run: document.querySelector('input[name="website"]').value = "http://spam.com"
# Submit form
# ✓ See generic success (to fool bots)
# ✗ Email NOT sent (check logs)
```

**4. Timing:**

```bash
# Submit form < 1 second after load
# ✗ See generic success (appears successful)
# ✗ Email NOT sent (too fast = bot)
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All required env vars set
- [ ] Resend domain verified
- [ ] Recipient emails created/verified
- [ ] Test submission works end-to-end
- [ ] Verify email arrives in production email account
- [ ] Check rate limiting (if multi-instance, add Redis)
- [ ] Monitor logs for errors

### Deploying to Vercel

1. Connect your repo to Vercel
2. Go to Project Settings → Environment Variables
3. Add all required vars from `.env.local`
4. Deploy

**Verify:**

```bash
# Check logs
vercel logs

# Test form on production URL
# Submit and verify email
```

### Deploying to Netlify

1. Connect your repo to Netlify
2. Go to Site settings → Build & deploy → Environment
3. Add vars from `.env.local`
4. Redeploy

### Deploying with Docker

**Dockerfile (example):**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

**docker-compose.yml:**

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      CONTACT_EMAIL_PHYSIOTHERAPY: ${CONTACT_EMAIL_PHYSIOTHERAPY}
      CONTACT_EMAIL_PHYSIOKONZEPT: ${CONTACT_EMAIL_PHYSIOKONZEPT}
      CONTACT_FROM_EMAIL: ${CONTACT_FROM_EMAIL}
      RESEND_API_KEY: ${RESEND_API_KEY}
      CONTACT_ALLOWED_ORIGINS: ${CONTACT_ALLOWED_ORIGINS}
```

## Monitoring in Production

### Logging

Check application logs for issues:

```bash
# Vercel
vercel logs --tail

# Docker/self-hosted
docker logs -f container_name
```

Look for:
- `[API /contact]` entries
- Any `error` level logs
- Repeated `warn` patterns (honeypot, rate limit)

### Submissions Dashboard

Access submissions in Supabase:

1. Log in to Supabase dashboard
2. Select your project
3. Go to `contact_submissions` table
4. View/filter submissions
5. Mark status as `read` or `archived`

### Email Delivery

Check Resend dashboard for delivery status:

1. Log in to Resend
2. Go to Emails section
3. View delivery status for each email
4. Check bounce/spam folders if not delivered

## Troubleshooting

### Problem: Form submits but no email received

**Checklist:**

1. Check `RESEND_API_KEY` is set and valid
   ```bash
   echo $RESEND_API_KEY  # Should show re_xxx...
   ```

2. Check email in Supabase was inserted
   - Supabase → contact_submissions table
   - Should have new row

3. Check Resend dashboard
   - Go to Emails section
   - Should show sent email
   - Check delivery status (bounced? spam?)

4. Check logs for mail errors
   - `[API /contact] Email send failed`
   - Logs should show Resend error

5. Verify domain (if production)
   - Resend → Domains → Verify your domain
   - Email from unverified domain may be rejected

**Solution:**

```bash
# Re-verify API key
# Get new one from Resend if expired
# Update .env.local and redeploy

# Or use test email addresses
CONTACT_EMAIL_PHYSIOTHERAPY=your-actual-email@gmail.com
```

### Problem: Rate limit too strict

**Increase limits** in `src/lib/contact/contact-rate-limit.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  perEmail: {
    maxRequests: 10,  // Increase from 5
    windowMs: 60 * 60 * 1000,
  },
  // ...
}
```

### Problem: CORS error / Origin rejected

**Add domain to allowed origins:**

```bash
# Current
CONTACT_ALLOWED_ORIGINS=localhost

# Updated
CONTACT_ALLOWED_ORIGINS=localhost,example.com,www.example.com
```

Restart dev server after updating.

### Problem: No submissions stored in database

1. Verify Supabase credentials in `.env.local`
2. Check Supabase project is accessible
3. Run migration:
   - Supabase → SQL Editor
   - Paste `src/lib/supabase/migrations-contact.sql`
   - Run

### Problem: Honeypot/Rate-limit working but returning error

**This is expected!** The form should:

1. Show generic success message (don't reveal detection)
2. Not send email (silently reject)
3. Log details for admin review

Check logs to confirm detection worked:

```bash
# Look for:
# [API /contact] { level: "warn", message: "Honeypot triggered", ... }
```

## Advanced Configuration

### Multi-Instance Deployment (Redis Rate Limiting)

For multiple server instances, use Redis instead of in-memory store:

```bash
# Add Redis endpoint
RATE_LIMIT_BACKEND_URL=redis://redis.internal:6379
RATE_LIMIT_TOKEN=your_optional_token
```

Implement in `src/lib/contact/contact-rate-limit.ts`:

```typescript
// Pseudo-code
const store = process.env.RATE_LIMIT_BACKEND_URL
  ? new RedisRateLimitStore(process.env.RATE_LIMIT_BACKEND_URL)
  : new InMemoryRateLimitStore()
```

### Custom Mail Provider

To use a different mail provider (SMTP, SendGrid, etc):

1. Create new provider class in `src/lib/contact/contact-mailer.ts`:

```typescript
class SMTPMailProvider implements MailProvider {
  async send(options: MailOptions): Promise<MailResult> {
    // SMTP implementation
  }
}
```

2. Update `getMailProvider()`:

```typescript
export function getMailProvider(): MailProvider {
  if (process.env.CONTACT_MAIL_PROVIDER === "smtp") {
    return new SMTPMailProvider()
  }
  return new ResendMailProvider()
}
```

### Slack Notifications

Add Slack webhook for new submissions:

```typescript
// In src/app/api/contact/route.ts after successful submission
if (process.env.SLACK_WEBHOOK_URL) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: "POST",
    body: JSON.stringify({
      text: `New contact: ${data.name} (${data.brand})`,
    }),
  })
}
```

## Support

For issues or questions:

1. Check this guide first
2. Review the full documentation: `docs/CONTACT_FORM_IMPLEMENTATION.md`
3. Check server logs for errors
4. Check Supabase & Resend dashboards
5. Review test cases in `src/app/api/contact/__tests__/`

## References

- 📧 [Resend Docs](https://resend.com/docs)
- 🔒 [Security Best Practices](https://docs.form.dev/)
- 🗄️ [Supabase](https://supabase.com/docs)
- 🚀 [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
