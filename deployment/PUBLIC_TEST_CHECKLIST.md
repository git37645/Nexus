# Public Deployment Test Checklist

Run through these checks after all services are deployed and connected.
Replace `YOUR_FRONTEND_URL` and `YOUR_BACKEND_URL` with your actual URLs.

---

## Infrastructure

- [ ] Open `https://YOUR_BACKEND_URL/api/health` → returns `{"status":"ok","env":"production"}`
- [ ] Open `https://YOUR_FRONTEND_URL` → login page loads (not a blank page, not an error)
- [ ] Browser address bar shows `https://` (not `http://`) — HTTPS is active
- [ ] No mixed content warnings in browser console

---

## Registration and Email Verification

- [ ] Click **Register** → registration form loads
- [ ] Fill in a test email, username, password → submit
- [ ] Page says "Check your email" (CheckEmailPage loads)
- [ ] Verification email arrives in inbox (check spam if not in inbox within 2 minutes)
- [ ] Click the verification link in the email
- [ ] Page says "Email verified" or redirects to login
- [ ] Log in with the verified account → feed page loads

---

## Login and Session

- [ ] Log out, then log in again → works normally
- [ ] Refresh the page while logged in → you stay logged in (not kicked out)
- [ ] Open browser DevTools → Console → no CORS errors
- [ ] Open DevTools → Network → API calls go to `YOUR_BACKEND_URL`, not `localhost`

---

## Core Features

- [ ] Create a post on the feed → post appears
- [ ] Like a post → like count updates
- [ ] Open a user profile → profile page loads
- [ ] Start a private chat with another user → messages send and receive
- [ ] Open **Courses** in sidebar → page loads (may be empty if no courses created yet)
- [ ] Open **Assignments** in sidebar → page loads

---

## Language Switching

- [ ] Find the language switcher (bottom of sidebar or top of page)
- [ ] Switch to **Ukrainian (UK)** → interface shows Ukrainian text
- [ ] Switch to **Slovak (SK)** → interface shows Slovak text
- [ ] Switch back to **English (EN)** → interface shows English text
- [ ] Reload the page → the selected language is remembered

---

## Admin Panel

- [ ] Log in as `ivanknyaze@gmail.com` (with the password you set via the setup link)
- [ ] **Admin Panel** link appears in the sidebar
- [ ] Open Admin Panel → user list loads
- [ ] Admin panel does NOT show any chat/message reading functionality (private chats remain private)

---

## Security Checks

- [ ] Try to log in with: email = `ivanknyaze@gmail.com`, password = `admin` → FAILS (access denied)
- [ ] Try to log in with any email, password = `admin` → FAILS
- [ ] Try to log in with: email = `admin@local.dev`, password = `admin` → FAILS (account blocked)
- [ ] The setup link from the seed (`/setup-admin?token=...`) can only be used ONCE — using it twice shows an error
- [ ] Unauthenticated API requests to protected endpoints return 401, not 500

---

## What to Do If Something Fails

**Blank page / JavaScript error:**
→ Check browser console for errors. Usually caused by wrong `VITE_API_URL`.

**"Failed to fetch" / network errors:**
→ `VITE_API_URL` is wrong or backend is down. Check Render dashboard.

**CORS error:**
→ `FRONTEND_URL` on Render doesn't match your Vercel URL. Fix in Render → Environment.

**No verification email:**
→ SMTP is not set up or wrong. Follow `SMTP_ACTION_REQUIRED.md`.

**Admin login fails:**
→ Run `npm run db:seed` again in Render Shell to get a new setup link.

**"Invalid or expired token" on setup page:**
→ Token is 72h limited. Run `npm run db:seed` again to regenerate.
