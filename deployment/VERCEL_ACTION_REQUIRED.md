# Vercel Frontend Deployment

Vercel hosts your React frontend and serves it globally over HTTPS.

**Before starting:** complete `RENDER_ACTION_REQUIRED.md` and have your Render backend URL ready.

---

## Option A — Vercel CLI (from your computer)

### 1 — Check if you are already logged in

Open PowerShell and run:
```powershell
vercel whoami
```

If it shows your username, you are logged in — skip to step 3.
If it says "not logged in", run:
```powershell
vercel login
```
Follow the browser prompt to authenticate.

### 2 — Deploy

```powershell
cd "C:\Users\Іван\OneDrive\Рабочий стол\Alexandria_project\frontend"
vercel --prod --yes
```

If asked to link to an existing project, say **N** and create a new one named `alexandria-frontend`.

### 3 — Set environment variables

Replace `YOUR_RENDER_URL` with your actual Render URL (e.g. `https://alexandria-backend.onrender.com`):

```powershell
vercel env add VITE_API_URL production
```
Type (or paste): `https://alexandria-backend.onrender.com`

```powershell
vercel env add VITE_DEFAULT_LANGUAGE production
```
Type: `uk`

### 4 — Redeploy with the env vars applied

```powershell
vercel --prod
```

### 5 — Note your frontend URL

Vercel prints your URL like:
```
https://alexandria-frontend.vercel.app
```

Copy it — you need it for `CONNECT_URLS_AFTER_DEPLOYMENT.md`.

---

## Option B — Vercel Dashboard (browser)

If the CLI doesn't work:

1. Go to **https://vercel.com** and log in / sign up
2. Click **Add New Project**
3. Click **Import Git Repository** and choose your `Alexandria_project` repo
4. Configure:

   | Field | Value |
   |-------|-------|
   | Framework Preset | Vite |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

5. Expand **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `VITE_API_URL` | `https://alexandria-backend.onrender.com` |
   | `VITE_DEFAULT_LANGUAGE` | `uk` |

6. Click **Deploy**

7. After deploy, your URL appears at the top — like `https://alexandria-frontend.vercel.app`

---

## After getting your Vercel URL

Follow `CONNECT_URLS_AFTER_DEPLOYMENT.md` to connect frontend and backend.
