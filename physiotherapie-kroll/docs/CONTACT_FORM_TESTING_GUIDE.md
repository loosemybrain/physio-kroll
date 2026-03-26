# Contact Form Testing Guide - CMS Extension

Schnelle Anleitung zum Testen der neuen CMS-basierten Empfänger-E-Mail-Konfiguration.

---

## 🚀 Quick Start (5 Minuten)

### 1. Setup Local Environment

```bash
# .env.local
CONTACT_TEST_MODE=true
CONTACT_TEST_EMAIL=your-gmail@gmail.com
CONTACT_EMAIL_PHYSIOTHERAPY=would-not-receive@example.com
CONTACT_EMAIL_PHYSIOKONZEPT=would-not-receive@example.com
CONTACT_FROM_EMAIL=noreply@example.com
RESEND_API_KEY=re_your_key
CONTACT_ALLOWED_ORIGINS=localhost,127.0.0.1
```

### 2. Start Dev Server

```bash
npm run dev
# → Visit http://localhost:3000
```

### 3. Test Form Submission

```
1. Find a page with ContactFormBlock (z.B. /kontakt)
2. Fill form completely
3. Wait 2+ seconds
4. Click Submit
5. Should see "Nachricht erfolgreich gesendet"
6. Check your-gmail@gmail.com for email with [TEST] in subject
```

---

## ✅ Test Scenarios

### Scenario 1: ENV Fallback (CMS Field Empty)

**Setup:**
```bash
CONTACT_EMAIL_PHYSIOTHERAPY=env-test@example.com
CONTACT_TEST_MODE=false
```

**CMS:**
- ContactFormBlock → Inspector
- Empfangs-E-Mail: **leave empty**

**Expected:**
- Email goes to env-test@example.com
- Logs show: `"emailSource": "envBrand"`

**Verify:**
```bash
# Server logs should show:
[API /contact] Submission successful {
  "recipientEmail": "e***@example.com",
  "emailSource": "envBrand"
}
```

### Scenario 2: CMS Override

**Setup:**
```bash
CONTACT_EMAIL_PHYSIOTHERAPY=env-email@example.com
CONTACT_TEST_MODE=false
```

**CMS:**
- ContactFormBlock → Inspector
- Empfangs-E-Mail: `custom@example.com`

**Expected:**
- Email goes to custom@example.com (not env-email)
- Logs show: `"emailSource": "cmsBlock"`
- CMS-Wert überschreibt ENV

**Verify:**
```bash
# Logs show:
"emailSource": "cmsBlock",
"recipientEmail": "c***@example.com"
```

### Scenario 3: Test Mode Active

**Setup:**
```bash
CONTACT_TEST_MODE=true
CONTACT_TEST_EMAIL=test@gmail.com
CONTACT_EMAIL_PHYSIOTHERAPY=real@example.com
```

**CMS:**
- Empfangs-E-Mail: `custom@example.com` (or empty)

**Expected:**
- Email goes to test@gmail.com (not real or custom!)
- Subject has `[TEST]` prefix
- Email body shows original recipient
- Logs show: `"testMode": true`, `"originalRecipient": "custom@example.com"`

**Verify:**
```bash
# 1. Email subject should be:
#    [TEST] [Kontaktformular] ...

# 2. Email body should have:
#    [!] TESTMODUS - KONTROLLIERTER VERSAND
#    [!] Ursprünglicher Empfänger: custom@example.com

# 3. Logs should show:
"testMode": true,
"originalRecipient": "custom@example.com"
```

### Scenario 4: Invalid CMS Email

**Setup:**
```bash
CONTACT_EMAIL_PHYSIOTHERAPY=valid@example.com
CONTACT_TEST_MODE=false
```

**CMS:**
- Empfangs-E-Mail: `invalid-email` (no @)

**Expected:**
- Inspector should show inline error
- Saving should be blocked OR fallback to ENV
- Form submission should either fail or use ENV

**Verify:**
```bash
# Inspector shows red error:
# "Invalid email format"

# If it saves anyway, server logs show:
"reason": "CMS recipient email is invalid: invalid-email",
"fallback": "using envBrand"
```

### Scenario 5: No Email Configured

**Setup:**
```bash
# Delete all email env vars
CONTACT_EMAIL_PHYSIOTHERAPY=  # empty
CONTACT_EMAIL_PHYSIOKONZEPT=   # empty
CONTACT_FALLBACK_EMAIL=        # empty
```

**CMS:**
- Empfangs-E-Mail: empty

