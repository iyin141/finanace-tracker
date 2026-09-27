---
name: finance-tracker-patterns
description: >
  Architecture patterns, API route conventions, UI component structure,
  and accounting/export helpers for the Home Finance Tracker app.
  Derived from CroudFundFrontend (Next.js API routes, auth, middleware)
  and Pap-matters-frontend (dashboard UI, tables, charts, Excel/CSV/PDF export).
---

# Finance Tracker — Architecture & Patterns Skill

## 1. Project Structure (Next.js App Router)

The project uses **Next.js 16 App Router** with Tailwind CSS 4 and TypeScript.
The structure merges conventions from CroudFundFrontend (API routes + auth) and
Pap-matters-frontend (dashboard UI + accounting components).

```
finace-tracker/
├── app/
│   ├── globals.css              # Global styles (Tailwind + custom tokens)
│   ├── layout.tsx               # Root layout (fonts, providers, metadata)
│   ├── page.tsx                 # Landing / redirect
│   │
│   ├── api/                     # ── Next.js API Routes (server-side) ──
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── logout/route.ts
│   │   ├── expenses/
│   │   │   ├── route.ts         # GET (list) + POST (create)
│   │   │   ├── [id]/route.ts    # GET / PUT / DELETE single expense
│   │   │   └── upload/route.ts  # POST — CSV/XLSX bulk upload
│   │   ├── categories/
│   │   │   └── route.ts         # GET (list) + POST (create)
│   │   ├── budgets/
│   │   │   └── route.ts         # GET / POST monthly budgets
│   │   └── analytics/
│   │       └── route.ts         # GET aggregated stats (charts)
│   │
│   ├── auth/                    # ── Auth pages ──
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── dashboard/               # ── Dashboard (post-login) ──
│   │   ├── page.tsx             # Overview: cards + chart + recent table
│   │   ├── expenses/page.tsx    # Full expense list with filters + export
│   │   ├── upload/page.tsx      # CSV/XLSX upload wizard
│   │   ├── categories/page.tsx  # Manage categories
│   │   └── budgets/page.tsx     # Monthly budget setup
│   │
│   └── middleware.ts            # Route protection (proxy pattern)
│
├── _Components/                 # ── Client-side React components ──
│   ├── Shared/
│   │   ├── DashboardLayout.tsx  # Sidebar + TopNavbar + main content area
│   │   ├── Sidebar.tsx          # Collapsible sidebar with nav items
│   │   ├── TopNavbar.tsx        # Top bar with user info + notifications
│   │   ├── Card.tsx             # Universal card wrapper
│   │   ├── table/
│   │   │   ├── GenericTable.tsx  # Reusable data table (pagination, sort, filter)
│   │   │   ├── ExportDropdown.tsx
│   │   │   ├── types.ts         # GenericTableColumn, GenericTableProps, etc.
│   │   │   └── index.ts
│   │   └── formStyles.ts       # Shared Tailwind class constants
│   │
│   ├── Dashboard/
│   │   ├── OverviewCards.tsx     # Summary stat cards (total spent, budget, etc.)
│   │   ├── SpendingChart.tsx     # Category breakdown chart (recharts/chart.js)
│   │   ├── TrendChart.tsx        # Monthly spending trend line chart
│   │   └── RecentExpenses.tsx    # Last N expenses mini-table
│   │
│   ├── Expenses/
│   │   ├── ExpenseTable.tsx      # Full expense table with all columns
│   │   ├── ExpenseForm.tsx       # Add/edit expense modal/form
│   │   └── FilterBar.tsx         # Date range, category, search filters
│   │
│   ├── Upload/
│   │   ├── CsvUploader.tsx       # Drag-drop + file picker for CSV/XLSX
│   │   ├── ColumnMapper.tsx      # Map CSV columns → expense fields
│   │   └── UploadPreview.tsx     # Preview parsed rows before committing
│   │
│   └── ui/                      # Low-level UI primitives
│       ├── Dropdown.tsx
│       └── Modal.tsx
│
├── _Stores/                     # ── Zustand stores ──
│   ├── useAuthStore.ts          # Auth state (user, token, isAuthenticated)
│   └── useExpenseStore.ts       # Expense filters, selected category, etc.
│
├── _lib/                        # ── Utility / helper layer ──
│   ├── db.ts                    # Neon serverless PostgreSQL client
│   ├── auth.ts                  # Password hashing, JWT/cookie helpers
│   ├── exportTable.ts           # CSV, XLSX, PDF export functions
│   └── tableFunctions.ts        # Number formatting, currency helpers
│
├── types/                       # ── Shared TypeScript types ──
│   ├── auth.types.ts
│   ├── expense.types.ts
│   └── category.types.ts
│
├── middleware.ts                # Root middleware (re-exports proxy)
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 2. API Route Patterns

### Convention (from CroudFundFrontend)

Each API route file exports named HTTP method handlers:

```typescript
// app/api/expenses/route.ts
import { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// GET /api/expenses — list expenses for authenticated user
export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return Response.json({ message: "Unauthenticated." }, { status: 401 });

  try {
    // ... query Neon
    const rows = await sql`SELECT * FROM expenses WHERE user_id = ${userId} ORDER BY date DESC`;
    return Response.json({ data: rows }, { status: 200 });
  } catch (err: any) {
    return Response.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}

// POST /api/expenses — create a new expense
export async function POST(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return Response.json({ message: "Unauthenticated." }, { status: 401 });

  try {
    const body = await req.json();
    // ... validate & insert
    return Response.json({ data: result }, { status: 201 });
  } catch (err: any) {
    return Response.json({ message: err?.message ?? "Unexpected error." }, { status: 500 });
  }
}
```

### Key API patterns:

1. **Auth via HttpOnly cookies** — token stored in `auth_token` cookie, never exposed to JS
2. **Cookie builder helper** — reusable `buildCookieHeader(token)` function
3. **Consistent error shape** — `{ message: string, errors?: Record<string, string[]> }`
4. **Status codes** — 200 (success), 201 (created), 401 (unauth), 422 (validation), 500 (server)
5. **Direct Neon queries** — no ORM, use `@neondatabase/serverless` tagged template literals

### Auth cookie pattern:

```typescript
function buildCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `auth_token=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${60 * 60 * 24 * 30}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}
```

### Middleware / Route Protection (proxy pattern):

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/auth/login", "/auth/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
```

---

## 3. Neon Database Connection

```typescript
// _lib/db.ts
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);
```

Environment variable in `.env.local`:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

---

## 4. UI Component Patterns (from Pap-matters-frontend)

### DashboardLayout — Sidebar + Top Navbar + Content

The main app shell is a `DashboardLayout` component that wraps all dashboard pages:

- **Fixed sidebar** on the left (w-64) with gradient background
- **Top navbar** with page header, user info, notifications
- **Main content area** with `p-6` padding

### Card Component

Universal card wrapper with hover effects and optional click handler:
```tsx
<Card className="flex flex-col gap-3">
  <span className="text-xs text-slate-500 uppercase">Label</span>
  <span className="text-3xl font-bold text-slate-900">₦ 2,500,000</span>
