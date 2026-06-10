# Nexus — Your University, Connected.

> ⚠️ **SECURITY WARNING — DEV ADMIN ACCOUNT**
> The seed script creates a development-only account: **username `admin` / password `admin`**.
> This account has SUPERADMIN privileges and **MUST NEVER be used in production**.
> The seed only creates it when `NODE_ENV !== "production"`.
> Before deploying, run `prisma migrate reset` on production or ensure the seed is never executed there.

A closed internal communication platform for universities, combining:
- **Signal-like** encrypted private and group messaging
- **Instagram-like** social feed with posts, images, comments, and likes  
- **EduPage-like** academic workspace with courses, lectures, and assignments

> **Privacy guarantee**: Private messages are end-to-end between participants. Administrators cannot read private chats. The moderation system operates entirely on reported content metadata and public posts — never on private message content.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Running PostgreSQL with Docker](#running-postgresql-with-docker)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Applying Prisma Migrations](#applying-prisma-migrations)
8. [Creating Test Users (Seed)](#creating-test-users-seed)
9. [User Roles](#user-roles)
10. [Project Structure](#project-structure)
11. [API Overview](#api-overview)
12. [Security Architecture](#security-architecture)
13. [MVP Contents](#mvp-contents)
14. [What Still Needs Work Before Production](#what-still-needs-work-before-production)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS 3 |
| State | Zustand (auth/UI) + TanStack Query (server state) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Real-time | Socket.IO client |
| HTTP client | Axios with JWT refresh interceptors |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Passwords | Argon2id |
| Auth | JWT (15 min access + 30 day refresh with rotation) |
| 2FA | TOTP via `otpauth` (Google Authenticator compatible) |
| File uploads | Multer (local storage, S3-ready architecture) |
| Email | Nodemailer |
| Logging | Winston |
| WebSocket | Socket.IO |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Containers | Docker Compose (PostgreSQL + Redis) |

---

## Prerequisites

- **Node.js** 20 or later — [nodejs.org](https://nodejs.org)
- **npm** 10 or later (comes with Node.js)
- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- **Git**

---

## Installation

Clone the repository and install dependencies for both backend and frontend:

```bash
git clone <your-repo-url>
cd Alexandria_project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Running PostgreSQL with Docker

The project includes a `docker-compose.yml` at the root that starts PostgreSQL 16 and Redis 7.

```bash
# From the project root
docker compose up -d
```

Verify containers are running:

```bash
docker compose ps
```

Default connection details (matches `.env.example`):
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `nexus`
- **User**: `nexus`
- **Password**: `nexus_password`

To stop containers:

```bash
docker compose down
```

To also delete all data (volumes):

```bash
docker compose down -v
```

---

## Backend Setup

1. Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

2. Edit `.env` with your values. At minimum, the following must be set for local development (the defaults in `.env.example` work with the Docker Compose setup):

```
DATABASE_URL="postgresql://nexus:nexus_password@localhost:5432/nexus"
JWT_SECRET="change-this-to-a-long-random-string"
JWT_REFRESH_SECRET="change-this-to-another-long-random-string"
```

3. Start the backend in development mode:

```bash
cd backend
npm run dev
```

The backend will be available at `http://localhost:5000`.

---

## Frontend Setup

1. Copy the example environment file (optional — defaults work for local dev):

```bash
cd frontend
cp .env.example .env
```

The default API base URL is `http://localhost:5000/api`.

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Applying Prisma Migrations

With the database running, apply the schema from the project root's backend directory:

```bash
cd backend

# Create the database schema
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to browse data visually
npx prisma studio
```

If you modify `prisma/schema.prisma`, create a new migration with:

```bash
npx prisma migrate dev --name describe-your-change
```

---

## Creating Test Users (Seed)

The seed script creates a full set of test users, courses, and sample content:

```bash
cd backend
npx prisma db seed
```

### Test Accounts

| Role | Email | Password |
|---|---|---|
| SuperAdmin | superadmin@nexus.edu | `SuperAdmin123!` |
| Admin | admin@nexus.edu | `Admin123!` |
| Teacher | teacher1@nexus.edu | `Teacher123!` |
| Teacher | teacher2@nexus.edu | `Teacher123!` |
| Student | student1@nexus.edu | `Student123!` |
| Student | student2@nexus.edu | `Student123!` |
| Student | student3@nexus.edu | `Student123!` |
| Student | student4@nexus.edu | `Student123!` |
| Student | student5@nexus.edu | `Student123!` |

The seed also creates:
- 2 sample courses with enrollments
- 1 published lecture with content
- 1 assignment with a deadline
- Sample posts in the feed

---

## User Roles

| Role | Capabilities |
|---|---|
| **Student** | View courses they're enrolled in, submit assignments, post in feed, send/receive messages, receive notifications |
| **Teacher** | Everything Students can do + create and manage courses, publish lectures, create assignments, grade submissions, enroll students |
| **Admin** | Everything Teachers can do + access admin panel, manage user accounts (freeze/block), review reported content, view audit logs |
| **SuperAdmin** | Everything Admins can do + change any user's role including promoting to Admin, cannot be managed by other Admins |

### Role Constraints

- No role can promote a user to SuperAdmin except an existing SuperAdmin
- No role can modify a SuperAdmin's account (status or role) — only another SuperAdmin can
- Admins **cannot** read private messages under any circumstance (see Security Architecture)

---

## Project Structure

```
Alexandria_project/
├── docker-compose.yml          # PostgreSQL + Redis containers
├── README.md
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 25+ models, all enums
│   │   └── seed.ts             # Test data
│   ├── src/
│   │   ├── admin/              # Admin user/report/audit management
│   │   ├── assignments/        # Assignment CRUD + submissions + grading
│   │   ├── auth/               # Register, login, 2FA, refresh tokens
│   │   ├── chats/              # Private + group chats, messages
│   │   ├── common/             # Shared types, interfaces
│   │   ├── config/             # Typed config from env
│   │   ├── courses/            # Course CRUD + enrollment
│   │   ├── lectures/           # Lecture CRUD + attachments
│   │   ├── lib/                # Prisma client, logger, email
│   │   ├── middleware/         # Auth, errors, rate limiting, uploads
│   │   ├── notifications/      # Notification read/unread management
│   │   ├── posts/              # Feed, posts, likes, comments, saves
│   │   ├── reports/            # Report content, admin review
│   │   ├── storage/            # File system service (S3-ready)
│   │   ├── users/              # Profile, avatar, privacy, sessions
│   │   ├── websocket/          # Socket.IO handler
│   │   └── index.ts            # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── public/
    │   └── nexus-icon.svg
    ├── src/
    │   ├── components/
    │   │   ├── layout/         # AppLayout, Sidebar, TopBar, Logo
    │   │   └── ui/             # Button, Input, Modal, Avatar, Badge, Spinner
    │   ├── features/
    │   │   └── feed/           # PostCard component
    │   ├── hooks/              # useAuth, useOnlineStatus
    │   ├── lib/                # Axios instance, Socket.IO client, utils
    │   ├── pages/
    │   │   ├── auth/           # Login, Register, ForgotPassword, etc.
    │   │   ├── app/            # Dashboard, Feed, Messages, Courses, etc.
    │   │   └── admin/          # AdminDashboard, Users, Reports, AuditLog
    │   ├── store/              # Zustand auth store
    │   ├── types/              # TypeScript interfaces
    │   └── App.tsx             # Routing
    ├── package.json
    └── vite.config.ts
```

---

## API Overview

All API routes are prefixed with `/api`.

| Prefix | Description |
|---|---|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Login, receive access + refresh tokens |
| `POST /api/auth/refresh` | Exchange refresh token for new token pair |
| `POST /api/auth/logout` | Revoke current session |
| `POST /api/auth/verify-email` | Verify email with token |
| `POST /api/auth/forgot-password` | Send password reset email |
| `POST /api/auth/reset-password` | Reset password with token |
| `GET/PATCH /api/users/me` | Get / update own profile |
| `GET /api/users/search` | Search users |
| `GET /api/posts/feed` | Paginated post feed |
| `POST /api/posts` | Create post (multipart) |
| `POST /api/posts/:id/like` | Toggle like |
| `POST /api/posts/:id/comments` | Add comment |
| `GET /api/chats` | List user's chats |
| `GET /api/chats/:id/messages` | Get messages (paginated) |
| `POST /api/chats/:id/messages` | Send message |
| `GET /api/courses` | List courses |
| `GET /api/courses/:id/lectures` | List lectures |
| `GET /api/courses/:id/assignments` | List assignments |
| `POST /api/assignments/:id/submit` | Submit assignment |
| `PATCH /api/assignments/:id/submissions/:sid/grade` | Grade submission |
| `GET /api/notifications` | Get notifications |
| `POST /api/reports` | Report content |
| `GET /api/admin/users` | Admin: list users |
| `PATCH /api/admin/users/:id/status` | Admin: change user status |
| `GET /api/admin/reports` | Admin: list reports |
| `PATCH /api/admin/reports/:id` | Admin: review report |
| `GET /api/admin/audit-log` | Admin: view audit log |

---

## Security Architecture

### Authentication

- Passwords hashed with **Argon2id** (memory-hard, resistant to GPU attacks)
- JWT **access tokens** expire in 15 minutes
- JWT **refresh tokens** expire in 30 days with **automatic rotation**: each use issues a new refresh token
- **Refresh token family tracking**: if a revoked token is reused (theft indicator), the entire token family is invalidated, logging out the attacker and the legitimate user
- **Brute-force protection**: accounts are temporarily locked after repeated failed login attempts
- **Email verification** required before login
- **TOTP 2FA** via authenticator app (Google Authenticator, Authy, etc.)

### Privacy

**Private chats are private.** This is not a configuration option — it is enforced by design:

- The report system stores only content IDs, reporter info, and report metadata. It never copies or exposes message content.
- Admin APIs return aggregate statistics (message counts) without content.
- The audit log records admin actions (status changes, role changes) — not user messages.
- There is no "view private messages" endpoint. There are no hidden admin endpoints.

### Moderation (without privacy violation)

Administrators can moderate the platform using:

1. **Report system** — users report specific posts, comments, or messages; admins see the report metadata and can act on the reported user's account
2. **Audit logs** — all admin actions are logged with timestamp and actor
3. **Account management** — freeze or block accounts showing suspicious behavior
4. **Rate limiting** — all endpoints, especially auth, are rate-limited
5. **Suspicious activity detection** — security events are surfaced in the admin security panel

### File Uploads

- MIME type allowlist enforced server-side (not just extension)
- Files stored outside the web root in a structured directory tree
- File names sanitized and replaced with UUIDs
- Upload size limits per type (avatars: 5MB, post images: 10MB, course files: 50MB, submissions: 100MB)

---

## MVP Contents

The following features are fully implemented:

**Authentication**
- [x] Registration with email + password
- [x] Email verification
- [x] Login with brute-force lockout
- [x] JWT access + refresh tokens with rotation
- [x] Logout (single device and all devices)
- [x] Password reset via email
- [x] TOTP two-factor authentication setup and enforcement

**Social Feed**
- [x] Create posts with up to 5 images
- [x] Paginated feed
- [x] Like / unlike posts
- [x] Comment on posts
- [x] Save posts for later
- [x] Delete own posts (admins can delete any)
- [x] Report any post or comment

**Messaging**
- [x] Private 1-on-1 chats (created on first message)
- [x] Group chats with custom name
- [x] Real-time delivery via Socket.IO
- [x] Typing indicators
- [x] Read receipts (last read timestamp)
- [x] Message editing (within 15-minute window)
- [x] Message deletion
- [x] Emoji reactions
- [x] File/image attachments
- [x] Online presence indicator

**Academic (EduPage-style)**
- [x] Course creation and management by teachers
- [x] Student enrollment
- [x] Lecture publishing with file attachments
- [x] Assignment creation with deadline and max score
- [x] Assignment submission (files + text)
- [x] Late submission detection
- [x] Grading with score + feedback
- [x] Notification to student on grade

**Admin Panel**
- [x] User search, filter, freeze, block
- [x] Role management (SuperAdmin only for role promotion)
- [x] Report review with status workflow (Pending → Under Review → Resolved/Dismissed)
- [x] Audit log of all admin actions
- [x] Platform statistics dashboard

**Notifications**
- [x] In-app notifications for likes, comments, new messages, assignment grades, enrollments
- [x] Unread count badge
- [x] Mark as read / mark all read

**Profile and Settings**
- [x] Avatar upload
- [x] Profile editing (name, bio, faculty)
- [x] Privacy settings
- [x] Active session management (view and revoke)

---

## What Still Needs Work Before Production

### Security Hardening

- [ ] **Enable HTTPS** — terminate TLS at the reverse proxy (nginx/Caddy). Never run the Node.js app directly on port 443.
- [ ] **Conduct penetration testing** — automated scanner (OWASP ZAP) and manual review before launch
- [ ] **SIEM / security monitoring** — forward Winston logs to a SIEM (e.g. Grafana + Loki, or ELK stack)
- [ ] **Add virus/malware scanning** for uploaded files (e.g. ClamAV integration in the upload middleware)
- [ ] **Content Security Policy** — extend Helmet's CSP headers for your specific frontend domain
- [ ] **Dependency audit** — run `npm audit` and fix any high/critical vulnerabilities before launch

### Infrastructure

- [ ] **Real email provider** — replace the Nodemailer `smtp.example.com` placeholder with a real SMTP service (AWS SES, Resend, Postmark, SendGrid)
- [ ] **Object storage** — replace local disk storage (`/storage`) with AWS S3, MinIO, or Cloudflare R2. The `storage.service.ts` is architected for this: replace `getAbsolutePath()` and `getFileUrl()` implementations.
- [ ] **Database backups** — configure automated PostgreSQL backups with point-in-time recovery (PITR). Test restores.
- [ ] **Redis persistence** — configure Redis AOF or RDB persistence for session/cache durability across restarts
- [ ] **Horizontal scaling** — Socket.IO requires a Redis adapter (`@socket.io/redis-adapter`) when running multiple backend instances. Currently single-instance only.
- [ ] **Health checks** — add `/api/health` endpoint for load balancer probes; the Docker Compose health checks are a starting point

### Monitoring and Observability

- [ ] **Application metrics** — instrument with Prometheus/OpenTelemetry (request count, latency, error rate)
- [ ] **Error tracking** — integrate Sentry or similar for production error alerting
- [ ] **Uptime monitoring** — external uptime checks (UptimeRobot, Better Uptime, etc.)
- [ ] **Database slow query monitoring** — enable PostgreSQL `pg_stat_statements`, alert on slow queries

### Compliance and Legal

- [ ] **GDPR compliance review** — map all personal data, implement right-to-deletion (the data model supports this but a deletion cascade needs testing), data export endpoint
- [ ] **Privacy Policy** — write and publish a privacy policy page explaining what data is collected, how it is used, and users' rights
- [ ] **Terms of Service** — write and publish terms of service covering acceptable use, prohibited content, and account termination
- [ ] **University legal requirements** — check your institution's data residency, student data privacy laws (FERPA in the US, etc.), and IT security policies
- [ ] **Cookie consent** — if analytics or non-essential cookies are added, a cookie consent banner is required in the EU

### Application Features

- [ ] **Email notification preferences** — let users choose which events send emails vs. in-app only
- [ ] **Push notifications** — add web push (Service Worker + Web Push API) for background notifications
- [ ] **Message search** — full-text search over public posts and course materials (private messages should not be indexed)
- [ ] **Admin announcements** — broadcast announcements to all users or specific roles
- [ ] **Course calendar** — due date calendar view for assignments
- [ ] **Assignment plagiarism detection** — basic similarity checking between submissions
- [ ] **Pagination on all admin tables** — current admin views load all records; add cursor pagination for scale
- [ ] **Image optimization** — compress uploaded images server-side (Sharp) before storage
- [ ] **Rate limit storage** — move rate limit counters from memory to Redis so limits work correctly across multiple instances

### Disaster Recovery

- [ ] **Documented runbook** — write a runbook for: database restore, emergency user lockout, incident response
- [ ] **Regular backup restore drills** — test that backups actually restore correctly on a schedule
- [ ] **Staging environment** — maintain a staging environment that mirrors production for testing before deploy