**Expected:**
- Form submission should fail
- User sees generic error: "Nachricht konnte nicht versendet werden"
- Logs show: `"error": "No recipient email configured"`

**Verify:**
```bash
# Server logs:
[API /contact] Failed to resolve recipient email {
  "reason": "No recipient email configured"
}

# Response status: 500
```

---

## 🧪 Detailed Testing Steps

### Test 1: Inspector Field Validation

**Steps:**

1. Open Admin Panel
2. Edit a page with ContactFormBlock
3. Select the block
4. Right panel → Inspector
5. Scroll to "Kontakt / Zustellung"
6. Enter invalid email: `test@`
7. Should see red error
8. Clear field → error disappears
9. Enter valid email: `test@example.com`
10. Error gone
11. Save block

**Expected Results:**
- ✅ Invalid emails show error inline
- ✅ Valid emails accepted
- ✅ Can clear field without error
- ✅ Saved in CMS

**Verification:**
```sql
-- Check Supabase pages table
SELECT blocks FROM pages 
WHERE blocks @> '[{"type":"contactForm"}]'::jsonb
LIMIT 1;

-- Should show recipientEmail field in props
```

### Test 2: Email Resolution Priority

**Steps:**

Create 3 test blocks with different configs:

**Block A (Fallback to ENV):**
```
CMS field: (empty)
Expected: uses CONTACT_EMAIL_PHYSIOTHERAPY
```

**Block B (CMS Override):**
```
CMS field: blockb@example.com
Expected: uses blockb@example.com (not ENV)
```

**Block C (TEST MODE Override):**
```
CMS field: blockc@example.com
Expected (if TEST_MODE=true): uses CONTACT_TEST_EMAIL (not CMS)
```

**Test each:**
```bash
1. Submit form for Block A
   → Check logs: emailSource = "envBrand"
   → Check email: went to CONTACT_EMAIL_*

2. Submit form for Block B
   → Check logs: emailSource = "cmsBlock"
   → Check email: went to blockb@example.com

3. Set CONTACT_TEST_MODE=true
4. Submit form for Block C
   → Check logs: testMode = true, emailSource = "testMode"
   → Check email: went to CONTACT_TEST_EMAIL
```

### Test 3: Supabase Verification

**Steps:**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run:
```sql
SELECT 
  id,
  brand,
  email,
  created_at,
  meta ->> 'locale' as locale
FROM contact_submissions
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- ✅ New submissions appear immediately
- ✅ All form data correct
- ✅ Timestamp correct
- ✅ Brand correct

### Test 4: Full Cycle with Testmodus

**Setup for this test:**

```bash
# .env.local
CONTACT_TEST_MODE=true
CONTACT_TEST_EMAIL=qa@gmail.com
CONTACT_EMAIL_PHYSIOTHERAPY=production@example.com
CONTACT_EMAIL_PHYSIOKONZEPT=konzept@example.com
CONTACT_FROM_EMAIL=noreply@example.com
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
CONTACT_ALLOWED_ORIGINS=localhost
```

**Steps:**

1. Open Form page
2. Inspector set: Empfangs-E-Mail = (empty or any value)
3. Fill form with test data:
   - Name: Test User
   - Email: your-test@gmail.com
   - Message: This is a test submission
4. Wait 2 seconds
5. Submit

**Check Email:**
- ✅ Subject contains `[TEST]`
- ✅ Body mentions "TESTMODUS"
- ✅ Original recipient shown (production@ or konzept@)
- ✅ All form data visible

**Check Logs:**
```bash
# Terminal should show something like:
[API /contact] Submission successful {
  "testMode": true,
  "emailSource": "testMode",
  "recipientEmail": "q***@gmail.com",
  "originalRecipient": "p***@example.com"
}
```

**Check Supabase:**
```sql
SELECT * FROM contact_submissions 
ORDER BY created_at DESC LIMIT 1;
-- Should show submission, even though email went to TEST addr
```

---

## 🐛 Debugging Checklist

### Email doesn't arrive

- [ ] Is `CONTACT_TEST_EMAIL` valid? (typo?)
- [ ] Is `RESEND_API_KEY` correct?
- [ ] Check spam folder
- [ ] Check Resend dashboard for bounces
- [ ] Server logs show success?
  ```
  [API /contact] Submission successful
  emailSent: true
  ```

### CMS field shows error but shouldn't

- [ ] Is email syntactically correct?
- [ ] No spaces/newlines?
- [ ] Does it have @?
- [ ] Does it have domain?
  ```
  ✅ test@example.com
  ✅ contact.name@sub.domain.co.uk
  ❌ test@
  ❌ @example.com
  ❌ test@domain..com
  ```

### CMS field is ignored

- [ ] Server logs show which source? → check `emailSource`
- [ ] If `"envBrand"`: CMS field was ignored
  - Was it saved? (block saved successfully?)
  - Was it valid? (inspector showed error?)
  - Did you reload page after saving?
- [ ] If `"testMode"`: TEST_MODE=true overrides everything (intended)

### Inspector field doesn't appear

- [ ] Is this actually a ContactFormBlock?
- [ ] Is it in the right panel (Inspector)?
- [ ] Did you select the block?
- [ ] Is the Inspector section expanded?
- [ ] Try refresh page

---

## 📱 Vercel Testing

### Deploy to Vercel

```bash
git add .
git commit -m "feat: add cms-based recipient email configuration"
git push
# → Vercel auto-deploys
```

### Test on Vercel

1. Go to production URL
2. Find form page
3. Submit form
4. Should see success message
5. Check `CONTACT_TEST_EMAIL` inbox
6. Check Vercel logs:
   ```bash
   vercel logs
   # Should show [API /contact] entries
   ```

### Check Vercel Environment

```bash
# Verify env vars are set
vercel env ls

