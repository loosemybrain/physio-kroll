# Contact Form Implementation Guide

## Overview

This document describes the production-ready, security-hardened contact form implementation for the Physiotherapy website. The form supports two brands (Physiotherapy and Physio-Konzept) with brand-specific email recipients.

**Key Features:**
- ✅ Server-side email delivery (no client-side mail sending)
- ✅ Multi-level rate limiting (email + IP + burst)
- ✅ Honeypot spam detection
- ✅ Form timing checks (anti-bot)
- ✅ Full Zod validation (client + server)
- ✅ CSRF origin/referer checks
- ✅ Privacy-compliant logging (no excess PII)
- ✅ Brand-aware routing with configurable recipients
- ✅ Resend mail provider integration
- ✅ Comprehensive error handling

## Architecture

### Client Side (Frontend)

**File:** `src/components/blocks/contact-form-block.tsx`

The form component:
1. Renders UI with floating-label input fields
2. Captures `formStartedAt` timestamp on mount
3. Includes hidden honeypot field (`website`)
4. Validates fields client-side with Zod (for UX only)
5. Submits to `/api/contact` endpoint
6. Shows success/error states based on server response

**Important:** Client-side validation is for UX only. Server validation is authoritative.

### Server Side (Backend)

**File:** `src/app/api/contact/route.ts`

The POST handler performs:

1. **Pre-validation Checks**
   - Verify POST method
   - Check Content-Type is JSON
   - CSRF: Origin/Referer validation
   - Payload size limit (50KB)

2. **Payload Parsing**
   - Parse JSON safely
   - Validate with Zod schema

3. **Anti-Spam Checks**
   - Honeypot field check
   - Submission timing check (>2 seconds minimum)

4. **Rate Limiting** (3-tier)
   - Per-email + brand (5 requests per 60 minutes)
   - Per-IP general (20 requests per 15 minutes)
   - Per-IP burst (2 requests per 60 seconds)

5. **Brand Validation**
   - Ensure brand is known
   - Get recipient email for brand

6. **Database Storage**
   - Insert into `contact_submissions` table
   - Store minimal metadata (no full IP, truncated user-agent)

7. **Email Sending**
   - Format plaintext + HTML email
   - Send via Resend API
   - Handle mail provider errors gracefully

8. **Logging**
   - Log submission outcome
   - Mask sensitive data (partial email, hashed IP)
   - Avoid logging full message content for privacy

## Security Implementation

### 1. Input Validation

**Location:** `src/lib/contact/contact-schema.ts`

Zod schema enforces:
- Name: 2-200 characters, sanitized
- Email: Valid RFC 5322 format, max 255 chars
- Phone: Optional, alphanumeric + symbols only
- Subject: Optional, max 200 chars, sanitized
- Message: 10-3000 characters, sanitized
- Privacy consent: Required when `requireConsent = true`

**Sanitization Function:**
- Removes control characters (0x00-0x1F, 0x7F)
- Prevents CRLF header injection patterns
- Trims whitespace

### 2. Honeypot

**Location:** `src/lib/contact/contact-honeypot.ts`

- Hidden field named `website` (believable to bots)
- Rendered with:
  - `tabIndex={-1}` (skip in keyboard navigation)
  - `autoComplete="off"` (no autofill)
  - `aria-hidden="true"` (hidden from screen readers)
  - `display: none; visibility: hidden` (CSS hidden)
  - Absolute positioning off-screen (further security)
- If field is filled → treat as bot, return generic success

### 3. Timing Check

**Location:** `src/lib/contact/contact-honeypot.ts`

- Form renders with timestamp: `Date.now()`
- Submit must be ≥2000ms later
- Bots typically submit within milliseconds
- If too fast → return generic success without processing

### 4. Rate Limiting

**Location:** `src/lib/contact/contact-rate-limit.ts`

**In-Memory Store (Development):**
- Simple local store suitable for single-instance deployments
- Automatic cleanup every 15 minutes

**Production Consideration:**
- For multi-instance deployments, use Redis or Upstash
- Adapter structure allows easy swap

**Limits:**
- Per-email + brand: 5 requests / 60 minutes
- Per-IP: 20 requests / 15 minutes (general)
- Per-IP: 2 requests / 60 seconds (burst prevention)
- Returns HTTP 429 when limit exceeded
- Includes `Retry-After` header

### 5. CSRF Protection

**Location:** `src/app/api/contact/route.ts` (validateOrigin function)

- Check `Origin` header against `CONTACT_ALLOWED_ORIGINS`
- Fallback to `Referer` header
- Only POST method allowed
- Content-Type must be `application/json`
- No CORS headers returned (same-origin forms only)

### 6. Brand Handling

**Location:** `src/lib/contact/contact-brand.ts`

- Brand from pathname (client-side): `brandFromPath()`
- Brand validated server-side against allowed enum
- Brand determines recipient email:
  - `CONTACT_EMAIL_PHYSIOTHERAPY`
  - `CONTACT_EMAIL_PHYSIOKONZEPT`
