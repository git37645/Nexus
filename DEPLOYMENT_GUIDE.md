# Nexus — Deployment Guide

This guide explains exactly how to make your Nexus website available on the internet so other people can open it from anywhere.

---

## Part 1 — What is localhost?

When you run the project on your computer and open `http://localhost:5173`, that address **only works on your computer**. The word "localhost" means "this machine". Nobody else can type that address in their browser and reach your site.

To let other people use your site, you need to put the code on a server that is always on and connected to the internet with a public address.

---

## Part 2 — What public deployment means

To make Nexus public you need three things:

| What | Why | Where |
|------|-----|--------|
| **Frontend hosting** | Serve the React app to browsers | Vercel (free) |
| **Backend hosting** | Run the Express API | Render (free tier) |
| **Public database** | Store all data | Neon (free, recommended) |

You also need:
- **Environment variables** — secret settings like database password, JWT secret, SMTP password
- **HTTPS** — both Vercel and Render give you HTTPS automatically for free

After deployment you will have two public URLs, for example:
- Frontend: `https://nexus-app.vercel.app`
- Backend: `https://nexus-api.onrender.com`

---

## Part 3 — Deploy the database (Neon — recommended)

### Step 1 — Create a free Neon account

1. Go to **https://neon.tech** and sign up for free (GitHub login works)
2. Click **Create project**
3. Name it `nexus` (or anything you like)
4. Choose region closest to you (e.g. `eu-central-1` for Europe)
5. Click **Create project**

### Step 2 — Copy your DATABASE_URL

After the project is created, Neon shows you a connection string. It looks like:

```
postgresql://nexus_owner:AbCdEfGhIjKl@ep-cool-name-123456.eu-central-1.aws.neon.tech/nexus?sslmode=require
```

**Copy this string.** You will paste it into your backend hosting environment variables in Part 4.

> **Neon tip:** The connection string is shown in Neon dashboard → your project → "Connection Details". Choose "Connection string" mode and copy the full string.

### Supabase alternative

If you prefer Supabase:
1. Go to **https://supabase.com** → New project
2. Go to Project Settings → Database → Connection string (URI)
3. Replace `[YOUR-PASSWORD]` with your project password

---

## Part 4 — Deploy the backend (Render)

### Step 1 — Push your code to GitHub

If you haven't done this yet:
1. Go to **https://github.com** → New repository → name it `nexus-backend` (or `nexus`)
2. In your project folder, open a terminal and run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
   git push -u origin main
   ```

> Make sure `.env` files are NOT uploaded. The `.gitignore` in this project already prevents that.

### Step 2 — Create a Render account

1. Go to **https://render.com** and sign up for free (GitHub login works)
2. Click **New** → **Web Service**
3. Connect your GitHub account and select your repository

### Step 3 — Configure the Render service

Fill in these exact settings:

| Setting | Value |
|---------|-------|
| **Name** | `nexus-backend` (or any name) |
| **Region** | Closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | Free |

### Step 4 — Add environment variables on Render

In the Render service page, go to **Environment** tab. Add these variables:

```
NODE_ENV=production
PORT=4000
DATABASE_URL=<paste your Neon connection string here>
JWT_ACCESS_SECRET=<generate a random 64-byte hex — see below>
JWT_REFRESH_SECRET=<generate a DIFFERENT random 64-byte hex>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=<your Vercel URL — add this after Step 5>
APP_URL=<your Render URL, e.g. https://nexus-backend.onrender.com>
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your Brevo SMTP login>
SMTP_PASS=<your Brevo SMTP password>
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Nexus University Platform
STORAGE_PATH=./storage
MAX_FILE_SIZE_MB=25
LOGIN_ATTEMPT_LIMIT=5
LOGIN_LOCKOUT_MINUTES=15
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
TOTP_ISSUER=Nexus University
ADMIN_EMAIL=ivanknyaze@gmail.com
ADMIN_USERNAME=ivan_admin
```

**How to generate JWT secrets** (run this in any terminal):
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run it twice — use a different value for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

### Step 5 — Deploy and note your backend URL

Click **Deploy**. Render will install dependencies, build the code, and start the server.

After deployment, your backend URL will be something like:
```
https://nexus-backend.onrender.com
```

Test it: open `https://nexus-backend.onrender.com/api/health` in your browser. You should see:
```json
{"status":"ok","timestamp":"...","env":"production"}
```