# Should show:
CONTACT_EMAIL_PHYSIOTHERAPY   ✓
CONTACT_EMAIL_PHYSIOKONZEPT   ✓
CONTACT_FROM_EMAIL            ✓
RESEND_API_KEY                ✓
CONTACT_ALLOWED_ORIGINS       ✓
CONTACT_TEST_MODE             ✓
CONTACT_TEST_EMAIL            ✓
```

---

## ⚠️ Before Going Live

### Production Checklist

- [ ] `CONTACT_TEST_MODE=false` (not true!)
- [ ] Real production email addresses set
- [ ] Domain verified in Resend
- [ ] All CMS email fields reviewed
- [ ] Test form submission to real address
- [ ] Check spam folder
- [ ] Verify Supabase submissions table populated
- [ ] Check server logs (no errors)

### Disable Test Mode Script

```bash
# When ready for production:
# 1. Vercel Settings → Environment Variables
# 2. Set CONTACT_TEST_MODE to "false"
# 3. Or remove CONTACT_TEST_EMAIL (empty)
# 4. Redeploy
```

---

## 🎯 Quick Reference

### Common Commands

```bash
# View recent submissions
SELECT * FROM contact_submissions 
ORDER BY created_at DESC LIMIT 5;

# View logs locally
npm run dev
# → Check terminal for [API /contact] entries

# Check env vars locally
echo $CONTACT_TEST_MODE
echo $CONTACT_TEST_EMAIL

# Force re-read env vars
# Stop dev server (Ctrl+C)
# npm run dev
```

### Email Headers to Check

```
Subject: Should start with [TEST] or [Kontaktformular]
From: Should be CONTACT_FROM_EMAIL
Reply-To: Should be form submitter's email
To: Should match resolved recipient
```

---

## 📞 Troubleshooting Reference

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| No email received | Invalid RESEND_API_KEY | Resend dashboard |
| Email goes to wrong address | CMS field wrong / TEST_MODE on | Logs + Inspector |
| CMS field shows error | Invalid email format | Check @ and domain |
| Inspector field missing | Wrong block type | Is it ContactFormBlock? |
| Logs don't show requests | Server not running | `npm run dev` |
| Email subject without [TEST] | TEST_MODE=false | Check .env |
| Test email missing [TEST] | CMS value being used | Set CMS to empty |

---

## ✅ Test Report Template

Use this when testing:

```markdown
## Test Report - Contact Form CMS Extension

**Date:** 2026-03-20
**Tester:** [Your Name]

### Environment
- [ ] Tested Locally
- [ ] Tested on Vercel
- [ ] Used TEST_MODE

### Scenarios Tested
- [ ] Scenario 1: ENV Fallback
- [ ] Scenario 2: CMS Override
- [ ] Scenario 3: Test Mode
- [ ] Scenario 4: Invalid Email
- [ ] Scenario 5: No Email Configured

### Results
- [ ] All emails received
- [ ] Subjects correct
- [ ] Bodies complete
- [ ] Logs clean
- [ ] Supabase entries populated

### Issues Found
(None if all pass)

### Verified Ready for Production
- [ ] TEST_MODE = false
- [ ] Real recipient emails set
- [ ] No error logs
- [ ] Emails delivery working
```

---

**Done with testing? Proceed to Production Deployment!** 🚀
