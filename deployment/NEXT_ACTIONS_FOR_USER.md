# What You Need to Do to Go Live

Everything that can be automated has been done. The steps below require your accounts and browser.
Do them in order — each step depends on the previous one.

---

## Step 1 — Push your code to GitHub (5 minutes)

**Why:** Render and Vercel deploy from GitHub. Your code must be there first.

### 1a — Create a GitHub repository

1. Go to **https://github.com/new**
2. Repository name: `nexus`
3. Set it to **Private** (recommended) or Public
4. Do NOT check "Add README" — your project already has one
5. Click **Create repository**

GitHub will show you commands. Ignore them — use these instead:

### 1b — Open PowerShell in your project folder and run:

```powershell
cd "C:\Users\Іван\OneDrive\Рабочий стол\Alexandria_project"
git init
git add .
git commit -m "Initial commit — Nexus university platform"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/nexus.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

**Confirm:** Open `https://github.com/YOUR_GITHUB_USERNAME/nexus` — you should see your files.

---

## Step 2 — Create a Neon database (3 minutes)

**Why:** Your website needs a real database on the internet, not your local computer.

1. Go to **https://neon.tech** and sign up (GitHub login is fastest)
2. Click **Create project**
3. Name: `nexus`
4. Region: choose closest to you (`eu-central-1` for Ukraine/Slovakia)
5. Click **Create project**
6. On the next screen, find **Connection Details**
7. Select **Connection string** (not parameters)
8. Copy the full string — it looks like:
   ```
   postgresql://nexus_owner:SomeLongPassword@ep-some-name.eu-central-1.aws.neon.tech/nexus?sslmode=require
   ```

**Save this string — you will need it in Step 3.**

---

## Step 3 — Deploy backend on Render (10 minutes)

**Why:** Your Express API must run on a server, not your laptop.

1. Go to **https://render.com** and sign up (GitHub login works)
2. Click **New +** → **Web Service**
3. Choose **Build and deploy from a Git repository**
4. Click **Connect** next to your `nexus` repository
5. Fill in these settings exactly:

   | Field | Value |
   |-------|-------|
   | Name | `nexus-backend` |
   | Region | Frankfurt (closest to Ukraine/Slovakia) |
   | Branch | `main` |
   | Root Directory | `backend` |
   | Runtime | `Node` |
   | Build Command | `npm install && npx prisma generate && npm run build` |
   | Start Command | `npm run start` |
   | Instance Type | **Free** |

6. Scroll down to **Environment Variables** and add ALL of these:

```
NODE_ENV              → production
DATABASE_URL          → (paste your Neon connection string from Step 2)
JWT_ACCESS_SECRET     → 4b2d3c85b49a89882ed23d032e0cf93e5060d9473d760714b15f90f1dd5f2440e157d5b169a2234bd9176e6ff63d328712480ef2fa7fda7ecfbea7e2c7657ddd
JWT_REFRESH_SECRET    → e62391611af2ace30bb555ba9eb000eb665a4820d3308caf0e8a6a4cf9de644e1b0f169ec4d8c4b00934008120d7e3582310d175db3e045050935045b8314778
JWT_ACCESS_EXPIRES_IN → 15m
JWT_REFRESH_EXPIRES_IN → 30d
FRONTEND_URL          → https://placeholder.vercel.app  (update in Step 5)
APP_URL               → https://nexus-backend.onrender.com  (update after deploy)
SMTP_HOST             → smtp-relay.brevo.com  (or leave empty for now)
SMTP_PORT             → 587
SMTP_SECURE           → false
SMTP_USER             → (from Step 4 — Brevo)
SMTP_PASS             → (from Step 4 — Brevo)
EMAIL_FROM            → noreply@gmail.com  (or your email)
EMAIL_FROM_NAME       → Nexus University Platform
STORAGE_PATH          → ./storage
MAX_FILE_SIZE_MB      → 25
LOGIN_ATTEMPT_LIMIT   → 5
LOGIN_LOCKOUT_MINUTES → 15
RATE_LIMIT_WINDOW_MS  → 900000
RATE_LIMIT_MAX_REQUESTS → 100
TOTP_ISSUER           → Nexus University
ADMIN_EMAIL           → ivanknyaze@gmail.com
ADMIN_USERNAME        → ivan_admin
```

7. Click **Create Web Service**
8. Wait for the build to complete (3–5 minutes)
9. After it says **Live**, your backend URL is shown at the top, like: `https://nexus-backend.onrender.com`
10. Test it: open `https://nexus-backend.onrender.com/api/health` — should show `{"status":"ok",...}`

**Save your backend URL — you need it in Step 5 and Step 6.**

---

## Step 4 — Set up email (Brevo — 5 minutes)

**Why:** Without SMTP, users can't receive verification emails and can't register.

1. Go to **https://www.brevo.com** and sign up for free
2. After login, click your account name → **SMTP & API**
3. Under **SMTP**, you will see:
   - SMTP Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Login: your email address
   - Password: shown on this page (click "Generate a new SMTP key" if empty)
