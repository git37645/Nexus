#!/usr/bin/env bash
# Nexus — Pre-deployment check script (bash / macOS / Linux)
# Run from the project root: bash deployment/deploy-check.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

check() {
  local label="$1" ok="$2" detail="${3:-}"
  if [ "$ok" = "true" ]; then
    echo -e "${GREEN}[PASS]${NC} $label"
    ((PASS++))
  else
    echo -e "${RED}[FAIL]${NC} $label"
    [ -n "$detail" ] && echo -e "       ${YELLOW}$detail${NC}"
    ((FAIL++))
  fi
}

info() { echo -e "${CYAN}[INFO]${NC} $1"; }

echo ""
echo "====================================="
echo "  Nexus Deployment Pre-flight Check  "
echo "====================================="
echo ""

# ── Tools ──────────────────────────────────────────────────────────────────
info "Checking required tools..."

command -v node &>/dev/null && check "Node.js installed" "true" || check "Node.js installed" "false" "Install from https://nodejs.org"
command -v npm  &>/dev/null && check "npm installed"     "true" || check "npm installed"     "false"
command -v git  &>/dev/null && check "git installed"     "true" || check "git installed"     "false" "Install from https://git-scm.com"
command -v vercel &>/dev/null && check "Vercel CLI installed" "true" || check "Vercel CLI installed" "false" "Run: npm install -g vercel"

# ── Git ────────────────────────────────────────────────────────────────────
info "Checking git..."

[ -d "$ROOT/.git" ] && check "Project is a git repository" "true" || check "Project is a git repository" "false" "Run: git init"

if [ -d "$ROOT/.git" ]; then
  git -C "$ROOT" remote get-url origin &>/dev/null \
    && check "GitHub remote configured" "true" \
    || check "GitHub remote configured" "false" "Run: git remote add origin https://github.com/USERNAME/REPO.git"

  git -C "$ROOT" ls-files --error-unmatch "backend/.env" &>/dev/null \
    && check ".env NOT tracked by git" "false" "Remove: git rm --cached backend/.env" \
    || check ".env NOT tracked by git" "true"
fi

# ── Project files ──────────────────────────────────────────────────────────
info "Checking project files..."

[ -f "$ROOT/backend/package.json" ]          && check "backend/package.json exists"   "true" || check "backend/package.json exists"   "false"
[ -f "$ROOT/frontend/package.json" ]         && check "frontend/package.json exists"  "true" || check "frontend/package.json exists"  "false"
[ -f "$ROOT/backend/prisma/schema.prisma" ]  && check "backend/prisma/schema.prisma"  "true" || check "backend/prisma/schema.prisma"  "false"
[ -f "$ROOT/backend/.env.example" ]          && check "backend/.env.example exists"   "true" || check "backend/.env.example exists"   "false"
[ -f "$ROOT/frontend/.env.example" ]         && check "frontend/.env.example exists"  "true" || check "frontend/.env.example exists"  "false"
[ -f "$ROOT/frontend/vercel.json" ]          && check "frontend/vercel.json exists"   "true" || check "frontend/vercel.json exists"   "false"
[ -f "$ROOT/deployment/render.yaml" ]        && check "deployment/render.yaml exists" "true" || check "deployment/render.yaml exists" "false"

# ── Security ───────────────────────────────────────────────────────────────
info "Scanning for insecure patterns..."

grep -q "password.*admin\|admin.*admin" "$ROOT/backend/prisma/seed.ts" 2>/dev/null \
  && check "No admin/admin in seed.ts" "false" "Remove hardcoded admin credentials" \
  || check "No admin/admin in seed.ts" "true"

# ── Builds ─────────────────────────────────────────────────────────────────
info "Running builds..."

cd "$ROOT/backend" && npm run build &>/dev/null \
  && check "Backend build passes" "true" \
  || check "Backend build passes" "false" "Run: cd backend && npm run build"

cd "$ROOT/frontend" && npm run build &>/dev/null \
  && check "Frontend build passes" "true" \
  || check "Frontend build passes" "false" "Run: cd frontend && npm run build"

[ -d "$ROOT/frontend/dist" ] && check "Frontend dist/ exists" "true" || check "Frontend dist/ exists" "false"

# ── Vercel ─────────────────────────────────────────────────────────────────
info "Checking Vercel login..."

vercel whoami &>/dev/null \
  && check "Vercel CLI logged in" "true" \
  || check "Vercel CLI logged in" "false" "Run: vercel login"

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "====================================="
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}  Results: $PASS passed, $FAIL failed${NC}"
  echo "====================================="
  echo -e "${GREEN}All checks passed! Follow deployment/NEXT_ACTIONS_FOR_USER.md${NC}"
else
  echo -e "${RED}  Results: $PASS passed, $FAIL failed${NC}"
  echo "====================================="
  echo -e "${YELLOW}Fix the FAIL items, then re-run this script.${NC}"
  echo -e "${YELLOW}See deployment/NEXT_ACTIONS_FOR_USER.md for step-by-step instructions.${NC}"
fi
echo ""
