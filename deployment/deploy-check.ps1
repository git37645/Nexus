# Nexus — Pre-deployment check script (Windows PowerShell)
# Run from the project root: .\deployment\deploy-check.ps1

$ErrorActionPreference = "Continue"
$ROOT = Split-Path -Parent $PSScriptRoot
$PASS = 0
$FAIL = 0

function Check($label, $ok, $detail = "") {
    if ($ok) {
        Write-Host "[PASS] $label" -ForegroundColor Green
        $script:PASS++
    } else {
        Write-Host "[FAIL] $label" -ForegroundColor Red
        if ($detail) { Write-Host "       $detail" -ForegroundColor Yellow }
        $script:FAIL++
    }
}

function Info($msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor White
Write-Host "  Nexus Deployment Pre-flight Check  " -ForegroundColor White
Write-Host "=====================================" -ForegroundColor White
Write-Host ""

# ── Tools ──────────────────────────────────────────────────────────────────
Info "Checking required tools..."

$nodeVer = node --version 2>$null
Check "Node.js installed" ($nodeVer -ne $null) "Install from https://nodejs.org"

$npmVer = npm --version 2>$null
Check "npm installed" ($npmVer -ne $null)

$gitVer = git --version 2>$null
Check "git installed" ($gitVer -ne $null) "Install from https://git-scm.com"

$vercelVer = vercel --version 2>$null
Check "Vercel CLI installed" ($vercelVer -ne $null) "Run: npm install -g vercel"

# ── Git status ─────────────────────────────────────────────────────────────
Info "Checking git..."

$isGitRepo = Test-Path (Join-Path $ROOT ".git")
Check "Project is a git repository" $isGitRepo "Run: git init (handled below)"

if ($isGitRepo) {
    $gitRemote = git -C $ROOT remote get-url origin 2>$null
    Check "GitHub remote configured" ($gitRemote -ne $null) "Run: git remote add origin https://github.com/USERNAME/REPO.git"

    $envTracked = git -C $ROOT ls-files --error-unmatch "backend/.env" 2>$null
    Check ".env NOT tracked by git" ($LASTEXITCODE -ne 0) "Remove backend/.env from git tracking"
}

# ── Project files ──────────────────────────────────────────────────────────
Info "Checking project files..."

Check "backend/package.json exists"    (Test-Path "$ROOT\backend\package.json")
Check "frontend/package.json exists"   (Test-Path "$ROOT\frontend\package.json")
Check "backend/prisma/schema.prisma"   (Test-Path "$ROOT\backend\prisma\schema.prisma")
Check "backend/.env.example exists"    (Test-Path "$ROOT\backend\.env.example")
Check "frontend/.env.example exists"   (Test-Path "$ROOT\frontend\.env.example")
Check "DEPLOYMENT_GUIDE.md exists"     (Test-Path "$ROOT\DEPLOYMENT_GUIDE.md")
Check "frontend/vercel.json exists"    (Test-Path "$ROOT\frontend\vercel.json")
Check "deployment/render.yaml exists"  (Test-Path "$ROOT\deployment\render.yaml")

# ── Security scan ─────────────────────────────────────────────────────────
Info "Scanning for insecure patterns..."

# Check for literal 'admin' as a password value (not comments or variable names)
$adminAdmin = Select-String -Path "$ROOT\backend\prisma\seed.ts" -Pattern "[`"']admin[`"'].*password|password.*[`"']admin[`"']" -Quiet 2>$null
Check "No admin/admin in seed.ts" (-not $adminAdmin) "Remove hardcoded admin credentials from seed.ts"

$srcFiles = Get-ChildItem -Path "$ROOT\backend\src" -Recurse -Filter "*.ts" -File 2>$null
$hardcodedPwMatches = ($srcFiles | Select-String -Pattern "password.*['`"]admin['`"]|['`"]admin['`"].*password" 2>$null | Measure-Object).Count
Check "No hardcoded passwords in backend src" ($hardcodedPwMatches -eq 0)

# ── Build checks ───────────────────────────────────────────────────────────
Info "Running builds (this may take a minute)..."

Push-Location "$ROOT\backend"
$backendBuild = npm run build 2>&1
$backendOk = ($LASTEXITCODE -eq 0)
Pop-Location
Check "Backend TypeScript build passes" $backendOk ($backendBuild | Select-Object -Last 3 | Out-String)

Push-Location "$ROOT\frontend"
$frontendBuild = npm run build 2>&1
$frontendOk = ($LASTEXITCODE -eq 0)
Pop-Location
Check "Frontend Vite build passes" $frontendOk ($frontendBuild | Select-Object -Last 3 | Out-String)

Check "Frontend dist/ folder exists" (Test-Path "$ROOT\frontend\dist")

# ── Vercel auth ────────────────────────────────────────────────────────────
Info "Checking Vercel login..."
$vercelUser = vercel whoami 2>$null
$vercelLoggedIn = ($LASTEXITCODE -eq 0 -and $vercelUser -notmatch "No existing credentials")
Check "Vercel CLI logged in" $vercelLoggedIn "Run: vercel login"

# ── Summary ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================" -ForegroundColor White
Write-Host "  Results: $PASS passed, $FAIL failed  " -ForegroundColor $(if ($FAIL -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================" -ForegroundColor White
Write-Host ""

if ($FAIL -gt 0) {
    Write-Host "Fix the FAIL items above, then re-run this script." -ForegroundColor Yellow
    Write-Host "See deployment/NEXT_ACTIONS_FOR_USER.md for step-by-step instructions." -ForegroundColor Yellow
} else {
    Write-Host "All checks passed! Follow deployment/NEXT_ACTIONS_FOR_USER.md to deploy." -ForegroundColor Green
}
Write-Host ""
