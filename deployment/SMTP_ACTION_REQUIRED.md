# Brevo SMTP Setup — Email Verification

Without SMTP, users cannot receive verification emails and cannot register.
Brevo gives you 300 free emails per day — enough for a university platform.

---

## Step 1 — Create a Brevo account

1. Go to **https://www.brevo.com**
2. Click **Sign up for free**
3. Use your real email: `ivanknyaze@gmail.com`
4. Confirm your email

---

## Step 2 — Get your SMTP credentials

1. After login, click your account name (top right) → **SMTP & API**
   (or go to **Transactional** → **Email** → **Settings** → **SMTP & API**)
2. You will see:
   - **SMTP Server:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Login:** your email address
   - **Password / SMTP key:** click **Generate a new SMTP key** if empty
3. Copy the SMTP key (it is a long string like `xsmtpsib-abc123...`)

---

## Step 3 — Verify your sender email

1. In Brevo, go to **Senders & IPs** → **Senders**
2. Add a sender:
   - Name: `Alexandria University Platform`
   - Email: `ivanknyaze@gmail.com` (or another email you control)
3. Brevo will send a verification email — click the link

---

## Step 4 — Add credentials to Render

Go to Render → `alexandria-backend` → **Environment** and set:

```
SMTP_HOST     = smtp-relay.brevo.com
SMTP_PORT     = 587
SMTP_SECURE   = false
SMTP_USER     = ivanknyaze@gmail.com
SMTP_PASS     = (your Brevo SMTP key — the long string)
EMAIL_FROM    = ivanknyaze@gmail.com
EMAIL_FROM_NAME = Alexandria University Platform
```

Click **Save Changes** — Render will redeploy automatically.

---

## What happens if SMTP is not configured?

The backend will start without SMTP but email sending will fail silently.
Users will see "Check your email" but no email will arrive.
Set up SMTP before you invite any real users.

---

## Testing email

After setup, register a test account on your deployed frontend.
You should receive a verification email within 1–2 minutes.
Check spam if it doesn't arrive.
