# Render Backend Deployment

Render hosts your Express API server. It connects to your Neon database and serves the backend.

**Before starting:** complete `NEON_ACTION_REQUIRED.md` and have your DATABASE_URL ready.

---

## Step 1 — Create a Render account

1. Go to **https://render.com**
2. Click **Get Started** → sign up with **GitHub** (easiest — it links your repos automatically)
3. Authorize Render to access your GitHub

---

## Step 2 — Create a new Web Service

1. Click **New +** → **Web Service**
2. Choose **Build and deploy from a Git repository**
3. Find and click **Connect** next to your `Alexandria_project` repository
   (If you don't see it, click **Configure account** to grant Render access to that repo)

---

## Step 3 — Configure the service

Fill in these settings exactly:

| Field | Value |
|-------|-------|
| Name | `alexandria-backend` |
| Region | `Frankfurt (EU Central)` |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npm run start` |
| Instance Type | **Free** |

---

## Step 4 — Add environment variables

Scroll down to **Environment Variables** and add ALL of these.
Click **Add Environment Variable** for each one.

```
NODE_ENV              = production
DATABASE_URL          = (paste your Neon connection string)
JWT_ACCESS_SECRET     = fe48acfd1fb7866f71a146b7e87e085ce5e4f2654530e42b36e3dd937b62ea2dc4e3eb2838edb18e7c871a7a3f94aa1ebe5d2cc7a701ba48901001516f6f7bbc
JWT_REFRESH_SECRET    = 04f6dff9e4a2b2737367dd64b85b69c85876c2431295c52ae2fbc6bb372aad3d3173e7578fba6a49c0c3b1d5453a5392d691df3871b8afd8784d42549ab914ec
JWT_ACCESS_EXPIRES_IN = 15m
JWT_REFRESH_EXPIRES_IN = 30d
FRONTEND_URL          = https://placeholder.vercel.app   ← update this in Step 7
BACKEND_URL           = https://alexandria-backend.onrender.com   ← update after deploy
SMTP_HOST             = smtp-relay.brevo.com
SMTP_PORT             = 587
SMTP_SECURE           = false
SMTP_USER             = (from SMTP_ACTION_REQUIRED.md)
SMTP_PASS             = (from SMTP_ACTION_REQUIRED.md)
EMAIL_FROM            = ivanknyaze@gmail.com
EMAIL_FROM_NAME       = Alexandria University Platform
STORAGE_PATH          = ./storage
MAX_FILE_SIZE_MB      = 25
LOGIN_ATTEMPT_LIMIT   = 5
LOGIN_LOCKOUT_MINUTES = 15
RATE_LIMIT_WINDOW_MS  = 900000
RATE_LIMIT_MAX_REQUESTS = 100
TOTP_ISSUER           = Alexandria University
ADMIN_EMAIL           = ivanknyaze@gmail.com
ADMIN_USERNAME        = ivan_admin
```

**Important:** The JWT secrets above are your personal secrets — do not share them.
You can regenerate them anytime using:
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 5 — Deploy

Click **Create Web Service**.
Render will start building. The build takes 3–5 minutes.
Watch the build logs. It should end with:
```
==> Your service is live
```

---

## Step 6 — Note your backend URL

After deploy, the URL is shown at the top of the page. It looks like:
```
https://alexandria-backend.onrender.com
```

**Copy this URL.** You will need it in:
- `VERCEL_ACTION_REQUIRED.md` — set as `VITE_API_URL`
- `CONNECT_URLS_AFTER_DEPLOYMENT.md` — connect to frontend

---

## Step 7 — Test the backend

Open in your browser:
```
https://alexandria-backend.onrender.com/api/health
```

You should see:
```json
{"status":"ok","timestamp":"...","env":"production"}
```

If you get an error, check **Render → Logs** for details.

---

## Step 8 — Set up the database (Render Shell)

1. In Render, open your `alexandria-backend` service
2. Click the **Shell** tab
3. Run:
   ```
   npx prisma db push
   ```
   Wait for: `Your database is now in sync with your Prisma schema.`

4. Then run:
   ```
   npm run db:seed
   ```
   Look in the output for the **ADMIN SETUP LINK**:
   ```
   ══════════════════════════════════════════════════════════
     ADMIN SETUP LINK (valid for 72 hours)
     Email:    ivanknyaze@gmail.com
     Username: ivan_admin
     Use this link to set/reset your admin password:
     https://your-frontend.vercel.app/setup-admin?token=abc123...
   ══════════════════════════════════════════════════════════
   ```

5. Copy and open that link in your browser to set your admin password.

---

## Step 9 — Update FRONTEND_URL (after Vercel deploy)

After you deploy the frontend (see `VERCEL_ACTION_REQUIRED.md`) and get your Vercel URL:

1. Go to Render → `alexandria-backend` → **Environment**
2. Update:
   ```
   FRONTEND_URL = https://your-actual-url.vercel.app
   BACKEND_URL  = https://alexandria-backend.onrender.com
   ```
3. Click **Save Changes** — Render redeploys automatically

**FRONTEND_URL must exactly match your Vercel URL — otherwise CORS errors will block everything.**
