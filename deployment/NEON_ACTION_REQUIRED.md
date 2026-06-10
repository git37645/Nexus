# Neon Database Setup

Neon gives you a free PostgreSQL database in the cloud. Your app needs this to store all data.

---

## Step 1 — Create a Neon account

1. Go to **https://neon.tech**
2. Click **Sign up** — use GitHub login for speed
3. Confirm your email if asked

---

## Step 2 — Create a project

1. Click **Create project** (or **New Project** button)
2. Project name: `alexandria`
3. Database name: `alexandria` (or leave default)
4. Region: **EU Central (Frankfurt)** — closest to Ukraine and Slovakia
5. PostgreSQL version: 16 (or whatever is offered as default)
6. Click **Create project**

---

## Step 3 — Copy your DATABASE_URL

1. After creation, you will see a **Connection Details** panel
2. Click the **Connection string** tab (not "Parameters")
3. Make sure **Pooled connection** is OFF (use direct connection for Prisma migrations)
4. Copy the full string — it looks like:
   ```
   postgresql://alexandria_owner:AbCdEfGhIjKl@ep-something-123456.eu-central-1.aws.neon.tech/alexandria?sslmode=require
   ```

**Save this string.** You will paste it into Render as `DATABASE_URL`.

---

## Step 4 — Important note about SSL

The `?sslmode=require` at the end of the URL is required. Do not remove it.
Prisma works fine with it.

---

## Next step

Go to `deployment/RENDER_ACTION_REQUIRED.md` and follow the backend deployment steps.
Paste your DATABASE_URL there.
