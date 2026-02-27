# SMTP Email Configuration Guide

## Quick Setup for Gmail

### Step 1: Enable 2-Step Verification (if not already enabled)
1. Go to: https://myaccount.google.com/security
2. Sign in with `theclayrouteproject@gmail.com`
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the prompts to enable it

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with `theclayrouteproject@gmail.com`
3. In "Select app" dropdown, choose "Mail"
4. In "Select device" dropdown, choose your device or enter "Clay Route Website"
5. Click "Generate"
6. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

### Step 3: Update .env.local
1. Open `.env.local` in the project root
2. Find the line: `SMTP_PASS=your-app-password-here`
3. Replace `your-app-password-here` with your App Password
4. Remove any spaces from the password
5. Save the file

Example:
```bash
SMTP_PASS=abcdabcdabcdabcd
```

### Step 4: Restart Dev Server
```bash
# Stop current dev server (Ctrl+C)
npm run dev
```

### Testing
Once configured, visit the contact page and submit a test message. It should send directly to `theclayrouteproject@gmail.com` without opening your mail client.

## Alternative SMTP Providers

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

## Troubleshooting

### "Authentication failed"
- Double-check App Password is correct (no spaces)
- Ensure 2-Step Verification is enabled
- Regenerate App Password if needed

### Port 587 blocked
Try port 465 (SSL):
```bash
SMTP_PORT=465
```

### Still not working
Check Gmail security settings:
https://myaccount.google.com/lesssecureapps
(Though App Passwords should work without changing this)