4. Go back to **Render** → your `nexus-backend` service → **Environment**
5. Update these values:
   ```
   SMTP_USER → (your Brevo login email)
   SMTP_PASS → (your Brevo SMTP key)
   EMAIL_FROM → (your Brevo sender email)
   ```
6. Click **Save Changes** — Render will redeploy automatically

---

## Step 5 — Deploy frontend on Vercel (5 minutes)

**Why:** Your React app must be served from a public URL.

### Option A — Using Vercel CLI (faster)

Open PowerShell:
```powershell
cd "C:\Users\Іван\OneDrive\Рабочий стол\Alexandria_project\frontend"
vercel login
```

Follow the browser prompt to log in. Then:
```powershell
vercel --yes --prod
```

When asked:
- Set up and deploy: **Y**
- Which scope: your account
- Link to existing project: **N**
- Project name: `nexus-frontend`
- Directory: `.` (current folder)

After deploy, Vercel prints your URL like `https://nexus-frontend-xxx.vercel.app`.

Set the environment variable:
```powershell
vercel env add VITE_API_URL production
```
When prompted, enter your Render backend URL (e.g. `https://nexus-backend.onrender.com`)

```powershell
vercel env add VITE_DEFAULT_LANGUAGE production
```
Enter: `uk`

Redeploy with env vars:
```powershell
vercel --prod
```

### Option B — Vercel dashboard (if CLI fails)

1. Go to **https://vercel.com** → **Add New Project**
2. Import your `nexus` GitHub repository
3. Set these settings:

   | Field | Value |
   |-------|-------|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

4. Under **Environment Variables**, add:
   ```
   VITE_API_URL     → https://nexus-backend.onrender.com  (your actual Render URL)
   VITE_DEFAULT_LANGUAGE → uk
   ```
5. Click **Deploy**
6. After deploy, your URL is shown like `https://nexus-frontend-xxx.vercel.app`

**Save your frontend URL — you need it in Step 6.**

---

## Step 6 — Connect frontend and backend (2 minutes)

**Why:** The backend must know the frontend URL for CORS to work.

1. Go to **Render** → `nexus-backend` → **Environment**
2. Update:
   ```
   FRONTEND_URL → https://your-actual-vercel-url.vercel.app
   APP_URL      → https://nexus-backend.onrender.com
   ```
3. Click **Save Changes** — Render redeploys automatically

---

## Step 7 — Set up the database (3 minutes)

**Why:** The database is empty. You need to create all tables.

1. Go to **Render** → `nexus-backend` → **Shell** tab
2. Run:
   ```
   npx prisma db push
   ```
   Wait for: `All migrations have been successfully applied.` or `Your database is now in sync`

3. Run:
   ```
   npm run db:seed
   ```
   Check the output — you will see a block like:
   ```
   ══════════════════════════════════════════════════════════
     ADMIN SETUP LINK (valid for 72 hours)
     Email:    ivanknyaze@gmail.com
     Username: ivan_admin
     Use this link to set/reset your admin password:
     https://your-vercel-url.vercel.app/setup-admin?token=abc123...
   ══════════════════════════════════════════════════════════
   ```

4. **Copy and open the setup link** in your browser
5. Set a strong password for your admin account
6. Done — no admin/admin was created

---

## Step 8 — Test everything (5 minutes)

Check each item:

- [ ] Open your Vercel URL → login page loads
- [ ] Register a test account → redirected to "check email"
- [ ] Check your email → verification email arrived (check spam)
- [ ] Click verification link → "Email verified" page
- [ ] Log in → see the feed
- [ ] Log in as `ivanknyaze@gmail.com` → see Admin Panel in sidebar
- [ ] Open `https://nexus-backend.onrender.com/api/health` → `{"status":"ok"}`
- [ ] Switch language to Slovak in sidebar → UI changes
- [ ] Switch language to English → UI changes

---

## Troubleshooting

**CORS error?**
→ `FRONTEND_URL` in Render is wrong. Must exactly match your Vercel URL. Redeploy backend.

**API calls fail / all white page?**
→ `VITE_API_URL` in Vercel is wrong. Must exactly match your Render URL. Redeploy frontend.

**Email not arriving?**
→ Check Render logs for SMTP errors. Verify Brevo SMTP credentials. Check spam folder.

**`prisma db push` fails?**
→ `DATABASE_URL` is wrong or missing. Check Render → Environment → DATABASE_URL.

**Setup link not working?**
→ Run `npm run db:seed` again in Render Shell. You get a new valid link each time.

---

## Summary of what was automated

Everything else has already been done automatically:
- ✅ Both builds verified (backend TypeScript + frontend Vite)
- ✅ Production environment variable templates created
- ✅ JWT secrets generated (ready to copy above)
- ✅ `frontend/vercel.json` created (SPA routing + security headers)
- ✅ `deployment/render.yaml` created (Render Blueprint)
- ✅ Admin/admin removed — secure setup-token flow in place
- ✅ Ukrainian, Slovak, English languages working
- ✅ CORS configured from `FRONTEND_URL` environment variable
- ✅ `VITE_API_URL` used in all API calls (no localhost in production)
- ✅ `.gitignore` protects `.env` files from being committed
