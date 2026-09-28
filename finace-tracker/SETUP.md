# FinTrack - Setup Guide

## Environment Variables

Create a `.env` file with the database connection, and a `.env.local` file (gitignored, never committed) with auth secrets:

```bash
# .env — Database Configuration
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

```bash
# .env.local — Managed Better Auth (Neon Auth) Configuration
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.region.aws.neon.tech/<db>/auth
NEON_AUTH_COOKIE_SECRET=<openssl rand -base64 32>

# Seed-time admin account passwords (used only by _lib/seed/seedDatabase.ts)
SEED_IYIN_EMAIL=iyin@household.local
SEED_IYIN_PASSWORD=<real password>
SEED_MOM_EMAIL=mom@household.local
SEED_MOM_PASSWORD=<real password>
SEED_DAD_EMAIL=dad@household.local
SEED_DAD_PASSWORD=<real password>
```

On Vercel, `NEON_AUTH_BASE_URL` is injected automatically by the
[Neon-Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration)
once the Auth toggle is enabled — don't set it by hand there. `NEON_AUTH_COOKIE_SECRET` is
**not** provided by the integration and must be set manually, both locally in `.env.local` and
in Vercel's Production/Preview/Development env vars (same value across environments that share
a database, since it signs the session cookie).

`NEON_AUTH_COOKIE_SECRET` must be at least 32 characters. Both `.env` and `.env.local` are covered by `.env*` in `.gitignore` — verify that stays true before committing.

## Database Setup

### 1. Run Migrations

The project uses TypeORM migrations instead of auto-sync. Run the initial migration:

```bash
npm run migration:run
```

Or manually run the migration file:

```bash
npx typeorm migration:run -d _lib/typeorm.ts
```

### 2. Seed Database

Seed the database with real accounts and sample data:

```bash
npm run seed
```

This creates real accounts in Neon Auth (via `auth.signUp.email`, or `auth.signIn.email` if they
already exist) for each `SEED_*_EMAIL`/`SEED_*_PASSWORD` pair in `.env.local`, then find-or-creates
the matching local `users` row (`role: "admin"`) using the id Neon Auth returns. It also seeds:
- Categories from the budget template
- Sample expenses for testing

The same logic is reachable via `POST /api/seed` for a running dev server, and is deduped through
`_lib/seed/seedDatabase.ts` so both entry points stay in sync.

## Neon Auth Setup

The application uses Neon's Managed Better Auth (`@neondatabase/auth`) for authentication:
- `_lib/auth/server.ts` creates the shared `auth` instance via `createNeonAuth`.
- `app/api/auth/[...path]/route.ts` mounts `auth.handler()`.
- `proxy.ts` protects `/dashboard/*` and redirects authenticated users away from `/auth/login`,
  using `auth.getSession()`.
- `_lib/auth.ts` exposes `getSessionUser()` (used by protected API routes) and `requireAdmin()`
  (used by the admin panel, checking the app's own `users.role`, not the Neon Auth session's
  own role claim — see Admin Panel section below).

### Login Credentials

After seeding, log in with the emails/passwords you set in `.env.local` (`SEED_IYIN_*`,
`SEED_MOM_*`, `SEED_DAD_*`). Passwords are never stored anywhere but `.env.local` and Neon Auth
itself.

## Admin Panel

Visit `/dashboard/admin` (linked from the sidebar for admins only) for:
- An index linking to every dashboard page.
- `/dashboard/admin/users` — list users, change role (admin/member), remove a user, or invite a
  new one. Removing a user calls `auth.admin.removeUser()` (real Neon Auth account deletion), not
  just the local `users` row.

Access is gated server-side in `app/dashboard/admin/layout.tsx` and in every
`app/api/admin/**` route via `requireAdmin()` — not just a hidden nav link.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Features

- **Multi-user authentication** with Neon Auth
- **Shared household expenses** - both users see all data
- **Comments** on expenses
- **Price comparison** across dates
- **Monthly spending comparison**
- **Category management** with budget tracking
- **CSV/Excel bulk import**
- **PDF and Excel report generation**

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `uid` (VARCHAR) - Unique identifier from Neon Auth
- `email` (VARCHAR) - User email
- `name` (VARCHAR) - User name
- `role` (VARCHAR) - 'admin' or 'member'
- `created_at`, `updated_at` - Timestamps

### Expenses Table
- `id` (UUID) - Primary key
- `date` (DATE) - Expense date
- `amount` (DECIMAL) - Expense amount
- `item` (VARCHAR) - Item description
- `userId` (VARCHAR) - Auth user ID (for audit)
- `comments` (TEXT) - Optional comments
- `categoryId` (UUID) - Foreign key to categories
- `loggedByUserId` (UUID) - Foreign key to users (who logged the expense)
- `created_at`, `updated_at` - Timestamps

### Categories Table
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Category name
- `color` (VARCHAR) - Display color
- `budgetAmount` (DECIMAL) - Monthly budget
- `userId` (VARCHAR) - Optional user association
- `created_at`, `updated_at` - Timestamps
