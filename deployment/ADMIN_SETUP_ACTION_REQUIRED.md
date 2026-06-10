# Admin Account Setup — Render Shell Commands

After your backend is deployed and DATABASE_URL is set, run these commands in the Render Shell.
This creates your admin account with a secure one-time setup link. No passwords are hardcoded.

---

## When to do this

Do this AFTER:
- Backend is deployed on Render
- `DATABASE_URL` is set in Render environment
- The health check at `/api/health` returns OK

---

## Step 1 — Open Render Shell

1. Go to **render.com** → your `alexandria-backend` service
2. Click the **Shell** tab (in the top navigation of your service)
3. Wait for the shell to connect (may take 10–15 seconds)

---

## Step 2 — Create database tables

Run this command:
```bash
npx prisma db push
```

Expected output ends with:
```
Your database is now in sync with your Prisma schema.
```

If you see migration errors, try:
```bash
npx prisma migrate deploy
```

---

## Step 3 — Create admin account and get setup link

Run this command:
```bash
npm run db:seed
```

Look for this block in the output:
```
══════════════════════════════════════════════════════════
  ADMIN SETUP LINK (valid for 72 hours)
  Email:    ivanknyaze@gmail.com
  Username: ivan_admin

  Use this link to set/reset your admin password:
  https://your-frontend.vercel.app/setup-admin?token=abc123...

  Keep this link private. It grants full SUPERADMIN access.
══════════════════════════════════════════════════════════
```

---

## Step 4 — Set your admin password

1. Copy the full URL from the output above (starting with `https://...`)
2. Open it in your browser
3. Enter a strong password (at least 8 characters, mix of letters, numbers, symbols)
4. Confirm the password
5. Submit — you should see a success message

---

## Step 5 — Test admin login

1. Go to your frontend URL
2. Click **Log in**
3. Enter:
   - Email: `ivanknyaze@gmail.com`
   - Password: the one you just set
4. You should see the feed, and **Admin Panel** should appear in the sidebar

---

## Notes

- The seed script is safe to run multiple times — it generates a fresh token each time
- If the setup link expires (72 hours), just run `npm run db:seed` again in Render Shell
- `admin/admin` does NOT work — it was never created
- Your password is hashed with Argon2id and never stored in plain text

---

## If the seed link shows localhost

If the setup link shows `http://localhost:5173/setup-admin?token=...` instead of your Vercel URL:

1. Go to Render → `alexandria-backend` → **Environment**
2. Make sure `FRONTEND_URL` is set to your Vercel URL
3. Click **Save Changes** and wait for redeploy
4. Then run `npm run db:seed` again in the Shell