> **Free tier note:** Render's free tier spins down after 15 minutes of inactivity. The first request after sleep takes 30–60 seconds. This is normal for free tier.

---

## Part 5 — Deploy the frontend (Vercel)

### Step 1 — Create a Vercel account

1. Go to **https://vercel.com** and sign up for free (GitHub login works)
2. Click **Add New** → **Project**
3. Connect GitHub and select your repository

### Step 2 — Configure the Vercel project

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 3 — Add environment variables on Vercel

In the Vercel project settings → **Environment Variables**, add:

```
VITE_API_URL=https://nexus-backend.onrender.com
VITE_DEFAULT_LANGUAGE=uk
```

Replace `https://nexus-backend.onrender.com` with your actual Render URL from Part 4.

### Step 4 — Deploy

Click **Deploy**. After deployment your frontend URL will be something like:
```
https://nexus-app.vercel.app
```

---

## Part 6 — Connect frontend and backend

After both are deployed, you need to make them know about each other.

### Tell the backend where the frontend is

Go to Render → your backend service → **Environment** tab.

Find `FRONTEND_URL` and update it to your actual Vercel URL:
```
FRONTEND_URL=https://nexus-app.vercel.app
```

Click **Save** — Render will automatically redeploy with the updated CORS setting.

### Tell the frontend where the backend is

You already did this in Part 5 Step 3 by setting `VITE_API_URL`. If you need to update it later, go to Vercel → your project → **Settings** → **Environment Variables**.

### Why this matters

- The backend uses `FRONTEND_URL` to configure CORS. If the frontend URL is wrong, the browser will block all API calls with a "CORS error".
- The frontend uses `VITE_API_URL` to know where to send API requests. If this is wrong, all API calls will fail.

---

## Part 7 — Run database migrations

After the backend is deployed and the database URL is set, you need to create the database tables.

### Option A — Use Render Shell (recommended)

In Render → your backend service → **Shell** tab, run:
```
npx prisma db push
```

This creates all tables from your Prisma schema.

### Option B — If you have migration files

If you later create proper migration files with `npx prisma migrate dev`, use this instead:
```
npx prisma migrate deploy
```

> **Important:** Run database setup BEFORE creating the admin account.

---

## Part 8 — Create the first admin account

After the database is set up, you need to create the superadmin account for `ivanknyaze@gmail.com`.

### In the Render Shell, run:

```
NODE_ENV=production tsx prisma/seed.ts
```

Or if tsx is not available in the shell:
```
node -e "
const { execSync } = require('child_process');
execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
"
```

The seed script will print a setup link to the Render logs, like:
```
══════════════════════════════════════════════════════════
  ADMIN SETUP LINK (valid for 72 hours)
  Email:    ivanknyaze@gmail.com
  Username: ivan_admin
  Use this link to set/reset your admin password:
  https://nexus-app.vercel.app/setup-admin?token=abc123...
══════════════════════════════════════════════════════════
```

Open that link in your browser, set a strong password, and your admin account is ready.

> **There is no admin/admin password.** The admin creates their own password through the setup link. This is secure and production-safe.

### Re-running seed

You can safely run the seed again at any time to get a new setup link (e.g., if you need to reset the admin password). The seed does not duplicate data.

---

## Part 9 — Test your public website

Work through this checklist after deployment:

- [ ] Open your Vercel URL — does the login page load?
- [ ] Click "Register" — does the registration form work?
- [ ] Register a new account — do you receive a verification email?
- [ ] Click the verification link in the email — does it say "Email verified"?
- [ ] Log in with your new account — does it work?
- [ ] Create a post in the feed — does it appear?
- [ ] Send a message — does it work?
- [ ] Open Courses page — does it load?
- [ ] Open `https://nexus-backend.onrender.com/api/health` — does it return `{"status":"ok"}`?
- [ ] Log in as admin (`ivanknyaze@gmail.com`) — does the Admin Panel link appear in the sidebar?
- [ ] Switch the language to Slovak — does the UI change?
- [ ] Switch the language to English — does the UI change?