</Card>
```

### GenericTable Component

A reusable data table built on top of Ant Design's `Table`:
- Supports **static data** or **async fetcher** for server-side pagination
- **Sortable, filterable** columns via `GenericTableColumn` type
- **Custom top content** (filters, search, export buttons)
- **Configurable styles** via `GenericTableStyleConfig`
- **Selection support** for bulk actions

### Export System

Three export formats supported via utility functions:
- **CSV** — `exportMatrixToCsv(filename, matrix, title?)`
- **XLSX** — `exportMatrixToXlsx(filename, matrix, sheetName?)` using `xlsx` package
- **PDF** — `exportMatrixToPdf(filename, matrix, title?)` using `jspdf` + `jspdf-autotable`

All exports work with a 2D string matrix `string[][]` as intermediate format.

### Shared Form Styles

Centralized Tailwind class constants for consistency:
```typescript
export const INPUT_CLASS_DEFAULT = 'w-full rounded-md px-4 py-2.5 text-sm border border-slate-300'
export const BUTTON_PRIMARY = 'w-full rounded-md bg-[#00338D] py-3 text-sm font-semibold text-white'
export const ACTION_BUTTON_PRIMARY = 'inline-flex items-center gap-2 rounded-md bg-[#00338D] px-4 py-2 ...'
```

---

## 5. State Management (Zustand)

```typescript
// _Stores/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
      clearUser: () => set({ user: null, isAuthenticated: false, isLoading: false }),
      setLoading: (val) => set({ isLoading: val }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## 6. Number / Currency Formatting

```typescript
export function abbreviateNumber(value: number): string {
  const abs = Math.abs(value)
  let formatted: string
  if (abs >= 1_000_000) formatted = (abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  else if (abs >= 1_000) formatted = (abs / 1_000).toFixed(0) + 'K'
  else formatted = abs.toFixed(0)
  return value < 0 ? `(${formatted})` : formatted
}

export function formatCurrencyCompact(value: number, currency: string): string {
  return new Intl.NumberFormat(currency === 'NGN' ? 'en-NG' : 'en-US', {
    style: 'currency', currency, notation: 'compact', maximumFractionDigits: 2,
  }).format(value)
}
```

---

## 7. Key Dependencies

| Package | Purpose |
|---|---|
| `@neondatabase/serverless` | Neon PostgreSQL serverless driver |
| `zustand` | Lightweight state management |
| `lucide-react` | Icon library |
| `xlsx` | Excel file parsing and generation |
| `jspdf` + `jspdf-autotable` | PDF export |
| `recharts` or `chart.js` | Charts (spending trends, category breakdown) |
| `react-hook-form` + `zod` | Form handling + validation |
| `bcryptjs` | Password hashing (for API routes) |
| `jose` | JWT token generation/verification |
| `tailwindcss` v4 | Styling |

---

## 8. Budget Categories (from Excel template)

### Spending Categories:
- **Tithe** — ₦228,500
- **Savings** — ₦700,000
- **Meat/Pepper** — ₦80,000
- **Frozen Protein & Others** — ₦127,500
- **Toiletries** — ₦50,000
- **Groceries** — ₦300,000
- **Personal Inside Garments** — ₦49,000
- **Medication** — ₦50,000
- **Self Care** — ₦400,000
- **Office Feeding** — ₦100,000
- **Miscellaneous** — ₦30,000
- **Weekly Veggies & Water** — ₦30,000
- **Fuel** — ₦140,000

**Total Budget:** ₦5,000,000
**Allocated:** ₦2,285,000
**Remaining:** ₦2,715,000

### Shopping Items (tracked separately):
- ankara fabrics, satin wear, teman, hakmek/bed sheets, cashmere,
  floor mat, wall décor, stainless set + sauce pan, bedsheet

### Protein/Groceries Sub-items:
- crocker (30), turkey (30), titus (20), chicken (20),
  gari (9), yam (9), palm oil (10) — **Total: 128 units**
