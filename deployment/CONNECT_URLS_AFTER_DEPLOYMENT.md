# Connect Frontend and Backend URLs

After both services are deployed, you must tell each service about the other's URL.
This is required for CORS (cross-origin requests) and API connectivity.

---

## What you need

- Your **Render backend URL** — looks like: `https://alexandria-backend.onrender.com`
- Your **Vercel frontend URL** — looks like: `https://alexandria-frontend.vercel.app`

---

## Step 1 — Set VITE_API_URL on Vercel

This tells the React app where to send API requests.

### Via CLI:
```powershell
cd "C:\Users\Іван\OneDrive\Рабочий стол\Alexandria_project\frontend"
vercel env add VITE_API_URL production
```
Paste your Render URL when prompted: `https://alexandria-backend.onrender.com`

Then redeploy:
```powershell
vercel --prod
```

### Via Vercel Dashboard:
1. Go to **vercel.com** → your project → **Settings** → **Environment Variables**
2. Add or update `VITE_API_URL` = `https://alexandria-backend.onrender.com`
3. Go to **Deployments** → click **Redeploy** on the latest deployment

---

## Step 2 — Set FRONTEND_URL on Render

This tells the backend which frontend origin to allow in CORS headers.
**If this is wrong, every API call will fail with a CORS error.**

1. Go to **render.com** → `alexandria-backend` → **Environment**
2. Find `FRONTEND_URL` and update it to your exact Vercel URL:
   ```
   FRONTEND_URL = https://alexandria-frontend.vercel.app
   ```
   (replace with your actual Vercel URL — no trailing slash)
3. Also update `BACKEND_URL`:
   ```
   BACKEND_URL = https://alexandria-backend.onrender.com
   ```
4. Click **Save Changes**

Render will automatically redeploy the backend with the new values.

---

## Step 3 — Wait for redeploys

- Render redeploy: ~2–3 minutes (watch the Logs tab)
- Vercel redeploy: ~1–2 minutes

---

## Step 4 — Test the connection

1. Open your Vercel frontend URL in a browser
2. Open DevTools (F12) → **Console** tab
3. Try to register or log in
4. You should NOT see errors like:
   - `CORS error`
   - `Access-Control-Allow-Origin missing`
   - `net::ERR_CONNECTION_REFUSED`
   - `Failed to fetch`

5. Also test the health endpoint directly:
   ```
   https://alexandria-backend.onrender.com/api/health
   ```
   Expected response: `{"status":"ok","timestamp":"...","env":"production"}`

---

## Troubleshooting

**CORS error in browser console:**
→ `FRONTEND_URL` on Render is wrong or has a typo. It must exactly match the Vercel URL.
→ Fix it in Render → Environment, then wait for redeploy.

**API calls return 404 or network error:**
→ `VITE_API_URL` on Vercel is wrong. Fix it in Vercel → Settings → Environment Variables, then redeploy.

**Backend health check fails:**
→ The Render service is still starting (free tier cold start takes up to 30 seconds after inactivity).
→ Wait 30 seconds and try again.
