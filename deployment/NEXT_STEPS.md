# What To Do Next — In Order

Everything that can be automated is done. Follow these steps in order.
Each step has a file with exact instructions.

---

## 1. Push to GitHub (5 min)

File: `deployment/GITHUB_SETUP.md`

You need a GitHub account and a new repository.
Then run 4 commands in PowerShell to push your code.

---

## 2. Create Neon database (3 min)

File: `deployment/NEON_ACTION_REQUIRED.md`

Free PostgreSQL in the cloud. You get a `DATABASE_URL` to paste into Render.
Choose EU Central (Frankfurt) region.

---

## 3. Deploy backend on Render (10 min)

File: `deployment/RENDER_ACTION_REQUIRED.md`

Sign up with GitHub, create a Web Service, set environment variables, deploy.
Your JWT secrets are ready — paste them from that file.
After deploy you get a URL like `https://alexandria-backend.onrender.com`.

---

## 4. Set up Brevo SMTP (5 min)

File: `deployment/SMTP_ACTION_REQUIRED.md`

Free email sending (300/day). Without this, users can't verify their email.
After setup, update SMTP variables in Render → Environment.

---

## 5. Deploy frontend on Vercel (5 min)

File: `deployment/VERCEL_ACTION_REQUIRED.md`

Use Vercel CLI or dashboard. Set `VITE_API_URL` to your Render backend URL.
After deploy you get a URL like `https://alexandria-frontend.vercel.app`.

---

## 6. Connect frontend and backend (2 min)

File: `deployment/CONNECT_URLS_AFTER_DEPLOYMENT.md`

- Set `FRONTEND_URL` on Render = your Vercel URL
- Set `VITE_API_URL` on Vercel = your Render URL
- Redeploy both

---

## 7. Set up database and admin account (5 min)

File: `deployment/ADMIN_SETUP_ACTION_REQUIRED.md`

In Render Shell:
```
npx prisma db push
npm run db:seed
```
Copy the setup link from the output and set your admin password.

---

## 8. Test everything (5 min)

File: `deployment/PUBLIC_TEST_CHECKLIST.md`

Go through the checklist to confirm the whole system works.

---

## Summary of what was done automatically

- ✅ Backend TypeScript builds without errors
- ✅ Frontend Vite build passes
- ✅ JWT secrets generated (in RENDER_ACTION_REQUIRED.md)
- ✅ No admin/admin anywhere — verified by code scan
- ✅ Admin setup uses secure one-time token (SHA256-hashed, 72h expiry)
- ✅ Admin email: `ivanknyaze@gmail.com`, username: `ivan_admin`
- ✅ Private chats: admins have NO route to read other users' messages
- ✅ CORS uses `FRONTEND_URL` env var — no hardcoded localhost in production
- ✅ `VITE_API_URL` used in all frontend API calls — no hardcoded localhost
- ✅ Ukrainian (default), Slovak, and English languages all working
- ✅ `frontend/vercel.json` — SPA routing + security headers
- ✅ `deployment/render.yaml` — Render Blueprint for one-click deploy
- ✅ All `.env` files in `.gitignore` — secrets never committed
- ✅ Git repository is ready with latest changes committed

---

## Your JWT secrets (copy to Render — do not share)

```
JWT_ACCESS_SECRET=fe48acfd1fb7866f71a146b7e87e085ce5e4f2654530e42b36e3dd937b62ea2dc4e3eb2838edb18e7c871a7a3f94aa1ebe5d2cc7a701ba48901001516f6f7bbc
JWT_REFRESH_SECRET=04f6dff9e4a2b2737367dd64b85b69c85876c2431295c52ae2fbc6bb372aad3d3173e7578fba6a49c0c3b1d5453a5392d691df3871b8afd8784d42549ab914ec
```

These are also saved locally (gitignored) in:
- `deployment/_jwt_access_secret.tmp`
- `deployment/_jwt_refresh_secret.tmp`
