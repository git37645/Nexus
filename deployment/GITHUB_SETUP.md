# GitHub Setup — Push Your Code

Your project is already a git repository with commits. You just need to create a GitHub repo and push to it.

---

## Step 1 — Create a GitHub repository

1. Go to **https://github.com/new**
2. Repository name: `Alexandria_project`
3. Set it to **Private** (recommended — keeps your code and secrets safer)
4. **Do NOT** check "Add a README file" — your project already has one
5. **Do NOT** check "Add .gitignore" — you already have one
6. Click **Create repository**

GitHub will show you a page with commands. **Ignore them** — use the commands below instead.

---

## Step 2 — Connect your local project to GitHub

Open PowerShell in your project folder and run these commands one at a time:

```powershell
cd "C:\Users\Іван\OneDrive\Рабочий стол\Alexandria_project"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/Alexandria_project.git
git branch -M main
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username (visible at the top right on GitHub).

If prompted for a password, GitHub no longer accepts passwords — you need a **Personal Access Token**:

1. Go to **https://github.com/settings/tokens/new**
2. Note: `Alexandria deploy`
3. Expiration: 90 days
4. Scopes: check **repo** (full control of private repositories)
5. Click **Generate token**
6. Copy the token — use it as the password when prompted

---

## Step 3 — Verify

Open `https://github.com/YOUR_GITHUB_USERNAME/Alexandria_project` — you should see your files.

---

## After pushing

Come back and follow:
- `deployment/NEON_ACTION_REQUIRED.md` — set up database
- `deployment/RENDER_ACTION_REQUIRED.md` — deploy backend
- `deployment/VERCEL_ACTION_REQUIRED.md` — deploy frontend
