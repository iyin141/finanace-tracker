# FinTrack - Setup Guide

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Neon Auth Configuration
NEON_AUTH_URL=https://ep-red-mountain-b4lbh23r.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth
```

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

Seed the database with initial users and sample data:

```bash
npx ts-node _lib/seed/seedDatabase.ts
```

This will create:
- Two admin users (mom@household.local and dad@household.local)
- Categories from the budget template
- Sample expenses for testing

## Neon Auth Setup

The application uses Neon Auth for authentication. Configure your Neon Auth endpoint in the environment variables.

### Login Credentials

After seeding, you can use these credentials (via Neon Auth):
- Mom: mom@household.local
- Dad: dad@household.local

Note: The actual passwords are managed through Neon Auth, not in the local database.

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
