# Nexus — Deployment Checklist

Work through this list top-to-bottom. Check each item before moving to the next.
For detailed instructions on each step, see DEPLOYMENT_GUIDE.md.

---

## Security — before anything else

- [ ] admin/admin does NOT exist (verified — seed uses setup-token flow)
- [ ] No .env file is committed to git
- [ ] `.gitignore` contains `.env`, `.env.local`, `.env.production`

---

## Database (Neon / Supabase / Railway / Render PostgreSQL)

- [ ] Created a PostgreSQL database on a cloud provider
- [ ] Copied the `DATABASE_URL` connection string
- [ ] Connection string includes `?sslmode=require` (required by Neon)

---

## Backend environment variables (set in Render / Railway)

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` — your cloud PostgreSQL connection string
- [ ] `JWT_ACCESS_SECRET` — long random hex (run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] `JWT_REFRESH_SECRET` — different long random hex (run the command again)
- [ ] `FRONTEND_URL` — your Vercel frontend URL (e.g. `https://nexus-app.vercel.app`)
- [ ] `APP_URL` — your Render backend URL (e.g. `https://nexus-backend.onrender.com`)
- [ ] `SMTP_HOST` — your email provider SMTP host
- [ ] `SMTP_PORT` — usually 587
- [ ] `SMTP_USER` — your SMTP login
- [ ] `SMTP_PASS` — your SMTP password
- [ ] `EMAIL_FROM` — the sender email address
- [ ] `ADMIN_EMAIL=ivanknyaze@gmail.com`
- [ ] `ADMIN_USERNAME=ivan_admin`

---

## Backend deployment (Render)

- [ ] Code pushed to GitHub
- [ ] Render Web Service created
- [ ] Root directory set to `backend`
- [ ] Build command: `npm install && npx prisma generate && npm run build`
- [ ] Start command: `npm run start`
- [ ] All environment variables entered in Render
- [ ] Backend deployed successfully
- [ ] Copied backend public URL (e.g. `https://nexus-backend.onrender.com`)
- [ ] Health check passes: `GET https://nexus-backend.onrender.com/api/health` returns `{"status":"ok"}`

---

## Database setup (run after backend deploys)

- [ ] Opened Render Shell for the backend service
- [ ] Run: `npx prisma db push` (creates all database tables)
- [ ] Run: `npm run db:seed` (creates the admin account)
- [ ] Copied the admin setup link from Render logs
- [ ] Admin setup link looks like: `https://nexus-app.vercel.app/setup-admin?token=...`

---

## Frontend environment variables (set in Vercel)

- [ ] `VITE_API_URL` — backend public URL (e.g. `https://nexus-backend.onrender.com`)
- [ ] `VITE_DEFAULT_LANGUAGE=uk`

---

## Frontend deployment (Vercel)

- [ ] Vercel project created
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Both environment variables set in Vercel
- [ ] Frontend deployed successfully
- [ ] Copied frontend public URL (e.g. `https://nexus-app.vercel.app`)

---

## Connect frontend ↔ backend

- [ ] Put the backend URL into Vercel → `VITE_API_URL` → redeploy frontend
- [ ] Put the frontend URL into Render → `FRONTEND_URL` → redeploy backend
- [ ] Both must use HTTPS (no http://)
- [ ] No trailing slash in either URL

---

## Admin setup

- [ ] Opened `/setup-admin?token=...` link from seed logs
- [ ] Set a strong admin password (8+ characters, uppercase, number)
- [ ] Admin password is NOT hardcoded anywhere
- [ ] Can log in at `/login` with `ivanknyaze@gmail.com`
- [ ] Admin Panel link appears in sidebar after login
- [ ] Setup link no longer works after use (one-time only)

---

## Testing

- [ ] Open frontend URL — login page loads
- [ ] Register a new account
- [ ] Receive verification email (check spam too)
- [ ] Click verification link — account activated
- [ ] Log in with verified account
- [ ] Create a post in the feed
- [ ] Send a direct message
- [ ] Open Courses page
- [ ] Open Assignments page
- [ ] Log in as admin (`ivanknyaze@gmail.com`)
- [ ] Check Admin Panel works
- [ ] Switch language to Ukrainian — UI changes
- [ ] Switch language to Slovak — UI changes
- [ ] Switch language to English — UI changes

---

## Security verification

- [ ] HTTPS on frontend (URL starts with `https://`)
- [ ] HTTPS on backend (URL starts with `https://`)
- [ ] No CORS errors in browser developer tools
- [ ] admin/admin login fails (no such account)
- [ ] Passwords are hashed (not stored in plain text — verified by design: Argon2id)
- [ ] Private messages are NOT readable from the admin panel
- [ ] Backend `/api/health` does NOT expose secrets

---

## Logs check

- [ ] No errors in Render logs after startup
- [ ] `Database connected` appears in Render logs
- [ ] No `Missing required environment variable` errors

---

## Optional (recommended before sharing widely)

- [ ] Configure database backups (Neon has automatic backups on free tier)
- [ ] Set up a custom domain on Vercel
- [ ] Configure custom domain on Render
- [ ] Plan for file upload persistence (currently files are lost on Render redeploy — consider S3/R2)
- [ ] Enable Render health check monitoring
- [ ] Review audit log after first real users sign up
