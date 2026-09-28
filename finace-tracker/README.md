# FinTrack - Household Finance Tracker

A comprehensive household expense tracking application built with Next.js 16, TypeScript, and Neon PostgreSQL. Features multi-user authentication, shared household expenses, comments, price comparison, and monthly spending analysis.

## Features

- **Multi-user Authentication** - Neon Auth-based login for household members
- **Shared Household Data** - Both mom and dad have full admin access to all expenses
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
- **Authentication**: Neon Auth with JWT tokens
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for data visualization
- **Export**: jsPDF, jspdf-autotable, xlsx

## Getting Started

### Prerequisites

- Node.js 18+ 
- Neon PostgreSQL database
- Neon Auth endpoint configured

### Environment Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with:
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
NEON_AUTH_URL=https://ep-red-mountain-b4lbh23r.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth
```

### Database Setup

1. Start the development server (TypeORM will auto-sync on first run):
```bash
npm run dev
```

2. Seed the database with initial data:
```bash
# Access the seed endpoint
POST http://localhost:3000/api/seed
```

This will create:
- Two admin users (mom@household.local, dad@household.local)
- 13 budget categories from the Excel template
- Sample expenses for testing

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with:
- Email: mom@household.local or dad@household.local
- Password: Configure via Neon Auth

## Project Structure

```
finace-tracker/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── expenses/     # Expense CRUD
│   │   ├── categories/   # Category management
│   │   ├── stats/        # Dashboard statistics
│   │   ├── analytics/    # Price/monthly comparison
│   │   ├── upload/       # CSV/Excel import
│   │   └── seed/         # Database seeding
│   ├── auth/             # Login page
│   ├── dashboard/       # Main application pages
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── _Components/
│   └── Shared/           # Reusable UI components
├── _lib/
│   ├── entities/         # TypeORM entities
│   ├── migrations/       # Database migrations
│   ├── seed/             # Database seeding scripts
│   ├── typeorm.ts        # Database configuration
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts         # Helper functions
├── _Stores/
│   └── useAuthStore.ts   # Auth state management
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
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

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
2. Frontend calls `/api/auth/login` with credentials
3. Backend authenticates with Neon Auth endpoint
4. On success, JWT token is stored in HttpOnly cookie
5. User is redirected to dashboard
6. All subsequent requests verify token via middleware

## License

MIT
