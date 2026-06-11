# Fix: DATABASE_URL Missing on Render

Your backend starts but crashes immediately because `DATABASE_URL` is not set.
This is normal — the database connection string must come from your Neon account, not from the code.

---

## Why this happens

The backend requires a real PostgreSQL database to start.
`DATABASE_URL` is intentionally required — without it, the server refuses to start rather than
connect to the wrong database or expose data.

---

## Step 1 — Create a Neon database (if you haven't yet)

1. Go to **https://neon.tech**
2. Sign up or log in (GitHub login is fastest)
3. Click **Create project**
4. Name: `nexus` (or anything you like)
5. Region: **EU Central (Frankfurt)** — closest to Ukraine/Slovakia
6. Click **Create project**

After creation:

1. Find **Connection Details** or **Connection string** on the project page
2. Make sure **Pooled connection** is turned OFF (direct connection is better for migrations)
3. Copy the full connection string — it looks like:
   ```
   postgresql://nexus_owner:SomeLongPassword@ep-something.eu-central-1.aws.neon.tech/nexus?sslmode=require
   ```

**Keep this string private. Do not paste it into chat, GitHub, or email.**

---

## Step 2 — Add DATABASE_URL to Render

1. Go to **render.com** → open your `alexandria-backend` service
2. Click **Environment** tab (in the left sidebar of your service)
3. Click **Add Environment Variable**
4. Key: `DATABASE_URL`
5. Value: paste your Neon connection string
6. Click **Save Changes**

Render will automatically start a new deploy.

---

## Step 3 — Also fix the Build Command (important!)

While you are in the Render dashboard, check the **Settings** tab:

**Build Command must be:**
```
npm install && npx prisma generate && npm run build
```

If it currently says `npm install; npm run build` (semicolon, no prisma generate), change it.
The `&&` stops on error. The `;` continues even if something fails — dangerous for production.
`npx prisma generate` is required to build the Prisma client before TypeScript compilation.

**Start Command must be:**
```
npm run start
```

**Root Directory must be:**
```
backend
```

---

## Step 4 — Verify all required environment variables are set

Go to **Render → Environment** and confirm ALL of these are present:

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `DATABASE_URL` | ✅ YES | Neon dashboard → Connection string |
| `JWT_ACCESS_SECRET` | ✅ YES | Any long random string (64+ hex chars) |
| `JWT_REFRESH_SECRET` | ✅ YES | Any long random string (64+ hex chars) |
| `NODE_ENV` | ✅ YES | `production` |
| `FRONTEND_URL` | ✅ YES | Your Vercel URL, e.g. `https://nexus-alexandria.vercel.app` |
| `BACKEND_URL` | recommended | Your Render URL, e.g. `https://alexandria-backend.onrender.com` |
| `ADMIN_EMAIL` | recommended | `ivanknyaze@gmail.com` |
| `ADMIN_USERNAME` | recommended | `ivan_admin` |
| `SMTP_HOST` | optional* | `smtp-relay.brevo.com` |
| `SMTP_USER` | optional* | From Brevo account |
| `SMTP_PASS` | optional* | From Brevo account |
| `EMAIL_FROM` | optional* | Your sender email |

*SMTP variables are optional for startup but required for email verification to work.

**To generate JWT secrets**, run this in PowerShell or terminal:
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run it twice — once for JWT_ACCESS_SECRET, once for JWT_REFRESH_SECRET.

---

## Step 5 — Trigger a manual redeploy

After saving environment variables:

1. Render will usually redeploy automatically
2. If not: **Manual Deploy** → **Deploy latest commit**
3. Watch the logs — startup should now show:
   ```
   🚀 Nexus API running on port 4000 (production)
      Frontend URL: https://nexus-alexandria.vercel.app
   ```

---

## Step 6 — Test the backend is running

Open in your browser:
```
https://alexandria-backend.onrender.com/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","env":"production"}
```

If you get a timeout: the free Render service is cold-starting (can take up to 60 seconds on first request after inactivity). Wait and retry.

---

## Step 7 — Set up database tables (after backend starts)

Once the health check passes:

1. Go to **Render → your service → Shell** tab
2. Run:
   ```
   npx prisma db push
   ```
   Expected: `Your database is now in sync with your Prisma schema.`

3. Then run:
   ```
   npm run db:seed
   ```
   Copy the admin setup link from the output and open it in your browser to set your admin password.
