# FinTrack - Household Finance Tracker

A comprehensive household expense tracking application built with Next.js 16, TypeScript, and Neon PostgreSQL. Features multi-user authentication, shared household expenses, comments, price comparison, and monthly spending analysis.

## Features

- **Multi-user Authentication** - Neon Managed Better Auth (`@neondatabase/auth`) login for household members
- **Admin Panel** - `/dashboard/admin` for user management (roles, invite, remove) plus quick links to every page
- **Shared Household Data** - Household members have full admin access to all expenses
- **Expense Tracking** - Log, edit, and delete expenses with categories
- **Comments System** - Add notes and comments to expenses
- **Price Comparison** - Compare grocery prices across dates
- **Monthly Comparison** - Analyze spending trends month-over-month
- **Category Management** - Budget categories with spending limits
- **Bulk Import** - CSV/Excel upload for expense import
- **Reports** - PDF and Excel export functionality
- **Dashboard Analytics** - Interactive charts and spending insights

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4 with custom theming
- **Database**: PostgreSQL via Neon serverless
- **ORM**: TypeORM with migration support
- **State Management**: Zustand with persistence
- **Authentication**: Neon Managed Better Auth (`@neondatabase/auth`)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **Export**: jsPDF, jspdf-autotable, xlsx

## Getting Started

### Prerequisites

- Node.js 18+ 
- Neon PostgreSQL database
- Neon-Vercel integration with the Auth toggle enabled (or a Neon Auth-enabled project, for local dev)

### Environment Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with:
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

4. Create a `.env.local` file (gitignored, never committed) with:
```bash
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.region.aws.neon.tech/<db>/auth
NEON_AUTH_COOKIE_SECRET=<openssl rand -base64 32>
SEED_IYIN_EMAIL=iyin@household.local
SEED_IYIN_PASSWORD=<real password>
SEED_MOM_EMAIL=mom@household.local
SEED_MOM_PASSWORD=<real password>
SEED_DAD_EMAIL=dad@household.local
SEED_DAD_PASSWORD=<real password>
```

On Vercel, `NEON_AUTH_BASE_URL` comes from the
[Neon-Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration)
(Auth toggle) automatically — only `NEON_AUTH_COOKIE_SECRET` needs to be set by hand there.
See [SETUP.md](./SETUP.md) for the full breakdown.

### Database Setup

1. Run migrations:
```bash
npm run migration:run
```

2. Seed the database — creates real Neon Auth accounts (not fake uids) plus categories and sample expenses:
```bash
npm run seed
# or, against a running dev server:
# POST http://localhost:3000/api/seed
```

This will create:
- Real Neon Auth accounts + matching admin users, from the `SEED_*` env vars
- 13 budget categories from the Excel template
- Sample expenses for testing

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the email/password pairs you
set in `.env.local` (`SEED_IYIN_*`, `SEED_MOM_*`, `SEED_DAD_*`).

## Project Structure

```
finace-tracker/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # login, logout, me + [...path] SDK handler
│   │   ├── admin/        # Admin-only user management endpoints
│   │   ├── expenses/     # Expense CRUD
│   │   ├── categories/   # Category management
│   │   ├── stats/        # Dashboard statistics
│   │   ├── analytics/    # Price/monthly comparison
│   │   ├── upload/       # CSV/Excel import
│   │   └── seed/         # Database seeding
│   ├── auth/             # Login page
│   ├── dashboard/
│   │   └── admin/        # Admin panel (index + users)
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── _Components/
│   └── Shared/           # Reusable UI components
├── _lib/
│   ├── auth/
│   │   └── server.ts     # createNeonAuth() instance
│   ├── entities/         # TypeORM entities
│   ├── migrations/       # Database migrations
│   ├── seed/             # Database seeding scripts
│   ├── typeorm.ts        # Database configuration
│   ├── auth.ts           # getSessionUser() / requireAdmin() helpers
│   └── utils.ts         # Helper functions
├── _Stores/
│   └── useAuthStore.ts   # Auth state management
├── proxy.ts               # Route protection (Next.js 16 renamed middleware.ts)
└── package.json
```

## Database Schema

### Users
- `id` (UUID) - Primary key
- `uid` (VARCHAR) - Unique identifier from Neon Auth
- `email` (VARCHAR) - User email
- `name` (VARCHAR) - User name
- `role` (VARCHAR) - 'admin' or 'member'

### Expenses
- `id` (UUID) - Primary key
- `date` (DATE) - Expense date
- `amount` (DECIMAL) - Expense amount
- `item` (VARCHAR) - Item description
- `userId` (VARCHAR) - Auth user ID (audit)
- `comments` (TEXT) - Optional comments
- `categoryId` (UUID) - Category foreign key
- `loggedByUserId` (UUID) - User who logged the expense

### Categories
- `id` (UUID) - Primary key
- `name` (VARCHAR) - Category name
- `color` (VARCHAR) - Display color
- `budgetAmount` (DECIMAL) - Monthly budget

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (via `auth.signIn.email`)
- `POST /api/auth/logout` - User logout (via `auth.signOut`)
- `GET /api/auth/me` - Get current user (via `auth.getSession`)
- `/api/auth/[...path]` - Mounted Neon Auth SDK handler (`auth.handler()`)

### Admin
- `GET /api/admin/users` - List users (admin only)
- `POST /api/admin/users` - Create a real Neon Auth account + local user (admin only)
- `PATCH /api/admin/users/[id]` - Change a user's role (admin only)
- `DELETE /api/admin/users/[id]` - Remove a user's Neon Auth account and local row (admin only)

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get single expense
- `PATCH /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

### Analytics
- `GET /api/analytics/price-comparison` - Compare prices across dates
- `GET /api/analytics/monthly-comparison` - Monthly spending comparison

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories` - Seed default categories

### Other
- `GET /api/stats` - Dashboard statistics
- `POST /api/upload` - CSV/Excel bulk import
- `POST /api/seed` - Seed database with initial data

## Budget Categories

The application includes 13 pre-configured categories:
- Tithe, Savings, Meat & Pepper, Frozen Protein, Toiletries
- Groceries, Personal Inside Garments, Medication, Self Care
- Office Feeding, Miscellaneous, Weekly Veggies & Water, Fuel

Total monthly budget: ₦3,500,000

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Authentication Flow

1. User enters email/password on login page
2. Frontend calls `/api/auth/login`, which calls `auth.signIn.email()`
3. Neon Auth's managed Better Auth service authenticates the request; on success, the SDK sets
   an HttpOnly session cookie (signed with `NEON_AUTH_COOKIE_SECRET`)
4. User is redirected to dashboard
5. `proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) checks `auth.getSession()` on every
   request to `/dashboard/*`, redirecting unauthenticated users to `/auth/login?next=...`
6. Protected API routes call `getSessionUser()` (`_lib/auth.ts`); admin-only routes call
   `requireAdmin()`, which checks the app's own `users.role`, not Neon Auth's own role claim

## License

MIT
