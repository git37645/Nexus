# Production Environment Variables Template

Copy these into the Render environment variables panel.
Replace every `REPLACE_*` value with your actual values.
Never put real values into this file — it is committed to git.

---

## Backend (Render environment variables)

```
NODE_ENV=production

# Get from Neon dashboard → Connection Details → Connection string
DATABASE_URL=REPLACE_WITH_NEON_POSTGRESQL_URL

# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — use a DIFFERENT value for each secret
JWT_ACCESS_SECRET=REPLACE_WITH_64_BYTE_HEX
JWT_REFRESH_SECRET=REPLACE_WITH_DIFFERENT_64_BYTE_HEX
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Set AFTER frontend is deployed on Vercel (e.g. https://nexus-app.vercel.app)
FRONTEND_URL=REPLACE_WITH_VERCEL_FRONTEND_URL

# Your Render service URL (shown in Render dashboard after first deploy)
APP_URL=REPLACE_WITH_RENDER_BACKEND_URL

# Brevo SMTP (free tier — 300 emails/day, no credit card)
# Sign up at https://www.brevo.com → Transactional → SMTP & API
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=REPLACE_WITH_BREVO_SMTP_LOGIN
SMTP_PASS=REPLACE_WITH_BREVO_SMTP_KEY
EMAIL_FROM=REPLACE_WITH_YOUR_SENDER_EMAIL
EMAIL_FROM_NAME=Nexus University Platform

# File storage (local disk — acceptable for first launch)
STORAGE_PATH=./storage
MAX_FILE_SIZE_MB=25

# Rate limiting (these values are fine for production)
LOGIN_ATTEMPT_LIMIT=5
LOGIN_LOCKOUT_MINUTES=15
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 2FA
TOTP_ISSUER=Nexus University

# First admin account (password is set via /setup-admin — never hardcoded)
ADMIN_EMAIL=ivanknyaze@gmail.com
ADMIN_USERNAME=ivan_admin
```

---

## Frontend (Vercel environment variables)

```
# Your Render backend URL (no trailing slash)
VITE_API_URL=REPLACE_WITH_RENDER_BACKEND_URL

# Default language
VITE_DEFAULT_LANGUAGE=uk
```

---

## Pre-generated JWT secrets (ready to copy)

These were generated specifically for your project. Copy them directly.
After copying, delete this section so secrets do not stay in this file.

```
JWT_ACCESS_SECRET=4b2d3c85b49a89882ed23d032e0cf93e5060d9473d760714b15f90f1dd5f2440e157d5b169a2234bd9176e6ff63d328712480ef2fa7fda7ecfbea7e2c7657ddd
JWT_REFRESH_SECRET=e62391611af2ace30bb555ba9eb000eb665a4820d3308caf0e8a6a4cf9de644e1b0f169ec4d8c4b00934008120d7e3582310d175db3e045050935045b8314778
```

Paste the first line as `JWT_ACCESS_SECRET` and the second as `JWT_REFRESH_SECRET` in Render.
Then delete the section above.