---

## Part 10 — Common errors and fixes

### CORS error in browser console

**Symptom:** `Access to XMLHttpRequest from origin 'https://nexus-app.vercel.app' has been blocked by CORS policy`

**Fix:** Go to Render → Environment → update `FRONTEND_URL` to exactly match your Vercel URL (no trailing slash). Redeploy.

---

### DATABASE_URL error

**Symptom:** Backend logs show `Database connection failed` or `PrismaClientInitializationError`

**Fix:**
1. Check that `DATABASE_URL` is set in Render environment variables
2. Make sure the URL includes `?sslmode=require` at the end (required by Neon)
3. Check that the database user and password are correct

---

### Prisma migration error

**Symptom:** `Error: P3009` or tables don't exist

**Fix:** In the Render Shell, run:
```
npx prisma db push
```

---

### Frontend still calling localhost

**Symptom:** All API calls fail; browser network tab shows requests going to `localhost:4000`

**Fix:** In Vercel → Settings → Environment Variables, make sure `VITE_API_URL` is set to your Render URL. Then go to Deployments → **Redeploy** (environment variable changes require a new build).

---

### Backend port error

**Symptom:** Render logs show `Error: listen EACCES: permission denied`

**Fix:** This usually means `PORT` is hardcoded somewhere. The backend already reads `process.env.PORT` automatically — do not set `PORT` manually in Render environment variables (Render provides it automatically).

Actually, remove `PORT=4000` from your Render environment variables. Render sets `PORT` automatically.

---

### Email not sending

**Symptom:** Users don't receive verification emails; backend logs show SMTP errors

**Fix options:**
1. **Use Brevo (recommended free option):**
   - Sign up at https://www.brevo.com
   - Go to Transactional → SMTP & API
   - Copy SMTP settings and add them to Render environment variables
2. **Verify your sender domain** in Brevo or Mailjet to avoid spam filters
3. **Check spam folder** — first emails often land there

> In development, verification links are printed to the server console instead of sent by email. This is intentional for easy local testing.

---

### Vercel build failed

**Symptom:** Vercel deployment shows a build error

**Common causes:**
1. **TypeScript errors** — run `npm run build` locally in the `frontend` folder and fix errors before pushing
2. **Wrong root directory** — make sure you set Root Directory to `frontend` in Vercel settings
3. **Missing environment variable** — `VITE_API_URL` must be set before building

---

### Render/Railway build failed

**Symptom:** Render shows a build error in logs

**Common causes:**
1. **Missing DATABASE_URL** — must be set before the build (Prisma generate needs it)
2. **Wrong root directory** — must be set to `backend`
3. **Build command typo** — use exactly: `npm install && npx prisma generate && npm run build`

---

### WebSocket / real-time not working

**Symptom:** Messages appear only after page refresh

**Cause:** Render free tier supports WebSockets. If you're on a paid plan or different provider, make sure WebSockets are enabled.

---

### Files uploaded locally disappear after redeploy

**Symptom:** Uploaded profile pictures and post images disappear

**Cause:** Render's file system is not persistent. Files saved to `./storage` are deleted on each redeploy.

**Fix:** For production, use S3-compatible storage (AWS S3, Cloudflare R2, or Backblaze B2). Add the S3 environment variables from `backend/.env.example` and implement the S3 upload logic. This is not critical for first launch but important before heavy use.

---

## Quick Reference

### Frontend (Vercel)

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| `VITE_API_URL` | `https://your-backend.onrender.com` |
| `VITE_DEFAULT_LANGUAGE` | `uk` |

### Backend (Render)

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npm run start` |
| Required env vars | See `backend/.env.example` |

### Database

After backend deploys, run in Render Shell:
```
npx prisma db push
```

Then seed:
```
npm run db:seed
```

Check Render logs for the admin setup link.