- If no recipient configured → return 500 (don't silently drop)

### 7. Email Delivery

**Location:** `src/lib/contact/contact-mailer.ts`

**Provider:** Resend (configurable)

**Email Format:**
- Plaintext version (fallback, required for accessibility)
- HTML version (styled, readable)
- Subject: `[Kontaktformular] <user-subject>` or `[Kontaktformular] Neue Anfrage`
- From: `CONTACT_FROM_EMAIL`
- Reply-To: User's email address

**Error Handling:**
- If mail send fails, submission still stored in DB
- Admin can see in Supabase inbox
- Error logged but generic response returned
- Does not reveal failure to client

## Database Schema

**Table:** `public.contact_submissions`

```sql
- id (uuid, primary key)
- brand (text, enum: 'physiotherapy', 'physio-konzept')
- page_slug (text)
- block_id (uuid, optional)
- name (text, required)
- email (text, required)
- phone (text, optional)
- message (text, required)
- subject (text, optional)
- consent (boolean)
- created_at (timestamptz, auto)
- status (enum: 'new', 'read', 'archived')
- meta (jsonb: {userAgent, locale, formStartedAt})
```

**Indices:**
- created_at DESC
- brand
- page_slug
- status

**Row-Level Security (RLS):**
- Anon users: INSERT only (form submissions)
- Authenticated users: Full access (admin inbox)

## Configuration

### Environment Variables

**Required:**

```bash
CONTACT_EMAIL_PHYSIOTHERAPY=contact@physiotherapy.example.com
CONTACT_EMAIL_PHYSIOKONZEPT=contact@physio-konzept.example.com
CONTACT_FROM_EMAIL=noreply@example.com
RESEND_API_KEY=re_xxx...
CONTACT_ALLOWED_ORIGINS=localhost,example.com,www.example.com
```

**Optional:**

```bash
CONTACT_MAIL_PROVIDER=resend  # Default: resend
CONTACT_FALLBACK_EMAIL=...    # If brand cannot be determined
```

### Local Development

1. Copy `.env.example` to `.env.local`
2. Set `CONTACT_EMAIL_PHYSIOTHERAPY` and `CONTACT_EMAIL_PHYSIOKONZEPT` to test emails
3. Get a free API key from [Resend](https://resend.com)
4. Set `RESEND_API_KEY`
5. Set `CONTACT_ALLOWED_ORIGINS=localhost`

### Production Deployment

1. Set all environment variables in your deployment platform (Vercel, Netlify, Docker, etc.)
2. Use **real email addresses** for brand recipients
3. Use **production Resend API key** (not development)
4. Set `CONTACT_ALLOWED_ORIGINS` to your production domain(s)
5. Consider adding Redis for rate limiting if multi-instance
6. Monitor logs for submission patterns

## Testing

### Manual Testing

1. **Valid Submission:**
   - Fill form properly
   - Wait >2 seconds
   - Submit
   - Should see "Nachricht erfolgreich gesendet"
   - Email should arrive in inbox

2. **Honeypot Test:**
   - Inspect form HTML
   - Set `website` field value
   - Submit
   - Should still show success (generic response to fool bots)
   - Email NOT sent (check logs)

3. **Fast Submit Test:**
   - Open form
   - Wait 1 second
   - Submit
   - Should see generic success (no visible rejection)
   - Email NOT sent (check logs)

4. **Rate Limit Test:**
   - Submit 5 valid forms within 60 minutes
   - 6th attempt should see "Zu viele Anfragen"
   - Should receive HTTP 429

### Automated Testing

See `src/app/api/contact/__tests__/route.test.ts` (if created)

## Monitoring & Debugging

### Logs

Server logs in `/api/contact` handler show:

```
[API /contact] { timestamp, level, message, context }
```

**Log Levels:**
- `info`: Successful submissions
- `warn`: Honeypot/rate-limit/origin rejected
- `error`: Database/mail/validation errors

**Example:**
```json
{
  "timestamp": "2025-03-20T10:30:00Z",
  "level": "info",
  "message": "Submission successful",
  "requestId": "uuid",
  "submissionId": "uuid",
  "email": "u***@example.com",
  "brand": "physio-konzept",
  "durationMs": 245,
  "emailSent": true
}
```

### Admin Inbox

Access submissions in Supabase:
1. Log in to Supabase dashboard
2. Go to `contact_submissions` table
3. Filter by brand, date, status
4. Mark as `read` or `archived`

### Common Issues

**Problem:** Form submits but email not received

- Check `RESEND_API_KEY` is set and valid
- Check recipient emails in env vars
- Check logs for "Email send failed"
- Verify recipient email domain is verified in Resend

**Problem:** Rate limit too strict

- Adjust limits in `src/lib/contact/contact-rate-limit.ts`
- `RATE_LIMIT_CONFIGS.perEmail`, `perIP`, `perIPBurst`

**Problem:** Submissions not storing in DB

- Verify Supabase credentials in env vars
- Check RLS policies (should allow anon INSERT)
- Check database migration ran (`migrations-contact.sql`)

**Problem:** CSRF error "Request rejected"

- Add your domain to `CONTACT_ALLOWED_ORIGINS`
- Include protocol if testing locally: `http://localhost:3000`
- Check Origin/Referer headers in request

## Future Enhancements

1. **Redis Rate Limiting**
   - Replace in-memory store with Upstash or Redis
   - Better for multi-instance deployments

2. **Email Templates**
   - Move to separate template files (MJML or similar)
   - Brand-specific templates

3. **Webhook Events**
   - Send submission events to external systems
   - Slack notifications, etc.

4. **Admin Notifications**
   - Send alert email to admin on high submission volume
   - Or low submission volume (potential issues)

5. **Advanced Spam Detection**
   - Integrate Akismet or similar
   - ML-based spam filtering

6. **Analytics**
   - Track submissions by source/campaign
   - Performance metrics

## Support

For issues:
1. Check logs in browser console (frontend validation)
2. Check server logs (backend processing)
3. Check Supabase dashboard (database storage)
4. Check Resend dashboard (email delivery)
5. Review this documentation

## References

- [Resend Email API](https://resend.com/docs)
- [Zod Validation](https://zod.dev)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
